# sdkwork-agents-harmony-mobile-membership

SDKWork Agents HarmonyOS mobile membership capability: the `app.agents.membership.catalog`
plan catalog, current membership summary, and checkout entry, plus its package-local i18n
fragments.

The page is exposed to the platform router through
`src/main/resources/base/profile/route_map.json`, keyed by the canonical route id, so the
shell navigator can open it by route identity.

Authority: `../../../../../sdkwork-specs/HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md`.
