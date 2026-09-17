import { useMemo, useState } from "react";
import {
  HashRouter,
  Navigate,
  NavLink,
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
  AGENT_MARKET_ROUTE,
  AGENT_MARKET_SEARCH_ROUTE,
  CHAT_ROUTE,
  CREATE_AGENT_ROUTE,
  MY_AGENTS_ROUTE,
} from "@sdkwork/agents-h5-shell";

import { AuthGate } from "./components/AuthGate";

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

function AgentsHomePage() {
  const navigate = useNavigate();
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const [editAgentId, setEditAgentId] = useState<string | undefined>();

  const navigateToCreate = useMemo(
    () => ({
      onCreateAgent: () => setIsCreateAgentModalOpen(true),
      onEditAgent: (id: string) => {
        setEditAgentId(id);
        navigate(`/${CREATE_AGENT_ROUTE}`);
      },
    }),
    [navigate],
  );

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

  return (
    <div className="flex min-h-screen flex-col bg-[#141414] text-gray-100">
      <ToastContainer />
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold">SDKWork Agents</h1>
          <p className="text-xs text-gray-400">智能体管理与市场</p>
        </div>
      </header>
      <nav className="flex items-center gap-4 border-b border-white/10 px-4 py-2 text-xs">
        {[
          { to: "/", label: "智能体" },
          { to: `/${AGENT_MARKET_ROUTE}`, label: "市场" },
          { to: `/${MY_AGENTS_ROUTE}`, label: "我的智能体" },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "text-white font-medium" : "text-gray-400 hover:text-gray-200"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex min-h-0 flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <AgentView
                onStartChat={handleStandaloneStartChat}
                onCreateAgent={navigateToCreate.onCreateAgent}
                onEditAgent={navigateToCreate.onEditAgent}
              />
            }
          />
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
          <Route path={`/${CHAT_ROUTE}/:agentId`} element={<AgentChatRoutePage />} />
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
                onEditAgent={navigateToCreate.onEditAgent}
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
                onCreateAgent={navigateToCreate.onCreateAgent}
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
      <CreateAgentModal
        isOpen={isCreateAgentModalOpen}
        onClose={() => setIsCreateAgentModalOpen(false)}
        onSuccess={(agentId) => {
          setIsCreateAgentModalOpen(false);
          setEditAgentId(agentId);
          navigate(`/${CREATE_AGENT_ROUTE}`);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <AgentsHomePage />
      </HashRouter>
    </AuthGate>
  );
}
