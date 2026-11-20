# CourtSide Coach — User Manual

Version: preview build (see BUILD_OUTLINE.md for status)
Audience: coaches, assistant coaches, statisticians, team staff

CourtSide Coach is a basketball team workspace for your phone or a browser. It holds your roster, drills, plays, practice plans, game stats, settings and team documents in one place.

---

## 1. Getting started

1. Open the app in your browser or Expo Go.
2. The **Home** screen opens. The heading shows your team name. Until you save one, it shows the temporary name *Sideline Kings*.
3. Go to **Settings** (gear icon, or *Open team settings* on Home) and enter your team details. Press **Save settings**. You will see "Settings saved on this device."

> **Important:** all data is stored on this device only. It is not shared with other staff yet. Use one device per team, or keep a backup of the information you enter.

---

## 2. Finding your way around

| Control | Where | What it does |
|---|---|---|
| Menu button (three lines) | Top right of every main screen | Opens the **module menu** with every module. |
| Bottom bar | Home, Board, Team, Stats, Plan, More | Quick access to the main screens. |
| *Back to home* link | Drill book, Documents, Settings | Returns to Home. |

The module menu lists: Home, Whiteboard, Playbook, Team roster, Live stats, Practice plan, Games, Drill book, Documents and Settings. Each entry has a short description under its name.

Buttons have text labels and are at least 44 px tall, so they are easy to tap. Chips and buttons announce whether they are selected or busy to screen readers.

---

## 3. Home (dashboard)

Home gives you a summary:

- **Team heading:** your team name, with age group, competition and season underneath.
- **Next game:** the next game on the Games schedule. Shows an empty message until one is added. Use **Game schedule** to add games.
- **Needs attention:** items such as an empty roster or an empty practice plan.
- **Next practice:** the next planned session.
- **Roster:** number of players and how many are available.
- **Drill book:** number of saved drills.
- **Whiteboard:** the last play you drew.
- **Playbook:** saved plays and systems.
- **Practice plan:** items in the current session.
- **Live stats:** the box score entry point.
- **Documents:** recent documents and team announcements.

The live box score card has been removed from Home. Use **Live stats** to log the game.

---

## 4. Whiteboard (Board)

Draw plays on a court drawn to FIBA dimensions (28 m × 15 m).

- Place players and move them to their destinations.
- Draw arrows for passes, cuts and screens.
- The court shows the key, free-throw circles, restricted areas, three-point arcs, baskets and centre circle.

Above the court, choose **Full court**, **Front court** (the attacking half) or **Back court** (the defending half). Players on the other half are hidden until you switch back to full court.

---

## 5. Playbook

Saved plays and team systems. Plays are searchable by name. The current playbook shows sample plays; you can replace them with your own.

---

## 6. Team roster (Team)

The roster shows every player and staff member as a card with jersey number, availability and an Update button.

### Availability
Each player is marked **Available**, **Limited** or **Out**. The summary at the top counts players who are unavailable.

### Updating a player
1. Press **Update** on the player's row.
2. The player editor opens with:
   - **Personal and contact:** name, jersey number, phone, address, date of birth.
   - **Availability:** choose Available, Limited or Out.
3. Press **Save**. The badge on the row updates.

> **Privacy note:** roster visibility is open to everyone who uses the app on this device, including contact details. Only share the device with people who should see this information. Medical information is not stored in the app.

### People, staff and archive
- The roster holds **players and staff members** in one list. Use the filter chips to show **Players**, **Inactive**, **Staff** or **Archived**.
- **Add player** and **Add staff member** open the same editor. Players have a jersey number, position, height, weight and dominant hand. Staff have a role.
- **Inactive** people stay on the roster but are left out of attendance and the planner. Use **Mark inactive** or the status chips in the editor.
- **Archive** keeps a former player's record without showing them in the active list. Use **Restore** to bring them back.
- **Delete record** in the editor removes the record from this device after a second tap. Archive is safer.

