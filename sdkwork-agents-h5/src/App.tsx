import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Infinity as InfinityIcon,
  MessageSquare,
  Share2,
  Timer,
  type LucideIcon,
} from "lucide-react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AgentChatView,
  AgentMarketplaceMobileView,
  AgentMarketplaceSearchView,
  AgentView,
  CreateAgentModal,
  CreateAgentView,
  MyAgentsView,
  ToastContainer,
  type Agent,
  type AgentConfig,
} from "@sdkwork/agents-h5-agents";
import { AutomationScreen, automationRouteContributions } from "@sdkwork/agents-h5-automation";
import {
  ConversationScreen,
  conversationRouteContributions,
} from "@sdkwork/agents-h5-conversation";
import { LibraryScreen, libraryRouteContributions } from "@sdkwork/agents-h5-library";
import { ProjectsScreen, projectsRouteContributions } from "@sdkwork/agents-h5-projects";
import {
  AGENTS_MOBILE_TABS,
  AGENT_CATALOG_LIST_ROUTE_ID,
  AGENT_MARKET_ROUTE,
  AGENT_MARKET_SEARCH_ROUTE,
  AUTOMATION_INDEX_ROUTE_ID,
  CHAT_ROUTE,
  CONVERSATION_CHAT_ROUTE_ID,
  CREATE_AGENT_ROUTE,
  EXPERTS_PATH,
  LIBRARY_LIST_ROUTE_ID,
  MY_AGENTS_ROUTE,
  PROJECTS_LIST_ROUTE_ID,
  assembleAgentsH5RouteRegistry,
  translateAgentsShellText,
  type AgentsH5RouteContribution,
  type AgentsMobileTabId,
} from "@sdkwork/agents-h5-shell";

import { AuthGate } from "./components/AuthGate";

/**
 * Route contribution for the pre-existing agent catalog surface.
 *
 * The catalog screen predates the conversation shell, so its contribution is
 * declared here instead of being retro-fitted into a capability package.
 */
const expertsRouteContribution: AgentsH5RouteContribution = {
  id: AGENT_CATALOG_LIST_ROUTE_ID,
  surface: "app",
  domain: "agents",
  capability: "catalog",
  screen: "list",
  path: EXPERTS_PATH,
  titleKey: "agents.mobile.tab.experts",
  auth: "required",
  permissionHint: "ai.agents.read",
  presentation: { h5Mobile: "tab" },
};

/**
 * The single route registry assembled from every capability contribution.
 * Assembling in the root keeps capability packages independent of each other
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 4 and 7).
 */
const ROUTE_REGISTRY = assembleAgentsH5RouteRegistry([
  ...conversationRouteContributions,
  ...libraryRouteContributions,
  ...projectsRouteContributions,
  ...automationRouteContributions,
  expertsRouteContribution,
]);

/** Path behind a tab, resolved from the assembled registry. */
function tabPath(routeId: string): string {
  return ROUTE_REGISTRY.find((contribution) => contribution.id === routeId)?.path ?? "/";
}

const TAB_GLYPH_ICONS: Readonly<Record<string, LucideIcon>> = {
  "message-square": MessageSquare,
  infinity: InfinityIcon,
  "book-open": BookOpen,
  timer: Timer,
  "share-2": Share2,
};

const TAB_ICONS = Object.fromEntries(
  AGENTS_MOBILE_TABS.map(
    (tab) => [tab.tab, TAB_GLYPH_ICONS[tab.glyph] ?? MessageSquare] as const,
  ),
) as Readonly<Record<AgentsMobileTabId, LucideIcon>>;

/**
 * Phone-width frame around the mobile shell.
 *
 * The standalone H5 root is opened from desktops as well (built-in preview,
 * plain browsers); constraining the shell to a phone width keeps the mobile
 * layout honest instead of stretching it across the whole viewport.
 */
function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-[#0b0b0c]">
      <div className="flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--color-bg-color,#141414)] text-[var(--color-text-main,#f3f4f6)]">
        {children}
      </div>
    </div>
  );
}

