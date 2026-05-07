using System.Text.Json;
using Dispose.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Features.CollectionPoints;

public static class NearbyPoints
{
    public record PointItem(
        int Id, string Name, string Address,
        int DistanceMeters,
        List<string> AcceptedTypes, string OpeningHours);

    public record Response(List<PointItem> Points);

    public static void MapEndpoint(IEndpointRouteBuilder app) =>
        app.MapGet("/api/collection-points/nearby", Handle)
           .WithName("GetNearbyPoints")
           .WithTags("CollectionPoints")
           .WithSummary("Buscar pontos de coleta próximos")
           .WithDescription("Retorna pontos de coleta dentro do raio informado (padrão 2000m), ordenados por distância. Filtra por tipo de resíduo se wasteType for fornecido. Distância calculada via fórmula Haversine.")
           .Produces<Response>()
           .Produces(StatusCodes.Status400BadRequest);

    private static async Task<IResult> Handle(
        double? lat, double? lng,
        int radius = 2000,
        string? wasteType = null,
        DisposeContext db = default!,
        CancellationToken ct = default)
    {
        if (lat is null || lng is null)
            return Results.BadRequest(new { error = "lat e lng são obrigatórios." });

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            return Results.BadRequest(new { error = "lat/lng fora do intervalo válido." });

        if (radius <= 0)
            return Results.BadRequest(new { error = "radius deve ser maior que zero." });

        var all = await db.CollectionPoints.ToListAsync(ct);

        var result = all
            .Select(p =>
            {
                var types = JsonSerializer.Deserialize<List<string>>(p.AcceptedTypesJson) ?? [];
                var dist = (int)Haversine(lat.Value, lng.Value, p.Latitude, p.Longitude);
                return (p, types, dist);
            })
            .Where(x => x.dist <= radius)
            .Where(x => wasteType is null
                || x.types.Contains(wasteType, StringComparer.OrdinalIgnoreCase))
            .OrderBy(x => x.dist)
            .Select(x => new PointItem(x.p.Id, x.p.Name, x.p.Address, x.dist, x.types, x.p.OpeningHours))
            .ToList();

        return Results.Ok(new Response(result));
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
