# sdkwork_agents_flutter_mobile_agents

Agents capability for the Flutter mobile root: catalog screens, widgets,
controllers, services, view models, locale fragments, and route contributions.

SDK access is injected: this package never constructs an SDK client. The root
bootstrap creates `AgentsAppSdkClients` and hands the typed client to
`AgentCatalogService`.

Authority: `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md` sections 3 and 4.
