import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChatMessageFailure } from '../types';
import { requestAgentsTokenPlan } from '../services/chatBalancePort';

export interface ChatFailureCardProps {
  failure: ChatMessageFailure;
}

/**
 * Actionable failure card rendered inside a chat turn.
 *
 * Exists because a wallet shortfall used to surface as an inert warning line
 * ("upstream service returned a bad gateway response") that told the user
 * nothing they could act on. The card states the cause and offers the funding
 * entry point, reusing the same host hook as the composer balance alert so both
 * surfaces route to one purchase flow.
 *
 * The action is only rendered for the funding case; a generic failure falls back
 * to a plain message so we never offer a "recharge" button for infrastructure
 * faults.
 */
export const ChatFailureCard: React.FC<ChatFailureCardProps> = ({ failure }) => {
  const { t } = useTranslation('chat');

  const isFunding = failure.kind === 'insufficient_balance';
  const actionLabel = failure.action?.label ?? t('balance.buyCredits');

  return (
    <div
      className={
        isFunding
          ? 'mt-2 flex w-full items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
          : 'mt-2 flex w-full items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
      }
      data-chat-failure-card={failure.kind}
      role="alert"
    >
      <AlertTriangle aria-hidden className="mt-[2px] shrink-0" size={16} />
      <div className="min-w-0 flex-1 leading-5">
        <p className="whitespace-pre-wrap">{failure.text}</p>
        {isFunding && (
          <button
            className="mt-1.5 inline-flex items-center gap-1 rounded-md font-semibold underline decoration-amber-500/60 underline-offset-2 transition-colors hover:decoration-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            onClick={() => requestAgentsTokenPlan()}
            type="button"
          >
            {actionLabel}
            <ArrowUpRight aria-hidden size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
