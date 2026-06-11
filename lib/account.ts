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
  phone: string | null;
}

export async function getAccountStatus(): Promise<AccountStatus> {
  if (!isSupabaseConfigured()) return { signedIn: false, isAnonymous: true, email: null, phone: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return {
    signedIn: !!user,
    isAnonymous: user?.is_anonymous ?? true,
    email: user?.email ?? null,
    phone: user?.phone ?? null,
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

export type OtpResult = { ok: true } | { ok: false; error: string };

/**
 * Promoção por TELEFONE (envia código SMS). Requer um provedor de SMS
 * configurado no Supabase (Auth → Phone) — caso contrário retorna erro claro.
 */
export async function enviarCodigoTelefone(phone: string): Promise<OtpResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase não configurado." };
  if (!/^\+\d{10,15}$/.test(phone)) {
    return { ok: false, error: "Use o formato internacional, ex.: +5513912345678." };
  }
  await ensureSession();
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Confirma o código SMS, concluindo a vinculação do telefone à conta. */
export async function confirmarCodigoTelefone(phone: string, token: string): Promise<OtpResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase não configurado." };
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "phone_change" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