function AgentsMobileTabBar({ activeTab }: { activeTab: AgentsMobileTabId | null }) {
  const navigate = useNavigate();

  return (
    <nav className="flex shrink-0 items-stretch justify-around border-t border-[var(--color-border-color,rgba(255,255,255,0.1))] bg-[var(--color-glass-bg,rgba(20,20,20,0.85))] px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur">
      {AGENTS_MOBILE_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.tab];
        const active = tab.tab === activeTab;
        return (
          <button
            key={tab.tab}
            type="button"
            onClick={() => navigate(tabPath(tab.routeId))}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium text-[var(--color-primary-blue,#2b5ce7)]"
                : "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium text-[var(--color-text-sub,#9ca3af)] transition-colors hover:text-[var(--color-text-main,#f3f4f6)]"
            }
          >
            <Icon size={20} aria-hidden />
            <span className="truncate">{translateAgentsShellText(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

interface ChatRouteState {
  agent?: Agent;
}

function AgentChatRoutePage() {
  const navigate = useNavigate();
  const { agentId = "" } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as ChatRouteState;

  if (!agentId) {
    return <Navigate to="/" replace />;
  }

  return (
    <AgentChatView
      agentId={agentId}
      agentName={state.agent?.name}
      welcomeMessage={state.agent?.welcomeMessage}
      onBack={() => navigate("/")}
    />
  );
}

/**
 * Experts tab: the pre-existing agent catalog, plus entry points into the two
 * secondary agent surfaces that used to sit in the top navigation.
 */
function ExpertsTabPage({
  onStartChat,
  onCreateAgent,
  onEditAgent,
}: {
  onStartChat: (agent: Agent) => void;
  onCreateAgent: () => void;
  onEditAgent: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-main,#f3f4f6)]">
          {translateAgentsShellText("agents.mobile.tab.experts")}
        </h1>
        <div className="flex items-center gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => navigate(`/${MY_AGENTS_ROUTE}`)}
            className="text-[var(--color-text-sub,#9ca3af)] transition-colors hover:text-[var(--color-text-main,#f3f4f6)]"
          >
            {translateAgentsShellText("agents.mobile.tab.myAgents")}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/${AGENT_MARKET_ROUTE}`)}
            className="font-medium text-[var(--color-primary-blue,#2b5ce7)]"
          >
            {translateAgentsShellText("agents.mobile.tab.market")}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AgentView
          onStartChat={onStartChat}
          onCreateAgent={onCreateAgent}
          onEditAgent={onEditAgent}
        />
      </div>
    </div>
  );
}

function AgentsMobileShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | undefined>();

  /** Only the five tab surfaces show the bottom bar; stack pushes hide it. */
  const activeTab = useMemo<AgentsMobileTabId | null>(() => {
    const match = AGENTS_MOBILE_TABS.find((tab) => tabPath(tab.routeId) === location.pathname);
    return match?.tab ?? null;
  }, [location.pathname]);

  const openCreateAgent = () => setIsCreateAgentModalOpen(true);

  const openEditAgent = (id: string) => {
    setEditAgentId(id);
    navigate(`/${CREATE_AGENT_ROUTE}`);
  };

  const handleStandaloneStartChat = (agent: Agent) => {
    navigate(`/${CHAT_ROUTE}/${agent.id}`, { state: { agent } });
  };

  /** Mobile marketplace rows carry `AgentConfig`; map onto the route state shape. */
  const handleMobileStartChat = (agent: AgentConfig) => {
    navigate(`/${CHAT_ROUTE}/${agent.id}`, {
      state: {
        agent: {
          id: agent.id ?? "",
          name: agent.name,
          desc: agent.description,
          author: agent.author,
          users: agent.users,
          avatar: agent.avatar,
          welcomeMessage: agent.welcomeMessage,
        } satisfies Agent,
      },
    });
  };

  /** Screen behind each tab route id (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` §4). */
  const renderTabScreen = (routeId: string): ReactNode => {
    switch (routeId) {
      case CONVERSATION_CHAT_ROUTE_ID:
        return <ConversationScreen />;
      case AGENT_CATALOG_LIST_ROUTE_ID:
        return (
          <ExpertsTabPage
            onStartChat={handleStandaloneStartChat}
            onCreateAgent={openCreateAgent}
            onEditAgent={openEditAgent}
          />
        );
      case LIBRARY_LIST_ROUTE_ID:
        return <LibraryScreen />;
      case AUTOMATION_INDEX_ROUTE_ID:
        return <AutomationScreen />;
      case PROJECTS_LIST_ROUTE_ID:
        return <ProjectsScreen />;
      default:
        return null;
    }
  };

  return (
    <MobileFrame>
      <ToastContainer />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Routes>
          {AGENTS_MOBILE_TABS.map((tab) => (
            <Route key={tab.tab} path={tabPath(tab.routeId)} element={renderTabScreen(tab.routeId)} />
          ))}

          {/* Stack-pushed surfaces: the tab bar is intentionally hidden. */}
          <Route path={`/${CHAT_ROUTE}/:agentId`} element={<AgentChatRoutePage />} />
          <Route
            path={`/${CREATE_AGENT_ROUTE}`}
            element={
              <CreateAgentView
                initialAgentId={editAgentId}
                onBack={() => {
                  setEditAgentId(undefined);
                  navigate("/");
                }}
              />
            }
          />
          {/* Agent management surface: agent-domain parity with the PC workbench. */}
          <Route
            path={`/${MY_AGENTS_ROUTE}`}
            element={
              <MyAgentsView
                onStartChat={handleMobileStartChat}
                onCreateAgent={() => {
                  setEditAgentId(undefined);
                  navigate(`/${CREATE_AGENT_ROUTE}`);
                }}
                onEditAgent={openEditAgent}
                onBack={() => navigate("/")}
              />
            }
          />
          {/* Mobile marketplace surfaces (hosted standalone for verification). */}
          <Route
            path={`/${AGENT_MARKET_ROUTE}`}
            element={
              <AgentMarketplaceMobileView
                onStartChat={handleMobileStartChat}
                onCreateAgent={openCreateAgent}
                onSearch={() => navigate(`/${AGENT_MARKET_SEARCH_ROUTE}`)}
              />
            }
          />
          <Route
            path={`/${AGENT_MARKET_SEARCH_ROUTE}`}
            element={
              <AgentMarketplaceSearchView
                onStartChat={handleMobileStartChat}
                onBack={() => navigate(`/${AGENT_MARKET_ROUTE}`)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {activeTab ? <AgentsMobileTabBar activeTab={activeTab} /> : null}
      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onSuccess={(agentId) => {
          setIsCreateAgentModalOpen(false);
          setEditAgentId(agentId);
          navigate(`/${CREATE_AGENT_ROUTE}`);
        }}
      />
    </MobileFrame>
  );
}

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <AgentsMobileShell />
      </HashRouter>
    </AuthGate>
  );
}
