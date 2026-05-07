using Dispose.Api.Data;
using Dispose.Api.Features.Chat;
using Dispose.Api.Features.CollectionPoints;
using Dispose.Api.Features.Reminders;
using Dispose.Api.Features.Schedule;


namespace Dispose.Api.Extensions;

public static class WebApplicationExtensions
{
    public static async Task SetupDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DisposeContext>();
        await db.Database.EnsureCreatedAsync();
        SeedData.Seed(db);
    }

    public static WebApplication MapEndpoints(this WebApplication app)
    {
        GetSchedule.MapEndpoint(app);
        CreateSchedule.MapEndpoint(app);
        ListPoints.MapEndpoint(app);
        NearbyPoints.MapEndpoint(app);
        CreateCollectionPoint.MapEndpoint(app);
        CreateReminder.MapEndpoint(app);
        ListReminders.MapEndpoint(app);
        CompleteReminder.MapEndpoint(app);
        DeleteReminder.MapEndpoint(app);
        Chat.MapEndpoint(app);
        return app;
    }
}
