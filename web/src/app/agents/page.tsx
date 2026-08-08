"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Agent, clearToken, client, getToken } from "@/lib/api";

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState(
    "You are a helpful assistant. Prefer answers grounded in uploaded documents.",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    client
      .listAgents()
      .then(setAgents)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const agent = await client.createAgent(name, instruction);
      setAgents((prev) => [agent, ...prev]);
      setName("");
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">AI Playground</div>
        <button type="button" className="secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <section className="panel stack">
        <h1>Your agents</h1>
        {agents.length === 0 ? (
          <p className="muted">No agents yet. Create a RAG agent below.</p>
        ) : (
          <ul className="stack">
            {agents.map((agent) => (
              <li key={agent.id}>
                <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel stack">
        <h2>Create RAG agent</h2>
        <form className="stack" onSubmit={onCreate}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            System instruction
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create agent"}
          </button>
        </form>
      </section>
    </main>
  );
}
