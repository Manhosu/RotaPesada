/**
 * Geocoding (busca de endereços) via Mapbox Geocoding v6.
 *
 * CUSTO: cobra por requisição. O SearchScreen aplica debounce (450ms) e mínimo
 * de 3 caracteres; aqui adicionamos cache por consulta. Resultados limitados ao
 * Brasil, em pt, com viés para a posição atual (proximity).
 */
import type { LatLng } from "@/lib/restrictions";

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

const cache = new Map<string, Place[]>();

interface GeoFeature {
  properties?: { full_address?: string; name?: string };
  geometry?: { coordinates?: [number, number] };
}

export async function searchPlaces(query: string, proximity?: LatLng | null): Promise<Place[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const q = query.trim();
  if (!token || q.length < 3) return [];

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const prox = proximity ? `&proximity=${proximity.lng},${proximity.lat}` : "";
  const url =
    `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(q)}` +
    `&country=br&language=pt&limit=6&access_token=${token}${prox}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    console.error("geocode fetch falhou:", e);
    return [];
  }
  if (!res.ok) {
    console.error("geocode HTTP", res.status);
    return [];
  }

  const data = await res.json();
  const places: Place[] = (data?.features ?? [])
    .map((f: GeoFeature) => ({
      name: f.properties?.full_address || f.properties?.name || "",
      lng: f.geometry?.coordinates?.[0] ?? NaN,
      lat: f.geometry?.coordinates?.[1] ?? NaN,
    }))
    .filter((p: Place) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng));

  cache.set(key, places);
  return places;
}
