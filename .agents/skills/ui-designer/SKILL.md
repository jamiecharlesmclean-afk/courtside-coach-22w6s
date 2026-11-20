---
name: ui-designer
description: Improve UI/UX polish and loading states in Vibes. Use when refining visual hierarchy, matching the app's iOS-style visual language, or replacing spinners with stable skeleton-based loading states.
---

# UI Designer Skill

Use this skill when making UI/UX improvements, visual polish changes, or loading-state updates.

## Goals

- Prefer polished, stable interfaces over flashy motion.
- Match the app's existing visual language: rounded surfaces, muted borders, soft contrast, iOS-style easing.
- When a screen or section loads, prefer **skeletons over spinners** whenever the layout is knowable.

## Skeleton Rules

1. **Use skeletons for predictable layout**
   - lists
   - cards
   - tables
   - message threads
   - session/run lists
   - detail pages
   - media blocks
   - form rows

2. **Use tiny inline loading dots instead of spinners** for:
   - button pending states
   - compact status rows
   - small badges / indicators
   - toasts

3. **Skeletons should match the final structure**
   - preserve spacing
   - preserve hierarchy
   - preserve approximate widths
   - preserve alignment and rhythm

4. **Do not over-animate**
   - prefer subtle pulse over aggressive shimmer unless requested
   - loading states should feel calm and native

5. **Keep chrome stable**
   - headers/navbars should remain mounted when possible
   - animate content, not layout scaffolding

## App-Specific Guidance

In omg, when adding or updating loading states:

- Home/app lists should use card skeletons.
- Project session/run lists should use session-list skeletons.
- Run detail should use message-view skeletons and tool-event skeletons.
- Chat/message views should use bubble-shaped skeletons that mimic user/agent alignment.
- Avoid bringing back large centered spinners for page loading unless the layout is genuinely unknown.

## Motion Guidance

- Use the shared iOS-style easing already present in the app.
- Keep motion subtle and secondary to readability.
- Prefer static shell + animated content.

## Definition of Done

A UI change is not complete until:

- loading states are visually intentional
- skeletons match the final layout
- there are no unnecessary spinners
- the interface feels stable during data fetches and transitions
