import 'package:sdkwork_agents_flutter_mobile_commons/sdkwork_agents_flutter_mobile_commons.dart';
import 'package:sdkwork_agents_flutter_mobile_shell/sdkwork_agents_flutter_mobile_shell.dart';

import 'host_adapters.dart';
import 'iam_runtime.dart';
import 'routes.dart';
import 'sdk_clients.dart';
import 'services.dart';

class AgentsMobileRuntime {
  const AgentsMobileRuntime({
    required this.sdkClients,
    required this.services,
    required this.routes,
    required this.adapters,
    required this.localeTag,
    required this.tabs,
  });

  final SdkClients sdkClients;
  final AgentsMobileServices services;
  final AgentsMobileRoutes routes;
  final AgentsHostAdapters adapters;

  /// Canonical locale tag (`zh-CN` / `en-US`) every capability is configured
  /// with. Feature packages never resolve the platform locale themselves
  /// (`I18N_SPEC.md` section 7).
  final String localeTag;

  final List<AgentsMobileTabDescriptor> tabs;
}

Future<AgentsMobileRuntime> bootstrap({String? localeTag}) async {
  createIamRuntime();
  final adapters = registerHostAdapters();
  final sdkClients = createSdkClients();
  final services = createAgentsMobileServices(sdkClients);
  final routes = createRoutes();
  return AgentsMobileRuntime(
    sdkClients: sdkClients,
    services: services,
    routes: routes,
    adapters: adapters,
    localeTag: resolveSdkworkAgentsLocaleTag(localeTag ?? adapters.localeTag),
    tabs: routes.tabs,
  );
}
