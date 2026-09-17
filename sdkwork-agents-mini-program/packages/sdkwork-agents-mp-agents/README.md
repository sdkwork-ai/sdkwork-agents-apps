# sdkwork-agents-mp-agents

Agents capability for the mini program: catalog listing, paging, view models,
locale fragments, and route contributions with mini program placement metadata.

SDK access is injected: this package never constructs an SDK client. The
platform page obtains the client from the mini program runtime bundle and hands
it to `createAgentCatalogService`.

Authority: `MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md` sections 3, 4, and 6.
