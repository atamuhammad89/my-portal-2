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
  console.log('Fetching referred clients...');
  const { data: clients, error: clientError } = await supabase
    .from('users')
    .select('id, full_name, email, reseller_id, commission_rate')
    .eq('role', 'owner')
    .not('reseller_id', 'is', null);

  if (clientError) {
    console.error('Error fetching clients:', clientError);
    return;
  }

  console.log(`Found ${clients.length} referred clients.`);

  for (const client of clients) {
    console.log(`Processing client: ${client.full_name} (${client.email})`);
    
    // Fetch reseller's default commission rate
    const { data: reseller, error: resellerError } = await supabase
      .from('users')
      .select('commission_rate')
      .eq('id', client.reseller_id)
      .single();

    if (resellerError) {
      console.error(`Error fetching reseller for client ${client.full_name}:`, resellerError);
      continue;
    }

    const defaultRate = reseller.commission_rate !== null && reseller.commission_rate !== undefined
      ? parseFloat(reseller.commission_rate)
      : 0.00;

    console.log(`Reseller default rate: ${defaultRate}`);

    // If client has no custom rate (currently 0.00 or null), set it to reseller default rate
    if (client.commission_rate === null || parseFloat(client.commission_rate) === 0.00) {
      console.log(`Updating client ${client.full_name} commission_rate to ${defaultRate}...`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ commission_rate: defaultRate })
        .eq('id', client.id);

      if (updateError) {
        console.error(`Error updating client ${client.full_name}:`, updateError);
      } else {
        console.log(`Successfully updated ${client.full_name}.`);
      }
    } else {
      console.log(`Client ${client.full_name} already has custom rate: ${client.commission_rate}. Skipping.`);
    }
  }

  console.log('Finished updating rates.');
}

run();
