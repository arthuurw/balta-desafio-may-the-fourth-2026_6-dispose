"use client";

import { useRef, useState, useEffect } from "react";
import { Send, MapPin, Navigation, CheckCircle, Package, Trash2, CalendarClock, CalendarPlus, MapPinPlus } from "lucide-react";
import { api, ApiError } from "@/services/api";
import type { ChatResponse, CreateReminderResponse, ReminderSummary, NextCollectionInfo, FilteredPoint, ScheduleSummary, PointSummary } from "@/types";

interface Message {
  role: "user" | "agent";
  text: string;
  response?: ChatResponse;
}

interface Props {
  sessionId: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  onReminderCreated?: (r: CreateReminderResponse) => void;
}

export default function ChatAgent({ sessionId, neighborhood, lat, lng, onReminderCreated }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "Olá! Posso te informar sobre os dias de coleta do seu bairro, criar lembretes de descarte e gerenciar os lembretes pendentes. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.chat({
        sessionId,
        message: text,
        neighborhood,
        lat,
        lng,
      });
      setMessages((m) => [...m, { role: "agent", text: res.reply ?? "…", response: res }]);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 502
          ? "O agente está temporariamente indisponível. Tente novamente em alguns instantes."
          : "Erro ao contatar o agente.";
      setMessages((m) => [...m, { role: "agent", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReminder(response: ChatResponse) {
    if (!response.suggestedPoint || !response.itemType) return;
    try {
      const r = await api.createReminder({
        sessionId,
        itemType: response.itemType,
        pointId: response.suggestedPoint.id,
      });
      onReminderCreated?.(r);
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          text: `Lembrete criado para "${response.itemType}" no ponto ${response.suggestedPoint!.name}!`,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "Não foi possível criar o lembrete." }]);
    }
  }

  const gpsActive = lat !== undefined && lng !== undefined;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-[8px] px-3 py-2 text-sm ${
                msg.role === "user" ? "" : "border-l-2"
              }`}
              style={{
                backgroundColor:
                  msg.role === "user"
                    ? "var(--color-surface-high)"
                    : "var(--color-surface-container)",
                borderLeftColor:
                  msg.role === "agent" ? "var(--color-primary)" : undefined,
                color: "var(--color-on-surface)",
              }}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* suggest_reminder — show point card with manual create button */}
              {msg.response?.suggestedPoint &&
                msg.response.action === "suggest_reminder" && (
                  <PointCard
                    point={msg.response.suggestedPoint}
                    onCreateReminder={() => handleCreateReminder(msg.response!)}
                  />
                )}

              {/* create_reminder — agent auto-created, show confirmation card */}
              {msg.response?.action === "create_reminder" &&
                msg.response.createdReminder && (
                  <CreatedReminderCard reminder={msg.response.createdReminder} />
                )}

              {/* list_reminders — show pending list */}
              {msg.response?.action === "list_reminders" &&
                msg.response.reminders && (
                  <RemindersList reminders={msg.response.reminders} />
                )}

              {/* complete_reminder — show completion badge */}
              {msg.response?.action === "complete_reminder" &&
                msg.response.completedReminderId && (
                  <CompletionBadge />
                )}

              {/* delete_reminder — show deletion badge */}
              {msg.response?.action === "delete_reminder" &&
                msg.response.deletedReminderId && (
                  <DeletionBadge />
                )}

              {/* next_collection — show countdown card */}
              {msg.response?.action === "next_collection" &&
                msg.response.nextCollection && (
                  <NextCollectionCard info={msg.response.nextCollection} />
                )}

              {/* create_schedule — show confirmation card */}
              {msg.response?.action === "create_schedule" &&
                msg.response.createdSchedule && (
                  <CreatedScheduleCard schedule={msg.response.createdSchedule} />
                )}

              {/* create_point — show confirmation card */}
              {msg.response?.action === "create_point" &&
                msg.response.createdPoint && (
                  <CreatedPointCard point={msg.response.createdPoint} />
                )}

              {/* filter_points — show all matching points with create reminder buttons */}
              {msg.response?.action === "filter_points" &&
                msg.response.filteredPoints && (
                  <FilteredPointsList
                    points={msg.response.filteredPoints}
                    itemType={msg.response.itemType ?? ""}
                    sessionId={sessionId}
                    onReminderCreated={onReminderCreated}
                    onMessage={(text) =>
                      setMessages((m) => [...m, { role: "agent", text }])
                    }
                  />
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-[8px] border-l-2 text-sm"
              style={{
                backgroundColor: "var(--color-surface-container)",
                borderLeftColor: "var(--color-primary)",
                color: "var(--color-on-surface-variant)",
              }}
            >
              <span className="animate-pulse">Digitando…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="p-3 flex items-center gap-2 border-t"
        style={{ borderColor: "var(--color-outline-variant)" }}
      >
        <div
          className="shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          title={gpsActive ? `GPS: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : "GPS inativo"}
          style={{
            backgroundColor: gpsActive ? "#72be8a22" : "#f4a94222",
            color: gpsActive ? "#72be8a" : "#f4a942",
          }}
        >
          <Navigation size={10} />
          {gpsActive ? "GPS" : "Sem GPS"}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Digite sua pergunta…"
          maxLength={1000}
          className="flex-1 px-3 py-2 rounded-[6px] text-sm"
          style={{
            backgroundColor: "var(--color-surface-container)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
          }}
        />

        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="p-2 rounded-[6px] disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function PointCard({
  point,
  onCreateReminder,
}: {
  point: NonNullable<ChatResponse["suggestedPoint"]>;
  onCreateReminder: () => void;
}) {
  return (
    <div
      className="mt-2 p-2.5 rounded-[6px] space-y-1.5"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
        Ponto sugerido
      </p>
      <p className="text-xs font-medium" style={{ color: "var(--color-on-surface)" }}>
        {point.name}
      </p>
      <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
        <MapPin size={10} className="inline mr-0.5" />
        {point.address}
        {" · "}
        {point.distanceMeters < 1000
          ? `${Math.round(point.distanceMeters)}m`
          : `${(point.distanceMeters / 1000).toFixed(1)}km`}
      </p>
      <button
        onClick={onCreateReminder}
        className="text-xs px-3 py-1 rounded-[6px] mt-1"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
      >
        Criar lembrete
      </button>
    </div>
  );
}

