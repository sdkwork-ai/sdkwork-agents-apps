import 'package:flutter/material.dart';

/// Domain-neutral screen/list state primitives.
///
/// Capability packages map their own data onto these payload-free primitives.
enum SdkworkAgentsScreenStatus { loading, ready, empty, error }

SdkworkAgentsScreenStatus resolveSdkworkAgentsScreenStatus(
  int itemCount,
  bool loading,
  String? errorMessage,
) {
  if (loading) {
    return SdkworkAgentsScreenStatus.loading;
  }
  if (errorMessage != null && errorMessage.isNotEmpty) {
    return SdkworkAgentsScreenStatus.error;
  }
  return itemCount == 0 ? SdkworkAgentsScreenStatus.empty : SdkworkAgentsScreenStatus.ready;
}

/// Payload-free status widget used by capability screens.
class SdkworkAgentsStatusView extends StatelessWidget {
  const SdkworkAgentsStatusView({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message, textAlign: TextAlign.center),
      ),
    );
  }
}
