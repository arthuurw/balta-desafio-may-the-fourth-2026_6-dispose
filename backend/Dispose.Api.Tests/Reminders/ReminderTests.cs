using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Dispose.Api.Tests.Reminders;

public class ReminderTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Returns400_WhenSessionIdEmpty()
    {
        var resp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId = "", itemType = "pilhas", pointId = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Returns400_WhenItemTypeEmpty()
    {
        var resp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId = "s1", itemType = "", pointId = 1 });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Returns400_WhenPointIdInvalid()
    {
        var resp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId = "s1", itemType = "pilhas", pointId = 0 });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Returns404_WhenPointNotFound()
    {
        var resp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId = "s1", itemType = "pilhas", pointId = 9999 });
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Returns201_WhenValid()
    {
        var sessionId = Guid.NewGuid().ToString();
        var resp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "pilhas", itemDesc = "bateria velha", pointId = 1 });
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("pendente", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Returns200_ListBySessionId()
    {
        var sessionId = Guid.NewGuid().ToString();
        await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "pilhas", pointId = 1 });
        var resp = await _client.GetAsync($"/api/reminders?sessionId={sessionId}");
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, body.GetProperty("reminders").GetArrayLength());
    }

    [Fact]
    public async Task Returns404_WhenCompleteNotFound()
    {
        var resp = await _client.PatchAsync($"/api/reminders/{Guid.NewGuid()}/complete", null);
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Returns200_StatusConcluido_WhenCompleted()
    {
        var sessionId = Guid.NewGuid().ToString();
        var createResp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "pilhas", pointId = 1 });
        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        var patchResp = await _client.PatchAsync($"/api/reminders/{id}/complete", null);
        patchResp.EnsureSuccessStatusCode();
        var body = await patchResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("concluido", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Returns404_WhenDeleteNotFound()
    {
        var resp = await _client.DeleteAsync($"/api/reminders/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Returns204_WhenDeleted()
    {
        var sessionId = Guid.NewGuid().ToString();
        var createResp = await _client.PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "oleo", pointId = 1 });
        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetString();

        var deleteResp = await _client.DeleteAsync($"/api/reminders/{id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // Verify no longer exists
        var listResp = await _client.GetAsync($"/api/reminders?sessionId={sessionId}");
        var body = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("reminders").GetArrayLength());
    }
}
