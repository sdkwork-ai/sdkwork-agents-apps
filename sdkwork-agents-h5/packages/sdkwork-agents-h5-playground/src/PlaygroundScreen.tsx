import { ConversationScreen } from "@sdkwork/agents-h5-conversation";

export interface PlaygroundScreenProps {
  /** Host-branded greeting title. */
  readonly welcomeTitle?: string;
  /** Greeting shown before the first turn. */
  readonly welcomeMessage?: string;
  readonly className?: string;
}

/**
 * Mobile Playground surface.
 *
 * The shell owns the page title/tab bar; this screen fills the host content
 * area and delegates the chat composition (top bar, session sheet, message
 * list, streaming composer) to the shared conversation surface.
 */
export function PlaygroundScreen({ welcomeTitle, welcomeMessage, className }: PlaygroundScreenProps) {
  return (
    <div className={`h-full min-h-0 w-full ${className ?? ""}`}>
      <ConversationScreen
        {...(welcomeTitle ? { welcomeTitle } : {})}
        {...(welcomeMessage ? { welcomeMessage } : {})}
        fillHost
        className="h-full"
      />
    </div>
  );
}
