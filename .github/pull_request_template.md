## Summary

<!-- What changed and why (1–3 bullets) -->

## Service / area

- [ ] `ai/`
- [ ] `db/`
- [ ] Other: <!-- path -->

## Definition of done

- [ ] Behavior matches the request (acceptance checks)
- [ ] Tests added/updated; `uv run pytest` passes in touched service(s)
- [ ] No unnecessary refactors or new dependencies
- [ ] API/schema contracts updated if responses changed
- [ ] New SQL migration under `db/migrations/` if schema changed (no edits to applied migrations)
- [ ] New env vars documented in `.env.example`
- [ ] README / `AGENTS.md` updated only if setup or public behavior changed
- [ ] No secrets or `.env` files in the PR

## Test plan

- [ ] <!-- e.g. GET /health -->
- [ ] <!-- e.g. docker compose up + migrate.sh -->
