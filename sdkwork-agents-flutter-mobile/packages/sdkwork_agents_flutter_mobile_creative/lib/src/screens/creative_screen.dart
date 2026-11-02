import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/creative_models.dart';
import '../state/creative_state.dart';

/// Route-level creative studio screen.
///
/// Owns the prompt form, modality and aspect selection, the session list, and
/// the result grid. When the injected source reports no transport, the data
/// sections render an explicit localized unavailable state with retry.
class AgentsCreativeScreen extends StatefulWidget {
  const AgentsCreativeScreen({
    super.key,
    required this.state,
    required this.sessions,
    required this.onPromptChanged,
    required this.onModalityChanged,
    required this.onAspectChanged,
    required this.onSubmit,
    required this.onSelectSession,
    required this.onRetry,
    required this.translate,
    this.profileAction,
    this.canvasAction,
  });

  final AgentsCreativeState state;
  final List<AgentsCreativeSessionSummary> sessions;
  final ValueChanged<String> onPromptChanged;
  final ValueChanged<AgentsCreativeModality> onModalityChanged;
  final ValueChanged<AgentsCreativeAspectRatio> onAspectChanged;
  final Future<void> Function() onSubmit;
  final ValueChanged<String> onSelectSession;
  final Future<void> Function() onRetry;
  final String Function(String key) translate;

  /// Accessible avatar action that opens the profile hub.
  final Widget? profileAction;

  /// Optional action that opens the read-only canvas projection.
  final Widget? canvasAction;

  @override
  State<AgentsCreativeScreen> createState() => _AgentsCreativeScreenState();
}

class _AgentsCreativeScreenState extends State<AgentsCreativeScreen> {
  final TextEditingController _prompt = TextEditingController();

  @override
  void initState() {
    super.initState();
    _prompt.text = widget.state.prompt;
  }

