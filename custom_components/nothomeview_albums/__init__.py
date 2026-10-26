"""NotHomeView Album Links: shared Google Photos / iCloud / OneDrive albums as a photo source.

Optional helper for the NotHomeView Home Screen card and the Wallpanel screensaver. It reads public shared-album
links on the Home Assistant server (the albums' own sites don't allow browsers to read them directly) and offers them
as a media source (media-source://nothomeview_albums/<album>) plus a small websocket check for the card editors.
"""
from __future__ import annotations

import logging

from aiohttp import web
import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from . import providers as P
from .const import DOMAIN, PHOTO_PATH
from .store import AlbumStore, unb64

_LOGGER = logging.getLogger(__name__)


def get_store(hass: HomeAssistant) -> AlbumStore:
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = AlbumStore(hass)
    return hass.data[DOMAIN]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = get_store(hass)
    if not getattr(store, "registered", False):
        hass.http.register_view(AlbumPhotoView(store))
        websocket_api.async_register_command(hass, ws_check)
        store.registered = True
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True


class AlbumPhotoView(HomeAssistantView):
    """Redirects to a fresh link of one album photo (the providers' links expire). Needs auth or a signed path."""

    url = PHOTO_PATH + "/{key}/{pid}"
    name = "api:nothomeview_albums:photo"
    requires_auth = True

    def __init__(self, store: AlbumStore) -> None:
        self.store = store

    async def get(self, request: web.Request, key: str, pid: str) -> web.StreamResponse:
        try:
            u = await self.store.photo_url(key, unb64(pid))
        except (P.AlbumError, ValueError, UnicodeDecodeError) as e:
            return web.Response(status=404, text=str(e))
        if not u:
            return web.Response(status=404, text="photo not in album")
        raise web.HTTPFound(u, headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"})


@websocket_api.websocket_command({vol.Required("type"): "nothomeview_albums/check", vol.Required("url"): str})
@websocket_api.async_response
async def ws_check(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Editor check: provider, title and photo count (no photo links)."""
    try:
        a = await get_store(hass).album(msg["url"])
    except P.AlbumError as e:
        connection.send_result(msg["id"], {"ok": False, "provider": P.detect(msg["url"]), "error": str(e)})
        return
    connection.send_result(msg["id"], {"ok": True, "provider": a["provider"], "title": a["title"], "count": len(a["photos"]),
                                       "media_id": f"media-source://{DOMAIN}/{a['key']}"})
