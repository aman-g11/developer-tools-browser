---
name: No rounded corners on app icons
description: App store icons must be square — stores apply their own masking/rounding
type: feedback
---

Never add rounded corners (border-radius / rx/ry) to app icons.

**Why:** App stores (Google Play, Apple App Store) require square icon assets and apply their own corner rounding and adaptive icon masking. Adding rounded corners to the source asset causes double-rounding or clipping issues.

**How to apply:** When creating app icons (SVG, PNG, etc.), always use a square background with no corner radius.
