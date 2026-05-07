using System.Text.Json;
using Dispose.Api.Data;
using Dispose.Api.Data.Entities;

namespace Dispose.Api.Features.CollectionPoints;

public static class CreateCollectionPoint
{
    private static readonly HashSet<string> ValidTypes =
        ["pilhas", "eletronicos", "medicamentos", "oleo"];

    public record Request(
        string Name,
        string Address,
        double Latitude,
        double Longitude,
        List<string> AcceptedTypes,
        string OpeningHours);

    public record Response(
        int Id,
        string Name,
        string Address,
        double Latitude,
        double Longitude,
        List<string> AcceptedTypes,
        string OpeningHours);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapPost("/api/collection-points", Handle)
           .WithName("CreateCollectionPoint")
           .WithTags("CollectionPoints")
           .WithSummary("Cadastrar ponto de coleta")
           .WithDescription("Cria um novo ponto de coleta especial. Tipos aceitos válidos: pilhas, eletronicos, medicamentos, oleo.")
           .Produces<Response>(StatusCodes.Status201Created)
           .Produces(StatusCodes.Status400BadRequest);

    private static async Task<IResult> Handle(Request req, DisposeContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "name é obrigatório." });

        if (string.IsNullOrWhiteSpace(req.Address))
            return Results.BadRequest(new { error = "address é obrigatório." });

        if (req.Latitude is < -90 or > 90)
            return Results.BadRequest(new { error = "latitude deve estar entre -90 e 90." });

        if (req.Longitude is < -180 or > 180)
            return Results.BadRequest(new { error = "longitude deve estar entre -180 e 180." });

        if (req.AcceptedTypes is null || req.AcceptedTypes.Count == 0)
            return Results.BadRequest(new { error = "acceptedTypes não pode ser vazio." });

        var normalised = req.AcceptedTypes.Select(t => t.Trim().ToLower()).Distinct().ToList();
        var invalid = normalised.Where(t => !ValidTypes.Contains(t)).ToList();
        if (invalid.Count > 0)
            return Results.BadRequest(new { error = $"Tipos inválidos: {string.Join(", ", invalid)}. Válidos: pilhas, eletronicos, medicamentos, oleo." });

        if (string.IsNullOrWhiteSpace(req.OpeningHours))
            return Results.BadRequest(new { error = "openingHours é obrigatório." });

        var point = new CollectionPoint
        {
            Name = req.Name.Trim(),
            Address = req.Address.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            AcceptedTypesJson = JsonSerializer.Serialize(normalised),
            OpeningHours = req.OpeningHours.Trim()
        };

        db.CollectionPoints.Add(point);
        await db.SaveChangesAsync(ct);

        return Results.Created(
            $"/api/collection-points/{point.Id}",
            new Response(point.Id, point.Name, point.Address,
                         point.Latitude, point.Longitude, normalised, point.OpeningHours));
    }
}
