"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trace, client, getToken } from "@/lib/api";

export default function TracesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    client
      .listTraces(params.id)
      .then(setTraces)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [params.id, router]);

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">Interaction traces</div>
        <Link href={`/agents/${params.id}`}>Back to agent</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <section className="panel">
        {traces.length === 0 ? (
          <p className="muted">No traces yet. Chat with the agent first.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Latency</th>
                <th>Chunks</th>
                <th>Model</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {traces.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                  <td>{t.latency_ms ?? "—"} ms</td>
                  <td>{t.retrieved_chunk_ids.length}</td>
                  <td>{t.model ?? "—"}</td>
                  <td>{t.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
