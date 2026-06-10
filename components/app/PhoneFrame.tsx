import type { ReactNode } from "react";

/**
 * Device shell. On phones it fills the viewport (the real in-cab target);
 * on wide screens it renders as a centered device frame for preview.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rp-stage">
      <div className="rp-phone">
        <div className="rp-phone__screen">{children}</div>
      </div>
    </div>
  );
}
