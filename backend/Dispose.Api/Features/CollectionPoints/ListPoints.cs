using System.Text.Json;
using Dispose.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.CollectionPoints;

public static class ListPoints
{
    public record PointItem(
        int Id, string Name, string Address,
        double Latitude, double Longitude,
        List<string> AcceptedTypes, string OpeningHours);

    public record Response(List<PointItem> Points);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/collection-points", Handle)
           .WithName("ListCollectionPoints")
           .WithTags("CollectionPoints")
           .WithSummary("Listar todos os pontos de coleta")
           .WithDescription("Retorna todos os pontos de coleta cadastrados com tipos aceitos e horário de funcionamento.")
           .Produces<Response>();

    private static async Task<IResult> Handle(DisposeContext db, CancellationToken ct)
    {
        var points = await db.CollectionPoints.ToListAsync(ct);

        var items = points.Select(p => new PointItem(
            p.Id, p.Name, p.Address,
            p.Latitude, p.Longitude,
            JsonSerializer.Deserialize<List<string>>(p.AcceptedTypesJson) ?? [],
            p.OpeningHours
        )).ToList();

        return Results.Ok(new Response(items));
    }
}
