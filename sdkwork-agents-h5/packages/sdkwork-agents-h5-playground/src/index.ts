/**
 * Public integration surface of the Agents H5 Playground capability.
 *
 * The playground is the mobile chat workbench: a host injects its generated
 * Agents app SDK client, this package binds the conversation port, and the
 * screen renders the shared mobile conversation composition.
 */

export { PlaygroundScreen } from "./PlaygroundScreen";
export type { PlaygroundScreenProps } from "./PlaygroundScreen";

export { configurePlaygroundRuntime } from "./runtime";
export type { PlaygroundRuntimeOptions } from "./runtime";
