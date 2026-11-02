/// Controller lifecycle host for the Agents Flutter mobile root.
///
/// Every tab and stack page owns exactly one controller created from the
/// bootstrap-injected services, loads it after the first frame, rebuilds through
/// an `AnimatedBuilder`, and disposes it with the host.
library;

import 'package:flutter/material.dart';

class AgentsControllerHost<C extends ChangeNotifier> extends StatefulWidget {
  const AgentsControllerHost({
    super.key,
    required this.create,
    required this.load,
    required this.build,
  });

  final C Function() create;
  final Future<void> Function(C controller) load;
  final Widget Function(C controller) build;

  @override
  State<AgentsControllerHost<C>> createState() =>
      _AgentsControllerHostState<C>();
}

class _AgentsControllerHostState<C extends ChangeNotifier>
    extends State<AgentsControllerHost<C>> {
  late final C _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.create();
    // Load after the first frame so a failing request surfaces through the
    // controller's own error state instead of during build.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        widget.load(_controller);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, _) => widget.build(_controller),
    );
  }
}
