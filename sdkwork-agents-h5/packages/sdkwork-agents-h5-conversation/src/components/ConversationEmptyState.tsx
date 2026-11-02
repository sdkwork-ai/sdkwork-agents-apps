import { Bot } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";

export interface ConversationEmptyStateProps {
  /** Optional agent welcome message shown under the greeting. */
  welcomeMessage?: string;
  className?: string;
}

/**
 * Empty conversation state.
 *
 * The mascot is drawn from the shared icon set so every mobile root renders the
 * same composition without depending on a bitmap asset that mini program
 * subpackages and Flutter bundles would each have to ship separately.
 */
export function ConversationEmptyState({
  welcomeMessage,
  className,
}: ConversationEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-6 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-24 w-24 items-center justify-center rounded-[32px]",
          "bg-[var(--color-primary-subtle,#E8F0FF)]",
        )}
      >
        <Bot
          size={52}
          className="text-[var(--color-primary-blue,#165DFF)]"
          aria-hidden="true"
        />
      </div>
      <p className="text-[26px] font-semibold leading-9 text-[var(--color-text-main,#0A1B3D)]">
        {translateAgentsConversationText("agents.conversation.empty.greeting")}
      </p>
      <p className="text-[13px] leading-6 text-[var(--color-text-sub,#5B6B88)]">
        {welcomeMessage?.trim() ||
          translateAgentsConversationText("agents.conversation.empty.hint")}
      </p>
    </div>
  );
}
