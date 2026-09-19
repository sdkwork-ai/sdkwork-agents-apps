import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';

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

/// Mascot/empty-state block matching the mobile design language.
///
/// Capability packages pass their own headline and hint; the widget owns only
/// the shared layout so every empty tab looks the same.
class SdkworkAgentsEmptyState extends StatelessWidget {
  const SdkworkAgentsEmptyState({
    super.key,
    required this.headline,
    this.hint,
    this.glyph = '∞',
    this.onRetry,
    this.retryLabel,
  });

  final String headline;
  final String? hint;

  /// Monochrome mascot glyph; the Flutter root ships no binary art assets.
  final String glyph;
  final VoidCallback? onRetry;
  final String? retryLabel;

  @override
  Widget build(BuildContext context) {
    final hintText = hint;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Text(
                glyph,
                style: const TextStyle(
                  fontSize: 28,
                  color: Color(SdkworkAgentsFlutterTokens.colorTextMuted),
                ),
              ),
            ),
            const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
            Text(
              headline,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(SdkworkAgentsFlutterTokens.colorText),
              ),
            ),
            if (hintText != null && hintText.isNotEmpty) ...<Widget>[
              const SizedBox(height: SdkworkAgentsFlutterTokens.spacingSm),
              Text(
                hintText,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(SdkworkAgentsFlutterTokens.colorTextMuted),
                ),
              ),
            ],
            if (onRetry != null) ...<Widget>[
              const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
              FilledButton(
                onPressed: onRetry,
                child: Text(retryLabel ?? 'Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
