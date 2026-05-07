using Dispose.Api.Agents;
using Dispose.Api.Data;
using Dispose.Api.Infrastructure.Llm;
using Microsoft.EntityFrameworkCore;

namespace Dispose.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static WebApplicationBuilder AddInfrastructure(this WebApplicationBuilder builder)
    {
        builder.Services.AddDbContext<DisposeContext>(opt =>
            opt.UseSqlite(builder.Configuration.GetConnectionString("Default")));

        builder.Services.AddSingleton<ICollectionAgent>(sp =>
            new CollectionAgent(GroqClientFactory.Create(
                sp.GetRequiredService<IConfiguration>(),
                sp.GetRequiredService<ILoggerFactory>())));

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(o =>
            o.CustomSchemaIds(t => t.FullName?.Replace("+", ".")));

        builder.Services.AddCors(opt =>
            opt.AddDefaultPolicy(p =>
                p.WithOrigins("http://localhost:3000", "http://localhost:3001")
                 .AllowAnyHeader()
                 .AllowAnyMethod()));

        return builder;
    }
}
