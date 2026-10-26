"""Fetch the photo list of a public shared album (Google Photos, iCloud Photos, OneDrive).

Read only, no account: only links that anyone with the link can open. Every function returns
plain dicts so the module can be tested without Home Assistant.
"""
from __future__ import annotations

import base64
import calendar
import json
import re
import time
from urllib.parse import quote, unquote, urlparse

import aiohttp

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
MAX_PHOTOS = 2000
TIMEOUT = aiohttp.ClientTimeout(total=30)


class AlbumError(Exception):
    """The album could not be read (message is shown to the user)."""


def detect(url: str) -> str | None:
    """Provider of a shared-album link: google, icloud, onedrive or None."""
    u = (url or "").strip()
    if re.match(r"^https?://(photos\.app\.goo\.gl|goo\.gl/photos|photos\.google\.com/(u/\d+/)?share/)", u, re.I):
        return "google"
    if re.match(r"^https?://(www\.)?icloud\.com/sharedalbum/", u, re.I):
        return "icloud"
    if re.match(r"^https?://(1drv\.ms|onedrive\.live\.com|photos\.onedrive\.com)/", u, re.I):
        return "onedrive"
    return None


def album_key(url: str) -> str:
    """URL-safe id of an album link (used in media-source ids and photo paths)."""
    return base64.urlsafe_b64encode(url.strip().encode()).decode().rstrip("=")


def key_url(key: str) -> str:
    return base64.urlsafe_b64decode(key + "=" * (-len(key) % 4)).decode()


# ---------------------------------------------------------------- Google Photos
# The shared-album page embeds its first page of photos (AF_initDataCallback 'ds:1'); further pages come from the
# same page's data service (rpc snAcKc) with the continuation token. Photo URLs (lh3.googleusercontent.com) are
# long-lived and load in any browser; "=w2048-h2048" asks for a screen-sized copy.
_G_ITEM = re.compile(r'\["(AF1Qip[\w-]+)",\["(https://lh3\.googleusercontent\.com/[^"]+)",(\d+),(\d+)')


