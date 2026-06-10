"use client";

import { useEffect, useRef, useState } from "react";
import { CornerUpRight, TriangleAlert, Route, X, CircleCheck } from "lucide-react";
import { MapView } from "@/components/app/MapView";
import { StatusBar } from "@/components/app/StatusBar";
import { Alert, Badge, Button, IconButton, Stat } from "@/components/ui";
import { useTruckNavigation } from "@/lib/hooks/useTruckNavigation";
import { fetchTruckRoutes } from "@/lib/mapboxRoute";
import { escolherRota, type RotaEscolhida } from "@/lib/routeSelection";
import { nextManeuver } from "@/lib/routeProgress";
import { formatDecimalBR } from "@/lib/truckProfiles";
import { speak } from "@/lib/voice";
import { DEMO_DESTINO, type Destino, type ScreenProps } from "@/lib/navigation";

interface NavScreenProps extends ScreenProps {
  destination?: Destino;
}

function fmtDist(m: number): string {
  if (m >= 1000) return `${formatDecimalBR(m / 1000, 1)} km`;
  return `${Math.round(m)} m`;
}

function fmtETA(durationS: number): string {
  const d = new Date(Date.now() + durationS * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Navegação ativa (turn-by-turn) — rota real do Mapbox (com alternativas) e
 * SELEÇÃO que desvia de pontes baixas via PostGIS (escolherRota). O loop de GPS
 * (velocidade/proximidade/voz) vem do useTruckNavigation. A Directions é
 * chamada 1× ao entrar e 1× por recálculo manual (nunca no loop de GPS).
 */
export function NavScreen({ go, destination }: NavScreenProps) {
  const { position, speedKmh, nearestImpeditive, alturaVeiculo } = useTruckNavigation();
  const [sel, setSel] = useState<RotaEscolhida | null>(null);
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const destino = destination ?? DEMO_DESTINO;

  const calcular = async (origem: { lat: number; lng: number }) => {
    const rotas = await fetchTruckRoutes(origem, destino); // 1 requisição (alternativas)
    const escolhida = await escolherRota(rotas, alturaVeiculo);
    if (escolhida) setSel(escolhida);
    return escolhida;
  };

  // Calcula a rota UMA vez, assim que houver posição.
  useEffect(() => {
    if (!position || fetchedRef.current) return;
    fetchedRef.current = true;
    void calcular(position);
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  const recalcular = async () => {
    if (!position) return;
    setRecalcMsg("Recalculando para evitar restrição.");
    speak("Recalculando a rota para evitar a restrição.");
    const escolhida = await calcular(position);
    if (escolhida?.alternativaUsada) speak("Nova rota encontrada sem o viaduto baixo.");
    window.setTimeout(() => setRecalcMsg(null), 3500);
  };

  const route = sel?.route ?? null;
  const maneuver = route && position ? nextManeuver(route, position) : null;
  const speedTxt = speedKmh != null ? String(Math.round(speedKmh)) : "--";
  const etaTxt = route ? fmtETA(route.durationS) : "--:--";
  const restanteTxt = route ? formatDecimalBR(route.distanceM / 1000, 1) : "--";

  return (
    <>
      <MapView position={position} route={route?.geometry ?? null} destination={destino} />
      <StatusBar />
      <div className="scr">
        <div className="turn">
          <div className="turn__arrow">
            <CornerUpRight />
          </div>
          <div className="turn__body">
            <div className="turn__dist">{maneuver ? fmtDist(maneuver.distanceM) : "—"}</div>
            <div className="turn__road">
              {recalcMsg ??
                (maneuver
                  ? maneuver.instruction
                  : route
                    ? "Siga em frente"
                    : position
                      ? "Calculando rota…"
                      : "Obtendo GPS…")}
            </div>
          </div>
        </div>

        {/* Status da rota (desvio de restrições) */}
        {sel ? (
          <div className="navbadge">
            {sel.blockers.length === 0 ? (
              <Badge variant="clear" icon={<CircleCheck />}>
                {sel.alternativaUsada ? "Rota alternativa liberada" : "Rota liberada"}
              </Badge>
            ) : (
              <Badge variant="restriction" icon={<TriangleAlert />}>
                {sel.blockers.length} restrição{sel.blockers.length > 1 ? "es" : ""} na rota
              </Badge>
            )}
          </div>
        ) : null}

        {nearestImpeditive ? (
          <div className="navalert">
            <Alert
              variant="restriction"
              solid
              title={`Ponte baixa — ${formatDecimalBR(nearestImpeditive.value ?? alturaVeiculo)} m`}
              icon={<TriangleAlert />}
              action={
                <Button variant="secondary" size="md" icon={<Route />} onClick={recalcular}>
                  Recalcular rota
                </Button>
              }
            >
              Sua carreta tem {formatDecimalBR(alturaVeiculo)} m. Restrição em{" "}
              {fmtDist(nearestImpeditive.distancia_m)}.
            </Alert>
          </div>
        ) : null}

        <div className="scr__spacer" />

        <div className="navbottom">
          <div className="speedo">
            <div>
              <b>{speedTxt}</b>
              <br />
              <small>km/h</small>
            </div>
          </div>
          <div className="navbottom__stats">
            <Stat label="Chegada" value={etaTxt} />
            <Stat label="Restante" value={restanteTxt} unit="km" tone="amber" />
          </div>
          <IconButton variant="danger" size="lg" label="Encerrar" icon={<X />} onClick={() => go("home")} />
        </div>
      </div>
    </>
  );
}
