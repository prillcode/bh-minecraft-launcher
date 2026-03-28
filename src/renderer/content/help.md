# BlockHaven Launcher Help

## Getting Started

BlockHaven Launcher is a custom Minecraft launcher built for the BlockHaven SMP community. It handles Microsoft authentication, instance management, mod installation, and shader packs — all in one place.

### First Launch

1. Sign in with your Microsoft account using the device-code flow shown on the login screen.
2. The launcher creates a **BlockHaven** instance automatically on first login — ready to connect to `play.bhsmp.com`.
3. Select the instance in the sidebar and click **▶ Play** to launch.

---

## Instances

Instances are isolated Minecraft environments — each has its own mods, settings, and save files.

### Creating an Instance

Click **+ New Instance** on the Instances tab. Choose a Minecraft version and a mod loader (Vanilla, Fabric, or Quilt). Memory defaults come from your global Settings.

### Editing an Instance

Click the edit button (pencil icon) on any instance card to change name, version, mod loader, memory limits, Java path, or server auto-connect settings.

### Deleting an Instance

Use the delete button on the edit modal. This removes the instance record but **does not delete game files** on disk.

---

## Mods

Mods require a mod loader (Fabric or Quilt). Vanilla instances cannot load mods.

### Browsing by Category

Use the category chips (Compatibility, Performance, HUD & Minimap, Gameplay & QoL) to see curated mod picks. Click **Search All** to return to free search.

### Searching Modrinth

Type in the search bar to find any mod on Modrinth. Results are filtered to your instance's game version and loader automatically.

### Installing a Mod

Click **Install** on a mod card, pick a version, and confirm. Required dependencies are detected and offered for install automatically.

### Enabling / Disabling Mods

Each installed mod has an **Enable / Disable** toggle. Disabling renames the `.jar` to `.jar.disabled` — Minecraft ignores it without deleting the file.

---

## Shaders

Shaders require **Iris Shaders** (a mod) and a Fabric or Quilt instance. Install Iris from the Mods tab before using shader packs.

### Popular Shaders

The Shaders tab shows a curated list of popular shader packs when no search is active.

### Installing from Modrinth

Search for a shader pack and click **Install**, then pick a version.

### Installing a Local File

Click **Install from file** to pick a `.zip` shader pack from your computer.

---

## Session Notes

Session Notes is a per-instance journal for recording waypoints, base coordinates, points of interest, and anything else worth remembering from your multiplayer sessions.

### Creating a Note

Select an instance, then click **+ New Note**. A new note opens in the editor immediately — give it a title and start writing.

### Auto-Save

Notes save automatically as you type. There is no Save button — changes are written within half a second of your last keystroke.

### Adding Screenshots

In-game screenshots (taken with **F2**) are stored in your instance's `screenshots/` folder. Click **Browse Screenshots** in the editor to open a picker showing all available screenshots. Select any you want to attach, then click **Add Selected**.

To remove a screenshot from a note, hover over its thumbnail and click the **×** button that appears.

### Deleting a Note

Click **Delete** in the note editor header. The note is removed immediately — this cannot be undone.

---

## Settings

### Memory

Set default minimum and maximum RAM for new instances. Existing instances use their own saved values.

### Java Path

Leave blank to use the bundled JRE (auto-provisioned per Minecraft version). Enter an absolute path to a `java` executable to override globally. A per-instance override in Edit Instance takes priority over this setting.

### Close Launcher on Launch

When enabled, the launcher window hides while the game is running and re-appears when the game exits.

### Resolution

Default window resolution applied to new instances. Does not affect existing instances.

---

## Troubleshooting

### Game fails to launch

- Check the **Java Path** in Settings — an incorrect path will prevent launch.
- Make sure the instance version has been downloaded (the launcher downloads automatically, but a failed download can leave files incomplete — try launching again).
- Look at the launcher logs in your data folder (Settings → Open Data Folder → `logs/`).

### Java not found

The launcher auto-provisions the correct JRE for each Minecraft version into your data folder. If this fails (e.g., offline), set a manual Java path in Settings > Java & Performance.

### Mod conflicts

Disable mods one at a time using the Enable/Disable toggle in the Installed Mods panel to isolate the conflicting mod. Check the Minecraft log in `{gameDirectory}/logs/latest.log`.

### Authentication expired

If the launcher shows a sign-in screen unexpectedly, your Microsoft session has expired. Sign in again — your instances and mods are not affected.
