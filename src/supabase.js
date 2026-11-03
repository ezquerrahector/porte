import { createClient } from '@supabase/supabase-js';

// Llave pública (publishable): es segura en el navegador; la seguridad vive en las políticas RLS de la base.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zsoddhnfnrpoaawelngf.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_CtlEF34XkMjkYVGB9pgoKQ_Y2qJp2ge';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
