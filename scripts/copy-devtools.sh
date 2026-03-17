#!/bin/bash
#
# Copies the built Chrome DevTools frontend from the vpbrowser Chromium
# checkout into this project's assets.
#
# Unsupported panels are hidden at runtime via JS injection in MainActivity.kt
# (see hideUnsupportedPanels) rather than deleted here, since removing files
# breaks the DevTools module loader.
#
# Usage: ./scripts/copy-devtools.sh
#
# Prerequisites:
#   Build DevTools in vpbrowser first:
#     cd ~/vpbrowser/src/chromium/src
#     autoninja -C out/Release third_party/devtools-frontend/src/front_end
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/app/src/main/assets/devtools_frontend"

CHROMIUM_SRC="${CHROMIUM_SRC:-$HOME/vpbrowser/src/chromium/src}"
BUILT_DIR="$CHROMIUM_SRC/out/Release/gen/third_party/devtools-frontend/src/front_end"

# ──────────────────────────────────────────────
# Step 1: Verify source exists
# ──────────────────────────────────────────────
if [ ! -f "$BUILT_DIR/devtools_app.html" ]; then
    echo "ERROR: Built DevTools not found at:"
    echo "  $BUILT_DIR"
    echo ""
    echo "Build it first:"
    echo "  cd $CHROMIUM_SRC"
    echo "  autoninja -C out/Release third_party/devtools-frontend/src/front_end"
    exit 1
fi

echo "=== Copying DevTools frontend ==="
echo "From: $BUILT_DIR"
echo "To:   $ASSETS_DIR"
echo ""

# ──────────────────────────────────────────────
# Step 2: Copy all servable files
# ──────────────────────────────────────────────
rm -rf "$ASSETS_DIR"
mkdir -p "$ASSETS_DIR"

cd "$BUILT_DIR"
find . -type f \( \
    -name "*.js" -o -name "*.mjs" -o -name "*.html" -o -name "*.css" -o \
    -name "*.json" -o -name "*.svg" -o -name "*.png" -o -name "*.gif" -o \
    -name "*.jpg" -o -name "*.jpeg" -o -name "*.wasm" -o -name "*.woff" -o \
    -name "*.woff2" -o -name "*.ttf" -o -name "*.avif" \
\) -not -path "*/test*" -not -path "*/Tests*" | while read -r f; do
    dir=$(dirname "$f")
    mkdir -p "$ASSETS_DIR/$dir"
    cp "$f" "$ASSETS_DIR/$f"
done

# ──────────────────────────────────────────────
# Step 3: Patch CSP to allow local WebSocket
# ──────────────────────────────────────────────
echo "Patching CSP and injecting panel hider..."
for html in devtools_app.html inspector.html; do
    if [ -f "$ASSETS_DIR/$html" ]; then
        # Allow local WebSocket connections
        sed -i.bak "s|ws://127.0.0.1:\*;|ws://127.0.0.1:* ws://localhost:*;|g" "$ASSETS_DIR/$html"
        rm -f "$ASSETS_DIR/$html.bak"
        echo "  Patched: $html"
    fi
done

# Copy our panel-hiding script (survives re-copies because it's in the project)
HIDE_SCRIPT="$PROJECT_DIR/app/src/main/assets/devtools_frontend/devbrowser_hide_panels.js"
if [ ! -f "$HIDE_SCRIPT" ]; then
    # Re-create it from the template in the project
    cp "$PROJECT_DIR/scripts/devbrowser_hide_panels.js" "$HIDE_SCRIPT" 2>/dev/null || true
fi

# ──────────────────────────────────────────────
# Report
# ──────────────────────────────────────────────
FILE_COUNT=$(find "$ASSETS_DIR" -type f | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$ASSETS_DIR" | cut -f1)

echo ""
echo "=== Done ==="
echo "Files: $FILE_COUNT ($DIR_SIZE)"
echo ""
echo "Note: Unsupported panels (Lighthouse, Recorder, etc.) are hidden"
echo "at runtime via JS injection in MainActivity.kt, not removed here."
echo ""
echo "Ready to build: ./gradlew assembleDebug"
