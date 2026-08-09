"use client";

import { FormEvent, useEffect, useState } from "react";
import { HtmlMessage } from "@/components/HtmlMessage";
import { client } from "@/lib/api";

type Msg = { role: string; content: string };

type TryChatPanelProps = {
  agentId: string | null;
  disabledReason?: string;
};

export function TryChatPanel({ agentId, disabledReason }: TryChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
  }, [agentId]);

  async function ensureSession() {
    if (!agentId) throw new Error("Agent not ready");
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

  if (!agentId) {
    return (
      <aside className="studio-try">
        <div className="studio-try-header">Try it</div>
        <div className="studio-try-disabled">
          {disabledReason ?? "Create the agent to unlock live testing."}
        </div>
      </aside>
    );
  }

  return (
    <aside className="studio-try">
      <div className="studio-try-header">Try it</div>
      <div className="studio-try-body">
        {error ? <p className="error">{error}</p> : null}
        <div className="chat-log">
          {messages.length === 0 ? (
            <p className="muted">Ask a question to test this agent.</p>
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
            placeholder="Try a question…"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </aside>
  );
}
