import type {
  ScheduleResponse,
  CollectionPoint,
  NearbyPointsResponse,
  CreateReminderRequest,
  CreateReminderResponse,
  ListRemindersResponse,
  Reminder,
  ChatRequest,
  ChatResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
  CreateCollectionPointRequest,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new ApiError(res.status, text);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  getSchedule(neighborhood: string): Promise<ScheduleResponse> {
    return request(`/api/schedule?neighborhood=${encodeURIComponent(neighborhood)}`);
  },

  createSchedule(body: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    return request("/api/schedule", { method: "POST", body: JSON.stringify(body) });
  },

  createCollectionPoint(body: CreateCollectionPointRequest): Promise<CollectionPoint> {
    return request("/api/collection-points", { method: "POST", body: JSON.stringify(body) });
  },

  listPoints(): Promise<CollectionPoint[]> {
    return request<{ points: CollectionPoint[] }>("/api/collection-points").then((r) => r.points);
  },

  getNearbyPoints(
    lat: number,
    lng: number,
    radius?: number,
    wasteType?: string
  ): Promise<NearbyPointsResponse> {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (radius) params.set("radius", String(radius));
    if (wasteType) params.set("wasteType", wasteType);
    return request(`/api/collection-points/nearby?${params}`);
  },

  createReminder(body: CreateReminderRequest): Promise<CreateReminderResponse> {
    return request("/api/reminders", { method: "POST", body: JSON.stringify(body) });
  },

  listReminders(sessionId: string): Promise<ListRemindersResponse> {
    return request(`/api/reminders?sessionId=${encodeURIComponent(sessionId)}`);
  },

  completeReminder(id: string): Promise<Reminder> {
    return request(`/api/reminders/${id}/complete`, { method: "PATCH" });
  },

  deleteReminder(id: string): Promise<void> {
    return request(`/api/reminders/${id}`, { method: "DELETE" });
  },

  chat(body: ChatRequest): Promise<ChatResponse> {
    return request("/api/chat", { method: "POST", body: JSON.stringify(body) });
  },
};

export { ApiError };
