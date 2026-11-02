import { useCallback, useEffect, useState } from "react";
import { Heart, X } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsInspirationText } from "../i18n";
import { InspirationService } from "../services/InspirationService";
import type { InspirationChannel, InspirationItem } from "../types";

type InspirationStatus = "loading" | "ready" | "empty" | "error" | "unavailable";

export interface InspirationScreenProps {
  className?: string;
}

const CHANNELS: readonly InspirationChannel[] = ["discover", "featured"];

/**
 * Inspiration surface behind the `灵感` tab (`app.agents.inspiration.discover`).
 *
 * The feed is read through the injected inspiration port. A root without a
 * composed feed transport renders the explicit unavailable state; no card,
 * author, or like count is fabricated.
 */
export function InspirationScreen({ className }: InspirationScreenProps) {
  const [channel, setChannel] = useState<InspirationChannel>("discover");
  const [status, setStatus] = useState<InspirationStatus>("loading");
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [detail, setDetail] = useState<InspirationItem | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const feed = await InspirationService.loadFeed(channel);
      if (feed.availability === "unavailable") {
        setItems([]);
        setStatus("unavailable");
        return;
      }
      setItems([...feed.items]);
      setStatus(feed.items.length > 0 ? "ready" : "empty");
    } catch {
      setItems([]);
      setStatus("error");
    }
  }, [channel]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setStatus("loading");
      try {
        const feed = await InspirationService.loadFeed(channel);
        if (!active) return;
        if (feed.availability === "unavailable") {
          setItems([]);
          setStatus("unavailable");
          return;
        }
        setItems([...feed.items]);
        setStatus(feed.items.length > 0 ? "ready" : "empty");
      } catch {
        if (active) {
          setItems([]);
          setStatus("error");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [channel]);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader title={translateAgentsInspirationText("agents.inspiration.title")} />

      <div className="flex shrink-0 gap-1 px-4 pb-3" role="tablist" aria-label={translateAgentsInspirationText("agents.inspiration.title")}>
        {CHANNELS.map((entry) => {
          const active = entry === channel;
          return (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (!active) {
                  setChannel(entry);
                }
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-primary-blue,#165DFF)] text-white"
                  : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]",
              )}
            >
              {translateAgentsInspirationText(`agents.inspiration.segment.${entry}`)}
            </button>
          );
        })}
      </div>

      {status === "ready" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ul className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setDetail(item)}
                  aria-label={`${translateAgentsInspirationText("agents.inspiration.openHint")}: ${item.title}`}
                  className="group relative block w-full overflow-hidden rounded-2xl bg-[var(--color-input-bg,#EAF1FB)] text-left"
                >
                  <div className="aspect-[3/4] w-full">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[var(--color-hover-bg,#EAF1FB)]" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="line-clamp-2 text-[12px] font-medium text-white">{item.title}</p>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-white/80">
                      <span className="truncate">{item.author ?? ""}</span>
                      {typeof item.likes === "number" ? (
                        <span className="flex shrink-0 items-center gap-0.5">
                          <Heart size={11} aria-hidden />
                          {item.likes}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <MobileStateView
          kind={status}
          message={translateAgentsInspirationText(
            status === "loading"
              ? "agents.inspiration.loading"
              : status === "empty"
                ? "agents.inspiration.empty"
                : status === "error"
                  ? "agents.inspiration.loadFailed"
                  : "agents.inspiration.unavailable",
          )}
          {...(status === "loading"
            ? {}
            : {
                retryLabel: translateAgentsInspirationText("agents.inspiration.retry"),
                onRetry: () => void load(),
              })}
        />
      )}

      {detail ? (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-[var(--color-scrim,rgba(10,27,61,0.45))]">
          <button
            type="button"
            aria-label={translateAgentsInspirationText("agents.inspiration.detailClose")}
            onClick={() => setDetail(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />
          <div className="relative max-h-[80%] overflow-y-auto rounded-t-3xl bg-[var(--color-surface-color,#FFFFFF)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
                {detail.title}
              </h2>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label={translateAgentsInspirationText("agents.inspiration.detailClose")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-hover-bg,#EAF1FB)]"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
            {detail.coverUrl ? (
              <img
                src={detail.coverUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="mb-3 max-h-[45vh] w-full rounded-2xl object-contain"
              />
            ) : null}
            {detail.prompt ? (
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsInspirationText("agents.inspiration.promptLabel")}
                </p>
                <p className="whitespace-pre-wrap text-[13px] leading-6 text-[var(--color-text-main,#0A1B3D)]">
                  {detail.prompt}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
