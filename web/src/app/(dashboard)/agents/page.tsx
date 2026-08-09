"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentCard } from "@/components/studio/AgentCard";
import { Agent, client } from "@/lib/api";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .listAgents()
      .then(setAgents)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Build RAG agents in the studio — configure knowledge, chunking, and test live.
          </p>
        </div>
        <Link href="/agents/new" className="button">
          New agent
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {agents.length === 0 ? (
        <section className="panel stack">
          <p className="muted" style={{ margin: 0 }}>
            No agents yet. Create your first agent to open the guided studio.
          </p>
          <div>
            <Link href="/agents/new" className="button">
              Create agent
            </Link>
          </div>
        </section>
      ) : (
        <div className="agent-grid">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </>
  );
}
