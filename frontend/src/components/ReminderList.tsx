"use client";

import { CheckCircle, Circle, MapPin } from "lucide-react";
import type { Reminder } from "@/types";

const WASTE_COLORS: Record<string, string> = {
  pilhas: "#f4a942",
  eletronicos: "#f4a942",
  medicamentos: "#f4a942",
  oleo: "#f4a942",
  vidro: "#9b8ddb",
  reciclavel: "#5bb8d4",
  organico: "#72be8a",
};

const WASTE_LABELS: Record<string, string> = {
  pilhas: "Pilhas",
  eletronicos: "Eletrônicos",
  medicamentos: "Medicamentos",
  oleo: "Óleo",
  vidro: "Vidro",
  reciclavel: "Reciclável",
  organico: "Orgânico",
};

interface Props {
  reminders: Reminder[];
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ReminderList({ reminders, onComplete, onDelete }: Props) {
  if (reminders.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: "var(--color-on-surface-variant)" }}>
        Nenhum lembrete ainda.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reminders.map((r) => {
        const color = WASTE_COLORS[r.itemType] ?? "#87938a";
        const done = r.status === "concluido";

        return (
          <div
            key={r.id}
            className="flex items-center gap-3 p-3 rounded-[8px]"
            style={{
              backgroundColor: "var(--color-surface-container)",
              opacity: done ? 0.55 : 1,
            }}
          >
            <span style={{ color }}>
              {done
                ? <CheckCircle size={18} />
                : <Circle size={18} />
              }
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate" style={{ color: "var(--color-on-surface)" }}>
                {r.itemDesc || WASTE_LABELS[r.itemType] || r.itemType}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
                <MapPin size={10} className="inline mr-0.5" />
                {r.pointName}
              </p>
            </div>

            <span
              className="shrink-0 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: done ? "#72be8a22" : "#f4a94222",
                color: done ? "#72be8a" : "#f4a942",
              }}
            >
              {done ? "concluído" : "pendente"}
            </span>

            {!done && onComplete && (
              <button
                onClick={() => onComplete(r.id)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-[6px] border transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                Descartar
              </button>
            )}

            {!done && onDelete && (
              <button
                onClick={() => onDelete(r.id)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-[6px] border transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--color-error-container)",
                  color: "var(--color-error)",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
