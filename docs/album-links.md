# Album links (Google Photos, iCloud, OneDrive)

From 1.32.0 the Photos tile (Home Screen card), its viewer and gallery, the blurred backdrop and the Wallpanel screensaver can show a
**shared album link** instead of Home Assistant's media folder.

| Provider | Link | Works without the helper? |
|---|---|---|
| Google Photos | `https://photos.app.goo.gl/…` or `https://photos.google.com/share/…` | No – needs the helper |
| iCloud shared album | `https://www.icloud.com/sharedalbum/#…` (Public Website must be on) | No – needs the helper |
| OneDrive | `https://1drv.ms/…` or `https://onedrive.live.com/…` ("Anyone with the link") | Photos tile: yes. Screensaver: needs the helper |

Your existing configuration keeps working unchanged: the default photo source is still the media folder.

## Turning it on

* **Photos tile**: edit the Home Screen card → *Photos & background* → **Photo source** = *Album link*, then paste the link into **Album link**.
  The editor detects the provider and checks the link right away (✓ with the album name and photo count, or ⚠ with what is wrong).
* **Screensaver**: Screensaver popup → *Photos* → **Photos from** = *Album link (Google Photos, iCloud, OneDrive)* and paste the link.
  Save only goes through once the link works (this needs the helper, see below).

The photo list is cached and refreshed every 6 hours (sooner if the provider's photo links expire earlier). With *Order = Random* the list
is shuffled. If the album can't be read (link removed, album no longer shared, provider down), the tile falls back to the media folder
and the editor says why.

## The NotHomeView Album Links helper (optional custom integration)

Google Photos and iCloud don't allow a web page to read their albums (no CORS), so the album has to be read by Home Assistant itself.
The small helper integration in `custom_components/nothomeview_albums` does that. It adds no entities and makes no device calls.

Install (once):

1. Copy the folder `custom_components/nothomeview_albums` from this repository into your Home Assistant `config/custom_components/` folder
   (HACS installs only the card bundle from this repository, so this step is manual).
2. Restart Home Assistant.
3. *Settings → Devices & services → Add integration →* **NotHomeView Album Links** → Submit (no fields).

What it provides:

* a media source **Album links (NotHomeView)** – each album is `media-source://nothomeview_albums/<id>`, which is what the screensaver uses
  (Wallpanel reads it like any media folder);
* a signed, login-protected photo address `/api/nothomeview_albums/photo/…` that redirects to a fresh photo link from the provider
  (iCloud's links last only about 20 minutes, so they are renewed when needed);
* a websocket command `nothomeview_albums/check` that the editors use to check a link.

The album list is kept in memory only (nothing is written to disk); after a restart it is fetched again on first use.

## How each provider is read

* **Google Photos** – the helper loads the public album page (the same page a browser shows) and reads the photo list that is embedded in it;
  further pages (albums of more than ~300 photos) come from the same request the Google Photos web page makes. Up to 2000 photos are read,
  shown at up to 2048 px. This is not an official API: if Google changes its web page, the helper may need an update.
* **iCloud shared albums** – the helper uses the "sharedstreams" web service that `icloud.com/sharedalbum` itself uses: the photo list, then
  short-lived (≈20 min) download links, requested in small batches as photos are shown. Videos are skipped; for each photo the smallest
  version of at least 1600 px is used. The album must have *Public Website* switched on.
* **OneDrive** – OneDrive's public API no longer accepts anonymous share links, so the card (or the helper) gets the same guest token the
  OneDrive web viewer uses and reads the shared folder (and sub-folders, two levels deep) with 1920 px previews. Microsoft allows this from a
  browser, so the Photos tile works without the helper. This guest token is undocumented and may stop working without notice.

## Limits

* Only **shared/public** albums work; private albums or links that need a sign-in can't be read.
* Up to 2000 photos per album are read; with the helper the Photos tile uses the first 800 of them (like a media folder).
* "Add photos" in the gallery still uploads to the Home Assistant media folder; it doesn't add to the shared album.
* None of the three methods is an official, documented public API. They can break when the provider changes its website; the tile then falls
  back to the media folder and the editor shows the error.
* Album links are stored in your dashboard configuration like any other option, so anyone who can edit the dashboard can see the link.
