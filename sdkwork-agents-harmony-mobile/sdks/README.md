# sdks/

This directory follows `SDK_WORKSPACE_GENERATION_SPEC.md`.

Harmony roots consume the application-owned generated app SDK from the
repository-level `sdks/` workspace. They must not contain hand-edited generated
output.

Current coverage of `sdks/sdkwork-agents-app-sdk`:

| Target | Workspace | State |
| --- | --- | --- |
| typescript | `sdkwork-agents-app-sdk-typescript` | materialized |
| flutter | `sdkwork-agents-app-sdk-flutter` | materialized |
| arkts | _none_ | not produced by the SDK generation chain yet |

Until an ArkTS target exists, the HarmonyOS root consumes the TypeScript SDK
facade through an adapted port declared in
`packages/sdkwork-agents-harmony-mobile-core/src/main/ets/sdk/AgentsAppSdkClient.ets`.
