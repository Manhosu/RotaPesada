"use client";

import { useState, type FormEvent } from "react";
import { Ruler, Weight, CircleDot, Truck, Check, TriangleAlert, CircleCheck, MoveHorizontal, Maximize2 } from "lucide-react";
import { Alert, Button, Input, ListRow, Switch } from "@/components/ui";
import { saveTruckProfile, type TruckProfileFormInput } from "@/lib/truckProfiles";
import type { TruckProfile } from "@/lib/database.types";

interface TruckProfileFormProps {
  /** Valores iniciais (ex.: editar o veículo ativo). */
  initial?: Partial<TruckProfileFormInput>;
  /** Chamado após salvar com sucesso. */
  onSaved?: (profile: TruckProfile) => void;
}

type Feedback = { kind: "ok" | "error"; message: string } | null;

/**
 * Formulário de cadastro do caminhão (truck_profiles).
 * Acessibilidade: campos grandes (76px), rótulos claros, alto contraste,
 * teclado numérico, casas decimais em pt-BR (vírgula). Persiste no Supabase
 * vinculado ao usuário autenticado.
 */
export function TruckProfileForm({ initial, onSaved }: TruckProfileFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [height, setHeight] = useState(initial?.height ?? "4,40");
  const [weight, setWeight] = useState(initial?.weight_pbt ?? "48");
  const [width, setWidth] = useState(initial?.width ?? "2,60");
  const [length, setLength] = useState(initial?.length ?? "18,5");
  const [axles, setAxles] = useState(initial?.axles ?? "9");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const result = await saveTruckProfile({
      name,
      height,
      weight_pbt: weight,
      width,
      length,
      axles,
      is_active: active,
    });

    setSaving(false);
    if (result.ok) {
      setFeedback({ kind: "ok", message: "Veículo salvo. Suas rotas serão traçadas para este gabarito." });
      onSaved?.(result.profile);
    } else {
      setFeedback({ kind: "error", message: result.error });
    }
  }

  return (
    <form className="vform__form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nome do veículo"
        icon={<Truck />}
        placeholder="Ex.: Minha Carreta Bitrem"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
      />

      <div className="vform__grid">
        <Input
          label="Altura (m)"
          icon={<Ruler />}
          inputMode="decimal"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          hint="Ex.: 4,40"
        />
        <Input
          label="Peso PBT (ton)"
          icon={<Weight />}
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          hint="Peso bruto total"
        />
      </div>

      <div className="vform__grid">
        <Input
          label="Largura (m)"
          icon={<MoveHorizontal />}
          inputMode="decimal"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          hint="Ex.: 2,60"
        />
        <Input
          label="Comprimento (m)"
          icon={<Maximize2 />}
          inputMode="decimal"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          hint="Ex.: 18,5"
        />
      </div>

      <Input
        label="Eixos"
        icon={<CircleDot />}
        inputMode="numeric"
        value={axles}
        onChange={(e) => setAxles(e.target.value)}
        hint="Usado no cálculo de pedágio"
      />

      <ListRow
        icon={<Truck />}
        title="Veículo ativo"
        subtitle="Usar este caminhão na navegação"
        showChevron={false}
        as="div"
        trailing={<Switch checked={active} onChange={setActive} ariaLabel="Definir como veículo ativo" />}
      />

      {feedback ? (
        <Alert
          variant={feedback.kind === "ok" ? "clear" : "restriction"}
          title={feedback.kind === "ok" ? "Tudo certo" : "Não foi possível salvar"}
          icon={feedback.kind === "ok" ? <CircleCheck /> : <TriangleAlert />}
        >
          {feedback.message}
        </Alert>
      ) : null}

      <Button type="submit" variant="primary" size="xl" block icon={<Check />} disabled={saving}>
        {saving ? "Salvando…" : "Salvar veículo"}
      </Button>
    </form>
  );
}
