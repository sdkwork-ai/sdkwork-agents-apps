/// Host adapters for the Agents Flutter mobile root.
///
/// Platform API access lives here so capability packages never touch `dart:ui`
/// or `PlatformDispatcher` directly
/// (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` — the root owns host adapters).
library;

import 'dart:ui';

/// Values the root reads from the platform once at bootstrap.
class AgentsHostAdapters {
  const AgentsHostAdapters({
    required this.localeTag,
    required this.statusBarHeight,
    required this.safeAreaBottom,
    required this.windowWidth,
    required this.windowHeight,
  });

  /// Raw platform locale tag, for example `zh_CN` or `en_US`.
  final String localeTag;
  final double statusBarHeight;
  final double safeAreaBottom;
  final double windowWidth;
  final double windowHeight;
}

AgentsHostAdapters registerHostAdapters() {
  final view = PlatformDispatcher.instance.implicitView;
  final locale = PlatformDispatcher.instance.locale;
  final tag = locale.countryCode == null || locale.countryCode!.isEmpty
      ? locale.languageCode
      : '${locale.languageCode}_${locale.countryCode}';
  if (view == null) {
    return AgentsHostAdapters(
      localeTag: tag,
      statusBarHeight: 0,
      safeAreaBottom: 0,
      windowWidth: 0,
      windowHeight: 0,
    );
  }
  final padding = view.viewPadding;
  return AgentsHostAdapters(
    localeTag: tag,
    statusBarHeight: padding.top,
    safeAreaBottom: padding.bottom,
    windowWidth: view.physicalSize.width / view.devicePixelRatio,
    windowHeight: view.physicalSize.height / view.devicePixelRatio,
  );
}
