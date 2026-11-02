import { useCallback, useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, LayoutGrid, Music, Trash2, Video, Wand2 } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsCreativeText } from "../i18n";
import { CreativeService } from "../services/CreativeService";
import type {
  CreativeAspect,
  CreativeCatalog,
  CreativeMedia,
  CreativeModality,
  CreativeRun,
  CreativeTool,
} from "../types";

type CatalogStatus = "loading" | "ready" | "error";

const ASPECTS: readonly CreativeAspect[] = ["square", "landscape", "portrait"];

const MODALITY_ICON = {
  image: ImageIcon,
  video: Video,
  music: Music,
} as const satisfies Record<CreativeModality, typeof ImageIcon>;

export interface CreativeScreenProps {
  /** Opens the read-only canvas projection of the PC workflow. */
  onOpenCanvas?: () => void;
  className?: string;
}

function MediaTile({ media, label }: { media: CreativeMedia; label: string }) {
  if (media.kind === "image") {
    return (
      <a href={media.url} target="_blank" rel="noreferrer noopener" aria-label={label}>
        <img
          src={media.url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-square w-full rounded-xl object-cover"
        />
      </a>
    );
  }
  if (media.kind === "video") {
    return (
      <video
        src={media.url}
        controls
        playsInline
        preload="metadata"
        className="aspect-square w-full rounded-xl bg-[var(--color-surface-strong,#DCE8F9)] object-cover"
      />
    );
  }
  return <audio src={media.url} controls className="w-full" />;
}

function RunSummary({ run }: { run: CreativeRun }) {
  const Icon = MODALITY_ICON[run.modality];
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-color,#FFFFFF)] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary,#165DFF)]">
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[var(--color-text-main,#0A1B3D)]">{run.prompt}</p>
        <p className="text-[11px] text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsCreativeText(`agents.creative.modality.${run.modality}`)} ·{" "}
          {translateAgentsCreativeText(`agents.creative.aspect.${run.aspect}`)} ·{" "}
          {new Date(run.createdAt).toLocaleString()}
        </p>
      </div>
      {run.media.length > 0 ? (
        <span className="shrink-0 rounded-full bg-[var(--color-primary-subtle,#E8F0FF)] px-2 py-0.5 text-[10px] text-[var(--color-primary-blue,#165DFF)]">
          {run.media.length}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Creative studio behind the `生成` tab (`app.agents.creative.studio`).
 *
 * The tool directory is the authoritative list of modalities the tenant can
 * invoke; the screen never invents a tool or a result. A tenant with no
 * generation tool sees the explicit unavailable state.
 */
export function CreativeScreen({ onOpenCanvas, className }: CreativeScreenProps) {
  const [catalog, setCatalog] = useState<CreativeCatalog | null>(null);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<CreativeAspect>("square");
  const [runs, setRuns] = useState<CreativeRun[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await CreativeService.loadCatalog();
      setCatalog(next);
      setRuns(CreativeService.listRuns());
      if (next.availability === "available" && next.tools.length > 0) {
        setSelectedToolId((current) =>
          next.tools.some((tool) => tool.id === current) ? current : next.tools[0].id,
        );
      }
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedTool: CreativeTool | undefined = useMemo(
    () => catalog?.tools.find((tool) => tool.id === selectedToolId),
    [catalog, selectedToolId],
  );

  const latestRun = runs[0];

  const handleGenerate = useCallback(async () => {
    if (!selectedTool) {
      return;
    }
    if (prompt.trim().length === 0) {
      setError(translateAgentsCreativeText("agents.creative.prompt.required"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const run = await CreativeService.generate({ tool: selectedTool, prompt, aspect });
      setRuns(CreativeService.listRuns());
      setPrompt("");
      if (run.status === "failed") {
        setError(run.error ?? translateAgentsCreativeText("agents.creative.result.failed"));
      }
    } catch {
      setError(translateAgentsCreativeText("agents.creative.generateFailed"));
    } finally {
      setSubmitting(false);
    }
  }, [aspect, prompt, selectedTool]);

  const handleClearHistory = useCallback(() => {
    CreativeService.clearRuns();
    setRuns([]);
  }, []);

  const catalogUnavailable = catalog?.availability === "unavailable";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsCreativeText("agents.creative.title")}
        action={
          <div className="flex items-center gap-1">
            {onOpenCanvas ? (
              <button
                type="button"
                onClick={onOpenCanvas}
                aria-label={translateAgentsCreativeText("agents.creative.canvas.open")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-sub,#5B6B88)] transition-colors hover:bg-[var(--color-hover-bg,#EAF1FB)]"
              >
                <LayoutGrid size={16} aria-hidden />
              </button>
            ) : null}
            {runs.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex h-9 items-center gap-1 rounded-full px-3 text-[12px] text-[var(--color-text-sub,#5B6B88)] transition-colors hover:bg-[var(--color-hover-bg,#EAF1FB)]"
              >
                <Trash2 size={14} aria-hidden />
                {translateAgentsCreativeText("agents.creative.history.clear")}
              </button>
            ) : null}
          </div>
        }
      />

      {status === "loading" ? (
        <MobileStateView
          kind="loading"
          message={translateAgentsCreativeText("agents.creative.loading")}
        />
      ) : status === "error" ? (
        <MobileStateView
          kind="error"
          message={translateAgentsCreativeText("agents.creative.loadFailed")}
          retryLabel={translateAgentsCreativeText("agents.creative.retry")}
          onRetry={() => void load()}
        />
      ) : catalogUnavailable ? (
        <MobileStateView
          kind="unavailable"
          message={translateAgentsCreativeText(
            catalog?.reason === "no-generation-tool"
              ? "agents.creative.noTools"
              : "agents.creative.unavailable",
          )}
          retryLabel={translateAgentsCreativeText("agents.creative.retry")}
          onRetry={() => void load()}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <section className="mb-4">
            <p className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
              {translateAgentsCreativeText("agents.creative.tool.label")}
            </p>
            <div className="flex flex-wrap gap-2">
              {catalog?.tools.map((tool) => {
                const active = tool.id === selectedToolId;
                const Icon = MODALITY_ICON[tool.modality];
                return (
                  <button
                    key={tool.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedToolId(tool.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-[var(--color-primary-blue,#165DFF)] text-white"
                        : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]",
                    )}
                  >
                    <Icon size={14} aria-hidden />
                    {tool.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-4">
            <label
              htmlFor="agents-creative-prompt"
              className="mb-2 block text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]"
            >
              {translateAgentsCreativeText("agents.creative.prompt.label")}
            </label>
            <textarea
              id="agents-creative-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              placeholder={translateAgentsCreativeText("agents.creative.prompt.placeholder")}
              className="w-full resize-none rounded-2xl bg-[var(--color-input-bg,#EAF1FB)] p-3 text-[14px] leading-6 text-[var(--color-text-main,#0A1B3D)] outline-none placeholder:text-[var(--color-text-tertiary,#8A97AD)]"
            />
          </section>

          <section className="mb-4">
            <p className="mb-2 text-[12px] font-medium text-[var(--color-text-sub,#5B6B88)]">
              {translateAgentsCreativeText("agents.creative.aspect.label")}
            </p>
            <div className="flex gap-2">
              {ASPECTS.map((entry) => {
                const active = entry === aspect;
                return (
                  <button
                    key={entry}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAspect(entry)}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-[13px] transition-colors",
                      active
                        ? "bg-[var(--color-primary-blue,#165DFF)] text-white"
                        : "bg-[var(--color-hover-bg,#EAF1FB)] text-[var(--color-text-sub,#5B6B88)]",
                    )}
                  >
                    {translateAgentsCreativeText(`agents.creative.aspect.${entry}`)}
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <p role="alert" className="mb-3 rounded-xl bg-[var(--color-danger-bg,#FFF1F0)] px-3 py-2 text-[12px] text-[var(--color-danger,#F53F3F)]">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={submitting || !selectedTool}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-blue,#165DFF)] py-3 text-[14px] font-medium text-white transition-opacity disabled:opacity-50"
          >
            <Wand2 size={16} aria-hidden />
            {submitting
              ? translateAgentsCreativeText("agents.creative.generating")
              : translateAgentsCreativeText("agents.creative.generate")}
          </button>

          <section className="mb-5">
            <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
              {translateAgentsCreativeText("agents.creative.result.title")}
            </h2>
            {latestRun ? (
              <div>
                {latestRun.status === "pending" ? (
                  <p className="mb-2 text-[12px] text-[var(--color-text-sub,#5B6B88)]">
                    {translateAgentsCreativeText("agents.creative.result.pending")}
                  </p>
                ) : latestRun.status === "failed" ? (
                  <p className="mb-2 text-[12px] text-[var(--color-danger,#F53F3F)]">
                    {translateAgentsCreativeText("agents.creative.result.failed")}
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  {latestRun.media.map((media) => (
                    <MediaTile
                      key={`${latestRun.id}-${media.url}`}
                      media={media}
                      label={translateAgentsCreativeText("agents.creative.media.open")}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-[var(--color-surface-muted,#EAF1FB)] px-3 py-6 text-center text-[12px] text-[var(--color-text-sub,#5B6B88)]">
                {translateAgentsCreativeText("agents.creative.result.empty")}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
              {translateAgentsCreativeText("agents.creative.history.title")}
            </h2>
            {runs.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-sub,#5B6B88)]">
                {translateAgentsCreativeText("agents.creative.history.empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {runs.map((run) => (
                  <li key={run.id}>
                    <RunSummary run={run} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
