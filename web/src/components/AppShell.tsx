"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Agent, clearToken, client, getToken } from "@/lib/api";

function navClass(href: string, pathname: string, exact = false) {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return `sidebar-link${active ? " active" : ""}`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);

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

  const agentMatch = pathname.match(/^\/agents\/([^/]+)/);
  const activeAgentId = agentMatch?.[1] && agentMatch[1] !== "new" ? agentMatch[1] : null;

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">AI Playground</div>

        <div className="sidebar-section">
          <div className="sidebar-label">Agents</div>
          <Link href="/agents" className={navClass("/agents", pathname, true)}>
            Agent list
          </Link>
          <Link href="/agents/new" className={navClass("/agents/new", pathname, true)}>
            Create new agent
          </Link>
          {agents.map((agent) => (
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
          <div className="sidebar-label">Observability</div>
          <Link href="/observability" className={navClass("/observability", pathname)}>
            Traces
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Evals</div>
          <Link href="/evals" className={navClass("/evals", pathname)}>
            Eval suites
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Chat</div>
          <Link href="/chat" className={navClass("/chat", pathname)}>
            Chat
          </Link>
        </div>

        <div style={{ marginTop: "auto", padding: "0 0.5rem" }}>
          <button type="button" className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-content">
        {activeAgentId ? (
          <nav className="agent-tabs">
            <Link
              href={`/agents/${activeAgentId}`}
              className={pathname === `/agents/${activeAgentId}` ? "active" : ""}
            >
              Edit agent
            </Link>
            <Link
              href={`/agents/${activeAgentId}/chunks`}
              className={pathname.startsWith(`/agents/${activeAgentId}/chunks`) ? "active" : ""}
            >
              RAG chunks
            </Link>
          </nav>
        ) : null}
        {children}
      </div>
    </div>
  );
}
