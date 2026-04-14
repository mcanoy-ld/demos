using System.Globalization;
using System.Text;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using LaunchDarkly.Sdk;
using LaunchDarkly.Sdk.Server;


namespace MyApp.Namespace
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeatureFlagController(ILogger<FeatureFlagController> logger) : ControllerBase
    {
        private static readonly ContextKind UserKind = ContextKind.Of("user");
        private static readonly ContextKind OfficeKind = ContextKind.Of("office");

        private static Context getDefaultContext() =>
            BuildContextFromProfile(DemoContextUser.Sandy.ContextKey());

        /// <summary>Stable key for the <c>office</c> context kind from a location label.</summary>
        private static string OfficeContextKey(string officeLocation)
        {
            var sb = new StringBuilder(officeLocation.Length);
            foreach (var c in officeLocation.Normalize(NormalizationForm.FormKD).ToLowerInvariant())
            {
                if (char.IsAsciiLetterOrDigit(c))
                    sb.Append(c);
                else if (sb.Length > 0 && sb[^1] != '-')
                    sb.Append('-');
            }
            while (sb.Length > 0 && sb[^1] == '-')
                sb.Length--;
            return sb.Length > 0 ? sb.ToString() : "unknown";
        }

        private static Context BuildContextFromProfile(string contextKey)
        {
            var profile = DemoContextUserDirectory.GetProfileOrNoone(contextKey);

            var userContext = Context.Builder(UserKind, contextKey)
                .Name(profile.Name)
                .Set("email", profile.Email)
                .Set("phone_number", profile.PhoneNumber)
                .Set("address", profile.Address)
                .Build();

            var officeKey = OfficeContextKey(profile.OfficeLocation);
            var officeContext = Context.Builder(OfficeKind, officeKey)
                .Set("location", profile.OfficeLocation)
                .Build();

            return Context.NewMulti(userContext, officeContext);
        }

        [HttpGet("all")]
        [HttpPost("all")]
        public ActionResult<FeatureFlagsState> AllFlags(LdClient ldClient)
        {
            var context = getDefaultContext();
            var state =  ldClient.AllFlagsState(context);
            return state;
        }


        [HttpGet ("{flagKey}")]
        public ActionResult<LdValue> EvalBoolFlagWithContext(LdClient ldClient, string flagKey, string contextKey = "user-sandy-key")
        {
            var context = BuildContextFromProfile(contextKey);

            //var state =  ldClient.AllFlagsState(context);
            //var value = state.GetFlagValueJson(flagKey);

            //var boolie = ldClient.BoolVariation(flagKey, context, false);
            var boolieDetail = ldClient.BoolVariationDetail(flagKey, context, false);
            logger.LogInformation(
                "BoolVariationDetail flagKey={FlagKey} contextKey={ContextKey} value={Value} reasonKind={ReasonKind}",
                flagKey,
                contextKey,
                boolieDetail.Value,
                boolieDetail.Reason.Kind);
            return LdValue.Of(boolieDetail.Value);
        }

    }
}
