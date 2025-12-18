using System.Globalization;
using Microsoft.Maui.Graphics;

namespace ReservationsDotnetMaui.Converters;

public class AvailabilityColorConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isReserved)
        {
            var color = isReserved ? Color.FromArgb("#FF6B6B6B") : Color.FromArgb("#00844B");
            
            // If parameter is provided and is a number, apply opacity
            if (parameter != null && double.TryParse(parameter.ToString(), out double opacity))
            {
                return Color.FromRgba(color.Red, color.Green, color.Blue, opacity);
            }
            
            return color;
        }
        return Color.FromArgb("#919191");
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

