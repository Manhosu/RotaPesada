import type { ReactNode } from "react";

type Variant = "restriction" | "warning" | "clear" | "route";

export interface AlertProps {
  variant?: Variant;
  /** Solid fill — for full-bleed, safety-critical driving alerts. */
  solid?: boolean;
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * The signature hazard banner. State the hazard, the limit, and the driver's
 * own measurement so the risk is unambiguous (e.g. "Ponte baixa — 4,20 m").
 */
export function Alert({ variant = "restriction", solid = false, title, icon, action, children }: AlertProps) {
  const cls = ["rp-alert", `rp-alert--${variant}`, solid ? "rp-alert--solid" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="alert">
      {icon ? <span className="rp-alert__icon">{icon}</span> : null}
      <div className="rp-alert__body">
        <span className="rp-alert__title">{title}</span>
        {children ? <span className="rp-alert__text">{children}</span> : null}
        {action ? <div className="rp-alert__action">{action}</div> : null}
      </div>
    </div>
  );
}
