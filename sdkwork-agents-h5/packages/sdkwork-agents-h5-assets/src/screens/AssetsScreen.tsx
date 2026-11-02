import { useCallback, useEffect, useMemo, useState } from "react";
import { FileQuestion, Play, X } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import {
  getAgentsAssetsLocale,
  translateAgentsAssetsText,
  type AgentsAssetsLocale,
} from "../i18n";
import { AssetsService } from "../services/AssetsService";
import type { AssetItem, AssetKind } from "../types";

type AssetsStatus = "loading" | "ready" | "empty" | "emptyFiltered" | "error" | "unavailable";

const FILTERS: readonly (AssetKind | "all")[] = ["all", "image", "video", "audio", "other"];

export interface AssetsScreenProps {
  className?: string;
}

function formatGroupLabel(dateKey: string, locale: AgentsAssetsLocale): string {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }
  return new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(date);
}

function formatDateTime(iso: string, locale: AgentsAssetsLocale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Asset library behind the `资产` tab (`app.agents.assets.list`).
 *
 * Records come from `/ai/assets` through the injected assets port and are
 * grouped by calendar day on the device. A record without a resolvable preview
 * still renders a typed tile instead of disappearing.
 */
export function AssetsScreen({ className }: AssetsScreenProps) {
  const [status, setStatus] = useState<AssetsStatus>("loading");
  const [items, setItems] = useState<AssetItem[]>([]);
  const [kind, setKind] = useState<AssetKind | "all">("all");
  const [detail, setDetail] = useState<AssetItem | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const library = await AssetsService.list();
      if (library.availability === "unavailable") {
        setItems([]);
        setStatus("unavailable");
        return;
      }
      setItems([...library.items]);
      setStatus(library.items.length > 0 ? "ready" : "empty");
    } catch {
      setItems([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const filtered = AssetsService.filterByKind(items, kind);
    return AssetsService.group(filtered);
  }, [items, kind]);

  const visibleCount = useMemo(
    () => groups.reduce((total, group) => total + group.items.length, 0),
    [groups],
  );

  const locale = getAgentsAssetsLocale();
  const effectiveStatus: AssetsStatus =
    status === "ready" && visibleCount === 0
      ? items.length === 0
        ? "empty"
        : "emptyFiltered"
      : status;

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsAssetsText("agents.assets.title")}
        {...(visibleCount > 0
          ? {
              subtitle: translateAgentsAssetsText("agents.assets.count", {
                count: visibleCount,
              }),
            }
          : {})}
      />

      <div className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-3">
        {FILTERS.map((entry) => {
          const active = entry === kind;
          const labelKey =
            entry === "all" ? "agents.assets.filter.all" : `agents.assets.filter.${entry}`;
          return (
            <button
              key={entry}
              type="button"
              aria-pressed={active}
              onClick={() => setKind(entry)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-primary-blue,#165DFF)] text-white"
                  : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]",
              )}
            >
              {translateAgentsAssetsText(labelKey)}
            </button>
          );
        })}
      </div>

      {effectiveStatus === "ready" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {groups.map((group) => (
            <section key={group.dateKey} className="mb-4">
              <h2 className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
                {formatGroupLabel(group.dateKey, locale)}
              </h2>
              <ul className="grid grid-cols-3 gap-1.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setDetail(item)}
                      aria-label={`${translateAgentsAssetsText("agents.assets.detail.preview")}: ${item.toolId || item.mediaKind}`}
                      className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-[var(--color-input-bg,#EAF1FB)]"
                    >
                      {item.previewUrl && item.kind === "image" ? (
                        <img
                          src={item.previewUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : item.previewUrl && item.kind === "video" ? (
                        <video
                          src={item.previewUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[var(--color-text-sub,#5B6B88)]">
                          {item.kind === "audio" ? (
                            <Play size={20} aria-hidden />
                          ) : (
                            <FileQuestion size={20} aria-hidden />
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <MobileStateView
          kind={effectiveStatus === "emptyFiltered" ? "empty" : effectiveStatus}
          message={translateAgentsAssetsText(
            effectiveStatus === "loading"
              ? "agents.assets.loading"
              : effectiveStatus === "error"
                ? "agents.assets.loadFailed"
                : effectiveStatus === "unavailable"
                  ? "agents.assets.unavailable"
                  : effectiveStatus === "emptyFiltered"
                    ? "agents.assets.emptyFiltered"
                    : "agents.assets.empty",
          )}
          {...(effectiveStatus === "loading"
            ? {}
            : {
                retryLabel: translateAgentsAssetsText("agents.assets.retry"),
                onRetry: () => void load(),
              })}
        />
      )}

      {detail ? (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-[var(--color-scrim,rgba(10,27,61,0.45))]">
          <button
            type="button"
            aria-label={translateAgentsAssetsText("agents.assets.detail.close")}
            onClick={() => setDetail(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <div className="relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-[var(--color-surface-color,#FFFFFF)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
                {translateAgentsAssetsText("agents.assets.detail.title")}
              </h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label={translateAgentsAssetsText("agents.assets.detail.close")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-hover-bg,#EAF1FB)]"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            {detail.previewUrl && detail.kind === "image" ? (
              <img
                src={detail.previewUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="mb-4 max-h-[55vh] w-full rounded-2xl object-contain"
              />
            ) : detail.previewUrl && detail.kind === "video" ? (
              <video
                src={detail.previewUrl}
                controls
                playsInline
                className="mb-4 max-h-[55vh] w-full rounded-2xl bg-[var(--color-surface-strong,#DCE8F9)]"
              />
            ) : detail.previewUrl && detail.kind === "audio" ? (
              <audio src={detail.previewUrl} controls className="mb-4 w-full" />
            ) : null}

            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsAssetsText("agents.assets.detail.kind")}
                </dt>
                <dd>{translateAgentsAssetsText(`agents.assets.kind.${detail.kind}`)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsAssetsText("agents.assets.detail.createdAt")}
                </dt>
                <dd>{formatDateTime(detail.createdAt, locale)}</dd>
              </div>
              {detail.toolId ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--color-text-sub,#5B6B88)]">
                    {translateAgentsAssetsText("agents.assets.detail.source")}
                  </dt>
                  <dd className="truncate">{detail.toolId}</dd>
                </div>
              ) : null}
            </dl>

            {detail.previewUrl ? (
              <a
                href={detail.previewUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 block rounded-xl bg-[var(--color-primary-blue,#165DFF)] py-2.5 text-center text-[14px] font-medium text-white"
              >
                {translateAgentsAssetsText("agents.assets.detail.open")}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
