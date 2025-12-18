namespace ReservationsDotnetMaui.Models;

public class Desk
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string OfficeId { get; set; } = string.Empty;
    public bool IsReserved { get; set; }
    public string? ReservedBy { get; set; }
    public DateTime? ReservedUntil { get; set; }
}

