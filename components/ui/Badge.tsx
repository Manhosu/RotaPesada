import type { ReactNode } from "react";

type Variant = "restriction" | "warning" | "clear" | "route" | "neutral";

export interface BadgeProps {
  variant?: Variant;
  soft?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Short uppercase status chip. Color carries meaning, never decoration. */
export function Badge({ variant = "neutral", soft = false, icon, children }: BadgeProps) {
  const cls = ["rp-badge", `rp-badge--${variant}`, soft ? "rp-badge--soft" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls}>
      {icon}
      {children}
    </span>
  );
}
