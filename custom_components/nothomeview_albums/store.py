"""Album cache: photo lists (refreshed every 6 h) and fresh photo links."""
from __future__ import annotations

import asyncio
import base64
import logging
import time

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from . import providers as P
from .const import LIST_TTL, PHOTO_PATH

_LOGGER = logging.getLogger(__name__)


def b64(s: str) -> str:
    return base64.urlsafe_b64encode(s.encode()).decode().rstrip("=")


def unb64(s: str) -> str:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)).decode()


class AlbumStore:
    """In-memory cache. Nothing is written to disk; only public album links are fetched."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.albums: dict[str, dict] = {}
        self.errors: dict[str, str] = {}
        self.urls: dict[tuple[str, str], tuple[str, float]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    @property
    def session(self):
        return async_get_clientsession(self.hass)

    async def album(self, url: str, refresh: bool = False) -> dict:
        """The album of a link (cached LIST_TTL). On a failed refresh the last good list is kept."""
        key = P.album_key(url)
        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            a = self.albums.get(key)
            stale = not a or refresh or time.time() - a["fetched"] > LIST_TTL or (a.get("expires") and a["expires"] - time.time() < 1800)
            if stale:
                try:
                    a = await P.fetch_album(self.session, url)
                    a["key"] = key
                    a["url"] = url.strip()
                    self.albums[key] = a
                    self.errors.pop(key, None)
                    for k in [k for k in self.urls if k[0] == key]:
                        self.urls.pop(k, None)
                except P.AlbumError as e:
                    self.errors[key] = str(e)
                    _LOGGER.warning("Album link %s: %s", P.detect(url) or "?", e)
                    if not a:
                        raise
            return a

    async def photo_url(self, key: str, pid: str) -> str | None:
        """A working (fresh) provider link for one photo."""
        url = P.key_url(key)
        a = await self.album(url)
        by = {p["id"]: p for p in a["photos"]}
        if pid not in by:
            a = await self.album(url, refresh=True)
            by = {p["id"]: p for p in a["photos"]}
            if pid not in by:
                return None
        if a["provider"] != "icloud":
            return by[pid]["url"]
        c = self.urls.get((key, pid))
        if c and c[1] - time.time() > 120:
            return c[0]
        # iCloud links last ~20 minutes: get this one plus the next 24 in one call
        ids = [p["id"] for p in a["photos"]]
        i = ids.index(pid)
        want = [pid] + [x for x in ids[i + 1:i + 25] if not (self.urls.get((key, x)) or ("", 0))[1] - time.time() > 300]
        got = await P.icloud_urls(self.session, a, want)
        for x, v in got.items():
            self.urls[(key, x)] = v
        return got.get(pid, (None,))[0]

    def photo_path(self, key: str, pid: str) -> str:
        return f"{PHOTO_PATH}/{key}/{b64(pid)}"
