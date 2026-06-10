/**
 * Abstract graphite map backdrop with the amber active route. This is a
 * placeholder — swap in Mapbox GL JS (<MapView/>) for production, passing the
 * truck profile to the Mapbox Truck Routing API.
 */
export function MapCanvas({ mode = "overview" }: { mode?: "overview" | "nav" }) {
  return (
    <svg
      className="rp-map"
      viewBox="0 0 400 820"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="400" height="820" fill="#0A0F1A" />
      {/* City blocks */}
      <g fill="#141C2B">
        <rect x="18" y="40" width="120" height="150" rx="4" />
        <rect x="160" y="30" width="100" height="90" rx="4" />
        <rect x="284" y="48" width="110" height="120" rx="4" />
        <rect x="20" y="220" width="90" height="120" rx="4" />
        <rect x="135" y="150" width="130" height="120" rx="4" />
        <rect x="300" y="200" width="90" height="160" rx="4" />
        <rect x="40" y="380" width="150" height="140" rx="4" />
        <rect x="220" y="300" width="80" height="90" rx="4" />
        <rect x="250" y="420" width="140" height="150" rx="4" />
        <rect x="30" y="560" width="120" height="150" rx="4" />
        <rect x="190" y="600" width="180" height="140" rx="4" />
        <rect x="60" y="740" width="120" height="70" rx="4" />
      </g>
      {/* Minor roads */}
      <g stroke="#232E3F" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M0 205 H400" />
        <path d="M0 355 H400" />
        <path d="M0 540 H400" />
        <path d="M125 0 V820" />
        <path d="M275 0 V820" />
      </g>
      {/* Major arterial */}
      <path
        d="M-10 660 C 120 600, 180 460, 210 360 S 300 130, 410 70"
        stroke="#374151"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      {/* Active route */}
      <path
        d="M-10 660 C 120 600, 180 460, 210 360 S 300 130, 410 70"
        stroke="#F59E0B"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        opacity={mode === "nav" ? 1 : 0.95}
      />
      {/* Destination */}
      <g transform="translate(388,64)">
        <circle r="13" fill="#F59E0B" />
        <circle r="5" fill="#161311" />
      </g>
      {/* Current position */}
      <g transform="translate(8,664)">
        <circle r="20" fill="#3B82F6" opacity="0.18" />
        <circle r="11" fill="#3B82F6" stroke="#0A0F1A" strokeWidth="3" />
      </g>
    </svg>
  );
}
