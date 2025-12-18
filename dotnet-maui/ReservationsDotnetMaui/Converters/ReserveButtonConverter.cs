using System.Globalization;

namespace ReservationsDotnetMaui.Converters;

public class ReserveButtonConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isReserved)
        {
            return isReserved ? "Reserved" : "Reserve";
        }
        return "Reserve";
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

