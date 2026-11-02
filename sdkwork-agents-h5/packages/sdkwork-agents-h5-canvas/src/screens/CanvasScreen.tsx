import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, GitBranch, Image as ImageIcon, StickyNote, Type, Video } from "lucide-react";

import {
  MobileScreenHeader,
  MobileStateView,
  cn,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsCanvasText } from "../i18n";
import { CanvasService } from "../services/CanvasService";
import type { CanvasNode, CanvasNodeType, CanvasWorkflow } from "../types";

type BoardStatus = "loading" | "ready" | "empty" | "unavailable" | "error";

const NODE_ICON: Record<CanvasNodeType, typeof Type> = {
  text: Type,
  "image-gen": ImageIcon,
  "video-gen": Video,
  "flow-step": GitBranch,
  sticky: StickyNote,
};

const NODE_LABEL_KEY: Record<CanvasNodeType, string> = {
  text: "agents.canvas.node.text",
  "image-gen": "agents.canvas.node.imageGen",
  "video-gen": "agents.canvas.node.videoGen",
  "flow-step": "agents.canvas.node.flowStep",
  sticky: "agents.canvas.node.sticky",
};

export interface CanvasScreenProps {
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

function NodeCard({
  node,
  groupTitle,
}: {
  node: CanvasNode;
  groupTitle?: string;
}) {
  const Icon = NODE_ICON[node.type];
  const body = node.content?.trim() || node.prompt?.trim() || "";
  return (
    <article className="rounded-2xl bg-[var(--color-surface-color,#FFFFFF)] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-subtle,#E8F0FF)] text-[var(--color-primary-blue,#165DFF)]">
          <Icon size={14} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-text-main,#0A1B3D)]">
          {node.title || translateAgentsCanvasText(NODE_LABEL_KEY[node.type])}
        </span>
        <span className="shrink-0 rounded-full bg-[var(--color-surface-muted,#EAF1FB)] px-2 py-0.5 text-[10px] text-[var(--color-text-sub,#5B6B88)]">
          {translateAgentsCanvasText(NODE_LABEL_KEY[node.type])}
        </span>
      </div>
      {node.mediaUrl && node.type === "image-gen" ? (
        <img
          src={node.mediaUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="mb-2 max-h-56 w-full rounded-xl object-cover"
        />
      ) : null}
      {body ? (
        <p className="line-clamp-4 whitespace-pre-wrap text-[12px] leading-5 text-[var(--color-text-sub,#5B6B88)]">
          {body}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-text-sub,#5B6B88)]">
        {node.status ? (
          <span className="rounded-full bg-[var(--color-surface-muted,#EAF1FB)] px-2 py-0.5">
            {translateAgentsCanvasText(`agents.canvas.status.${node.status}`)}
          </span>
        ) : null}
        {groupTitle ? <span className="truncate">{groupTitle}</span> : null}
      </div>
    </article>
  );
}

/**
 * Read-only canvas projection behind `app.agents.canvas.board`.
 *
 * The workflow graph is browser-local to the PC canvas; mobile renders the same
 * nodes in reading order without drag/connect editing
 * (`PLAN-2026-1102-client-page-parity.md` section 6).
 */
export function CanvasScreen({ onBack, backLabel, className }: CanvasScreenProps) {
  const [status, setStatus] = useState<BoardStatus>("loading");
  const [workflow, setWorkflow] = useState<CanvasWorkflow | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const board = await CanvasService.loadBoard();
      if (board.availability === "unavailable") {
        setWorkflow(null);
        setStatus("unavailable");
        return;
      }
      if (board.availability === "empty") {
        setWorkflow(null);
        setStatus("empty");
        return;
      }
      setWorkflow(board.workflow);
      setStatus("ready");
    } catch {
      setWorkflow(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nodes = useMemo(
    () => (workflow ? CanvasService.sortNodes(workflow.nodes) : []),
    [workflow],
  );
  const groupsById = useMemo(
    () => new Map((workflow?.groups ?? []).map((group) => [group.id, group.title])),
    [workflow],
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        "bg-[var(--color-bg-color,#F4F7FC)]",
        className,
      )}
    >
      <MobileScreenHeader
        title={translateAgentsCanvasText("agents.canvas.title")}
        {...(onBack ? { onBack } : {})}
        backLabel={backLabel ?? translateAgentsCanvasText("agents.canvas.back")}
      />

      {status === "ready" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-[var(--color-hover-bg,#EAF1FB)] px-3 py-2 text-[11px] text-[var(--color-text-sub,#5B6B88)]">
            <Boxes size={13} aria-hidden />
            {translateAgentsCanvasText("agents.canvas.readOnly")}
          </p>
          {workflow && workflow.connections.length > 0 ? (
            <p className="mb-2 text-[11px] text-[var(--color-text-sub,#5B6B88)]">
              {translateAgentsCanvasText("agents.canvas.connections", {
                count: workflow.connections.length,
              })}
            </p>
          ) : null}
          <ol className="space-y-2">
            {nodes.map((node) => (
              <li key={node.id}>
                <NodeCard
                  node={node}
                  {...(node.groupId && groupsById.get(node.groupId)
                    ? { groupTitle: groupsById.get(node.groupId) }
                    : {})}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <MobileStateView
          kind={status}
          message={translateAgentsCanvasText(
            status === "loading"
              ? "agents.canvas.loading"
              : status === "empty"
                ? "agents.canvas.empty"
                : status === "error"
                  ? "agents.canvas.loadFailed"
                  : "agents.canvas.unavailable",
          )}
          {...(status === "loading"
            ? {}
            : {
                retryLabel: translateAgentsCanvasText("agents.canvas.retry"),
                onRetry: () => void load(),
              })}
        />
      )}
    </div>
  );
}
