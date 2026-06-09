#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Static HTML project — no dependencies to install.
# Verify the main file is present.
if [ ! -f "${CLAUDE_PROJECT_DIR}/index.html" ]; then
  echo "WARNING: index.html not found in project root" >&2
fi