function CreatedReminderCard({ reminder }: { reminder: ReminderSummary }) {
  return (
    <div
      className="mt-2 p-2.5 rounded-[6px] flex items-start gap-2"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <CheckCircle size={14} style={{ color: "var(--color-primary)", marginTop: 1 }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
          Lembrete criado
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface)" }}>
          {reminder.itemType} · {reminder.pointName}
        </p>
      </div>
    </div>
  );
}

function RemindersList({ reminders }: { reminders: ReminderSummary[] }) {
  if (reminders.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
        Nenhum lembrete pendente.
      </p>
    );

  return (
    <div
      className="mt-2 rounded-[6px] overflow-hidden"
      style={{ border: "1px solid var(--color-outline-variant)" }}
    >
      {reminders.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 px-2.5 py-2 text-xs border-b last:border-b-0"
          style={{
            borderColor: "var(--color-outline-variant)",
            backgroundColor: "var(--color-surface-high)",
          }}
        >
          <Package size={12} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <span style={{ color: "var(--color-on-surface)" }} className="font-medium">
            {r.itemType}
          </span>
          <span style={{ color: "var(--color-on-surface-variant)" }}>·</span>
          <span style={{ color: "var(--color-on-surface-variant)" }}>{r.pointName}</span>
        </div>
      ))}
    </div>
  );
}

function CompletionBadge() {
  return (
    <div
      className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-[6px]"
      style={{ backgroundColor: "#72be8a22", color: "#72be8a" }}
    >
      <CheckCircle size={12} />
      Marcado como concluído
    </div>
  );
}

function DeletionBadge() {
  return (
    <div
      className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-[6px]"
      style={{ backgroundColor: "#ffb4ab22", color: "var(--color-error)" }}
    >
      <Trash2 size={12} />
      Lembrete cancelado e removido
    </div>
  );
}

