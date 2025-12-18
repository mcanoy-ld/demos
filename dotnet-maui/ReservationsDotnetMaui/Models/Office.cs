namespace ReservationsDotnetMaui.Models;

public class Office
{
    public string Name { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    
    public static List<Office> GetOffices()
    {
        return new List<Office>
        {
            new Office { Id = "la", Name = "Los Angeles" },
            new Office { Id = "burbank", Name = "Burbank" },
            new Office { Id = "glendale", Name = "Glendale" },
            new Office { Id = "losfeliz", Name = "Los Feliz" },
            new Office { Id = "hollywood", Name = "Hollywood" }
        };
    }
}

