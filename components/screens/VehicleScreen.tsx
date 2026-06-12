"use client";

import { ArrowLeft, UserCog, ShieldCheck, Type } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { IconButton, ListRow } from "@/components/ui";
import { TruckProfileForm } from "@/components/TruckProfileForm";
import type { ScreenProps } from "@/lib/navigation";

/**
 * Perfil do veículo (Fase 1) — cadastro do caminhão persistido no Supabase.
 * Hospeda o TruckProfileForm (Altura, Peso PBT, Eixos, nome, ativo).
 */
export function VehicleScreen({ go }: ScreenProps) {
  return (
    <>
      <StatusBar />
      <div className="scr" style={{ background: "var(--surface-app)" }}>
        <div className="vform">
          <div className="backrow">
            <IconButton
              variant="secondary"
              size="md"
              label="Voltar"
              icon={<ArrowLeft />}
              onClick={() => go("home")}
            />
            <h1 className="vform__title">Perfil do veículo</h1>
          </div>
          <p className="vform__sub">
            Usado para evitar pontes, viadutos e restrições de peso na sua rota.
          </p>

          <TruckProfileForm onSaved={() => go("home")} />

          <ListRow
            icon={<Type />}
            title="Ajustes"
            subtitle="Tamanho da fonte e acessibilidade"
            onClick={() => go("ajustes")}
          />
          <ListRow
            icon={<ShieldCheck />}
            title="Validar perigos"
            subtitle="Confirmar restrições reportadas perto de você"
            onClick={() => go("validar")}
          />
          <ListRow
            icon={<UserCog />}
            title="Minha conta"
            subtitle="Salvar dados e acessar de outro aparelho"
            onClick={() => go("account")}
          />
        </div>
      </div>
    </>
  );
}
