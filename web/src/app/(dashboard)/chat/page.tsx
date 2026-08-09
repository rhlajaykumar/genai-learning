"use client";

import { FormEvent, useEffect, useState } from "react";
import { AgentSelector } from "@/components/AgentSelector";
import { HtmlMessage } from "@/components/HtmlMessage";
import { client } from "@/lib/api";

type Msg = { role: string; content: string };

export default function ChatPage() {
  const [agentId, setAgentId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setInput("");
  }, [agentId]);

  async function ensureSession() {
    if (!agentId) throw new Error("Select an agent first");
    if (sessionId) return sessionId;
    const session = await client.createSession(agentId);
    setSessionId(session.id);
    return session.id;
  }

  async function onChat(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !agentId) return;
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
    <>
      <div className="page-header">
        <h1 className="page-title">Chat</h1>
      </div>

      <section className="panel stack">
        <AgentSelector value={agentId} onChange={setAgentId} />
        {error ? <p className="error">{error}</p> : null}

        {!agentId ? (
          <p className="muted">Select an agent to start chatting.</p>
        ) : (
          <>
            <div className="chat-log">
              {messages.length === 0 ? (
                <p className="muted">Ask a question about your agent&apos;s documents.</p>
              ) : (
                messages.map((m, i) => (
                  <div key={`${m.role}-${i}`} className={`bubble ${m.role}`}>
                    <strong>{m.role}</strong>
                    {m.role === "assistant" ? (
                      <HtmlMessage html={m.content} />
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                    )}
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
          </>
        )}
      </section>
    </>
  );
}
