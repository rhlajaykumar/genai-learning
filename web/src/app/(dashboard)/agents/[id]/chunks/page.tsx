"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { Agent, Chunk, client } from "@/lib/api";

export default function AgentChunksPage() {
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, data] = await Promise.all([
        client.getAgent(params.id),
        client.listAgentChunks(params.id, page, pageSize),
      ]);
      setAgent(a);
      setChunks(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setChunks([]);
      setError(err instanceof Error ? err.message : "Failed to load chunks");
    } finally {
      setLoading(false);
    }
  }, [params.id, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{agent?.name ?? "Agent"} — RAG chunks</h1>
        <Link href={`/agents/${params.id}`} className="button secondary">
          Edit agent
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel stack">
        {loading ? (
          <p className="muted">Loading chunks…</p>
        ) : chunks.length === 0 ? (
          <p className="muted">
            No chunks yet. Upload a document on the agent page, choose a chunking
            strategy, and run chunking.
          </p>
        ) : (
          chunks.map((chunk) => (
            <article key={chunk.id} className="bubble">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>
                  Chunk #{chunk.chunk_index}
                  {typeof chunk.metadata?.filename === "string"
                    ? ` · ${chunk.metadata.filename}`
                    : ""}
                  {typeof chunk.metadata?.strategy === "string"
                    ? ` · ${chunk.metadata.strategy}`
                    : ""}
                </strong>
                <Link
                  href={`/agents/${params.id}/documents/${chunk.document_id}/chunks`}
                  className="muted"
                >
                  View document chunks
                </Link>
              </div>
              <p style={{ whiteSpace: "pre-wrap", margin: "0.5rem 0 0" }}>
                {chunk.content}
              </p>
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
    </>
  );
}
