using System.Text;
using System.Text.Json;
using Dispose.Api.Agents;
using Dispose.Api.Data;
using Dispose.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.Chat;

public static class Chat
{
    public record Request(
        string SessionId,
        string Message,
        double? Lat,
        double? Lng,
        string? Neighborhood);

    public record SuggestedPoint(int Id, string Name, string Address, int DistanceMeters);
    public record ReminderSummary(Guid Id, string ItemType, string? ItemDesc, string PointName, string Status);
    public record NextCollectionInfo(string WasteType, string Neighborhood, string NextDay, int DaysUntil);
    public record FilteredPoint(int Id, string Name, string Address, int DistanceMeters, List<string> AcceptedTypes);
    public record ScheduleSummary(int Id, string Neighborhood, string WasteType, List<string> Days, string TimeSlot, string? Notes);
    public record PointSummary(int Id, string Name, string Address, List<string> AcceptedTypes, string OpeningHours);

    public record Response(
        string Reply,
        string Action,
        SuggestedPoint? SuggestedPoint,
        List<ReminderSummary>? Reminders = null,
        Guid? CompletedReminderId = null,
        ReminderSummary? CreatedReminder = null,
        Guid? DeletedReminderId = null,
        NextCollectionInfo? NextCollection = null,
        List<FilteredPoint>? FilteredPoints = null,
        ScheduleSummary? CreatedSchedule = null,
        PointSummary? CreatedPoint = null);

    private static readonly string[] PtDays =
        ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/chat", Handle)
           .WithName("Chat")
           .WithTags("Chat")
           .WithSummary("Enviar mensagem ao agente de coleta")
           .WithDescription("Processa a mensagem do usuário com o agente IA (MAF + Groq). Retorna action: schedule_info | suggest_reminder | create_reminder | list_reminders | complete_reminder | delete_reminder | next_collection | filter_points | create_schedule | create_point | general_reply | unknown.")
           .Produces<Response>()
           .Produces(StatusCodes.Status400BadRequest)
           .Produces(StatusCodes.Status502BadGateway);

