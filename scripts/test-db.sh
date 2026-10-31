#!/usr/bin/env bash
# Runs the database migration and access-rule tests on a throwaway local Postgres 16.
# Needs Postgres 16 server binaries (initdb, pg_ctl) installed. Leaves nothing behind.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
TMP="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = "0" ]; then
  # Postgres refuses to run as root; use the postgres system user.
  chown postgres "$TMP"
  RUN=(runuser -u postgres --)
fi

cleanup() { "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-k $TMP -c listen_addresses=''" -w start >/dev/null

# Files are piped in, so the postgres user doesn't need read access to the repo.
PSQL=("${RUN[@]}" psql -X -q -h "$TMP" -U postgres -d postgres -v ON_ERROR_STOP=1)
"${PSQL[@]}" < "$ROOT/supabase/tests/auth_shim.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  "${PSQL[@]}" < "$migration"
done
"${PSQL[@]}" < "$ROOT/supabase/tests/access_rules.sql"
