namespace ReservationsDotnetMaui.Models;

public class ConferenceRoom
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string OfficeId { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public bool IsReserved { get; set; }
    public string? ReservedBy { get; set; }
    public DateTime? ReservedUntil { get; set; }
}

