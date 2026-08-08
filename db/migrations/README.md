# Migrations

Versioned SQL files applied by `scripts/migrate.sh` against the running Postgres container.

## Conventions

- Filename: `NNNN_description.sql` (zero-padded sequence)
- Migrations are **forward-only** for now
- Prefer **schema-per-service** (e.g. `ai`, `booking`) rather than one shared domain schema
- Put `pgvector` / cache tables in the owning service's schema

## Apply

```bash
cd db
cp .env.example .env   # if needed
docker compose up -d
./scripts/migrate.sh
```

On Windows (PowerShell), run via Git Bash or WSL, or:

```powershell
docker compose exec -T postgres bash -c "..."
```
