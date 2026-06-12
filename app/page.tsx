"use client";

import { useState } from "react";
import { PhoneFrame } from "@/components/app/PhoneFrame";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { SearchScreen } from "@/components/screens/SearchScreen";
import { RouteSetupScreen } from "@/components/screens/RouteSetupScreen";
import { NavScreen } from "@/components/screens/NavScreen";
import { VehicleScreen } from "@/components/screens/VehicleScreen";
import { AccountScreen } from "@/components/screens/AccountScreen";
import { ValidationScreen } from "@/components/screens/ValidationScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { DEMO_DESTINO, type Destino, type RoutePrefs, type Screen } from "@/lib/navigation";

/**
 * Rota Pesada — controlador do app.
 * Tela principal → Busca → Roteirização → Navegação ativa · Perfil · Conta.
 */
export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const [prefs, setPrefs] = useState<RoutePrefs>({ pedagio: true, balsa: false });
  const [destination, setDestination] = useState<Destino>(DEMO_DESTINO);
  const go = (s: Screen) => setScreen(s);

  return (
    <PhoneFrame>
      {screen === "home" && <HomeScreen go={go} />}
      {screen === "search" && <SearchScreen go={go} onPick={setDestination} />}
      {screen === "setup" && (
        <RouteSetupScreen go={go} prefs={prefs} setPrefs={setPrefs} destination={destination} />
      )}
      {screen === "nav" && <NavScreen go={go} destination={destination} />}
      {screen === "vehicle" && <VehicleScreen go={go} />}
      {screen === "account" && <AccountScreen go={go} />}
      {screen === "validar" && <ValidationScreen go={go} />}
      {screen === "ajustes" && <SettingsScreen go={go} />}
    </PhoneFrame>
  );
}
