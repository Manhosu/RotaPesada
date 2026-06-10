"use client";

/**
 * useTruckNavigation — loop de rastreamento em tempo real (Fase 2 + 3).
 *
 * watchPosition (alta precisão) → a cada coordenada consulta o motor de
 * proximidade PostGIS (restricoesProximas) → guarda as restrições perigosas e
 * dispara alerta por voz para viadutos baixos impeditivos, sem repetir o áudio
 * por 2 minutos para a mesma restrição.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureSession } from "@/lib/auth";
import { getActiveTruckProfile, formatDecimalBR } from "@/lib/truckProfiles";
import { restricoesProximas, type LatLng } from "@/lib/restrictions";
import { distanciaM } from "@/lib/geo";
import { speak, cancelSpeech } from "@/lib/voice";
import type { RestricaoProxima } from "@/lib/database.types";

const ALTURA_PADRAO = 4.4; // fallback se não houver veículo ativo cadastrado
const RAIO_M = 500; // raio de alerta (escopo do README)
const QUERY_MIN_INTERVALO_MS = 3000; // não consultar mais que 1x a cada 3s
const QUERY_MIN_DESLOCAMENTO_M = 20; // ...ao se mover
const QUERY_REFRESH_MS = 12_000; // ...mas re-consulta mesmo parado a cada 12s
const VOICE_COOLDOWN_MS = 120_000; // 2 min por restrição

export interface TruckNavigationState {
  position: LatLng | null;
  speedKmh: number | null;
  accuracy: number | null;
  nearby: RestricaoProxima[];
  nearestImpeditive: RestricaoProxima | null;
  alturaVeiculo: number;
  gpsError: string | null;
  tracking: boolean;
}

function ehImpeditiva(r: RestricaoProxima, altura: number): boolean {
  return r.type === "altura" && r.value != null && r.value <= altura;
}

export function useTruckNavigation(): TruckNavigationState {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [nearby, setNearby] = useState<RestricaoProxima[]>([]);
  const [alturaVeiculo, setAlturaVeiculo] = useState<number>(ALTURA_PADRAO);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  // Refs lidas dentro do callback do watchPosition (sempre o valor atual).
  const alturaRef = useRef<number>(ALTURA_PADRAO);
  const lastQueryRef = useRef<{ pos: LatLng; t: number } | null>(null);
  const spokenRef = useRef<Map<number, number>>(new Map());
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("GPS indisponível neste dispositivo.");
      return;
    }

    let watchId: number | null = null;
    let cancelled = false;

    const consultar = async (pos: LatLng) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const altura = alturaRef.current;
        const restricoes = await restricoesProximas(pos, altura, RAIO_M);
        if (cancelled) return;
        setNearby(restricoes);

        // Voz: viaduto baixo impeditivo mais próximo, com cooldown por restrição.
        const impeditiva = restricoes.find((r) => ehImpeditiva(r, altura));
        if (impeditiva) {
          const agora = performance.now();
          const ultimo = spokenRef.current.get(impeditiva.id) ?? -Infinity;
          if (agora - ultimo >= VOICE_COOLDOWN_MS) {
            spokenRef.current.set(impeditiva.id, agora);
            const x = formatDecimalBR(impeditiva.value ?? altura);
            speak(
              `Atenção motorista: Viaduto baixo à frente com menos de ${x} metros. Reduza a velocidade.`
            );
          }
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    const onPosition = (geo: GeolocationPosition) => {
      if (cancelled) return;
      const pos: LatLng = { lat: geo.coords.latitude, lng: geo.coords.longitude };
      setPosition(pos);
      setAccuracy(geo.coords.accuracy ?? null);
      setSpeedKmh(
        geo.coords.speed != null && geo.coords.speed >= 0 ? geo.coords.speed * 3.6 : null
      );
      setGpsError(null);

      // Throttle: 1ª leitura; ao mover ≥20m respeitando 3s; ou refresh parado a cada 12s.
      const last = lastQueryRef.current;
      const agora = performance.now();
      const tempoOk = !last || agora - last.t >= QUERY_MIN_INTERVALO_MS;
      const moveuOk = !last || distanciaM(last.pos, pos) >= QUERY_MIN_DESLOCAMENTO_M;
      const refreshOk = !!last && agora - last.t >= QUERY_REFRESH_MS;
      if (!last || (tempoOk && moveuOk) || refreshOk) {
        lastQueryRef.current = { pos, t: agora };
        void consultar(pos);
      }
    };

    // RLS exige sessão autenticada (anônima conta) ANTES da 1ª consulta — senão
    // a query roda como `anon` e o RLS devolve vazio. Por isso aguardamos aqui.
    (async () => {
      await ensureSession();
      const perfil = await getActiveTruckProfile();
      if (cancelled) return;
      if (perfil?.height) {
        alturaRef.current = perfil.height;
        setAlturaVeiculo(perfil.height);
      }
      setTracking(true);
      watchId = navigator.geolocation.watchPosition(onPosition, (err) => {
        if (cancelled) return;
        setGpsError(err.message || "Sem sinal de GPS.");
      }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
    })();

    return () => {
      cancelled = true;
      setTracking(false);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      cancelSpeech();
    };
  }, []);

  const nearestImpeditive = useMemo(() => {
    // `nearby` já vem ordenado por distância pela RPC; pega a 1ª impeditiva.
    return nearby.find((r) => ehImpeditiva(r, alturaVeiculo)) ?? null;
  }, [nearby, alturaVeiculo]);

  return {
    position,
    speedKmh,
    accuracy,
    nearby,
    nearestImpeditive,
    alturaVeiculo,
    gpsError,
    tracking,
  };
}
