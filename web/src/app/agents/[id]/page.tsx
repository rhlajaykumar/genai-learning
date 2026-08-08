"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Agent,
  Document,
  clearToken,
  client,
  getToken,
} from "@/lib/api";

type Msg = { role: string; content: string };

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    Promise.all([client.getAgent(agentId), client.listDocuments(agentId)])
      .then(([a, d]) => {
        setAgent(a);
        setDocs(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [agentId, router]);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const session = await client.createSession(agentId);
    setSessionId(session.id);
    return session.id;
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

  async function onChat(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setBusy(true);
    setError(null);
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    try {
      const sid = await ensureSession();
      const res = await client.chat(sid, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.assistant_message.content },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">{agent?.name ?? "Agent"}</div>
        <div className="row">
          <Link href="/agents">All agents</Link>
          <Link href={`/agents/${agentId}/traces`}>Traces</Link>
          <Link href={`/agents/${agentId}/evals`}>Evals</Link>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel stack">
        <h2>Configuration</h2>
        <p className="muted">System instruction</p>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {agent?.system_instruction || "—"}
        </pre>
      </section>

      <section className="panel stack">
        <h2>Documents</h2>
        <form className="row" onSubmit={onUpload}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={busy || !file}>
            Upload & ingest
          </button>
        </form>
        {docs.length === 0 ? (
          <p className="muted">Upload txt/md docs to ground this RAG agent.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel stack">
        <h2>Chat</h2>
        <div className="chat-log">
          {messages.length === 0 ? (
            <p className="muted">Ask a question about your documents.</p>
          ) : (
            messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
                <strong>{m.role}</strong>
                <div>{m.content}</div>
              </div>
            ))
          )}
        </div>
        <form className="row" onSubmit={onChat}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the agent…"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
