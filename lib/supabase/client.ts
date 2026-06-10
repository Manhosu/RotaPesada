/**
 * Cliente Supabase reutilizável (browser).
 *
 * Lê as credenciais públicas das variáveis de ambiente do Next.js
 * (ver .env.local.example). É um singleton — importe `supabase` nos
 * componentes client.
 *
 * Use `isSupabaseConfigured()` para degradar a UI graciosamente enquanto
 * as chaves ainda não foram preenchidas (ex.: durante o desenvolvimento
 * da casca do frontend, antes de conectar o backend).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Quando as env vars não estão definidas, ainda criamos um client com
 * placeholders para evitar crash de import — qualquer chamada de rede
 * falhará de forma controlada e deve ser protegida por isSupabaseConfigured().
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "public-anon-key-placeholder"
);
