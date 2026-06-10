"use client";

/**
 * MapView — camada de mapa do app.
 * - Com NEXT_PUBLIC_MAPBOX_TOKEN: carrega o Mapbox real (dynamic import, ssr:false).
 * - Sem token: mantém o placeholder grafite (MapCanvas) + aviso gigante, e o
 *   loop de GPS/voz segue rodando (vive na HomeScreen/NavScreen, independente do mapa).
 */
import dynamic from "next/dynamic";
import { MapCanvas } from "@/components/app/MapCanvas";
import type { LatLng } from "@/lib/restrictions";
import type { LineString } from "@/lib/mapboxRoute";

const MapboxMap = dynamic(() => import("@/components/app/MapboxMap"), {
  ssr: false,
  loading: () => <MapCanvas mode="nav" />,
});

// Token válido = começa com "pk." e não é o placeholder do .env.example.
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const hasToken = token.startsWith("pk.") && !token.includes("sua-chave") && token.length > 20;

interface MapViewProps {
  position: LatLng | null;
  route?: LineString | null;
  destination?: LatLng | null;
}

export function MapView({ position, route, destination }: MapViewProps) {
  if (hasToken) {
    return <MapboxMap position={position} route={route} destination={destination} />;
  }

  return (
    <>
      <MapCanvas mode="nav" />
      <div className="mapview__waiting" role="status">
        <span className="mapview__waiting-eyebrow">Mapa</span>
        <span className="mapview__waiting-title">
          Aguardando Token do Mapbox nas variáveis de ambiente…
        </span>
        <span className="mapview__waiting-sub">
          Defina <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> em <code>.env.local</code>. O
          rastreamento por GPS e os alertas continuam funcionando.
        </span>
      </div>
    </>
  );
}
