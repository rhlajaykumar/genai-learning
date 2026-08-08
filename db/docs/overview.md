# DB overview

## Role of `db/`

This folder owns **shared database infrastructure**:

| Concern | Location |
|--------|----------|
| Postgres Docker service | `docker-compose.yml` |
| Extensions (`vector`, `uuid-ossp`, …) | `postgres/init/` |
| Versioned SQL migrations | `migrations/` |
| Apply migrations | `scripts/migrate.sh` |

Application microservices (e.g. `ai/`) connect via `DATABASE_URL`. They should not run their own Postgres containers for local shared-dev unless isolated testing requires it.

## Schema strategy

- Prefer **one schema per microservice** (e.g. `CREATE SCHEMA ai;`)
- Cache tables, embedding tables, and domain tables live in the owning service schema
- Cross-service data access goes through APIs, not cross-schema joins

## Adding a migration

1. Add `migrations/NNNN_short_name.sql`
2. Run `./scripts/migrate.sh`
3. Document non-obvious changes here or in the migration header comment
