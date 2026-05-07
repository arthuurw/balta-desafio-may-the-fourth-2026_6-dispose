namespace Dispose.Api.Data.Entities;

public class CollectionSchedule
{
    public int Id { get; set; }
    public string Neighborhood { get; set; } = string.Empty;
    public string WasteType { get; set; } = string.Empty;
    public string DaysJson { get; set; } = "[]";
    public string TimeSlot { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
