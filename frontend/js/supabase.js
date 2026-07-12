import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = 'https://jnecunnzcbrgollkauhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZWN1bm56Y2JyZ29sbGthdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTQ4ODUsImV4cCI6MjA5Njc3MDg4NX0.Z1OicgFLbwprdw8JiWqZWQixgdPaQGtlOqfCbRoIcCs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

