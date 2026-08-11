import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/telnyx-api';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const payload = await verifyRequestJwt(req);
    const order = await getOrder(orderId);

    if (payload?.sub) {
      try {
        const supabase = createServerSupabaseClient();
        
        // Resolve original user_id this order belongs to
        const { data: dbOrder } = await supabase
          .from('phone_orders')
          .select('user_id')
          .eq('order_id', orderId)
          .maybeSingle();

        const targetUserId = dbOrder?.user_id || payload.sub;

        await supabase
          .from('phone_orders')
          .update({
            status: order.status,
            requirements_met: order.requirementsMet,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (order.status === 'success' && order.phoneNumbers.length > 0) {
          for (const num of order.phoneNumbers) {
            await supabase.from('phone_numbers').upsert(
              {
                user_id: targetUserId,
                phone_number: num,
                country_code: num.startsWith('+44') ? 'GB' : num.startsWith('+49') ? 'DE' : 'US',
                status: 'active',
                capabilities: { voice: true, sms: true },
              },
              { onConflict: 'phone_number' }
            );
          }
        }
      } catch (e) {
        console.warn('[Order Status DB Sync Warning]', e);
      }
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('[API /telnyx/order-status Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}
