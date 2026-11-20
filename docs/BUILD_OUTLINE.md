# CourtSide Coach — Build Outline

This document maps the project specification to what is built, what is partial and what is pending. It is the reference for the next build steps. The user-facing guide is USER_MANUAL.md.

Status key: **Done** = working in the preview · **Partial** = present but incomplete · **Pending** = not started or waiting on a decision.

---

## 1. Platform and architecture

| Item | Status | Notes |
|---|---|---|
| Expo + expo-router app (web and native) | Done | Static web output (`output: "single"` in app.json). |
| Local storage (AsyncStorage / web storage) | Done | Keys: `courtside-coach:*`, `courtside:drills`, `courtside:documents`, `courtside:games`. |
| Shared backend and team sync | Pending | Needed before multi-staff use. |
| Sign-in and access roles | Pending | Spec roles: Coach, Parent/Player, Statistician. Needs a decision on the sign-in approach. |
| Bundle size under preview limit (1.9 MB) | Done | Per-icon Lucide imports. |
| Design system: "Sport style, Leaf color" | Done | Kept as requested. |
| Accessibility: labels, 44 px targets, state on chips/buttons | Done (ongoing) | Applied to new screens; review each new screen. |

---

## 2. Navigation and dashboard

| Spec item | Status | Notes |
|---|---|---|
| Dashboard home screen | Done | Heading shows team name (placeholder *Sideline Kings* until saved). |
| No hard-coded team sample data on Home | Done | Empty states say so. |
| Remove live box score card from dashboard | Done | Live stats tab kept. |
| Module menu on every main screen | Done | Menu button on Home, Games, Drill book, Documents, Settings and roster. |
| Bottom bar (Home, Board, Team, Stats, Plan, More) | Done | |
| Deep links (`/training`) | Partial | Open from in-app links; direct URLs show "not found" in preview. |

---

## 3. Module 1 — Roster

| Item | Status | Notes |
|---|---|---|
| Player list with jersey, availability badge | Done | Badges: Available, Limited, Out. |
| Update button per player (opens editor) | Done | Editor covers personal, contact and availability. |
| Medical information | Removed | Medical fields, CSV column and stored `courtside:medical-records` cleared at user request. |
| Standalone Medical screen | Removed | Earlier request. |
| Unavailable count in summary | Done | |
| Availability on Home | Done | Unavailable players listed under "Needs attention"; roster tile shows unavailable count. |
| Availability in practice planner | Done | Planner attendance counts players not marked Out. |
| Parent/Player view and carpool | Pending | Spec item. Depends on access roles. |
| Medical data access | Not applicable | Medical information no longer in the app. |

---

## 4. Module 2 — Drill library ("Drill book")

| Item | Status | Notes |
|---|---|---|
| Add, edit, delete drills with confirm | Done | Second-tap delete. |
| Favourites | Done | |
| Search and category filter | Done | Category as dropdown (ten categories). |
| Difficulty | Done | Chips. |
| Starter library of ~900 drills | Pending | Decision needed: generate content or build an import path first. |
| Route name | Note | Route kept as `/training`; displayed name "Drill book". |

---

## 5. Module 3 — Playbook and whiteboard

| Item | Status | Notes |
|---|---|---|
| FIBA-scale court (28 m × 15 m) | Done | Keys, free-throw circles, restricted areas, arcs, baskets, centre circle. |
| Player tokens, destinations, arrows | Done | |
| Court views: Full, Front (attacking half), Back (defending half) | Done | Players outside the selected half are hidden. |
| Playbook with saved plays | Partial | Sample plays are kept as examples, by the user's decision. No editing flow yet. |

---

## 6. Module 4 — Practice planning

| Item | Status | Notes |
|---|---|---|
| Session agenda, add/remove/check blocks | Done | |
| Total minutes | Done | |
| Coach's notes | Done | |
| Practice timer | Done | |
| Session header from saved team and roster | Done | Replaces the earlier sample venue and time. |
| Attendance from roster availability | Done | |
| AI coach suggestions | Removed | Removed at user request. |

---

## 7. Module 5 — Games and statistics

| Item | Status | Notes |
|---|---|---|
| Games schedule (date, time, opponent, venue, location, notes) | Done | Add, edit, delete with confirm. Date validated as YYYY-MM-DD. Sorted by date. |
| Home "Next game" from schedule | Done | Earliest game on or after today; empty state when none. |
| Live stats entry and box score | Done | Stats tab. |
| Scoreboard labels ("Your team", "Opponent") | Done | Zeroed. |
| Reports and analytics | Pending | |
| Statistician role | Pending | Depends on access roles. |

---

## 8. Module 6 — Documents

| Item | Status | Notes |
|---|---|---|
| Document library (add, edit, delete, search, category) | Done | Categories: Forms & consents, Schedules, Policies, Handouts, Team info, Other. |
| Links opened from list | Done | Links normalised to https. |
| Attach a file from the device (up to 5 MB) | Done | expo-document-picker. Stored with the document on this device; opens from the list. |
| Recent documents and announcements on Home | Done | Empty states. |

---

## 9. Settings and team identity

| Item | Status | Notes |
|---|---|---|
| Team name, age group, season, competition | Done | Stored per device. |
| Coaching staff list | Done | One name per line. |
| Team logo by web address, preview, remove | Done | Logo may not display if the host blocks the image. |
| Logo from the photo library | Done | expo-image-picker, square crop. Web address still accepted. |
| Team name shown as Home heading | Done | |

---

## 10. Known issues

1. Browser test tool intermittently loses the page frame and mangles long typed text. Short entries and the validation path were confirmed; saving a full game record through the browser was not. Verify on device.
2. A 404 console message appears on the Home page; source not yet identified.
3. Lucide "not listed in exports" build warnings. Harmless; fix by a single import helper if they matter.
4. External image hosts can return 403 in the preview; logo display unverified on device.
5. Test team name "Test Wolves" and test games may remain saved on the test device; clear them in Settings and the Games screen.

---

## 11. Next steps (decisions needed first)

1. Decide the sign-in approach and access roles, then build a shared backend.
2. Decide on the 900-drill starter library (generate or import).
3. Sign-in and roles: see docs/SIGN_IN_PROPOSAL.md.
4. Build parent/player view and carpool, and statistician reports, once roles exist.
6. Verify all screens on a device, including saving games and the roster Update flow.

---

## 12. Change log (recent)

- Logo photo picker and document file attachments added.
- Sample playbook plays kept as examples.
- Games schedule module added; Home "Next game" reads it.
- Court views (Full, Front, Back) added to the whiteboard.
- Planner header and attendance now come from saved team and roster; sample text removed.
- Medical information removed from the app at user request.
- Dashboard live box score card removed.
- Module menu added to main screens.
- FIBA whiteboard court redrawn.
- Drill book rework (add form, dropdown category filter).
- Settings screen with team identity and logo URL.
- Document library added.
- Home heading shows team name.
- Build fixes: `expo` install, bundle size, static output mode.
