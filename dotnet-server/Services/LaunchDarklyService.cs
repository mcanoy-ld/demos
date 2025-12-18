

using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;
using LaunchDarkly.Logging;

namespace MyApp.Namespace
{
    public class LaunchDarklyService{
        public static LdClient CreateLdClient( string sdkKey){
                

            if (string.IsNullOrEmpty(sdkKey))
            {
                Console.WriteLine("*** Please set LAUNCHDARKLY_SDK_KEY environment variable to your LaunchDarkly SDK key first\n");
                Environment.Exit(1);
            }
            var ldConfig = Configuration.Builder(sdkKey)
                            .Events(
                                    Components.SendEvents().FlushInterval(TimeSpan.FromSeconds(5)).Capacity(50000)
                                    
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
                Console.WriteLine("*** SDK successfully initialized!\n");
            }
            else
            {
                Console.WriteLine("*** SDK failed to initialize\n");
                
            }     
            return ldClient;    
        }
    }
}
