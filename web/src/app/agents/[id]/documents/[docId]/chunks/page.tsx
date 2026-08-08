"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { Chunk, client, getToken } from "@/lib/api";

export default function DocumentChunksPage() {
  const params = useParams<{ id: string; docId: string }>();
  const router = useRouter();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listDocumentChunks(
        params.id,
        params.docId,
        page,
        pageSize,
      );
      setChunks(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setChunks([]);
      setError(err instanceof Error ? err.message : "Failed to load chunks");
    } finally {
      setLoading(false);
    }
  }, [params.id, params.docId, page]);

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
        <div className="brand">Document chunks</div>
        <Link href={`/agents/${params.id}`}>Back to agent</Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <section className="panel stack">
        {loading ? (
          <p className="muted">Loading chunks…</p>
        ) : (chunks ?? []).length === 0 ? (
          <p className="muted">
            No chunks for this document. Re-upload the file if ingest failed, or
            check you are logged in as the agent owner.
          </p>
        ) : (
          chunks.map((chunk) => (
            <article key={chunk.id} className="bubble">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>Chunk #{chunk.chunk_index}</strong>
                <span className="muted">{chunk.id.slice(0, 8)}…</span>
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
