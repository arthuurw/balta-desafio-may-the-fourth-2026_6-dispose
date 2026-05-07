using Dispose.Api.Data;

namespace Dispose.Api.Features.Reminders;

public static class CompleteReminder
{
    public record Response(Guid Id, string Status);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPatch("/api/reminders/{id:guid}/complete", Handle)
           .WithName("CompleteReminder")
           .WithTags("Reminders")
           .WithSummary("Concluir lembrete")
           .WithDescription("Marca o lembrete como 'concluido'. Operação idempotente — pode ser chamada mais de uma vez sem efeito colateral.")
           .Produces<Response>()
           .Produces(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(Guid id, DisposeContext db, CancellationToken ct)
    {
        var reminder = await db.Reminders.FindAsync([id], ct);
        if (reminder is null)
            return Results.NotFound(new { error = $"Lembrete {id} não encontrado." });

        reminder.Status = "concluido";
        await db.SaveChangesAsync(ct);

        return Results.Ok(new Response(reminder.Id, reminder.Status));
    }
}
