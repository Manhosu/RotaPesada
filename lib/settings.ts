/**
 * Ajustes de acessibilidade — tamanho da fonte.
 *
 * A escala multiplica o font-size base do app (--font-scale no :root). Como
 * todo o dimensionamento de fonte está em rem, mudar a escala reflui TODAS as
 * telas proporcionalmente. Persistido em localStorage e aplicado sem flash por
 * um script inline no layout (ver app/layout.tsx).
 */
export interface FontPreset {
  key: string;
  label: string;
  value: number;
}

export const FONT_PRESETS: FontPreset[] = [
  { key: "padrao", label: "Padrão", value: 1 },
  { key: "grande", label: "Grande", value: 1.18 },
  { key: "maior", label: "Maior", value: 1.38 },
  { key: "maximo", label: "Máximo", value: 1.6 },
];

export const FONT_SCALE_KEY = "rp-font-scale";
const DEFAULT_SCALE = 1;

export function getFontScale(): number {
  if (typeof window === "undefined") return DEFAULT_SCALE;
  const raw = window.localStorage.getItem(FONT_SCALE_KEY);
  const n = raw ? Number(raw) : DEFAULT_SCALE;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SCALE;
}

/** Aplica a escala imediatamente na raiz do documento. */
export function applyFontScale(value: number): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-scale", String(value));
}

/** Persiste + aplica a escala escolhida. */
export function setFontScale(value: number): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FONT_SCALE_KEY, String(value));
  }
  applyFontScale(value);
}
