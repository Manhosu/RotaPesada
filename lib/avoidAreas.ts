/**
 * Áreas a evitar no roteamento — nossa camada PostGIS (restrições impeditivas)
 * convertida em GeoJSON MultiPolygon para alimentar o avoid_polygons do ORS.
 * É o que faz a rota DESVIAR dos nossos pontos (crowdsourcing), não só alertar.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import type { LatLng } from "@/lib/restrictions";
import type { Json } from "@/lib/database.types";

/** Buffers das restrições de altura impeditivas no corredor (ou null se nenhuma). */
export async function avoidAreasGeoJSON(
  origin: LatLng,
  destination: LatLng,
  altura: number
): Promise<Json | null> {
  if (!isSupabaseConfigured()) return null;
  await ensureSession();

  const margin = 0.05; // ~5 km de folga ao redor do corredor origem↔destino
  const params = {
    min_lng: Math.min(origin.lng, destination.lng) - margin,
    min_lat: Math.min(origin.lat, destination.lat) - margin,
    max_lng: Math.max(origin.lng, destination.lng) + margin,
    max_lat: Math.max(origin.lat, destination.lat) + margin,
    altura_veiculo: altura,
    buffer_m: 40,
    limite: 30,
  };

  const { data, error } = await supabase.rpc("restricoes_evitar_geojson", params);
  if (error) {
    console.error("avoid areas:", error.message);
    return null;
  }
  return data ?? null;
}
