"use client";

import { useState } from "react";
import { ArrowLeft, CircleCheck, CircleDollarSign, Sailboat, Navigation2 } from "lucide-react";
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
import type { Destino, RoutePrefs, ScreenProps } from "@/lib/navigation";

interface RouteSetupScreenProps extends ScreenProps {
  prefs: RoutePrefs;
  setPrefs: (updater: (p: RoutePrefs) => RoutePrefs) => void;
  destination: Destino;
}

/** Route setup — summary, clearance badge, route type, avoidance switches. */
export function RouteSetupScreen({ go, prefs, setPrefs, destination }: RouteSetupScreenProps) {
  const [route, setRoute] = useState("rapida");
  const set =
    (k: keyof RoutePrefs) =>
    (v: boolean) =>
      setPrefs((p) => ({ ...p, [k]: v }));

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
              <Stat label="Distância" value="128" unit="km" tone="amber" />
              <div className="summary__sep" />
              <Stat label="Chegada" value="14:32" />
              <div className="summary__sep" />
              <Stat label="Tempo" value="1:54" />
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge variant="clear" icon={<CircleCheck />}>
              Liberada p/ seu veículo
            </Badge>
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
