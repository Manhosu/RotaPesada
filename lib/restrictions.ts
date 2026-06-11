/**
 * Restrições — motor de alerta (Fase 3) e crowdsourcing (Fase 4).
 * Encapsula as RPCs PostGIS e a captura de GPS do navegador.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import type { RestricaoProxima, RestrictionType } from "@/lib/database.types";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Lê a posição atual do GPS (Web Geolocation, alta precisão). */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GPS indisponível neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Não foi possível obter o GPS.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  });
}

/**
 * Fase 3 — restrições próximas perigosas para o veículo.
 * @param raioM raio de busca em metros (default 500, como no escopo).
 */
export async function restricoesProximas(
  pos: LatLng,
  alturaVeiculo?: number,
  raioM = 500
): Promise<RestricaoProxima[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase.rpc("restricoes_proximas", {
    lat: pos.lat,
    lng: pos.lng,
    altura_veiculo: alturaVeiculo,
    raio_m: raioM,
  });

  if (error) {
    console.error("restricoes_proximas:", error.message);
    return [];
  }
  return data ?? [];
}

export type ReportResult =
  | { ok: true; restrictionId: number }
  | { ok: false; error: string };

/**
 * Fase 4 — botão de pânico. Captura o GPS atual e registra a restrição
 * (status pendente_validacao) + o report do usuário, atomicamente via RPC.
 */
export async function reportarPerigo(
  tipo: RestrictionType = "altura",
  valor?: number,
  via?: string
): Promise<ReportResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase não configurado." };
  }

  const user = await ensureSession();
  if (!user) return { ok: false, error: "Não foi possível iniciar a sessão." };

  let pos: LatLng;
  try {
    pos = await getCurrentPosition();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const { data, error } = await supabase.rpc("reportar_perigo", {
    lat: pos.lat,
    lng: pos.lng,
    tipo,
    valor,
    via,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, restrictionId: data as number };
}

export type ConfirmResult =
  | { ok: true; confirmacoes: number; verificada: boolean }
  | { ok: false; error: string };

/**
 * Fase 4 (crowdsourcing) — confirma uma restrição pendente reportada por outro
 * motorista. Idempotente por usuário; com 3+ confirmações vira "verificado".
 */
export async function confirmarRestricao(id: number, photoUrl?: string): Promise<ConfirmResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase não configurado." };

  const user = await ensureSession();
  if (!user) return { ok: false, error: "Não foi possível iniciar a sessão." };

  // Com foto: grava o report com a URL (o RPC abaixo não duplica — é idempotente).
  if (photoUrl) {
    const { error: insErr } = await supabase
      .from("user_reports")
      .insert({ user_id: user.id, restriction_id: id, photo_url: photoUrl });
    if (insErr) console.error("anexar foto:", insErr.message);
  }

  const { data, error } = await supabase.rpc("confirmar_restricao", { restriction_id: id });
  if (error) return { ok: false, error: error.message };

  const row = data?.[0];
  return { ok: true, confirmacoes: row?.confirmacoes ?? 0, verificada: row?.verificada ?? false };
}
