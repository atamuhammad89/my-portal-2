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
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
    }
  });
} catch (e) {
  console.error(e);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log('Testing RPC functions...');
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  console.log('exec_sql result:', { data, error });
  
  const { data: data2, error: error2 } = await supabase.rpc('run_sql', { sql: 'SELECT 1' });
  console.log('run_sql result:', { data: data2, error: error2 });
}

test();
