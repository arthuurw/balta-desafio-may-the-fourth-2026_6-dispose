"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import { api, ApiError } from "@/services/api";
import type { CollectionPoint } from "@/types";

const ACCEPTED_TYPES = [
  { value: "pilhas", label: "Pilhas / Baterias" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "oleo", label: "Óleo de cozinha" },
];

interface Props {
  currentLat?: number;
  currentLng?: number;
  onCreated: (p: CollectionPoint) => void;
  onCancel: () => void;
}

export default function CreateCollectionPointForm({ currentLat, currentLng, onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(currentLat?.toFixed(6) ?? "");
  const [lng, setLng] = useState(currentLng?.toFixed(6) ?? "");
  const [acceptedTypes, setAcceptedTypes] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: string) {
    setAcceptedTypes((t) => t.includes(type) ? t.filter((x) => x !== type) : [...t, type]);
  }

  function useGps() {
    if (currentLat !== undefined && currentLng !== undefined) {
      setLat(currentLat.toFixed(6));
      setLng(currentLng.toFixed(6));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe o nome."); return; }
    if (!address.trim()) { setError("Informe o endereço."); return; }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) { setError("Latitude inválida (−90 a 90)."); return; }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) { setError("Longitude inválida (−180 a 180)."); return; }
    if (acceptedTypes.length === 0) { setError("Selecione ao menos um tipo aceito."); return; }
    if (!openingHours.trim()) { setError("Informe o horário de funcionamento."); return; }

    setLoading(true);
    setError(null);
    try {
      const r = await api.createCollectionPoint({
        name: name.trim(),
        address: address.trim(),
        latitude: latNum,
        longitude: lngNum,
        acceptedTypes,
        openingHours: openingHours.trim(),
      });
      onCreated(r);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Erro ${err.status}: ${err.message}`);
      } else {
        setError("Erro ao salvar. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "var(--color-surface-high)",
    color: "var(--color-on-surface)",
    border: "1px solid var(--color-outline-variant)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Nome
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ecoponto Vila Madalena"
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Endereço
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ex: Rua Harmonia, 300 — Vila Madalena"
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={inputStyle}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-23.5505"
            className="w-full px-3 py-2 rounded-[6px] text-sm"
            style={inputStyle}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-46.6333"
            className="w-full px-3 py-2 rounded-[6px] text-sm"
            style={inputStyle}
          />
        </div>
        {currentLat !== undefined && (
          <button
            type="button"
            onClick={useGps}
            title="Usar minha localização atual"
            className="self-end p-2 rounded-[6px] shrink-0"
            style={{ backgroundColor: "var(--color-surface-high)", color: "var(--color-primary)", border: "1px solid var(--color-outline-variant)" }}
          >
            <Navigation size={16} />
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
          Tipos aceitos
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ACCEPTED_TYPES.map((t) => {
            const active = acceptedTypes.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleType(t.value)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-tertiary)" : "var(--color-surface-high)",
                  color: active ? "var(--color-on-tertiary)" : "var(--color-on-surface-variant)",
                  border: `1px solid ${active ? "var(--color-tertiary)" : "var(--color-outline-variant)"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Horário de funcionamento
        </label>
        <input
          type="text"
          value={openingHours}
          onChange={(e) => setOpeningHours(e.target.value)}
          placeholder="Ex: Seg–Sex 08:00–18:00"
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-[6px] text-sm font-medium disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
        >
          {loading ? "Salvando…" : "Salvar ponto"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-[6px] text-sm"
          style={{ backgroundColor: "var(--color-surface-high)", color: "var(--color-on-surface-variant)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
