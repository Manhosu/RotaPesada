/**
 * Conta do motorista — promover a sessão anônima para uma conta permanente.
 *
 * MVP por **e-mail + senha** (grátis, funciona já). Login por telefone exige um
 * provedor de SMS pago (Twilio etc.) configurado no Supabase — fica para quando
 * houver provedor. A promoção preserva os dados (mesmo auth.users).
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";

export interface AccountStatus {
  signedIn: boolean;
  isAnonymous: boolean;
  email: string | null;
}

export async function getAccountStatus(): Promise<AccountStatus> {
  if (!isSupabaseConfigured()) return { signedIn: false, isAnonymous: true, email: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return {
    signedIn: !!user,
    isAnonymous: user?.is_anonymous ?? true,
    email: user?.email ?? null,
  };
}

export type PromoteResult =
  | { ok: true; confirmEmail: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Adiciona e-mail + senha à conta anônima atual (promoção). */
export async function promoteAccount(email: string, password: string): Promise<PromoteResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase não configurado." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "E-mail inválido." };
  if (password.length < 8) return { ok: false, error: "A senha precisa de ao menos 8 caracteres." };

  await ensureSession();
  const { data, error } = await supabase.auth.updateUser({ email, password });
  if (error) return { ok: false, error: error.message };

  // Se a confirmação de e-mail estiver ativa no projeto, o e-mail só passa a
  // valer após o motorista clicar no link enviado.
  const confirmEmail = !data.user?.email_confirmed_at;
  return { ok: true, confirmEmail };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}