const DAY_LABELS: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

const DAY_SHORT: Record<string, string> = {
  segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
  sexta: "Sex", sabado: "Sáb", domingo: "Dom",
};

function CreatedScheduleCard({ schedule }: { schedule: ScheduleSummary }) {
  return (
    <div
      className="mt-2 p-2.5 rounded-[6px] flex items-start gap-2"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <CalendarPlus size={14} style={{ color: "var(--color-primary)", marginTop: 1, flexShrink: 0 }} />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
          Agenda cadastrada
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface)" }}>
          {schedule.wasteType} · {schedule.neighborhood}
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
          {schedule.days.map((d) => DAY_SHORT[d] ?? d).join(", ")} · {schedule.timeSlot}
        </p>
      </div>
    </div>
  );
}

function CreatedPointCard({ point }: { point: PointSummary }) {
  return (
    <div
      className="mt-2 p-2.5 rounded-[6px] flex items-start gap-2"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <MapPinPlus size={14} style={{ color: "var(--color-primary)", marginTop: 1, flexShrink: 0 }} />
      <div className="space-y-0.5">
        <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
          Ponto cadastrado
        </p>
        <p className="text-xs font-medium" style={{ color: "var(--color-on-surface)" }}>
          {point.name}
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
          <MapPin size={10} className="inline mr-0.5" />
          {point.address}
        </p>
        <div className="flex flex-wrap gap-1 mt-0.5">
          {point.acceptedTypes.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilteredPointsList({
  points,
  itemType,
  sessionId,
  onReminderCreated,
  onMessage,
}: {
  points: FilteredPoint[];
  itemType: string;
  sessionId: string;
  onReminderCreated?: (r: CreateReminderResponse) => void;
  onMessage: (text: string) => void;
}) {
  if (points.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
        Nenhum ponto encontrado para este tipo.
      </p>
    );

  async function createReminder(point: FilteredPoint) {
    try {
      const r = await api.createReminder({ sessionId, itemType, pointId: point.id });
      onReminderCreated?.(r);
      onMessage(`Lembrete criado para "${itemType}" no ponto ${point.name}!`);
    } catch {
      onMessage("Não foi possível criar o lembrete.");
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {points.map((p) => (
        <div
          key={p.id}
          className="p-2.5 rounded-[6px] space-y-1"
          style={{ backgroundColor: "var(--color-surface-high)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-on-surface)" }}>
            {p.name}
          </p>
          <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
            <MapPin size={10} className="inline mr-0.5" />
            {p.address}
            {p.distanceMeters > 0 && (
              <>
                {" · "}
                {p.distanceMeters < 1000
                  ? `${Math.round(p.distanceMeters)}m`
                  : `${(p.distanceMeters / 1000).toFixed(1)}km`}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-1">
            {p.acceptedTypes.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-on-primary-container)" }}
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={() => createReminder(p)}
            className="text-xs px-3 py-1 rounded-[6px] mt-0.5"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
          >
            Criar lembrete
          </button>
        </div>
      ))}
    </div>
  );
}

function NextCollectionCard({ info }: { info: NextCollectionInfo }) {
  const dayLabel = DAY_LABELS[info.nextDay] ?? info.nextDay;
  const daysText =
    info.daysUntil === 0
      ? "hoje"
      : info.daysUntil === 1
        ? "amanhã"
        : `em ${info.daysUntil} dias`;

  return (
    <div
      className="mt-2 p-2.5 rounded-[6px] flex items-start gap-2"
      style={{ backgroundColor: "var(--color-surface-high)" }}
    >
      <CalendarClock size={14} style={{ color: "var(--color-primary)", marginTop: 1, flexShrink: 0 }} />
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
          Próxima coleta — {daysText}
        </p>
        <p className="text-xs" style={{ color: "var(--color-on-surface)" }}>
          {info.wasteType} · {info.neighborhood} · {dayLabel}
        </p>
      </div>
    </div>
  );
}
