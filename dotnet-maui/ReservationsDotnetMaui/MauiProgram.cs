using LaunchDarkly.Hello;
using LaunchDarkly.Sdk.Client;
using LaunchDarkly.Sdk.Client.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Reflection;
using LaunchDarklyConfigBuilder = LaunchDarkly.Sdk.Client.ConfigurationBuilder;

namespace ReservationsDotnetMaui;

public static class MauiProgram
{
	public static ILdClient client = null!;
	private static IConfiguration? _configuration;

	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

		// Load configuration from appsettings.json
		var assembly = Assembly.GetExecutingAssembly();
		var configBuilder = new Microsoft.Extensions.Configuration.ConfigurationBuilder();
		
		// Try to load appsettings.json from embedded resources
		using var stream = assembly.GetManifestResourceStream("ReservationsDotnetMaui.appsettings.json");
		if (stream != null)
		{
			configBuilder.AddJsonStream(stream);
		}
		
		// Also try to load Development settings if in Debug mode
#if DEBUG
		using var devStream = assembly.GetManifestResourceStream("ReservationsDotnetMaui.appsettings.Development.json");
		if (devStream != null)
		{
			configBuilder.AddJsonStream(devStream);
		}
#endif
		
		_configuration = configBuilder.Build();
		
		// Initialize DemoParameters with configuration
		DemoParameters.Initialize(_configuration);

		if (string.IsNullOrEmpty(DemoParameters.MobileKey))
		{
			throw new ArgumentException("Mobile Key was not set. Set in appsettings.json or DemoParameters.cs .");
		}
		else
		{
			client = LdClient.Init(
				Configuration.Default(DemoParameters.MobileKey, LaunchDarklyConfigBuilder.AutoEnvAttributes.Enabled),
				DemoParameters.MakeDemoContext(),
				DemoParameters.SdkTimeout
			);
		}


#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
