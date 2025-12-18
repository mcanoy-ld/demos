namespace ReservationsDotnetMaui;

public static class UserService
{
    public static string? CurrentUser { get; set; }
    
    public static string GetInitial()
    {
        if (string.IsNullOrEmpty(CurrentUser))
            return "?";
        
        return CurrentUser.Substring(0, 1).ToUpper();
    }
}
