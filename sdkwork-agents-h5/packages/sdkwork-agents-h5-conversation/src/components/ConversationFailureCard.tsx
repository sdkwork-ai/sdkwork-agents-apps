import { AlertTriangle, ArrowUpRight } from "lucide-react";

import { cn } from "@sdkwork/agents-h5-commons";

import { translateAgentsConversationText } from "../i18n";
import { requestAgentsTokenPlan } from "../services/conversationBilling";
import type { ConversationMessageFailure } from "../types";

export interface ConversationFailureCardProps {
  failure: ConversationMessageFailure;
}

/**
 * Actionable failure card for a conversation turn.
 *
 * A wallet shortfall previously surfaced as a raw SDK message (a large JSON
 * blob) with no way for the user to recover. The card states the cause in
 * localized copy and offers the funding entry point wired by the composition
 * root; generic failures keep a plain message so an infrastructure fault never
 * shows a "recharge" button.
 */
export function ConversationFailureCard({ failure }: ConversationFailureCardProps) {
  const isFunding = failure.kind === "insufficient_balance";
  const label = failure.action?.label ?? translateAgentsConversationText(
    "agents.conversation.error.buyCredits",
  );

  return (
    <div
      className={cn(
        "mt-2 flex w-full items-start gap-2 rounded-xl  px-3 py-2.5 text-[12px]",
        isFunding
          ? " bg-[var(--color-warning-bg,#FFF5E6)] text-[var(--color-warning-text,#A34F00)]"
          : " bg-[var(--color-danger-bg,#FFF1F0)] text-[var(--color-danger,#F53F3F)]",
      )}
      data-conversation-failure-card={failure.kind}
      role="alert"
    >
      <AlertTriangle aria-hidden className="mt-[2px] shrink-0" size={14} />
      <div className="min-w-0 flex-1 leading-5">
        <p className="whitespace-pre-wrap break-words">{failure.text}</p>
        {isFunding ? (
          <button
            className="mt-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
            onClick={() => requestAgentsTokenPlan()}
            type="button"
          >
            {label}
            <ArrowUpRight aria-hidden size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
