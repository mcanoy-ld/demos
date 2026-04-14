import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutterapp/demo_parameters.dart';
import 'package:flutterapp/launch_darkly_scope.dart';
import 'package:flutterapp/pages/login_page.dart';
import 'package:flutterapp/pages/reservation_page.dart';
import 'package:flutterapp/services/context_service.dart';
import 'package:flutterapp/services/user_service.dart';
import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  StreamSubscription<FlagsChangedEvent>? _flagSub;
  bool _hello = false;
  bool _hoteling = false;
  bool _ldReady = false;

  static const _primary = Color(0xFF512BD4);
  static const _trueColor = Color(0xFF11998E);
  static const _falseColor = Color(0xFF9E9E9E);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bindLd());
  }

  void _bindLd() {
    final client = LaunchDarklyScope.of(context);
    _ldReady = client.initialized;
    if (_ldReady) {
      _refreshFlags(client);
      _flagSub = client.flagChanges.listen((event) {
        if (!mounted) return;
        if (event.keys.contains(DemoParameters.featureFlagKey) ||
            event.keys.contains(DemoParameters.hotelingFlagKey)) {
          setState(() => _refreshFlags(client));
        }
      });
    }
    setState(() {});
  }

  void _refreshFlags(LDClient client) {
    _hello = client.boolVariation(DemoParameters.featureFlagKey, false);
    _hoteling = client.boolVariation(DemoParameters.hotelingFlagKey, false);
  }

  @override
  void dispose() {
    _flagSub?.cancel();
    super.dispose();
  }

  Color get _pageTint =>
      Color.lerp(Colors.white, _hello ? _trueColor : _falseColor, 0.06) ?? Colors.white;

  @override
  Widget build(BuildContext context) {
    final user = UserService.currentUser;

    return Scaffold(
      backgroundColor: _pageTint,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (user != null && user.isNotEmpty) ...[
                    const Text(
                      '🚩 LaunchDarkly',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _primary),
                    ),
                    const SizedBox(width: 12),
                    CircleAvatar(
                      backgroundColor: _primary,
                      child: Text(
                        UserService.getInitial(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _contextCard(),
                    const SizedBox(height: 16),
                    if (!_ldReady) _notInitializedCard() else ...[
                      _flagCard(
                        titleKey: DemoParameters.featureFlagKey,
                        value: _hello,
                        trueColor: _trueColor,
                        falseColor: _falseColor,
                      ),
                      const SizedBox(height: 16),
                      _flagCard(
                        titleKey: DemoParameters.hotelingFlagKey,
                        value: _hoteling,
                        trueColor: _trueColor,
                        falseColor: _falseColor,
                      ),
                    ],
                    const SizedBox(height: 16),
                    _infoCard(),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(builder: (_) => const ReservationPage()),
                        );
                      },
                      icon: const Icon(Icons.business),
                      label: const Text('Reserve a Desk'),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        backgroundColor: _primary,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        UserService.currentUser = null;
                        ContextService.currentUser = null;
                        ContextService.currentOffice = null;
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute<void>(builder: (_) => const LoginPage()),
                          (_) => false,
                        );
                      },
                      child: const Text('Sign out'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _contextCard() {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current Context',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              ContextService.getContextDisplay(),
              style: const TextStyle(fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _notInitializedCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          'LaunchDarkly client is not initialized.',
          style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _flagCard({
    required String titleKey,
    required bool value,
    required Color trueColor,
    required Color falseColor,
  }) {
    final c = value ? trueColor : falseColor;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade300),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Flag Key', style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
            Text(titleKey, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(color: c, shape: BoxShape.circle),
                ),
                const SizedBox(width: 10),
                Text(
                  value ? 'Enabled' : 'Disabled',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: c),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: c.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: c),
              ),
              child: Column(
                children: [
                  Text('Current Value', style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
                  Text(
                    value ? 'TRUE' : 'FALSE',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: c),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoCard() {
    return Card(
      color: const Color(0xFFE8E0F7),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: Color(0xFF3D1F7A)),
      ),
      child: const Padding(
        padding: EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('💡 How it works', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _primary)),
            SizedBox(height: 6),
            Text(
              'Toggle the flag in your LaunchDarkly dashboard to see the value update in real-time!',
              style: TextStyle(fontSize: 11, color: Color(0xFF616161)),
            ),
          ],
        ),
      ),
    );
  }
}
