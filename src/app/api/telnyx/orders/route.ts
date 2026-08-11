import { NextRequest, NextResponse } from 'next/server';
import { createNumberOrder, getOrders, isTelnyxConfigured } from '@/lib/telnyx-api';
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
      const userOrders = dbOrders.map((o: any) => ({
        id: o.order_id,
        status: o.status,
        createdAt: o.created_at,
        phoneNumbers: [o.phone_number],
        requirementsMet: o.requirements_met,
        subOrderIds: o.sub_order_ids || [],
        customerReference: o.customer_reference,
        userId: o.user_id,
        userEmail: o.users?.email || 'System / Unknown',
        userName: o.users?.full_name || 'System / Unknown',
      }));
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
    const { phoneNumber, customerReference, userId: bodyUserId, cost } = body;

    if (!phoneNumber) {
      return NextResponse.json({ message: 'phoneNumber is required' }, { status: 400 });
    }

    // Place order via Telnyx API (falls back to mock internally if not configured)
    const order = await createNumberOrder(phoneNumber, customerReference);

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

        const itemCost = typeof cost === 'number' && cost > 0 ? cost : 2.50;
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() + 30);

        await supabase.from('invoices').insert({
          user_id: finalUserId,
          invoice_number: `INV-TEL-${Math.floor(100000 + Math.random() * 900000)}`,
          plan_name: `Phone Number (${phoneNumber})`,
          type: 'phone_number',
          amount: itemCost,
          status: 'pending',
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
