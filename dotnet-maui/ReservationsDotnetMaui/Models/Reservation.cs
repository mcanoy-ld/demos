namespace ReservationsDotnetMaui.Models;

public class Reservation
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string OfficeId { get; set; } = string.Empty;
    public string? DeskId { get; set; }
    public string? ConferenceRoomId { get; set; }
    public DateTime ReservedAt { get; set; }
    public DateTime ReservedUntil { get; set; }
    public bool IsActive { get; set; } = true;
}