### Search, filter and sort
- **Search** matches name, jersey number, position, phone and staff role.
- **Filter by position** narrows the players list.
- **Sort** by jersey number or by name.

### Bulk edit
Press **Select people**, tick the people you want, then use **Mark active**, **Mark inactive**, **Archive**, **Restore** or **Set position for selected**. **Done selecting** ends selection mode.

### Staff roles and permissions
The Staff list shows what each role is responsible for. Sign-in accounts are not connected yet, so these roles do not restrict what anyone can see or change. See `docs/SIGN_IN_PROPOSAL.md`.

### Import and export (CSV)
Press **Import and export** to open the tools.
- **Use example** fills the box with a sample. **Choose CSV file** loads a file from the device.
- **Import players** adds rows. A row whose first and last name match an existing person updates that person. Rows without a first and last name are skipped, and the result is reported.
- **Export everyone as CSV** shows the full roster as text. **Copy CSV** copies it.
- **Stat-preparation templates** (Basic box score, Shooting, Defence) make a blank stat sheet for active players. Export it, then fill it in.

When the roster is empty, the screen says so and invites you to add players.

---

## 7. Live stats (Stats)

Log a game and see the box score.

- Use the game clock and quarter to track time.
- Record points, rebounds, assists and other stats per player.
- The scoreboard shows *Your team* and *Opponent*. Enter the opponent name and scores as the game goes.

*Note:* the Stats tab keeps the live stat counters. The Home dashboard no longer shows a live box score card.

---

## 7A. Games schedule (Games)

Keep the season schedule. Open **Games** from the module menu or from the Home *Next game* card.

1. Press **Add game**.
2. Enter the **Date** as YYYY-MM-DD (for example 2026-11-21). A message asks you to correct it if the date is not valid.
3. Enter the **Time** (for example 6:30 PM) and the **Opponent**.
4. Choose the **Venue**: Home or Away.
5. Optionally add the location and notes. Press **Save game**.

The list is sorted by date. Each game shows *Upcoming* or *Past*. Press **Edit game against…** to change a game, or **Delete game against…**, then **Confirm delete**.

The earliest game on or after today appears on Home under *Next game*.

## 8. Practice plan (Plan)

Build and time a practice session.

### Session agenda
- Add blocks with the text box and **ADD**, or tap the recommended free-throw block.
- Tap a block to mark it done.
- Remove a block with the × button.
- The total minutes update automatically.

### Coach's notes
Write what the team needs to hear today.

### Attendance
Shows players not marked Out, out of the roster total. A note flags anyone unavailable.

### Practice timer
**Start timer** and **Pause timer** track the session.

---

### Saved plans

- Build a session, type a name in **Plan name** (or leave the default), then press **Save this plan**. The agenda blocks and coach's notes are kept under that name on this device.
- Press **Load** on a saved plan to put its blocks and notes back into the planner. This replaces the current agenda, so save first if you want to keep it.
- Press **Delete**, then **Confirm delete**, to remove a saved plan.
- **Options** → **Clear agenda** empties the current agenda (press it twice to confirm). It does not delete saved plans.

## 9. Drill book

A library of drills shared with the team.

### Browsing
- **Search** by name.
- **Category** dropdown: filter by one of ten categories.
- **Favourites** filter: show only starred drills.

### Adding or editing a drill
1. Press **Add drill**.
2. Enter the title, category, difficulty and a description.
3. Press **Save drill**. The form is titled *Edit drill* when you change an existing drill.

### Managing drills
- Press the star to mark a favourite.
- Press **Add [drill name] to practice plan** on a drill to add it to the end of the practice plan. A drill already in the plan is not added twice; a message says so.
- Press **Edit** to change a drill.
- Press **Delete**, then confirm with a second tap. The second tap prevents accidental deletion.

When the drill book is empty, the screen says so. The full library of about 900 starter drills is not loaded yet.

---

