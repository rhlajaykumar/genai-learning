"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChunkConfigFields,
  DEFAULT_CHUNK_CONFIG,
} from "@/components/ChunkConfigFields";
import { AgentStudio } from "@/components/studio/AgentStudio";
import { StudioStepId } from "@/components/studio/types";
import {
  Agent,
  ChunkIngestRequest,
  Document,
  client,
} from "@/lib/api";

function DocumentChunkRow({
  agentId,
  doc,
  onUpdated,
}: {
  agentId: string;
  doc: Document;
  onUpdated: (doc: Document) => void;
}) {
  const [open, setOpen] = useState(doc.status === "uploaded");
  const [config, setConfig] = useState<ChunkIngestRequest>(DEFAULT_CHUNK_CONFIG);
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

  return (
    <tr>
      <td>{doc.filename}</td>
      <td>
        <span className={`status-pill ${doc.status}`}>{doc.status}</span>
      </td>
      <td>
        {doc.chunk_count > 0 ? (
          <Link href={`/agents/${agentId}/documents/${doc.id}/chunks`}>
            {doc.chunk_count}
          </Link>
        ) : (
          <span className="muted">0</span>
        )}
      </td>
      <td>
        <button type="button" className="secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : doc.chunk_count > 0 ? "Re-chunk" : "Chunk"}
        </button>
        {open ? (
          <form className="chunk-form" onSubmit={onIngest}>
            <ChunkConfigFields config={config} onChange={setConfig} />
            {busy ? (
              <p className="muted" style={{ margin: 0 }}>
                Chunking large PDFs can take several minutes.
              </p>
            ) : null}
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Chunking…" : "Run chunking"}
            </button>
          </form>
        ) : null}
      </td>
    </tr>
  );
}

function parseStep(value: string | null): StudioStepId {
  if (
    value === "knowledge" ||
    value === "chunking" ||
    value === "review" ||
    value === "basics"
  ) {
    return value;
  }
  return "basics";
}

export default function AgentStudioPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = params.id;

  const [step, setStep] = useState<StudioStepId>(parseStep(searchParams.get("step")));
  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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

  useEffect(() => {
    setStep(parseStep(searchParams.get("step")));
  }, [searchParams]);

  function goStep(id: StudioStepId) {
    setStep(id);
    router.replace(`/agents/${agentId}?step=${id}`);
  }

  const done = useMemo(
    () => ({
      basics: Boolean(agent?.name && agent.system_instruction),
      knowledge: docs.length > 0,
      chunking: docs.some((d) => d.chunk_count > 0),
      review:
        docs.length > 0 &&
        docs.every((d) => d.status === "ready" || d.chunk_count > 0),
    }),
    [agent, docs],
  );

  async function onSaveBasics(e: FormEvent) {
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
      goStep("knowledge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of files) {
        setStatus(`Uploading ${file.name}…`);
        const doc = await client.uploadDocument(agentId, file);
        setDocs((prev) => [doc, ...prev]);
      }
      setFiles([]);
      setStatus(null);
      goStep("chunking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function updateDoc(updated: Document) {
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  return (
    <AgentStudio
      title={agent?.name ?? "Agent studio"}
      step={step}
      done={done}
      onStepChange={goStep}
      agentId={agentId}
      toolbarActions={
        <Link href={`/agents/${agentId}/chunks`} className="button secondary">
          All chunks
        </Link>
      }
    >
      {error ? <p className="error">{error}</p> : null}

      {step === "basics" ? (
        <section className="panel stack">
          <h2 style={{ margin: 0 }}>Basics</h2>
          <p className="muted" style={{ margin: 0 }}>
            Configure the agent identity and system prompt used for every reply.
          </p>
          <form className="stack" onSubmit={onSaveBasics}>
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
            {saved ? <p className="muted">Saved.</p> : null}
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save & continue"}
            </button>
          </form>
        </section>
      ) : null}

      {step === "knowledge" ? (
        <section className="panel stack">
          <h2 style={{ margin: 0 }}>Knowledge</h2>
          <p className="muted" style={{ margin: 0 }}>
            Upload source documents (.txt, .md, .pdf). Chunk them in the next step.
          </p>
          <form className="stack" onSubmit={onUpload}>
            <input
              type="file"
              multiple
              accept=".txt,.md,.markdown,.csv,.json,.pdf,text/*,application/pdf"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            {files.length > 0 ? (
              <ul className="stack" style={{ margin: 0 }}>
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            ) : null}
            {status ? <p className="muted">{status}</p> : null}
            <div className="row">
              <button type="submit" disabled={busy || files.length === 0}>
                {busy ? "Uploading…" : "Upload & continue"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => goStep("chunking")}
              >
                Skip to chunking
              </button>
            </div>
          </form>
          {docs.length > 0 ? (
            <div>
              <h3>Uploaded</h3>
              <ul>
                {docs.map((d) => (
                  <li key={d.id}>
                    {d.filename}{" "}
                    <span className={`status-pill ${d.status}`}>{d.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === "chunking" ? (
        <section className="panel stack">
          <h2 style={{ margin: 0 }}>Chunking</h2>
          <p className="muted" style={{ margin: 0 }}>
            Choose a strategy per document, then embed for retrieval.
          </p>
          {docs.length === 0 ? (
            <p className="muted">
              No documents yet.{" "}
              <button
                type="button"
                className="secondary"
                onClick={() => goStep("knowledge")}
              >
                Add knowledge
              </button>
            </p>
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
                  <DocumentChunkRow
                    key={doc.id}
                    agentId={agentId}
                    doc={doc}
                    onUpdated={updateDoc}
                  />
                ))}
              </tbody>
            </table>
          )}
          <button type="button" className="secondary" onClick={() => goStep("review")}>
            Continue to review
          </button>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="panel stack">
          <h2 style={{ margin: 0 }}>Review</h2>
          <p className="muted" style={{ margin: 0 }}>
            Confirm documents are ready, then use Try it on the right.
          </p>
          <div className="stack">
            <div>
              <strong>Agent</strong>
              <p style={{ margin: "0.35rem 0 0" }}>{agent?.name}</p>
            </div>
            <div>
              <strong>Documents</strong>
              {docs.length === 0 ? (
                <p className="muted">None uploaded.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Status</th>
                      <th>Chunks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id}>
                        <td>{d.filename}</td>
                        <td>
                          <span className={`status-pill ${d.status}`}>{d.status}</span>
                        </td>
                        <td>
                          {d.chunk_count > 0 ? (
                            <Link href={`/agents/${agentId}/documents/${d.id}/chunks`}>
                              {d.chunk_count}
                            </Link>
                          ) : (
                            0
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="row">
              <Link href={`/agents/${agentId}/chunks`} className="button">
                Browse all chunks
              </Link>
              <Link href="/chat" className="button secondary">
                Open full chat
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </AgentStudio>
  );
}
