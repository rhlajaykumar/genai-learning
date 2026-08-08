"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { client, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await client.login(username, password);
      setToken(token.access_token);
      router.push("/agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">AI Playground</div>
        <Link href="/signup">Sign up</Link>
      </div>
      <section className="panel stack" style={{ maxWidth: 420 }}>
        <h1>Log in</h1>
        <p className="muted">Use the username and password you created at signup.</p>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
