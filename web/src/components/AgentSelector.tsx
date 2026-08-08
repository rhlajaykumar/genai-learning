"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Agent, client } from "@/lib/api";

type AgentSelectorProps = {
  value: string;
  onChange: (agentId: string) => void;
};

export function AgentSelector({ value, onChange }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    client
      .listAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  if (agents.length === 0) {
    return (
      <p className="muted">
        No agents yet.{" "}
        <Link href="/agents/new">Create an agent</Link> to get started.
      </p>
    );
  }

  return (
    <label>
      Agent
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select an agent…</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </label>
  );
}
