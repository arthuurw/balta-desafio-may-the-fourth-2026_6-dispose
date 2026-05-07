using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace Dispose.Api.Agents;

internal sealed class CollectionAgent(ChatClientAgent agent) : ICollectionAgent
{
    private static readonly ChatClientAgentRunOptions RunOptions = new()
    {
        ChatOptions = new ChatOptions { ResponseFormat = ChatResponseFormat.Json }
    };

    public async Task<AgentResponseDto> AskAsync(string prompt, CancellationToken ct = default)
    {
        var raw = await InvokeAgentAsync(prompt, ct);
        var parsed = TryParse(raw);

        if (parsed is not null) return parsed;

        var retry = await InvokeAgentAsync(
            prompt + "\n\n[IMPORTANTE: responda SOMENTE com JSON válido, sem texto adicional]", ct);

        return TryParse(retry)
            ?? throw new AgentException("O agente retornou JSON inválido após retry.");
    }

    private async Task<string?> InvokeAgentAsync(string prompt, CancellationToken ct)
    {
        try
        {
            var session = await agent.CreateSessionAsync(ct);
            var response = await agent.RunAsync(prompt, session, RunOptions, ct);
            return response.Text;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new AgentException("Falha na comunicação com o agente LLM.", ex);
        }
    }

    private static AgentResponseDto? TryParse(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        try
        {
            using var doc = JsonDocument.Parse(text);
            var root = doc.RootElement;

            var action = root.TryGetProperty("action", out var a)
                ? a.GetString() ?? "unknown"
                : "unknown";

            string? Get(string key) =>
                root.TryGetProperty(key, out var v) ? v.GetString() : null;

            int? pointId = null;
            if (root.TryGetProperty("suggestedPointId", out var sp)
                && sp.ValueKind == JsonValueKind.Number)
                pointId = sp.GetInt32();

            int? daysUntil = null;
            if (root.TryGetProperty("daysUntil", out var du)
                && du.ValueKind == JsonValueKind.Number)
                daysUntil = du.GetInt32();

            List<string>? GetList(string key)
            {
                if (!root.TryGetProperty(key, out var v) || v.ValueKind != JsonValueKind.Array) return null;
                return v.EnumerateArray()
                        .Select(e => e.GetString() ?? "")
                        .Where(s => s.Length > 0)
                        .ToList();
            }

            return new AgentResponseDto(
                Action: action,
                Reply: Get("reply"),
                Neighborhood: Get("neighborhood"),
                WasteType: Get("wasteType"),
                ItemType: Get("itemType"),
                SuggestedPointId: pointId,
                ReminderId: Get("reminderId"),
                NextDay: Get("nextDay"),
                DaysUntil: daysUntil,
                ScheduleDays: GetList("scheduleDays"),
                TimeSlot: Get("timeSlot"),
                ScheduleNotes: Get("notes"),
                PointName: Get("pointName"),
                PointAddress: Get("pointAddress"),
                PointAcceptedTypes: GetList("pointAcceptedTypes"),
                PointOpeningHours: Get("pointOpeningHours")
            );
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
