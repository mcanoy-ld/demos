using System;
using LaunchDarkly.Sdk;
using Microsoft.Extensions.Configuration;

namespace LaunchDarkly.Hello
{
    // These values are used by all versions of the demo

    public static class DemoParameters
    {
        private static IConfiguration? _configuration;
        
        // Initialize with configuration (called from MauiProgram)
        public static void Initialize(IConfiguration? configuration)
        {
            _configuration = configuration;
        }
        
        // MobileKey is loaded from appsettings.json (MAUI), environment variable, or fallback
        public static string MobileKey
        {
            get
            {
                // Try configuration first (for MAUI app)
                var configKey = _configuration?["LaunchDarkly:MobileKey"];
                if (!string.IsNullOrEmpty(configKey))
                {
                    return configKey;
                }
                
                // Try environment variable
                var envKey = Environment.GetEnvironmentVariable("LAUNCHDARKLY_MOBILE_KEY");
                if (!string.IsNullOrEmpty(envKey))
                {
                    return envKey;
                }
                
                // Fallback: throw error with helpful message
                throw new InvalidOperationException(
                    "Mobile Key was not set. Please set 'LaunchDarkly:MobileKey' in appsettings.json " +
                    "or set the LAUNCHDARKLY_MOBILE_KEY environment variable.");
            }
        }

        // Set FeatureFlagKey to the feature flag key you want to evaluate.
        public const string FeatureFlagKey = "hello-maui";

        // Set up the evaluation context. This context should appear on your LaunchDarkly
        // contexts dashboard soon after you run the demo.
        public static Context MakeDemoContext() =>
            Context.Builder("example-user-key")
                .Name("Sandy")
                .Build();

        // How long the application will wait for the SDK to connect to LaunchDarkly
        public static TimeSpan SdkTimeout = TimeSpan.FromSeconds(10);
    }
}
