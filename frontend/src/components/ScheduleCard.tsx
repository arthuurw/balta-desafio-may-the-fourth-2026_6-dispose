"use client";

import { Leaf, Recycle, Wine, Zap, TreePine, Droplets } from "lucide-react";
import type { Schedule } from "@/types";

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
  poda: "Poda / Entulho",
  oleo: "Óleo",
  pilhas: "Pilhas",
  eletronicos: "Eletrônicos",
  medicamentos: "Medicamentos",
};

function WasteIcon({ type, size = 20 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  switch (type) {
    case "organico": return <Leaf {...props} />;
    case "reciclavel": return <Recycle {...props} />;
    case "vidro": return <Wine {...props} />;
    case "poda": return <TreePine {...props} />;
    case "oleo": return <Droplets {...props} />;
    default: return <Zap {...props} />;
  }
}

const NEXT_DAY_NAMES: Record<string, number> = {
  segunda: 1, "segunda-feira": 1,
  terca: 2, "terça": 2, "terça-feira": 2,
  quarta: 3, "quarta-feira": 3,
  quinta: 4, "quinta-feira": 4,
  sexta: 5, "sexta-feira": 5,
  sabado: 6, "sábado": 6,
  domingo: 0,
};

function nextCollectionDate(days: string[]): string {
  const today = new Date();
  const todayDow = today.getDay();
  let minDiff = 8;
  for (const d of days) {
    const norm = d.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const dow = NEXT_DAY_NAMES[norm] ?? NEXT_DAY_NAMES[d.toLowerCase()];
    if (dow === undefined) continue;
    const diff = (dow - todayDow + 7) % 7 || 7;
    if (diff < minDiff) minDiff = diff;
  }
  if (minDiff === 8) return "—";
  const next = new Date(today);
  next.setDate(today.getDate() + minDiff);
  return next.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export default function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const color = WASTE_COLORS[schedule.wasteType] ?? "#87938a";
  const label = WASTE_LABELS[schedule.wasteType] ?? schedule.wasteType;
  const nextDate = nextCollectionDate(schedule.days);

  return (
    <div
      className="rounded-[8px] overflow-hidden flex"
      style={{ backgroundColor: "var(--color-surface-container)" }}
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span style={{ color }}><WasteIcon type={schedule.wasteType} /></span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
            {label}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {schedule.days.map((day) => (
            <span
              key={day}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${color}33`, color }}
            >
              {day}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            {schedule.timeSlot}
          </span>
          <span className="text-sm font-bold" style={{ color }}>
            {nextDate}
          </span>
        </div>

        {schedule.notes && (
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            {schedule.notes}
          </p>
        )}
      </div>
    </div>
  );
}
