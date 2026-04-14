import 'package:flutter/material.dart';
import 'package:launchdarkly_flutter_client_sdk/launchdarkly_flutter_client_sdk.dart';

/// Provides [LDClient] to the widget tree (same role as `MauiProgram.client` in the MAUI app).
class LaunchDarklyScope extends InheritedWidget {
  const LaunchDarklyScope({
    super.key,
    required this.client,
    required super.child,
  });

  final LDClient client;

  static LDClient of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LaunchDarklyScope>();
    assert(scope != null, 'LaunchDarklyScope not found');
    return scope!.client;
  }

  @override
  bool updateShouldNotify(covariant LaunchDarklyScope oldWidget) => client != oldWidget.client;
}
