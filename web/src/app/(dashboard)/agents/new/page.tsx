"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentStudio } from "@/components/studio/AgentStudio";
import { StudioStepId } from "@/components/studio/types";
import { client } from "@/lib/api";

const DEFAULT_INSTRUCTION =
  "You are a helpful assistant. Prefer answers grounded in uploaded documents. Always format replies as HTML.";

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<StudioStepId>("basics");
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const agent = await client.createAgent(name, instruction);
      router.push(`/agents/${agent.id}?step=knowledge`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AgentStudio
      title="New agent"
      step={step}
      done={{}}
      onStepChange={(id) => {
        if (id === "basics") setStep(id);
      }}
      agentId={null}
      tryDisabledReason="Save Basics to create the agent and unlock Try it."
    >
      <section className="panel stack">
        <h2 style={{ margin: 0 }}>Basics</h2>
        <p className="muted" style={{ margin: 0 }}>
          Name your agent and set the system prompt. You&apos;ll add documents and
          chunking next in the studio.
        </p>
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
          <div className="row">
            <button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create & continue"}
            </button>
          </div>
        </form>
      </section>
    </AgentStudio>
  );
}
