"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { Chunk, client } from "@/lib/api";

export default function DocumentChunksPage() {
  const params = useParams<{ id: string; docId: string }>();
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
    void load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Document chunks</h1>
        <Link href={`/agents/${params.id}/chunks`} className="button secondary">
          All agent chunks
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel stack">
        {loading ? (
          <p className="muted">Loading chunks…</p>
        ) : chunks.length === 0 ? (
          <p className="muted">No chunks for this document yet.</p>
        ) : (
          chunks.map((chunk) => (
            <article key={chunk.id} className="bubble">
              <strong>
                Chunk #{chunk.chunk_index}
                {typeof chunk.metadata?.strategy === "string"
                  ? ` · ${chunk.metadata.strategy}`
                  : ""}
              </strong>
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
