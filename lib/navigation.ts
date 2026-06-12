import type { LatLng } from "@/lib/restrictions";

export type Screen = "home" | "search" | "setup" | "nav" | "vehicle" | "account" | "validar" | "ajustes";

export interface RoutePrefs {
  pedagio: boolean;
  balsa: boolean;
}

export interface ScreenProps {
  go: (screen: Screen) => void;
}

export interface Destino extends LatLng {
  label: string;
}

/**
 * Destino-demo (Santos) usado por "Iniciar rota". Geocoding/busca estão
 * desligados de propósito (custo por requisição); a origem é o GPS ao vivo.
 */
export const DEMO_DESTINO: Destino = {
  lat: -23.9407,
  lng: -46.328,
  label: "Ponta da Praia — Santos",
};
