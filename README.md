# CourtSide Coach

CourtSide Coach is a mobile-first basketball coaching workspace for team preparation. It combines a tactical half-court whiteboard, searchable playbook and drill library, live box-score input, and a structured practice planner.

## Run locally

Install dependencies with `bun install`, then run `bun run preview` in an omg.dev Cloud Computer or `bun run web` for a local Expo Web session. Use `bun run typecheck` to validate routes and TypeScript.

## Architecture

- `src/app/index.tsx` contains the dashboard and the whiteboard, playbook, team roster, live stats, and planner workspaces.
- Team roster names, jersey numbers, contact telephone numbers, and addresses, along with game counters and the practice agenda, persist locally through AsyncStorage, which maps to local storage on web.
- The app uses Expo Router, Lucide icons, React Native SVG for the court diagram, and runs on web and native Expo.
- There is no account or shared team backend yet; team data remains on the device.

## Delivery

The omg.dev web deployment is a static Expo Web build. The in-session preview uses one Metro server for web and Expo Go; its link is temporary. An Android installable can be produced separately with the omg.dev Android build workflow.
