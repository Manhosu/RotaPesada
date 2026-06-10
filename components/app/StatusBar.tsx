import { Signal, Wifi, BatteryFull } from "lucide-react";

/** Faux device status bar (time + signal/wifi/battery). Preview chrome. */
export function StatusBar() {
  return (
    <div className="rp-statusbar">
      <span>14:08</span>
      <span className="rp-statusbar__icons">
        <Signal />
        <Wifi />
        <BatteryFull />
      </span>
    </div>
  );
}
