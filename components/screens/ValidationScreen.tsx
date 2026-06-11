"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, TriangleAlert, CircleCheck, Camera } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { Alert, Button, Card, IconButton } from "@/components/ui";
import { getCurrentPosition, confirmarRestricao } from "@/lib/restrictions";
import { listPendentesProximas, uploadFotoReport } from "@/lib/validation";
import { formatDecimalBR } from "@/lib/truckProfiles";
import type { RestricaoProxima } from "@/lib/database.types";
import type { ScreenProps } from "@/lib/navigation";

function fmtDist(m: number): string {
  if (m >= 1000) return `${formatDecimalBR(m / 1000, 1)} km`;
  return `${Math.round(m)} m`;
}

function labelTipo(r: RestricaoProxima): string {
  if (r.type === "altura") return r.value != null ? `Ponte baixa ${formatDecimalBR(r.value)} m` : "Altura (a confirmar)";
  if (r.type === "peso") return r.value != null ? `Peso máx. ${formatDecimalBR(r.value, 0)} t` : "Restrição de peso";
  if (r.type === "largura") return "Largura";
  return "Rodízio";
}

/** Um perigo pendente, com anexo de foto opcional e confirmação. */
function ValidacaoCard({ item, onDone }: { item: RestricaoProxima; onDone: (id: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirmar = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    let url: string | undefined;
    if (file) url = (await uploadFotoReport(file, item.id)) ?? undefined;
    const res = await confirmarRestricao(item.id, url);
    setBusy(false);
    if (res.ok) onDone(item.id);
    else setErr(res.error);
  };

  return (
    <Card>
      <div className="valcard">
        <div className="valcard__head">
          <span className="valcard__ic">
            <TriangleAlert />
          </span>
          <div className="valcard__info">
            <span className="valcard__title">{item.street_name ?? "Restrição reportada"}</span>
            <span className="valcard__meta">
              {labelTipo(item)} · a {fmtDist(item.distancia_m)}
            </span>
          </div>
        </div>

        {err ? (
          <Alert variant="restriction" title="Não foi possível" icon={<TriangleAlert />}>
            {err}
          </Alert>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button variant="ghost" size="md" block icon={<Camera />} onClick={() => inputRef.current?.click()}>
          {file ? "Foto anexada — trocar" : "Anexar foto da placa"}
        </Button>
        <Button variant="primary" size="lg" block icon={<CircleCheck />} disabled={busy} onClick={confirmar}>
          {busy ? "Enviando…" : "Confirmar perigo"}
        </Button>
      </div>
    </Card>
  );
}

/** Tela de validação: lista perigos pendentes próximos para confirmar. */
export function ValidationScreen({ go }: ScreenProps) {
  const [items, setItems] = useState<RestricaoProxima[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pos = await getCurrentPosition();
        setItems(await listPendentesProximas(pos));
      } catch (e) {
        setErro((e as Error).message);
        setItems([]);
      }
    })();
  }, []);

  return (
    <>
      <StatusBar />
      <div className="scr" style={{ background: "var(--surface-app)" }}>
        <div className="vform">
          <div className="backrow">
            <IconButton variant="secondary" size="md" label="Voltar" icon={<ArrowLeft />} onClick={() => go("home")} />
            <h1 className="vform__title">Validar perigos</h1>
          </div>
          <p className="vform__sub">
            Perigos reportados perto de você aguardando validação. Confirme os reais — anexe a foto
            da placa quando der.
          </p>

          {erro ? (
            <Alert variant="warning" title="GPS indisponível" icon={<TriangleAlert />}>
              {erro}
            </Alert>
          ) : items === null ? (
            <p className="muted">Procurando perigos próximos…</p>
          ) : items.length === 0 ? (
            <p className="muted">Nenhum perigo pendente por perto no momento.</p>
          ) : (
            items.map((it) => (
              <ValidacaoCard key={it.id} item={it} onDone={(id) => setItems((cur) => (cur ?? []).filter((x) => x.id !== id))} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
