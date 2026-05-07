using Dispose.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.AddInfrastructure();

var app = builder.Build();

await app.SetupDatabaseAsync();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapEndpoints();

await app.RunAsync();

public partial class Program { }