using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Dispose.Api.Tests.Schedule;

public class GetScheduleTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Returns400_WhenNeighborhoodMissing()
    {
        var response = await _client.GetAsync("/api/schedule");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Returns404_WhenNeighborhoodNotFound()
    {
        var response = await _client.GetAsync("/api/schedule?neighborhood=Inexistente");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Returns200_WithSchedules_WhenNeighborhoodExists()
    {
        var response = await _client.GetAsync("/api/schedule?neighborhood=Centro");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Centro", body.GetProperty("neighborhood").GetString());
        Assert.True(body.GetProperty("schedules").GetArrayLength() > 0);
    }
}
