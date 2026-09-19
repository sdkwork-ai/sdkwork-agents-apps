/// Thin locale helpers for the agents Flutter mobile capability family.
///
/// Placement note (`I18N_SPEC.md` section 6.1): the authored Flutter fragment
/// layout is `lib/src/i18n/<locale>/<domain>/<capability>/<screen-or-widget>.arb`
/// or `.json` — `.dart` is not an authored fragment extension. Dart code that
/// normalizes a locale or looks a key up in an already-loaded fragment is a
/// boundary helper, not a locale resource, so it lives outside `lib/src/i18n/`.
/// The `gen_l10n` projection that generates Dart accessors from `.arb` fragments
/// requires the Flutter toolchain and is tracked as pending integration.
enum SdkworkAgentsLocale { enUs, zhCn }

/// Canonical locale tag used as the fragment directory name and message-map key.
///
/// `I18N_SPEC.md` section 6.1 names authored fragment directories with the
/// canonical BCP-47 tag, so every consumer keys copy by `'zh-CN'` / `'en-US'`
/// rather than by a platform-specific tag such as `zh_CN`.
///
/// The fallback matches the PC, H5, and mini program roots: an unrecognised tag
/// resolves to `zh-CN`, which is the application's authoring default. Only a
/// tag that explicitly starts with a locale prefix selects that locale.
const String sdkworkAgentsDefaultLocaleTag = 'zh-CN';

String resolveSdkworkAgentsLocaleTag(String value) {
  final normalized = value.trim().toLowerCase();
  if (normalized.startsWith('en')) {
    return 'en-US';
  }
  if (normalized.startsWith('zh')) {
    return 'zh-CN';
  }
  return sdkworkAgentsDefaultLocaleTag;
}

SdkworkAgentsLocale normalizeSdkworkAgentsLocale(String value) {
  final normalized = value.trim().toLowerCase();
  return normalized.startsWith('zh') ? SdkworkAgentsLocale.zhCn : SdkworkAgentsLocale.enUs;
}

String pickSdkworkAgentsMessage(
  Map<String, String> messages,
  String key,
  String fallback,
) {
  final value = messages[key];
  return value != null && value.isNotEmpty ? value : fallback;
}
