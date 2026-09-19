import 'package:flutter/material.dart';
import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';

import '../models/library_models.dart';
import '../state/library_state.dart';

/// Route-level library screen.
///
/// The screen renders rows and copy only; state and transport live in the
/// controller and service (`FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` section 4).
class AgentsLibraryScreen extends StatelessWidget {
  const AgentsLibraryScreen({
    super.key,
    required this.state,
    required this.files,
    required this.onQueryChanged,
    required this.onRefresh,
    required this.onOpen,
    required this.translate,
    this.trailingActions = const <Widget>[],
  });

  final AgentsLibraryState state;

  /// Rows to render; already filtered by the controller.
  final List<AgentsLibraryFile> files;
  final ValueChanged<String> onQueryChanged;
  final Future<void> Function() onRefresh;
  final ValueChanged<AgentsLibraryFile> onOpen;
  final String Function(String key) translate;
  final List<Widget> trailingActions;

  @override
  Widget build(BuildContext context) {
    final status = resolveSdkworkAgentsScreenStatus(
      files.length,
      state.loading,
      state.errorMessage,
    );
    return SdkworkAgentsListTabScaffold(
      title: translate('agents.library.title'),
      status: status,
      statusMessage: state.errorMessage.isNotEmpty
          ? state.errorMessage
          : translate('agents.library.loading'),
      itemCount: files.length,
      emptyHeadline: translate('agents.library.empty'),
      emptyGlyph: '▤',
      searchHint: translate('agents.library.search.placeholder'),
      onSearchChanged: onQueryChanged,
      banner: state.truncated ? translate('agents.library.truncated') : null,
      onRefresh: onRefresh,
      onRetry: onRefresh,
      trailingActions: trailingActions,
      itemBuilder: (BuildContext context, int index) {
        final file = files[index];
        return ListTile(
          leading: const Icon(Icons.insert_drive_file_outlined),
          title: Text(file.name, maxLines: 2, overflow: TextOverflow.ellipsis),
          subtitle: file.mimeType == null ? null : Text(file.mimeType!),
          onTap: () => onOpen(file),
        );
      },
    );
  }
}
