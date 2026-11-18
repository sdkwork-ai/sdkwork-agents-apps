# @sdkwork/agents-h5-playground

Mobile Playground capability for SDKWork Agents.

- `PlaygroundScreen` fills a host content area and renders the shared
  `@sdkwork/agents-h5-conversation` surface (session sheet, streaming composer,
  history).
- `configurePlaygroundRuntime({ getClient, locale })` binds an injected
  generated Agents app SDK client to the conversation port. Hosts (for example
  `@sdkwork/cloudrouter-h5-playground`) own the client, base URL and token
  manager; this package never constructs raw HTTP clients.
