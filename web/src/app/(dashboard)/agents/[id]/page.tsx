"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Agent,
  ChunkIngestRequest,
  ChunkStrategy,
  Document,
  client,
} from "@/lib/api";

const DEFAULT_CHUNK: ChunkIngestRequest = {
  strategy: "fixed",
  chunk_size: 800,
  chunk_overlap: 100,
};

function DocumentChunkPanel({
  agentId,
  doc,
  onUpdated,
}: {
  agentId: string;
  doc: Document;
  onUpdated: (doc: Document) => void;
}) {
  const [open, setOpen] = useState(doc.status === "uploaded");
  const [config, setConfig] = useState<ChunkIngestRequest>(DEFAULT_CHUNK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onIngest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await client.ingestDocument(agentId, doc.id, config);
      onUpdated(updated);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chunking failed");
    } finally {
      setBusy(false);
    }
  }

  const needsChunking = doc.status === "uploaded" || doc.chunk_count === 0;

  return (
    <tr>
      <td>{doc.filename}</td>
      <td>
        <span className={doc.status === "ready" ? "" : "muted"}>{doc.status}</span>
      </td>
      <td>
        {doc.chunk_count > 0 ? (
          <Link href={`/agents/${agentId}/documents/${doc.id}/chunks`}>
            {doc.chunk_count} chunk{doc.chunk_count === 1 ? "" : "s"}
          </Link>
        ) : needsChunking ? (
          <span className="muted">Not chunked</span>
        ) : (
          "0"
        )}
      </td>
      <td>
        <button type="button" className="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : doc.chunk_count > 0 ? "Re-chunk" : "Chunk document"}
        </button>
        {open ? (
          <form className="chunk-form" onSubmit={onIngest}>
            <div className="row">
              <label style={{ flex: 1 }}>
                Strategy
                <select
                  value={config.strategy}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      strategy: e.target.value as ChunkStrategy,
                    }))
                  }
                >
                  <option value="fixed">Fixed size (characters)</option>
                  <option value="sentence">Sentence boundaries</option>
                  <option value="paragraph">Paragraph boundaries</option>
                </select>
              </label>
              <label>
                Chunk size
                <input
                  type="number"
                  min={100}
                  max={8000}
                  value={config.chunk_size}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, chunk_size: Number(e.target.value) }))
                  }
                />
              </label>
              <label>
                Overlap
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={config.chunk_overlap}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, chunk_overlap: Number(e.target.value) }))
                  }
                />
              </label>
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Chunking…" : doc.chunk_count > 0 ? "Re-chunk document" : "Chunk document"}
            </button>
          </form>
        ) : null}
      </td>
    </tr>
  );
}

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const agentId = params.id;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [a, d] = await Promise.all([
      client.getAgent(agentId),
      client.listDocuments(agentId),
    ]);
    setAgent(a);
    setName(a.name);
    setInstruction(a.system_instruction);
    setDocs(d);
  }, [agentId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [load]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await client.updateAgent(agentId, {
        name,
        system_instruction: instruction,
      });
      setAgent(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await client.uploadDocument(agentId, file);
      setDocs((prev) => [doc, ...prev]);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function updateDoc(updated: Document) {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{agent?.name ?? "Edit agent"}</h1>
        <Link href={`/agents/${agentId}/chunks`} className="button secondary">
          View all chunks
        </Link>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {saved ? <p className="muted">Agent saved.</p> : null}

      <section className="panel stack">
        <h2>System instruction</h2>
        <form className="stack" onSubmit={onSave}>
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
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="panel stack">
        <h2>Documents</h2>
        <p className="muted">
          Upload a document, then choose a chunking strategy and run chunking. Chunks
          are embedded and stored for RAG retrieval.
        </p>
        <form className="row" onSubmit={onUpload}>
          <input
            type="file"
            accept=".txt,.md,.markdown,.csv,.json,text/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={busy || !file}>
            Upload document
          </button>
        </form>
        {docs.length === 0 ? (
          <p className="muted">No documents uploaded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <DocumentChunkPanel
                  key={doc.id}
                  agentId={agentId}
                  doc={doc}
                  onUpdated={updateDoc}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
