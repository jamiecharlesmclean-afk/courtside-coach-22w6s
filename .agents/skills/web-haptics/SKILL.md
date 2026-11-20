---
name: web-haptics
description: Add haptic feedback to interactive elements using the web-haptics library. Use when adding tactile feedback to buttons, toggles, forms, pickers, tabs, drag-drop, or other interactive UI in the Vibes app. Triggers on requests to "add haptics", "add vibration", "make it feel native", or "tactile feedback".
license: MIT
metadata:
  author: lochie
  version: "1.0"
---

# Web Haptics Integration

This project has `web-haptics` installed and provides a `useHaptics()` hook.

## Quick Start

```tsx
import { useHaptics } from "@/hooks/use-haptics";

function MyComponent() {
  const haptic = useHaptics();

  return <button onClick={() => haptic.trigger("medium")}>Tap me</button>;
}
```

## Package Info

- Repository: https://github.com/lochie/web-haptics
- License: MIT | Zero dependencies
- Uses the Web Vibration API. Silently no-ops on unsupported platforms (desktop).
- No error handling or feature detection needed.

## Trigger Types

`trigger()` accepts one of these strings (empty = "medium" impact):

**Notification (task outcomes):**
- `"success"` — form saved, payment confirmed, upload complete
- `"warning"` — destructive action ahead, approaching limit, irreversible step
- `"error"` — validation failure, network error, permission denied

**Impact (physical collisions):**
- `"light"` — small toggle, subtle tap, minor interaction
- `"medium"` — button press, card snap-to-position, drop into place
- `"heavy"` — major state change, heavy element landed, force press

**Selection (discrete stepping):**
- `"selection"` — picker scroll, stepper increment, slider detent, segment switch

Extra presets: `"soft"`, `"rigid"`, `"nudge"`, `"buzz"`.

## Interaction → Type Quick Reference

| Interaction | Type |
|---|---|
| Primary button tap | `"medium"` |
| Secondary button | `"light"` |
| Form success | `"success"` |
| Validation error | `"error"` |
| Network error | `"error"` |
| Toggle switch | `"light"` |
| Delete before confirm | `"warning"` |
| Picker/wheel | `"selection"` |
| Slider detents | `"selection"` |
| Tab switch | `"selection"` |
| Drag-drop snap | `"medium"` |
| Long press | `"heavy"` |
| Modal appear | `"medium"` |
| Pull-to-refresh threshold | `"light"` |
| Swipe dismiss threshold | `"light"` |
| Payment confirmed | `"success"` |

## Apple HIG Design Rules — FOLLOW THESE

1. **Haptics supplement, never replace.** Always pair with visual feedback. UI must work fully without haptics.
2. **Build causal relationships.** The haptic must feel like a direct physical consequence of the user action.
3. **Match intensity to significance.** Light interactions = light/selection. Standard = medium/success. Major = heavy/error/warning.
4. **Do not overuse.** If every tap vibrates, nothing feels special. Reserve for meaningful moments only.
5. **Synchronize perfectly.** Fire haptic at the exact instant the visual change occurs.
6. **Respect conventions.** success=positive, error=negative, warning=cautionary, selection=discrete ticks only.
7. **For async ops**, trigger when the RESULT arrives, synced with the visual state change:

```tsx
const haptic = useHaptics();

async function handleSubmit() {
  try {
    await submit();
    haptic.trigger("success");
  } catch {
    haptic.trigger("error");
  }
}
```

## Anti-Patterns — AVOID

- Haptic on every tap (fatigue)
- `"error"` for non-errors (breaks conventions)
- Haptic without visual feedback (some devices cannot vibrate)
- Haptic on page load or passive scroll (invasive)
- `"heavy"` for minor interactions (jarring)
- Long continuous vibrations (web haptics = brief transient pulses)

## Project-Specific Patterns

This project uses:
- **`@/hooks/use-haptics`** — always import from here, not directly from `web-haptics/react`
- **Base UI React** (`@base-ui/react`) for primitives (Button, Switch, etc.)
- **shadcn/ui** component library in `src/components/ui/`
- **`@/hooks/use-long-press`** — long press already exists, add `"heavy"` haptic to its callback
- **`@/hooks/use-mobile`** — can check `useIsMobile()` if you need conditional haptic logic

### Adding to shared components

Prefer adding haptics at the **call site** rather than inside shared UI components (Button, Switch, etc.) to avoid overuse. Only add to shared components when the haptic is universally appropriate for that interaction type.

### Before implementing, confirm with the user:
- Which interactive elements to target
- Whether to add at shared component level or individual call sites