async def _google(s: aiohttp.ClientSession, url: str) -> dict:
    async with s.get(url, headers={"User-Agent": UA, "Accept-Language": "en"}, allow_redirects=True) as r:
        if r.status != 200:
            raise AlbumError(f"Google Photos answered {r.status} (is link sharing still on?)")
        html = await r.text()
    m = re.search(r"AF_initDataCallback\(\{key: 'ds:1'.*?data:(.*?), sideChannel: \{\}\}\);</script>", html, re.S)
    req = re.search(r"'ds:1' : \{id:'snAcKc'.*?request:(\[.*?\])\}", html, re.S)
    if not m:
        raise AlbumError("This doesn't look like a shared Google Photos album (no photos on the page)")
    data = json.loads(m.group(1))
    title = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    photos, seen = [], set()

    def take(d):
        for it in (d[1] or []) if d and len(d) > 1 else []:
            try:
                pid, (u, w, h) = it[0], it[1][:3]
            except (TypeError, ValueError, IndexError):
                continue
            if pid in seen or not str(u).startswith("https://lh3.googleusercontent.com/"):
                continue
            seen.add(pid)
            photos.append({"id": pid, "url": u + "=w2048-h2048", "w": w, "h": h})

    take(data)
    token = data[2] if len(data) > 2 else ""
    rq = json.loads(req.group(1)) if req else None
    pages = 0
    while token and rq and len(photos) < MAX_PHOTOS and pages < 40:
        pages += 1
        body = json.dumps([[["snAcKc", json.dumps([rq[0], token, None, rq[3] if len(rq) > 3 else None]), None, "generic"]]])
        async with s.post("https://photos.google.com/_/PhotosUi/data/batchexecute", data={"f.req": body},
                          headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"}) as r:
            txt = await r.text()
        d = None
        for line in txt.split("\n"):
            if line.startswith('[["wrb.fr"'):
                d = json.loads(json.loads(line)[0][2])
        if not d:
            break
        take(d)
        token = d[2] if len(d) > 2 else ""
    if not photos:
        raise AlbumError("The Google Photos album is empty or not shared by link")
    return {"title": re.sub(r"\s+·.*$", "", title.group(1)).strip() if title else "Google Photos album", "photos": photos[:MAX_PHOTOS], "expires": None}


# ---------------------------------------------------------------- iCloud
# Public "Shared Album" websites use Apple's sharedstreams API: webstream (the photo list) and webasseturls
# (download links, valid about 20 minutes). The API sends no CORS headers, so browsers can't call it directly.
_B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"


def _icloud_token(url: str) -> str:
    m = re.search(r"sharedalbum/#?([0-9A-Za-z]+)", url)
    if not m:
        raise AlbumError("Couldn't find the album token in this iCloud link (it looks like …/sharedalbum/#B0aB…)")
    return m.group(1).split(";")[0]


async def _ic_post(s, host, tok, path, body):
    async with s.post(f"https://{host}/{tok}/sharedstreams/{path}", data=json.dumps(body),
                      headers={"Content-Type": "text/plain", "Origin": "https://www.icloud.com", "User-Agent": UA}) as r:
        txt = await r.text()
        try:
            return r.status, json.loads(txt) if txt else {}
        except ValueError:
            return r.status, {}


async def _icloud(s: aiohttp.ClientSession, url: str) -> dict:
    tok = _icloud_token(url)
    n = 0
    for c in (tok[1] if tok[0] == "A" else tok[1:3]):
        n = n * 62 + _B62.index(c)
    host = f"p{n:02d}-sharedstreams.icloud.com"
    st, b = await _ic_post(s, host, tok, "webstream", {"streamCtag": None})
    if st == 330 and b.get("X-Apple-MMe-Host"):
        host = b["X-Apple-MMe-Host"]
        st, b = await _ic_post(s, host, tok, "webstream", {"streamCtag": None})
    if st != 200:
        raise AlbumError("iCloud says this shared album doesn't exist (is Public Website still on?)" if st == 404 else f"iCloud answered {st}")
    photos = []
    for p in b.get("photos") or []:
        if p.get("mediaAssetType") == "video":
            continue
        ds = [v for k, v in (p.get("derivatives") or {}).items() if k != "PosterFrame" and v.get("checksum")]
        if not ds:
            continue
        def size(v):
            return max(int(v.get("width") or 0), int(v.get("height") or 0))
        big = [v for v in ds if size(v) >= 1600]  # screen-sized: the smallest copy that is at least 1600 px, else the biggest there is
        d = min(big, key=size) if big else max(ds, key=size)
        photos.append({"id": p["photoGuid"], "ck": d["checksum"], "w": int(d.get("width") or 0), "h": int(d.get("height") or 0)})
        if len(photos) >= MAX_PHOTOS:
            break
    if not photos:
        raise AlbumError("The iCloud shared album has no photos")
    return {"title": b.get("streamName") or "iCloud shared album", "photos": photos, "host": host, "token": tok, "expires": None}


async def icloud_urls(s: aiohttp.ClientSession, album: dict, ids: list[str]) -> dict:
    """Fresh download links for some photos of an iCloud album: {photo id: (url, expiry epoch)}."""
    by = {p["id"]: p for p in album["photos"]}
    out = {}
    for i in range(0, len(ids), 25):
        chunk = [x for x in ids[i:i + 25] if x in by]
        st, b = await _ic_post(s, album["host"], album["token"], "webasseturls", {"photoGuids": chunk})
        items = b.get("items") or {}
        for pid in chunk:
            it = items.get(by[pid]["ck"])
            if it:
                try:
                    exp = calendar.timegm(time.strptime(it.get("url_expiry", "")[:19], "%Y-%m-%dT%H:%M:%S"))
                except ValueError:
                    exp = time.time() + 900
                out[pid] = ("https://" + it["url_location"] + it["url_path"], exp)
    return out


# ---------------------------------------------------------------- OneDrive
# Anonymous sharing links work through the OneDrive "shares" API with a guest ("badger") token, the same way
# onedrive.live.com shows a shared folder to someone who isn't signed in. Both endpoints send CORS headers, so the
# Home Screen card can also do this directly in the browser. Thumbnail links (1920 px) are valid for a few hours.
_OD_APP = "5cbed6ac-a083-4e14-b191-b4ba07653de2"
_badger: dict = {}


async def _od_token(s):
    if _badger.get("t") and _badger.get("exp", 0) > time.time() + 600:
        return _badger["t"]
    async with s.post("https://api-badgerp.svc.ms/v1.0/token", json={"appId": _OD_APP}, headers={"User-Agent": UA}) as r:
        if r.status != 200:
            raise AlbumError(f"OneDrive guest access failed ({r.status})")
        b = await r.json(content_type=None)
    _badger.update(t=f'{b.get("authScheme", "Badger")} {b["token"]}', exp=time.time() + 6 * 3600)
    return _badger["t"]


def _share_id(url: str) -> str:
    return "u!" + base64.b64encode(url.strip().encode()).decode().rstrip("=").replace("/", "_").replace("+", "-")


async def _onedrive(s: aiohttp.ClientSession, url: str) -> dict:
    auth = await _od_token(s)
    h = {"Authorization": auth, "Prefer": "autoredeem", "User-Agent": UA}
    base = f"https://api.onedrive.com/v1.0/shares/{_share_id(url)}/driveItem"
    async with s.get(base, headers=h) as r:
        if r.status != 200:
            raise AlbumError("OneDrive couldn't open this link (is it shared with 'Anyone with the link'?)" if r.status in (401, 403, 404) else f"OneDrive answered {r.status}")
        root = await r.json(content_type=None)
    photos, exp = [], []
    folders = [(base + "/children", 0)]
    while folders and len(photos) < MAX_PHOTOS:
        nxt, depth = folders.pop(0)
        nxt += ("&" if "?" in nxt else "?") + "$expand=thumbnails($select=c1920x1920)&$top=200" if "$skiptoken" not in nxt and "$expand" not in nxt else ""
        while nxt and len(photos) < MAX_PHOTOS:
            async with s.get(nxt, headers=h) as r:
                if r.status != 200:
                    break
                b = await r.json(content_type=None)
            for c in b.get("value") or []:
                if "folder" in c and depth < 2:
                    pr = c.get("parentReference") or {}
                    folders.append((f'https://api.onedrive.com/v1.0/drives/{pr.get("driveId")}/items/{c["id"]}/children', depth + 1))
                    continue
                mime = (c.get("file") or {}).get("mimeType") or ""
                if not ("image" in c or mime.startswith("image/")):
                    continue
                th = ((c.get("thumbnails") or [{}])[0].get("c1920x1920") or {}).get("url")
                u = th or c.get("@content.downloadUrl")
                if not u:
                    continue
                img = c.get("image") or {}
                photos.append({"id": c["id"], "url": u, "w": img.get("width") or 0, "h": img.get("height") or 0})
                m = re.search(r"tempauth(?:%3D|=)v1e?\.([A-Za-z0-9_-]+)", unquote(u))
                if m:
                    try:
                        p = m.group(1) + "=" * (-len(m.group(1)) % 4)
                        exp.append(int(json.loads(base64.urlsafe_b64decode(p)).get("exp")))
                    except (ValueError, TypeError):
                        pass
            nxt = b.get("@odata.nextLink")
    if not photos:
        raise AlbumError("No photos found in this OneDrive folder")
    return {"title": root.get("name") or "OneDrive folder", "photos": photos, "expires": min(exp) if exp else time.time() + 3 * 3600}


async def fetch_album(s: aiohttp.ClientSession, url: str) -> dict:
    """{provider, title, photos:[{id, url?, w, h}], expires} for a shared-album link."""
    prov = detect(url)
    if not prov:
        raise AlbumError("Not a Google Photos, iCloud shared album or OneDrive link")
    try:
        fn = {"google": _google, "icloud": _icloud, "onedrive": _onedrive}[prov]
        a = await fn(s, url.strip())
    except AlbumError:
        raise
    except (aiohttp.ClientError, TimeoutError) as e:
        raise AlbumError(f"Couldn't reach {prov}: {e.__class__.__name__}") from e
    except (ValueError, KeyError, IndexError, TypeError) as e:
        raise AlbumError(f"The {prov} album page changed and couldn't be read ({e.__class__.__name__})") from e
    a["provider"] = prov
    a["fetched"] = time.time()
    return a
