namespace ReservationsDotnetMaui.Services;

public static class ContextService
{
    public static string? CurrentOffice { get; set; }
    public static string? CurrentUser { get; set; }

    public static string GetContextDisplay()
    {
        var parts = new List<string>();
        
        if (!string.IsNullOrEmpty(CurrentUser))
        {
            parts.Add($"User: {CurrentUser}");
        }
        
        if (!string.IsNullOrEmpty(CurrentOffice))
        {
            parts.Add($"Office: {CurrentOffice}");
        }
        
        return parts.Count > 0 ? string.Join(" | ", parts) : "No context";
    }
}

