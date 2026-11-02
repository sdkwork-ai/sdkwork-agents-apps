import { useCallback, useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";

import { MobileResourceList, cn, formatListTimestamp } from "@sdkwork/agents-h5-commons";

import { translateAgentsAutomationText } from "../i18n";
import { AutomationService } from "../services/AutomationService";
import { isAutomationPortConfigured } from "../services/automationPort";
import type { AutomationTaskSummary } from "../types";

const STATUS_LABEL_KEY: Record<string, string> = {
  active: "agents.automation.status.active",
  paused: "agents.automation.status.paused",
  completed: "agents.automation.status.completed",
  cancelled: "agents.automation.status.cancelled",
};

function statusLabel(status?: string): string {
  if (!status) {
    return "";
  }
  return translateAgentsAutomationText(STATUS_LABEL_KEY[status] ?? status);
}

export interface AutomationScreenProps {
  onOpenTask?: (task: AutomationTaskSummary) => void;
  /** Renders a back affordance when the surface is stack-pushed. */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * Automation surface behind the `automation` tab.
 *
 * Lists the Agents scheduled tasks the composition root scopes to an agent.
 * Read-only: editing a task definition stays on the surface that owns the task
 * editor.
 */
export function AutomationScreen({ onOpenTask, onBack, backLabel, className }: AutomationScreenProps) {
  const [tasks, setTasks] = useState<AutomationTaskSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const load = useCallback(async () => {
    if (!isAutomationPortConfigured()) {
      setLoading(false);
      setError(translateAgentsAutomationText("agents.automation.loadFailed"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const listing = await AutomationService.listTasks();
      setTasks(listing.items);
      setTruncated(listing.truncated);
    } catch {
      setError(translateAgentsAutomationText("agents.automation.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => AutomationService.filterByName(tasks, query),
    [query, tasks],
  );

  return (
    <MobileResourceList
      {...(className ? { className } : {})}
      {...(onBack ? { onBack } : {})}
      {...(backLabel ? { backLabel } : {})}
      title={translateAgentsAutomationText("agents.automation.title")}
      searchPlaceholder={translateAgentsAutomationText("agents.automation.search.placeholder")}
      searchValue={query}
      onSearchChange={setQuery}
      items={visible}
      keyOf={(task) => task.id}
      loading={loading}
      loadingText={translateAgentsAutomationText("agents.automation.loading")}
      errorText={error}
      onRetry={() => void load()}
      emptyText={translateAgentsAutomationText("agents.automation.empty")}
      notice={truncated ? translateAgentsAutomationText("agents.automation.truncated") : null}
      renderRow={(task) => (
        <button
          type="button"
          onClick={() => onOpenTask?.(task)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface-color,#FFFFFF)] px-4 py-3 text-left transition-colors",
            "active:bg-[var(--color-surface-muted,#EAF1FB)]",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "bg-[var(--color-primary-subtle,#E8F0FF)]",
            )}
          >
            <Timer
              size={18}
              aria-hidden="true"
              className="text-[var(--color-primary-blue,#165DFF)]"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-[var(--color-text-main,#0A1B3D)]">
              {task.name}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-text-sub,#5B6B88)]">
              {[statusLabel(task.status), task.schedule, formatListTimestamp(task.updatedAt)]
                .filter((part) => Boolean(part))
                .join(" · ")}
            </span>
          </span>
        </button>
      )}
    />
  );
}
