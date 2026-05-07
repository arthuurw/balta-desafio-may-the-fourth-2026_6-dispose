"use client";

import { useState } from "react";
import { api, ApiError } from "@/services/api";
import type { CollectionPoint, CreateReminderResponse } from "@/types";

const ITEM_TYPES = [
  { value: "pilhas", label: "Pilhas / Baterias" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "oleo", label: "Óleo de cozinha" },
  { value: "vidro", label: "Vidro" },
  { value: "reciclavel", label: "Reciclável" },
];

interface Props {
  sessionId: string;
  points: CollectionPoint[];
  defaultPointId?: number;
  onCreated?: (reminder: CreateReminderResponse) => void;
  onCancel?: () => void;
}

export default function ReminderForm({ sessionId, points, defaultPointId, onCreated, onCancel }: Props) {
  const [itemType, setItemType] = useState(ITEM_TYPES[0].value);
  const [itemDesc, setItemDesc] = useState("");
  const [pointId, setPointId] = useState<number>(defaultPointId ?? points[0]?.id ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.createReminder({ sessionId, itemType, itemDesc: itemDesc || undefined, pointId });
      onCreated?.(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 404 ? "Ponto de coleta não encontrado." : "Erro ao criar lembrete.");
      } else {
        setError("Erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-on-surface-variant)" }}>
          Tipo de item
        </label>
        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
          className="w-full px-3 py-2 rounded-[6px] text-sm appearance-none"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-on-surface-variant)" }}>
          Descrição (opcional)
        </label>
        <input
          type="text"
          value={itemDesc}
          onChange={(e) => setItemDesc(e.target.value)}
          placeholder="ex: bateria do notebook"
          maxLength={200}
          className="w-full px-3 py-2 rounded-[6px] text-sm"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-on-surface-variant)" }}>
          Ponto de coleta
        </label>
        <select
          value={pointId}
          onChange={(e) => setPointId(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-[6px] text-sm appearance-none"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          {points.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[6px] text-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !pointId}
          className="px-4 py-2 rounded-[6px] text-sm font-semibold disabled:opacity-40"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
        >
          {loading ? "Salvando…" : "Criar lembrete"}
        </button>
      </div>
    </form>
  );
}
