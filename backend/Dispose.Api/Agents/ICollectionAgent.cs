namespace Dispose.Api.Agents;

public interface ICollectionAgent
{
    Task<AgentResponseDto> AskAsync(string prompt, CancellationToken ct = default);
}
