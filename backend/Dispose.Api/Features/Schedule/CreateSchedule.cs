using System.Text.Json;
using Dispose.Api.Data;
using Dispose.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.Schedule;

public static class CreateSchedule
{
    public record Request(
        string Neighborhood,
        string WasteType,
        List<string> Days,
        string TimeSlot,
        string? Notes);

    public record Response(int Id, string Neighborhood, string WasteType, List<string> Days, string TimeSlot, string? Notes);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/schedule", Handle)
           .WithName("CreateSchedule")
           .WithTags("Schedule")
           .WithSummary("Cadastrar nova agenda de coleta")
           .WithDescription("Cria uma agenda de coleta para um bairro e tipo de resíduo. Retorna 409 se já existir agenda para a combinação bairro + tipo.")
           .Produces<Response>(StatusCodes.Status201Created)
           .Produces(StatusCodes.Status400BadRequest)
           .Produces(StatusCodes.Status409Conflict);

    private static async Task<IResult> Handle(
        Request req,
        DisposeContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Neighborhood))
            return Results.BadRequest(new { error = "neighborhood é obrigatório." });

        if (string.IsNullOrWhiteSpace(req.WasteType))
            return Results.BadRequest(new { error = "wasteType é obrigatório." });

        if (req.Days is null || req.Days.Count == 0)
            return Results.BadRequest(new { error = "days não pode ser vazio." });

        if (string.IsNullOrWhiteSpace(req.TimeSlot))
            return Results.BadRequest(new { error = "timeSlot é obrigatório." });

        var exists = await db.CollectionSchedules.AnyAsync(
            s => s.Neighborhood.ToLower() == req.Neighborhood.ToLower()
              && s.WasteType.ToLower() == req.WasteType.ToLower(), ct);

        if (exists)
            return Results.Conflict(new { error = $"Já existe agenda de '{req.WasteType}' para '{req.Neighborhood}'." });

        var schedule = new CollectionSchedule
        {
            Neighborhood = req.Neighborhood.Trim(),
            WasteType = req.WasteType.Trim().ToLower(),
            DaysJson = JsonSerializer.Serialize(req.Days),
            TimeSlot = req.TimeSlot.Trim(),
            Notes = req.Notes?.Trim()
        };

        db.CollectionSchedules.Add(schedule);
        await db.SaveChangesAsync(ct);

        return Results.Created(
            $"/api/schedule?neighborhood={Uri.EscapeDataString(schedule.Neighborhood)}",
            new Response(schedule.Id, schedule.Neighborhood, schedule.WasteType,
                         req.Days, schedule.TimeSlot, schedule.Notes));
    }
}
