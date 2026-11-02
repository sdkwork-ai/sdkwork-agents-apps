/// Typed capability-boundary failure shared by the Flutter mobile packages.
///
/// A capability package exposes an injected source port. When the current
/// composition root has no generated SDK transport for that capability, the
/// adapter throws this exception instead of returning fabricated data; the
/// package's controller maps it onto an explicit localized unavailable state
/// with retry (`PLAN-2026-1102-client-page-parity.md` section 6 — data
/// honesty).
library;

class SdkworkAgentsCapabilityUnavailableException implements Exception {
  const SdkworkAgentsCapabilityUnavailableException(
    this.capability, {
    this.detail,
  });

  /// Capability code, for example `inspiration` or `membership`.
  final String capability;

  /// Optional diagnostic detail. Never rendered as user-facing copy.
  final String? detail;

  @override
  String toString() {
    final suffix = detail == null || detail!.isEmpty ? '' : ': $detail';
    return 'SdkworkAgentsCapabilityUnavailableException($capability)$suffix';
  }
}
