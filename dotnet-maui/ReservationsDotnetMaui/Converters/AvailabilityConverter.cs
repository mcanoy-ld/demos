using System.Globalization;

namespace ReservationsDotnetMaui.Converters;

public class AvailabilityConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isReserved)
        {
            return isReserved ? "Reserved" : "Available";
        }
        return "Available";
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

