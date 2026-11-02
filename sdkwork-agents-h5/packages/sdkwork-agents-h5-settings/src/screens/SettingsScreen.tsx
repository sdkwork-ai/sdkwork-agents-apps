import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsSettingsText } from "../i18n";
import { getSettingsPort } from "../services/settingsPort";

export interface SettingsScreenProps {
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-[14px] text-[var(--color-text-main,#0A1B3D)]">{label}</span>
      {value ? (
        <span className="truncate text-[13px] text-[var(--color-text-sub,#5B6B88)]">{value}</span>
      ) : null}
    </div>
  );
}

/**
 * Settings surface behind `app.agents.settings.index`.
 *
 * The page owns presentation only: environment facts, session teardown, and
 * device-cache clearing come from the injected settings port. Signing out
 * returns to the login gate instead of leaving a half-authenticated shell.
 */
export function SettingsScreen({ onBack, backLabel, className }: SettingsScreenProps) {
  const port = getSettingsPort();
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">(
    port?.themeLabel ?? "system",
  );

  if (!port) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        <MobileScreenHeader
          title={translateAgentsSettingsText("agents.settings.title")}
          {...(onBack ? { onBack } : {})}
          backLabel={backLabel ?? translateAgentsSettingsText("agents.settings.back")}
        />
        <MobileStateView
          kind="unavailable"
          message={translateAgentsSettingsText("agents.settings.unavailable")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsSettingsText("agents.settings.title")}
        {...(onBack ? { onBack } : {})}
        backLabel={backLabel ?? translateAgentsSettingsText("agents.settings.back")}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <h2 className="mb-2 mt-1 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsSettingsText("agents.settings.section.account")}
        </h2>
        <section className="mb-4 overflow-hidden rounded-2xl bg-[var(--color-surface-color,#FFFFFF)]">
          <SettingRow
            label={translateAgentsSettingsText("agents.settings.account.label")}
            value={port.accountLabel || translateAgentsSettingsText("agents.settings.account.anonymous")}
          />
        </section>

        <h2 className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsSettingsText("agents.settings.section.app")}
        </h2>
        <section className="mb-4 overflow-hidden rounded-2xl bg-[var(--color-surface-color,#FFFFFF)]">
          <SettingRow
            label={translateAgentsSettingsText("agents.settings.environment")}
            value={port.environment}
          />
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-[var(--color-text-main,#0A1B3D)]">
                {translateAgentsSettingsText("agents.settings.locale")}
              </span>
              <span className="text-[13px] text-[var(--color-text-sub,#5B6B88)]">
                {port.localeLabel}
              </span>
            </div>
            <div className="mt-2 flex gap-2" role="group" aria-label={translateAgentsSettingsText("agents.settings.locale")}>
              {([
                ["zh-CN", "agents.settings.language.zhCn"],
                ["en-US", "agents.settings.language.enUs"],
              ] as const).map(([locale, labelKey]) => {
                const active = port.localeLabel === locale;
                return (
                  <button
                    key={locale}
                    type="button"
                    aria-pressed={active}
                    onClick={() => port.setLocale(locale)}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[var(--color-primary,#165DFF)] text-white"
                        : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-main,#0A1B3D)]",
                    )}
                  >
                    {translateAgentsSettingsText(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-[var(--color-text-main,#0A1B3D)]">
                {translateAgentsSettingsText("agents.settings.theme")}
              </span>
              <span className="text-[13px] text-[var(--color-text-sub,#5B6B88)]">
                {translateAgentsSettingsText(`agents.settings.theme.${themeMode}`)}
              </span>
            </div>
            <div className="mt-2 flex gap-2" role="group" aria-label={translateAgentsSettingsText("agents.settings.theme")}>
              {(["system", "light", "dark"] as const).map((mode) => {
                const active = themeMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setThemeMode(mode);
                      port.setTheme(mode);
                    }}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[var(--color-primary,#165DFF)] text-white"
                        : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-main,#0A1B3D)]",
                    )}
                  >
                    {translateAgentsSettingsText(`agents.settings.theme.${mode}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {notice ? (
          <p role="status" className="mb-3 rounded-xl bg-[var(--color-hover-bg,#EAF1FB)] px-3 py-2 text-[12px] text-[var(--color-text-sub,#5B6B88)]">
            {notice}
          </p>
        ) : null}

        <h2 className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsSettingsText("agents.settings.section.data")}
        </h2>
        <section className="overflow-hidden rounded-2xl bg-[var(--color-surface-color,#FFFFFF)]">
          <button
            type="button"
            onClick={() => {
              port.clearLocalCache();
              setNotice(translateAgentsSettingsText("agents.settings.cache.cleared"));
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-hover-bg,#EAF1FB)]"
          >
            <Trash2 size={16} aria-hidden />
            <span className="text-[14px]">{translateAgentsSettingsText("agents.settings.cache.clear")}</span>
          </button>
          <div>
            {confirmingSignOut ? (
              <div className="px-4 py-3">
                <p className="mb-2 text-[12px] text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsSettingsText("agents.settings.signOut.confirm")}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={port.signOut}
                    className="flex-1 rounded-xl bg-[var(--color-danger,#F53F3F)] py-2 text-[13px] font-medium text-white"
                  >
                    {translateAgentsSettingsText("agents.settings.signOut.action")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingSignOut(false)}
                    className="flex-1 rounded-xl bg-[var(--color-hover-bg,#EAF1FB)] py-2 text-[13px] font-medium"
                  >
                    {translateAgentsSettingsText("agents.settings.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingSignOut(true)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[var(--color-danger,#F53F3F)] transition-colors hover:bg-[var(--color-hover-bg,#EAF1FB)]"
              >
                <LogOut size={16} aria-hidden />
                <span className="text-[14px]">
                  {translateAgentsSettingsText("agents.settings.signOut")}
                </span>
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
