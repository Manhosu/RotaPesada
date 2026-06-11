/**
 * Seleção de rota com desvio de restrições (camada própria do Rota Pesada).
 * 1) Entre as alternativas do Mapbox, escolhe a com MENOS pontes baixas
 *    impeditivas no corredor (RPC PostGIS restricoes_na_rota); empate pela curta.
 * 2) Se TODAS as alternativas passam por restrição, tenta um DESVIO FORÇADO:
 *    insere um waypoint perpendicular ao lado do bloqueio e refaz a rota.
 * Custo Mapbox: alternativas vêm em 1 requisição; o desvio gasta no máx. +2
 * requisições e só quando necessário.
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import { fetchTruckRouteVia, type TruckRoute } from "@/lib/mapboxRoute";
import { bearing, offsetPoint } from "@/lib/geo";
import type { LatLng } from "@/lib/restrictions";
import type { Json, RestricaoNaRota } from "@/lib/database.types";

export interface RotaEscolhida {
  route: TruckRoute;
  blockers: RestricaoNaRota[]; // restrições impeditivas que permanecem na rota
  alternativaUsada: boolean; // escolhemos uma alternativa mais segura que a principal?
  desvioForcado: boolean; // inserimos um waypoint para contornar?
  totalAvaliadas: number;
}

async function blockersDaRota(route: TruckRoute, altura: number): Promise<RestricaoNaRota[]> {
  const { data, error } = await supabase.rpc("restricoes_na_rota", {
    rota_geojson: route.geometry as unknown as Json,
    altura_veiculo: altura,
    buffer_m: 60,
  });
  if (error) {
    console.error("restricoes_na_rota:", error.message);
    return [];
  }
  return data ?? [];
}

export async function escolherRota(
  rotas: TruckRoute[],
  altura: number,
  origin?: LatLng,
  destination?: LatLng
): Promise<RotaEscolhida | null> {
  if (!rotas.length) return null;
  if (!isSupabaseConfigured()) {
    return {
      route: rotas[0],
      blockers: [],
      alternativaUsada: false,
      desvioForcado: false,
      totalAvaliadas: rotas.length,
    };
  }

  await ensureSession();
  const avaliadas = await Promise.all(
    rotas.map(async (r) => ({ r, b: await blockersDaRota(r, altura) }))
  );
  avaliadas.sort((a, b) => a.b.length - b.b.length || a.r.distanceM - b.r.distanceM);

  const best = avaliadas[0];
  const principal = avaliadas.find((x) => x.r === rotas[0]);
  const alternativaUsada =
    best.r !== rotas[0] && best.b.length < (principal?.b.length ?? 0);

  // 2) Desvio forçado: todas as alternativas passam por restrição → waypoint ao lado.
  if (best.b.length > 0 && origin && destination) {
    const blk = best.b[0];
    const rumo = bearing(origin, destination);
    const ponto: LatLng = { lat: blk.latitude, lng: blk.longitude };
    for (const lado of [90, -90]) {
      const wp = offsetPoint(ponto, (rumo + lado + 360) % 360, 600);
      const via = await fetchTruckRouteVia(origin, wp, destination);
      if (!via) continue;
      const vb = await blockersDaRota(via, altura);
      if (vb.length === 0) {
        return {
          route: via,
          blockers: [],
          alternativaUsada: true,
          desvioForcado: true,
          totalAvaliadas: rotas.length,
        };
      }
    }
  }

  return {
    route: best.r,
    blockers: best.b,
    alternativaUsada,
    desvioForcado: false,
    totalAvaliadas: rotas.length,
  };
}
