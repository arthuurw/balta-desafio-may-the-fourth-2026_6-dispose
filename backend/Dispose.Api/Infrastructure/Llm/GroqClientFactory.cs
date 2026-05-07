using System.ClientModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;

namespace Dispose.Api.Infrastructure.Llm;

internal static class GroqClientFactory
{
    public static ChatClientAgent Create(IConfiguration config, ILoggerFactory loggerFactory)
    {
        var client = new OpenAIClient(
            new ApiKeyCredential(config["Llm:ApiKey"]!),
            new OpenAIClientOptions { Endpoint = new Uri(config["Llm:BaseUrl"]!) }
        );

        var instructions = File.ReadAllText(
            Path.Combine(AppContext.BaseDirectory, "agents", "agente-coleta.md"));

        return client.GetChatClient(config["Llm:Model"]!)
            .AsIChatClient()
            .AsBuilder()
            .UseLogging(loggerFactory)
            .BuildAIAgent(
                name: "CollectionAgent",
                description: "Agente especializado em informar calendários de coleta e pontos de descarte urbano.",
                instructions: instructions,
                loggerFactory: loggerFactory);
    }
}
