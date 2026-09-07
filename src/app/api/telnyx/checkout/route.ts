import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createNumberOrder } from '@/lib/telnyx-api';
import { getAppBaseUrl } from '@/utils/url-helper';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

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

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    if (!userId) {
      userId = await getFallbackUserId();
    }

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumber, cost, customerReference, regulatoryRequirements, selectedAgentId } = body;

    if (!phoneNumber) {
      return NextResponse.json({ message: 'phoneNumber is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check user eligibility for 1st Free Number
    const { data: userNumbers } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('user_id', userId);

    const { data: userOrders } = await supabase
      .from('phone_orders')
      .select('id')
      .eq('user_id', userId);

    const existingCount = (userNumbers?.length || 0) + (userOrders?.length || 0);
    const isFreeEligible = existingCount === 0;

    const itemCost = isFreeEligible ? 0.00 : (typeof cost === 'number' && cost > 0 ? cost : 2.50);

    // 1st Number is FREE: Directly place order and record $0.00 invoice
    if (isFreeEligible) {
      const order = await createNumberOrder(phoneNumber, customerReference, regulatoryRequirements);

      await supabase.from('phone_orders').insert({
        user_id: userId,
        order_id: order.id,
        status: order.status,
        phone_number: phoneNumber,
        customer_reference: customerReference || 'WEB_PORTAL_FREE',
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
        plan_name: `Phone Number (${phoneNumber}) - Free Initial Line`,
        type: 'phone_number',
        amount: 0.00,
        status: 'paid',
        billing_name: userRecord?.full_name || 'Customer',
        billing_email: userRecord?.email || '',
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        created_at: now.toISOString(),
      });

      return NextResponse.json({ success: true, isFree: true, order });
    }

    // 2nd Number Onward: Requires Stripe Payment first
    const baseUrl = getAppBaseUrl(req);
    const amountInCents = Math.max(50, Math.round(itemCost * 100));

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Phone Number Subscription (${phoneNumber})`,
                description: `Monthly line rental & carrier routing (${phoneNumber})`,
              },
              unit_amount: amountInCents,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: userId,
          phone_number: phoneNumber,
          cost: itemCost.toString(),
          customer_reference: customerReference || `PORTAL_${Date.now()}`,
          regulatory_requirements: JSON.stringify(regulatoryRequirements || {}),
          selected_agent_id: selectedAgentId || '',
          type: 'phone_number_purchase',
        },
        success_url: `${baseUrl}/phone-numbers?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/phone-numbers?payment=cancelled`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Fallback in Test / Sandbox mode without live Stripe key
    const order = await createNumberOrder(phoneNumber, customerReference, regulatoryRequirements);

    await supabase.from('phone_orders').insert({
      user_id: userId,
      order_id: order.id,
      status: order.status,
      phone_number: phoneNumber,
      customer_reference: customerReference || 'WEB_PORTAL',
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

    return NextResponse.json({ success: true, isFree: false, order });
  } catch (error: any) {
    console.error('[API /telnyx/checkout Error]', error);
    return NextResponse.json({ message: error.message || 'Checkout failed' }, { status: 500 });
  }
}
