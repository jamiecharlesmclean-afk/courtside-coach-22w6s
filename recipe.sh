#!/usr/bin/env bash
# Bake-time setup for the react-ts template.
#
# Runs inside the snapshot sandbox after `bun install`, with cwd
# /home/user/project (see apps/web/scripts/build-template.ts:299-303).
# The checked-in template is already a complete nova project so local
# `bun create omg` apps and baked sandbox apps have the same baseline styles.
# This sandbox-only recipe adds the larger component inventory used by agents.
#
# Per-app preset switching still works at runtime with
# `shadcn init --preset <code> --force`.

set -euo pipefail

# The standalone react-ts bake and the Computer bake share this recipe. Bun's
# package cache is only a build input, so do not copy it into either snapshot.
trap 'rm -rf /home/user/.bun/install/cache' EXIT

LOG=/tmp/shadcn-init.log

# Confirm the shared source template is complete before adding inventory.
# A missing token here would break both local create-omg apps and sandboxes.
required_in_vite=(
  "host: '0.0.0.0'"
  "allowedHosts: true"
  "cors: true"
  "alias: { '@'"
)
for needle in "${required_in_vite[@]}"; do
  if ! grep -qF "$needle" vite.config.ts; then
    echo "recipe.sh: vite.config.ts lost required setting after shadcn init: $needle" >&2
    echo "--- vite.config.ts ---" >&2
    cat vite.config.ts >&2
    exit 1
  fi
done

# Confirm the checked-in baseline actually contains its required outputs.
# A partial source update must fail the bake instead of shipping unstyled.
for required_file in components.json src/lib/utils.ts src/index.css; do
  if [ ! -f "$required_file" ]; then
    echo "recipe.sh: missing $required_file after shadcn init" >&2
    exit 1
  fi
done
for css_token in '--color-background:' '--color-foreground:' '--color-card:' '--color-primary:' '@utility squircle'; do
  if ! grep -qF -- "$css_token" src/index.css; then
    echo "recipe.sh: src/index.css missing required baseline style: $css_token" >&2
    exit 1
  fi
done

# Bake the full component inventory so agents reach for real components
# instead of hand-rolling tab bars / toggles / sliders with divs (observed:
# cinematic-zoom-6vlal hand-rolled an easing picker because tabs didn't
# exist). Feed a file of "n" answers on stdin so every "already exists,
# overwrite?" prompt is declined and the vendored delight primitives
# (button.tsx, card.tsx, otp-input.tsx, …) are never clobbered. A plain
# file — not `yes n |` (SIGPIPE trips pipefail) and not `< <(yes n)`
# (process substitution needs /dev/fd, absent in the sandbox VM — broke
# the first bake of this step). Radix deps resolve from the warm bun cache.
echo "recipe.sh: adding shadcn component inventory"
ANSWERS=/tmp/shadcn-answers
for ((i = 0; i < 200; i++)); do echo n; done > "$ANSWERS"
set +e
bunx --bun shadcn@latest add \
  tabs dialog sheet popover tooltip dropdown-menu select input textarea \
  label checkbox radio-group switch slider toggle-group badge separator \
  skeleton progress avatar scroll-area accordion \
  < "$ANSWERS" >>"$LOG" 2>&1
rc=$?
set -e
if [ $rc -ne 0 ]; then
  echo "recipe.sh: shadcn add exited $rc — last 200 lines of output:" >&2
  tail -n 200 "$LOG" >&2
  exit 1
fi
# Spot-check the inventory landed and the vendored primitives survived.
for f in tabs.tsx dialog.tsx select.tsx slider.tsx toggle-group.tsx; do
  if [ ! -f "src/components/ui/$f" ]; then
    echo "recipe.sh: missing src/components/ui/$f after shadcn add" >&2
    exit 1
  fi
done
if grep -q "buttonVariants" src/components/ui/button.tsx 2>/dev/null; then
  echo "recipe.sh: vendored button.tsx was overwritten by shadcn add" >&2
  exit 1
fi
echo "recipe.sh: component inventory baked"

echo "recipe.sh: shadcn inventory complete (preset=nova baseline already present)"
