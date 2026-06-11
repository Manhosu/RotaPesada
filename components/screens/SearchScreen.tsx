"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, MapPin, Clock } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { IconButton, ListRow } from "@/components/ui";
import { searchPlaces, type Place } from "@/lib/geocode";
import { listTrips } from "@/lib/trips";
import { formatDecimalBR } from "@/lib/truckProfiles";
import type { Trip } from "@/lib/database.types";
import type { Destino, ScreenProps } from "@/lib/navigation";

/** "128 km" se houver distância salva, senão vazio. */
function tripDist(t: Trip): string | undefined {
  return t.distance_m != null ? `${formatDecimalBR(t.distance_m / 1000, 1)} km` : undefined;
}

/** Mantém só a 1ª ocorrência de cada destino (por label). */
function dedupe(trips: Trip[]): Trip[] {
  const seen = new Set<string>();
  return trips.filter((t) => (seen.has(t.dest_label) ? false : (seen.add(t.dest_label), true)));
}

interface SearchScreenProps extends ScreenProps {
  onPick: (destino: Destino) => void;
}

/**
 * Busca de destino com geocoding (Mapbox). Debounce de 450ms + mínimo de 3
 * caracteres para conter custo. Selecionar um resultado define o destino.
 */
export function SearchScreen({ go, onPick }: SearchScreenProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [recentes, setRecentes] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  // Carrega rotas recentes ao abrir a busca.
  useEffect(() => {
    listTrips().then((t) => setRecentes(dedupe(t)));
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const termo = q.trim();
    if (termo.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = window.setTimeout(async () => {
      const places = await searchPlaces(termo);
      setResults(places);
      setLoading(false);
    }, 450);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  const escolher = (p: Place) => {
    onPick({ lat: p.lat, lng: p.lng, label: p.name });
    go("setup");
  };

  return (
    <>
      <StatusBar />
      <div className="scr" style={{ background: "var(--surface-app)" }}>
        <div className="searchscreen">
          <div className="backrow">
            <IconButton
              variant="secondary"
              size="md"
              label="Voltar"
              icon={<ArrowLeft />}
              onClick={() => go("home")}
            />
            <h1>Para onde vamos?</h1>
          </div>

          <div className="rp-input searchscreen__field">
            <span className="rp-input__icon">
              <Search />
            </span>
            <input
              autoFocus
              inputMode="search"
              placeholder="Cidade, rua, terminal…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="searchscreen__results">
            {q.trim().length >= 3 ? (
              loading ? (
                <p className="muted">Buscando…</p>
              ) : results.length ? (
                results.map((p, i) => (
                  <ListRow key={`${p.lat},${p.lng},${i}`} icon={<MapPin />} title={p.name} onClick={() => escolher(p)} />
                ))
              ) : (
                <p className="muted">Nenhum resultado.</p>
              )
            ) : recentes.length ? (
              <>
                <span className="searchscreen__section">Rotas recentes</span>
                {recentes.map((t) => (
                  <ListRow
                    key={t.id}
                    icon={<Clock />}
                    title={t.dest_label}
                    subtitle={tripDist(t)}
                    onClick={() => escolher({ name: t.dest_label, lat: t.dest_lat, lng: t.dest_lng })}
                  />
                ))}
              </>
            ) : (
              <p className="muted">Nenhuma rota salva ainda. Digite o destino para começar.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
