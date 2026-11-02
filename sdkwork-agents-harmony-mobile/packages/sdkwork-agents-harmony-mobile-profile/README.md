# sdkwork-agents-harmony-mobile-profile

SDKWork Agents HarmonyOS mobile profile capability: the `app.agents.profile.index` hub
(user summary plus links to membership, projects, library, automation, history, and
settings) and the `app.agents.settings.index` form persisted through the host preferences
adapter.

Both pages are exposed to the platform router through
`src/main/resources/base/profile/route_map.json`, keyed by their canonical route ids.

Authority: `../../../../../sdkwork-specs/HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md`.
