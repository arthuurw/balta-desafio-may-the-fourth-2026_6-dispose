using System.Text.Json;
using Dispose.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.Schedule;

public static class GetSchedule
{
    public record ScheduleItem(string WasteType, List<string> Days, string TimeSlot, string? Notes);
    public record Response(string Neighborhood, List<ScheduleItem> Schedules);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/schedule", Handle)
           .WithName("GetSchedule")
           .WithTags("Schedule")
           .WithSummary("Consultar agenda de coleta por bairro")
           .WithDescription("Retorna os dias e horários de coleta de cada tipo de resíduo para o bairro informado.")
           .Produces<Response>()
           .Produces(StatusCodes.Status400BadRequest)
           .Produces(StatusCodes.Status404NotFound);

    private static async Task<IResult> Handle(
        string? neighborhood,
        DisposeContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(neighborhood))
            return Results.BadRequest(new { error = "neighborhood é obrigatório." });

        var schedules = await db.CollectionSchedules
            .Where(s => s.Neighborhood.ToLower() == neighborhood.ToLower())
            .ToListAsync(ct);

        if (schedules.Count == 0)
            return Results.NotFound(new { error = $"Nenhum dado encontrado para '{neighborhood}'." });

        var items = schedules.Select(s => new ScheduleItem(
            s.WasteType,
            JsonSerializer.Deserialize<List<string>>(s.DaysJson) ?? [],
            s.TimeSlot,
            s.Notes
        )).ToList();

        return Results.Ok(new Response(neighborhood, items));
    }
}
