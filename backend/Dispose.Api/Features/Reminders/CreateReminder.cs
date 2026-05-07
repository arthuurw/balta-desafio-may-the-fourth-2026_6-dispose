using Dispose.Api.Data;
using Dispose.Api.Data.Entities;

namespace Dispose.Api.Features.Reminders;

public static class CreateReminder
{
    public record Request(string SessionId, string ItemType, string? ItemDesc, int PointId);
    public record PointSummary(string Name, string Address);
    public record Response(Guid Id, string ItemType, string? ItemDesc, PointSummary Point, string Status, DateTime CreatedAt);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/reminders", Handle)
           .WithName("CreateReminder")
           .WithTags("Reminders")
           .WithSummary("Criar lembrete de descarte")
           .WithDescription("Cria um lembrete vinculado a um ponto de coleta. O sessionId identifica a sessão do usuário (gerado no frontend, sem autenticação).")
           .Produces<Response>(StatusCodes.Status201Created)
           .Produces(StatusCodes.Status400BadRequest)
           .Produces(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(Request req, DisposeContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.SessionId))
            return Results.BadRequest(new { error = "sessionId é obrigatório." });
        if (string.IsNullOrWhiteSpace(req.ItemType))
            return Results.BadRequest(new { error = "itemType é obrigatório." });
        if (req.PointId <= 0)
            return Results.BadRequest(new { error = "pointId inválido." });

        var point = await db.CollectionPoints.FindAsync([req.PointId], ct);
        if (point is null)
            return Results.NotFound(new { error = $"Ponto {req.PointId} não encontrado." });

        var reminder = new Reminder
        {
            SessionId = req.SessionId,
            ItemType = req.ItemType,
            ItemDesc = req.ItemDesc,
            PointId = req.PointId
        };

        db.Reminders.Add(reminder);
        await db.SaveChangesAsync(ct);

        return Results.Created(
            $"/api/reminders/{reminder.Id}",
            new Response(
                reminder.Id,
                reminder.ItemType,
                reminder.ItemDesc,
                new PointSummary(point.Name, point.Address),
                reminder.Status,
                reminder.CreatedAt));
    }
}
