/**
 * Sessão do motorista.
 *
 * MVP: usamos **login anônimo** do Supabase para que o cadastro do caminhão e
 * os reports já persistam sem fricção (o motorista usa o celular no painel — não
 * queremos formulário de e-mail/senha na largada). O usuário anônimo é um
 * `auth.users` real, então o RLS por `auth.uid()` funciona normalmente.
 *
 * Evolução: dá para "promover" essa sessão anônima para uma conta real (telefone
 * ou e-mail) depois, sem perder os dados — ver supabase.auth.updateUser / linkIdentity.
 */
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

/** Garante uma sessão (cria uma anônima se não houver). Retorna o usuário ou null. */
export async function ensureSession(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("Falha ao iniciar sessão anônima:", error.message);
    return null;
  }
  return data.user ?? null;
}