  @override
  void didUpdateWidget(AgentsCreativeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.state.prompt != _prompt.text &&
        widget.state.prompt.isEmpty &&
        oldWidget.state.prompt.isNotEmpty) {
      _prompt.clear();
    }
  }

  @override
  void dispose() {
    _prompt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final translate = widget.translate;
    final TechBlueThemeColors colors = techBlueThemeColors(context);
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: <Widget>[
          SdkworkAgentsMobileAppBar(
            title: translate('agents.creative.title'),
            actions: <Widget>[
              if (widget.canvasAction != null) widget.canvasAction!,
              if (widget.profileAction != null) widget.profileAction!,
            ],
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: widget.onRetry,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingMd,
                  SdkworkAgentsFlutterTokens.spacingLg,
                ),
                children: <Widget>[
                  TextField(
                    controller: _prompt,
                    minLines: 3,
                    maxLines: 5,
                    textInputAction: TextInputAction.newline,
                    onChanged: widget.onPromptChanged,
                    decoration: InputDecoration(
                      labelText: translate('agents.creative.prompt.label'),
                      hintText: translate('agents.creative.prompt.hint'),
                      alignLabelWithHint: true,
                    ),
                  ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                  _SectionLabel(
                      text: translate('agents.creative.modality.label')),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: <Widget>[
                      for (final modality in AgentsCreativeModality.values)
                        ChoiceChip(
                          label: Text(translate(modality.labelKey)),
                          selected: state.modality == modality,
                          onSelected: (_) => widget.onModalityChanged(modality),
                          materialTapTargetSize: MaterialTapTargetSize.padded,
                        ),
                    ],
                  ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                  _SectionLabel(
                      text: translate('agents.creative.aspect.label')),
                  const SizedBox(height: 6),
                  SegmentedButton<AgentsCreativeAspectRatio>(
                    segments: <ButtonSegment<AgentsCreativeAspectRatio>>[
                      for (final aspect in AgentsCreativeAspectRatio.values)
                        ButtonSegment<AgentsCreativeAspectRatio>(
                          value: aspect,
                          label: Text(
                            '${aspect.ratioLabel} · ${translate(aspect.labelKey)}',
                          ),
                        ),
                    ],
                    selected: <AgentsCreativeAspectRatio>{state.aspectRatio},
                    showSelectedIcon: false,
                    onSelectionChanged:
                        (Set<AgentsCreativeAspectRatio> selection) {
                      if (selection.isNotEmpty) {
                        widget.onAspectChanged(selection.first);
                      }
                    },
                  ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingMd),
                  SizedBox(
                    height: 48,
                    child: FilledButton.icon(
                      onPressed: state.canSubmit ? widget.onSubmit : null,
                      icon: state.submitting
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
                          : const Icon(
                              Icons.auto_awesome,
                              size: 18,
                              color: Color(
                                SdkworkAgentsFlutterTokens.colorPrimaryOn,
                              ),
                            ),
                      label: Text(
                        state.submitting
                            ? translate('agents.creative.submitting')
                            : translate('agents.creative.submit'),
                      ),
                    ),
                  ),
                  if (state.errorMessage.isNotEmpty && !state.unavailable)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        state.errorMessage,
                        style: TextStyle(
                          fontSize: 12,
                          color: colors.dangerText,
                        ),
                      ),
                    ),
                  const SizedBox(height: SdkworkAgentsFlutterTokens.spacingLg),
                  _SectionLabel(
                      text: translate('agents.creative.sessions.title')),
                  const SizedBox(height: 8),
                  if (state.unavailable)
                    SdkworkAgentsUnavailableState(
                      headline: translate('agents.creative.unavailable.title'),
                      hint: translate('agents.creative.unavailable.hint'),
                      retryLabel: translate('agents.creative.retry'),
                      onRetry: widget.onRetry,
                    )
                  else if (state.loadingSessions)
                    const Center(child: CircularProgressIndicator())
                  else if (widget.sessions.isEmpty)
                    SdkworkAgentsEmptyState(
                      headline: translate('agents.creative.sessions.empty'),
                      glyph: '✦',
                    )
                  else
                    SizedBox(
                      height: 48,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: widget.sessions.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (BuildContext context, int index) {
                          final session = widget.sessions[index];
                          final selected =
                              state.activeSession?.summary.id == session.id;
                          return ChoiceChip(
                            label: Text(
                              session.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            selected: selected,
                            onSelected: (_) =>
                                widget.onSelectSession(session.id),
                            materialTapTargetSize: MaterialTapTargetSize.padded,
                          );
                        },
                      ),
                    ),
                  if (!state.unavailable) ...<Widget>[
                    const SizedBox(
                        height: SdkworkAgentsFlutterTokens.spacingLg),
                    _SectionLabel(
                        text: translate('agents.creative.results.title')),
                    const SizedBox(height: 8),
                    _CreativeResultGrid(
                      results: state.results,
                      translate: translate,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CreativeResultGrid extends StatelessWidget {
  const _CreativeResultGrid({required this.results, required this.translate});

  final List<AgentsCreativeResult> results;
  final String Function(String key) translate;

  @override
  Widget build(BuildContext context) {
    if (results.isEmpty) {
      return SdkworkAgentsEmptyState(
        headline: translate('agents.creative.results.empty'),
        glyph: '▦',
      );
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: results.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
      ),
      itemBuilder: (BuildContext context, int index) {
        final result = results[index];
        return Semantics(
          container: true,
          image: result.isRenderableImage,
          label: result.isRenderableImage
              ? translate('agents.creative.results.title')
              : result.kind == AgentsCreativeResultKind.video
                  ? translate('agents.creative.resultVideo')
                  : translate('agents.creative.resultAudio'),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(
              SdkworkAgentsFlutterTokens.radiusMd,
            ),
            child: result.isRenderableImage
                ? Image.network(
                    result.previewUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (BuildContext context, Object error,
                            StackTrace? stack) =>
                        _ResultFallback(
                            label:
                                translate('agents.creative.resultImageFailed')),
                  )
                : _ResultFallback(
                    label: result.kind == AgentsCreativeResultKind.video
                        ? translate('agents.creative.resultVideo')
                        : translate('agents.creative.resultAudio'),
                  ),
          ),
        );
      },
    );
  }
}

class _ResultFallback extends StatelessWidget {
  const _ResultFallback({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final ColorScheme scheme = Theme.of(context).colorScheme;
    return ColoredBox(
      color: scheme.surfaceContainerHighest,
      child: Center(
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 11,
            color: scheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.onSurface,
      ),
    );
  }
}
