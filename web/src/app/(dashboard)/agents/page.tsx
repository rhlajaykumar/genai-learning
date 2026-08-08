"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        <h1 className="page-title">Agent list</h1>
        <Link href="/agents/new" className="button">
          Create new agent
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel stack">
        {agents.length === 0 ? (
          <p className="muted">No agents yet. Create your first RAG agent.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
                  </td>
                  <td>{new Date(agent.created_at).toLocaleString()}</td>
                  <td>
                    <Link href={`/agents/${agent.id}/chunks`}>View chunks</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
