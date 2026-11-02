import { useMemo, useState, type ReactNode } from "react";
import {
  Images,
  Infinity as InfinityIcon,
  MessageSquare,
  Sparkles,
  UserRound,
  Wand2,
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
import {
  AssetDetailScreen,
  AssetsScreen,
  assetsRouteContributions,
} from "@sdkwork/agents-h5-assets";
import { AutomationScreen, automationRouteContributions } from "@sdkwork/agents-h5-automation";
import { CanvasScreen, canvasRouteContributions } from "@sdkwork/agents-h5-canvas";
import {
  ConversationHistoryScreen,
  ConversationScreen,
  conversationRouteContributions,
} from "@sdkwork/agents-h5-conversation";
import { CreativeScreen, creativeRouteContributions } from "@sdkwork/agents-h5-creative";
import {
  InspirationScreen,
  inspirationRouteContributions,
} from "@sdkwork/agents-h5-inspiration";
import { LibraryScreen, libraryRouteContributions } from "@sdkwork/agents-h5-library";
import {
  MembershipScreen,
  membershipRouteContributions,
} from "@sdkwork/agents-h5-membership";
import { ProfileScreen, profileRouteContributions } from "@sdkwork/agents-h5-profile";
import { ProjectsScreen, projectsRouteContributions } from "@sdkwork/agents-h5-projects";
import { SettingsScreen, settingsRouteContributions } from "@sdkwork/agents-h5-settings";
import {
  AGENTS_H5_PROFILE_LINKS,
  AGENTS_MOBILE_TABS,
  AGENT_CATALOG_EDITOR_ROUTE_ID,
  AGENT_CATALOG_LIST_ROUTE_ID,
  AGENT_MARKET_ROUTE,
  AGENT_MARKET_SEARCH_ROUTE,
  ASSETS_LIST_ROUTE_ID,
  ASSETS_PATH,
  AUTOMATION_INDEX_ROUTE_ID,
  AUTOMATION_PATH,
  CANVAS_PATH,
  CHAT_ROUTE,
  CONVERSATION_CHAT_ROUTE_ID,
  CONVERSATION_LIST_PATH,
  CREATE_AGENT_ROUTE,
  CREATIVE_PATH,
  CREATIVE_STUDIO_ROUTE_ID,
  EXPERTS_PATH,
  INSPIRATION_DISCOVER_ROUTE_ID,
  LIBRARY_PATH,
  MEMBERSHIP_PATH,
  MY_AGENTS_ROUTE,
  PROFILE_PATH,
  PROJECTS_PATH,
  SETTINGS_PATH,
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
  titleKey: "agents.mobile.tab.agents",
  auth: "required",
  permissionHint: "ai.agents.read",
  presentation: { h5Mobile: "tab" },
};

/** Agent create/edit surface mounted as a stack route behind the catalog. */
const agentEditorRouteContribution: AgentsH5RouteContribution = {
  id: AGENT_CATALOG_EDITOR_ROUTE_ID,
  surface: "app",
  domain: "agents",
  capability: "catalog",
  screen: "editor",
  path: `/${CREATE_AGENT_ROUTE}`,
  titleKey: "agents.mobile.tab.createAgent",
  auth: "required",
  permissionHint: "ai.agents.manage",
  presentation: { h5Mobile: "stack" },
};

/**
 * The single route registry assembled from every capability contribution.
 * Assembling in the root keeps capability packages independent of each other
 * (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` sections 4 and 7).
 */
const ROUTE_REGISTRY = assembleAgentsH5RouteRegistry([
  ...conversationRouteContributions,
  ...inspirationRouteContributions,
  ...creativeRouteContributions,
  ...assetsRouteContributions,
  ...canvasRouteContributions,
  ...libraryRouteContributions,
  ...projectsRouteContributions,
  ...automationRouteContributions,
  ...membershipRouteContributions,
  ...profileRouteContributions,
  ...settingsRouteContributions,
  expertsRouteContribution,
  agentEditorRouteContribution,
]);

/** Path behind a tab, resolved from the assembled registry. */function tabPath(routeId: string): string {
  return ROUTE_REGISTRY.find((contribution) => contribution.id === routeId)?.path ?? "/";
}

const TAB_GLYPH_ICONS: Readonly<Record<string, LucideIcon>> = {
  "message-square": MessageSquare,
  sparkles: Sparkles,
  "wand-2": Wand2,
  images: Images,
  infinity: InfinityIcon,
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
 * layout honest instead of stretching it across the whole viewport. The
 * backdrop outside the phone is a neutral tonal fill, never a dark surface.
 */
function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-[var(--color-surface-muted,#EAF1FB)]">
      <div className="flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--color-bg-color,#F4F7FC)] text-[var(--color-text-main,#0A1B3D)]">
        {children}
      </div>
    </div>
  );
}

/** One bottom-bar item: blue on the active route, secondary text elsewhere. */
function AgentsMobileTabBar({
  activeTab,
  profileActive,
}: {
  activeTab: AgentsMobileTabId | null;
  profileActive: boolean;
}) {
  const navigate = useNavigate();

  return (
    <nav className="flex shrink-0 items-stretch justify-around bg-[var(--color-surface-color,#FFFFFF)] px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
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
                ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl bg-[var(--color-primary-subtle,#E8F0FF)] px-1 py-1.5 text-[10px] font-medium text-[var(--color-icon-active,#165DFF)] transition-colors"
                : "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-[var(--color-icon-default,#5B6B88)] transition-colors hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-icon-strong,#0A1B3D)]"
            }
          >
            <Icon size={20} aria-hidden />
            <span className="truncate">{translateAgentsShellText(tab.labelKey)}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => navigate(PROFILE_PATH)}
        aria-current={profileActive ? "page" : undefined}
        aria-label={translateAgentsShellText("agents.mobile.nav.profileEntry")}
        className={
          profileActive
            ? "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl bg-[var(--color-primary-subtle,#E8F0FF)] px-1 py-1.5 text-[10px] font-medium text-[var(--color-icon-active,#165DFF)] transition-colors"
            : "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium text-[var(--color-icon-default,#5B6B88)] transition-colors hover:bg-[var(--color-surface-muted,#EAF1FB)] hover:text-[var(--color-icon-strong,#0A1B3D)]"
        }
      >
        <UserRound size={20} aria-hidden />
        <span className="truncate">{translateAgentsShellText("agents.mobile.tab.profile")}</span>
      </button>
    </nav>
  );
}

interface ChatRouteState {
  agent?: Agent;
}

/**
 * Conversation tab entry.
 *
 * The history screen opens a session by pushing `/` with `sessionId` state; the
 * controller already accepts an initial session, so no second transcript path is
 * introduced.
 */
function ConversationTabPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as { sessionId?: string };
  return (
    <ConversationScreen {...(state.sessionId ? { initialSessionId: state.sessionId } : {})} />
  );
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

function AssetDetailRoutePage() {
  const navigate = useNavigate();
  const { assetId = "" } = useParams();

  if (!assetId) {
    return <Navigate to={ASSETS_PATH} replace />;
  }

  return <AssetDetailScreen assetId={assetId} onBack={() => navigate(-1)} />;
}

/**
 * Agents tab: the pre-existing agent catalog, plus entry points into the two
 * secondary agent surfaces that used to sit in the top navigation.
 */
function AgentsTabPage({
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
        <h1 className="text-[20px] font-semibold text-[var(--color-text-main,#0A1B3D)]">
          {translateAgentsShellText("agents.mobile.tab.agents")}
        </h1>
        <div className="flex items-center gap-4 text-[13px]">
          <button
            type="button"
            onClick={() => navigate(`/${MY_AGENTS_ROUTE}`)}
            className="rounded-lg px-1 text-[var(--color-text-secondary,#5B6B88)] transition-colors hover:text-[var(--color-text-primary,#0A1B3D)]"
          >
            {translateAgentsShellText("agents.mobile.tab.myAgents")}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/${AGENT_MARKET_ROUTE}`)}
            className="rounded-lg px-1 font-medium text-[var(--color-primary,#165DFF)] transition-colors hover:text-[var(--color-primary-hover,#4080FF)]"
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

  /** The profile hub is a bottom-bar entry, so it renders as an active item. */
  const profileActive = location.pathname === PROFILE_PATH;

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

  const profileLinks = AGENTS_H5_PROFILE_LINKS.map((link) => ({
    id: link.id,
    label: translateAgentsShellText(link.labelKey),
    path: link.path,
  }));

  const backLabel = translateAgentsShellText("agents.mobile.nav.back");

  /** Screen behind each tab route id (`APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md` §4). */
  const renderTabScreen = (routeId: string): ReactNode => {
    switch (routeId) {
      case CONVERSATION_CHAT_ROUTE_ID:
        return <ConversationTabPage />;
      case INSPIRATION_DISCOVER_ROUTE_ID:
        return <InspirationScreen />;
      case CREATIVE_STUDIO_ROUTE_ID:
        return <CreativeScreen onOpenCanvas={() => navigate(CANVAS_PATH)} />;
      case ASSETS_LIST_ROUTE_ID:
        return <AssetsScreen />;
      case AGENT_CATALOG_LIST_ROUTE_ID:
        return (
          <AgentsTabPage
            onStartChat={handleStandaloneStartChat}
            onCreateAgent={openCreateAgent}
            onEditAgent={openEditAgent}
          />
        );
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
          <Route path={`${ASSETS_PATH}/:assetId`} element={<AssetDetailRoutePage />} />
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

          {/* Profile hub and the secondary PC surfaces it links to. */}
          <Route
            path={PROFILE_PATH}
            element={
              <ProfileScreen
                links={profileLinks}
                onNavigate={(path) => navigate(path)}
                onBack={() => navigate(-1)}
                backLabel={backLabel}
              />
            }
          />
          <Route
            path={MEMBERSHIP_PATH}
            element={<MembershipScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route
            path={LIBRARY_PATH}
            element={<LibraryScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route
            path={PROJECTS_PATH}
            element={<ProjectsScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route
            path={AUTOMATION_PATH}
            element={<AutomationScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route
            path={SETTINGS_PATH}
            element={<SettingsScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route
            path={CONVERSATION_LIST_PATH}
            element={
              <ConversationHistoryScreen
                onOpenSession={(sessionId) => navigate("/", { state: { sessionId } })}
                onBack={() => navigate(-1)}
                backLabel={backLabel}
              />
            }
          />
          <Route
            path={CANVAS_PATH}
            element={<CanvasScreen onBack={() => navigate(-1)} backLabel={backLabel} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {activeTab ? <AgentsMobileTabBar activeTab={activeTab} profileActive={profileActive} /> : null}
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
