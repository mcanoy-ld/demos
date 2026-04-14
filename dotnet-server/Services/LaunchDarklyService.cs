using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Sdk.Server.Interfaces;
using LaunchDarkly.Logging;
using Microsoft.Extensions.Logging;

namespace MyApp.Namespace
{
    public class LaunchDarklyService
    {
        public static LdClient CreateLdClient(string sdkKey, ILogger logger)
        {
            if (string.IsNullOrEmpty(sdkKey))
            {
                logger.LogCritical(
                    "LaunchDarkly SDK key is not set. Set LaunchDarkly:SdkKey in configuration or LAUNCHDARKLY_SDK_KEY.");
                Environment.Exit(1);
            }
            var ldConfig = Configuration.Builder(sdkKey)
                            .ApplicationInfo(Components.ApplicationInfo()
                                .ApplicationId("dotnet-server-demo")
                                .ApplicationName("dotnet-server-demo")
                                .ApplicationVersion("1.0.0")
                                .ApplicationVersionName("v1")
                            )
                            .Events(
                                    Components.SendEvents()
                                        .FlushInterval(TimeSpan.FromSeconds(5))
                                        .Capacity(50000)
                                        .PrivateAttributes("name", "phone_number")
                                )
                            
                            .StartWaitTime(TimeSpan.FromSeconds(5))
                            .ServiceEndpoints(Components.ServiceEndpoints()
                            .Streaming("https://stream.launchdarkly.com")
                            .Polling("https://sdk.launchdarkly.com")
                            .Events("https://events.launchdarkly.com"))
                            .Offline(false)
                            .Logging(
                                Components.Logging(Logs.ToWriter(Console.Out)).Level(LaunchDarkly.Logging.LogLevel.Debug)
                            )
                            .Build();
            
            LdClient ldClient = new LdClient(ldConfig);
            
            
            if (ldClient.Initialized)
            {
                logger.LogInformation("LaunchDarkly SDK successfully initialized");
                ldClient.FlagTracker.FlagChanged += (_, e) =>
                {
                    logger.LogInformation(
                        "LaunchDarkly flag change: configuration updated for flag key {FlagKey}",
                        e.Key);
                };
            }
            else
            {
                logger.LogError("LaunchDarkly SDK failed to initialize");
            }

            return ldClient;    
        }
    }
}
