#!/usr/bin/env bash
# Apply pending SQL migrations in db/migrations to the Postgres container.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

COMPOSE=(docker compose)
SERVICE=postgres
USER="${POSTGRES_USER:-postgres}"
DB="${POSTGRES_DB:-booking}"

echo "Waiting for Postgres..."
until "${COMPOSE[@]}" exec -T "$SERVICE" pg_isready -U "$USER" -d "$DB" >/dev/null 2>&1; do
  sleep 1
done

shopt -s nullglob
files=("$ROOT"/migrations/*.sql)
IFS=$'\n' files=($(printf '%s\n' "${files[@]}" | sort))

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No migration files found."
  exit 0
fi

for file in "${files[@]}"; do
  version="$(basename "$file")"
  applied="$("${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$USER" -d "$DB" -Atc \
    "SELECT 1 FROM schema_migrations WHERE version = '$version'")"
  if [[ "$applied" == "1" ]]; then
    echo "skip  $version"
    continue
  fi
  echo "apply $version"
  "${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 <"$file"
  "${COMPOSE[@]}" exec -T "$SERVICE" psql -U "$USER" -d "$DB" -c \
    "INSERT INTO schema_migrations (version) VALUES ('$version')"
done

echo "Migrations complete."
