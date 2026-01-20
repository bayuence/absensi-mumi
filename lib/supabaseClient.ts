import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createSupabaseClient = () => {
    return createClient(supabaseUrl, supabaseAnonKey)
}

declare global {
    var supabase: ReturnType<typeof createSupabaseClient> | undefined
}

const supabase = globalThis.supabase ?? createSupabaseClient()

if (process.env.NODE_ENV !== 'production') {
    globalThis.supabase = supabase
}

export default supabase;
