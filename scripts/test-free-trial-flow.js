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

async function testFreeTrialFlow() {
  console.log('--- Testing 30-Day Free Trial Flow & Eligibility ---');

  // 1. Check free_trial plan in DB
  const { data: freeTrialPlan, error: planErr } = await supabase
    .from('plans')
    .select('*')
    .eq('name', 'free_trial')
    .maybeSingle();

  if (planErr || !freeTrialPlan) {
    console.error('FAILED: free_trial plan not found in DB', planErr);
    process.exit(1);
  }
  console.log('SUCCESS: Free Trial plan in DB:', {
    id: freeTrialPlan.id,
    name: freeTrialPlan.name,
    monthly_price: freeTrialPlan.monthly_price,
    total_minutes: freeTrialPlan.total_minutes
  });

  // 2. Create a test user with no subscriptions
  const testEmail = `test_trial_user_${Date.now()}@example.com`;
  const { data: testUser, error: createErr } = await supabase
    .from('users')
    .insert({
      email: testEmail,
      full_name: 'Test Trial User',
      password_hash: 'dummy_hash',
      role: 'member',
      is_active: true
    })
    .select('id, email')
    .single();

  if (createErr || !testUser) {
    console.error('FAILED: Could not create test user', createErr);
    process.exit(1);
  }
  console.log('SUCCESS: Created test user:', testUser.id, testUser.email);

  // 3. Verify zero subscriptions for new user
  const { data: initialSubs } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', testUser.id);

  console.log('Initial subscriptions count for new user:', initialSubs?.length || 0);

  // 4. Simulate starting a free trial (first attempt)
  const startedAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  const { data: trialSub, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      user_id: testUser.id,
      plan_id: freeTrialPlan.id,
      status: 'active',
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      minutes_used: 0,
      monthly_price_snapshot: 0,
      price_per_minute_snapshot: 0,
      total_minutes_snapshot: freeTrialPlan.total_minutes ?? 50
    })
    .select('*')
    .single();

  if (subErr || !trialSub) {
    console.error('FAILED: Could not create trial subscription', subErr);
    process.exit(1);
  }
  console.log('SUCCESS: 30-Day Free Trial subscription created:', {
    id: trialSub.id,
    status: trialSub.status,
    started_at: trialSub.started_at,
    ends_at: trialSub.ends_at
  });

  // 5. Test eligibility check on user who now HAS a subscription
  const { data: subsAfterTrial } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', testUser.id);

  const isEligibleAgain = (subsAfterTrial?.length || 0) === 0;
  console.log('Is user eligible for another free trial?', isEligibleAgain ? 'YES' : 'NO (Correct!)');

  if (!isEligibleAgain) {
    console.log('SUCCESS: User with existing subscription is correctly marked as INELIGIBLE for free trial!');
  } else {
    console.error('FAILED: User was incorrectly marked eligible');
  }

  // Cleanup test user
  await supabase.from('subscriptions').delete().eq('user_id', testUser.id);
  await supabase.from('users').delete().eq('id', testUser.id);
  console.log('Cleaned up test data.');
}

testFreeTrialFlow();
