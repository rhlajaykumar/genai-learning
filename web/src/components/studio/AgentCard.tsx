"use client";

import Link from "next/link";
import { Agent } from "@/lib/api";

type AgentCardProps = {
  agent: Agent;
};

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <article className="agent-card">
      <div>
        <h2 className="agent-card-title">{agent.name}</h2>
        <p className="agent-card-meta">
          Created {new Date(agent.created_at).toLocaleString()}
        </p>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
        {(agent.system_instruction || "No system instruction yet.").slice(0, 120)}
        {(agent.system_instruction?.length ?? 0) > 120 ? "…" : ""}
      </p>
      <div className="agent-card-actions">
        <Link href={`/agents/${agent.id}`} className="button">
          Open studio
        </Link>
        <Link href={`/agents/${agent.id}/chunks`} className="button secondary">
          Chunks
        </Link>
      </div>
    </article>
  );
}
