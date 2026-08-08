"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api";

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState(
    "You are a helpful assistant. Prefer answers grounded in uploaded documents.",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const agent = await client.createAgent(name, instruction);
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Create new agent</h1>
      </div>

      <section className="panel stack">
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
    </>
  );
}
