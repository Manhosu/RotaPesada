import { TriangleAlert } from "lucide-react";

type Size = "md" | "lg";

export interface ReportButtonProps {
  label?: string;
  size?: Size;
  onClick?: () => void;
}

/**
 * Floating round panic / hazard-report button. One tap crowdsources a hazard
 * (e.g. a low bridge) at the driver's current GPS position. Red, pulsing ring.
 */
export function ReportButton({ label = "Reportar perigo", size = "lg", onClick }: ReportButtonProps) {
  const cls = ["rp-report", size === "md" ? "rp-report--md" : ""].filter(Boolean).join(" ");

  return (
    <button type="button" className={cls} onClick={onClick} aria-label={label}>
      <span className="rp-report__btn">
        <TriangleAlert />
      </span>
      {label ? <span className="rp-report__label">{label}</span> : null}
    </button>
  );
}
