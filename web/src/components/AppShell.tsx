"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Agent, clearToken, client, getToken } from "@/lib/api";

function navClass(href: string, pathname: string, exact = false) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  return `sidebar-link${active ? " active" : ""}`;
}

function isAgentStudioPath(pathname: string) {
  if (pathname === "/agents/new") return true;
  if (pathname.includes("/chunks") || pathname.includes("/documents")) return false;
  return /^\/agents\/[^/]+$/.test(pathname);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const studioMode = isAgentStudioPath(pathname);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    client
      .listAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, [router, pathname]);

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">AI Playground</div>

        <div className="sidebar-section">
          <div className="sidebar-label">Build</div>
          <Link href="/agents" className={navClass("/agents", pathname, true)}>
            Agents
          </Link>
          <Link href="/agents/new" className={navClass("/agents/new", pathname, true)}>
            New agent
          </Link>
          {agents.slice(0, 8).map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className={`${navClass(`/agents/${agent.id}`, pathname)} sidebar-sublink`}
            >
              {agent.name}
            </Link>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Run</div>
          <Link href="/chat" className={navClass("/chat", pathname)}>
            Chat
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Monitor</div>
          <Link href="/observability" className={navClass("/observability", pathname)}>
            Traces
          </Link>
          <Link href="/evals" className={navClass("/evals", pathname)}>
            Evals
          </Link>
        </div>

        <div style={{ marginTop: "auto", padding: "0 0.5rem" }}>
          <button type="button" className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <div className={`app-content${studioMode ? " studio-mode" : ""}`}>
        {studioMode ? children : <div className="app-content-inner">{children}</div>}
      </div>
    </div>
  );
}
