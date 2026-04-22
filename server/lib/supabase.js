const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ ADVERTENCIA: SUPABASE_URL o SUPABASE_KEY no configurados. Las funciones de Storage (Logos) estarán deshabilitadas.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('❌ Error inicializando cliente de Supabase:', error);
  }
}

module.exports = supabase;
