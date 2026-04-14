using System.Diagnostics.CodeAnalysis;

namespace MyApp.Namespace;

/// <summary>Static demo user attributes keyed by LaunchDarkly context key.</summary>
public sealed record DemoUserProfile(
    string Name,
    string Email,
    string PhoneNumber,
    string Address,
    string OfficeLocation);

/// <summary>Known demo users; each maps to a fixed context key string.</summary>
public enum DemoContextUser
{
    Sandy,
    Alex,
    Morgan,
    Ian,
    George,
    Noone
}

public static class DemoContextUserDirectory
{
    private static readonly IReadOnlyDictionary<string, DemoUserProfile> ByContextKey =
        new Dictionary<string, DemoUserProfile>(StringComparer.Ordinal)
        {
            [DemoContextUser.Sandy.ContextKey()] = new DemoUserProfile(
                Name: "Sandy",
                Email: "sandy@example.com",
                PhoneNumber: "+1-555-0100",
                Address: "123 Ocean Ave, San Francisco, CA",
                OfficeLocation: "San Francisco"),
            [DemoContextUser.Alex.ContextKey()] = new DemoUserProfile(
                Name: "Alex",
                Email: "alex@example.com",
                PhoneNumber: "+1-555-0101",
                Address: "456 Lake St, Chicago, IL",
                OfficeLocation: "Chicago"),
            [DemoContextUser.Morgan.ContextKey()] = new DemoUserProfile(
                Name: "Morgan",
                Email: "morgan@example.com",
                PhoneNumber: "+1-555-0102",
                Address: "789 Hill Rd, New York, NY",
                OfficeLocation: "NYC"),
            [DemoContextUser.Ian.ContextKey()] = new DemoUserProfile(
                Name: "Ian",
                Email: "ian@example.com",
                PhoneNumber: "+1-555-0103",
                Address: "200 N San Fernando Blvd, Burbank, CA",
                OfficeLocation: "Burbank"),
            [DemoContextUser.George.ContextKey()] = new DemoUserProfile(
                Name: "George",
                Email: "george@example.com",
                PhoneNumber: "+1-555-0104",
                Address: "150 E Olive Ave, Burbank, CA",
                OfficeLocation: "Burbank"),
            [DemoContextUser.Noone.ContextKey()] = new DemoUserProfile(
                Name: "Noone",
                Email: "noone@example.com",
                PhoneNumber: "+1-555-0199",
                Address: "0 Unknown Ln, Nowhere",
                OfficeLocation: "Unassigned"),
        };

    public static string ContextKey(this DemoContextUser user) =>
        user switch
        {
            DemoContextUser.Sandy => "user-sandy-key",
            DemoContextUser.Alex => "user-alex-key",
            DemoContextUser.Morgan => "user-morgan-key",
            DemoContextUser.Ian => "user-ian-key",
            DemoContextUser.George => "user-george-key",
            DemoContextUser.Noone => "user-noone-key",
            _ => throw new ArgumentOutOfRangeException(nameof(user))
        };

    /// <summary>Resolves static profile data for a demo context key.</summary>
    public static bool TryGetProfile(string contextKey, [NotNullWhen(true)] out DemoUserProfile? profile) =>
        ByContextKey.TryGetValue(contextKey, out profile);

    /// <summary>Known user profile, or <see cref="DemoContextUser.Noone"/> when <paramref name="contextKey"/> is unknown.</summary>
    public static DemoUserProfile GetProfileOrNoone(string contextKey) =>
        ByContextKey.TryGetValue(contextKey, out var profile)
            ? profile
            : ByContextKey[DemoContextUser.Noone.ContextKey()];
}
