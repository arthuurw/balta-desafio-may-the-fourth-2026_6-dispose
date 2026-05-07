import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "@/services/api";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function okResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

function errResponse(status: number, text = "error") {
  return Promise.resolve({
    ok: false,
    status,
    statusText: text,
    json: () => Promise.reject(new Error("not json")),
    text: () => Promise.resolve(text),
  } as Response);
}

beforeEach(() => fetchMock.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("api.getSchedule", () => {
  it("returns schedule on 200", async () => {
    const payload = { neighborhood: "Centro", schedules: [{ wasteType: "organico", days: ["segunda"], timeSlot: "07:00-12:00" }] };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.getSchedule("Centro");
    expect(result.neighborhood).toBe("Centro");
    expect(result.schedules).toHaveLength(1);
  });

  it("throws ApiError 404 on not found", async () => {
    fetchMock.mockReturnValue(errResponse(404, "Not found"));
    const err = await api.getSchedule("Inexistente").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

describe("api.getNearbyPoints", () => {
  it("passes lat/lng/radius/wasteType as query params", async () => {
    fetchMock.mockReturnValueOnce(okResponse({ points: [] }));
    await api.getNearbyPoints(-23.55, -46.63, 2000, "oleo");
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain("lat=-23.55");
    expect(url).toContain("lng=-46.63");
    expect(url).toContain("radius=2000");
    expect(url).toContain("wasteType=oleo");
  });

  it("returns empty list when no points", async () => {
    fetchMock.mockReturnValueOnce(okResponse({ points: [] }));
    const result = await api.getNearbyPoints(0, 0);
    expect(result.points).toHaveLength(0);
  });
});

describe("api.createReminder", () => {
  it("posts JSON body and returns created reminder", async () => {
    const payload = { id: "abc", status: "pendente", sessionId: "s1", itemType: "pilhas", pointId: 1, pointName: "Ecoponto Centro", pointAddress: "Rua X", createdAt: new Date().toISOString() };
    fetchMock.mockReturnValueOnce(okResponse(payload, 201));
    const result = await api.createReminder({ sessionId: "s1", itemType: "pilhas", pointId: 1 });
    expect(result.id).toBe("abc");
    expect(result.status).toBe("pendente");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ sessionId: "s1", itemType: "pilhas", pointId: 1 });
  });

  it("throws ApiError 404 when point not found", async () => {
    fetchMock.mockReturnValueOnce(errResponse(404));
    await expect(api.createReminder({ sessionId: "s1", itemType: "pilhas", pointId: 9999 })).rejects.toMatchObject({ status: 404 });
  });

  it("throws ApiError 400 on validation error", async () => {
    fetchMock.mockReturnValueOnce(errResponse(400));
    await expect(api.createReminder({ sessionId: "", itemType: "pilhas", pointId: 1 })).rejects.toMatchObject({ status: 400 });
  });
});

describe("api.completeReminder", () => {
  it("patches and returns updated reminder", async () => {
    const payload = { id: "abc", status: "concluido" };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.completeReminder("abc");
    expect(result.status).toBe("concluido");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("PATCH");
  });

  it("throws ApiError 404 when not found", async () => {
    fetchMock.mockReturnValueOnce(errResponse(404));
    await expect(api.completeReminder("no-such-id")).rejects.toMatchObject({ status: 404 });
  });
});

describe("api.listReminders", () => {
  it("returns reminders list on 200", async () => {
    const payload = {
      reminders: [
        { id: "abc", itemType: "pilhas", pointName: "Ecoponto Centro", pointAddress: "Rua X", status: "pendente", createdAt: new Date().toISOString() },
      ],
    };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.listReminders("s1");
    expect(result.reminders).toHaveLength(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit | undefined];
    expect(init?.method).toBeUndefined(); // GET
  });

  it("includes sessionId in query string", async () => {
    fetchMock.mockReturnValueOnce(okResponse({ reminders: [] }));
    await api.listReminders("my-session");
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain("sessionId=my-session");
  });

  it("throws ApiError 400 when sessionId missing", async () => {
    fetchMock.mockReturnValueOnce(errResponse(400));
    await expect(api.listReminders("")).rejects.toMatchObject({ status: 400 });
  });
});

describe("api.chat", () => {
  it("returns agent response on 200", async () => {
    const payload = { action: "schedule_info", reply: "Coleta às terças.", neighborhood: "Centro" };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.chat({ sessionId: "s1", message: "Quando coleta?" });
    expect(result.action).toBe("schedule_info");
    expect(result.reply).toBe("Coleta às terças.");
  });

  it("returns reminders array on list_reminders action", async () => {
    const payload = {
      action: "list_reminders",
      reply: "Você tem 1 lembrete pendente.",
      reminders: [{ id: "abc", itemType: "pilhas", pointName: "Ecoponto Centro", status: "pendente" }],
    };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.chat({ sessionId: "s1", message: "meus lembretes" });
    expect(result.action).toBe("list_reminders");
    expect(result.reminders).toHaveLength(1);
    expect(result.reminders![0].itemType).toBe("pilhas");
  });

  it("returns createdReminder on create_reminder action", async () => {
    const payload = {
      action: "create_reminder",
      reply: "Lembrete criado!",
      createdReminder: { id: "def", itemType: "eletronicos", pointName: "Ecoponto Pinheiros", status: "pendente" },
    };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.chat({ sessionId: "s1", message: "cria lembrete eletrônicos" });
    expect(result.action).toBe("create_reminder");
    expect(result.createdReminder?.itemType).toBe("eletronicos");
  });

  it("returns completedReminderId on complete_reminder action", async () => {
    const payload = {
      action: "complete_reminder",
      reply: "Lembrete concluído!",
      completedReminderId: "550e8400-e29b-41d4-a716-446655440000",
    };
    fetchMock.mockReturnValueOnce(okResponse(payload));
    const result = await api.chat({ sessionId: "s1", message: "já descartei" });
    expect(result.action).toBe("complete_reminder");
    expect(result.completedReminderId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("throws ApiError 502 when agent unavailable", async () => {
    fetchMock.mockReturnValueOnce(errResponse(502));
    await expect(api.chat({ sessionId: "s1", message: "test" })).rejects.toMatchObject({ status: 502 });
  });
});
