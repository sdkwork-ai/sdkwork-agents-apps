import 'package:flutter/material.dart';

import '../theme/design_tokens.dart';
import 'mobile_app_bar.dart';
import 'screen_states.dart';

/// Domain-neutral list-tab scaffold for the Agents Flutter mobile root.
///
/// The library, automation, and projects tabs are the same screen shape: an app
/// bar, an optional search field, an optional notice banner, and a stateful
/// list. Keeping that shape here means the capability packages own only their
/// rows and their copy (`APP_FLUTTER_UI_SPEC.md` — shared widgets stay
/// payload-free).
class SdkworkAgentsListTabScaffold extends StatelessWidget {
  const SdkworkAgentsListTabScaffold({
    super.key,
    required this.title,
    required this.status,
    required this.statusMessage,
    required this.itemCount,
    required this.itemBuilder,
    required this.emptyHeadline,
    this.emptyHint,
    this.emptyGlyph = '∞',
    this.header,
    this.searchHint,
    this.searchController,
    this.onSearchChanged,
    this.banner,
    this.bannerEmphasis = false,
    this.onRefresh,
    this.onRetry,
    this.retryLabel = 'Retry',
    this.trailingActions = const <Widget>[],
    this.onLeadingPressed,
    this.leadingIcon = Icons.menu,
    this.leadingTooltip,
  });

  final String title;
  final SdkworkAgentsScreenStatus status;

  /// Message rendered for the loading/empty/error states.
  final String statusMessage;

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final String emptyHeadline;
  final String? emptyHint;
  final String emptyGlyph;

  /// Optional widget between the app bar and the search field, for example a
  /// scope selector.
  final Widget? header;

  final String? searchHint;
  final TextEditingController? searchController;
  final ValueChanged<String>? onSearchChanged;

  /// Optional notice above the list, for example the truncation notice.
  final String? banner;

  /// Renders [banner] with the warning treatment instead of the neutral one.
  final bool bannerEmphasis;

  final Future<void> Function()? onRefresh;
  final VoidCallback? onRetry;
  final String retryLabel;

  final List<Widget> trailingActions;
  final VoidCallback? onLeadingPressed;
  final IconData leadingIcon;
  final String? leadingTooltip;

  @override
  Widget build(BuildContext context) {
    final bannerText = banner;
    final search = searchHint;
    final headerWidget = header;
    final list = status == SdkworkAgentsScreenStatus.ready
        ? ListView.separated(
            padding: const EdgeInsets.only(bottom: 24),
            itemCount: itemCount,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: itemBuilder,
          )
        : status == SdkworkAgentsScreenStatus.loading
            ? const Center(child: CircularProgressIndicator())
            : SdkworkAgentsEmptyState(
                headline: status == SdkworkAgentsScreenStatus.error
                    ? statusMessage
                    : emptyHeadline,
                hint: status == SdkworkAgentsScreenStatus.error ? null : emptyHint,
                glyph: emptyGlyph,
                onRetry: onRetry,
                retryLabel: retryLabel,
              );

    final body = Column(
      children: <Widget>[
        if (headerWidget != null) headerWidget,
        if (search != null && search.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              SdkworkAgentsFlutterTokens.spacingMd,
              SdkworkAgentsFlutterTokens.spacingSm,
              SdkworkAgentsFlutterTokens.spacingMd,
              0,
            ),
            child: TextField(
              controller: searchController,
              onChanged: onSearchChanged,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: search,
                isDense: true,
                prefixIcon: const Icon(Icons.search, size: 18),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        if (bannerText != null && bannerText.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(
              SdkworkAgentsFlutterTokens.spacingMd,
              SdkworkAgentsFlutterTokens.spacingSm,
              SdkworkAgentsFlutterTokens.spacingMd,
              0,
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                bannerText,
                style: TextStyle(
                  fontSize: 12,
                  color: bannerEmphasis
                      ? const Color(0xFFB45309)
                      : const Color(SdkworkAgentsFlutterTokens.colorTextMuted),
                ),
              ),
            ),
          ),
        Expanded(child: list),
      ],
    );

    return Scaffold(
      backgroundColor: const Color(SdkworkAgentsFlutterTokens.colorBackground),
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: title,
            leading: leadingIcon,
            leadingTooltip: leadingTooltip,
            onLeadingPressed: onLeadingPressed,
            actions: trailingActions,
          ),
          Expanded(
            child: onRefresh == null
                ? body
                : RefreshIndicator(onRefresh: onRefresh!, child: body),
          ),
        ],
      ),
    );
  }
}
