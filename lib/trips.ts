/**
 * Histórico de viagens (rotas recentes). Salvo ao iniciar uma rota e listado
 * na busca como "Rotas recentes". Escopado ao usuário via RLS.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import type { Trip } from "@/lib/database.types";

export interface NewTrip {
  label: string;
  lat: number;
  lng: number;
  distanceM?: number;
  durationS?: number;
}

/** Registra uma viagem (best-effort: nunca interrompe a navegação se falhar). */
export async function saveTrip(t: NewTrip): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const user = await ensureSession();
  if (!user) return;

  const { error } = await supabase.from("trips").insert({
    user_id: user.id,
    dest_label: t.label,
    dest_lat: t.lat,
    dest_lng: t.lng,
    distance_m: t.distanceM ?? null,
    duration_s: t.durationS ?? null,
  });
  if (error) console.error("saveTrip:", error.message);
}

/** Últimas viagens do usuário (mais recentes primeiro). */
export async function listTrips(limit = 8): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];
  const user = await ensureSession();
  if (!user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select()
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listTrips:", error.message);
    return [];
  }
  return data ?? [];
}
