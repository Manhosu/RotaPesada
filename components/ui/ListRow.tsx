import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface ListRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  /** "button" (tappable) or "div" (static row, e.g. holding a Switch). */
  as?: "button" | "div";
  onClick?: () => void;
}

/** Big tappable list row (≥76px). Leading icon, title/subtitle, trailing slot. */
export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  showChevron = true,
  as = "button",
  onClick,
}: ListRowProps) {
  const content = (
    <>
      {icon ? <span className="rp-listrow__icon">{icon}</span> : null}
      <span className="rp-listrow__body">
        <span className="rp-listrow__title">{title}</span>
        {subtitle ? <span className="rp-listrow__sub">{subtitle}</span> : null}
      </span>
      {trailing}
      {showChevron && !trailing ? (
        <span className="rp-listrow__chev">
          <ChevronRight />
        </span>
      ) : null}
    </>
  );

  if (as === "div") {
    return <div className="rp-listrow rp-listrow--static">{content}</div>;
  }
  return (
    <button type="button" className="rp-listrow" onClick={onClick}>
      {content}
    </button>
  );
}
