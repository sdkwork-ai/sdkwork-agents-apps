/// Backwards-compatible import for the tech-blue token module.
///
/// The canonical token and theme definitions live in `tech_blue_theme.dart`;
/// this file only keeps existing `../theme/design_tokens.dart` imports
/// resolving. New code must import `tech_blue_theme.dart` (or the package
/// barrel).
library;

export 'tech_blue_theme.dart' show SdkworkAgentsFlutterTokens;
