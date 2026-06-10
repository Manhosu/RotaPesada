/**
 * Progresso na rota — deriva a próxima manobra (turn-by-turn) a partir da
 * posição atual e dos passos da rota. Aproximação client-side (sem o
 * Navigation SDK pago): escolhe a manobra cujo ponto está mais próximo.
 */
import type { LatLng } from "@/lib/restrictions";
import type { TruckRoute } from "@/lib/mapboxRoute";
import { distanciaM } from "@/lib/geo";

export interface Maneuver {
  instruction: string;
  distanceM: number;
}

export function nextManeuver(route: TruckRoute, pos: LatLng): Maneuver | null {
  let best: { instruction: string; d: number } | null = null;
  for (const step of route.steps) {
    if (!step.instruction) continue;
    const d = distanciaM(pos, step.location);
    if (!best || d < best.d) best = { instruction: step.instruction, d };
  }
  return best ? { instruction: best.instruction, distanceM: best.d } : null;
}
