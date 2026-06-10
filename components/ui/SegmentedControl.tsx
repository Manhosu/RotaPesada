export interface SegmentOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  block?: boolean;
}

/** Inline option switcher. Active segment is solid amber. */
export function SegmentedControl({ value, onChange, options, block = false }: SegmentedControlProps) {
  const cls = ["rp-seg", block ? "rp-seg--block" : ""].filter(Boolean).join(" ");

  return (
    <div className={cls} role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`rp-seg__opt${active ? " rp-seg__opt--active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
