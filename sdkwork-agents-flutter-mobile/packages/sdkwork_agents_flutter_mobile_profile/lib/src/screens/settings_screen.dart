import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/settings_models.dart';
import '../state/settings_state.dart';

/// Route-level settings form.
///
/// Every control edits the controller's draft and the save button persists it
/// through the injected store. Copy is fully localized and controls keep a 48dp
/// touch target.
class AgentsSettingsScreen extends StatelessWidget {
  const AgentsSettingsScreen({
    super.key,
    required this.state,
    required this.onLanguageChanged,
    required this.onThemeChanged,
    required this.onNotificationsChanged,
    required this.onAutoplayChanged,
    required this.onSave,
    required this.onRetry,
    required this.onNavigateBack,
    required this.backTooltip,
    required this.translate,
  });

  final AgentsSettingsState state;
  final ValueChanged<AgentsSettingsLanguage> onLanguageChanged;
  final ValueChanged<AgentsSettingsTheme> onThemeChanged;
  final ValueChanged<bool> onNotificationsChanged;
  final ValueChanged<bool> onAutoplayChanged;
  final Future<void> Function() onSave;
  final VoidCallback onRetry;
  final VoidCallback onNavigateBack;
  final String backTooltip;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.settings.title'),
            leading: Icons.arrow_back,
            leadingTooltip: backTooltip,
            onLeadingPressed: onNavigateBack,
          ),
          Expanded(child: _buildBody(context)),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (state.loading) {
      return const Center(child: CircularProgressIndicator());
    }
    final ColorScheme scheme = Theme.of(context).colorScheme;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    final settings = state.settings;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingMd,
        SdkworkAgentsFlutterTokens.spacingLg,
      ),
      children: <Widget>[
        if (state.errorMessage.isNotEmpty) ...<Widget>[
          Card(
            color: scheme.surfaceContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: <Widget>[
                  Icon(
                    Icons.error_outline,
                    size: 18,
                    color: colors.dangerText,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.errorMessage,
                      style: TextStyle(
                        fontSize: 12,
                        color: colors.dangerText,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: onRetry,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(48, 48),
                    ),
                    child: Text(translate('agents.settings.retry')),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
        ],
        Card(
          child: Padding(
            padding: const EdgeInsets.all(SdkworkAgentsFlutterTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                DropdownButtonFormField<AgentsSettingsLanguage>(
                  initialValue: settings.language,
                  iconEnabledColor: scheme.onSurfaceVariant,
                  iconDisabledColor: colors.iconDisabled,
                  decoration: InputDecoration(
                    labelText: translate('agents.settings.language'),
                  ),
                  items: <DropdownMenuItem<AgentsSettingsLanguage>>[
                    for (final language in AgentsSettingsLanguage.values)
                      DropdownMenuItem<AgentsSettingsLanguage>(
                        value: language,
                        child: Text(translate(language.labelKey)),
                      ),
                  ],
                  onChanged: (AgentsSettingsLanguage? value) {
                    if (value != null) {
                      onLanguageChanged(value);
                    }
                  },
                ),
                const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                DropdownButtonFormField<AgentsSettingsTheme>(
                  initialValue: settings.theme,
                  iconEnabledColor: scheme.onSurfaceVariant,
                  iconDisabledColor: colors.iconDisabled,
                  decoration: InputDecoration(
                    labelText: translate('agents.settings.theme'),
                  ),
                  items: <DropdownMenuItem<AgentsSettingsTheme>>[
                    for (final theme in AgentsSettingsTheme.values)
                      DropdownMenuItem<AgentsSettingsTheme>(
                        value: theme,
                        child: Text(translate(theme.labelKey)),
                      ),
                  ],
                  onChanged: (AgentsSettingsTheme? value) {
                    if (value != null) {
                      onThemeChanged(value);
                    }
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
        Card(
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: <Widget>[
              SwitchListTile(
                value: settings.notificationsEnabled,
                onChanged: onNotificationsChanged,
                title: Text(translate('agents.settings.notifications')),
                subtitle: Text(translate('agents.settings.notifications.hint')),
              ),
              SwitchListTile(
                value: settings.autoplayEnabled,
                onChanged: onAutoplayChanged,
                title: Text(translate('agents.settings.autoplay')),
                subtitle: Text(translate('agents.settings.autoplay.hint')),
              ),
            ],
          ),
        ),
        const SizedBox(height: SdkworkAgentsFlutterTokens.spacingLg),
        SizedBox(
          height: 48,
          child: FilledButton.icon(
            onPressed: state.saving ? null : onSave,
            icon: state.saving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(
                        SdkworkAgentsFlutterTokens.colorPrimaryOn,
                      ),
                    ),
                  )
                : const Icon(Icons.save_outlined, size: 18),
            label: Text(
              state.saving
                  ? translate('agents.settings.saving')
                  : translate('agents.settings.save'),
            ),
          ),
        ),
        if (state.saved)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Semantics(
              liveRegion: true,
              child: Text(
                translate('agents.settings.saved'),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: scheme.primary,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
