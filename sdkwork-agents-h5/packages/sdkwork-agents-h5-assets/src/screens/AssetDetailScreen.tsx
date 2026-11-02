import { useCallback, useEffect, useState } from "react";
import { FileQuestion, X } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { getAgentsAssetsLocale, translateAgentsAssetsText } from "../i18n";
import { AssetsService } from "../services/AssetsService";
import type { AssetItem } from "../types";

type DetailStatus = "loading" | "ready" | "missing" | "unavailable" | "error";

export interface AssetDetailScreenProps {
  assetId: string;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(getAgentsAssetsLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Standalone asset detail behind `app.agents.assets.detail`.
 *
 * The page resolves one record through the injected assets port so a deep link
 * or a share target opens the same record the library shows; it never renders a
 * guessed media URL.
 */
export function AssetDetailScreen({
  assetId,
  onBack,
  backLabel,
  className,
}: AssetDetailScreenProps) {
  const [status, setStatus] = useState<DetailStatus>("loading");
  const [asset, setAsset] = useState<AssetItem | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const library = await AssetsService.list();
      if (library.availability === "unavailable") {
        setStatus("unavailable");
        return;
      }
      const found = library.items.find((item) => item.id === assetId) ?? null;
      setAsset(found);
      setStatus(found ? "ready" : "missing");
    } catch {
      setStatus("error");
    }
  }, [assetId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsAssetsText("agents.assets.detail.title")}
        {...(onBack ? { onBack } : {})}
        backLabel={backLabel ?? translateAgentsAssetsText("agents.assets.detail.close")}
      />

      {status === "loading" ? (
        <MobileStateView
          kind="loading"
          message={translateAgentsAssetsText("agents.assets.loading")}
        />
      ) : status === "unavailable" ? (
        <MobileStateView
          kind="unavailable"
          message={translateAgentsAssetsText("agents.assets.unavailable")}
          retryLabel={translateAgentsAssetsText("agents.assets.retry")}
          onRetry={() => void load()}
        />
      ) : status === "error" ? (
        <MobileStateView
          kind="error"
          message={translateAgentsAssetsText("agents.assets.loadFailed")}
          retryLabel={translateAgentsAssetsText("agents.assets.retry")}
          onRetry={() => void load()}
        />
      ) : status === "missing" ? (
        <MobileStateView kind="empty" message={translateAgentsAssetsText("agents.assets.empty")} />
      ) : asset ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {asset.previewUrl && asset.kind === "image" ? (
            <img
              src={asset.previewUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="mb-4 max-h-[60vh] w-full rounded-2xl object-contain"
            />
          ) : asset.previewUrl && asset.kind === "video" ? (
            <video
              src={asset.previewUrl}
              controls
              playsInline
              className="mb-4 max-h-[60vh] w-full rounded-2xl bg-[var(--color-surface-strong,#DCE8F9)]"
            />
          ) : asset.previewUrl && asset.kind === "audio" ? (
            <audio src={asset.previewUrl} controls className="mb-4 w-full" />
          ) : (
            <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-2xl bg-[var(--color-input-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]">
              <FileQuestion size={24} aria-hidden />
            </div>
          )}

          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-sub,#5B6B88)]">
                {translateAgentsAssetsText("agents.assets.detail.kind")}
              </dt>
              <dd>{translateAgentsAssetsText(`agents.assets.kind.${asset.kind}`)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-sub,#5B6B88)]">
                {translateAgentsAssetsText("agents.assets.detail.createdAt")}
              </dt>
              <dd>{formatDateTime(asset.createdAt)}</dd>
            </div>
            {asset.toolId ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-sub,#5B6B88)]">
                  {translateAgentsAssetsText("agents.assets.detail.source")}
                </dt>
                <dd className="truncate">{asset.toolId}</dd>
              </div>
            ) : null}
          </dl>

          {asset.previewUrl ? (
            <a
              href={asset.previewUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 block rounded-xl bg-[var(--color-primary-blue,#165DFF)] py-2.5 text-center text-[14px] font-medium text-white"
            >
              {translateAgentsAssetsText("agents.assets.detail.open")}
            </a>
          ) : null}

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--color-surface-muted,#EAF1FB)] py-2 text-[13px] text-[var(--color-text-main,#0A1B3D)] transition-colors hover:bg-[var(--color-surface-strong,#DCE8F9)]"
            >
              <X size={14} aria-hidden />
              {translateAgentsAssetsText("agents.assets.detail.close")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
