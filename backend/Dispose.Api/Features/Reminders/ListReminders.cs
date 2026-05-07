using Dispose.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.Reminders;

public static class ListReminders
{
    public record PointSummary(string Name, string Address);
    public record ReminderItem(Guid Id, string ItemType, string? ItemDesc, PointSummary Point, string Status, DateTime CreatedAt);
    public record Response(List<ReminderItem> Reminders);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/reminders", Handle)
           .WithName("ListReminders")
           .WithTags("Reminders")
           .WithSummary("Listar lembretes da sessão")
           .WithDescription("Retorna todos os lembretes do sessionId informado, ordenados do mais recente para o mais antigo.")
           .Produces<Response>()
           .Produces(StatusCodes.Status400BadRequest);

    private static async Task<IResult> Handle(string? sessionId, DisposeContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return Results.BadRequest(new { error = "sessionId é obrigatório." });

        var reminders = await db.Reminders
            .Include(r => r.Point)
            .Where(r => r.SessionId == sessionId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        var items = reminders.Select(r => new ReminderItem(
            r.Id, r.ItemType, r.ItemDesc,
            new PointSummary(r.Point.Name, r.Point.Address),
            r.Status, r.CreatedAt
        )).ToList();

        return Results.Ok(new Response(items));
    }
}
