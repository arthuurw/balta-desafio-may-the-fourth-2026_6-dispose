namespace Dispose.Api.Agents;

public record AgentResponseDto(
    string Action,
    string? Reply,
    string? Neighborhood,
    string? WasteType,
    string? ItemType,
    int? SuggestedPointId,
    string? ReminderId,
    string? NextDay,
    int? DaysUntil,
    List<string>? ScheduleDays,
    string? TimeSlot,
    string? ScheduleNotes,
    string? PointName,
    string? PointAddress,
    List<string>? PointAcceptedTypes,
    string? PointOpeningHours
);
