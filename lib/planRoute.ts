/**
 * Planejamento de rota — orquestra o roteamento por veículo.
 * 1) Se houver ORS (truck routing): traça a rota já evitando o gabarito do
 *    veículo + nossas restrições (avoid_polygons). É o caminho principal.
 * 2) Sem ORS: fallback para Mapbox driving + seleção/desvio da nossa camada
 *    (comportamento anterior), para o app nunca quebrar.
 * Sempre verifica a rota escolhida contra a nossa camada (badge + segurança).
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import { getActiveTruckProfile } from "@/lib/truckProfiles";
import { fetchTruckRoutes, type TruckRoute } from "@/lib/mapboxRoute";
import { escolherRota, type RotaEscolhida } from "@/lib/routeSelection";
import { fetchTruckRouteORS, dimsFromProfile, orsConfigured } from "@/lib/truckRouting";
import { avoidAreasGeoJSON } from "@/lib/avoidAreas";
import type { LatLng } from "@/lib/restrictions";
import type { Json, RestricaoNaRota } from "@/lib/database.types";

export interface PlanoRota extends RotaEscolhida {
  engine: "ors" | "mapbox";
  alturaVeiculo: number;
}

/** Verifica a rota contra a nossa camada (mesma RPC usada para o desvio). */
async function verificar(route: TruckRoute, altura: number): Promise<RestricaoNaRota[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase.rpc("restricoes_na_rota", {
    rota_geojson: route.geometry as unknown as Json,
    altura_veiculo: altura,
    buffer_m: 60,
  });
  if (error) {
    console.error("verificar rota:", error.message);
    return [];
  }
  return data ?? [];
}

export async function planejarRota(origin: LatLng, destination: LatLng): Promise<PlanoRota | null> {
  await ensureSession();
  const profile = await getActiveTruckProfile();
  const dims = dimsFromProfile(profile);

  // 1) Roteamento de caminhão (ORS) — rota já desviada do gabarito + nossa camada
  if (orsConfigured()) {
    const avoid = await avoidAreasGeoJSON(origin, destination, dims.height);
    const r = await fetchTruckRouteORS(origin, destination, dims, avoid);
    if (r) {
      const blockers = await verificar(r, dims.height);
      return {
        route: r,
        blockers,
        alternativaUsada: false,
        desvioForcado: false,
        totalAvaliadas: 1,
        engine: "ors",
        alturaVeiculo: dims.height,
      };
    }
  }

  // 2) Fallback Mapbox (driving) + seleção/desvio da nossa camada
  const rotas = await fetchTruckRoutes(origin, destination);
  const escolhida = await escolherRota(rotas, dims.height, origin, destination);
  if (!escolhida) return null;
  return { ...escolhida, engine: "mapbox", alturaVeiculo: dims.height };
}
