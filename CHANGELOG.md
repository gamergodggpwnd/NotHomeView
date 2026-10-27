# Changelog

## 1.32.0 – unreleased (staged)

### New features
* Weather popup: animated sky header (sunny, partly cloudy, cloudy, rain, snow; night sky after sunset; lightning / fog details). Opt-in: `weather_sky_header: true`.
* Assistant popup (voice through the device microphone or typed) for any Assist pipeline; pipeline picker, mic button, Day / Night look. Opt-in: `assistant_enabled: true`.
* Browser timers: spoken or typed timer requests open a full-screen countdown with pause / cancel / +1 min and an alert; no voice satellite needed.
* New app type for the Home Screen: *Assistant (voice / typed)*.
* Assistant: suggestion chips under "How can I help?"; replies stream in as the agent writes them; timer screen closes with a swipe down (the timer keeps running) and its orange line shows the minutes left.

* Assistant screen (round 2): fills the whole display (edge to edge, inside the safe areas), swipe down from the top (or with the chat scrolled to the top) to close.
  Siri-like glowing edge that follows the state (soft when idle, brighter and moving while listening, fast while thinking, pulsing while speaking; still with reduced motion).
* Assistant chat: the whole conversation stays on screen (your words, replies, cards) and scrolls; it follows new messages unless you scrolled back ("Newest" button). Follow-up questions keep the same conversation; closing the screen clears it.
* Live voice line: shows that it hears you (level bars, "Hearing you…") and writes your words in as soon as speech-to-text returns them (Home Assistant's pipelines don't send partial words).
* Answer cards: weather questions show a weather card (now, high / low, next hours) and calendar questions a list of upcoming events, read from this Home Assistant (no actions).
* Timer: the countdown opens over the chat (the chat stays); the tick ring stays clear of the notch / status bar.
* Album links as a photo source: the Photos tile, viewer, gallery, backdrop and the screensaver can show a shared Google Photos, iCloud or OneDrive album (`photo_source_mode: album`, `photo_album_url`). Provider auto-detected and checked in the editor; list cached 6 h, shuffled, falls back to the media folder with a clear message on errors. New optional helper integration `custom_components/nothomeview_albums` (needed for Google Photos, iCloud and the screensaver; OneDrive works in the browser). See docs/album-links.md.
* Photo gallery: **Add photos** now opens a small frosted menu first: *Upload photos* (the device's file picker, as before) or *Add album link* (Google Photos / iCloud / OneDrive). The link sheet detects the provider and checks the link (✓ name and photo count, or ⚠ with the reason, including "needs the NotHomeView Album Links helper"); *Save* sets this Home Screen card's photo source to the album and saves it to the dashboard like the visual editor does. With an album already set the menu shows it with *Change album link* and *Use media folder instead*. Admins only (others see the menu greyed out with a note); tap/keyboard friendly, no hover.
* Home Screen: tapping the body of a Now Playing tile (artwork / title) now opens the Music sheet, like the Music app does; its buttons, seek bar and volume / output popovers keep their own taps. (Before, a tap on the tile body did nothing.)
* Edit pencil in popups: for admins, a pencil sits next to the ✕ of the NotHomeView popups (Photos viewer and gallery, full-screen photo, Weather, Music, device pages shown as sheets, Assistant, timer, camera and people large views, Rooms popup). It closes the popup and opens the visual editor of the card the popup belongs to (a Page Grid tile opens straight on that tile); a device page opens in edit mode. Hidden for non-admins and YAML-mode dashboards; Home Screen card option `popup_edit: false` turns it off.
* Home Screen: in landscape, 5 to 8 apps sit in 2 rows (3 or 4 columns) when there is room, so they line up with the tiles beside them.

### Bug fixes (staged builds)
* Assistant: pipelines without text-to-speech now answer (silently) instead of failing with "the pipeline does not support text-to-speech".
* Assistant: pipelines without speech-to-text no longer show a raw error when the popup opens; the mic is dimmed and explains on a tap.
* Assistant: a conversation agent that fails (for example an expired API key) shows a clear note on what to check instead of only a generic apology.
* Assistant: a speech-to-text service that fails names the pipeline and says what to check instead of a bare "speech-to-text failed".
* Assistant: when an AI service returns its raw error payload (for example Google's JSON quota error), only its first sentence is shown, with a note that the service hit its usage limit (or what to check) instead of a wall of JSON.
* Gallery: thumbnails of photos from another site no longer throw an error in the console (canvas export is skipped).
* Includes everything from 1.31.1 (setup popup fix + notification, full-height popups now on by default, tap-to-edit tiles) and 1.31.2 (setup notification for existing users, notification link fix).

## 1.31.2 – 2026-10-26

### New features
* Existing users get the setup notification too: an administrator who already has a dashboard with the NotHomeView Home
  Screen card (and never pressed Add or No) gets the bell notification once, offering to build a fresh NotHomeView dashboard
  from their devices as a new, extra dashboard (current dashboards are not changed). Its link (`?nothomeview_setup=1`) opens
  the setup dialog. The dialog itself still pops up by itself only on fresh installs (no NotHomeView dashboard yet).

### Bug fixes
* The notification's link now opens a dashboard that loads NotHomeView (the existing NotHomeView dashboard, or the dashboard
  that was open when the notification was made) instead of `/lovelace/0`, which on recent Home Assistant versions can land on
  the built-in Home overview, where the setup dialog could not open.
* If the dashboard list can't be read, the setup now stays quiet (no notification, no dialog) instead of treating it as an
  existing dashboard.

## 1.31.1 – 2026-10-26

### New features
* "NotHomeView is installed" notification (Home Assistant's notification bell, id `nothomeview_setup`) for administrators when
  no NotHomeView dashboard exists and nobody said No: links to the setup dialog; dismissed automatically after Add or No.
* `?nothomeview_setup=1` on any Home Assistant address opens the setup dialog for an administrator.

### Bug fixes
* The first-run setup dialog now starts as soon as Home Assistant is connected, on any page that loads the dashboard
  resources (it no longer waits for a dashboard view).
* Setup suppression is less eager: only a kiosk mode that is active right now (kiosk-mode / Wallpanel actually hiding the
  header, `?kiosk`, Fully Kiosk) hides it, not a hidden sidebar or kiosk-mode / Wallpanel merely being installed; a dashboard
  only counts as existing if the setup created it or it uses the Home Screen card; "already exists" is no longer remembered.
* Full-height popups: on dashboards with a Home Screen card, every popup (Home Screen sheets, room picker, calendar event,
  browser_mod popups, more-info dialogs) reaches the top of the screen, keeps its content below the safe area and closes with a
  swipe down from the top. Home Screen card `full_height_popups: false` brings back the floating popups.
* Device pages are editable tile by tile in the visual editor: in edit mode tapping a tile of a Page Grid opens the editor
  on that tile's own settings (entity, name, icon, tap action, size). The Page Grid editor shows the tiles as a grid of
  buttons (Move, Duplicate, Remove, Add tile, New page) with the page layout options folded underneath.

## 1.31.0 – 2026-10-26

### New features
* First-run setup: an administrator opening a dashboard is asked once whether to add a ready-made "NotHomeView" dashboard.
  **Add** creates it (storage dashboard `nothome-view`, or the next free address), laid out like the example dashboard: a Home
  Screen (greeting, 4 apps, Photos, Now Playing, House tile, Calendar with weather, default wallpaper) plus Home, Lights,
  Climate, Security, Media, Garage / covers, Calendar and Rooms pages with the chips row and Night / Day / Auto glass tiles,
  built from the entities, devices and areas of that Home Assistant (hidden, disabled, unavailable and config / diagnostic
  entities skipped; empty pages left out), then offers to open it. **No** is remembered per browser and per user. Never shown
  to non-admins, on kiosk / wall-panel screens, or when a NotHomeView dashboard already exists.
* "Create NotHomeView dashboard" button in the Home Screen card editor; `NotHomeView.setup()`, `NotHomeView.dryRun()` and
  `NotHomeView.resetSetup()` in the browser console.
* New NotHomeView House card (`custom:homeview-house-card`): drawn house with weather / garage / lights-on / climate / lock labels.
* Home Screen card `wallpaper` and `full_width`; Page Grid card `full_width`; chips `count_entities`.

## 1.30.7 – 2026-10-25

From this release the GitHub version follows the card bundle's version (`HOMEVIEW-CARDS 1.30.7` in the browser console).
The previous public release (v1.0.1) shipped bundle build 1.12.0.

### New features
* Device pages theme: **Night** (dark glass, default), **Day** (white) or **Auto** (follow the sun). Choose it from the pencil
  (Edit Button) menu or the Home Screen card's editor; a Page Grid can override it for its own page.
* NotHomeView Home Screen (Hub card): greeting, app icons, Photos widget, Now Playing, calendar and weather over a blurred photo
  background that stays frozen while the Home Screen is showing.
* The screensaver is paused while the Home Screen is showing and starts again only when it is enabled and the Home Screen is closed.
* Photo viewer with Previous / Next (and swipe), View Gallery popup with Add photos (upload into the screensaver folder).
* Garage chooser popup: open door 1, door 2 or both with live state (Garage card *chooser* option, Garage Chooser card).
* Hint when the dashboard asks for the screensaver but Wallpanel is missing.
* New cards: Hub (Home Screen), Chips (with Rooms picker), Page Grid, Page Break, TV, TV Player, Calendar, Garage Chooser.
* New example dashboard (`examples/homeview-example-sections.yaml`): the full NotHomeView layout with generic placeholder entities.

### Bug fixes / performance
* The Rooms popup opens in front of a device page shown as a sheet; Escape closes only the top popup.
* Smoother 25 s photo rotation: the next photo is downloaded and decoded before it is shown.
* Faster gallery opening and Previous / Next (download queue, decoded-image cache, thumbnails).
* The default background blur scales with the transparency slider.
* Swiping the Home Screen away no longer starts a screensaver that is turned off.
* The Day theme also applies to device pages opened as sheets from the Home Screen.

## 1.0.1 – 2026-10-21

HACS validation workflow and repository metadata; no card changes.

## 1.0.0 – 2026-10-20

First public release of **NotHomeView** (card bundle `homeview-cards.js`, internal build 1.12.0).

* 14 cards, all with visual editors and in the card picker as "NotHomeView …":
  Thermostat, Entity, Light, Garage, Group, Scene, Music, Navigation, Now Playing, Camera, Battery, People,
  Screensaver Settings, Edit Button.
* Size dropdown on every grid card (2 × 3, 2 × 6, 4 × 6, Custom; Camera adds 4 × 3 Tall; People 2 × 3 / 4 × 6),
  content scales with the size (compact thermostat, compact Now Playing).
* Battery card: glass bar with big %, green / yellow / red, charging bolt (auto‑detected or chosen).
* People card: Find My style avatar tile, zone or street + city, optional badge, map popup.
* Camera card: live or snapshot, glass state buttons, full‑screen / window popup with swipe to close.
* Now Playing card / Music popup with speaker picker and volume.
* Edit button: glass pencil fixed in a corner, plus a screensaver button that opens a Wallpanel settings popup
  (enable, idle time, photo source, interval, fade, clock 12 / 24 h and show / hide, screen options); Save writes only the
  changed `wallpanel:` keys.
* Horizontal pages use native CSS scroll‑snap (no snap‑back on iOS) and remember the current page.
* Step-by-step README with walkthrough pictures (taken from a demo dashboard with made-up entities).
* Themes **HomeView Glass** and **HomeView Light**, the `homeview_styles` helper template and two example dashboards
  (layout‑card band and native sections).
