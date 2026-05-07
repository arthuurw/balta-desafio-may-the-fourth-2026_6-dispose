"use client";

import { MapPin, Clock, Plus } from "lucide-react";
import type { CollectionPoint } from "@/types";

const WASTE_COLORS: Record<string, string> = {
  organico: "#72be8a",
  reciclavel: "#5bb8d4",
  vidro: "#9b8ddb",
  poda: "#a0845a",
  oleo: "#f4a942",
  pilhas: "#f4a942",
  eletronicos: "#f4a942",
  medicamentos: "#f4a942",
};

const WASTE_LABELS: Record<string, string> = {
  organico: "Orgânico",
  reciclavel: "Reciclável",
  vidro: "Vidro",
  poda: "Poda",
  oleo: "Óleo",
  pilhas: "Pilhas",
  eletronicos: "Eletrônicos",
  medicamentos: "Medicamentos",
};

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

interface Props {
  points: (CollectionPoint & { distanceMeters?: number })[];
  onCreateReminder?: (point: CollectionPoint) => void;
}

export default function CollectionPointList({ points, onCreateReminder }: Props) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--color-on-surface-variant)" }}>
        Nenhum ponto encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {points.map((point) => {
        const dist = point.distanceMeters;
        const distColor = dist !== undefined && dist <= 1000 ? "#72be8a" : "#f4a942";

        return (
          <div
            key={point.id}
            className="rounded-[8px] p-4 space-y-2.5"
            style={{ backgroundColor: "var(--color-surface-container)" }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight truncate" style={{ color: "var(--color-on-surface)" }}>
                  {point.name}
                </h3>
                <p className="text-sm mt-0.5 truncate" style={{ color: "var(--color-on-surface-variant)" }}>
                  <MapPin size={12} className="inline mr-1" />
                  {point.address}
                </p>
              </div>
              {dist !== undefined && (
                <span
                  className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${distColor}22`, color: distColor }}
                >
                  {formatDistance(dist)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {point.acceptedTypes.map((t) => {
                const color = WASTE_COLORS[t] ?? "#87938a";
                return (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {WASTE_LABELS[t] ?? t}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: "var(--color-on-surface-variant)" }}>
                <Clock size={12} className="inline mr-1" />
                {point.openingHours}
              </span>
              {onCreateReminder && (
                <button
                  onClick={() => onCreateReminder(point)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-[6px] border transition-colors hover:opacity-80"
                  style={{
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                  }}
                >
                  <Plus size={12} />
                  Criar lembrete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
