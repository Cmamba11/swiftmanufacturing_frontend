#!/usr/bin/env bash
set -euo pipefail

SKIP_INSTALL=false

for arg in "$@"; do
  case "$arg" in
    --skip-install)
      SKIP_INSTALL=true
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--skip-install]"
      exit 1
      ;;
  esac
done

if [ "$SKIP_INSTALL" = false ]; then
  echo "[setup] Installing frontend dependencies..."
  npm install
else
  echo "[setup] Skipping dependency install (--skip-install)."
fi

echo "[setup] Running backend setup..."
if [ "$SKIP_INSTALL" = false ]; then
  npm --prefix backend run setup
else
  npm --prefix backend run setup -- --skip-install
fi

echo "[setup] Done."
echo "[setup] Start backend: npm run dev:api"
echo "[setup] Start frontend: npm run dev"
