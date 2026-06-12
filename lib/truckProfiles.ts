/**
 * Acesso a dados de truck_profiles.
 * Centraliza a conversão pt-BR (vírgula decimal) e o vínculo com o Auth.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import type { TruckProfile } from "@/lib/database.types";

/** Converte "4,40" (pt-BR) → 4.40. Aceita também ponto. */
export function parseDecimalBR(input: string): number {
  return Number(String(input).trim().replace(/\./g, "").replace(",", "."));
}

/** Formata número → "4,40" para exibição em pt-BR. */
export function formatDecimalBR(value: number, fractionDigits = 2): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export interface TruckProfileFormInput {
  name: string;
  /** Strings cruas do formulário (podem usar vírgula). */
  height: string;
  weight_pbt: string;
  width: string;
  length: string;
  axles: string;
  is_active: boolean;
}

export type SaveResult =
  | { ok: true; profile: TruckProfile }
  | { ok: false; error: string };

/**
 * Salva (insere) um perfil de caminhão vinculado ao usuário autenticado.
 * Se is_active = true, desativa os outros veículos do usuário antes (respeita
 * o índice único parcial truck_profiles_one_active_per_user).
 */
export async function saveTruckProfile(input: TruckProfileFormInput): Promise<SaveResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase não configurado. Preencha .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const user = await ensureSession();

  if (!user) {
    return { ok: false, error: "Não foi possível iniciar a sessão. Tente novamente." };
  }

  const height = parseDecimalBR(input.height);
  const weight_pbt = parseDecimalBR(input.weight_pbt);
  const width = parseDecimalBR(input.width);
  const length = parseDecimalBR(input.length);
  const axles = parseInt(input.axles, 10);

  if (!input.name.trim()) return { ok: false, error: "Informe um nome para o veículo." };
  if (!Number.isFinite(height) || height <= 0) return { ok: false, error: "Altura inválida." };
  if (!Number.isFinite(weight_pbt) || weight_pbt <= 0) return { ok: false, error: "Peso PBT inválido." };
  if (!Number.isFinite(width) || width <= 0) return { ok: false, error: "Largura inválida." };
  if (!Number.isFinite(length) || length <= 0) return { ok: false, error: "Comprimento inválido." };
  if (!Number.isInteger(axles) || axles <= 0) return { ok: false, error: "Número de eixos inválido." };

  if (input.is_active) {
    await supabase.from("truck_profiles").update({ is_active: false }).eq("user_id", user.id);
  }

  const { data, error } = await supabase
    .from("truck_profiles")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      height,
      weight_pbt,
      width,
      length,
      axles,
      is_active: input.is_active,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: data };
}

/** Retorna o veículo ativo do usuário autenticado (ou null). */
export async function getActiveTruckProfile(): Promise<TruckProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("truck_profiles")
    .select()
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}
