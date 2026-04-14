import 'package:flutter/material.dart';
import 'package:flutterapp/launch_darkly_scope.dart';
import 'package:flutterapp/pages/home_page.dart';
import 'package:flutterapp/services/context_service.dart';
import 'package:flutterapp/services/user_service.dart';
import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  static const _users = ['Roisin', 'Ian', 'George', 'Evelyn'];
  String? _selectedUser;

  Future<void> _onLogin() async {
    final user = _selectedUser;
    if (user == null || user.isEmpty) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Selection required'),
          content: const Text('Please select a user from the list.'),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
        ),
      );
      return;
    }

    final client = LaunchDarklyScope.of(context);
    if (!client.initialized) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Error'),
          content: const Text('LaunchDarkly client is not initialized.'),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
        ),
      );
      return;
    }

    try {
      final contextLd = LDContextBuilder()
          .kind('user', '$user-key')
          .name(user)
          .build();

      await client.identify(contextLd);

      UserService.currentUser = user;
      ContextService.currentUser = user;

      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const HomePage()),
      );
    } catch (e) {
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Error'),
          content: Text('Failed to login: $e'),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const primary = Color(0xFF512BD4);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 48),
          child: Column(
            children: [
              const Text(
                '🚩 LaunchDarkly',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: primary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Select a user to continue',
                style: TextStyle(fontSize: 18, color: Colors.grey.shade700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text(
                        'Select User',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.grey.shade100,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        hint: const Text('Choose a user...'),
                        items: _users
                            .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                            .toList(),
                        onChanged: (v) => setState(() => _selectedUser = v),
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _selectedUser == null ? null : _onLogin,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(50),
                          backgroundColor: primary,
                        ),
                        child: const Text('Login'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
