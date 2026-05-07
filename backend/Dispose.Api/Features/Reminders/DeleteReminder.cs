using Dispose.Api.Data;

namespace Dispose.Api.Features.Reminders;

public static class DeleteReminder
{
    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapDelete("/api/reminders/{id:guid}", Handle)
           .WithName("DeleteReminder")
           .WithTags("Reminders")
           .WithSummary("Cancelar lembrete")
           .WithDescription("Remove permanentemente o lembrete. Operação irreversível. Retorna 204 No Content.")
           .Produces(StatusCodes.Status204NoContent)
           .Produces(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(Guid id, DisposeContext db, CancellationToken ct)
    {
        var reminder = await db.Reminders.FindAsync([id], ct);
        if (reminder is null)
            return Results.NotFound(new { error = $"Lembrete {id} não encontrado." });

        db.Reminders.Remove(reminder);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
