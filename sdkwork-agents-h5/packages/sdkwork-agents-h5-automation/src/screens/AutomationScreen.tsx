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
  className?: string;
}

/**
 * Automation surface behind the `automation` tab.
 *
 * Lists the Agents scheduled tasks the composition root scopes to an agent.
 * Read-only: editing a task definition stays on the surface that owns the task
 * editor.
 */
export function AutomationScreen({ onOpenTask, className }: AutomationScreenProps) {
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
            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition",
            "active:bg-[var(--color-hover-bg,rgba(0,0,0,0.03))]",
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "bg-[var(--color-surface-color,#ffffff)]",
              "border border-[var(--color-border-color,rgba(0,0,0,0.05))]",
            )}
          >
            <Timer
              size={18}
              aria-hidden="true"
              className="text-[var(--color-primary-blue,#2b5ce7)]"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-[var(--color-text-main,#1f1f1f)]">
              {task.name}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-text-sub,#8c8c8c)]">
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
