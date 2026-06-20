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
  console.log('Resetting referred client commission rates to NULL for dynamic inheritance...');
  const { data, error } = await supabase
    .from('users')
    .update({ commission_rate: null })
    .eq('role', 'owner')
    .not('reseller_id', 'is', null)
    .select('id, full_name, email, reseller_id');

  if (error) {
    console.error('Error updating client rates:', error);
    return;
  }

  console.log(`Successfully reset rates to NULL for ${data.length} assigned clients:`);
  data.forEach(u => {
    console.log(` - ${u.full_name} (${u.email})`);
  });
  console.log('All assigned clients will now dynamically inherit their reseller default rates!');
}

run();
