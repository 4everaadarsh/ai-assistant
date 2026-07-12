require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
    console.log(`[Supabase Config] Client initialized for ${supabaseUrl}`);
} else {
    console.warn('[Supabase Config] SUPABASE_URL and SUPABASE_KEY not set. Using in-memory fallback database.');
}

module.exports = {
    supabase,
    supabaseUrl,
    supabaseKey,
    isConfigured: Boolean(supabaseUrl && supabaseKey)
};
