import 'package:flutter/material.dart';
import 'package:flutterapp/demo_parameters.dart';
import 'package:flutterapp/launch_darkly_scope.dart';
import 'package:flutterapp/pages/login_page.dart';
import 'package:flutterapp/services/reservation_service.dart';
import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ReservationService.ensureInitialized();
  runApp(const ReservationsBootstrapApp());
}

/// Loads LaunchDarkly then wraps the app in [LaunchDarklyScope] (same idea as `MauiProgram` + `CreateMauiApp`).
class ReservationsBootstrapApp extends StatefulWidget {
  const ReservationsBootstrapApp({super.key});

  @override
  State<ReservationsBootstrapApp> createState() => _ReservationsBootstrapAppState();
}

class _ReservationsBootstrapAppState extends State<ReservationsBootstrapApp> {
  LDClient? _client;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _startLd();
  }

  Future<void> _startLd() async {
    final key = DemoParameters.mobileKey;
    if (key.isEmpty) {
      setState(() {
        _loading = false;
        _error =
            'Mobile key not set. Run with:\n\n'
            'flutter run --dart-define=LAUNCHDARKLY_MOBILE_KEY=your-mobile-key\n\n'
            'Same credential as dotnet-maui `LaunchDarkly:MobileKey` in appsettings.json.';
      });
      return;
    }

    try {
      final config = LDConfig(
        key,
        AutoEnvAttributes.enabled,
        applicationInfo: ApplicationInfo(
          applicationId: 'flutter-reservations-maui-port',
          applicationVersion: '1.0.0',
        ),
      );
      final initialContext = DemoParameters.makeDemoContext();
      final client = LDClient(config, initialContext);
      final ok = await client
          .start()
          .timeout(DemoParameters.sdkTimeout, onTimeout: () => false);
      if (!mounted) return;
      if (!ok) {
        setState(() {
          _loading = false;
          _error = 'LaunchDarkly SDK did not finish starting within ${DemoParameters.sdkTimeout.inSeconds}s.';
        });
        return;
      }
      setState(() {
        _client = client;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'LaunchDarkly error: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Connecting to LaunchDarkly…'),
              ],
            ),
          ),
        ),
      );
    }

    if (_error != null) {
      return MaterialApp(
        theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF512BD4))),
        home: Scaffold(
          appBar: AppBar(title: const Text('Configuration')),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: SelectableText(_error!, style: const TextStyle(height: 1.4, fontSize: 15)),
            ),
          ),
        ),
      );
    }

    return LaunchDarklyScope(
      client: _client!,
      child: MaterialApp(
        title: 'Office Reservations',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF512BD4)),
          useMaterial3: true,
        ),
        home: const LoginPage(),
      ),
    );
  }
}
