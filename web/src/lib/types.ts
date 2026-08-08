export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type Chunk = {
  id: string;
  document_id: string;
  agent_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RetrievedPassage = {
  chunk_id: string | null;
  score: number;
  text: string;
  source_doc_id: string | null;
};