### Import, export and delete
Press **Import, export and delete** at the top of the drill book.
- **Download CSV** saves every drill as a spreadsheet file. **Download PDF** saves a printable drill book with each drill's details.
- **Choose CSV file** loads a CSV file, or paste rows into **CSV text**, then press **Import drills**. A drill with the same name as one in the book is updated. Rows without a name are skipped. An unknown category or difficulty is set to the first choice.
- **Delete all drills** asks you to press **Confirm delete all drills**. Deleting removes drills from this device only. Download a copy first if you want to keep them.
- To delete one drill, press **Delete** on its card.

> Downloads work in the browser version. On a phone, the CSV text appears in the box so you can copy it, and PDF download is not available yet.

## 10. Documents

A library for forms, schedules, policies, handouts, team information and other files.

### Categories
Forms & consents, Schedules, Policies, Handouts, Team info, Other.

### Adding a document
1. Press **Add document**.
2. Enter a title and choose a category.
3. Optionally paste a link, or press **Attach file** to choose a file from this device (up to 5 MB).
4. Add notes if needed. Press **Save document**.

Links without a scheme are opened as `https://`. Press **Open** to view a linked document or an attached file. Use **Remove file** while editing to take an attached file off a document.

### Finding documents
Use **Search** or the category filter.

Attached files are stored on this device with the document. Files over 5 MB are refused; paste a link to a shared copy instead.

---

## 11. Settings

Team details used across the app:

- **Team name:** shown as the Home heading.
- **Age group**, **Season**, **Competition**.
- **Coaching staff:** one name per line.
- **Team logo:** press **Choose logo from photos** and pick a picture from your device (cropped square). You can also paste a web address (URL) in *Or logo web address*. A preview shows at the side. Press **Remove logo** to clear it.

Press **Save settings**. Settings are stored on this device.

*Note:* the logo is entered as a web address. Uploading an image from the phone is not available yet. Some image hosts block display in the app; if the logo does not show, try a different image address.

---

## 12. Troubleshooting

| Problem | What to do |
|---|---|
| Home still shows *Sideline Kings* | Enter a team name in Settings and press Save settings. |
| A saved change disappeared | Check you pressed Save. Data is stored on this device; a reset of browser storage removes it. |
| The logo does not appear | Use a different image web address. |
| A page is blank | Reload. If it persists, reopen the app from Home. |
| Links like `/training` show "not found" | Open screens from the menu or bottom bar instead of typing addresses. |

---

## 13. Privacy and data

- All data is stored on the device.
- Contact details are visible to anyone using the device.
- The app does not store medical information. Medical fields were removed at the user's request.

---

## 14. Known limitations

- No sign-in or roles yet; everyone on the device has full access.
- Data does not sync between staff devices.
- The drill library starts empty; the 900-drill starter set is not loaded.
- Playbook shows sample plays.
- Logos are added by web address only.
- Attached files are stored on this device only and are not shared with other staff yet.
- Games are stored on this device only.

## Backup and restore (Settings)
- **Download backup** saves one file with everything on this device: roster, drill book, playbook, practice plans, games, calendar, documents and settings. The file name shows the date as dd-mm-yyyy.
- **Choose backup file** opens a backup and shows what it holds. Nothing changes until you confirm.
- **Restore this backup** replaces all CourtSide data on this device. Press it, then press the confirm button. This cannot be undone, so download a backup first.
- Files from other apps, and files from a newer version of CourtSide, are refused.

## Player evaluation (side menu → Player evaluation)
- Choose a player from the active roster and the date of the evaluation (dd-mm-yyyy).
- Rate each skill from 1 to 5. Tap a selected number again to clear it. The overall score is the average of the rated skills, shown as a percentage. Unrated skills do not count as zero.
- Add notes, then Save evaluation. Saved evaluations are listed newest first, with Edit and two-tap Delete.
- Evaluations are saved on this device only, like the roster and calendar.
