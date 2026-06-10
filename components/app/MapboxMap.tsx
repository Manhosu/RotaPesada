"use client";

/**
 * Mapa real Mapbox GL JS (tema escuro de alto contraste).
 * Carregado APENAS via dynamic import quando há NEXT_PUBLIC_MAPBOX_TOKEN
 * (ver MapView). Desenha o marcador de posição, o destino e a linha da rota.
 */
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LatLng } from "@/lib/restrictions";
import type { LineString } from "@/lib/mapboxRoute";

const CENTRO_PADRAO: [number, number] = [-46.3322, -23.9608];

interface MapboxMapProps {
  position: LatLng | null;
  route?: LineString | null;
  destination?: LatLng | null;
}

type RouteFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: LineString;
};

const emptyLine: LineString = { type: "LineString", coordinates: [] };

export default function MapboxMap({ position, route, destination }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const styleReadyRef = useRef(false);

  // Inicializa o mapa uma vez.
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: position ? [position.lng, position.lat] : CENTRO_PADRAO,
      zoom: 14,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("load", () => {
      styleReadyRef.current = true;
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      destMarkerRef.current = null;
      styleReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Marcador da posição do caminhão (+ recentra).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;
    const lngLat: [number, number] = [position.lng, position.lat];

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:22px;height:22px;border-radius:50%;background:#3B82F6;" +
        "border:3px solid #0A0F1A;box-shadow:0 0 0 6px rgba(59,130,246,.25)";
      markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    map.easeTo({ center: lngLat, duration: 600 });
  }, [position]);

  // Marcador do destino (âmbar).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;
    const lngLat: [number, number] = [destination.lng, destination.lat];

    if (!destMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#F59E0B;border:3px solid #161311";
      destMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
    } else {
      destMarkerRef.current.setLngLat(lngLat);
    }
  }, [destination]);

  // Linha da rota (âmbar).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const feature: RouteFeature = {
        type: "Feature",
        properties: {},
        geometry: route ?? emptyLine,
      };
      const src = map.getSource("rota") as mapboxgl.GeoJSONSource | undefined;
      if (src) {
        src.setData(feature);
      } else {
        map.addSource("rota", { type: "geojson", data: feature });
        map.addLayer({
          id: "rota-line",
          type: "line",
          source: "rota",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#F59E0B", "line-width": 7 },
        });
      }
    };

    if (styleReadyRef.current && map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [route]);

  return <div ref={containerRef} className="rp-map" aria-label="Mapa" />;
}
