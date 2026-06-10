export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visible text label rendered next to the toggle. Omit when the context
   *  (e.g. a ListRow title) already labels the control — pass `ariaLabel` then. */
  label?: string;
  /** Accessible name when there is no visible `label`. */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Large pill toggle (76×42 track). Amber when on. */
export function Switch({ checked, onChange, label, ariaLabel, disabled = false }: SwitchProps) {
  const cls = ["rp-switch", checked ? "rp-switch--on" : "", disabled ? "rp-switch--disabled" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      className={cls}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="rp-switch__track">
        <span className="rp-switch__thumb" />
      </span>
      {label ? <span className="rp-switch__label">{label}</span> : null}
    </button>
  );
}
