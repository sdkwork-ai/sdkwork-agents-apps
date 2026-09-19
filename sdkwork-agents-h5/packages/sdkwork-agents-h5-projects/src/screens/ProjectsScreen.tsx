import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen } from "lucide-react";

import {
  MobileResourceList,
  cn,
  formatListTimestamp,
} from "@sdkwork/agents-h5-commons";

import { translateAgentsProjectsText } from "../i18n";
import { ProjectsService } from "../services/ProjectsService";
import { isProjectsPortConfigured } from "../services/projectsPort";
import type { AgentProjectSummary } from "../types";

export interface ProjectsScreenProps {
  /** Opens one project. The sessions surface owns the detail view. */
  onOpenProject?: (project: AgentProjectSummary) => void;
  className?: string;
}

/**
 * Projects surface behind the `projects` tab.
 *
 * Lists the Agents-owned project containers that group sessions. Read-only in
 * this client root: create / rename / delete stay on the PC workbench until the
 * mobile detail surface exists.
 */
export function ProjectsScreen({ onOpenProject, className }: ProjectsScreenProps) {
  const [projects, setProjects] = useState<AgentProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const load = useCallback(async () => {
    if (!isProjectsPortConfigured()) {
      setLoading(false);
      setError(translateAgentsProjectsText("agents.projects.loadFailed"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const listing = await ProjectsService.listProjects();
      setProjects(listing.items);
      setTruncated(listing.truncated);
    } catch {
      setError(translateAgentsProjectsText("agents.projects.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => ProjectsService.filterByName(projects, query),
    [projects, query],
  );

  return (
    <MobileResourceList
      {...(className ? { className } : {})}
      title={translateAgentsProjectsText("agents.projects.title")}
      searchPlaceholder={translateAgentsProjectsText("agents.projects.search.placeholder")}
      searchValue={query}
      onSearchChange={setQuery}
      items={visible}
      keyOf={(project) => project.id}
      loading={loading}
      loadingText={translateAgentsProjectsText("agents.projects.loading")}
      errorText={error}
      onRetry={() => void load()}
      emptyText={translateAgentsProjectsText("agents.projects.empty")}
      notice={truncated ? translateAgentsProjectsText("agents.projects.truncated") : null}
      renderRow={(project) => (
        <button
          type="button"
          onClick={() => onOpenProject?.(project)}
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
            <FolderOpen
              size={18}
              aria-hidden="true"
              className="text-[var(--color-primary-blue,#2b5ce7)]"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-[var(--color-text-main,#1f1f1f)]">
              {project.name}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-text-sub,#8c8c8c)]">
              {[project.status, formatListTimestamp(project.updatedAt)]
                .filter((part) => Boolean(part))
                .join(" · ")}
            </span>
          </span>
        </button>
      )}
    />
  );
}
