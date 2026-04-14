import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

/// Shared demo constants (aligned with dotnet-maui `Shared/DemoParameters.cs`).
class DemoParameters {
  DemoParameters._();

  /// Compile-time mobile key: `flutter run --dart-define=LAUNCHDARKLY_MOBILE_KEY=your-key`
  static String get mobileKey {
    const k = String.fromEnvironment('LAUNCHDARKLY_MOBILE_KEY', defaultValue: '');
    return k.trim();
  }

  static const String featureFlagKey = 'hello-maui';
  static const String hotelingFlagKey = 'enabled-office-conf-room-hoteling';
  static const Duration sdkTimeout = Duration(seconds: 10);

  static LDContext makeDemoContext() {
    return LDContextBuilder()
        .kind('user', 'example-user-key')
        .name('Sandy')
        .build();
  }
}
