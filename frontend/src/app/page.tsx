"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, MapPin, Bell, MessageSquare, RefreshCw, HelpCircle } from "lucide-react";
import { api, ApiError } from "@/services/api";
import ScheduleCard from "@/components/ScheduleCard";
import CollectionPointList from "@/components/CollectionPointList";
import ReminderForm from "@/components/ReminderForm";
import ReminderList from "@/components/ReminderList";
import ChatAgent from "@/components/ChatAgent";
import HelpGuide from "@/components/HelpGuide";
import CreateScheduleForm from "@/components/CreateScheduleForm";
import CreateCollectionPointForm from "@/components/CreateCollectionPointForm";
import type { CollectionPoint, Reminder, Schedule, CreateReminderResponse, CreateScheduleResponse } from "@/types";

type Tab = "calendar" | "points" | "reminders" | "chat" | "help";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "calendar", label: "Calendário", Icon: CalendarDays },
  { id: "points", label: "Pontos", Icon: MapPin },
  { id: "reminders", label: "Lembretes", Icon: Bell },
  { id: "chat", label: "Chat", Icon: MessageSquare },
  { id: "help", label: "Ajuda", Icon: HelpCircle },
];

const NEIGHBORHOODS = ["Centro", "Bela Vista", "Liberdade", "Pinheiros", "Lapa"];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("dispose_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("dispose_session", id);
  }
  return id;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("calendar");
  const sessionId = useRef(getOrCreateSessionId());

  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [points, setPoints] = useState<CollectionPoint[]>([]);
  const [nearbyPoints, setNearbyPoints] = useState<(CollectionPoint & { distanceMeters: number })[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [showPointForm, setShowPointForm] = useState(false);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [formDefaultPoint, setFormDefaultPoint] = useState<number | undefined>();

  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      () => {}
    );
  }, []);

  const loadSchedule = useCallback(async (nb: string) => {
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const data = await api.getSchedule(nb);
      setSchedules(data.schedules);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setScheduleError("Bairro não encontrado.");
      } else {
        setScheduleError("Erro ao carregar agenda.");
      }
      setSchedules([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedule(neighborhood); }, [neighborhood, loadSchedule]);

  const loadNearby = useCallback(async () => {
    if (lat === undefined || lng === undefined) return;
    setPointsLoading(true);
    try {
      const data = await api.getNearbyPoints(lat, lng, 5000);
      setNearbyPoints(data.points);
    } catch {
      // fallback to all points
    } finally {
      setPointsLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    api.listPoints().then(setPoints).catch(() => {});
  }, []);

  useEffect(() => { loadNearby(); }, [loadNearby]);

  const loadReminders = useCallback(async () => {
    setRemindersLoading(true);
    try {
      const data = await api.listReminders(sessionId.current);
      setReminders(data.reminders);
    } catch {
      // silent
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "reminders") loadReminders();
  }, [tab, loadReminders]);

  async function handleComplete(id: string) {
    try {
      const updated = await api.completeReminder(id);
      setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, status: updated.status } : r)));
    } catch {
      // silent
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteReminder(id);
      setReminders((rs) => rs.filter((r) => r.id !== id));
    } catch {
      // silent
    }
  }

  function handleCreateReminder(point: CollectionPoint) {
    setFormDefaultPoint(point.id);
    setShowReminderForm(true);
    setTab("reminders");
  }

  function handleReminderCreated(r: CreateReminderResponse) {
    setShowReminderForm(false);
    setFormDefaultPoint(undefined);
    setReminders((rs) => [r as unknown as Reminder, ...rs]);
  }

  const displayPoints = lat !== undefined ? nearbyPoints : points;

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-outline-variant)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <span className="text-xs font-bold" style={{ color: "var(--color-on-primary)" }}>D</span>
        </div>
        <h1 className="text-base font-semibold" style={{ color: "var(--color-on-surface)" }}>
          Dispose
        </h1>
        <span className="text-xs ml-auto font-mono" style={{ color: "var(--color-on-surface-variant)" }}>
          {lat !== undefined ? `${lat.toFixed(3)}, ${lng?.toFixed(3)}` : "sem GPS"}
        </span>
      </header>

      <nav
        className="flex border-b"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-outline-variant)" }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: tab === id ? "var(--color-primary)" : "var(--color-on-surface-variant)",
              borderBottom: tab === id ? "2px solid var(--color-primary)" : "2px solid transparent",
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {tab === "calendar" && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="flex-1 px-3 py-2 rounded-[6px] text-sm appearance-none"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                onClick={() => loadSchedule(neighborhood)}
                disabled={scheduleLoading}
                className="p-2 rounded-[6px] disabled:opacity-40"
                style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }}
              >
                <RefreshCw size={16} className={scheduleLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowScheduleForm((v) => !v)}
                className="px-3 py-2 rounded-[6px] text-sm font-medium"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                {showScheduleForm ? "Cancelar" : "+ Nova"}
              </button>
            </div>

            {showScheduleForm && (
              <div
                className="p-4 rounded-[8px]"
                style={{ backgroundColor: "var(--color-surface-container)" }}
              >
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
                  Nova agenda de coleta
                </h2>
                <CreateScheduleForm
                  onCreated={(r: CreateScheduleResponse) => {
                    setShowScheduleForm(false);
                    if (r.neighborhood.toLowerCase() === neighborhood.toLowerCase()) {
                      loadSchedule(neighborhood);
                    }
                  }}
                  onCancel={() => setShowScheduleForm(false)}
                />
              </div>
            )}

            {scheduleError && (
              <p className="text-sm" style={{ color: "var(--color-error)" }}>{scheduleError}</p>
            )}

            {schedules.map((s, i) => (
              <ScheduleCard key={i} schedule={s} />
            ))}
          </div>
        )}

        {tab === "points" && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs flex-1" style={{ color: "var(--color-on-surface-variant)" }}>
                {lat !== undefined
                  ? `Pontos próximos (5km) de ${lat.toFixed(3)}, ${lng?.toFixed(3)}`
                  : "Todos os pontos de coleta — ative o GPS para ver por proximidade"}
              </p>
              <button
                onClick={() => setShowPointForm((v) => !v)}
                className="shrink-0 px-3 py-1.5 rounded-[6px] text-sm font-medium"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
              >
                {showPointForm ? "Cancelar" : "+ Novo"}
              </button>
            </div>

            {showPointForm && (
              <div
                className="p-4 rounded-[8px]"
                style={{ backgroundColor: "var(--color-surface-container)" }}
              >
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
                  Novo ponto de coleta
                </h2>
                <CreateCollectionPointForm
                  currentLat={lat}
                  currentLng={lng}
                  onCreated={(p) => {
                    setShowPointForm(false);
                    setPoints((ps) => [...ps, p]);
                    if (lat !== undefined) loadNearby();
                  }}
                  onCancel={() => setShowPointForm(false)}
                />
              </div>
            )}

            {pointsLoading
              ? <p className="text-sm text-center py-6" style={{ color: "var(--color-on-surface-variant)" }}>Carregando…</p>
              : <CollectionPointList points={displayPoints} onCreateReminder={handleCreateReminder} />
            }
          </div>
        )}

        {tab === "reminders" && (
          <div className="space-y-4 max-w-lg mx-auto">
            {showReminderForm ? (
              <div
                className="p-4 rounded-[8px]"
                style={{ backgroundColor: "var(--color-surface-container)" }}
              >
                <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-surface)" }}>
                  Novo lembrete
                </h2>
                <ReminderForm
                  sessionId={sessionId.current}
                  points={points}
                  defaultPointId={formDefaultPoint}
                  onCreated={handleReminderCreated}
                  onCancel={() => { setShowReminderForm(false); setFormDefaultPoint(undefined); }}
                />
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
                  Meus lembretes
                </h2>
                <button
                  onClick={() => setShowReminderForm(true)}
                  className="text-xs px-3 py-1.5 rounded-[6px]"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-on-primary)" }}
                >
                  + Novo
                </button>
              </div>
            )}

            {!showReminderForm && (
              remindersLoading
                ? <p className="text-sm text-center py-6" style={{ color: "var(--color-on-surface-variant)" }}>Carregando…</p>
                : <ReminderList reminders={reminders} onComplete={handleComplete} onDelete={handleDelete} />
            )}
          </div>
        )}

        {tab === "chat" && (
          <div
            className="max-w-lg mx-auto flex flex-col"
            style={{ height: "calc(100vh - 140px)" }}
          >
            <ChatAgent
              sessionId={sessionId.current}
              neighborhood={neighborhood}
              lat={lat}
              lng={lng}
              onReminderCreated={(r) => {
                setReminders((rs) => [r as unknown as Reminder, ...rs]);
              }}
            />
          </div>
        )}

        {tab === "help" && <HelpGuide />}
      </main>
    </div>
  );
}
