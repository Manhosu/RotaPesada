/**
 * Rotas via Mapbox Directions API.
 *
 * CUSTO: chamada cara — só deve ser invocada ao INICIAR a rota e em recálculos
 * manuais, NUNCA no loop de GPS. Pedimos `alternatives=true` (até 3 rotas numa
 * ÚNICA requisição) para poder escolher a que evita restrições. Cache em
 * memória por (origem~3casas, destino) evita chamadas duplicadas na sessão.
 *
 * Perfil "driving" padrão (truck routing real é enterprise). O diferencial do
 * Rota Pesada é a camada própria de restrições (PostGIS) sobreposta à rota.
 */
import type { LatLng } from "@/lib/restrictions";

/** GeoJSON LineString mínimo (evita dependência de @types/geojson). */
export interface LineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RouteStep {
  instruction: string;
  distanceM: number;
  location: LatLng; // ponto da manobra
}

export interface TruckRoute {
  geometry: LineString;
  distanceM: number;
  durationS: number;
  steps: RouteStep[];
}

const cache = new Map<string, TruckRoute[]>();
const cacheKey = (o: LatLng, d: LatLng) =>
  `${o.lng.toFixed(3)},${o.lat.toFixed(3)};${d.lng.toFixed(3)},${d.lat.toFixed(3)}`;

interface MapboxStep {
  distance?: number;
  maneuver?: { instruction?: string; location?: [number, number] };
}
interface MapboxRoute {
  geometry?: LineString;
  distance?: number;
  duration?: number;
  legs?: { steps?: MapboxStep[] }[];
}

function parseRoute(r: MapboxRoute): TruckRoute | null {
  if (!r?.geometry) return null;
  const steps: RouteStep[] = (r.legs?.[0]?.steps ?? []).map((s) => ({
    instruction: s.maneuver?.instruction ?? "",
    distanceM: s.distance ?? 0,
    location: { lng: s.maneuver?.location?.[0] ?? 0, lat: s.maneuver?.location?.[1] ?? 0 },
  }));
  return { geometry: r.geometry, distanceM: r.distance ?? 0, durationS: r.duration ?? 0, steps };
}

/** Busca rotas (com alternativas) entre origem e destino. 1 requisição Mapbox. */
export async function fetchTruckRoutes(origin: LatLng, destination: LatLng): Promise<TruckRoute[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return [];

  const key = cacheKey(origin, destination);
  const cached = cache.get(key);
  if (cached) return cached;

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?alternatives=true&geometries=geojson&overview=full&steps=true&language=pt&access_token=${token}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error("Directions fetch falhou:", e);
    return [];
  }
  if (!res.ok) {
    console.error("Directions HTTP", res.status);
    return [];
  }

  const data = await res.json();
  const rotas: TruckRoute[] = (data?.routes ?? [])
    .map((r: MapboxRoute) => parseRoute(r))
    .filter((r: TruckRoute | null): r is TruckRoute => r !== null);

  if (rotas.length) cache.set(key, rotas);
  return rotas;
}

/** Conveniência: a rota principal (primeira alternativa). */
export async function fetchTruckRoute(
  origin: LatLng,
  destination: LatLng
): Promise<TruckRoute | null> {
  const rotas = await fetchTruckRoutes(origin, destination);
  return rotas[0] ?? null;
}

/**
 * Rota passando por um waypoint intermediário (desvio forçado). 1 requisição.
 * Usada quando todas as alternativas diretas passam por uma restrição.
 */
export async function fetchTruckRouteVia(
  origin: LatLng,
  waypoint: LatLng,
  destination: LatLng
): Promise<TruckRoute | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const coords =
    `${origin.lng},${origin.lat};${waypoint.lng},${waypoint.lat};` +
    `${destination.lng},${destination.lat}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?alternatives=false&geometries=geojson&overview=full&steps=true&language=pt&access_token=${token}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error("Directions(via) fetch falhou:", e);
    return null;
  }
  if (!res.ok) {
    console.error("Directions(via) HTTP", res.status);
    return null;
  }
  const data = await res.json();
  return parseRoute(data?.routes?.[0]);
}
