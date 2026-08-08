"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { client, setToken } from "@/lib/api";

export default function SignupPage() {
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
      const token = await client.signup(username, password);
      setToken(token.access_token);
      router.push("/agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <div className="nav">
        <div className="brand">AI Playground</div>
        <Link href="/login">Log in</Link>
      </div>
      <section className="panel stack" style={{ maxWidth: 420 }}>
        <h1>Sign up</h1>
        <p className="muted">Create an account with a username and password.</p>
        <form className="stack" onSubmit={onSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
