using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Dispose.Api.Tests.CollectionPoints;

public class NearbyPointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Returns400_WhenLatMissing()
    {
        var response = await _client.GetAsync("/api/collection-points/nearby?lng=-46.63");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Returns400_WhenLatOutOfRange()
    {
        var response = await _client.GetAsync("/api/collection-points/nearby?lat=200&lng=-46.63");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Returns200_EmptyList_WhenNothingInRadius()
    {
        var response = await _client.GetAsync("/api/collection-points/nearby?lat=0&lng=0&radius=100");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("points").GetArrayLength());
    }

    [Fact]
    public async Task Returns200_OnlyMatchingWasteType()
    {
        var response = await _client.GetAsync(
            "/api/collection-points/nearby?lat=-23.55&lng=-46.63&radius=5000&wasteType=oleo");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        var points = body.GetProperty("points");
        Assert.True(points.GetArrayLength() > 0);
        foreach (var point in points.EnumerateArray())
        {
            var types = point.GetProperty("acceptedTypes")
                .EnumerateArray().Select(t => t.GetString()).ToList();
            Assert.Contains("oleo", types);
        }
    }
}
