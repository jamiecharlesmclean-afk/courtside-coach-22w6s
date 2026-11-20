#!/usr/bin/env bash
# Runs every check in order and stops at the first failure. Exit code 0 means everything passed.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== typecheck (route types, then tsc)"
bun run typecheck

echo "== tests"
bun test

echo "== build (static Expo Web export)"
bun run build

echo "All checks passed."
