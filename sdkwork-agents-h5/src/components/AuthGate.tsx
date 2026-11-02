import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  isAppSdkSessionAuthenticated,
  readAppSdkSessionTokens,
  SDKWORK_AGENTS_H5_SESSION_CHANGED_EVENT,
} from "@sdkwork/agents-h5-core/session";

import { resolveEnvironment } from "../bootstrap/environment";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [authenticated, setAuthenticated] = useState(() => isAppSdkSessionAuthenticated());
  const loginUrl = useMemo(() => {
    const env = resolveEnvironment();
    const returnUrl = encodeURIComponent(window.location.href);
    const separator = env.appbaseLoginUrl.includes("?") ? "&" : "?";
    return `${env.appbaseLoginUrl}${separator}returnUrl=${returnUrl}`;
  }, []);

  useEffect(() => {
    const sync = () => setAuthenticated(isAppSdkSessionAuthenticated());
    sync();
    window.addEventListener(SDKWORK_AGENTS_H5_SESSION_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SDKWORK_AGENTS_H5_SESSION_CHANGED_EVENT, sync);
  }, []);

  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-color,#F4F7FC)] px-6 text-center text-[var(--color-text-main,#0A1B3D)]">
        <h1 className="text-xl font-semibold">登录后继续</h1>
        <p className="mt-2 max-w-md text-sm text-[var(--color-text-sub,#5B6B88)]">
          SDKWork Agents 需要有效的 IAM 会话。请通过 Appbase 登录，或在开发环境配置
          SDKWORK_ACCESS_TOKEN。
        </p>
        <a
          href={loginUrl}
          className="mt-6 rounded-lg bg-[var(--color-primary,#165DFF)] px-5 py-2.5 text-sm font-medium text-[var(--color-primary-on,#FFFFFF)] transition-colors hover:bg-[var(--color-primary-hover,#4080FF)]"
        >
          前往登录
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
