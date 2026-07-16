// Configuração do Supabase

const SUPABASE_URL = 'https://tachagqgxjowcpsxotyw.supabase.co';

const SUPABASE_KEY = 'sb_publishable_19fNju9v4AgImJFV4Oucmg_ByleSoVY';

window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);