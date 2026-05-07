using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dispose.Api.Agents;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Dispose.Api.Tests.Chat;

public class ChatTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Returns400_WhenMessageEmpty()
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "" });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Returns400_WhenMessageTooLong()
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = new string('x', 1001) });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Returns200_WithScheduleInfo_WhenAgentResponds()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("schedule_info", "Coleta às terças.", neighborhood: "Centro", wasteType: "reciclavel")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "Quando coleta?", neighborhood = "Centro" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("schedule_info", body.GetProperty("action").GetString());
        Assert.Equal("Coleta às terças.", body.GetProperty("reply").GetString());
    }

    [Fact]
    public async Task Returns502_WhenAgentThrows()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new AgentException("LLM indisponível."));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "test" });
        Assert.Equal(HttpStatusCode.BadGateway, resp.StatusCode);
    }

    [Fact]
    public async Task Returns200_WithRemindersList_WhenAgentReturnsListReminders()
    {
        var sessionId = Guid.NewGuid().ToString();
        await factory.CreateClient().PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "pilhas", pointId = 1 });

        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("list_reminders", "Você tem 1 lembrete pendente.")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId, message = "quais meus lembretes?" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("list_reminders", body.GetProperty("action").GetString());
        Assert.Equal(1, body.GetProperty("reminders").GetArrayLength());
    }

    [Fact]
    public async Task Returns200_EmptyRemindersList_WhenNoRemindersExist()
    {
        var sessionId = Guid.NewGuid().ToString();
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("list_reminders", "Nenhum lembrete pendente.")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId, message = "quais meus lembretes?" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("reminders").GetArrayLength());
    }

    [Fact]
    public async Task Returns200_WithCreatedReminder_WhenAgentReturnsCreateReminder()
    {
        var sessionId = Guid.NewGuid().ToString();
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("create_reminder", "Lembrete criado!", itemType: "pilhas", suggestedPointId: 1)));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId, message = "cria um lembrete para pilhas" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("create_reminder", body.GetProperty("action").GetString());
        Assert.Equal("pilhas", body.GetProperty("createdReminder").GetProperty("itemType").GetString());
        Assert.Equal("pendente", body.GetProperty("createdReminder").GetProperty("status").GetString());
    }

    [Fact]
    public async Task Returns200_WithCompletedReminderId_WhenAgentReturnsCompleteReminder()
    {
        var sessionId = Guid.NewGuid().ToString();
        var createResp = await factory.CreateClient().PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "pilhas", pointId = 1 });
        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var reminderId = created.GetProperty("id").GetString()!;

        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("complete_reminder", "Lembrete concluído!", reminderId: reminderId)));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId, message = "já descartei as pilhas" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("complete_reminder", body.GetProperty("action").GetString());
        Assert.Equal(reminderId, body.GetProperty("completedReminderId").GetString());
    }

    [Fact]
    public async Task Returns200_WithDeletedReminderId_WhenAgentReturnsDeleteReminder()
    {
        var sessionId = Guid.NewGuid().ToString();
        var createResp = await factory.CreateClient().PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "oleo", pointId = 1 });
        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var reminderId = created.GetProperty("id").GetString()!;

        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("delete_reminder", "Lembrete cancelado.", reminderId: reminderId)));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId, message = "cancela o lembrete de óleo" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("delete_reminder", body.GetProperty("action").GetString());
        Assert.Equal(reminderId, body.GetProperty("deletedReminderId").GetString());

        // Verify reminder was actually deleted from DB
        var listResp = await factory.CreateClient().GetAsync($"/api/reminders?sessionId={sessionId}");
        var listBody = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, listBody.GetProperty("reminders").GetArrayLength());
    }

    [Fact]
    public async Task Returns200_WithNextCollectionInfo_WhenAgentReturnsNextCollection()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("next_collection", "Próxima coleta de orgânico é na quarta.",
                neighborhood: "Centro", wasteType: "organico", nextDay: "quarta", daysUntil: 2)));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "quando é a próxima coleta?", neighborhood = "Centro" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("next_collection", body.GetProperty("action").GetString());
        var nc = body.GetProperty("nextCollection");
        Assert.Equal("organico", nc.GetProperty("wasteType").GetString());
        Assert.Equal("quarta", nc.GetProperty("nextDay").GetString());
        Assert.Equal(2, nc.GetProperty("daysUntil").GetInt32());
    }

    [Fact]
    public async Task Returns200_WithFilteredPoints_WhenAgentReturnsFilterPoints()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("filter_points", "Pontos que aceitam pilhas.", itemType: "pilhas")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "quais pontos aceitam pilhas?" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("filter_points", body.GetProperty("action").GetString());
        var pts = body.GetProperty("filteredPoints");
        Assert.True(pts.GetArrayLength() > 0);
        var first = pts[0];
        Assert.True(first.GetProperty("id").GetInt32() > 0);
        Assert.NotEmpty(first.GetProperty("name").GetString()!);
        var types = first.GetProperty("acceptedTypes").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("pilhas", types);
    }

    [Fact]
    public async Task CurrentDateInjectedInPrompt()
    {
        string? capturedPrompt = null;
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Do<string>(p => capturedPrompt = p), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("general_reply", "Ok!")));

        var client = WithMockAgent(mock);
        await client.PostAsJsonAsync("/api/chat", new { sessionId = "s1", message = "oi" });

        Assert.NotNull(capturedPrompt);
        Assert.Contains("[Data atual:", capturedPrompt);
    }

    [Fact]
    public async Task PendingRemindersInjectedInPrompt_WhenSessionHasReminders()
    {
        var sessionId = Guid.NewGuid().ToString();
        await factory.CreateClient().PostAsJsonAsync("/api/reminders",
            new { sessionId, itemType = "eletronicos", pointId = 1 });

        string? capturedPrompt = null;
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Do<string>(p => capturedPrompt = p), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("general_reply", "Ok!")));

        var client = WithMockAgent(mock);
        await client.PostAsJsonAsync("/api/chat", new { sessionId, message = "oi" });

        Assert.NotNull(capturedPrompt);
        Assert.Contains("[Lembretes pendentes]", capturedPrompt);
        Assert.Contains("eletronicos", capturedPrompt);
    }

    [Fact]
    public async Task Returns200_WithCreatedSchedule_WhenAgentReturnsCreateSchedule()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("create_schedule", "Agenda cadastrada!",
                neighborhood: "Santana", wasteType: "poda",
                scheduleDays: ["segunda", "quinta"], timeSlot: "07:00 às 12:00")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "cadastra agenda de poda na Santana, segunda e quinta, das 07:00 às 12:00" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("create_schedule", body.GetProperty("action").GetString());
        var cs = body.GetProperty("createdSchedule");
        Assert.Equal("Santana", cs.GetProperty("neighborhood").GetString());
        Assert.Equal("poda", cs.GetProperty("wasteType").GetString());
        Assert.Equal(2, cs.GetProperty("days").GetArrayLength());
    }

    [Fact]
    public async Task Returns200_WithCreatedPoint_WhenAgentReturnsCreatePoint()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("create_point", "Ponto cadastrado!",
                pointName: "Farmácia Teste", pointAddress: "Rua A, 1",
                pointAcceptedTypes: ["medicamentos"], pointOpeningHours: "08:00 às 18:00")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "cadastra ponto de medicamentos", lat = -23.55, lng = -46.63 });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("create_point", body.GetProperty("action").GetString());
        var cp = body.GetProperty("createdPoint");
        Assert.Equal("Farmácia Teste", cp.GetProperty("name").GetString());
        Assert.Contains("medicamentos", cp.GetProperty("acceptedTypes").EnumerateArray().Select(e => e.GetString()));
    }

    [Fact]
    public async Task Returns200_GeneralReply_WhenCreatePointWithoutGps()
    {
        var mock = Substitute.For<ICollectionAgent>();
        mock.AskAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(Dto("create_point", "Ponto cadastrado!",
                pointName: "Farmácia Teste", pointAddress: "Rua A, 1",
                pointAcceptedTypes: ["medicamentos"], pointOpeningHours: "08:00 às 18:00")));

        var client = WithMockAgent(mock);
        var resp = await client.PostAsJsonAsync("/api/chat",
            new { sessionId = "s1", message = "cadastra ponto de medicamentos" });
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("general_reply", body.GetProperty("action").GetString());
    }

    // Helper to build AgentResponseDto without positional noise
    private static AgentResponseDto Dto(
        string action, string? reply = null,
        string? neighborhood = null, string? wasteType = null,
        string? itemType = null, int? suggestedPointId = null,
        string? reminderId = null, string? nextDay = null, int? daysUntil = null,
        List<string>? scheduleDays = null, string? timeSlot = null, string? scheduleNotes = null,
        string? pointName = null, string? pointAddress = null,
        List<string>? pointAcceptedTypes = null, string? pointOpeningHours = null) =>
        new(action, reply, neighborhood, wasteType, itemType, suggestedPointId, reminderId, nextDay, daysUntil,
            scheduleDays, timeSlot, scheduleNotes, pointName, pointAddress, pointAcceptedTypes, pointOpeningHours);

    private HttpClient WithMockAgent(ICollectionAgent mock) =>
        factory.WithWebHostBuilder(b =>
            b.ConfigureServices(services =>
            {
                var desc = services.Single(d => d.ServiceType == typeof(ICollectionAgent));
                services.Remove(desc);
                services.AddSingleton(mock);
            })).CreateClient();
}