    private static async Task<IResult> Handle(
        Request req,
        DisposeContext db,
        ICollectionAgent agent,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Message))
            return Results.BadRequest(new { error = "message é obrigatório." });
        if (req.Message.Length > 1000)
            return Results.BadRequest(new { error = "message excede 1000 caracteres." });

        var prompt = await BuildPromptAsync(req, db, ct);

        AgentResponseDto agentDto;
        try
        {
            agentDto = await agent.AskAsync(prompt, ct);
        }
        catch (AgentException)
        {
            return Results.Json(
                new { error = "Falha na comunicação com o agente. Tente novamente." },
                statusCode: StatusCodes.Status502BadGateway);
        }

        SuggestedPoint? suggestedPoint = null;
        if (agentDto.SuggestedPointId is { } pointId)
        {
            var point = await db.CollectionPoints.FindAsync([pointId], ct);
            if (point is not null)
            {
                var dist = req.Lat.HasValue && req.Lng.HasValue
                    ? (int)Haversine(req.Lat.Value, req.Lng.Value, point.Latitude, point.Longitude)
                    : 0;
                suggestedPoint = new SuggestedPoint(point.Id, point.Name, point.Address, dist);
            }
        }

        switch (agentDto.Action)
        {
            case "list_reminders":
            {
                var reminders = await db.Reminders
                    .Include(r => r.Point)
                    .Where(r => r.SessionId == req.SessionId && r.Status == "pendente")
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync(ct);

                var summaries = reminders
                    .Select(r => new ReminderSummary(r.Id, r.ItemType, r.ItemDesc, r.Point.Name, r.Status))
                    .ToList();

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Seus lembretes pendentes:",
                    agentDto.Action,
                    null,
                    Reminders: summaries));
            }

            case "complete_reminder" when agentDto.ReminderId is not null
                                          && Guid.TryParse(agentDto.ReminderId, out var completeId):
            {
                var reminder = await db.Reminders.FindAsync([completeId], ct);
                if (reminder is not null && reminder.SessionId == req.SessionId)
                {
                    reminder.Status = "concluido";
                    await db.SaveChangesAsync(ct);
                }

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Lembrete concluído.",
                    agentDto.Action,
                    null,
                    CompletedReminderId: completeId));
            }

            case "delete_reminder" when agentDto.ReminderId is not null
                                        && Guid.TryParse(agentDto.ReminderId, out var deleteId):
            {
                var reminder = await db.Reminders.FindAsync([deleteId], ct);
                if (reminder is not null && reminder.SessionId == req.SessionId)
                {
                    db.Reminders.Remove(reminder);
                    await db.SaveChangesAsync(ct);
                }

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Lembrete cancelado.",
                    agentDto.Action,
                    null,
                    DeletedReminderId: deleteId));
            }

            case "create_reminder" when agentDto.SuggestedPointId is not null
                                        && !string.IsNullOrWhiteSpace(agentDto.ItemType):
            {
                var point = await db.CollectionPoints.FindAsync([agentDto.SuggestedPointId.Value], ct);
                if (point is null)
                    return Results.Ok(new Response(agentDto.Reply ?? "Ponto não encontrado.", agentDto.Action, null));

                var newReminder = new Reminder
                {
                    SessionId = req.SessionId,
                    ItemType = agentDto.ItemType,
                    PointId = point.Id
                };
                db.Reminders.Add(newReminder);
                await db.SaveChangesAsync(ct);

                var created = new ReminderSummary(newReminder.Id, newReminder.ItemType, newReminder.ItemDesc, point.Name, newReminder.Status);

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Lembrete criado!",
                    agentDto.Action,
                    suggestedPoint,
                    CreatedReminder: created));
            }

            case "filter_points" when !string.IsNullOrWhiteSpace(agentDto.ItemType):
            {
                var all = await db.CollectionPoints.ToListAsync(ct);
                var filtered = all
                    .Select(p =>
                    {
                        var types = JsonSerializer.Deserialize<List<string>>(p.AcceptedTypesJson) ?? [];
                        var dist = req.Lat.HasValue && req.Lng.HasValue
                            ? (int)Haversine(req.Lat.Value, req.Lng.Value, p.Latitude, p.Longitude)
                            : 0;
                        return (p, types, dist);
                    })
                    .Where(x => x.types.Contains(agentDto.ItemType, StringComparer.OrdinalIgnoreCase))
                    .OrderBy(x => x.dist)
                    .Take(5)
                    .Select(x => new FilteredPoint(x.p.Id, x.p.Name, x.p.Address, x.dist, x.types))
                    .ToList();

                return Results.Ok(new Response(
                    agentDto.Reply ?? $"Pontos que aceitam {agentDto.ItemType}:",
                    agentDto.Action,
                    null,
                    FilteredPoints: filtered));
            }

            case "next_collection":
            {
                NextCollectionInfo? info = null;
                if (!string.IsNullOrWhiteSpace(agentDto.WasteType)
                    && !string.IsNullOrWhiteSpace(agentDto.Neighborhood)
                    && !string.IsNullOrWhiteSpace(agentDto.NextDay)
                    && agentDto.DaysUntil.HasValue)
                {
                    info = new NextCollectionInfo(
                        agentDto.WasteType,
                        agentDto.Neighborhood,
                        agentDto.NextDay,
                        agentDto.DaysUntil.Value);
                }

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Próxima coleta calculada.",
                    agentDto.Action,
                    null,
                    NextCollection: info));
            }

            case "create_schedule" when !string.IsNullOrWhiteSpace(agentDto.Neighborhood)
                                        && !string.IsNullOrWhiteSpace(agentDto.WasteType)
                                        && agentDto.ScheduleDays is { Count: > 0 }
                                        && !string.IsNullOrWhiteSpace(agentDto.TimeSlot):
            {
                var exists = await db.CollectionSchedules.AnyAsync(
                    s => s.Neighborhood.ToLower() == agentDto.Neighborhood.ToLower()
                      && s.WasteType.ToLower() == agentDto.WasteType.ToLower(), ct);

                if (exists)
                    return Results.Ok(new Response(
                        $"Já existe uma agenda de '{agentDto.WasteType}' para '{agentDto.Neighborhood}'.",
                        "general_reply",
                        null));

                var schedule = new CollectionSchedule
                {
                    Neighborhood = agentDto.Neighborhood.Trim(),
                    WasteType = agentDto.WasteType.Trim().ToLower(),
                    DaysJson = JsonSerializer.Serialize(agentDto.ScheduleDays),
                    TimeSlot = agentDto.TimeSlot.Trim(),
                    Notes = agentDto.ScheduleNotes?.Trim()
                };
                db.CollectionSchedules.Add(schedule);
                await db.SaveChangesAsync(ct);

                var created = new ScheduleSummary(
                    schedule.Id, schedule.Neighborhood, schedule.WasteType,
                    agentDto.ScheduleDays, schedule.TimeSlot, schedule.Notes);

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Agenda cadastrada com sucesso!",
                    agentDto.Action,
                    null,
                    CreatedSchedule: created));
            }

            case "create_point" when !string.IsNullOrWhiteSpace(agentDto.PointName)
                                     && !string.IsNullOrWhiteSpace(agentDto.PointAddress)
                                     && agentDto.PointAcceptedTypes is { Count: > 0 }
                                     && !string.IsNullOrWhiteSpace(agentDto.PointOpeningHours):
            {
                if (!req.Lat.HasValue || !req.Lng.HasValue)
                    return Results.Ok(new Response(
                        "Para cadastrar um ponto de coleta, ative o GPS no seu dispositivo e tente novamente.",
                        "general_reply",
                        null));

                var validTypes = new HashSet<string>(["pilhas", "eletronicos", "medicamentos", "oleo"]);
                var normalised = agentDto.PointAcceptedTypes
                    .Select(t => t.Trim().ToLower())
                    .Where(validTypes.Contains)
                    .Distinct()
                    .ToList();

                if (normalised.Count == 0)
                    return Results.Ok(new Response(
                        "Nenhum tipo de resíduo válido foi identificado. Use: pilhas, eletronicos, medicamentos, oleo.",
                        "general_reply",
                        null));

                var point = new CollectionPoint
                {
                    Name = agentDto.PointName.Trim(),
                    Address = agentDto.PointAddress.Trim(),
                    Latitude = req.Lat.Value,
                    Longitude = req.Lng.Value,
                    AcceptedTypesJson = JsonSerializer.Serialize(normalised),
                    OpeningHours = agentDto.PointOpeningHours.Trim()
                };
                db.CollectionPoints.Add(point);
                await db.SaveChangesAsync(ct);

                var createdPoint = new PointSummary(
                    point.Id, point.Name, point.Address, normalised, point.OpeningHours);

                return Results.Ok(new Response(
                    agentDto.Reply ?? "Ponto de coleta cadastrado com sucesso!",
                    agentDto.Action,
                    null,
                    CreatedPoint: createdPoint));
            }

            default:
                return Results.Ok(new Response(
                    agentDto.Reply ?? "Não foi possível processar sua mensagem.",
                    agentDto.Action,
                    suggestedPoint));
        }
    }

    private static async Task<string> BuildPromptAsync(Request req, DisposeContext db, CancellationToken ct)
    {
        var sb = new StringBuilder();

        // Inject current date and day of week so agent can calculate next collection
        var now = DateTime.UtcNow.AddHours(-3); // BRT
        var ptDayName = PtDays[(int)now.DayOfWeek];
        sb.AppendLine($"[Data atual: {ptDayName}, {now:dd/MM/yyyy}]");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(req.Neighborhood))
        {
            var schedules = await db.CollectionSchedules
                .Where(s => s.Neighborhood.ToLower() == req.Neighborhood.ToLower())
                .ToListAsync(ct);

            if (schedules.Count > 0)
            {
                sb.AppendLine($"[Agenda de coleta — Bairro: {req.Neighborhood}]");
                foreach (var s in schedules)
                {
                    var days = JsonSerializer.Deserialize<List<string>>(s.DaysJson) ?? [];
                    var line = $"{s.WasteType}: {string.Join(", ", days)} | {s.TimeSlot}";
                    if (s.Notes is not null) line += $" | {s.Notes}";
                    sb.AppendLine(line);
                }
                sb.AppendLine();
            }
        }

        if (req.Lat.HasValue && req.Lng.HasValue)
        {
            var all = await db.CollectionPoints.ToListAsync(ct);
            var nearby = all
                .Select(p =>
                {
                    var types = JsonSerializer.Deserialize<List<string>>(p.AcceptedTypesJson) ?? [];
                    var dist = (int)Haversine(req.Lat.Value, req.Lng.Value, p.Latitude, p.Longitude);
                    return (p, types, dist);
                })
                .Where(x => x.dist <= 5000)
                .OrderBy(x => x.dist)
                .Take(5)
                .ToList();

            if (nearby.Count > 0)
            {
                sb.AppendLine("[Pontos de coleta próximos (raio 5km)]");
                for (var i = 0; i < nearby.Count; i++)
                {
                    var (p, types, dist) = nearby[i];
                    sb.AppendLine($"{i + 1}. {p.Name} — {p.Address} — {dist}m (id:{p.Id})");
                    sb.AppendLine($"   Aceita: {string.Join(", ", types)}");
                    sb.AppendLine($"   Horário: {p.OpeningHours}");
                }
                sb.AppendLine();
            }
        }

        if (!string.IsNullOrWhiteSpace(req.SessionId))
        {
            var pendingReminders = await db.Reminders
                .Include(r => r.Point)
                .Where(r => r.SessionId == req.SessionId && r.Status == "pendente")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

            if (pendingReminders.Count > 0)
            {
                sb.AppendLine("[Lembretes pendentes]");
                foreach (var r in pendingReminders)
                    sb.AppendLine($"id:{r.Id} — {r.ItemType} — {r.Point.Name}");
                sb.AppendLine();
            }
        }

        sb.AppendLine("[Pergunta do usuário]");
        sb.Append(req.Message);

        return sb.ToString();
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6_371_000;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
