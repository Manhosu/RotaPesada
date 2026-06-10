/**
 * Seleção de rota com desvio de restrições (camada própria do Rota Pesada).
 * Entre as alternativas do Mapbox, escolhe a que tem MENOS pontes baixas
 * impeditivas no corredor da rota (RPC PostGIS restricoes_na_rota); empate
 * pela mais curta. Tudo Supabase — sem custo Mapbox extra (alternativas vêm
 * numa única requisição Directions).
 */
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth";
import type { TruckRoute } from "@/lib/mapboxRoute";
import type { Json, RestricaoNaRota } from "@/lib/database.types";

export interface RotaEscolhida {
  route: TruckRoute;
  blockers: RestricaoNaRota[]; // restrições impeditivas que permanecem na rota
  alternativaUsada: boolean; // escolhemos uma alternativa mais segura que a principal?
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
  altura: number
): Promise<RotaEscolhida | null> {
  if (!rotas.length) return null;
  if (!isSupabaseConfigured()) {
    return { route: rotas[0], blockers: [], alternativaUsada: false, totalAvaliadas: rotas.length };
  }

  await ensureSession();
  const avaliadas = await Promise.all(
    rotas.map(async (r) => ({ r, b: await blockersDaRota(r, altura) }))
  );

  // menos bloqueios primeiro; empate → mais curta.
  avaliadas.sort((a, b) => a.b.length - b.b.length || a.r.distanceM - b.r.distanceM);

  const escolhida = avaliadas[0];
  const principal = avaliadas.find((x) => x.r === rotas[0]);
  const alternativaUsada =
    escolhida.r !== rotas[0] && escolhida.b.length < (principal?.b.length ?? 0);

  return {
    route: escolhida.r,
    blockers: escolhida.b,
    alternativaUsada,
    totalAvaliadas: rotas.length,
  };
}
