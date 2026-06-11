/**
 * Validação de restrições pendentes (crowdsourcing) — lista os perigos
 * reportados perto do motorista e faz upload de foto da placa para o Storage.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import { restricoesProximas, type LatLng } from "@/lib/restrictions";
import type { RestricaoProxima } from "@/lib/database.types";

/** Restrições pendentes de validação num raio maior (default 2 km). */
export async function listPendentesProximas(pos: LatLng, raioM = 2000): Promise<RestricaoProxima[]> {
  const todas = await restricoesProximas(pos, undefined, raioM);
  return todas.filter((r) => r.status === "pendente_validacao");
}

/** Faz upload da foto para o bucket público "reports" e retorna a URL. */
export async function uploadFotoReport(file: File, restrictionId: number): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await ensureSession();
  if (!user) return null;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${restrictionId}/${user.id}-${Date.now()}.${ext || "jpg"}`;

  const { error } = await supabase.storage
    .from("reports")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) {
    console.error("upload foto:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("reports").getPublicUrl(path);
  return data.publicUrl;
}
