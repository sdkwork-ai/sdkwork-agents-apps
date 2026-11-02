import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/assets_models.dart';
import 'assets_screen.dart';

/// Full-page asset detail behind `app.agents.assets.detail`.
///
/// The route factory passes the tapped [item] as the route argument. A deep
/// link without that argument renders the localized missing state instead of a
/// guessed asset. The metadata body is the same sheet the library uses, so the
/// two entry points cannot drift.
class AgentsAssetDetailScreen extends StatelessWidget {
  const AgentsAssetDetailScreen({
    super.key,
    required this.item,
    required this.translate,
    required this.onBack,
  });

  final AgentsAssetItem? item;
  final String Function(String key) translate;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.assets.detail.title'),
            leading: Icons.arrow_back,
            leadingTooltip: translate('agents.mobile.nav.back'),
            onLeadingPressed: onBack,
          ),
          Expanded(
            child: item == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(
                        SdkworkAgentsFlutterTokens.spacingLg,
                      ),
                      child: SdkworkAgentsEmptyState(
                        headline: translate('agents.assets.detail.missing'),
                        glyph: '▤',
                      ),
                    ),
                  )
                : AgentsAssetDetailSheet(item: item!, translate: translate),
          ),
        ],
      ),
    );
  }
}
