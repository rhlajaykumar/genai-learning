"use client";

import { useEffect, useState } from "react";
import { AgentSelector } from "@/components/AgentSelector";
import { EvalItem, client } from "@/lib/api";

export default function EvalsPage() {
  const [agentId, setAgentId] = useState("");
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setEvals([]);
      return;
    }
    client
      .listEvals(agentId)
      .then(setEvals)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [agentId]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Evals</h1>
      </div>

      <section className="panel stack">
        <AgentSelector value={agentId} onChange={setAgentId} />
        {error ? <p className="error">{error}</p> : null}

        {!agentId ? (
          <p className="muted">Select an agent to view evaluation suites.</p>
        ) : (
          <>
            <h2>Coming soon</h2>
            <p className="muted">
              This is a placeholder for agent evaluation suites. The API is stubbed so
              the UI can grow without blocking chat and RAG.
            </p>
            <ul>
              {evals.map((item, idx) => (
                <li key={item.id ?? idx}>
                  {item.name} — <strong>{item.status}</strong>
                  {item.detail ? ` (${item.detail})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
