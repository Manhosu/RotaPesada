"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { Card, IconButton } from "@/components/ui";
import { FONT_PRESETS, getFontScale, setFontScale } from "@/lib/settings";
import type { ScreenProps } from "@/lib/navigation";

/**
 * Ajustes — tamanho da fonte (acessibilidade). Aplica a escolha ao vivo em todo
 * o app (reflui todas as telas) e persiste.
 */
export function SettingsScreen({ go }: ScreenProps) {
  const [scale, setScale] = useState<number>(() => getFontScale());

  const escolher = (value: number) => {
    setScale(value);
    setFontScale(value); // aplica + persiste (live, sem reload)
  };

  return (
    <>
      <StatusBar />
      <div className="scr" style={{ background: "var(--surface-app)" }}>
        <div className="vform">
          <div className="backrow">
            <IconButton variant="secondary" size="md" label="Voltar" icon={<ArrowLeft />} onClick={() => go("home")} />
            <h1 className="vform__title">Ajustes</h1>
          </div>
          <p className="vform__sub">Tamanho do texto. Vale para o app inteiro — escolha o que ler melhor no painel.</p>

          <Card variant="inset">
            <p className="settings__preview">
              Em 800 m, vire à direita. Viaduto baixo 4,20 m — sua altura 4,40 m.
            </p>
          </Card>

          <div className="settings__opts">
            {FONT_PRESETS.map((p) => {
              const on = Math.abs(p.value - scale) < 0.001;
              return (
                <button
                  key={p.key}
                  type="button"
                  className={`fontopt${on ? " fontopt--on" : ""}`}
                  aria-pressed={on}
                  onClick={() => escolher(p.value)}
                >
                  <span className="fontopt__sample" style={{ fontSize: `${Math.round(16 * p.value)}px` }}>
                    Aa
                  </span>
                  <span className="fontopt__body">
                    <span className="fontopt__label">{p.label}</span>
                    <span className="fontopt__pct">{Math.round(p.value * 100)}%</span>
                  </span>
                  {on ? (
                    <span className="fontopt__check">
                      <Check />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
