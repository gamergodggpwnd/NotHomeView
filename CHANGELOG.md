# Changelog

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
