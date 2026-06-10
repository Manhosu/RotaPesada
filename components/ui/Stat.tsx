type Tone = "default" | "amber" | "red" | "green";

export interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  tone?: Tone;
}

/** Big tabular numeral with an uppercase label. For ETA, distance, speed. */
export function Stat({ label, value, unit, tone = "default" }: StatProps) {
  const cls = ["rp-stat", tone !== "default" ? `rp-stat--${tone}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      <span className="rp-stat__label">{label}</span>
      <span className="rp-stat__value">
        {value}
        {unit ? <span className="rp-stat__unit">{unit}</span> : null}
      </span>
    </div>
  );
}
