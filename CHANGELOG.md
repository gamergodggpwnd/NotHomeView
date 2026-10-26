# Changelog

## 1.31.0 – unreleased

### New features
* First-run setup: an administrator opening a dashboard is asked once whether to add a ready-made "NotHomeView" dashboard.
  **Add** creates it (storage dashboard `nothome-view`, or the next free address) with a Home Screen plus Home, Lights, Climate,
  Security, Media, Garage / covers, Locks, Calendar and Rooms pages, built from the entities, devices and areas of that
  Home Assistant (hidden, disabled, unavailable and config / diagnostic entities skipped; empty pages left out), then offers
  to open it. **No** is remembered per browser and per user. Never shown to non-admins, on kiosk / wall-panel screens, or when
  a NotHomeView dashboard already exists.
* "Create NotHomeView dashboard" button in the Home Screen card editor; `NotHomeView.setup()`, `NotHomeView.dryRun()` and
  `NotHomeView.resetSetup()` in the browser console.

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
