/**
 * Motor de roteamento de CAMINHÃO — OpenRouteService (perfil driving-hgv).
 *
 * Calcula a rota já considerando o gabarito do veículo (altura, largura,
 * comprimento, peso, carga por eixo), evitando vias incompatíveis (viadutos
 * baixos, restrição de peso, ruas estreitas/curtas demais). Recebe também as
 * nossas restrições (avoid_polygons) para contornar pontos de crowdsourcing.
 *
 * O Mapbox NÃO faz roteamento de caminhão — ele segue só para o mapa e a busca.
 * Retorna o mesmo shape `TruckRoute` usado pelo resto do app (mapa, manobras).
 * CUSTO: 1 requisição por rota (cacheada). Sem chave → null (cai no fallback).
 */
import type { LatLng } from "@/lib/restrictions";
import type { TruckRoute, RouteStep, LineString } from "@/lib/mapboxRoute";
import type { TruckProfile } from "@/lib/database.types";

export interface VehicleDims {
  height: number;
  width: number;
  length: number;
  weight: number; // toneladas (PBT)
  axleload: number; // toneladas por eixo (aprox.)
}

const DEFAULTS: VehicleDims = { height: 4.4, width: 2.6, length: 18.5, weight: 48, axleload: 10 };

export function dimsFromProfile(p: TruckProfile | null): VehicleDims {
  if (!p) return DEFAULTS;
  const peso = p.weight_pbt ?? DEFAULTS.weight;
  const axleload = p.axles ? Math.max(1, peso / p.axles) : DEFAULTS.axleload;
  return {
    height: p.height ?? DEFAULTS.height,
    width: p.width ?? DEFAULTS.width,
    length: p.length ?? DEFAULTS.length,
    weight: peso,
    axleload,
  };
}

export function orsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ORS_API_KEY);
}

const cache = new Map<string, TruckRoute>();

interface OrsStep {
  distance?: number;
  instruction?: string;
  way_points?: [number, number];
}
interface OrsFeature {
  geometry?: LineString;
  properties?: {
    summary?: { distance?: number; duration?: number };
    segments?: { steps?: OrsStep[] }[];
  };
}

export async function fetchTruckRouteORS(
  origin: LatLng,
  destination: LatLng,
  dims: VehicleDims,
  avoidPolygons?: unknown | null
): Promise<TruckRoute | null> {
  const key = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!key) return null;

  const ck =
    `${origin.lng.toFixed(3)},${origin.lat.toFixed(3)};` +
    `${destination.lng.toFixed(3)},${destination.lat.toFixed(3)};` +
    `${dims.height},${dims.width},${dims.length},${dims.weight}`;
  const cached = cache.get(ck);
  if (cached) return cached;

  const body: Record<string, unknown> = {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
    instructions: true,
    language: "pt",
    units: "m",
    options: {
      vehicle_type: "hgv",
      profile_params: {
        restrictions: {
          height: dims.height,
          width: dims.width,
          length: dims.length,
          weight: dims.weight,
          axleload: dims.axleload,
        },
      },
      ...(avoidPolygons ? { avoid_polygons: avoidPolygons } : {}),
    },
  };

  let res: Response;
  try {
    res = await fetch("https://api.openrouteservice.org/v2/directions/driving-hgv/geojson", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/geo+json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("ORS fetch falhou:", e);
    return null;
  }
  if (!res.ok) {
    console.error("ORS HTTP", res.status);
    return null;
  }

  const data = await res.json();
  const f: OrsFeature | undefined = data?.features?.[0];
  const coords = f?.geometry?.coordinates;
  if (!coords?.length) return null;

  const steps: RouteStep[] = (f?.properties?.segments ?? []).flatMap((seg) =>
    (seg.steps ?? []).map((s) => {
      const idx = s.way_points?.[0] ?? 0;
      const c = coords[idx] ?? coords[0];
      return {
        instruction: s.instruction ?? "",
        distanceM: s.distance ?? 0,
        location: { lng: c[0], lat: c[1] },
      };
    })
  );

  const route: TruckRoute = {
    geometry: f!.geometry!,
    distanceM: f?.properties?.summary?.distance ?? 0,
    durationS: f?.properties?.summary?.duration ?? 0,
    steps,
  };
  cache.set(ck, route);
  return route;
}
