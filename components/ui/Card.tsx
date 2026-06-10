import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "raised" | "flush" | "inset";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  children?: ReactNode;
}

/** Solid graphite panel. 1.5px border, soft shadow, lightly rounded. */
export function Card({ variant = "default", children, className = "", ...rest }: CardProps) {
  const cls = [
    "rp-card",
    variant !== "default" ? `rp-card--${variant}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
