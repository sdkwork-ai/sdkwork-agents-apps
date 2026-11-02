import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Crown, Settings2, UserRound } from "lucide-react";

import {
  Avatar,
  MobileScreenHeader,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsProfileText } from "../i18n";
import { ProfileService } from "../services/ProfileService";
import type {
  ProfileAccount,
  ProfileLink,
  ProfileMembership,
  ProfileUsage,
} from "../types";

type MembershipStatus = "loading" | "ready" | "unavailable";

function formatUsageCount(value: string | undefined): string {
  if (!value) return "0";
  try {
    return BigInt(value).toLocaleString();
  } catch {
    return value;
  }
}

function totalTokens(usage: ProfileUsage): string {
  try {
    return (BigInt(usage.inputTokens) + BigInt(usage.outputTokens)).toLocaleString();
  } catch {
    return formatUsageCount(usage.inputTokens);
  }
}

export interface ProfileScreenProps {
  links: readonly ProfileLink[];
  onNavigate: (path: string) => void;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * Profile hub behind `app.agents.profile.index`.
 *
 * Reachable from every tab; it is the mobile route to membership, projects,
 * library, automation, history, and settings. Account facts come from the
 * injected profile port (IAM session), never from fabricated local state.
 */
export function ProfileScreen({
  links,
  onNavigate,
  onBack,
  backLabel,
  className,
}: ProfileScreenProps) {
  const [account] = useState<ProfileAccount>(() => ProfileService.loadAccount());
  const [membership, setMembership] = useState<ProfileMembership | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>("loading");
  const [usage, setUsage] = useState<ProfileUsage | null>(null);

  const loadMembership = useCallback(async () => {
    setMembershipStatus("loading");
    try {
      const next = await ProfileService.loadMembership();
      setMembership(next);
      setMembershipStatus(next ? "ready" : "unavailable");
    } catch {
      setMembership(null);
      setMembershipStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    void loadMembership();
  }, [loadMembership]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await ProfileService.loadUsage();
        if (active) setUsage(next);
      } catch {
        if (active) setUsage(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const membershipText =
    membershipStatus === "loading"
      ? translateAgentsProfileText("agents.profile.membership.loading")
      : membershipStatus === "unavailable"
        ? translateAgentsProfileText("agents.profile.membership.unavailable")
        : membership?.active
          ? membership.label || translateAgentsProfileText("agents.profile.membership.title")
          : translateAgentsProfileText("agents.profile.membership.none");

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsProfileText("agents.profile.title")}
        {...(onBack ? { onBack } : {})}
        backLabel={backLabel ?? translateAgentsProfileText("agents.profile.back")}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <section className="mb-4 flex items-center gap-3 rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-4">
          <Avatar
            src={account.avatarUrl}
            alt={translateAgentsProfileText("agents.profile.avatarLabel")}
            fallback={account.displayName?.slice(0, 1) ?? "?"}
            shape="circle"
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
              {account.displayName ||
                translateAgentsProfileText(
                  account.signedIn
                    ? "agents.profile.account.signedIn"
                    : "agents.profile.account.signedOut",
                )}
            </p>
            <p className="truncate text-[12px] text-[var(--color-text-sub,#5B6B88)]">
              {account.signedIn
                ? translateAgentsProfileText("agents.profile.account.signedIn")
                : translateAgentsProfileText("agents.profile.account.signedOut")}
              {account.environment
                ? ` · ${translateAgentsProfileText("agents.profile.account.environment")}: ${account.environment}`
                : ""}
            </p>
          </div>
        </section>

        <button
          type="button"
          onClick={() => onNavigate("/membership")}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-4 text-left transition-colors hover:bg-[var(--color-primary-subtle,#E8F0FF)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-bg,#FFF5E6)]">
            <Crown size={20} className="text-[var(--color-warning,#FF7D00)]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium text-[var(--color-text-main,#0A1B3D)]">
              {translateAgentsProfileText("agents.profile.membership.title")}
            </span>
            <span className="block truncate text-[12px] text-[var(--color-text-sub,#5B6B88)]">{membershipText}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--color-text-tertiary,#8A97AD)]" aria-hidden />
        </button>

        <section className="mb-4 rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-medium text-[var(--color-text-main,#0F172A)]">
              {translateAgentsProfileText("agents.profile.usage.title")}
            </h2>
            {usage ? (
              <span className="text-[13px] font-semibold text-[var(--color-text-main,#0F172A)]">
                {translateAgentsProfileText("agents.profile.usage.tokens", {
                  count: totalTokens(usage),
                })}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-[var(--color-text-sub,#5B6B88)]">
            {usage
              ? translateAgentsProfileText("agents.profile.usage.turns", {
                  count: formatUsageCount(usage.turnCount),
                })
              : translateAgentsProfileText("agents.profile.usage.unavailable")}
          </p>
        </section>

        <h2 className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsProfileText("agents.profile.links.title")}
        </h2>
        <ul className="overflow-hidden rounded-2xl bg-[var(--color-surface-color,#FFFFFF)]">
          {links.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => onNavigate(link.path)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted,#EAF1FB)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-input-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]">
                  {link.id === "settings" ? (
                    <Settings2 size={16} aria-hidden />
                  ) : link.id === "profile" ? (
                    <UserRound size={16} aria-hidden />
                  ) : (
                    <ChevronRight size={16} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-[var(--color-text-main,#0A1B3D)]">
                    {link.label}
                  </span>
                  {link.description ? (
                    <span className="block truncate text-[11px] text-[var(--color-text-sub,#5B6B88)]">
                      {link.description}
                    </span>
                  ) : null}
                </span>
                {link.badge ? (
                  <span className="shrink-0 rounded-full bg-[var(--color-primary-blue,#165DFF)]/15 px-2 py-0.5 text-[10px] text-[var(--color-primary-blue,#165DFF)]">
                    {link.badge}
                  </span>
                ) : null}
                <ChevronRight size={16} className="shrink-0 text-[var(--color-text-sub,#5B6B88)]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
