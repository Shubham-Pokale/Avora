import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// TODO: Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://evhtauvxtlminxvuwwmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2aHRhdXZ4dGxtaW54dnV3d21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTg0NDgsImV4cCI6MjA2NzYzNDQ0OH0.7YnTAxV8vt0W460pgFI2t-pwoewYWP6wCKVds4VxeB4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 