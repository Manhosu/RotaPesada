import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

/**
 * Primary action control. Large, bold Barlow label, generous padding.
 * Heights: md 64px, lg 76px (default), xl 92px (critical actions).
 */
export function Button({
  variant = "primary",
  size = "lg",
  block = false,
  icon,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = [
    "rp-btn",
    `rp-btn--${variant}`,
    `rp-btn--${size}`,
    block ? "rp-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={cls} {...rest}>
      {icon ? <span className="rp-btn__icon">{icon}</span> : null}
      {children}
    </button>
  );
}
