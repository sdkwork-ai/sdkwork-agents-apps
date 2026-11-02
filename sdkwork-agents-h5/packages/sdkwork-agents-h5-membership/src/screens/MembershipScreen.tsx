import { useCallback, useEffect, useState } from "react";
import { Crown } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsMembershipText } from "../i18n";
import { MembershipService } from "../services/MembershipService";
import type {
  MembershipPlan,
  MembershipPointsRecord,
  MembershipSummary,
} from "../types";

type MembershipStatus = "loading" | "ready" | "unavailable" | "error";

export interface MembershipScreenProps {
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Membership catalog behind `app.agents.membership.catalog`.
 *
 * The page is reachable from the profile hub on every tab. When this client
 * root has not composed the membership/order transport it renders the
 * localized unavailable state with the actionable desktop alternative; it never
 * shows an invented plan, price, or benefit.
 */
export function MembershipScreen({
  onBack,
  backLabel,
  className,
}: MembershipScreenProps) {
  const [status, setStatus] = useState<MembershipStatus>("loading");
  const [summary, setSummary] = useState<MembershipSummary>({ active: false });
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsHistory, setPointsHistory] = useState<MembershipPointsRecord[]>([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setNotice(null);
    try {
      const catalog = await MembershipService.loadCatalog();
      setSummary(catalog.summary);
      setPlans([...catalog.plans]);
      setPointsBalance(catalog.pointsBalance ?? null);
      setPointsHistory([...(catalog.pointsHistory ?? [])]);
      setCheckoutAvailable(MembershipService.isCheckoutAvailable());
      setStatus(catalog.availability === "available" ? "ready" : "unavailable");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckout = useCallback(async (planId: string) => {
    try {
      const result = await MembershipService.startCheckout(planId);
      if (!result.started) {
        setNotice(translateAgentsMembershipText("agents.membership.checkout.unavailable"));
      }
    } catch {
      setNotice(translateAgentsMembershipText("agents.membership.checkout.unavailable"));
    }
  }, []);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsMembershipText("agents.membership.title")}
        {...(onBack ? { onBack } : {})}
        backLabel={backLabel ?? translateAgentsMembershipText("agents.membership.back")}
      />

      {status === "loading" ? (
        <MobileStateView
          kind="loading"
          message={translateAgentsMembershipText("agents.membership.loading")}
        />
      ) : status === "error" ? (
        <MobileStateView
          kind="error"
          message={translateAgentsMembershipText("agents.membership.loadFailed")}
          retryLabel={translateAgentsMembershipText("agents.membership.retry")}
          onRetry={() => void load()}
        />
      ) : status === "unavailable" ? (
        <MobileStateView
          kind="unavailable"
          message={translateAgentsMembershipText("agents.membership.unavailable")}
          retryLabel={translateAgentsMembershipText("agents.membership.retry")}
          onRetry={() => void load()}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <section className="mb-4 rounded-2xl bg-[var(--color-surface-strong,#DCE8F9)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <Crown size={18} className="text-[var(--color-warning,#FF7D00)]" aria-hidden />
              <h2 className="text-[13px] font-medium text-[var(--color-text-secondary,#5B6B88)]">
                {translateAgentsMembershipText("agents.membership.current.title")}
              </h2>
            </div>
            <p className="text-[18px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
              {summary.active
                ? summary.levelName || translateAgentsMembershipText("agents.membership.current.title")
                : translateAgentsMembershipText("agents.membership.current.none")}
            </p>
            {summary.active && summary.expiresAt ? (
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary,#8A97AD)]">
                {translateAgentsMembershipText("agents.membership.current.expiresAt", {
                  date: formatDate(summary.expiresAt),
                })}
              </p>
            ) : null}
          </section>

          {pointsBalance !== null ? (
            <section className="mb-4 flex items-center justify-between rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] px-4 py-3">
              <span className="text-[13px] text-[var(--color-text-secondary,#5B6B88)]">
                {translateAgentsMembershipText("agents.membership.points.title")}
              </span>
              <span className="text-[16px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
                {translateAgentsMembershipText("agents.membership.points.balance", {
                  count: pointsBalance.toLocaleString(),
                })}
              </span>
            </section>
          ) : null}

          {pointsHistory.length > 0 ? (
            <section className="mb-4 rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-4">
              <h2 className="mb-2 text-[13px] font-medium text-[var(--color-text-secondary,#5B6B88)]">
                {translateAgentsMembershipText("agents.membership.points.history")}
              </h2>
              <ul className="divide-y divide-[var(--color-border-color,#E5EAF3)]">
                {pointsHistory.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-[var(--color-text-main,#0A1B3D)]">
                        {record.remark || record.changeType}
                      </p>
                      {record.createdAt ? (
                        <p className="text-[11px] text-[var(--color-text-tertiary,#8A97AD)]">
                          {formatDate(record.createdAt)}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={
                        record.changeAmount.startsWith("-")
                          ? "shrink-0 text-[13px] font-semibold text-[var(--color-danger,#F53F3F)]"
                          : "shrink-0 text-[13px] font-semibold text-[var(--color-success,#00B42A)]"
                      }
                    >
                      {record.changeAmount.startsWith("-") ? "" : "+"}
                      {record.changeAmount}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {notice ? (
            <p role="alert" className="mb-3 rounded-xl bg-[var(--color-danger-bg,#FFF1F0)] px-3 py-2 text-[12px] text-[var(--color-danger,#F53F3F)]">
              {notice}
            </p>
          ) : null}

          <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
            {translateAgentsMembershipText("agents.membership.plans.title")}
          </h2>

          {!checkoutAvailable ? (
            <p className="mb-3 rounded-xl bg-[var(--color-hover-bg,#EAF1FB)] px-3 py-2 text-[12px] text-[var(--color-text-sub,#5B6B88)]">
              {translateAgentsMembershipText("agents.membership.checkout.unavailable")}
            </p>
          ) : null}

          {plans.length === 0 ? (
            <p className="rounded-xl bg-[var(--color-surface-muted,#EAF1FB)] px-3 py-6 text-center text-[12px] text-[var(--color-text-sub,#5B6B88)]">
              {translateAgentsMembershipText("agents.membership.plans.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
                      {plan.name}
                    </h3>
                    <p className="text-[13px] text-[var(--color-text-sub,#5B6B88)]">
                      {[plan.priceLabel, plan.periodLabel].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                  {plan.benefits.length > 0 ? (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-[var(--color-text-sub,#5B6B88)]">
                        {translateAgentsMembershipText("agents.membership.benefits.title")}
                      </p>
                      <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-[var(--color-text-main,#0A1B3D)]">
                        {plan.benefits.map((benefit) => (
                          <li key={benefit}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={!checkoutAvailable}
                    onClick={() => void handleCheckout(plan.id)}
                    className="mt-3 w-full rounded-xl bg-[var(--color-primary-blue,#165DFF)] py-2 text-[13px] font-medium text-white disabled:opacity-50"
                  >
                    {translateAgentsMembershipText("agents.membership.checkout.action")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
