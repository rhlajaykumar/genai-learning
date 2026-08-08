"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EvalItem, client, getToken } from "@/lib/api";

export default function EvalsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    client
      .listEvals(params.id)
      .then(setEvals)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [params.id, router]);

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">Evals</div>
        <Link href={`/agents/${params.id}`}>Back to agent</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <section className="panel stack">
        <h1>Coming soon</h1>
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
      </section>
    </main>
  );
}
