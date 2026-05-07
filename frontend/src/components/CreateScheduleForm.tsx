"use client";

import { useState } from "react";
import { api, ApiError } from "@/services/api";
import type { CreateScheduleResponse } from "@/types";

const WASTE_TYPES = [
  { value: "organico", label: "Orgânico" },
  { value: "reciclavel", label: "Reciclável" },
  { value: "vidro", label: "Vidro" },
  { value: "poda", label: "Poda" },
];

const DAYS = [
  { value: "segunda", label: "Seg" },
  { value: "terca", label: "Ter" },
  { value: "quarta", label: "Qua" },
  { value: "quinta", label: "Qui" },
  { value: "sexta", label: "Sex" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
];

interface Props {
  onCreated: (r: CreateScheduleResponse) => void;
  onCancel: () => void;
}

export default function CreateScheduleForm({ onCreated, onCancel }: Props) {
  const [neighborhood, setNeighborhood] = useState("");
  const [wasteType, setWasteType] = useState("organico");
  const [days, setDays] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: string) {
    setDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!neighborhood.trim()) { setError("Informe o bairro."); return; }
    if (days.length === 0) { setError("Selecione ao menos um dia."); return; }
    if (!timeSlot.trim()) { setError("Informe o horário."); return; }

    setLoading(true);
    setError(null);
    try {
      const r = await api.createSchedule({ neighborhood: neighborhood.trim(), wasteType, days, timeSlot: timeSlot.trim(), notes: notes.trim() || undefined });
      onCreated(r);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(`Já existe agenda de "${wasteType}" para "${neighborhood}".`);
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
          Bairro
        </label>
        <input
          type="text"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Ex: Vila Madalena"
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Tipo de resíduo
        </label>
        <select
          value={wasteType}
          onChange={(e) => setWasteType(e.target.value)}
          className="w-full px-3 py-2 rounded-[6px] text-sm appearance-none"
          style={inputStyle}
        >
          {WASTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
          Dias de coleta
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => {
            const active = days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-primary)" : "var(--color-surface-high)",
                  color: active ? "var(--color-on-primary)" : "var(--color-on-surface-variant)",
                  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-outline-variant)"}`,
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Horário
        </label>
        <input
          type="text"
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
          placeholder="Ex: 07:00–12:00"
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Observações <span style={{ color: "var(--color-outline)" }}>(opcional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Separar papel e plástico em sacolas"
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
          {loading ? "Salvando…" : "Salvar agenda"}
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
