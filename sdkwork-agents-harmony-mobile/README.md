# SDKWork Agents HarmonyOS Mobile

Native HarmonyOS (ArkTS/ArkUI) client application root for SDKWork Agents.

## Status

Architecture scaffold materialized against
`HARMONY_APP_MOBILE_ARCHITECTURE_SPEC.md`. This is the first
`-harmony-mobile` application root in the SDKWork workspace, so the package
family, composition contracts, and host adapter boundaries are established
here for the first time.

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
| `packages/sdkwork-agents-harmony-mobile-core` | runtime config, SDK factories, token manager, session stores, route registry, host adapter contracts | frontend-core |
| `packages/sdkwork-agents-harmony-mobile-commons` | domain-neutral ArkUI components, theme adapters, i18n helpers | frontend-commons |
| `packages/sdkwork-agents-harmony-mobile-shell` | app shell, navigation/page stack, AuthGate integration | frontend-shell |
| `packages/sdkwork-agents-harmony-mobile-host` | typed HarmonyOS host adapters (camera, QR, secure storage, push, ...) | frontend-host |
| `packages/sdkwork-agents-harmony-mobile-agents` | agent catalog, creation, and conversation capability | frontend-feature |

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
