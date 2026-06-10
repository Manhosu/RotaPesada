"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, MapPin } from "lucide-react";
import { StatusBar } from "@/components/app/StatusBar";
import { IconButton, ListRow } from "@/components/ui";
import { searchPlaces, type Place } from "@/lib/geocode";
import type { Destino, ScreenProps } from "@/lib/navigation";

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
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

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
            {loading ? (
              <p className="muted">Buscando…</p>
            ) : results.length ? (
              results.map((p, i) => (
                <ListRow key={`${p.lat},${p.lng},${i}`} icon={<MapPin />} title={p.name} onClick={() => escolher(p)} />
              ))
            ) : q.trim().length >= 3 ? (
              <p className="muted">Nenhum resultado.</p>
            ) : (
              <p className="muted">Digite ao menos 3 letras do destino.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
