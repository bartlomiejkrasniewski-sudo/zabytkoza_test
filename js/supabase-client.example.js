// Skopiuj ten plik jako supabase-client.js i uzupełnij poniższe wartości:
// Settings → API → Project URL  i  Settings → API → anon public key
const SUPABASE_URL  = 'https://TWOJ_PROJEKT.supabase.co';
const SUPABASE_ANON_KEY = 'TWOJ_ANON_KEY';

const { createClient } = supabase;

window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
