"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CircleCheck, CircleDollarSign, Sailboat, Navigation2, TriangleAlert } from "lucide-react";
import { MapCanvas } from "@/components/app/MapCanvas";
import { StatusBar } from "@/components/app/StatusBar";
import {
  Badge,
  Button,
  Card,
  IconButton,
  ListRow,
  SegmentedControl,
  Stat,
  Switch,
} from "@/components/ui";
import { getCurrentPosition } from "@/lib/restrictions";
import { planejarRota, type PlanoRota } from "@/lib/planRoute";
import { formatDecimalBR } from "@/lib/truckProfiles";
import type { Destino, RoutePrefs, ScreenProps } from "@/lib/navigation";

interface RouteSetupScreenProps extends ScreenProps {
  prefs: RoutePrefs;
  setPrefs: (updater: (p: RoutePrefs) => RoutePrefs) => void;
  destination: Destino;
}

function fmtETA(durationS: number): string {
  const d = new Date(Date.now() + durationS * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDur(durationS: number): string {
  const h = Math.floor(durationS / 3600);
  const m = Math.round((durationS % 3600) / 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m} min`;
}

/** Route setup — resumo da rota traçada PARA O VEÍCULO + opções. */
export function RouteSetupScreen({ go, prefs, setPrefs, destination }: RouteSetupScreenProps) {
  const [route, setRoute] = useState("rapida");
  const [plano, setPlano] = useState<PlanoRota | null>(null);
  const [loading, setLoading] = useState(true);
  const set =
    (k: keyof RoutePrefs) =>
    (v: boolean) =>
      setPrefs((p) => ({ ...p, [k]: v }));

  // Calcula a rota do caminhão ao abrir (cacheada → reusada na navegação).
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const pos = await getCurrentPosition();
        const p = await planejarRota(pos, destination);
        if (!cancel) setPlano(p);
      } catch {
        /* sem GPS: segue com resumo indisponível */
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [destination]);

  const distTxt = plano ? formatDecimalBR(plano.route.distanceM / 1000, 1) : "—";
  const etaTxt = plano ? fmtETA(plano.route.durationS) : "--:--";
  const durTxt = plano ? fmtDur(plano.route.durationS) : "—";
  const liberada = plano ? plano.blockers.length === 0 : true;

  return (
    <>
      <MapCanvas mode="overview" />
      <StatusBar />
      <div className="scr">
        <div className="scr__top">
          <div className="backrow">
            <IconButton
              variant="secondary"
              size="md"
              label="Voltar"
              icon={<ArrowLeft />}
              onClick={() => go("home")}
            />
            <h1>{destination.label}</h1>
          </div>
        </div>

        <div className="scr__spacer" />

        <div className="sheet">
          <div className="sheet__handle" />
          <Card variant="inset">
            <div className="summary">
              <Stat label="Distância" value={distTxt} unit="km" tone="amber" />
              <div className="summary__sep" />
              <Stat label="Chegada" value={etaTxt} />
              <div className="summary__sep" />
              <Stat label="Tempo" value={durTxt} />
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {loading ? (
              <Badge variant="neutral">Traçando rota para o seu veículo…</Badge>
            ) : liberada ? (
              <Badge variant="clear" icon={<CircleCheck />}>
                Traçada para o seu veículo
              </Badge>
            ) : (
              <Badge variant="restriction" icon={<TriangleAlert />}>
                {plano?.blockers.length} ponto(s) de atenção na rota
              </Badge>
            )}
          </div>

          <SegmentedControl
            block
            value={route}
            onChange={setRoute}
            options={[
              { value: "rapida", label: "Mais rápida" },
              { value: "economica", label: "Econômica" },
            ]}
          />

          <div className="sheet__list">
            <ListRow
              icon={<CircleDollarSign />}
              title="Evitar pedágio"
              showChevron={false}
              as="div"
              trailing={<Switch checked={prefs.pedagio} onChange={set("pedagio")} ariaLabel="Evitar pedágio" />}
            />
            <ListRow
              icon={<Sailboat />}
              title="Evitar balsa"
              showChevron={false}
              as="div"
              trailing={<Switch checked={prefs.balsa} onChange={set("balsa")} ariaLabel="Evitar balsa" />}
            />
          </div>

          <Button variant="primary" size="xl" block icon={<Navigation2 />} onClick={() => go("nav")}>
            Iniciar rota
          </Button>
        </div>
      </div>
    </>
  );
}
