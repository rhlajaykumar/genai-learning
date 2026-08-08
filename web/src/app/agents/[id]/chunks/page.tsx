"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { Chunk, client, getToken } from "@/lib/api";

export default function AgentChunksPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
      const data = await client.listAgentChunks(params.id, page, pageSize);
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
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [load, router]);

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">RAG chunks</div>
        <Link href={`/agents/${params.id}`}>Back to agent</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <section className="panel stack">
        {loading ? (
          <p className="muted">Loading chunks…</p>
        ) : (chunks ?? []).length === 0 ? (
          <p className="muted">
            No chunks yet. Upload a document on the agent page and wait for ingest
            to finish (status: ready).
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
                </strong>
                <Link
                  href={`/agents/${params.id}/documents/${chunk.document_id}/chunks`}
                  className="muted"
                >
                  doc {chunk.document_id.slice(0, 8)}…
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
    </main>
  );
}
