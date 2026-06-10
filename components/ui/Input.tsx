import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  hint?: string;
  error?: string;
}

/** Large field with optional leading icon. 76px tall, amber focus glow. */
export function Input({ label, icon, hint, error, className = "", id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const boxCls = ["rp-input", error ? "rp-input--error" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rp-field">
      {label ? (
        <label className="rp-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className={boxCls}>
        {icon ? <span className="rp-input__icon">{icon}</span> : null}
        <input id={inputId} {...rest} />
      </div>
      {error ? (
        <span className="rp-field__hint rp-field__hint--error">{error}</span>
      ) : hint ? (
        <span className="rp-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
