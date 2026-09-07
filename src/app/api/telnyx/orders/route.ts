import { NextRequest, NextResponse } from 'next/server';
import { createNumberOrder, getOrders, cancelOrder, isTelnyxConfigured } from '@/lib/telnyx-api';
import { verifyRequestJwt, requireRole } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (users && users.length > 0) {
      return users[0].id;
    }
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    const isAdmin = payload && requireRole(payload, ['super_admin', 'admin', 'operations']);

    // Fallback to mock orders in Sandbox/Development mode
    if (!isTelnyxConfigured()) {
      const mockOrdersList = await getOrders();
      // Map mock orders to include user details for admin display
      const mappedMocks = mockOrdersList.map((o: any) => ({
        ...o,
        userEmail: o.customerReference === 'REF-UK-BRANCH' ? 'customer@example.com' : 'admin@callautomate.ai',
        userName: o.customerReference === 'REF-UK-BRANCH' ? 'Jane Doe' : 'Administrator',
      }));
      return NextResponse.json(mappedMocks);
    }

    const supabase = createServerSupabaseClient();
    let query = supabase.from('phone_orders').select(`
      *,
      users:user_id (id, email, full_name)
    `);

    // If not an admin, only show the user's own orders
    if (!isAdmin) {
      let userId = payload?.sub || null;
      if (!userId) {
        userId = await getFallbackUserId();
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }
    }

    const { data: dbOrders, error } = await query.order('created_at', { ascending: false });

    if (!error && dbOrders) {
      // Live Telnyx order status & compliance sync
      let liveTelnyxMap = new Map<string, any>();
      try {
        const telnyxOrders = await getOrders();
        (telnyxOrders || []).forEach((to: any) => {
          if (to.id) liveTelnyxMap.set(to.id, to);
          if (to.phoneNumbers && Array.isArray(to.phoneNumbers)) {
            to.phoneNumbers.forEach((pn: string) => liveTelnyxMap.set(pn, to));
          }
        });
      } catch (tErr) {
        console.warn('[Orders GET Telnyx Sync Warning]', tErr);
      }

      const userOrders = await Promise.all(
        dbOrders.map(async (o: any) => {
          let liveStatus = o.status;
          let liveRequirementsMet = o.requirements_met;
          let rejectionReason = o.rejection_reason || null;
          let deadline = o.deadline || null;

          const match = liveTelnyxMap.get(o.order_id) || liveTelnyxMap.get(o.phone_number);
          if (match) {
            liveStatus = match.status;
            liveRequirementsMet = match.requirementsMet;
          }

          // Query live sub-order or requirement group status if pending or processing
          if (o.sub_order_ids && o.sub_order_ids.length > 0 && liveStatus !== 'cancelled' && liveStatus !== 'success') {
            try {
              const { getComplianceRequirements } = await import('@/lib/telnyx-api');
              const subId = o.sub_order_ids[0];
              const reqs = await getComplianceRequirements(subId);
              
              // Check for rejected fields
              const rejectedReq = reqs.find((r: any) => 
                r.status === 'declined' || r.status === 'rejected' || r.status === 'requirement-info-exception'
              );

              if (rejectedReq) {
                liveStatus = 'rejected';
                rejectionReason = rejectedReq.description || 'Regulatory document rejected by carrier.';
              }
            } catch (sErr) {}
          }

          // If status or compliance changed from DB, update DB
          if (liveStatus !== o.status || liveRequirementsMet !== o.requirements_met) {
            try {
              await supabase
                .from('phone_orders')
                .update({
                  status: liveStatus,
                  requirements_met: liveRequirementsMet,
                  rejection_reason: rejectionReason,
                  updated_at: new Date().toISOString(),
                })
                .eq('order_id', o.order_id);

              if ((liveStatus === 'success' || liveStatus === 'completed') && o.phone_number) {
                await supabase.from('phone_numbers').upsert(
                  {
                    user_id: o.user_id,
                    phone_number: o.phone_number,
                    status: 'active',
                    country_code: o.phone_number.startsWith('+44') ? 'GB' : o.phone_number.startsWith('+49') ? 'DE' : 'US',
                    type: 'local',
                    capabilities: { voice: true, sms: true },
                  },
                  { onConflict: 'phone_number' }
                );
              } else if ((liveStatus === 'cancelled' || liveStatus === 'failed' || liveStatus === 'deleted') && o.phone_number) {
                await supabase.from('phone_numbers').update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString(),
                }).eq('phone_number', o.phone_number);
              }
            } catch (uErr) {
              console.warn('[Orders DB Sync Update Warning]', uErr);
            }
          }

          return {
            id: o.order_id,
            status: liveStatus,
            createdAt: o.created_at,
            phoneNumbers: [o.phone_number],
            requirementsMet: liveRequirementsMet,
            subOrderIds: o.sub_order_ids || [],
            customerReference: o.customer_reference,
            userId: o.user_id,
            userEmail: o.users?.email || 'CallAutomate',
            userName: o.users?.full_name || 'CallAutomate',
            rejectionReason,
            deadline,
          };
        })
      );
      return NextResponse.json(userOrders);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[API /telnyx/orders GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    const isAdmin = payload && requireRole(payload, ['super_admin', 'admin', 'operations']);
    
    let userId = payload?.sub || null;
    if (!userId) {
      userId = await getFallbackUserId();
    }

    const body = await req.json();
    const { phoneNumber, customerReference, userId: bodyUserId, cost, regulatoryRequirements } = body;

    if (!phoneNumber) {
      return NextResponse.json({ message: 'phoneNumber is required' }, { status: 400 });
    }

    // Place order via Telnyx API (with inline regulatory compliance submission if provided)
    const order = await createNumberOrder(phoneNumber, customerReference, regulatoryRequirements);

    // Assign to specified user if admin, fallback to current session user
    const finalUserId = (isAdmin && bodyUserId) ? bodyUserId : userId;

    if (finalUserId) {
      try {
        const supabase = createServerSupabaseClient();
        await supabase.from('phone_orders').insert({
          user_id: finalUserId,
          order_id: order.id,
          status: order.status,
          phone_number: phoneNumber,
          customer_reference: customerReference || 'WEB_PORTAL',
          requirements_met: order.requirementsMet,
          sub_order_ids: order.subOrderIds || [],
        });

        // Also record in phone_numbers table for immediate user display
        await supabase.from('phone_numbers').upsert(
          {
            user_id: finalUserId,
            phone_number: phoneNumber,
            status: order.status === 'success' ? 'active' : 'pending',
            country_code: phoneNumber.startsWith('+44') ? 'GB' : phoneNumber.startsWith('+49') ? 'DE' : 'US',
            type: 'local',
            capabilities: { voice: true, sms: true },
          },
          { onConflict: 'phone_number' }
        );

        // Create an Invoice entry for Billing section display
        const { data: userRecord } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', finalUserId)
          .single();

        const isFreeLine = body.isFree || cost === 0;
        const itemCost = isFreeLine ? 0.00 : (typeof cost === 'number' && cost > 0 ? cost : 2.50);
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await supabase.from('invoices').insert({
          user_id: finalUserId,
          invoice_number: `INV-TEL-${Math.floor(100000 + Math.random() * 900000)}`,
          plan_name: `Phone Number (${phoneNumber})${isFreeLine ? ' - Free Initial Line' : ''}`,
          type: 'phone_number',
          amount: itemCost,
          status: 'paid',
          billing_name: userRecord?.full_name || 'Customer',
          billing_email: userRecord?.email || '',
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
          created_at: now.toISOString(),
        });
      } catch (e) {
        console.warn('[Orders & Invoice DB Insert Warning]', e);
      }
    }

    return NextResponse.json({ ...order, userId: finalUserId });
  } catch (error: any) {
    console.error('[API /telnyx/orders POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    const isAdmin = payload && requireRole(payload, ['super_admin', 'admin', 'operations']);
    
    let userId = payload?.sub || null;
    if (!userId) {
      userId = await getFallbackUserId();
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id') || searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    let query = supabase.from('phone_orders').select('*').eq('order_id', orderId);
    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }
    const { data: dbOrder } = await query.maybeSingle();

    try {
      await cancelOrder(orderId);
    } catch (tErr: any) {
      console.warn('[Telnyx Cancel Order Warning]', tErr);
    }

    if (dbOrder) {
      await supabase
        .from('phone_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('order_id', orderId);

      if (dbOrder.phone_number) {
        await supabase
          .from('phone_numbers')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('phone_number', dbOrder.phone_number);
      }
    }

    return NextResponse.json({ success: true, message: 'Order cancelled successfully', orderId });
  } catch (error: any) {
    console.error('[API /telnyx/orders DELETE Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
