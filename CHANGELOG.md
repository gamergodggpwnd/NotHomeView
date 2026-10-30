# Changelog

## 1.32.0 – unreleased (staged)

### New features
* **Camera tiles: label, last-event chips and a Talk button.** `badge` puts a small label next to the camera name (e.g. *Nest*, *Ring*); `events` lists event entities (doorbell press, motion …) shown as glass chips with the time of their last event ("8:42 PM", "Yesterday 8:42 PM", "none yet"). The large view gets a row of glass controls: **History** (Home Assistant's history of the camera and its events, last 24 h), a prominent **Talk** button that opens the camera maker's app (`talk_app`: Google Home `googlehome://`, Ring `ring://`, or any URL with `talk_url`; Home Assistant has no two-way talk for Nest or Ring), and **Sound** (only when the live stream actually carries audio). All in the visual editor.
* Camera tiles: the label and the Talk app now come from the camera's integration by default (Nest → *Nest* / Google Home, Ring → *Ring* / Ring), so a duplicated tile with another camera is labelled right; `badge` / `talk_app` still override (`badge: none`, `talk_app: none`).
* **Nest cameras no longer stream on tiles** (Google's API limits live streams per user: "RESOURCE_EXHAUSTED (429)"): Nest tiles show a frosted poster with "Tap for live view", and only the opened large view starts one live stream, stopped when it closes. `live_tile: on / off` overrides (other cameras stream on tiles as before). A failed stream is stopped (no retry loop) and shows a short message ("Google is limiting live view. Try again in a minute.") with a **Retry** button; failing snapshot images are retried less and less often (up to every 5 min) and Nest cameras (no still images) aren't polled at all. Streams also stop when a tile or popup leaves the page.
* **Camera tile previews** for cameras that don't stream on tiles (Nest): the tile shows the newest of the last event image (Nest doorbell / motion clip preview, refreshed only when an event entity changes, no polling) and the last frame seen in the live view (one small JPEG taken once the stream plays, kept in this browser and, for admins, saved to Home Assistant's local media folder `nothomeview_camera_previews/` — one file per camera, overwritten — so every device shows it). A chip says where it is from ("Viewed · 8:15 PM", "Motion · 9:03 PM", "Doorbell · …") with "▶ Tap for live"; no extra streams are opened. Turn off with `show_preview: false` (visual editor).
* **Named pages** (Page Grid): a Page Break can have a `name`; then the page dots become frosted tabs (first page: `first_page_name`, else "Page 1"). `?hv_page=<name or number>` in the URL opens that page (e.g. a Home Screen tile linking to Security › Cameras); Navigation tiles keep the current query (kiosk …) also when their path has its own.
* **Arrange mode** for room / device pages (Page Grid), no need for the dashboard's edit mode: long-press anywhere on the page (0.6 s, admins only). Tiles wiggle; tap a tile for its ⋯ menu (Edit / Move earlier / later / Duplicate / Delete), hold a tile (¼ s) and drag it to move it (hold at the left/right edge to change page), slide sideways on the tiles to swipe between the page's screens (the tiles on the next screen get their controls too). **Done** saves to the dashboard in one quiet save (no page rebuild), **Cancel** puts everything back. Edit saves pending moves first and opens that tile's editor. Turn off per grid with `arrange: false`.
* Album links: every current share-link format is recognised (iCloud `photos.icloud.com/shared/album/…` of iOS 26+, read directly by the browser, no helper needed for the Photos tile; Google `photos.app.goo.gl`, `photos.google.com/(u/N/)share`, goo.gl; OneDrive `1drv.ms`, `onedrive.live.com`, SharePoint), without `https://` or with tracking parameters; the message says which provider was recognised and what is wrong (private Google album, iCloud Link, helper needed).
* Dashboard edit mode: the edit button / popup pencil switch the page into edit mode without reloading the app (also with kiosk-mode); Page Grid tiles keep their normal size and row count in edit mode; moving, duplicating or deleting a tile updates the page at once; the changes are kept until **Done** (or leaving the page) and then saved in one go without Home Assistant rebuilding the page (no blank flash, no tiles re-appearing), one status message instead of a stack. Entering / leaving edit mode keeps the tiles where they are (an empty "Add title / Add badge" header is shown compact). Arrange mode's Done saves the same quiet way.
* Room / device page editing (Page Grid): in the dashboard's edit mode every tile gets the same controls as Arrange mode: tap = its ⋯ menu (like Home Assistant's card menu: **Edit**, **Move earlier / later**, **Duplicate**, **Delete**, asks first), hold and drag = move (a marker shows where it lands, holding at the left / right edge flips the page), sideways slide = next / previous screen of the page. No separate grab-handle button any more. Large touch targets for iPad / iPhone (HA Companion app). Admins, storage-mode dashboards only; changes are saved when you tap Done.
* **Resize by dragging a corner** (Page Grid, Arrange mode and edit mode): drag a tile's corner handle; it snaps only to the four tile sizes, 2 × 3 (one tile), 2 × 6 (two wide), 4 × 6 (two wide and tall) and 4 × 3 (tall), and only to the ones that card offers. Faint outlines show the sizes it can take, a label shows the current one, the other tiles glide to their new places, the tile itself is not reloaded. Saved to the same settings as the Size option in the card editor (`grid_options`, plus `size` for the camera), so it stays editable there. **4 × 3 Tall** is now a Size option for every NotHomeView tile (it was camera only).
* **Home Screen arrange** (Home hub, admins): long-press the Home Screen. Tap an app, the Photos tile or an extra tile for its ⋯ menu (Edit, Move earlier / later, size, Duplicate, Delete); hold and drag apps among apps and tiles among tiles; drag a tile's corner to switch it between one tile and two wide (the Home Screen row's two sizes). **Done** saves (no rebuild), **Cancel** undoes.
* The edit controls (⋯ buttons, menu, corner handles, Done / Cancel bar) use the dashboard's frosted-glass look (light and dark).
* Dashboard edit mode: Home Assistant's grey card overlay with the pencil in the middle no longer covers a Page Grid or the Home Screen (tiles stay bright with their own controls); the card's ⋮ menu (Edit / Duplicate / Copy / Cut / Delete) stays as a small glass button in the bottom-right corner. Other cards keep Home Assistant's normal overlay.
* Weather popup: animated sky header (sunny, partly cloudy, cloudy, rain, snow; night sky after sunset; lightning / fog details). Opt-in: `weather_sky_header: true`.
* **Assistant orb.** The mic button (and the Assistant app) now shows only a round, animated rainbow orb near the top of the screen with "Listening…" (listening follows your voice, thinking spins fast, speaking pulses); the dashboard stays clear: no blur, no dimming. Tap the orb (or its caption) for the chat; tap anywhere else to close; it closes by itself a few seconds after the reply. `assistant_orb: false` opens the full chat as before.
* **Quiet mode** per device (Off / On / Auto, the Quiet button in the chat header): the reply is not spoken, the request and the answer appear as a glass caption under the orb. Auto: quiet when the device's volume sensor (`assistant_quiet_volume_entity`) is under `assistant_quiet_volume_below` % (default 5); without a reporting sensor, during the quiet hours (`assistant_quiet_start` / `assistant_quiet_end`, default 23:30–10:00); and while a Focus / Do Not Disturb sensor (`assistant_quiet_focus_entity`) is on. All in the visual editor (Assistant & timer › Quiet mode: Auto).
* Assistant chat: the glowing screen edge is gone (plain dark or light background).
* Assistant: spoken replies now play on iPhone / iPad (Safari and the Companion app). The reply audio used to start seconds after the tap and was refused by iOS; one audio element is now unlocked in the tap and reused (Web Audio fallback). If sound still can't play, the reply shows as text with the reason.
* **Keeps listening until dismissed** (`assistant_continue`, default on): after every reply the mic opens again in the same conversation (orb in listening state; in quiet mode the caption stays). It ends when you tap outside, say a dismissal phrase ("thank you", "thanks", "goodbye", "that's all", "never mind", "stop", … `assistant_dismiss_phrases`; only when it is basically the whole sentence, "thanks, also turn off the lights" is still a request; nothing is sent, a short "Goodbye." and it closes), or say nothing for `assistant_silence_timeout` seconds (default 5). The open microphone is reused between turns when no reply is spoken.
* **Wake word “Hey Jarvis”** per device (assistant settings › *Wake word · this device*, default off; sensitivity Low / Medium / High = score 0.7 / 0.5 / 0.35): opens the assistant like a tap on the mic; on-device openWakeWord (ONNX Runtime Web, `dist/wakeword/`, loaded only when on); top pill while listening; paused while the assistant is open, 3 s after it closes and while the page is hidden; not on iPhone / iPad.
* **Pause to think** (`assistant_end_of_speech_pause`, default 2 s, 1–5, visual editor: *Pause before sending*): the card now decides when you have finished speaking. Pauses shorter than this (while you think what to say next) keep recording into the same request; the request is sent only after that much continuous quiet once you have started speaking (Home Assistant's own voice detection, which cut off after ~0.7 s, is turned off for the card's runs with `no_vad`). `assistant_silence_timeout` still means nothing said at all.
* **Chat history**: the chat now remembers earlier messages on this device (with a timestamp, max 200), shown when it opens. Retention per device in the assistant's settings button (Keep forever / 1 day / 1 week / 14 days / 30 days, plus **Clear history now**); the card default is `assistant_history_retention` (default `forever`).
* Assistant: the reply audio is loaded from the address the dashboard is open on (Home Assistant can hand out its internal address, unreachable away from home).
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
* **Card editor scrolls again on phones.** The Home Screen's pull-to-refresh block (and the pull-down screensaver / swipe-back / edge-sidebar gestures) listened on the whole page and also cancelled touches inside Home Assistant's card editor dialog while its list was at the top, so on iPhone a swipe that started with a tiny downward wobble didn't scroll the editor ("sometimes stuck"). These page-wide gestures now ignore every Home Assistant dialog and the card editor (and its preview), are released while the dashboard is in edit mode, decide the direction once per touch after a few px, and the arrange layer's touch block is only active during a tile drag (one listener instead of one per layer)
* After a long-press whose touch was cancelled (iOS image callout), the next tap is no longer swallowed (Home Screen / Page Grid arrange mode), and camera / Home Screen tiles no longer show iOS's "Save to Photos" callout on a long-press
* **The page selector hides again after editing.** Opening edit mode with the pencil switches kiosk-mode's header hiding off; it now comes back once edit mode is left (Done / Cancel) and no card editor is open, and the `?disable_km` / `edit=1` the pencil added is dropped from the address
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
