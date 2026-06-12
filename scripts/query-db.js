const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
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

async function run() {
  // Find user burgo@gmail.com
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'burgo@gmail.com');

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  console.log('Users found:', users);

  if (users.length > 0) {
    const user = users[0];
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subsError) {
      console.error('Error fetching subs:', subsError);
    } else {
      console.log('Subscriptions found for user:', subs);
    }

    const { data: invoices, error: invError } = await supabase
      .from('pending_overage_invoices')
      .select('*')
      .eq('user_id', user.id);

    if (invError) {
      console.error('Error fetching invoices:', invError);
    } else {
      console.log('Pending invoices found for user:', invoices);
    }
  }
}

run();
