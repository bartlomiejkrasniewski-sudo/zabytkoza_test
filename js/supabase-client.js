// Uzupełnij poniższe wartości danymi z projektu Supabase:
// Settings → API → Project URL  i  Settings → API → anon public key
const SUPABASE_URL  = 'https://exmycmbekpyysxgjtpnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LFc5ugqeEutL3fVLphtzLA_h4fBQTnr';

const { createClient } = supabase;

window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);