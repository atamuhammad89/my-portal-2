import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createNumberOrder } from '@/lib/telnyx-api';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ message: 'sessionId is required' }, { status: 400 });
    }

    if (!stripe) {
      return NextResponse.json({ message: 'Stripe is not configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ message: 'Payment not completed on Stripe' }, { status: 400 });
    }

    const metadata = session.metadata || {};
    const userId = metadata.user_id || payload?.sub;
    const phoneNumber = metadata.phone_number;
    const itemCost = parseFloat(metadata.cost || '2.50');
    const customerReference = metadata.customer_reference || 'STRIPE_PORTAL';
    let regulatoryRequirements = {};
    try {
      if (metadata.regulatory_requirements) {
        regulatoryRequirements = JSON.parse(metadata.regulatory_requirements);
      }
    } catch (e) {}

    if (!phoneNumber || !userId) {
      return NextResponse.json({ message: 'Invalid session metadata' }, { status: 400 });
    }

    // Place order via Telnyx API
    const order = await createNumberOrder(phoneNumber, customerReference, regulatoryRequirements);

    const supabase = createServerSupabaseClient();

    await supabase.from('phone_orders').insert({
      user_id: userId,
      order_id: order.id,
      status: order.status,
      phone_number: phoneNumber,
      customer_reference: customerReference,
      requirements_met: order.requirementsMet,
      sub_order_ids: order.subOrderIds || [],
    });

    await supabase.from('phone_numbers').upsert(
      {
        user_id: userId,
        phone_number: phoneNumber,
        status: order.status === 'success' ? 'active' : 'pending',
        country_code: phoneNumber.startsWith('+44') ? 'GB' : phoneNumber.startsWith('+49') ? 'DE' : 'US',
        type: 'local',
        capabilities: { voice: true, sms: true },
      },
      { onConflict: 'phone_number' }
    );

    const { data: userRecord } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await supabase.from('invoices').insert({
      user_id: userId,
      invoice_number: `INV-TEL-${Math.floor(100000 + Math.random() * 900000)}`,
      plan_name: `Phone Number (${phoneNumber})`,
      type: 'phone_number',
      amount: itemCost,
      status: 'paid',
      billing_name: userRecord?.full_name || 'Customer',
      billing_email: userRecord?.email || '',
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      created_at: now.toISOString(),
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('[API /telnyx/checkout/confirm Error]', error);
    return NextResponse.json({ message: error.message || 'Payment confirmation failed' }, { status: 500 });
  }
}
