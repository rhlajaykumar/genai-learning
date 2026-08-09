import type { ChunkIngestRequest, ChunkStrategy } from "@/lib/types";

export const DEFAULT_CHUNK_CONFIG: ChunkIngestRequest = {
  strategy: "fixed",
  chunk_size: 800,
  chunk_overlap: 100,
};

type ChunkConfigFieldsProps = {
  config: ChunkIngestRequest;
  onChange: (config: ChunkIngestRequest) => void;
};

export function ChunkConfigFields({ config, onChange }: ChunkConfigFieldsProps) {
  return (
    <div className="row">
      <label style={{ flex: 1 }}>
        Strategy
        <select
          value={config.strategy}
          onChange={(e) =>
            onChange({ ...config, strategy: e.target.value as ChunkStrategy })
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
            onChange({ ...config, chunk_size: Number(e.target.value) })
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
            onChange({ ...config, chunk_overlap: Number(e.target.value) })
          }
        />
      </label>
    </div>
  );
}
