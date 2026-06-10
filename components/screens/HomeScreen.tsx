"use client";

import { useState } from "react";
import { Search, Truck, Pencil, TriangleAlert, CircleCheck } from "lucide-react";
import { MapView } from "@/components/app/MapView";
import { StatusBar } from "@/components/app/StatusBar";
import { Button, ReportButton } from "@/components/ui";
import { reportarPerigo, confirmarRestricao } from "@/lib/restrictions";
import { useTruckNavigation } from "@/lib/hooks/useTruckNavigation";
import { formatDecimalBR } from "@/lib/truckProfiles";
import type { ScreenProps } from "@/lib/navigation";

type Toast = { kind: "ok" | "error"; message: string } | null;

/** Distância amigável: metros até 1 km, depois km com vírgula pt-BR. */
function fmtDist(m: number): string {
  if (m >= 1000) return `${formatDecimalBR(m / 1000, 1)} km`;
  return `${Math.round(m)} m`;
}

/**
 * Tela principal — navegação ao vivo:
 * busca, card do veículo, mapa (Mapbox ou placeholder), botão de pânico e o
 * HUD inferior alimentado pelo loop de GPS (velocidade real + restrição mais
 * próxima), virando alerta âmbar piscante quando há viaduto baixo impeditivo.
 */
export function HomeScreen({ go }: ScreenProps) {
  const [toast, setToast] = useState<Toast>(null);
  const [reporting, setReporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { position, speedKmh, nearby, nearestImpeditive, alturaVeiculo, gpsError } =
    useTruckNavigation();

  const flashToast = (t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 3200);
  };

  const report = async () => {
    if (reporting) return;
    setReporting(true);
    const result = await reportarPerigo("altura");
    setReporting(false);
    flashToast(
      result.ok
        ? { kind: "ok", message: "Perigo reportado. Obrigado!" }
        : { kind: "error", message: result.error }
    );
  };

  const speedTxt = speedKmh != null ? String(Math.round(speedKmh)) : "--";
  const nearestAny = nearby[0] ?? null;
  const nearestPending = nearby.find((r) => r.status === "pendente_validacao") ?? null;

  const confirmar = async () => {
    if (!nearestPending || confirming) return;
    setConfirming(true);
    const res = await confirmarRestricao(nearestPending.id);
    setConfirming(false);
    flashToast(
      res.ok
        ? {
            kind: "ok",
            message: res.verificada
              ? "Perigo verificado pela comunidade. Obrigado!"
              : "Confirmação registrada. Obrigado!",
          }
        : { kind: "error", message: res.error }
    );
  };

  return (
    <>
      <MapView position={position} />
      <StatusBar />
      <div className="scr">
        {/* Fixed top: giant search + vehicle status */}
        <div className="main__top">
          <button className="searchbig" onClick={() => go("search")}>
            <Search />
            <span>Para onde vamos com o caminhão?</span>
          </button>

          <button className="vcard" onClick={() => go("vehicle")}>
            <span className="vcard__ic">
              <Truck />
            </span>
            <span className="vcard__body">
              <span className="vcard__label">Veículo ativo</span>
              <span className="vcard__val">
                Carreta · <em>{formatDecimalBR(alturaVeiculo)} m</em>
              </span>
              <span className="vcard__sub">9 eixos · 48 ton</span>
            </span>
            <span className="vcard__editbtn">
              <Pencil />
            </span>
          </button>
        </div>

        <div className="scr__spacer" />

        {/* Floating one-tap hazard report */}
        {toast ? (
          <div className={`toast${toast.kind === "error" ? " toast--error" : ""}`}>
            {toast.kind === "ok" ? <CircleCheck /> : <TriangleAlert />} {toast.message}
          </div>
        ) : (
          <div
            className={`panicfloat${
              !nearestImpeditive && nearestPending ? " panicfloat--raised" : ""
            }`}
          >
            <ReportButton label={reporting ? "Enviando…" : "Reportar perigo"} onClick={report} />
          </div>
        )}

        {/* Crowdsourcing — confirmar perigo pendente reportado por outro motorista */}
        {!nearestImpeditive && nearestPending && !toast ? (
          <div className="confirmbar">
            <div className="confirmbar__txt">
              <span className="confirmbar__eyebrow">Perigo reportado aqui?</span>
              <span className="confirmbar__title">
                {nearestPending.street_name ?? "Restrição"} · a {fmtDist(nearestPending.distancia_m)}
              </span>
            </div>
            <Button variant="secondary" size="md" onClick={confirmar} disabled={confirming}>
              {confirming ? "…" : "Confirmar"}
            </Button>
          </div>
        ) : null}

        {/* Bottom HUD — real-time */}
        {nearestImpeditive ? (
          /* Estado de ALERTA: viaduto baixo impeditivo à frente */
          <div className="hud hud--alert">
            <div className="hud__dist">A {fmtDist(nearestImpeditive.distancia_m)}</div>
            <div className="hud__main">
              <div className="hud__arrow">
                <TriangleAlert />
              </div>
              <div className="hud__txt">
                <div className="hud__action">
                  Ponte baixa {formatDecimalBR(nearestImpeditive.value ?? alturaVeiculo)} m
                </div>
                <div className="hud__hazard">
                  Reduza a velocidade · sua altura {formatDecimalBR(alturaVeiculo)} m
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Estado CALMO: velocidade real + restrição mais próxima / via livre */
          <div className="hud">
            <div className="hud__dist">{gpsError ? "GPS" : "Velocidade"}</div>
            <div className="hud__main">
              <div className="hud__speed">
                <b>{gpsError ? "--" : speedTxt}</b>
                <small>km/h</small>
              </div>
              <div className="hud__txt">
                {gpsError ? (
                  <>
                    <div className="hud__action">Sem sinal de GPS</div>
                    <div className="hud__info">Rota pausada.</div>
                  </>
                ) : nearestAny ? (
                  <>
                    <div className="hud__action">Restrição próxima</div>
                    <div className="hud__info">
                      {nearestAny.street_name ?? "Restrição"} · a {fmtDist(nearestAny.distancia_m)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hud__action hud__action--clear">Via livre</div>
                    <div className="hud__info">Nenhuma restrição no raio de 500 m</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
