"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChunkConfigFields,
  DEFAULT_CHUNK_CONFIG,
} from "@/components/ChunkConfigFields";
import { ChunkIngestRequest, client } from "@/lib/api";

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState(
    "You are a helpful assistant. Prefer answers grounded in uploaded documents.",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [chunkConfig, setChunkConfig] = useState<ChunkIngestRequest>(DEFAULT_CHUNK_CONFIG);
  const [autoChunk, setAutoChunk] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const added = Array.from(fileList).filter((f) => !names.has(f.name));
      return [...prev, ...added];
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus("Creating agent…");
    try {
      const agent = await client.createAgent(name, instruction);

      for (const file of files) {
        setStatus(`Uploading ${file.name}…`);
        const doc = await client.uploadDocument(agent.id, file);
        if (autoChunk) {
          setStatus(
            `Chunking ${file.name}… large PDFs can take several minutes; keep this tab open.`,
          );
          await client.ingestDocument(agent.id, doc.id, chunkConfig);
        }
      }

      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Create new agent</h1>
      </div>

      <section className="panel stack">
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

          <div className="stack">
            <h2 style={{ margin: 0 }}>Documents</h2>
            <p className="muted" style={{ margin: 0 }}>
              Optionally upload documents now. They will be chunked after the agent is
              created using the strategy below.
            </p>
            <input
              type="file"
              multiple
              accept=".txt,.md,.markdown,.csv,.json,.pdf,text/*,application/pdf"
              onChange={(e) => {
                onFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 ? (
              <ul className="stack" style={{ margin: 0 }}>
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="row">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No documents selected.
              </p>
            )}
          </div>

          {files.length > 0 ? (
            <div className="chunk-form">
              <label className="row">
                <input
                  type="checkbox"
                  checked={autoChunk}
                  onChange={(e) => setAutoChunk(e.target.checked)}
                  style={{ width: "auto" }}
                />
                Chunk documents after upload
              </label>
              {autoChunk ? (
                <ChunkConfigFields config={chunkConfig} onChange={setChunkConfig} />
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Documents will be uploaded only. Chunk them later from the agent
                  edit page.
                </p>
              )}
            </div>
          ) : null}

          {error ? <p className="error">{error}</p> : null}
          {status ? <p className="muted">{status}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Working…" : "Create agent"}
          </button>
        </form>
      </section>
    </>
  );
}
