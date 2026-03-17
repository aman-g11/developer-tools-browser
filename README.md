# Developer Tools Browser by Unix Shells

A browser for Android with built-in Chrome DevTools. Built for developers who code on Android.

## What this is

An Android browser that gives you real Chrome DevTools — Elements, Console, Network, Sources, Performance, Lighthouse, and everything else — running entirely on your phone. No laptop required.

## Why

Android can run a terminal. It can run code editors and dev servers. But it can't do desktop browsing with developer tools. This is that missing piece.

## How it works

Two WebViews: one is your browser, the other runs the real Chrome DevTools frontend (built from Chromium source). A local TCP proxy bridges them via the Chrome DevTools Protocol. No root, no ADB, no external device needed.

## Build

```
# First time: build the DevTools frontend from Chromium source
./scripts/copy-devtools.sh

# Build the APK
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

Requires JDK 17 and the Android SDK.

## License

MIT. See [NOTICE](NOTICE) for third-party licenses (Chromium DevTools, NanoHTTPD, AndroidX).

## By

Unix Shells
