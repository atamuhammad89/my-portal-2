const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl, supabaseServiceKey;
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
    }
  });
} catch (e) {
  console.error('Error reading .env.local:', e);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseServiceKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedFreeTrialPlan() {
  console.log('Seeding Free Trial plan into public.plans table...');

  // Check if free_trial plan already exists
  const { data: existingPlan, error: fetchErr } = await supabase
    .from('plans')
    .select('*')
    .eq('name', 'free_trial')
    .maybeSingle();

  if (fetchErr) {
    console.error('Error fetching plan:', fetchErr);
    process.exit(1);
  }

  const freeTrialPlanData = {
    name: 'free_trial',
    display_name: 'Free Trial',
    monthly_price: 0,
    total_minutes: 50,
    price_per_minute: 0,
    description: '30-Day Free Access with zero credit card required.',
    is_active: true,
    stripe_price_id: null,
    features: [
      '30-Day Free Access',
      'No Credit Card Required',
      '50 AI Call Minutes Included',
      'Full Agent & Dashboard Access'
    ],
    is_featured: false
  };

  if (existingPlan) {
    console.log('Updating existing Free Trial plan:', existingPlan.id);
    const { data: updated, error: updateErr } = await supabase
      .from('plans')
      .update(freeTrialPlanData)
      .eq('id', existingPlan.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating plan:', updateErr);
      process.exit(1);
    }
    console.log('Successfully updated Free Trial plan:', updated);
  } else {
    console.log('Inserting new Free Trial plan...');
    const { data: inserted, error: insertErr } = await supabase
      .from('plans')
      .insert(freeTrialPlanData)
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting plan:', insertErr);
      process.exit(1);
    }
    console.log('Successfully inserted Free Trial plan:', inserted);
  }
}

seedFreeTrialPlan();
