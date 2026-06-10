import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  variant?: Variant;
  size?: Size;
  icon: ReactNode;
  /** Accessible label — required since the button is icon-only. */
  label: string;
}

/** Square icon-only control. Matches Button heights/states. */
export function IconButton({
  variant = "secondary",
  size = "lg",
  icon,
  label,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  const cls = [
    "rp-iconbtn",
    `rp-iconbtn--${variant}`,
    `rp-iconbtn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={cls} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  );
}
