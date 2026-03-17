#!/bin/bash

# Play Store Screenshot Automation Script
#
# Takes phone and tablet screenshots by launching emulators,
# installing the app, navigating to pages, and capturing screens.
#
# Usage:
#   ./scripts/take-screenshots.sh [phone|tablet|all]
#
# Prerequisites:
#   - Android SDK with emulator and adb
#   - AVDs: Pixel_7_Pro_API_35 (phone), Pixel_Tablet_API_35 (tablet)
#   - App built: ./gradlew assembleDebug

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ADB="$HOME/Library/Android/sdk/platform-tools/adb"
EMULATOR="$HOME/Library/Android/sdk/emulator/emulator"
APK="$PROJECT_DIR/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="com.unixshells.devbrowser"
ACTIVITY="$PACKAGE/.MainActivity"
STORE_DIR="$PROJECT_DIR/store-assets"

PHONE_AVD="Pixel_7_Pro_API_35"
TABLET_AVD="Pixel_Tablet_API_35"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${1:-all}"

# ── helpers ──────────────────────────────────────────────────────────

wait_for_boot() {
    local serial=$1
    echo -e "${YELLOW}Waiting for $serial to boot...${NC}"
    $ADB -s "$serial" wait-for-device
    while [ "$($ADB -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        sleep 2
    done
    # Extra settle time for launcher
    sleep 5
    echo -e "${GREEN}$serial booted${NC}"
}

take_screenshot() {
    local serial=$1
    local output=$2
    $ADB -s "$serial" exec-out screencap -p > "$output"
    echo -e "${GREEN}  Saved:${NC} $output"
}

tap_button() {
    local serial=$1
    local resource_id=$2
    # Extract bounds from uiautomator dump
    $ADB -s "$serial" shell uiautomator dump /sdcard/ui.xml 2>/dev/null
    local bounds
    bounds=$($ADB -s "$serial" shell cat /sdcard/ui.xml | grep -o "resource-id=\"$resource_id\"[^/]*bounds=\"\[[0-9,]*\]\[[0-9,]*\]\"" | grep -o 'bounds="[^"]*"' | head -1)

    if [ -z "$bounds" ]; then
        echo -e "${RED}  Button $resource_id not found${NC}"
        return 1
    fi

    # Parse bounds="[x1,y1][x2,y2]" and compute center
    local x1 y1 x2 y2
    x1=$(echo "$bounds" | grep -o '\[[0-9]*,' | head -1 | tr -d '[,')
    y1=$(echo "$bounds" | grep -o ',[0-9]*\]' | head -1 | tr -d ',]')
    x2=$(echo "$bounds" | grep -o '\[[0-9]*,' | tail -1 | tr -d '[,')
    y2=$(echo "$bounds" | grep -o ',[0-9]*\]' | tail -1 | tr -d ',]')
    local cx=$(( (x1 + x2) / 2 ))
    local cy=$(( (y1 + y2) / 2 ))

    $ADB -s "$serial" shell input tap "$cx" "$cy"
}

dismiss_keyboard() {
    local serial=$1
    $ADB -s "$serial" shell input keyevent KEYCODE_BACK
    sleep 0.5
}

# Navigate to a URL via the URL bar
navigate_to() {
    local serial=$1
    local url=$2
    echo -e "${YELLOW}  Navigating to $url${NC}"
    # Tap URL bar, clear it, type URL, press enter
    tap_button "$serial" "$PACKAGE:id/urlBar"
    sleep 0.5
    $ADB -s "$serial" shell input keyevent KEYCODE_CTRL_LEFT+KEYCODE_A
    sleep 0.2
    $ADB -s "$serial" shell input text "$url"
    sleep 0.3
    $ADB -s "$serial" shell input keyevent KEYCODE_ENTER
    sleep 1
    # Dismiss keyboard so it doesn't appear in screenshots
    dismiss_keyboard "$serial"
}

wait_page_load() {
    local seconds="${1:-6}"
    echo -e "${YELLOW}  Waiting ${seconds}s for page load...${NC}"
    sleep "$seconds"
}

# ── screenshot sequence ──────────────────────────────────────────────

capture_screenshots() {
    local serial=$1
    local out_dir=$2
    local label=$3

    echo ""
    echo -e "${GREEN}=== Capturing $label screenshots ===${NC}"

    mkdir -p "$out_dir"

    # Ensure app is installed
    echo -e "${YELLOW}Installing APK...${NC}"
    $ADB -s "$serial" install -r "$APK" 2>&1 | tail -1

    # Screenshot 1: Browsing unixshells.com
    echo -e "${YELLOW}[1/3] Browsing unixshells.com${NC}"
    $ADB -s "$serial" shell am force-stop "$PACKAGE"
    sleep 1
    $ADB -s "$serial" shell am start -a android.intent.action.VIEW \
        -d "https://unixshells.com" -n "$ACTIVITY" 2>/dev/null
    wait_page_load 10
    take_screenshot "$serial" "$out_dir/1_browse.png"

    # Screenshot 2: DevTools open (Elements tab, default)
    echo -e "${YELLOW}[2/3] Opening DevTools (Elements panel)${NC}"
    tap_button "$serial" "$PACKAGE:id/btnDevTools"
    wait_page_load 10
    take_screenshot "$serial" "$out_dir/2_devtools_elements.png"

    # Screenshot 3: Navigate to another page with DevTools open to show Network activity
    echo -e "${YELLOW}[3/3] Browsing with DevTools open${NC}"
    navigate_to "$serial" "https://unixshells.com/about"
    wait_page_load 10
    take_screenshot "$serial" "$out_dir/3_devtools_browse.png"

    echo ""
    echo -e "${GREEN}$label screenshots done:${NC}"
    ls -lh "$out_dir"/*.png
}

# ── main ─────────────────────────────────────────────────────────────

echo -e "${GREEN}=== Developer Tools Browser — Screenshot Automation ===${NC}"

# Check APK exists
if [ ! -f "$APK" ]; then
    echo -e "${YELLOW}Building debug APK...${NC}"
    cd "$PROJECT_DIR"
    ./gradlew assembleDebug
fi

# Get currently running emulators
running=$($ADB devices 2>/dev/null | grep "emulator-" | awk '{print $1}')

if [ "$MODE" = "phone" ] || [ "$MODE" = "all" ]; then
    PHONE_SERIAL=""
    for emu in $running; do
        avd=$($ADB -s "$emu" emu avd name 2>/dev/null | head -1 | tr -d '\r')
        if [ "$avd" = "$PHONE_AVD" ]; then
            PHONE_SERIAL="$emu"
            echo -e "${GREEN}Phone emulator already running: $PHONE_SERIAL${NC}"
        fi
    done

    if [ -z "$PHONE_SERIAL" ]; then
        echo -e "${YELLOW}Starting phone emulator ($PHONE_AVD)...${NC}"
        $EMULATOR -avd "$PHONE_AVD" -no-audio -no-boot-anim &>/dev/null &
        sleep 5
        PHONE_SERIAL=$($ADB devices 2>/dev/null | grep "emulator-" | awk '{print $1}' | tail -1)
        wait_for_boot "$PHONE_SERIAL"
    fi

    capture_screenshots "$PHONE_SERIAL" "$STORE_DIR/phoneScreenshots" "Phone"
fi

if [ "$MODE" = "tablet" ] || [ "$MODE" = "all" ]; then
    TABLET_SERIAL=""
    for emu in $running; do
        avd=$($ADB -s "$emu" emu avd name 2>/dev/null | head -1 | tr -d '\r')
        if [ "$avd" = "$TABLET_AVD" ]; then
            TABLET_SERIAL="$emu"
            echo -e "${GREEN}Tablet emulator already running: $TABLET_SERIAL${NC}"
        fi
    done

    if [ -z "$TABLET_SERIAL" ]; then
        # Kill phone emulator to free up port if running
        if [ -n "$PHONE_SERIAL" ]; then
            echo -e "${YELLOW}Stopping phone emulator...${NC}"
            $ADB -s "$PHONE_SERIAL" emu kill 2>/dev/null || true
            sleep 3
        fi
        echo -e "${YELLOW}Starting tablet emulator ($TABLET_AVD)...${NC}"
        $EMULATOR -avd "$TABLET_AVD" -no-audio -no-boot-anim &>/dev/null &
        sleep 5
        TABLET_SERIAL=$($ADB devices 2>/dev/null | grep "emulator-" | awk '{print $1}' | tail -1)
        wait_for_boot "$TABLET_SERIAL"
    fi

    capture_screenshots "$TABLET_SERIAL" "$STORE_DIR/tenInchScreenshots" "Tablet"
fi

echo ""
echo -e "${GREEN}=== All screenshots complete ===${NC}"
echo "Output: $STORE_DIR/"
