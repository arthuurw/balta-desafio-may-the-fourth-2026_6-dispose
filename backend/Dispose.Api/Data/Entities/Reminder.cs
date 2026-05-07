namespace Dispose.Api.Data.Entities;

public class Reminder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SessionId { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public string? ItemDesc { get; set; }
    public int PointId { get; set; }
    public CollectionPoint Point { get; set; } = null!;
    public string Status { get; set; } = "pendente";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
