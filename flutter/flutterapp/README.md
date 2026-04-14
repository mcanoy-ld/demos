# flutterapp — Office Reservations (Flutter port of dotnet-maui)

This app mirrors **[dotnet-maui/ReservationsDotnetMaui](../../dotnet-maui/ReservationsDotnetMaui/)**: LaunchDarkly **client-side** SDK, the same feature flags, login flow, main dashboard with live flag updates, and the office hoteling reservation screen (desks, optional conference rooms via `enabled-office-conf-room-hoteling`, multi-context user + office).

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (see `environment.sdk` in `pubspec.yaml`)
- A LaunchDarkly **mobile key** (same type as the MAUI app’s `LaunchDarkly:MobileKey` in `appsettings.json`)

## Run

```bash
cd flutter/flutterapp
flutter pub get
flutter run --dart-define=LAUNCHDARKLY_MOBILE_KEY=your-mobile-key-here
```

Optional: `flutter run -d chrome` for web (use a **client-side ID** for web if you target web only—this demo is aligned with the MAUI **mobile** key flow).

## Flags & context

| Constant | Default (matches MAUI `DemoParameters`) |
|----------|----------------------------------------|
| `hello-maui` | Primary demo boolean on the home screen |
| `enabled-office-conf-room-hoteling` | Toggles conference room tab and related UI |

Context behavior matches the MAUI app: **login** sends a user context; on the **reservation** screen, changing office calls **`identify`** with a **multi-context** (user + office with `location`).

## Project layout

- `lib/main.dart` — bootstrap, `LDClient` + `LaunchDarklyScope`
- `lib/demo_parameters.dart` — keys, timeouts, initial anonymous-style context
- `lib/pages/` — `LoginPage`, `HomePage`, `ReservationPage`
- `lib/services/` — `ReservationService`, `UserService`, `ContextService`
- `lib/models/` — office, desk, room, reservation (in-memory, same as MAUI)
