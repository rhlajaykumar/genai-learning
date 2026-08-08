"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { Trace, client, getToken } from "@/lib/api";

export default function TracesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await client.listTraces(params.id, page, pageSize);
      setTraces(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setTraces([]);
      setError(err instanceof Error ? err.message : "Failed");
    }
  }, [params.id, page]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [load, router]);

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">Execution traces</div>
        <Link href={`/agents/${params.id}`}>Back to agent</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <section className="panel stack">
        {(traces ?? []).length === 0 ? (
          <p className="muted">No traces yet. Chat with the agent first.</p>
        ) : (
          traces.map((t) => (
            <article key={t.id} className="bubble">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{new Date(t.created_at).toLocaleString()}</strong>
                <span className="muted">
                  {t.latency_ms ?? "—"} ms · {t.retrieved_chunk_ids?.length ?? 0} chunks
                </span>
              </div>
              <p className="muted" style={{ margin: "0.5rem 0" }}>
                <strong>User:</strong> {t.user_message ?? "—"}
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setExpandedId((cur) => (cur === t.id ? null : t.id))
                }
              >
                {expandedId === t.id ? "Hide details" : "Show execution details"}
              </button>
              {expandedId === t.id ? (
                <div className="stack" style={{ marginTop: "0.75rem" }}>
                  <div>
                    <strong>Assistant</strong>
                    <p style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0" }}>
                      {t.assistant_message ?? "—"}
                    </p>
                  </div>
                  <div>
                    <strong>Model</strong>
                    <p className="muted">
                      {t.model ?? "—"} ({t.llm_provider ?? "unknown"})
                    </p>
                  </div>
                  {t.error ? (
                    <p className="error">
                      <strong>Error:</strong> {t.error}
                    </p>
                  ) : null}
                  <div>
                    <strong>Retrieved passages</strong>
                    {(t.retrieved_passages ?? []).length === 0 ? (
                      <p className="muted">None</p>
                    ) : (
                      (t.retrieved_passages ?? []).map((p, i) => (
                        <div key={p.chunk_id ?? i} className="bubble" style={{ marginTop: "0.5rem" }}>
                          <span className="muted">score {p.score.toFixed(3)}</span>
                          <p style={{ whiteSpace: "pre-wrap", margin: "0.25rem 0 0" }}>
                            {p.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </section>
    </main>
  );
}
