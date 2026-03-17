#!/bin/bash
#
# Fetches the Chrome DevTools frontend from official Chromium sources.
# The frontend is served locally by DevToolsServer.kt within the app.
#
# Usage: ./scripts/fetch-devtools-frontend.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/app/src/main/assets/devtools_frontend"

echo "=== Fetching Chrome DevTools Frontend ==="
echo ""

# Clean previous download
rm -rf "$ASSETS_DIR"
mkdir -p "$ASSETS_DIR"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# ──────────────────────────────────────────────
# Method 1: Extract from Chrome for Testing
# This gives us pre-built, ready-to-serve files.
# ──────────────────────────────────────────────
extract_from_chrome() {
    echo "[Method 1] Extracting DevTools from Chrome for Testing..."

    local PLATFORM=""
    local EXT=""
    case "$(uname -s)" in
        Linux*)  PLATFORM="linux64"; EXT="zip" ;;
        Darwin*) PLATFORM="mac-x64"; EXT="zip" ;;
        *)       echo "Unsupported platform"; return 1 ;;
    esac

    # Get latest stable Chrome for Testing version
    echo "Fetching latest Chrome for Testing version..."
    local VERSION_JSON
    VERSION_JSON=$(curl -sL "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json")

    local DOWNLOAD_URL
    DOWNLOAD_URL=$(echo "$VERSION_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
downloads = data['channels']['Stable']['downloads']['chrome']
for d in downloads:
    if d['platform'] == '$PLATFORM':
        print(d['url'])
        break
" 2>/dev/null) || return 1

    if [ -z "$DOWNLOAD_URL" ]; then
        echo "Could not find download URL for $PLATFORM"
        return 1
    fi

    local VERSION
    VERSION=$(echo "$VERSION_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['channels']['Stable']['version'])
")

    echo "Downloading Chrome $VERSION for $PLATFORM..."
    curl -L --progress-bar -o "$TEMP_DIR/chrome.$EXT" "$DOWNLOAD_URL" || return 1

    echo "Extracting..."
    cd "$TEMP_DIR"
    unzip -q "chrome.$EXT" || return 1

    # Find the devtools resources
    local DEVTOOLS_PATH=""
    if [ -d "chrome-$PLATFORM/Chrome.app" ]; then
        # macOS
        DEVTOOLS_PATH="chrome-$PLATFORM/Chrome.app/Contents/Resources/content/browser/resources/inspector"
        if [ ! -d "$DEVTOOLS_PATH" ]; then
            # Try versioned resources path
            DEVTOOLS_PATH=$(find "chrome-$PLATFORM" -type d -name "inspector" -path "*/resources/*" 2>/dev/null | head -1)
        fi
        if [ -z "$DEVTOOLS_PATH" ] || [ ! -d "$DEVTOOLS_PATH" ]; then
            # Try DevTools resource pak extraction approach
            DEVTOOLS_PATH=$(find "chrome-$PLATFORM" -type d -name "devtools" 2>/dev/null | head -1)
        fi
    else
        # Linux
        DEVTOOLS_PATH="chrome-$PLATFORM/resources/inspector"
        if [ ! -d "$DEVTOOLS_PATH" ]; then
            DEVTOOLS_PATH=$(find "chrome-$PLATFORM" -type d -name "inspector" 2>/dev/null | head -1)
        fi
        if [ -z "$DEVTOOLS_PATH" ] || [ ! -d "$DEVTOOLS_PATH" ]; then
            DEVTOOLS_PATH=$(find "chrome-$PLATFORM" -type d -name "devtools" 2>/dev/null | head -1)
        fi
    fi

    if [ -n "$DEVTOOLS_PATH" ] && [ -d "$DEVTOOLS_PATH" ]; then
        echo "Found DevTools at: $DEVTOOLS_PATH"
        cp -r "$DEVTOOLS_PATH"/* "$ASSETS_DIR/"
        return 0
    fi

    echo "DevTools directory not found in Chrome bundle"
    echo "Searching for DevTools files..."

    # DevTools might be inside a .pak file in newer Chrome versions
    # Try finding any devtools-related files
    find "chrome-$PLATFORM" -name "*.html" -path "*devtools*" -o -name "*.html" -path "*inspector*" 2>/dev/null | head -5

    return 1
}

# ──────────────────────────────────────────────
# Method 2: Build from source
# ──────────────────────────────────────────────
build_from_source() {
    echo "[Method 2] Building DevTools frontend from source..."

    if ! command -v npm &>/dev/null; then
        echo "npm not found, skipping source build"
        return 1
    fi

    cd "$TEMP_DIR"
    echo "Cloning devtools-frontend (shallow)..."
    git clone --depth 1 https://chromium.googlesource.com/devtools/devtools-frontend.git 2>&1 || {
        echo "Git clone from chromium.googlesource.com failed"
        return 1
    }

    cd devtools-frontend

    echo "Installing dependencies..."
    npm install 2>&1 || {
        echo "npm install failed"
        return 1
    }

    echo "Building frontend..."
    # Modern devtools-frontend uses ninja via build scripts
    if [ -f "scripts/build/build_release_applications.py" ]; then
        python3 scripts/build/build_release_applications.py --input_path front_end --output_path "$TEMP_DIR/built" 2>&1 || true
    fi

    # Try the standard GN build
    if command -v gn &>/dev/null && command -v ninja &>/dev/null; then
        gn gen out/Default --args='is_debug=false' 2>&1 || true
        ninja -C out/Default 2>&1 || true
        if [ -d "out/Default/gen/front_end" ]; then
            cp -r out/Default/gen/front_end/* "$ASSETS_DIR/"
            return 0
        fi
    fi

    # Fallback: use the TypeScript-compiled source directly
    # Modern DevTools frontend can be served from front_end/ after tsc compilation
    if [ -f "tsconfig.json" ]; then
        echo "Compiling TypeScript..."
        npx tsc --noEmit false --outDir "$TEMP_DIR/compiled" 2>/dev/null || true
    fi

    # Last resort: copy front_end sources (JS/HTML/CSS files that are usable)
    if [ -d "front_end" ]; then
        echo "Copying frontend source files..."
        # Copy all servable files
        find front_end -type f \( \
            -name "*.js" -o -name "*.html" -o -name "*.css" -o \
            -name "*.json" -o -name "*.svg" -o -name "*.png" -o \
            -name "*.gif" -o -name "*.wasm" -o -name "*.map" \
        \) | while read -r file; do
            # Preserve directory structure relative to front_end/
            local rel="${file#front_end/}"
            local dir=$(dirname "$rel")
            mkdir -p "$ASSETS_DIR/$dir"
            cp "$file" "$ASSETS_DIR/$rel"
        done
        return 0
    fi

    return 1
}

# ──────────────────────────────────────────────
# Method 3: Download pre-built from CDN/hosted source
# ──────────────────────────────────────────────
download_hosted() {
    echo "[Method 3] Downloading hosted DevTools frontend..."

    # The DevTools frontend is hosted on appspot for remote debugging
    # We can fetch the file listing and download what we need
    local CHROME_VERSION="130.0.6723.58"

    # Try fetching from the Chrome DevTools hosted URL
    # This is the same frontend Chrome uses for chrome://inspect
    cd "$TEMP_DIR"
    mkdir -p hosted

    # Download the main entry points and core modules
    local BASE="https://chrome-devtools-frontend.appspot.com/serve/file/@${CHROME_VERSION}"
    local FILES=(
        "devtools_app.html"
        "inspector.html"
        "js_app.html"
        "worker_app.html"
        "devtools_app.js"
        "inspector.js"
        "root.js"
        "RuntimeInstantiator.js"
    )

    local success=0
    for f in "${FILES[@]}"; do
        if curl -sL -o "hosted/$f" "$BASE/$f" 2>/dev/null; then
            # Check if we got actual content (not error page)
            if [ -s "hosted/$f" ] && ! grep -q "Error" "hosted/$f" 2>/dev/null; then
                success=1
            fi
        fi
    done

    if [ "$success" -eq 1 ]; then
        cp -r hosted/* "$ASSETS_DIR/"
        return 0
    fi

    return 1
}

# ──────────────────────────────────────────────
# Try each method in order
# ──────────────────────────────────────────────
echo "Attempting to fetch DevTools frontend..."
echo ""

if extract_from_chrome; then
    echo ""
    echo "SUCCESS: Extracted DevTools from Chrome for Testing"
elif build_from_source; then
    echo ""
    echo "SUCCESS: Built DevTools from source"
elif download_hosted; then
    echo ""
    echo "SUCCESS: Downloaded hosted DevTools"
else
    echo ""
    echo "========================================="
    echo "  MANUAL SETUP REQUIRED"
    echo "========================================="
    echo ""
    echo "All automatic methods failed. To get the DevTools frontend manually:"
    echo ""
    echo "Option A: Extract from Chrome"
    echo "  1. Download Chrome for your platform"
    echo "  2. Find the 'inspector' or 'devtools' resource directory"
    echo "  3. Copy contents to: $ASSETS_DIR/"
    echo ""
    echo "Option B: Build from source"
    echo "  1. git clone https://chromium.googlesource.com/devtools/devtools-frontend.git"
    echo "  2. Follow build instructions in the repo's README"
    echo "  3. Copy built frontend to: $ASSETS_DIR/"
    echo ""
    echo "Option C: Use hosted version (requires modifying DevToolsServer.kt)"
    echo "  Point the devtools WebView at:"
    echo "  https://chrome-devtools-frontend.appspot.com/serve/file/@VERSION/devtools_app.html"
    echo ""
    exit 1
fi

# ──────────────────────────────────────────────
# Verify and report
# ──────────────────────────────────────────────
echo ""
echo "=== DevTools frontend installed ==="
echo "Location: $ASSETS_DIR"

FILE_COUNT=$(find "$ASSETS_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
DIR_SIZE=$(du -sh "$ASSETS_DIR" 2>/dev/null | cut -f1)

echo "Files: $FILE_COUNT"
echo "Size: $DIR_SIZE"

# Check for key files
echo ""
echo "Key files:"
for f in devtools_app.html inspector.html root.js; do
    if [ -f "$ASSETS_DIR/$f" ]; then
        echo "  ✓ $f"
    else
        echo "  ✗ $f (missing)"
    fi
done

echo ""
echo "Ready to build: ./gradlew assembleDebug"
