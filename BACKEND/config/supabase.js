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
        },
        global: {
            fetch: (url, options) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);
                const signal = options?.signal
                    ? AbortSignal.any([options.signal, controller.signal])
                    : controller.signal;
                return fetch(url, { ...options, signal }).finally(() => clearTimeout(timeoutId));
            }
        }
    });
    console.log(`[Supabase Config] Production database client connected: ${supabaseUrl}`);
} else {
    console.warn('[Supabase Config] SUPABASE_URL and SUPABASE_KEY not set. Using in-memory fallback database.');
}

module.exports = {
    supabase,
    supabaseUrl,
    supabaseKey,
    isConfigured: Boolean(supabaseUrl && supabaseKey)
};
