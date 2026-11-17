# Sign-in and access: proposed workflow

## Why it is needed

Today all data lives on one phone. Staff cannot share the roster, games or documents, and anyone who uses the phone sees everything. Before real player data is entered, the app needs accounts, a shared team record and role-based access.

## Constraints found in this project

- The app is Expo (native and web). `@omg-dev/sdk` is **not installed** here. The platform sign-in helpers (`useAuth().signIn()`, `useUser()`, `VibesLogin`) are part of that SDK, so they need to be added and checked against the Expo build before use.
- Sign-in is owned by the platform (make.omg.dev/access). The app must not build its own email code, password or passkey forms.
- Hosted data must sit behind sign-in. In the server schema, per-user collections use `.scoped("user")`. Without it, phones get 401 errors.

## Recommended workflow

### 1. Coach creates the team (first sign-in)
1. The coach opens the app and signs in through the platform.
2. The app asks: *Create a team* or *Join a team*.
3. Creating a team stores the team record with the coach as **Owner**.
4. If this device already has local data (roster, games, drills, documents), the app offers one import: *Move this device's data into the team?* It runs once, and the coach can skip it.

### 2. Invite staff and families
1. The coach opens **Settings → Team members** and chooses **Invite**.
2. Pick a role for the invitee (see roles below). The app creates a link or code that expires after 7 days.
3. The invitee opens the link, signs in on make.omg.dev/access, and lands on the team with that role.
4. A player-linked invite (parent or player) asks the coach to link the invitee to one roster player. Only that player's profile is shown.

### 3. Roles and what each can see

| Area | Owner / Coach | Assistant coach | Statistician | Parent / Player |
|---|---|---|---|---|
| Roster (contact and availability) | Edit | Edit | View | Own player and team list |
| Drill book, playbook, whiteboard | Edit | Edit | View | View |
| Practice plan | Edit | Edit | View | View |
| Games and live stats | Edit | View | Enter stats | View |
| Documents | Edit | View | View | View |
| Settings and members | Edit | No | No | No |

The app no longer holds medical information, so medical access rules do not apply. Roster contact details are open to all team members, including parents, and only coaches and owners may edit them. The coach's compliance contact should still review this before real records are entered.

### 4. Ongoing use
- Sessions persist. **Settings → Sign out** clears the session on the device.
- Owners can remove a member at any time. Their access stops on the next open.
- Every change records who made it and when, shown on the item.

## Data model (outline)

- `teams`: name, age group, season, competition, logo, owner.
- `team_members`: team, user, role, linked player (optional), status.
- Existing collections (roster, games, drills, documents, plans) gain a `team` reference.
- Permissions are enforced on the server. The app hides controls, but the server decides.

## Build order

1. Confirm with the platform that `@omg-dev/sdk` sign-in works in this Expo app. If it does not, use the platform's web sign-in in a browser window.
2. Add the team and membership collections in `schema.ts`, scoped as the platform requires.
3. Create-team and join flows, with the one-time device import.
4. Invites with expiry, and the role checks on every collection.
5. Roster contact details readable by all team members, editable by coach and owner (decided).
6. Test with two real accounts: coach and parent, on a phone.

## Decisions needed

1. Medical information: removed from the app at user request.
2. Do parents and players get accounts, or does the coach manage their view?
3. Is one coach per team enough, or do multiple owners need to be allowed?
