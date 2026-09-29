import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AgentsHomePage } from '../pages/AgentsHomePage';
import {
  CreateAgentView,
  type CreateAgentCapability,
} from '../pages/CreateAgentView';
import type { AgentConfig } from '../services/AgentService';
import {
  DEFAULT_AGENTS_CONSOLE_MODULE_ID,
  agentsConsoleModules,
  findAgentsConsoleModuleById,
  type AgentsConsoleModule,
  type AgentsConsoleModuleId,
} from './consoleModules';

import './console.css';

/** Where a console interaction wants to go next. */
export interface AgentsConsoleNavigationTarget {
  moduleId: AgentsConsoleModuleId;
  /**
   * Agent being edited. Present only when the target module edits agents; when
   * omitted the editor starts a new agent, which is what keeps create and edit
   * on one form instead of two.
   */
  agentId?: string;
}

export interface AgentsConsoleEmbedProps {
  /** Module catalog; defaults to the canonical one owned by this package. */
  modules?: readonly AgentsConsoleModule[];
  /**
   * Controlled active module. Pass together with `onNavigate` to let the host own
   * module routing (deep links such as `/console/agents/editor/<id>`); omit both
   * to let the block keep selection in local state.
   */
  moduleId?: AgentsConsoleModuleId;
  /** Controlled edited-agent id, reconciled with `moduleId`. */
  agentId?: string;
  /** Controlled navigation callback. Receives where the user asked to go. */
  onNavigate?(target: AgentsConsoleNavigationTarget): void;
  /**
   * Capability panels this deployment cannot serve (its app-api composition omits
   * the owning capability). They are hidden rather than rendered as a catalog
   * error the user can do nothing about.
   */
  hiddenCapabilities?: readonly CreateAgentCapability[];
  className?: string;
}

/**
 * Chrome-less Agents management block for embedding hosts.
 *
 * The integration seam for a host console: the agent catalog, the editor, their
 * styles and the module catalog are owned here, while the host injects its SDK
 * clients once through `configureAgentsConsoleRuntime` and maps module routes
 * onto its own paths.
 *
 * Router-agnostic on purpose — it never reads `react-router` state, so the same
 * block mounts under a PC route, an H5 route, or a desktop shell. Module
 * selection stays in local state unless the host passes `moduleId` + `onNavigate`.
 */
export function AgentsConsoleEmbed({
  agentId,
  className,
  hiddenCapabilities,
  moduleId,
  modules = agentsConsoleModules,
  onNavigate,
}: AgentsConsoleEmbedProps) {
  const { t } = useTranslation('common');
  const [internalTarget, setInternalTarget] = useState<AgentsConsoleNavigationTarget>({
    moduleId: moduleId ?? DEFAULT_AGENTS_CONSOLE_MODULE_ID,
    agentId,
  });

  const target: AgentsConsoleNavigationTarget = onNavigate
    ? { moduleId: moduleId ?? DEFAULT_AGENTS_CONSOLE_MODULE_ID, agentId }
    : internalTarget;

  const navigate = useCallback(
    (next: AgentsConsoleNavigationTarget) => {
      if (onNavigate) {
        onNavigate(next);
        return;
      }
      setInternalTarget(next);
    },
    [onNavigate],
  );

  const activeModule =
    findAgentsConsoleModuleById(target.moduleId)
    ?? modules.find((candidate) => candidate.id === target.moduleId)
    ?? modules[0];

  /**
   * Modules the switcher offers: the sections a user toggles between.
   *
   * An agent-editing module is a *flow*, not a section — it is entered from a
   * create or configure action and left through its own back control. Listing it
   * next to the list module would present "create" as a second view of "my
   * agents" rather than as the thing the create button does.
   */
  const switcherModules = modules.filter((candidate) => !candidate.editsAgent);
  /**
   * A flow module renders the form and nothing else. A host that mounts it on its
   * own full-bleed route then gets a page whose only controls are the form's own
   * header, and a host that keeps it inside its shell does not get a tab strip
   * wrapped around a form the user is already inside.
   */
  const showModuleSwitcher = !activeModule?.editsAgent && switcherModules.length > 1;

  const openEditor = useCallback(
    (nextAgentId?: string) => navigate({ moduleId: 'editor', agentId: nextAgentId }),
    [navigate],
  );
  const openManager = useCallback(() => navigate({ moduleId: 'manage' }), [navigate]);

  const editorHiddenCapabilities = useMemo(
    () => hiddenCapabilities ?? [],
    [hiddenCapabilities],
  );

  if (!activeModule) {
    return null;
  }

  return (
    <div
      className={`sdkwork-agents-console flex h-full min-h-0 w-full flex-col overflow-hidden${className ? ` ${className}` : ''}`}
      data-agents-console-module={activeModule.id}
    >
      {showModuleSwitcher ? (
        <nav
          aria-label={t('agentsConsoleNavLabel', 'Agents console')}
          className="sdkwork-agents-console-nav"
          role="tablist"
        >
          {switcherModules.map((candidate) => (
            <button
              aria-selected={candidate.id === activeModule.id}
              className={
                candidate.id === activeModule.id
                  ? 'sdkwork-agents-console-nav-item is-active'
                  : 'sdkwork-agents-console-nav-item'
              }
              key={candidate.id}
              onClick={() => navigate({ moduleId: candidate.id })}
              role="tab"
              type="button"
            >
              {t(candidate.titleKey, candidate.id)}
            </button>
          ))}
        </nav>
      ) : null}

      {/*
       * The content area is a flex *container*, not just a flex item.
       *
       * It already stretches to fill the space under the nav (`flex-1` on a column
       * flex parent), but a module root that fills with `flex-1` needs this element
       * to be a flex parent too, or its `flex-1` is inert: the root would fall back
       * to content height instead of the height it was given. That showed up as a
       * form shorter than the viewport — an empty band above the page background —
       * or, on a shorter viewport, as a clipped bottom because the host frame clips.
       * Modules that size themselves with `h-full` (the manager page) work either
       * way, so `flex flex-col` here makes both conventions valid instead of picking
       * one.
       */}
      <div className="flex min-h-0 w-full flex-1 flex-col">

        {activeModule.editsAgent ? (
          <CreateAgentView
            hiddenCapabilities={editorHiddenCapabilities}
            initialAgentId={target.agentId}
            onBack={openManager}
          />
        ) : (
          <AgentsHomePage
            hideConversation
            initialScope="mine"
            onCreateRequest={() => openEditor()}
            onEditRequest={(agent: AgentConfig) => openEditor(agent.id)}
          />
        )}
      </div>
    </div>
  );
}
