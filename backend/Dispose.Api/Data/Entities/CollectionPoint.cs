namespace Dispose.Api.Data.Entities;

public class CollectionPoint
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string AcceptedTypesJson { get; set; } = "[]";
    public string OpeningHours { get; set; } = string.Empty;
}
