import type { Chunk, Paginated, RetrievedPassage } from "./types";

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
};

export type Agent = {
  id: string;
  name: string;
  system_instruction: string;
  created_at: string;
};

export type Document = {
  id: string;
  agent_id: string;
  filename: string;
  status: string;
  chunk_count: number;
  created_at: string;
};

export type ChatResponse = {
  user_message: { id: string; role: string; content: string; created_at: string };
  assistant_message: { id: string; role: string; content: string; created_at: string };
  trace_id: string | null;
};

export type Trace = {
  id: string;
  session_id: string;
  message_id: string | null;
  latency_ms: number | null;
  retrieved_chunk_ids: string[];
  model: string | null;
  error: string | null;
  created_at: string;
  user_message: string | null;
  assistant_message: string | null;
  retrieved_passages: RetrievedPassage[];
  llm_provider: string | null;
};

export type EvalItem = {
  id: string | null;
  agent_id: string;
  name: string;
  status: string;
  detail?: string;
};

export type { Chunk, Paginated, RetrievedPassage };

const TOKEN_KEY = "playground_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail ?? JSON.stringify(data);
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function pageQuery(page: number, pageSize: number) {
  return `page=${page}&page_size=${pageSize}`;
}

function asPaginated<T>(data: Paginated<T> | T[]): Paginated<T> {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      page_size: data.length,
      total: data.length,
      total_pages: 1,
    };
  }
  return {
    items: data.items ?? [],
    page: data.page ?? 1,
    page_size: data.page_size ?? 10,
    total: data.total ?? 0,
    total_pages: data.total_pages ?? 1,
  };
}

export const client = {
  signup: (username: string, password: string) =>
    api<TokenResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    api<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  listAgents: () => api<Agent[]>("/agents"),
  createAgent: (name: string, system_instruction: string) =>
    api<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify({ name, system_instruction }),
    }),
  getAgent: (id: string) => api<Agent>(`/agents/${id}`),
  listDocuments: (agentId: string) => api<Document[]>(`/agents/${agentId}/documents`),
  listAgentChunks: async (agentId: string, page = 1, pageSize = 10) =>
    asPaginated(
      await api<Paginated<Chunk> | Chunk[]>(
        `/agents/${agentId}/chunks?${pageQuery(page, pageSize)}`,
      ),
    ),
  listDocumentChunks: async (
    agentId: string,
    documentId: string,
    page = 1,
    pageSize = 10,
  ) =>
    asPaginated(
      await api<Paginated<Chunk> | Chunk[]>(
        `/agents/${agentId}/documents/${documentId}/chunks?${pageQuery(page, pageSize)}`,
      ),
    ),
  uploadDocument: (agentId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api<Document>(`/agents/${agentId}/documents`, { method: "POST", body });
  },
  createSession: (agent_id: string) =>
    api<{ id: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ agent_id }),
    }),
  chat: (sessionId: string, message: string) =>
    api<ChatResponse>(`/sessions/${sessionId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  listTraces: async (agentId: string, page = 1, pageSize = 10) =>
    asPaginated(
      await api<Paginated<Trace> | Trace[]>(
        `/agents/${agentId}/traces?${pageQuery(page, pageSize)}`,
      ),
    ),
  getTrace: (agentId: string, traceId: string) =>
    api<Trace>(`/agents/${agentId}/traces/${traceId}`),
  listEvals: (agentId: string) => api<EvalItem[]>(`/agents/${agentId}/evals`),
};
