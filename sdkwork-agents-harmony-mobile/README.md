# SDKWork Agents HarmonyOS Mobile

Native HarmonyOS (ArkTS/ArkUI) client application root for SDKWork Agents.

## Status

Architecture scaffold materialized against
`HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md`, now carrying the M1 page parity set
(`docs/engineering/plans/PLAN-2026-1102-client-page-parity.md`):

- Bottom-tab shell with the five PC-primary surfaces
  (`navigation.mobileBottomTabs`), per-tab retained state, and a profile action on
  every tab.
- `app.agents.profile.index` hub with the contract profile links, and
  `app.agents.settings.index` with a form persisted through the host
  `PreferencesAdapter`.
- `app.agents.membership.catalog` page, exposed to the platform router by route
  id through the package `route_map.json` profile.
- Explicit localized `unavailable` + retry states for every capability whose
  adapted ArkTS transport does not exist yet (inspiration, creative/generations,
  assets, membership). No page fabricates data.

## Blocking Prerequisites

The following are **not yet satisfied** and are required before this root can
produce a signed HAP:

1. **HarmonyOS toolchain.** `ohpm`, `hvigor`, and the HarmonyOS SDK are not
   installed in the current development environment. `hvigor assembleHap`
   and `ohpm install` cannot run yet.
2. **ArkTS SDK adaptation.** `HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md` section 6
   requires Harmony packages to consume `/app/v3/api` through generated
   ArkTS/TypeScript app SDK clients *adapted for the Harmony runtime*. This
   repository generates the TypeScript (`sdkwork-agents-app-sdk-typescript`)
   and Flutter (`sdkwork-agents-app-sdk-flutter`) targets of
   `sdkwork-agents-app-sdk`; **no ArkTS target is produced by the SDK
   generation chain yet**. `core` therefore declares the SDK port contract and
   the token/configuration boundary, and does not fabricate a vendored copy of
   the transport.
3. **Bundle signing profile.** `config/host/harmony.*.example.json` are
   secret-free templates; a real signing profile reference must be supplied by
   DevEco Studio or CI secure storage.

## Package Family

| Package | Role | Layer role |
| --- | --- | --- |
| `packages/sdkwork-agents-harmony-mobile-core` | runtime config, SDK factories, token manager, session stores, page-state contract, host adapter contracts | frontend-core |
| `packages/sdkwork-agents-harmony-mobile-commons` | domain-neutral ArkUI components (page header, empty/loading states), theme adapters, i18n helpers | frontend-commons |
| `packages/sdkwork-agents-harmony-mobile-shell` | bottom-tab shell model, route registry and navigator, AuthGate integration, shell i18n | frontend-shell |
| `packages/sdkwork-agents-harmony-mobile-host` | typed HarmonyOS host adapters (preferences, device info, secure storage, ...) | frontend-host |
| `packages/sdkwork-agents-harmony-mobile-agents` | root route registry, agent catalog, conversation capability | frontend-feature |
| `packages/sdkwork-agents-harmony-mobile-inspiration` | inspiration discover feed | frontend-feature |
| `packages/sdkwork-agents-harmony-mobile-creative` | generation studio | frontend-feature |
| `packages/sdkwork-agents-harmony-mobile-assets` | asset library and detail sheet | frontend-feature |
| `packages/sdkwork-agents-harmony-mobile-membership` | membership catalog and checkout entry | frontend-feature |
| `packages/sdkwork-agents-harmony-mobile-profile` | profile hub and persisted settings form | frontend-feature |

## Page Registry

`packages/sdkwork-agents-harmony-mobile-agents/src/main/ets/routes/RouteContributions.ets`
is the contract-declared registry (`specs/client-page-parity.spec.json`
`clients.harmony.registry`). It carries every `app.agents.*` route id with
`pagePath`, `titleKey`, `auth`, `permissionHint`, presentation, and delivery state.
Tab-hosted pages are mounted by `entry/src/main/ets/pages/Index.ets`; stack pages
(membership, profile, settings) are registered for the platform router in their
package `src/main/resources/base/profile/route_map.json` under the canonical route
id, so the shell navigator opens them by route identity.

## Configuration

Non-secret runtime config materializes as
`config/app/runtime-env.<deploymentProfile>.<environment>.json` and declares
matching `environment`, `deploymentProfile`, `profileId`, and
`runtimeTarget=harmony-native`. Host/platform metadata belongs to
`config/host/` and must stay secret-free.

## Verification

Static verification runs today, without the HarmonyOS toolchain (from this
directory):

```bash
node ../../../sdkwork-specs/tools/check-apps-directory-index.mjs --root ../..
node ../../../sdkwork-specs/tools/check-frontend-composition.mjs --root ../..
node ../../../sdkwork-specs/tools/check-component-port-bindings.mjs --root ../..
node --test tests/harmony-surface-contract.test.mjs
```

Repository-wide gates that also cover this root (from the repository root,
requires `pnpm install`):

```bash
pnpm check
```

There is deliberately no `check:harmony-native` script: no HarmonyOS build
command can run until prerequisite 1 is satisfied, and a script that cannot
execute would be a false signal.
