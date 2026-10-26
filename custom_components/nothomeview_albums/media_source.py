"""Album links as a Home Assistant media source: media-source://nothomeview_albums/<album key>[/<photo>]."""
from __future__ import annotations

from homeassistant.components.media_player import MediaClass
from homeassistant.components.media_source import BrowseMediaSource, MediaSource, MediaSourceItem, PlayMedia, Unresolvable
from homeassistant.core import HomeAssistant

from . import get_store, providers as P
from .const import DOMAIN
from .store import b64, unb64


async def async_get_media_source(hass: HomeAssistant) -> MediaSource:
    return AlbumSource(hass)


class AlbumSource(MediaSource):
    name = "Album links (NotHomeView)"

    def __init__(self, hass: HomeAssistant) -> None:
        super().__init__(DOMAIN)
        self.hass = hass

    async def async_resolve_media(self, item: MediaSourceItem) -> PlayMedia:
        key, _, pid = (item.identifier or "").partition("/")
        if not key or not pid:
            raise Unresolvable("An album photo id is needed")
        # a same-origin path: Home Assistant signs it, and it redirects to a fresh link of the photo
        return PlayMedia(get_store(self.hass).photo_path(key, unb64(pid)), "image/jpeg")

    async def async_browse_media(self, item: MediaSourceItem) -> BrowseMediaSource:
        store = get_store(self.hass)
        key = (item.identifier or "").partition("/")[0]
        if not key:  # root: the albums used so far (since the last restart)
            root = BrowseMediaSource(domain=DOMAIN, identifier=None, media_class=MediaClass.DIRECTORY, media_content_type="",
                                     title=self.name, can_play=False, can_expand=True, children_media_class=MediaClass.DIRECTORY)
            root.children = [BrowseMediaSource(domain=DOMAIN, identifier=a["key"], media_class=MediaClass.ALBUM, media_content_type="",
                                               title=f'{a["title"]} ({a["provider"]})', can_play=False, can_expand=True) for a in store.albums.values()]
            return root
        try:
            a = await store.album(P.key_url(key))
        except (P.AlbumError, ValueError, UnicodeDecodeError) as e:
            raise Unresolvable(str(e)) from e
        node = BrowseMediaSource(domain=DOMAIN, identifier=key, media_class=MediaClass.ALBUM, media_content_type="", title=a["title"],
                                 can_play=False, can_expand=True, children_media_class=MediaClass.IMAGE)
        node.children = [BrowseMediaSource(domain=DOMAIN, identifier=f'{key}/{b64(p["id"])}', media_class=MediaClass.IMAGE, media_content_type="image/jpeg",
                                           title=f"Photo {i + 1}", can_play=True, can_expand=False) for i, p in enumerate(a["photos"])]
        return node
