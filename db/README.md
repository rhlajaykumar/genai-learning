# Database

Central Postgres infrastructure: Docker service, extensions (`pgvector`), and SQL migrations.

## Quick start

```bash
cd db
cp .env.example .env
docker compose up -d
```

Wait until healthy, then apply migrations:

```bash
# Windows PowerShell
./scripts/migrate.ps1

# macOS / Linux / Git Bash
chmod +x scripts/migrate.sh
./scripts/migrate.sh
```

Connection (defaults):

```
postgresql://postgres:postgres@localhost:5432/booking
```

Async SQLAlchemy style (for FastAPI services):

```
postgresql+asyncpg://postgres:postgres@localhost:5432/booking
```

## Layout

```
db/
├── docker-compose.yml      # Postgres + pgvector
├── .env.example
├── postgres/init/          # First-boot init (extensions, schema_migrations)
├── migrations/             # Versioned SQL migrations
├── scripts/migrate.sh      # Apply pending migrations
└── docs/                   # DB docs
```

## Notes

- Image: `pgvector/pgvector:pg16`
- Init scripts run only on an empty data volume
- Service apps should use their own schemas; do not share tables across microservices
- See `docs/overview.md` for roles of this folder vs app-owned data
