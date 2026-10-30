/*! HomeView cards for Home Assistant - one bundle, no build step, no dependencies.
 *  Cards: homeview-garage-chooser-card (1.29), homeview-now-playing-card, homeview-thermostat-card, homeview-entity-card, homeview-light-card, homeview-garage-card,
 *         homeview-group-card, homeview-scene-card, homeview-music-card, homeview-nav-card, homeview-edit-button-card
 *  Every card has a visual editor (ha-form). Look = HomeView glass tiles; colours come from the
 *  HomeView CSS variables (--hv-*) set by the HomeView theme / style helper, with glass fall-backs. */
const HV_VERSION = '1.32.0';
// Registered colour properties so a scene background written as linear-gradient(var(--hv-bg-top), var(--hv-bg-bottom))
// can fade smoothly between scenes (plain gradients can't transition). Unused unless a dashboard style sets them.
try { if (window.CSS && CSS.registerProperty) for (const n of ['--hv-bg-top', '--hv-bg-bottom'])
  CSS.registerProperty({ name: n, syntax: '<color>', inherits: false, initialValue: '#0d0f0e' }); } catch (e) { /* already registered */ }
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif';
const ROUND = 'ui-rounded, "SF Pro Rounded", "Nunito", -apple-system, BlinkMacSystemFont, sans-serif';
// --hv-vh = the real visible window height in px. Full-screen HomeView layouts use calc(var(--hv-vh, 100dvh) - ...) because
// 100vh / 100dvh are not reliable inside app web views (HA iOS / Android app). Updated on resize and rotation.
if (!window.__hvVh) { window.__hvVh = true;
  const setVh = () => document.documentElement.style.setProperty('--hv-vh', window.innerHeight + 'px');
  setVh(); window.addEventListener('resize', setVh); window.addEventListener('orientationchange', () => { setVh(); setTimeout(setVh, 350); });
  document.addEventListener('visibilitychange', setVh); }

const fire = (node, type, detail) => node.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const domainOf = id => (id || '').split('.')[0];
const UNAVAILABLE = ['unavailable', 'unknown'];
// same rules as Home Assistant's stateActive() (the tile card's lavender "active" state)
function stateActive(s) {
  if (!s || UNAVAILABLE.includes(s.state)) return false;
  const st = s.state, d = domainOf(s.entity_id);
  switch (d) {
    case 'alarm_control_panel': return st !== 'disarmed';
    case 'alert': return st !== 'idle';
    case 'cover': case 'valve': return st !== 'closed';
    case 'device_tracker': case 'person': return st !== 'not_home';
    case 'lock': return st !== 'locked';
    case 'media_player': return st !== 'standby' && st !== 'off';
    case 'vacuum': return !['idle', 'docked', 'paused'].includes(st);
    case 'plant': return st === 'problem';
    case 'group': return ['on', 'home', 'open', 'locked', 'problem'].includes(st);
    case 'timer': return st === 'active';
    case 'camera': return st === 'streaming';
    case 'scene': case 'script': case 'button': case 'input_button': case 'event': return false;
    case 'zone': return st !== '0';
  }
  return st !== 'off';
}
// "running": on / open / playing / above 0 — and not one of the usual idle words (used by active: running)
const IDLE_WORDS = ['off', 'power_off', 'idle', 'standby', 'closed', 'not_home', 'none', 'false', 'unknown', 'unavailable', ''];
const isRunning = s => { if (!s) return false; const v = String(s.state).toLowerCase().trim(); if (IDLE_WORDS.includes(v)) return false; const n = Number(v); return isNaN(n) ? true : n > 0; };
const TPL_RE = /\{([a-z_]+\.[a-z0-9_]+)\}/g;
const tplEntities = t => t ? [...String(t).matchAll(TPL_RE)].map(m => m[1]) : [];
const fmtState = (hass, s) => !s ? '' : (hass.formatEntityState ? hass.formatEntityState(s) : s.state);
// sub-label text: {state} = this card's state, {count} = group count, {sensor.xyz} = any entity's state (formatted)
const fmtTpl = (hass, t, s, extra = {}) => String(t).replace(/\{(state|count)\}/g, (m, k) => k === 'state' ? fmtState(hass, s) : (extra[k] != null ? extra[k] : m))
  .replace(TPL_RE, (m, id) => hass.states[id] ? fmtState(hass, hass.states[id]) : '—');
const fmtAttr = (hass, s, a) => !s ? '' : (hass.formatEntityAttributeValue ? hass.formatEntityAttributeValue(s, a) : String(s.attributes[a]));

/* ---------------- theme: Night (dark glass, default) / Day (white) / Auto (follow the sun) — 1.30.5, device pages only since 1.30.6 ----------------
 * Only the device pages (the views with the button tiles: Page Grid cards, tiles and their popups such as the garage chooser) change.
 * The Home Screen card and everything on its view (photo backdrop, Photos card, its sheets and gallery) always keep the original look.
 * Dashboard-wide: "Device pages theme" = the `theme` option of the NotHomeView Home Screen card (visual editor, or the Edit Page menu).
 * A NotHomeView Page Grid can override it for its own page ("Same as all device pages" by default).
 * Nothing set (or Night) = the original dark glass look, unchanged. Day colours = the "HomeView Light" theme palette. */
const HV_THEMES = ['night', 'day', 'auto'];
const HV_DAY_VARS = '--hv-bg:#ffffff;--hv-bg-on:#cdc6ef;--hv-border:rgba(0,0,0,.05);--hv-border-on:rgba(110,90,210,.18);--hv-shadow:0 .4vh 1.4vh rgba(30,30,60,.07);' +
  '--hv-shadow-on:0 .3vh 1vh rgba(80,60,180,.08);--hv-blur:none;--hv-text:#3c3c43;--hv-text-strong:#1c1c1e;--hv-text2:rgba(60,60,67,.72);--hv-text-on:#3f3399;' +
  '--hv-text2-on:rgba(63,51,153,.85);--hv-icon:#3c3c43;--hv-icon-on:#5b3fc4;--hv-shade:none;--hv-icon-shade:none;--hv-accent:#7a6ae0;--hv-track:rgba(60,60,67,.12);' +
  '--hv-gc-bg:#f2f2f6;--hv-gc-bd:rgba(0,0,0,.06);--hv-gc-busy:#cdc6ef';
const HV_DAY_BG = 'radial-gradient(80% 90% at 20% 0%, #ffffff 0%, rgba(255,255,255,0) 70%), linear-gradient(160deg,#f1f1f4 0%,#e3e3e8 100%)';
// for :host CSS of every card (custom properties set on the card itself win over the dark ones inherited from the view)
const HV_DAY_HOST = `:host([hv-day]){${HV_DAY_VARS};--primary-text-color:#1c1c1e;--secondary-text-color:rgba(60,60,67,.72)}`;
const hvSunUp = h => { const s = h && h.states && h.states['sun.sun']; return s ? s.state === 'above_horizon' : (new Date().getHours() >= 7 && new Date().getHours() < 19); };
const hvMode = (t, h) => t === 'day' ? 'day' : t === 'auto' ? (hvSunUp(h) ? 'day' : 'night') : 'night';
const HVT = { els: new Set(), over: '', cur: 'night', root: null, hass: null, key: '', page: null, docStyle: null, cfg: undefined, path: null, t: '' };
const hvFindRoot = el => { let n = el; for (let i = 0; i < 80 && n; i++) { if (n.tagName === 'HUI-ROOT') return n; n = n.parentNode || n.host; } return null; };
// the theme of the current view (1.30.6: it only styles the device pages). A view with a Home Screen card always stays Night (the Home
// Screen keeps its original look); otherwise a Page Grid in the view with its own setting wins, then the dashboard-wide "Device pages
// theme" set on the Home Screen card.
function hvCfgTheme(cfg) {
  if (!cfg || !Array.isArray(cfg.views)) return '';
  const seg = decodeURIComponent((location.pathname.split('/')[2] || ''));
  let vi = cfg.views.findIndex(v => v && v.path != null && String(v.path) === seg); if (vi < 0) vi = /^\d+$/.test(seg) ? +seg : 0;
  const find = (o, types, d = 0) => { if (!o || typeof o !== 'object' || d > 14) return '';
    if (Array.isArray(o)) { for (const x of o) { const r = find(x, types, d + 1); if (r) return r; } return ''; }
    if (types.includes(o.type) && HV_THEMES.includes(o.theme)) return o.theme;
    for (const k of ['sections', 'cards', 'card', 'elements']) if (o[k]) { const r = find(o[k], types, d + 1); if (r) return r; } return ''; };
  const HUB = 'custom:homeview-hub-card', has = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 14) return false;
    if (Array.isArray(o)) return o.some(x => has(x, d + 1)); if (o.type === HUB) return true;
    return ['sections', 'cards', 'card', 'elements'].some(k => o[k] && has(o[k], d + 1)); };
  if (has(cfg.views[vi])) return '';
  return find(cfg.views[vi], ['custom:homeview-grid-card']) || find(cfg.views, [HUB]) || '';
}
// the dashboard-wide Device pages theme = `theme` of the first NotHomeView Home Screen card (returns that card's config object)
function hvHubCfgOf(cfg) { const walk = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 14) return null;
    if (Array.isArray(o)) { for (const x of o) { const r = walk(x, d + 1); if (r) return r; } return null; }
    if (o.type === 'custom:homeview-hub-card') return o;
    for (const k of ['views', 'sections', 'cards', 'card', 'elements']) if (o[k]) { const r = walk(o[k], d + 1); if (r) return r; } return null; };
  return walk(cfg); }
// the theme of one device-page view (1.30.7: also used when the Home Screen shows that view as a sheet): its Page Grid's own
// setting, else the dashboard's Device pages theme (Home Screen card), else Night
function hvViewTheme(cfg, v) {
  const find = (o, d = 0) => { if (!o || typeof o !== 'object' || d > 14) return '';
    if (Array.isArray(o)) { for (const x of o) { const r = find(x, d + 1); if (r) return r; } return ''; }
    if (o.type === 'custom:homeview-grid-card' && HV_THEMES.includes(o.theme)) return o.theme;
    for (const k of ['sections', 'cards', 'card', 'elements']) if (o[k]) { const r = find(o[k], d + 1); if (r) return r; } return ''; };
  const hub = cfg ? hvHubCfgOf(cfg) : null;
  return find(v) || (hub && HV_THEMES.includes(hub.theme) ? hub.theme : '') || 'night'; }
// while the Home Screen shows a device page as a sheet, popups opened from it (garage chooser, room picker …) follow that page
function hvThemeOver(mode) { if (HVT.over === mode) return; HVT.over = mode;
  const ha = document.querySelector('home-assistant'), hr = ha && ha.shadowRoot, day = mode === 'day' || HVT.cur === 'day';
  if (hr && HV_POPUP_SHEET) { const has = hr.adoptedStyleSheets.includes(HV_POPUP_SHEET);
    if (day && !has) hr.adoptedStyleSheets = [...hr.adoptedStyleSheets, HV_POPUP_SHEET]; else if (!day && has) hr.adoptedStyleSheets = hr.adoptedStyleSheets.filter(x => x !== HV_POPUP_SHEET); }
  for (const e of HVT.els) hvThemeApply(e); }
// Home Assistant's own toast at the bottom of the screen
const hvToast = (message, id) => { const ha = document.querySelector('home-assistant'); if (ha) ha.dispatchEvent(new CustomEvent('hass-notification', { bubbles: true, composed: true, detail: id ? { message, id } : { message } })); };
/* 1.32.0: an edit pencil next to the ✕ of every NotHomeView popup (Home Screen sheets, photos, gallery, weather, music, device pages, assistant,
   timer, camera / person popups, room picker). Admins only, dashboards in storage (UI) mode only, and the Home Screen card's `popup_edit: false`
   turns it off. A tap closes the popup and opens the visual editor of the card the popup belongs to (the same card editor the dashboard's edit
   mode opens); a device page opens that page in edit mode (like the floating pencil). */
const HV_HUBS = new Set();
const hvPenOK = (el, h) => { if (!el || !h || !h.user || h.user.is_admin !== true) return false; const root = hvFindRoot(el), lv = root && root.lovelace;
  if (!lv || !lv.config || lv.mode === 'yaml') return false; const hub = hvHubCfgOf(lv.config); return !(hub && hub.popup_edit === false); };
const hvPenPage = (dash, vp) => hvGoEdit(dash ? `/${dash}/${vp}?disable_km&edit=1` : location.pathname.replace(/\/$/, '') + '?disable_km&edit=1');
// 1.32.0: open a view of THIS dashboard in edit mode without reloading the app (no black flash / HA logo): switch the view like HA's own
// navigate() does, then turn on Lovelace edit mode. Falls back to the old full page load (?disable_km&edit=1) for another dashboard, a YAML
// dashboard, or when the header stays hidden (kiosk-mode that doesn't react to ?disable_km without a reload).
// kiosk-mode only reads ?disable_km when the dashboard loads: switch its header / sidebar hiding styles off in place (until the next load)
function hvKioskOff() { const walk = (r, d) => { if (!r || d > 12) return; r.querySelectorAll('style[id^="kiosk_mode"]').forEach(st => { st.media = 'not all'; });
    r.querySelectorAll('*').forEach(n => { if (n.shadowRoot) walk(n.shadowRoot, d + 1); }); }; walk(document, 0); window.__hvKmOff = true; }
function hvGoEdit(url) { let u; try { u = new URL(url, location.href); } catch (e) { location.assign(url); return; }
  const seg = p => decodeURIComponent((p || '').split('/')[1] || ''), ha = document.querySelector('home-assistant'), find = () => ha && hvDeepFind(ha.shadowRoot, n => n.tagName === 'HUI-ROOT');
  const root0 = find(), lv0 = root0 && root0.lovelace;
  if (u.origin !== location.origin || seg(u.pathname) !== seg(location.pathname) || !lv0 || lv0.mode === 'yaml' || typeof lv0.setEditMode !== 'function') { location.assign(url); return; }
  const q = new URLSearchParams(u.search); q.delete('edit'); const qs = q.toString(), to = u.pathname + (qs ? '?' + qs.replace(/=(&|$)/g, '$1') : '');
  if (location.pathname + location.search !== to) { history.pushState(null, '', to); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); }
  setTimeout(() => { const r = find(), lv = r && r.lovelace; if (!lv) { location.assign(url); return; } if (q.has('disable_km')) hvKioskOff(); try { lv.setEditMode(true); } catch (e) { location.assign(url); return; }
    setTimeout(() => { if (q.has('disable_km')) hvKioskOff(); const r2 = find(), hd = r2 && r2.shadowRoot && r2.shadowRoot.querySelector('.header, app-header, .toolbar'), on = r2 && r2.lovelace && r2.lovelace.editMode;
      if (!on || (hd && !hd.getBoundingClientRect().height)) { try { sessionStorage.setItem('hvGoEditFB', JSON.stringify({ on: !!on, hd: hd ? hd.tagName + '.' + hd.className + ':' + hd.getBoundingClientRect().height : null })); } catch (e) {} location.assign(url); } }, 1200); }, 250); }
const hvCfgMatch = el => { const raw = el && (el._hvRaw || el._config); if (!raw || !raw.type) return () => false;
  return o => o && o.type === raw.type && Object.keys(o).every(k => JSON.stringify(o[k]) === JSON.stringify(raw[k])); };
function hvCardPath(cfg, match, pref) { if (!cfg || !Array.isArray(cfg.views)) return null; // the view on screen first (the same card can sit on several pages)
  const deep = (o, d) => { if (!o || typeof o !== 'object' || d > 12) return false; if (match(o)) return true;
    for (const k of ['cards', 'card', 'elements', 'side_cards']) { const x = o[k]; if (Array.isArray(x) ? x.some(y => deep(y, d + 1)) : x && typeof x === 'object' && deep(x, d + 1)) return true; } return false; };
  const order = cfg.views.map((_, i) => i); if (typeof pref === 'number' && pref >= 0 && pref < order.length) { order.splice(pref, 1); order.unshift(pref); }
  for (const v of order) { const vw = cfg.views[v] || {};
    for (let si = 0; si < (vw.sections || []).length; si++) { const cs = (vw.sections[si] || {}).cards || []; for (let c = 0; c < cs.length; c++) if (deep(cs[c], 0)) return [v, si, c]; }
    for (let c = 0; c < (vw.cards || []).length; c++) if (deep(vw.cards[c], 0)) return [v, c]; }
  return null; }
const hvDeepFind = (r, test, d = 0) => { if (!r || d > 14) return null; for (const n of r.querySelectorAll('*')) { if (test(n)) return n; if (n.shadowRoot) { const x = hvDeepFind(n.shadowRoot, test, d + 1); if (x) return x; } } return null; };
// open Home Assistant's card editor for the card at `path` (it listens for ll-edit-card on the section / view layout); false = not on screen
function hvOpenCardEditor(root, path) { const v = path[0];
  const host = path.length === 3 ? hvDeepFind(root.shadowRoot, n => n.tagName === 'HUI-SECTION' && n.index === path[1] && n.viewIndex === v)
    : hvDeepFind(root.shadowRoot, n => n.tagName === 'HUI-VIEW' && n.index === v);
  const le = host && host._layoutElement; if (!le) return false;
  le.dispatchEvent(new CustomEvent('ll-edit-card', { detail: { path } })); return true; }
// target: { card: element } (its own card editor) or { view: 'path', dash } (that page in edit mode)
function hvPopEdit(from, target) { const root = hvFindRoot((target && target.card) || from), lv = root && root.lovelace, dash = (lv && lv.urlPath) || ssDash();
  if (target && target.view != null) { hvPenPage(target.dash || dash, target.view); return; }
  const path = lv && hvCardPath(lv.config, hvCfgMatch(target && target.card), root._curView);
  if (path && target && target.card) { let g = target.card; for (let i = 0; i < 30 && g && g.tagName !== 'HOMEVIEW-GRID-CARD'; i++) g = g.parentNode || g.host; // a Page Grid tile: its editor starts on that tile
    const k = g && g._kids ? g._kids.findIndex(x => x.el === target.card) : -1; if (k >= 0) { HV_TAP.cfg = JSON.stringify((g._config && g._config.cards) || []); HV_TAP.i = k; HV_TAP.t = Date.now(); } }
  if (path) { const cur = root._curView; if ((cur === path[0] || cur == null) && hvOpenCardEditor(root, path)) return;
    const vw = lv.config.views[path[0]] || {}; hvPenPage(dash, vw.path != null && vw.path !== '' ? vw.path : path[0]); return; }
  hvPenPage(null); }
// the pencil itself: a copy of the popup's ✕ (same look, size and spot), placed just beside it; returns the button or null
function hvPen(x, onEdit, o) { o = o || {}; if (!x || !onEdit || !x.parentNode) return null;
  const p = x.cloneNode(false); p.classList.add('hvpen'); p.removeAttribute('id'); p.setAttribute('aria-label', 'Edit'); p.setAttribute('title', 'Edit'); if (p.tagName !== 'BUTTON') p.setAttribute('role', 'button');
  p.innerHTML = '<ha-icon icon="mdi:pencil"></ha-icon>'; x.after(p); const gap = o.gap || 10;
  const place = () => { if (!p.isConnected) { removeEventListener('resize', place); return; } const cs = getComputedStyle(x);
    if (cs.position === 'absolute' || cs.position === 'fixed') { const par = x.offsetParent, W = par ? par.clientWidth : innerWidth, w = x.offsetWidth; if (!w) return;
      if (x.offsetLeft + w / 2 > W / 2) { p.style.left = 'auto'; p.style.right = (W - x.offsetLeft + gap) + 'px'; } else { p.style.right = 'auto'; p.style.left = (x.offsetLeft + w + gap) + 'px'; } }
    else { x.style.order = '2'; p.style.order = '1'; p.style.marginLeft = 'auto'; p.style.marginRight = gap + 'px'; } };
  requestAnimationFrame(place); setTimeout(place, 450); addEventListener('resize', place);
  for (const t of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) p.addEventListener(t, e => e.stopPropagation(), { passive: true });
  p.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); onEdit(); });
  p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onEdit(); } }); if (p.tagName !== 'BUTTON') p.tabIndex = 0;
  return p; }
// browser_mod popups show a copy of the card: remember which card opened it, so its pencil edits that card
const hvPopFrom = el => { window.__hvPopO = { el, t: Date.now() }; };
const hvPopTake = () => { const o = window.__hvPopO; window.__hvPopO = null; return o && Date.now() - o.t < 6000 && o.el && o.el.isConnected ? o.el : null; };
// 1.32.0: change a few options of THIS Home Screen card in the saved dashboard (re-read first; keys set to null are removed), like the visual editor
async function hvSaveHubCfg(hub, patch) { const root = hvFindRoot(hub), lv = root && root.lovelace;
  if (!lv) throw new Error('open this from the dashboard to save'); if (lv.mode === 'yaml') throw new Error('this dashboard is in YAML mode: set it in the YAML');
  const dash = lv.urlPath || ssDash(), q = { type: 'lovelace/config', force: true }; if (dash) q.url_path = dash;
  const fresh = JSON.parse(JSON.stringify(await hub._hass.callWS(q))), all = [];
  const walk = (o, d) => { if (!o || typeof o !== 'object' || d > 14) return; if (Array.isArray(o)) { o.forEach(x => walk(x, d + 1)); return; } if (o.type === 'custom:homeview-hub-card') all.push(o);
    for (const k of ['views', 'sections', 'cards', 'card', 'elements']) if (o[k]) walk(o[k], d + 1); }; walk(fresh, 0);
  const t = all.find(hvCfgMatch(hub)) || (all.length === 1 ? all[0] : null); if (!t) throw new Error('this Home Screen card changed since the page loaded: reload the page and try again');
  for (const k of Object.keys(patch)) { if (patch[k] == null) delete t[k]; else t[k] = patch[k]; }
  if (typeof lv.saveConfig === 'function' && (lv.urlPath || null) === (dash || null)) await lv.saveConfig(fresh);
  else { const sv = { type: 'lovelace/config/save', config: fresh }; if (dash) sv.url_path = dash; await hub._hass.callWS(sv); }
  return JSON.parse(JSON.stringify(t)); }
/* 1.31.1: full-height popups (on by default; Home Screen card `full_height_popups: false` turns them off). Every sheet / popup of the dashboard
   (Home Screen sheets, room picker, assistant, calendar event, browser_mod popups, more-info) reaches the top of the screen,
   keeps its content below the status bar / notch (safe area) and can be swiped down to close: from the handle / header, or
   anywhere while the content under the finger is scrolled to the top. Off: nothing below runs. */
const HV_FH_SAFE = 'var(--hv-safe-top, env(safe-area-inset-top, 0px))';
let hvFhC = { cfg: null, on: false };
const hvFullPopups = () => { const root = HVT.root && HVT.root.isConnected ? HVT.root : null, lv = root && root.lovelace, cfg = lv && lv.config; if (!cfg) return false;
  if (lv.urlPath && decodeURIComponent(location.pathname.split('/')[1] || '') !== lv.urlPath) return false; // another dashboard is showing
  if (cfg !== hvFhC.cfg) { const hub = hvHubCfgOf(cfg); hvFhC = { cfg, on: !!(hub && hub.full_height_popups !== false) }; } return hvFhC.on; };
const hvFhOpen = new Set(); // our full-height popups that are open
// a full-height popup is open: the page's own pull-down gestures (swipe back, screensaver) leave the top strip to it
const hvFhBusy = () => { if (!hvFullPopups()) return false; for (const h of hvFhOpen) { if (h.isConnected) return true; hvFhOpen.delete(h); } return hvDialogOpen(); };
const hvSafeTop = n => { const p = document.createElement('div'); p.style.cssText = `position:absolute;visibility:hidden;width:0;pointer-events:none;height:${HV_FH_SAFE}`;
  (n || document.body).appendChild(p); const h = p.getBoundingClientRect().height || 0; p.remove(); return h; };
const HV_FH_NODRAG = /^(INPUT|TEXTAREA|SELECT|HA-SLIDER|HA-CONTROL-SLIDER|MD-SLIDER|HA-TEXTFIELD|HA-CONTROL-CIRCULAR-SLIDER|ROUND-SLIDER|HA-CODE-EDITOR|HA-MAP|VIDEO)$/;
// swipe-down-to-close for one sheet element. o: { el (moves), on (listens; = el), grab(path, y) -> bool, close(), dragOk(path, y, h),
// apply(dy, anim, dur) (default: translate el), alive() -> bool, stop (stop the event on a handle drag so the host's own drag stays out) }
function hvSwipeClose(o) {
  let g = null; const el = o.el, on = o.on || el, H = () => el.offsetHeight || innerHeight;
  const apply = o.apply || ((dy, anim, dur) => { el.style.setProperty('transition', anim ? `transform ${dur || 0.38}s ${SHEET_EASE}` : 'none', 'important');
    el.style.setProperty('transform', `translate3d(0,${dy.toFixed(1)}px,0)`, 'important'); if (!dy && anim) setTimeout(() => { if (!g) { el.style.removeProperty('transform'); el.style.removeProperty('transition'); } }, (dur || 0.38) * 1000 + 40); });
  const scroller = path => { for (const n of path) { if (!(n instanceof Element)) continue;
    if (n.scrollHeight > n.clientHeight + 1) { const oy = getComputedStyle(n).overflowY; if (oy === 'auto' || oy === 'scroll') return n; } if (n === el) break; } return null; };
  const ts = e => { g = null; if ((o.alive && !o.alive()) || e.touches.length !== 1) return; const t = e.touches[0], path = e.composedPath(), y = t.clientY - el.getBoundingClientRect().top;
    const onGrab = !!(o.grab && o.grab(path, y)), sc = scroller(path); if (!onGrab && sc && sc.scrollTop > 1) return;
    if (!onGrab && path.some(n => n instanceof Element && (HV_FH_NODRAG.test(n.tagName) || n.getAttribute('role') === 'slider' || n.hasAttribute('data-no-sheet-drag')))) return;
    if (!onGrab && o.dragOk && !o.dragOk(path, y, H())) return;
    g = { x: t.clientX, y: t.clientY, t: Date.now(), on: false, dy: 0, grab: onGrab }; if (onGrab && o.stop) e.stopPropagation(); };
  const tm = e => { if (!g) return; const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
    if (!g.on) { if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      if (dy > 0 && (g.grab || dy >= Math.abs(dx) * 1.1)) { g.on = true; g.y0 = t.clientY; g.t = Date.now(); } else { g = null; return; } }
    if (e.cancelable) e.preventDefault(); if (o.stop) e.stopPropagation(); g.dy = Math.max(0, t.clientY - g.y0); apply(g.dy, false); };
  const te = e => { if (!g) return; const s0 = g; g = null; if (!s0.on) return; if (o.stop) e.stopPropagation(); const v = s0.dy / Math.max(1, Date.now() - s0.t);
    if (s0.dy > H() * 0.22 || (v > 0.5 && s0.dy > 40)) { apply(H() + 40, true, 0.26); setTimeout(() => o.close(), 240); } else apply(0, true, 0.38); };
  on.addEventListener('touchstart', ts, { capture: true, passive: true }); on.addEventListener('touchmove', tm, { capture: true, passive: false });
  on.addEventListener('touchend', te, true); on.addEventListener('touchcancel', te, true);
  return { get active() { return !!(g && g.on); } };
}
const HV_FH_GRAB_CSS = `.hv-fh-grab{position:absolute;left:50%;top:calc(${HV_FH_SAFE} + 6px);width:38px;height:5px;margin-left:-19px;border-radius:3px;z-index:20;pointer-events:none;background:var(--hv-fh-grab,rgba(255,255,255,.62));box-shadow:0 1px 4px rgba(0,0,30,.25)}`;
const hvFhGrab = (parent, color) => { const g = document.createElement('div'); g.className = 'hv-fh-grab'; g.setAttribute('aria-hidden', 'true');
  g.style.cssText = `position:absolute;left:50%;top:calc(${HV_FH_SAFE} + 6px);width:38px;height:5px;margin-left:-19px;border-radius:3px;z-index:20;pointer-events:none;background:${color || 'rgba(127,127,135,.55)'}`;
  parent.appendChild(g); return g; };
// ---- Home Assistant / browser_mod dialogs (climate, lights, calendar, garage, car, cameras, music, house-picture tiles, more-info)
const hvFhDeep = (root, test, d = 0) => { if (!root || d > 5) return null; for (const n of root.querySelectorAll('*')) { if (test(n)) return n; if (n.shadowRoot) { const r = hvFhDeep(n.shadowRoot, test, d + 1); if (r) return r; } } return null; };
function hvFhDialogOf(host) { const sr = host.shadowRoot; if (!sr) return null;
  const w = hvFhDeep(sr, n => (n.tagName === 'WA-DIALOG' || n.tagName === 'WA-DRAWER') && n.shadowRoot && n.hasAttribute('open'));
  const dlg = w && w.shadowRoot.querySelector('dialog[part~="dialog"], [part~="dialog"]'); return dlg ? { w, dlg } : null; }
function hvFhDialog(host, w, dlg) {
  dlg.__hvFh = true; const drawer = w.tagName === 'WA-DRAWER', phone = innerWidth <= 700 || drawer;
  const S = (k, v) => dlg.style.setProperty(k, v, 'important');
  S('top', '0'); S('bottom', '0'); S('margin-top', '0'); S('margin-bottom', '0'); S('height', '100dvh'); S('max-height', '100dvh'); S('box-sizing', 'border-box');
  S('padding-top', HV_FH_SAFE); S('border-radius', '0'); if (phone) { S('width', '100vw'); S('max-width', '100vw'); S('left', '0'); S('right', '0'); }
  if (!dlg.querySelector(':scope > .hv-fh-grab')) hvFhGrab(dlg);
  // a card in the popup that brings its own swipe-to-close (Now Playing / camera "fullscreen"): leave the gesture to it
  const own = () => !!hvFhDeep(host.shadowRoot, n => n.tagName && n.tagName.startsWith('HOMEVIEW-') && n.hasAttribute('swipe')); dlg.__hvOwn = own;
  const header = () => hvFhDeep(host.shadowRoot, n => n.tagName === 'HA-DIALOG-HEADER');
  const closeBtn = () => hvFhDeep(host.shadowRoot, n => n.tagName === 'HA-ICON-BUTTON' && (n.getAttribute('data-dialog') === 'close' || n.slot === 'headerNavigationIcon') && n.getBoundingClientRect().width > 0);
  hvSwipeClose({ el: dlg, stop: true, alive: () => w.hasAttribute('open') && !own() && hvFullPopups(),
    grab: (path, y) => { const sf = hvSafeTop(dlg); if (y < sf + 24) return true; const hd = header(); return !!(hd && path.includes(hd) && y < hd.getBoundingClientRect().bottom - dlg.getBoundingClientRect().top); },
    close: () => { const b = closeBtn(); if (b) b.click(); else if (host.closeDialog) host.closeDialog(); else w.removeAttribute('open');
      setTimeout(() => { dlg.style.removeProperty('transform'); dlg.style.removeProperty('transition'); }, 450); } });
}
const hvFhSeen = new Set();
function hvFhScan() { const ha = document.querySelector('home-assistant'), r = ha && ha.shadowRoot; if (!r) return; const now = new Set();
  for (const host of r.querySelectorAll('browser-mod-popup, ha-more-info-dialog')) { const f = hvFhDialogOf(host); if (!f) continue; const d = f.dlg; now.add(d);
    if (!d.__hvFh) { hvFhDialog(host, f.w, d); hvFhSeen.add(d); }
    // the first ~2 s after opening: hide our handle when the card inside brings its own grabber
    if ((d.__hvChk = (d.__hvChk || 0) + 1) <= 10) { const g = d.querySelector(':scope > .hv-fh-grab'); if (g) g.style.display = d.__hvOwn() ? 'none' : ''; } }
  for (const d of hvFhSeen) { if (!d.isConnected) hvFhSeen.delete(d); else if (!now.has(d)) d.__hvChk = 0; } }
let hvFhIv = null;
const hvFhWatch = () => { if (hvFhIv || !hvFullPopups()) return; hvFhIv = setInterval(() => { if (!hvFullPopups()) { clearInterval(hvFhIv); hvFhIv = null; return; } hvFhScan(); }, 200); };
// a centred card (room picker, assistant, calendar event) as a full-height sheet: el = the card, host = its shadow host, close()
const HV_FH_CARD_CSS = `:host([hv-full]) .hv-fhc{top:0 !important;bottom:0 !important;left:0 !important;right:0 !important;margin:0 auto !important;width:min(100vw,var(--hv-fh-w,640px)) !important;height:100dvh !important;max-height:100dvh !important;
 border-radius:0 !important;padding-top:calc(${HV_FH_SAFE} + var(--hv-fh-pt,22px)) !important;transform:translate3d(0,40px,0);opacity:0}
:host([hv-full].in) .hv-fhc{transform:none;opacity:1} ${HV_FH_GRAB_CSS}`;
function hvFhCard(host, sr, el, close, w, css) { host.setAttribute('hv-full', ''); hvFhOpen.add(host); el.classList.add('hv-fhc'); if (w) el.style.setProperty('--hv-fh-w', w);
  const st = document.createElement('style'); st.textContent = HV_FH_CARD_CSS + (css || ''); sr.appendChild(st); hvFhGrab(el, 'var(--hv-fh-grab,rgba(127,127,135,.55))');
  hvSwipeClose({ el, alive: () => host.isConnected, grab: (path, y) => y < hvSafeTop(el) + 30, close });
  requestAnimationFrame(() => requestAnimationFrame(() => { if (host.isConnected) host.classList.add('in'); })); }
function hvThemeTick(el, hass) {
  if (hass) HVT.hass = hass;
  const r = el && el.isConnected ? hvFindRoot(el) : null; if (r) HVT.root = r;
  const root = HVT.root && HVT.root.isConnected ? HVT.root : null, cfg = root && root.lovelace && root.lovelace.config;
  if (cfg !== HVT.cfg || location.pathname !== HVT.path) { HVT.cfg = cfg; HVT.path = location.pathname; HVT.t = cfg ? hvCfgTheme(cfg) : ''; } // config scan only when it changes
  const mode = hvMode(HVT.t, HVT.hass), key = mode + '|' + location.pathname + '|' + (root ? 1 : 0);
  if (key !== HVT.key) { HVT.key = key; HVT.cur = mode; hvThemePage(root, mode === 'day'); for (const e of HVT.els) hvThemeApply(e); }
  else if (mode === 'day' && root && HVT.page && hvViewOf(root) !== HVT.page.view) hvThemePage(root, true); // the view was re-created
  else if (mode === 'day' && HVT.page && HVT.page.view && Date.now() - HVT.page.t > 1500) { HVT.page.t = Date.now(); hvHideBgCards(HVT.page.view, HVT.page.hid); } // cards rendered later
  if (el) hvThemeApply(el);
  if (!hvFhIv) hvFhWatch(); // 1.31.1: full-height popups (only when the dashboard turned them on)
}
// own setting (Home Screen / Page Grid, also in the card editor preview) > dashboard theme
const hvOwnTheme = el => { if (el && el._hvThemeVal) return el._hvThemeVal; if (el && el._hvNight) return 'night'; // the Home Screen and everything in it: always the original look
  const c = el && el._config; return c && el._hvOwnTheme && HV_THEMES.includes(c.theme) ? c.theme : ''; };
// the Home Screen / Page Grid a card sits in (its tiles follow that card's own setting, e.g. in the card editor preview)
const hvBoxOf = el => { let n = el.parentNode || el.host; for (let i = 0; i < 40 && n; i++) { if (n._hvOwnTheme) return n; n = n.parentNode || n.host; } return null; };
const hvThemeOf = el => { let own = hvOwnTheme(el), n = el;
  for (let i = 0; !own && n && i < 8; i++) { if (n.isConnected && n._hvBox === undefined) n._hvBox = hvBoxOf(n); n = n._hvBox; if (n) own = hvOwnTheme(n); }
  return own ? hvMode(own, (el && el._hass) || HVT.hass) : (HVT.over ? hvMode(HVT.over, HVT.hass) : HVT.cur); };
const hvPopupOf = el => { let n = el; for (let i = 0; i < 40 && n; i++) { if (n.tagName === 'BROWSER-MOD-POPUP') return n; n = n.parentNode || n.host; } return null; };
function hvThemeApply(el) {
  const day = hvThemeOf(el) === 'day';
  if (el.isConnected && el._hvPop === undefined) el._hvPop = hvPopupOf(el);
  if (el._hvPop && el._hvPop.hasAttribute('hv-day') !== day) el._hvPop.toggleAttribute('hv-day', day);
  if (el.hasAttribute('hv-day') !== day) { el.toggleAttribute('hv-day', day); if (el._hvThemeChanged) try { el._hvThemeChanged(day); } catch (e) { /* ignore */ }
    if (el._hvOwnTheme) for (const e of HVT.els) if (e !== el && e._hvBox === el) hvThemeApply(e); }
}
// page level: view background + the --hv-* colours for everything in the view (native cards styled by HomeView too) and for popups
// browser_mod popups that show a NotHomeView card (e.g. the garage chooser) while Day is on: light dialog, dark text. Popups with only
// other cards keep their own look (their cards may set dark backgrounds); a popup's own style (e.g. Now Playing) always wins.
const HV_POPUP_DAY = 'browser-mod-popup[hv-day]{' + HV_DAY_VARS + ';--ha-dialog-surface-background:#f2f2f6;--mdc-theme-surface:#f2f2f6;--wa-color-surface-raised:#f2f2f6;' +
  '--primary-text-color:#1c1c1e;--secondary-text-color:rgba(60,60,67,.72);--mdc-theme-on-surface:#1c1c1e;--ha-card-background:#ffffff;--card-background-color:#ffffff;' +
  '--primary-background-color:#f2f2f6;--secondary-background-color:#e9e9ee;--divider-color:rgba(0,0,0,.08);--state-icon-color:#3c3c43;--ha-card-border-color:rgba(0,0,0,.05);' +
  '--ha-card-box-shadow:0 .3vh 1vh rgba(30,30,60,.08)}';
const HV_POPUP_SHEET = (() => { try { const s = new CSSStyleSheet(); s.replaceSync(HV_POPUP_DAY); return s; } catch (e) { return null; } })();
const HV_DAY_SHEET = (() => { try { const s = new CSSStyleSheet(); s.replaceSync(`*{${HV_DAY_VARS}}`); return s; } catch (e) { return null; } })();
const hvViewOf = root => { const hv = root && root.shadowRoot && root.shadowRoot.querySelector('hui-view'); return hv ? (hv.firstElementChild || hv) : null; };
// 1.30.7: a full-screen page-background card (card_mod: position:fixed; inset:0; z-index:-1, e.g. a "scene" sky) — it is the dark
// page behind the tiles; in Day it is hidden so the light grey page shows (Night: untouched)
const hvIsBgCard = c => { const st = c && c.card_mod && c.card_mod.style; if (!st) return false;
  const t = typeof st === 'string' ? st : typeof st === 'object' ? Object.values(st).filter(x => typeof x === 'string').join(' ') : '';
  return /position:\s*fixed/.test(t) && /inset:\s*0/.test(t) && /z-index:\s*-\d/.test(t); };
function hvHideBgCards(view, list) { if (!view || !view.shadowRoot) return;
  const walk = (r, d) => { if (d > 6) return; for (const e of r.querySelectorAll('*')) {
    if (e.tagName === 'HUI-CARD') { if (!list.includes(e) && hvIsBgCard(e.config)) { e.style.setProperty('display', 'none', 'important'); list.push(e); } continue; }
    if (e.shadowRoot && /^HUI-|^HA-/.test(e.tagName)) walk(e.shadowRoot, d + 1); } };
  walk(view.shadowRoot, 0); }
function hvThemePage(root, day) {
  const P = HVT.page; if (P) { // undo the previous page
    if (P.bg) { P.bg.style.removeProperty('background'); P.bg.style.removeProperty('--hv-day-bg'); }
    if (P.hid) P.hid.forEach(e => e.style.removeProperty('display'));
    if (P.view && P.view.shadowRoot && HV_DAY_SHEET) P.view.shadowRoot.adoptedStyleSheets = P.view.shadowRoot.adoptedStyleSheets.filter(s => s !== HV_DAY_SHEET);
    HVT.page = null; }
  if (!HVT.docStyle) { HVT.docStyle = document.createElement('style'); HVT.docStyle.id = 'homeview-theme'; }
  HVT.docStyle.textContent = day ? `html{${HV_DAY_VARS}}` : '';
  const ha = document.querySelector('home-assistant'), hr = ha && ha.shadowRoot;
  if (hr && HV_POPUP_SHEET) { const has = hr.adoptedStyleSheets.includes(HV_POPUP_SHEET);
    if (day && !has) hr.adoptedStyleSheets = [...hr.adoptedStyleSheets, HV_POPUP_SHEET]; else if (!day && has) hr.adoptedStyleSheets = hr.adoptedStyleSheets.filter(x => x !== HV_POPUP_SHEET); }
  if (day && !HVT.docStyle.isConnected) document.head.appendChild(HVT.docStyle);
  if (!day || !root || !root.shadowRoot) return;
  const bg = root.shadowRoot.querySelector('hui-view-background'), view = hvViewOf(root);
  if (bg) bg.style.setProperty('background', HV_DAY_BG, 'important');
  if (view && view.shadowRoot && HV_DAY_SHEET && !view.shadowRoot.adoptedStyleSheets.includes(HV_DAY_SHEET)) view.shadowRoot.adoptedStyleSheets = [...view.shadowRoot.adoptedStyleSheets, HV_DAY_SHEET];
  HVT.page = { bg, view, hid: [], t: 0 }; hvHideBgCards(view, HVT.page.hid);
}
// re-check after navigation (the new view's cards also tick when they connect) and when a view is re-rendered
if (!window.__hvThemeNav) { window.__hvThemeNav = true;
  const later = () => setTimeout(() => { HVT.key = ''; hvThemeTick(null); }, 60);
  window.addEventListener('location-changed', later); window.addEventListener('popstate', later); }
// hooks every NotHomeView card class (hass setter + connect / disconnect) — no change to the cards themselves
function hvThemeWrap(cls) {
  const P = cls.prototype; let p = P, d = null;
  while (p && p !== HTMLElement.prototype) { d = Object.getOwnPropertyDescriptor(p, 'hass'); if (d && d.set) break; d = null; p = Object.getPrototypeOf(p); }
  if (d && !d.set.__hvT) { const set = d.set; const ns = function (h) { set.call(this, h); hvThemeTick(this, h); }; ns.__hvT = true; Object.defineProperty(p, 'hass', Object.assign({}, d, { set: ns })); }
  const sc = P.setConfig; if (sc && !sc.__hvT) { const f = function (c) { const r = sc.call(this, c); if (this.isConnected) hvThemeTick(this); return r; }; f.__hvT = true; P.setConfig = f; }
  const cc = P.connectedCallback; if (!cc || !cc.__hvT) { const f = function () { HVT.els.add(this); if (cc) cc.call(this); hvThemeTick(this, this._hass); }; f.__hvT = true; P.connectedCallback = f; }
  const dc = P.disconnectedCallback; if (!dc || !dc.__hvT) { const f = function () { HVT.els.delete(this); if (this._hvPop) { this._hvPop.removeAttribute('hv-day'); } this._hvPop = undefined; this._hvBox = undefined; if (dc) dc.call(this); }; f.__hvT = true; P.disconnectedCallback = f; }
}
// popups / sheets built by the cards themselves (attached to <body>) follow the current theme
const hvDayNow = () => HVT.cur === 'day';

/* ---------------- required plugins (1.30.5): a friendly hint instead of silently doing nothing ----------------
 * Wallpanel (HACS) runs the screensaver. Without it the screensaver features (Home Screen swipe / hold, the screensaver button,
 * the Screensaver Settings card) can't work: the card editors say so, and a card that is set up for it shows a small note.
 * Nothing is shown when Wallpanel is installed (it defines <wallpanel-view>); the hint also disappears as soon as it loads. */
const HV_WP_HINT = "Wallpanel isn't installed. Install it from HACS to use the screensaver.";
const HV_WP_URL = 'https://github.com/j-a-n/lovelace-wallpanel';
const hvHasWallpanel = () => !!customElements.get('wallpanel-view');
// Wallpanel is loaded as a dashboard resource like this bundle, possibly a moment later: only call it "missing" once the page has settled
const hvWpMissing = () => !hvHasWallpanel() && (performance.now() > 12000 || document.readyState === 'complete' && performance.now() > 6000);
let hvWpWait = null;
const hvWhenWallpanel = f => { if (!hvWpWait) hvWpWait = customElements.whenDefined('wallpanel-view'); hvWpWait.then(f).catch(() => {}); };
function hvWpHint(box, want) { // box = an editor element (light DOM); shows / removes one hint at the top
  let el = box.querySelector(':scope > .hv-wp-hint');
  const show = !!want && !hvHasWallpanel();
  if (!show) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div'); el.className = 'hv-wp-hint'; el.setAttribute('role', 'note');
    el.style.cssText = 'display:flex;gap:10px;align-items:flex-start;margin:0 0 14px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;' +
      'background:rgba(3,169,244,.12);border:1px solid rgba(3,169,244,.35);color:var(--primary-text-color,#1c1c1e)';
    el.innerHTML = `<ha-icon icon="mdi:information-outline" style="--mdc-icon-size:20px;color:#039be5;flex:none;display:flex;margin-top:1px"></ha-icon><span>${esc(HV_WP_HINT)} <a href="${HV_WP_URL}" target="_blank" rel="noopener" style="color:inherit;font-weight:600">Wallpanel on GitHub</a></span>`;
    box.insertBefore(el, box.firstChild);
    hvWhenWallpanel(() => el.remove());
  } else if (box.firstChild !== el) box.insertBefore(el, box.firstChild);
}

// debugging / tests: window.__hvTheme.get() -> 'day' | 'night'; .refresh() re-reads the dashboard config
window.__hvTheme = { get: () => HVT.cur, info: () => ({ cur: HVT.cur, t: HVT.t, root: !!HVT.root, rootOn: !!(HVT.root && HVT.root.isConnected), els: HVT.els.size, key: HVT.key }), refresh: () => { HVT.cfg = undefined; HVT.key = ''; hvThemeTick(null); return HVT.cur; } };

/* Now Playing popup (used by the Music tile's tap): browser_mod 3.x popup style, identical to the hand-written popup it replaces */
const NP_POPUP_CSS = "ha-dialog,ha-adaptive-dialog{--dialog-surface-margin-top:max(8px, calc((var(--hv-vh, 100dvh) - min(calc(var(--hv-vh, 100dvh) - 24px), 640px)) / 2)) !important;--popup-min-height:0px !important;--popup-max-height:calc(100dvh - 16px) !important;--popup-border-radius:30px !important;--popup-min-width:min(94vw,660px) !important;--popup-max-width:94vw !important;--popup-width-full:94vw !important;--popup-padding-x:0px !important;--popup-padding-y:0px !important;--ha-dialog-surface-background:transparent;--mdc-theme-surface:transparent;--wa-color-surface-raised:transparent;--ha-card-background:transparent;--card-background-color:transparent;--primary-text-color:#fff;--dialog-box-shadow:none;--dialog-backdrop-filter:blur(6px);--mdc-dialog-scrim-color:rgba(0,0,20,.35)}.content .container{padding:0 !important}@media (max-height:520px){ha-dialog,ha-adaptive-dialog{--popup-min-width:min(94vw,800px) !important;--popup-max-height:100dvh !important}.content .container{padding:12px 0 !important}}";
const NP_POPUP_HEIGHT = "min(calc(var(--hv-vh, 100dvh) - 24px), 640px)";
// full screen: edge to edge, no radius; the card itself pads for the safe areas
const NP_POPUP_CSS_FS = "ha-dialog,ha-adaptive-dialog{--dialog-surface-margin-top:0px !important;--popup-min-height:100dvh !important;--popup-max-height:100dvh !important;--popup-border-radius:0px !important;--popup-min-width:100vw !important;--popup-max-width:100vw !important;--popup-width-full:100vw !important;--ha-dialog-width-full:100vw !important;--popup-padding-x:0px !important;--popup-padding-y:0px !important;--ha-dialog-surface-background:transparent;--mdc-theme-surface:transparent;--wa-color-surface-raised:transparent;--ha-card-background:transparent;--card-background-color:transparent;--primary-text-color:#fff;--dialog-box-shadow:none;--dialog-backdrop-filter:none;--mdc-dialog-scrim-color:rgba(0,0,12,.55);--safe-area-inset-top:0px;--safe-area-inset-right:0px;--safe-area-inset-bottom:0px;--safe-area-inset-left:0px;--safe-area-offset-top:0px;--safe-area-offset-right:0px;--safe-area-offset-bottom:0px;--safe-area-offset-left:0px;--safe-width:100vw;--safe-height:100dvh}.content .container{padding:0 !important}";
const NP_POPUP_HEIGHT_FS = 'var(--hv-vh, 100dvh)';
const NP_TILE_KEYS = ['art_background', 'auto_select', 'show_progress', 'show_volume', 'show_output', 'show_extra', 'uppercase_title'];
const NP_TILE_DEFAULTS = Object.assign(Object.fromEntries(NP_TILE_KEYS.map(k => ['np_' + k, true])), { np_popup_style: 'fullscreen' });

/* ---------------- shared styles ---------------- */
const BASE_CSS = `
/* fills its grid cell; where the parent has no height (card editor preview, masonry) it falls back to a tile ratio */
:host{display:block;height:100%;width:100%;aspect-ratio:var(--hv-aspect,1.12);container-type:size;-webkit-tap-highlight-color:transparent}
/* responsive sizes (grid rows: auto): height follows the width via the tile shape; text never smaller than a phone-readable minimum */
:host([auto]){height:auto;aspect-ratio:var(--hv-aspect,1.12)}
:host([auto]) .p{font-size:max(13px,min(11.5cqh,7cqw))} :host([auto]) .s{font-size:max(11px,min(9.6cqh,5.9cqw))}
/* inside a NotHomeView Page Grid (narrow portrait tiles): text follows the width more, never below phone size */
:host([floor]) .p{font-size:max(13px,min(11.5cqh,10cqw))} :host([floor]) .s{font-size:max(11px,min(9.6cqh,8cqw))}
:host([floor]) .ic{width:min(34cqh,30cqw);height:min(34cqh,30cqw)} :host([floor]) .ic ha-state-icon,:host([floor]) .ic ha-icon{--mdc-icon-size:min(30cqh,26cqw);width:min(30cqh,26cqw);height:min(30cqh,26cqw)}
/* "Light style while the sun is up": white glass, dark text (for light / sky backgrounds) */
:host([day]){--hv-bg:linear-gradient(150deg,rgba(255,255,255,.82) 0%,rgba(255,255,255,.64) 100%);--hv-border:rgba(255,255,255,.95);--hv-text:#14263b;--hv-text2:#4b6079;--hv-text-strong:#14263b;
 --hv-icon:#2c4a6b;--hv-shade:none;--hv-icon-shade:none;--hv-shadow:0 4px 16px rgba(40,90,140,.14);--hv-bg-on:linear-gradient(150deg,rgba(220,211,255,.96) 0%,rgba(190,175,255,.88) 100%);
 --hv-border-on:rgba(255,255,255,.95);--hv-text-on:#1f1747;--hv-text2-on:#4a3f80;--hv-icon-on:#4b3bb5;--hv-shadow-on:0 4px 16px rgba(80,60,180,.18)}
/* day style must also win over theme-level card styles (e.g. a glass theme that makes every ha-card transparent) */
:host([day]) ha-card{--frosted-glass-card-layer-content:none;background:var(--hv-bg);border:1px solid var(--hv-border);box-shadow:var(--hv-shadow);
 backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%)}
:host([day]) ha-card.active{background:var(--hv-bg-on);border-color:var(--hv-border-on);box-shadow:var(--hv-shadow-on)}
${HV_DAY_HOST}
/* Day: white tiles also where a glass HA theme (card-mod) makes every ha-card transparent */
:host([hv-day]) ha-card{--frosted-glass-card-layer-content:none;background:var(--hv-bg) !important;border-color:var(--hv-border) !important;box-shadow:var(--hv-shadow) !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important}
:host([hv-day]) ha-card.active{background:var(--hv-bg-on) !important;border-color:var(--hv-border-on) !important;box-shadow:var(--hv-shadow-on) !important}
:host([hv-day]) ha-card::before{content:none !important;display:none !important}
ha-card{position:relative;height:100%;width:100%;box-sizing:border-box;overflow:hidden;font-family:${FONT};cursor:pointer;
 background:var(--hv-bg,linear-gradient(150deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.07) 100%));
 border:1px solid var(--hv-border,rgba(255,255,255,.25));border-radius:var(--hv-radius,min(5.6vh,3vw));
 box-shadow:var(--hv-shadow,inset 0 1px 0 rgba(255,255,255,.25),0 1.2vh 3.6vh rgba(6,8,60,.26));
 backdrop-filter:var(--hv-blur,blur(26px) saturate(180%));-webkit-backdrop-filter:var(--hv-blur,blur(26px) saturate(180%));
 --ha-card-border-radius:var(--hv-radius,min(5.6vh,3vw));color:var(--hv-text,#fff);
 transition:background .25s ease,box-shadow .25s ease;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;outline:none}
ha-card.active{background:var(--hv-bg-on,linear-gradient(150deg,rgba(196,182,255,.46) 0%,rgba(160,140,250,.34) 100%));
 border-color:var(--hv-border-on,rgba(225,215,255,.42));box-shadow:var(--hv-shadow-on,inset 0 1px 0 rgba(255,255,255,.35),0 1.2vh 3.6vh rgba(50,30,160,.30))}
ha-card:focus-visible{box-shadow:0 0 0 2px var(--hv-accent,#d4c9ff)}
ha-card.unavailable .c{opacity:.45}
ha-ripple{--ha-ripple-color:var(--hv-text,#fff);--ha-ripple-hover-opacity:.04;--ha-ripple-pressed-opacity:.10;border-radius:inherit}
/* tile layout = native vertical tile card as styled by HomeView */
.c{height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:8px;text-align:center;pointer-events:none}
.ic{width:min(34cqh,22cqw);height:min(34cqh,22cqw);display:flex;align-items:center;justify-content:center;flex:none}
.ic ha-state-icon,.ic ha-icon{--mdc-icon-size:min(30cqh,20cqw);width:min(30cqh,20cqw);height:min(30cqh,20cqw);color:var(--hv-icon,#fff);filter:var(--hv-icon-shade,drop-shadow(0 .3vh .8vh rgba(0,0,40,.25)));display:flex}
.active .ic ha-state-icon,.active .ic ha-icon{color:var(--hv-icon-on,#f3efff)}
.tx{width:100%;min-width:0;display:flex;flex-direction:column;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.p,.s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.p{font-size:min(11.5cqh,7cqw);font-weight:650;color:var(--hv-text,#fff)}
.s{font-size:min(9.6cqh,5.9cqw);font-weight:500;color:var(--hv-text2,rgba(255,255,255,.66))}
.active .p{color:var(--hv-text-on,#fff)} .active .s{color:var(--hv-text2-on,rgba(255,255,255,.8))}
/* button layout = native button card as styled by HomeView (scenes) */
.c.btn{gap:0;justify-content:center;padding:7cqh 5cqw 8cqh}
.c.btn .ic{flex:1;width:min(30cqh,20cqw);height:auto;max-height:80%}
.c.btn .tx{flex:none;margin-top:8px}
`;

/* ---------------- base card ---------------- */
class HVBase extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return {}; }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this.validate(config);
    this._config = Object.assign({}, this.constructor.defaults, config);
    this.toggleAttribute('auto', !!(config.grid_options && config.grid_options.rows === 'auto'));
    this._built = false; this._sig = null; this._render();
  }
  validate(c) { if (this.constructor.needsEntity && !c.entity) throw new Error('Please choose an entity'); }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  watched() { const c = this._config || {}; return [c.entity].concat(c.entities || []).filter(Boolean).map(e => typeof e === 'string' ? e : e.entity).concat(tplEntities(c.label)); }
  get stateObj() { return this._hass && this._config.entity ? this._hass.states[this._config.entity] : undefined; }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 3, rows: 2, min_columns: 2, min_rows: 1 }; }
  getLayoutOptions() { const g = this.getGridOptions(); return { grid_columns: g.columns === 'full' ? 'full' : Math.max(1, Math.round(g.columns / 3)), grid_rows: g.rows, grid_min_columns: Math.max(1, Math.round((g.min_columns || 3) / 3)), grid_min_rows: g.min_rows }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  // --- rendering
  _render() {
    if (!this._config || !this._hass) return;
    const sun = this._config.day_light && this._hass.states['sun.sun'] ? this._hass.states['sun.sun'].state : '';
    const sig = JSON.stringify(this.watched().map(e => { const s = this._hass.states[e]; return s ? [s.state, s.last_updated, s.attributes] : 0; })) + (this._pending ?? '') + (this._hass.locale && this._hass.locale.language) + sun;
    const loc = this._hass.formatEntityState || this._hass.localize;
    if (this._built && sig === this._sig && loc === this._loc) return;
    this._loc = loc;
    this._loadTranslations();
    this._sig = sig;
    if (!this._built) this._build();
    this._applyColors();
    this.update();
    if (this.hasAttribute('floor')) this._fitSoon();
  }
  // Page-grid tiles: a label that doesn't fit is scaled down (to at most 62%) instead of being cut off with "...".
  _fitSoon() { cancelAnimationFrame(this._fitRaf); this._fitRaf = requestAnimationFrame(() => this._fitText());
    if (window.ResizeObserver && !this._fitRo) { this._fitRo = new ResizeObserver(() => this._fitSoon()); this._fitRo.observe(this); } }
  _fitText() {
    if (!this.isConnected || !this.hasAttribute('floor')) return;
    for (const el of this.shadowRoot.querySelectorAll('.p,.s,.n,.l,.sub,.nm,.lc')) {
      el.style.fontSize = ''; const w = el.clientWidth; if (!w || el.scrollWidth <= w + 1) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 14; el.style.fontSize = Math.max(fs * 0.62, fs * w / el.scrollWidth * 0.97) + 'px';
    }
  }
  _loadTranslations() { // entity-state translations are loaded per domain on demand (native cards do the same)
    const h = this._hass; if (!h.loadBackendTranslation) return;
    for (const e of this.watched()) { const d = domainOf(e); if (d && !(HVBase._tl || (HVBase._tl = new Set())).has(d)) { HVBase._tl.add(d); for (const cat of ['entity_component', 'entity', 'state']) try { const p = h.loadBackendTranslation(cat, d); if (p && p.catch) p.catch(() => {}); } catch (x) {} } }
  }
  _build() {
    this.shadowRoot.innerHTML = `<style>${BASE_CSS}${this.constructor.css || ''}</style><ha-card tabindex="0" role="button"><ha-ripple></ha-ripple><div class="root"></div></ha-card>`;
    this._card = this.shadowRoot.querySelector('ha-card'); this._root = this.shadowRoot.querySelector('.root');
    this._root.style.cssText = 'height:100%;width:100%';
    this._bindPointer(this._card); this._built = true;
  }
  _applyColors() {
    const c = this._config, set = (k, v) => v ? this.style.setProperty(k, v) : this.style.removeProperty(k);
    set('--hv-text', c.text_color); set('--hv-text-on', c.text_color); set('--hv-text-strong', c.text_color);
    set('--hv-icon', c.icon_color || c.text_color); set('--hv-icon-on', c.icon_color || c.text_color);
    set('--hv-bg', c.background_color); set('--hv-bg-on', c.accent_color);
    set('--hv-border-on', c.accent_color ? 'transparent' : '');
    set('--hv-aspect', c.aspect ? String(c.aspect) : '');
    const sun = this._hass && this._hass.states['sun.sun'];
    this.toggleAttribute('day', !!(c.day_light && sun && sun.state === 'above_horizon'));
  }
  // tile body; subclasses provide view() => {icon, stateObj, name, secondary, active, layout}
  update() {
    const v = this.view(), s = v.stateObj;
    this._card.classList.toggle('active', !!v.active);
    this._card.classList.toggle('unavailable', !!(s && s.state === 'unavailable'));
    this._root.innerHTML = `<div class="c ${v.layout === 'button' ? 'btn' : ''}"><div class="ic"></div><div class="tx">
      ${v.name !== '' ? `<div class="p">${esc(v.name)}</div>` : ''}${v.secondary != null && v.secondary !== '' ? `<div class="s">${esc(v.secondary)}</div>` : ''}</div></div>`;
    const ic = this._root.querySelector('.ic');
    if (s || !v.icon) { const i = document.createElement('ha-state-icon'); i.hass = this._hass; i.stateObj = s; if (v.icon) i.icon = v.icon; ic.appendChild(i); }
    else { const i = document.createElement('ha-icon'); i.icon = v.icon; ic.appendChild(i); }
    this._card.setAttribute('aria-label', [v.name, v.secondary].filter(Boolean).join(', '));
  }
  name(def) { const c = this._config, s = this.stateObj; return c.name != null ? c.name : (s ? (s.attributes.friendly_name || s.entity_id) : (def || '')); }
  // --- actions (tap / hold), handled by Home Assistant itself via the standard "hass-action" event
  actionConfig(kind) { const c = this._config; return c[kind + '_action'] || this.defaultAction(kind); }
  defaultAction(kind) { return { action: kind === 'tap' ? 'more-info' : 'more-info' }; }
  hasHold() { const a = this.actionConfig('hold'); return a && a.action !== 'none'; }
  runAction(kind) {
    const cfg = this.actionConfig(kind);
    if (!cfg || cfg.action === 'none') return;
    if (this.customAction && this.customAction(kind, cfg)) return;
    if (navigator.vibrate && kind === 'hold') try { navigator.vibrate(30); } catch (e) {}
    fire(this, 'hass-action', { config: { entity: this._config.entity, [kind + '_action']: cfg }, action: kind });
  }
  _bindPointer(el) {
    let timer = null, held = false, down = false, sx = 0, sy = 0;
    const cancel = () => { clearTimeout(timer); timer = null; down = false; held = false; };
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.composedPath().some(n => n.dataset && n.dataset.own !== undefined)) return; // own sub-buttons (chevrons)
      down = true; held = false; sx = e.clientX; sy = e.clientY; clearTimeout(timer);
      timer = setTimeout(() => { timer = null; held = true; }, 500);
    });
    el.addEventListener('pointermove', e => { if (down && Math.hypot(e.clientX - sx, e.clientY - sy) > 12) cancel(); });
    el.addEventListener('pointerup', e => {
      if (!down) return; const wasHeld = held; cancel();
      if (wasHeld && this.hasHold()) this.runAction('hold'); else this.runAction('tap');
    });
    el.addEventListener('pointercancel', cancel); el.addEventListener('pointerleave', cancel);
    el.addEventListener('contextmenu', e => { e.preventDefault(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.runAction('tap'); } });
  }
}

/* ---------------- thermostat ---------------- */
class HVThermostatCard extends HVBase {
  static get needsEntity() { return true; }
  static get defaults() { return { step: 0.5 }; }
  static getStubConfig(hass) { const e = Object.keys(hass.states).find(k => k.startsWith('climate.')); return { entity: e || 'climate.example', name: 'Thermostat', room: '', step: 0.5 }; }
  validate(c) { super.validate(c); if (domainOf(c.entity) !== 'climate') throw new Error('homeview-thermostat-card needs a climate entity'); }
  getCardSize() { return 4; }
  getGridOptions() { return this._config && this._config.compact ? { columns: 3, rows: 2, min_columns: 2, min_rows: 1 } : { columns: 6, rows: 4, min_columns: 3, min_rows: 2 }; }
  static get css() { return `
ha-card{cursor:pointer}
.th{height:100%;line-height:normal;display:grid;grid-template-areas:"temp temp temp" "down n up" "down l up";grid-template-rows:1fr min-content min-content;grid-template-columns:24% 1fr 24%;
 text-align:center;color:var(--hv-text,#fff)}
.th.compact{grid-template-areas:"temp temp temp" "down n up";grid-template-rows:1fr min-content;grid-template-columns:26% 1fr 26%}
.temp{grid-area:temp;align-self:center;justify-self:center;padding-top:4cqh;color:var(--hv-text-strong,var(--hv-text,#fff));pointer-events:none}
.big{font-family:${ROUND};font-weight:300;font-size:min(50cqh,30cqw);line-height:1.05;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.dec{font-size:.42em;letter-spacing:0}.deg{font-size:.42em;vertical-align:top;position:relative;top:.08em;margin-left:.04em;opacity:.85}
.sub{font-size:min(4.8cqh,2.9cqw);font-weight:550;opacity:.62;margin-top:1.4cqh;letter-spacing:.02em}
.n{grid-area:n;font-size:min(6.2cqh,3.6cqw);font-weight:650;margin-top:1cqh;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--hv-text,#fff);text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25));pointer-events:none}
.l{grid-area:l;font-size:min(5.2cqh,3cqw);font-weight:500;margin-top:.5cqh;padding-bottom:6cqh;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--hv-text2,rgba(255,255,255,.66));pointer-events:none}
.compact .n{font-size:min(10.5cqh,6.6cqw);padding-bottom:7cqh}
.ch{display:flex;align-items:center;justify-content:center;height:100%;border-radius:var(--hv-radius,min(5.6vh,3vw));cursor:pointer;touch-action:manipulation}
.ch.down{grid-area:down}.ch.up{grid-area:up}
.ch ha-icon{--mdc-icon-size:min(17cqh,11cqw);width:min(17cqh,11cqw);height:min(17cqh,11cqw);color:var(--hv-icon,#fff);display:flex;transition:transform .12s ease}
.compact .ch ha-icon{--mdc-icon-size:min(30cqh,18cqw);width:min(30cqh,18cqw);height:min(30cqh,18cqw)}
.ch:active ha-icon{transform:scale(.86)}
.ch.dis{opacity:.3;pointer-events:none}
:host([auto]) .n{font-size:max(13px,min(6.2cqh,3.6cqw))} :host([auto]) .compact .n{font-size:max(13px,min(10.5cqh,6.6cqw))}
:host([auto]) .l{font-size:max(11px,min(5.2cqh,3cqw))} :host([auto]) .sub{font-size:max(11px,min(4.8cqh,2.9cqw))}
:host([floor]) .n{font-size:max(13px,min(6.2cqh,6cqw))} :host([floor]) .l{font-size:max(11px,min(5.2cqh,5cqw))} :host([floor]) .sub{font-size:max(11px,min(4.8cqh,4.6cqw))}
:host([floor]) .compact .n{font-size:max(13px,min(10.5cqh,9cqw))} :host([floor]) .big{font-size:min(50cqh,40cqw)}`; }
  defaultAction() { return { action: 'more-info' }; }
  _build() {
    super._build();
    this._root.innerHTML = `<div class="th"><div class="temp"></div><div class="ch down" data-own><ha-icon icon="mdi:chevron-down"></ha-icon></div>
      <div class="n"></div><div class="l"></div><div class="ch up" data-own><ha-icon icon="mdi:chevron-up"></ha-icon></div></div>`;
    const stop = e => e.stopPropagation();
    for (const [sel, dir] of [['.down', -1], ['.up', 1]]) {
      const b = this._root.querySelector(sel);
      b.addEventListener('pointerdown', stop); b.addEventListener('pointerup', stop);
      b.addEventListener('click', e => { e.stopPropagation(); this._nudge(dir); });
    }
  }
  _target() { const s = this.stateObj; if (!s) return NaN; return this._pending != null ? this._pending : parseFloat(s.attributes.temperature); }
  _nudge(dir) {
    const s = this.stateObj; if (!s) return;
    const a = s.attributes, step = Number(this._config.step) || 0.5;
    let t = this._target(); if (isNaN(t)) t = parseFloat(a.current_temperature) || 20;
    t = Math.round((t + dir * step) / step) * step;
    t = Math.max(a.min_temp ?? 5, Math.min(a.max_temp ?? 35, t));
    t = Math.round(t * 100) / 100;
    this._pending = t; this._render();
    clearTimeout(this._deb);
    this._deb = setTimeout(() => {
      const v = this._pending; this._hass.callService('climate', 'set_temperature', { entity_id: this._config.entity, temperature: v })
        .catch(err => console.warn('homeview-thermostat-card', err));
      setTimeout(() => { if (this._pending === v) { this._pending = null; this._sig = null; this._render(); } }, 4000);
    }, 600);
  }
  update() {
    const c = this._config, s = this.stateObj, a = s ? s.attributes : {};
    const g = c.grid_options || {}, small = !!c.compact || (typeof g.rows === 'number' && g.rows <= 2);
    const th = this._root.querySelector('.th'); th.classList.toggle('compact', small);
    this._card.classList.toggle('unavailable', !s || UNAVAILABLE.includes(s.state));
    const t = this._target(); let i = '--', f = '';
    if (!isNaN(t)) { i = Math.trunc(t); const d = Math.round((t - i) * 10); f = d ? '.' + Math.abs(d) : ''; }
    const cur = a.current_temperature != null ? (Math.round(a.current_temperature * 10) / 10) + '°' : '';
    const mode = !s ? '' : s.state === 'off' ? 'Off' : a.hvac_action === 'heating' ? 'Heating' : a.hvac_action === 'cooling' ? 'Cooling'
      : ({ heat: 'Heat', cool: 'Cool', heat_cool: 'Auto', auto: 'Auto', dry: 'Dry', fan_only: 'Fan' }[s.state] || s.state);
    this._root.querySelector('.temp').innerHTML = `<div class="big">${i}<span class="dec">${f}</span><span class="deg">°</span></div>` +
      (small ? '' : `<div class="sub">${esc(mode)}${cur ? ' · Now ' + cur : ''}</div>`);
    this._root.querySelector('.n').textContent = c.name != null ? c.name : 'Thermostat';
    const l = this._root.querySelector('.l'); l.textContent = c.room || ''; l.style.display = small ? 'none' : '';
    const off = !s || isNaN(parseFloat(a.temperature));
    this._root.querySelectorAll('.ch').forEach(b => b.classList.toggle('dis', off && this._pending == null));
    this._card.setAttribute('aria-label', `${c.name || 'Thermostat'} ${isNaN(t) ? '' : t + '°'} ${mode}`);
  }
}

/* ---------------- generic entity ---------------- */
class HVEntityCard extends HVBase {
  static get needsEntity() { return true; }
  static getStubConfig(hass) { const e = Object.keys(hass.states).find(k => /^(switch|light|fan|input_boolean)\./.test(k)) || Object.keys(hass.states)[0]; return { entity: e }; }
  view() {
    const c = this._config, s = this.stateObj;
    const noAttr = c.attribute && c.empty_label && (!s || s.attributes[c.attribute] == null || s.attributes[c.attribute] === '');
    let sec = c.label != null && c.label !== '' ? fmtTpl(this._hass, c.label, s) : noAttr ? c.empty_label : (c.attribute ? fmtAttr(this._hass, s, c.attribute) : fmtState(this._hass, s));
    if (c.show_state === false && !c.label) sec = '';
    const active = c.active === 'always' ? true : c.active === 'never' ? false
      : c.active === 'running' ? [s, ...tplEntities(c.label).map(e => this._hass.states[e])].some(isRunning) : stateActive(s);
    return { stateObj: s, icon: c.icon, name: this.name(), secondary: s ? sec : 'Not found', active, layout: c.layout };
  }
}
class HVLightCard extends HVEntityCard {
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('light.')) || 'light.example' }; }
  defaultAction(kind) { return { action: kind === 'tap' ? 'toggle' : 'more-info' }; }
  view() {
    const c = this._config, s = this.stateObj, h = this._hass;
    let sec = '';
    if (s) sec = s.state === 'on' && s.attributes.brightness != null ? Math.round(s.attributes.brightness / 2.55) + '%' : fmtState(h, s);
    if (c.room) sec = c.room + ' · ' + sec;
    if (c.show_state === false) sec = c.room || '';
    return { stateObj: s, icon: c.icon, name: this.name(), secondary: s ? sec : 'Not found', active: stateActive(s), layout: c.layout };
  }
}
class HVGarageCard extends HVEntityCard {
  static get defaults() { return { confirm: true, show_both: true, both_label: 'Open both' }; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('cover.')) || 'cover.example', name: 'Garage', confirm: true }; }
  validate(c) { super.validate(c); if (domainOf(c.entity) !== 'cover') throw new Error('homeview-garage-card needs a cover entity'); }
  watched() { const c = this._config || {}; return [c.entity, c.entity_b].filter(Boolean).concat(tplEntities(c.label)); }
  defaultAction(kind) {
    if (kind !== 'tap') return { action: 'more-info' };
    const c = this._config, s = this.stateObj, closed = !s || ['closed', 'closing'].includes(s.state);
    const a = { action: 'perform-action', perform_action: closed ? 'cover.open_cover' : 'cover.close_cover', target: { entity_id: c.entity } };
    if (c.confirm !== false) a.confirmation = { text: c.confirm_text || `${closed ? 'Open' : 'Close'} ${this.name('the garage door')}?` };
    return a;
  }
  // Chooser mode (1.29): tap opens a popup to open door 1, door 2 or both (cover.open_cover only, never close).
  view() {
    const v = super.view(), c = this._config;
    if (!c.chooser || !c.entity_b || !this._hass) return v;
    const h = this._hass, a = h.states[c.entity], b = h.states[c.entity_b], isO = x => !!x && GC_OPEN.includes(x.state);
    const an = c.door_name || (a && a.attributes.friendly_name) || 'Garage Door', bn = c.door_b_name || (b && b.attributes.friendly_name) || 'Garage Door B';
    let sec;
    if (isO(a) && isO(b)) sec = 'Both open'; else if (isO(a)) sec = an + ' open'; else if (isO(b)) sec = bn + ' open';
    else sec = a && b && a.state === b.state ? fmtState(h, a) : (fmtState(h, a) || '\u2014');
    if (c.show_state === false || (c.label != null && c.label !== '')) sec = v.secondary; // hidden / custom sub-label wins
    return Object.assign(v, { secondary: sec, stateObj: isO(b) && !isO(a) ? b : a,
      active: c.active === 'always' ? true : c.active === 'never' ? false : (stateActive(a) || stateActive(b)) });
  }
  chooserData() {
    const c = this._config, content = { type: 'custom:homeview-garage-chooser-card', entity: c.entity };
    for (const k of ['entity_b', 'door_name', 'door_b_name']) if (c[k]) content[k] = c[k];
    if (c.both_label && c.both_label !== 'Open both') content.both_label = c.both_label;
    if (c.show_both === false) content.show_both = false;
    return { title: c.chooser_title || 'Garage', content, dismissable: true, size: 'normal' };
  }
  openChooser() {
    if (!window.browser_mod) { fire(this, 'hass-more-info', { entityId: this._config.entity }); return; } // browser_mod not installed
    fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data: this.chooserData() } });
  }
  runAction(kind) {
    if (kind === 'tap' && this._config.chooser) { this.openChooser(); return; }
    super.runAction(kind);
  }
}
/* ---------------- garage chooser (popup content, also usable as a card) ---------------- */
// Two garage doors + "open both". Shows each door's live state; a button calls cover.open_cover on that door (or both) and
// closes the popup. It never closes a door. Everything is editable in the visual editor (door entities, names, open-both button).
const GC_OPEN = ['open', 'opening'];
class HVGarageChooserCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { both_label: 'Open both', show_both: true }; }
  static getStubConfig(hass) {
    const g = Object.keys(hass.states).filter(k => k.startsWith('cover.') && (hass.states[k].attributes.device_class === 'garage' || /garage/.test(k)));
    return { entity: g[0] || 'cover.example', entity_b: g[1] || '' };
  }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  setConfig(c) {
    if (!c || !c.entity) throw new Error('Please choose the first garage door');
    this._config = Object.assign({}, this.constructor.defaults, c); this._sig = null; this._render();
  }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: 6, rows: 3, min_columns: 3, min_rows: 2 }; }
  _doors() {
    const c = this._config, h = this._hass, out = [];
    const add = (id, nm, def) => { if (!id) return; const st = h && h.states[id]; out.push({ id, st, name: nm || (st && st.attributes.friendly_name) || def }); };
    add(c.entity, c.door_name, 'Garage Door'); add(c.entity_b, c.door_b_name, 'Garage Door B');
    return out;
  }
  _stateText(d) {
    const x = d.st ? d.st.state : '';
    if (!d.st) return 'Not found';
    if (x === 'open') return 'Open'; if (x === 'opening') return 'Opening\u2026'; if (x === 'closing') return 'Closing\u2026'; if (x === 'closed') return 'Closed';
    return x === 'unavailable' ? 'Unavailable' : (this._hass.formatEntityState ? this._hass.formatEntityState(d.st) : x);
  }
  _render() {
    if (!this._config || !this._hass) return;
    const ds = this._doors(), c = this._config;
    const sig = JSON.stringify([ds.map(d => [d.id, d.name, d.st && d.st.state]), c.both_label, c.show_both, this._busy || '']);
    if (sig === this._sig) return; this._sig = sig;
    const btn = (cls, key, icon, name, sub, dis, isOpen) => `<button class="${cls}${isOpen ? ' open' : ''}${this._busy === key ? ' busy' : ''}" data-k="${key}"${dis ? ' disabled' : ''}>
      <ha-icon icon="${icon}"></ha-icon><span class="t"><span class="n">${esc(name)}</span><span class="s">${esc(sub)}</span></span></button>`;
    let html = '';
    ds.forEach((d, i) => {
      const o = !!d.st && GC_OPEN.includes(d.st.state), un = !d.st || d.st.state === 'unavailable';
      const sub = this._busy === 'd' + i ? 'Opening\u2026' : (o ? this._stateText(d) + ' \u00b7 already open' : this._stateText(d));
      html += btn('door', 'd' + i, o ? 'mdi:garage-open-variant' : 'mdi:garage-variant', d.name, sub, un, o);
    });
    if (c.show_both !== false && ds.length > 1) {
      const all = ds.every(d => d.st && GC_OPEN.includes(d.st.state)), un = ds.every(d => !d.st || d.st.state === 'unavailable');
      html += btn('both', 'all', 'mdi:garage-open-variant', c.both_label || 'Open both', this._busy === 'all' ? 'Opening\u2026' : (all ? 'Both already open' : ds.map(d => d.name).join(' + ')), un, false);
    }
    this.shadowRoot.innerHTML = `<style>${HVGarageChooserCard.css}</style><div class="w${ds.length < 2 ? ' one' : ''}">${html}</div>`;
    this.shadowRoot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this._press(b.dataset.k)));
  }
  _press(k) {
    const ds = this._doors(), ids = (k === 'all' ? ds : ds.filter((d, i) => 'd' + i === k)).filter(d => d.st && d.st.state !== 'unavailable').map(d => d.id);
    if (!ids.length || !this._hass) return;
    this._hass.callService('cover', 'open_cover', { entity_id: ids.length === 1 ? ids[0] : ids }); // open only - this card never closes a door
    this._busy = k; this._sig = null; this._render();
    setTimeout(() => { this._busy = ''; this._sig = null; this._render(); this._dismiss(); }, 900);
  }
  _dismiss() {
    fire(this, 'dismiss-popup');
    try { if (window.browser_mod && window.browser_mod.service) window.browser_mod.service('close_popup'); } catch (e) { /* not in a popup */ }
  }
  static get css() { return `
:host{display:block;container-type:inline-size;font-family:${FONT}}
.w{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:2px}
.w.one{grid-template-columns:1fr}
button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:116px;padding:16px 10px;border-radius:24px;text-align:center;
 background:var(--hv-gc-bg,rgba(127,127,127,.16));border:1px solid var(--hv-gc-bd,rgba(127,127,127,.24));color:var(--primary-text-color,#fff);-webkit-tap-highlight-color:transparent;touch-action:manipulation;
 transition:transform .12s ease,background .2s ease,opacity .2s ease}
button:focus-visible{outline:2px solid #6e5ad2;outline-offset:2px}
button:active{transform:scale(.97)}
button[disabled]{opacity:.4;cursor:not-allowed}
ha-icon{--mdc-icon-size:38px;width:38px;height:38px;display:flex;color:#34c759}
button.open ha-icon{color:#ff9f0a}
.t{display:flex;flex-direction:column;gap:3px;min-width:0;max-width:100%}
.n{font-size:17px;font-weight:650;line-height:1.2}
.s{font-size:12.5px;line-height:1.25;opacity:.72}
button.both{grid-column:1/-1;min-height:92px;flex-direction:row;gap:16px;background:linear-gradient(150deg,#7d6cf0,#5a49d6);border-color:transparent;color:#fff}
button.both ha-icon{color:#fff}
button.busy{background:var(--hv-gc-busy,rgba(110,90,210,.45))}
.w.one button.door{min-height:130px}
@container (max-width:250px){.w{grid-template-columns:1fr}}
${HV_DAY_HOST} :host([hv-day]) button.door{color:#1c1c1e;background:#ffffff;border-color:rgba(0,0,0,.06);box-shadow:0 .3vh 1.2vh rgba(30,30,60,.08)}
:host([hv-day]) ha-icon{color:#248a3d} :host([hv-day]) button.open ha-icon{color:#c96a00} :host([hv-day]) button.both ha-icon{color:#fff}`; }
}
HVGarageChooserCard.layoutSection = false; HVGarageChooserCard.sizePresets = false; HVGarageChooserCard.editorDefaults = true;
class HVSceneCard extends HVEntityCard {
  static get defaults() { return { layout: 'button' }; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => /^(scene|script)\./.test(k)) || 'scene.example' }; }
  defaultAction(kind) {
    if (kind !== 'tap') return { action: 'none' };
    const c = this._config, d = domainOf(c.entity);
    const a = { action: 'perform-action', perform_action: (['scene', 'script', 'automation'].includes(d) ? d : 'homeassistant') + (d === 'automation' ? '.trigger' : '.turn_on'), target: { entity_id: c.entity } };
    if (c.confirm_text) a.confirmation = { text: c.confirm_text };
    return a;
  }
  view() {
    const c = this._config, s = this.stateObj;
    return { stateObj: s, icon: c.icon, name: this.name(), secondary: c.label || (s ? '' : 'Not found'), active: c.active === 'always', layout: c.layout, ignoreUnavailable: false };
  }
}
class HVMusicCard extends HVEntityCard {
  static get defaults() { return Object.assign({ show_media: true, now_playing: true }, NP_TILE_DEFAULTS); }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('media_player.')) || 'media_player.example', name: 'Music', icon: 'mdi:music' }; }
  watched() { const c = this._config || {}; return [c.entity].concat(c.entities || []).filter(Boolean); }
  _player() {
    const c = this._config, ids = [c.entity].concat(c.entities || []).filter(Boolean);
    return ids.map(e => this._hass.states[e]).find(s => s && s.state === 'playing') || this.stateObj;
  }
  view() {
    const c = this._config, p = this._player(), a = p ? p.attributes : {};
    let sec = fmtState(this._hass, p);
    const generic = !a.media_title || [a.app_name, a.source, 'TV'].includes(a.media_title);
    if (c.show_media !== false && p && ['playing', 'paused'].includes(p.state) && !generic)
      sec = a.media_title + (a.media_artist && c.show_artist !== false ? ' · ' + a.media_artist : '');
    if (c.show_state === false) sec = '';
    return { stateObj: p, icon: c.icon, name: c.name != null ? c.name : 'Music', secondary: p ? sec : 'Not found', active: stateActive(p), layout: c.layout };
  }
  // Tap = HomeView Now Playing popup, built right now from this tile's own entity + entities ("Speakers to switch between")
  // and its popup toggles, so the speaker list lives in one place. Off (now_playing: false) = the normal Tap action.
  // `tap_action: {action: homeview-now-playing}` (YAML) also opens it.
  nowPlayingData() {
    const c = this._config, ids = [c.entity].concat(c.entities || []).map(e => typeof e === 'string' ? e : e && e.entity).filter((e, i, a) => e && a.indexOf(e) === i);
    const fs = (c.np_popup_style || 'fullscreen') !== 'window';
    const content = { type: 'custom:homeview-now-playing-card', entity: ids[0], entities: ids.slice(1), height: fs ? NP_POPUP_HEIGHT_FS : NP_POPUP_HEIGHT, popup_style: fs ? 'fullscreen' : 'window' };
    for (const k of NP_TILE_KEYS) if (c['np_' + k] === false) content[k] = false;
    const st = fs ? 'hvnpfs' : 'hvnp';
    return { content, dismissable: true, initial_style: st, style_sequence: [st], popup_styles: [{ style: st, styles: fs ? NP_POPUP_CSS_FS : NP_POPUP_CSS }] };
  }
  openNowPlaying() {
    const data = this.nowPlayingData();
    if (!window.browser_mod) { const p = this._player(); fire(this, 'hass-more-info', { entityId: p ? p.entity_id : this._config.entity }); return; } // browser_mod not installed
    // the same event Home Assistant fires for a `fire-dom-event` action, so browser_mod opens the popup in THIS browser
    fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data } });
  }
  runAction(kind) { // more-info should open the player that is shown
    const c0 = this._config, ta = c0.tap_action;
    if (kind === 'tap' && (c0.now_playing !== false || (ta && ta.action === 'homeview-now-playing'))) { this.openNowPlaying(); return; }
    const p = this._player(); const cfg = this.actionConfig(kind);
    if (cfg && cfg.action === 'more-info' && p && !cfg.entity) { fire(this, 'hass-action', { config: { entity: p.entity_id, [kind + '_action']: cfg }, action: kind }); return; }
    super.runAction(kind);
  }
}
class HVGroupCard extends HVBase {
  static getStubConfig(hass) { return { name: 'Lights', icon: 'mdi:lightbulb-group', entities: Object.keys(hass.states).filter(k => k.startsWith('light.')).slice(0, 3) }; }
  validate(c) { if (!c.entity && !(c.entities && c.entities.length)) throw new Error('Choose a group entity or a list of entities'); }
  _members() {
    const c = this._config, h = this._hass;
    let ids = (c.entities || []).map(e => typeof e === 'string' ? e : e.entity);
    if (!ids.length && c.entity && h.states[c.entity]) ids = h.states[c.entity].attributes.entity_id || [c.entity];
    return ids;
  }
  watched() { return super.watched().concat(this._hass ? this._members() : []); }
  defaultAction(kind) { return { action: kind === 'tap' ? 'toggle' : 'more-info' }; }
  customAction(kind, cfg) {
    const ids = this._members(), h = this._hass;
    if (cfg.action === 'toggle' && (!this._config.entity || (this._config.entities || []).length)) {
      const anyOn = ids.some(e => stateActive(h.states[e]));
      const go = () => h.callService('homeassistant', anyOn ? 'turn_off' : 'turn_on', { entity_id: ids });
      if (cfg.confirmation) { if (confirm(cfg.confirmation.text || 'Are you sure?')) go(); } else go();
      return true;
    }
    if (cfg.action === 'more-info' && !this._config.entity && ids.length) {
      fire(this, 'hass-more-info', { entityId: ids[0] }); return true;
    }
    return false;
  }
  view() {
    const c = this._config, h = this._hass, ids = this._members();
    const n = ids.filter(e => stateActive(h.states[e])).length;
    const word = c.unit || 'on';
    const sec = c.show_state === false ? '' : c.label ? fmtTpl(h, c.label, undefined, { count: n }) : (n ? `${n} ${word}` : (c.none_label || 'All off'));
    const s = c.entity ? h.states[c.entity] : undefined;
    return { stateObj: s, icon: c.icon || (s ? undefined : 'mdi:lightbulb-group'), name: c.name != null ? c.name : (s ? s.attributes.friendly_name : 'Group'), secondary: sec, active: n > 0, layout: c.layout };
  }
}
class HVNavCard extends HVBase {
  static get defaults() { return { keep_query: true }; }
  static getStubConfig() { return { name: 'Home', icon: 'mdi:home-outline', navigation_path: '/lovelace/0' }; }
  validate(c) { if (!c.navigation_path) throw new Error('Set navigation_path'); }
  defaultAction(kind) { return kind === 'tap' ? { action: 'hv-navigate' } : { action: 'none' }; }
  customAction(kind, cfg) {
    if (cfg.action !== 'hv-navigate') return false;
    const c = this._config, here = location.pathname.replace(/\/$/, '');
    let path = c.navigation_path;
    if (c.alt_navigation_path && here === c.navigation_path.replace(/\?.*$/, '').replace(/\/$/, '')) path = c.alt_navigation_path;
    if (c.keep_query !== false && location.search && !path.includes('?')) path += location.search;
    else if (c.keep_query !== false && location.search) { try { const u = new URL(path, location.origin);
      const add = location.search.replace(/^\?/, '').split('&').filter(x => x && !u.searchParams.has(decodeURIComponent(x.split('=')[0])));
      if (add.length) path = u.pathname + (u.search ? u.search + '&' : '?') + add.join('&') + u.hash; } catch (e) {} }
    history.pushState(null, '', path); fire(window, 'location-changed', { replace: false });
    return true;
  }
  view() {
    const c = this._config, s = this.stateObj;
    const sec = c.label || (s && c.show_state ? fmtState(this._hass, s) : '');
    const active = c.active === 'always' ? true : c.active === 'entity' ? stateActive(s) : false;
    return { stateObj: s, icon: c.icon || (s ? undefined : 'mdi:arrow-right'), name: c.name != null ? c.name : (s ? s.attributes.friendly_name : ''), secondary: sec, active, layout: c.layout };
  }
}

/* ---------------- battery ---------------- */
// Battery level as a rounded bar in an inner glass box: name on top, big %, bar filled to the level (green > 50, yellow 21-50,
// red <= 20). No times, dates or axis. A bolt shows top-right while charging (charging entity, or a sibling on the same device).
const BAT_ON = ['on', 'true', 'charging', 'starting'];
const batCharging = s => { if (!s) return false; const v = String(s.state).toLowerCase().trim(); return BAT_ON.includes(v); };
function batFindCharger(hass, id) { // a charging entity on the same device as the battery sensor
  const E = hass && hass.entities, me = E && E[id]; if (!me || !me.device_id) return null;
  const sib = Object.values(E).filter(e => e.device_id === me.device_id && e.entity_id !== id && /^(binary_sensor|sensor)\./.test(e.entity_id) && hass.states[e.entity_id]);
  const dc = e => hass.states[e.entity_id].attributes.device_class;
  const nm = e => ((e.name || '') + ' ' + (hass.states[e.entity_id].attributes.friendly_name || '') + ' ' + e.entity_id).toLowerCase();
  const bad = /pending|scheduled|trip|time|rate|power|current|voltage|energy|complete|limit|cable|port|heater/;
  return (sib.find(e => dc(e) === 'battery_charging') || sib.find(e => /(^|[\s_])charging($|[\s_])/.test(nm(e)) && !bad.test(nm(e)))
    || sib.find(e => /battery[\s_]state/.test(nm(e))) || {}).entity_id || null;
}
class HVBatteryCard extends HVBase {
  static get needsEntity() { return true; }
  static get defaults() { return { show_percent: true }; }
  static getStubConfig(hass) { const ids = Object.keys(hass.states).filter(k => k.startsWith('sensor.') && hass.states[k].attributes.device_class === 'battery');
    return { entity: ids.find(k => !isNaN(parseFloat(hass.states[k].state))) || ids[0] || 'sensor.example_battery' }; }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 3, rows: 2, min_columns: 3, min_rows: 2 }; }
  _chargerId() { const c = this._config; if (c.charging_entity) return c.charging_entity; if (this._autoFor !== c.entity || this._autoEnts !== this._hass.entities) { this._autoFor = c.entity; this._autoEnts = this._hass.entities; this._auto = batFindCharger(this._hass, c.entity); } return this._auto; }
  watched() { const id = this._hass ? this._chargerId() : null; return [this._config.entity, id].filter(Boolean); }
  static get css() { return `
.b{position:relative;height:100%;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:4cqh;padding:9cqh 7cqw 10cqh;pointer-events:none;color:var(--hv-text,#fff)}
.hd{display:flex;align-items:center;justify-content:center;gap:2.4cqw;min-width:0;padding:0 9cqw;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.bi{display:flex;flex:none} .hd ha-state-icon,.hd ha-icon{--mdc-icon-size:min(13cqh,8cqw);color:var(--hv-icon,currentColor);display:flex;flex:none}
.nm{font-size:min(11.5cqh,7cqw);font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.pc{text-align:center;font-family:${ROUND};font-weight:400;font-size:min(30cqh,18cqw);line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.18))}
.pc small{font-size:.45em;font-weight:500;margin-left:.06em;opacity:.75;letter-spacing:0}
.box{border-radius:min(9cqh,5.5cqw);padding:min(3.6cqh,2.2cqw);
 background:color-mix(in srgb,var(--hv-text,#fff) 9%,transparent);border:1px solid color-mix(in srgb,var(--hv-text,#fff) 16%,transparent);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.tr{position:relative;height:min(15cqh,9cqw);border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--hv-text,#fff) 14%,transparent)}
.fl{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:999px;transition:width .6s ease,background .4s ease;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 min(4cqh,2.4cqw) var(--g,transparent)}
.ok .fl{background:linear-gradient(90deg,#2fbf5b,#5fe07f);--g:rgba(60,210,100,.45)}
.mid .fl{background:linear-gradient(90deg,#f2b600,#ffd84a);--g:rgba(250,200,30,.45)}
.low .fl{background:linear-gradient(90deg,#ff3b30,#ff6f61);--g:rgba(255,70,60,.45)}
.chg .fl{background-size:200% 100%;animation:hvbat 2.4s linear infinite}
.ok.chg .fl{background-image:linear-gradient(90deg,#2fbf5b,#7af09a,#2fbf5b)} .mid.chg .fl{background-image:linear-gradient(90deg,#f2b600,#ffe27a,#f2b600)} .low.chg .fl{background-image:linear-gradient(90deg,#ff3b30,#ff8f84,#ff3b30)}
@keyframes hvbat{from{background-position:200% 0}to{background-position:0 0}}
.bolt{position:absolute;top:7cqh;right:5cqw;width:min(18cqh,11cqw);height:min(18cqh,11cqw);border-radius:50%;display:none;align-items:center;justify-content:center;
 background:color-mix(in srgb,var(--hv-text,#fff) 14%,transparent);border:1px solid color-mix(in srgb,var(--hv-text,#fff) 18%,transparent)}
.bolt ha-icon{--mdc-icon-size:min(12cqh,7.5cqw);color:#ffd60a;filter:drop-shadow(0 0 3px rgba(255,200,0,.55));display:flex}
.chg .bolt{display:flex}
.na .pc,.na .hd{opacity:.5} .na .fl{width:0 !important}
.nopc .pc{display:none} .nopc{gap:7cqh}
:host([auto]) .nm{font-size:max(13px,min(11.5cqh,7cqw))}
:host([floor]) .nm{font-size:max(13px,min(11.5cqh,10cqw))} :host([floor]) .pc{font-size:min(30cqh,26cqw)}
/* wide (2 x 6): name and % share the first row, bar below */
@container (min-aspect-ratio: 19/10){
 .b{display:grid;grid-template-columns:1fr auto;grid-template-areas:"hd pc" "box box";align-content:center;row-gap:7cqh;column-gap:4cqw;padding:10cqh 6cqw 12cqh}
 .hd{grid-area:hd;justify-content:flex-start;padding:0} .pc{grid-area:pc;text-align:right;font-size:min(34cqh,12cqw)} .box{grid-area:box}
 .nm{font-size:min(14cqh,5cqw)} .hd ha-state-icon,.hd ha-icon{--mdc-icon-size:min(16cqh,6cqw)} .chg .hd{padding-right:calc(min(20cqh,7cqw) + 2.4cqw)}
 .tr{height:min(18cqh,6cqw)} .box{border-radius:min(11cqh,4cqw);padding:min(4.4cqh,1.6cqw)}
 .bolt{position:static;grid-area:hd;justify-self:end;align-self:center;width:min(20cqh,7cqw);height:min(20cqh,7cqw)}
 .bolt ha-icon{--mdc-icon-size:min(13cqh,4.6cqw)}
}`; }
  _build() {
    super._build();
    this._root.innerHTML = `<div class="b"><div class="hd"><span class="bi"></span><span class="nm"></span></div><div class="pc"></div>
      <div class="box"><div class="tr"><div class="fl"></div></div></div><div class="bolt" aria-label="Charging"><ha-icon icon="mdi:lightning-bolt"></ha-icon></div></div>`;
    this._b = this._root.querySelector('.b');
  }
  update() {
    const c = this._config, s = this.stateObj, h = this._hass;
    const v = s ? parseFloat(s.state) : NaN, na = !s || isNaN(v), p = na ? 0 : Math.max(0, Math.min(100, v));
    const cid = this._chargerId(), chg = !na && batCharging(cid ? h.states[cid] : null);
    const b = this._b; b.className = 'b ' + (na ? 'na' : p > 50 ? 'ok' : p > 20 ? 'mid' : 'low') + (chg ? ' chg' : '') + (c.show_percent === false ? ' nopc' : '');
    this._card.classList.toggle('unavailable', !s || UNAVAILABLE.includes(s.state));
    const ic = b.querySelector('.bi'); ic.innerHTML = '';
    if (c.icon || s) { const i = document.createElement(c.icon ? 'ha-icon' : 'ha-state-icon'); if (c.icon) i.icon = c.icon; else { i.hass = h; i.stateObj = s; } ic.appendChild(i); }
    const name = this.name('Battery'); b.querySelector('.nm').textContent = name;
    const pct = na ? '—' : String(Math.round(p));
    b.querySelector('.pc').innerHTML = esc(pct) + (na ? '' : '<small>%</small>');
    b.querySelector('.fl').style.width = p + '%';
    this._card.setAttribute('aria-label', `${name} ${na ? 'unavailable' : pct + '%'}${chg ? ', charging' : ''}`);
  }
}

/* ---------------- visual editor (ha-form) ---------------- */
const ACT = def => ({ ui_action: def ? { default_action: def } : {} });
const LAYOUT = { name: 'layout', selector: { select: { mode: 'dropdown', options: [{ value: 'tile', label: 'Tile (icon, name, state)' }, { value: 'button', label: 'Button (big icon, name)' }] } } };
const COLORS = { type: 'expandable', name: '', flatten: true, title: 'Colours (optional)', icon: 'mdi:palette', schema: [
  { name: 'day_light', selector: { boolean: {} } },
  { name: 'text_color', selector: { text: {} } }, { name: 'icon_color', selector: { text: {} } },
  { name: 'accent_color', selector: { text: {} } }, { name: 'background_color', selector: { text: {} } }] };
const ACTIONS = (tap, hold) => ({ type: 'expandable', name: '', flatten: true, title: 'Interactions', icon: 'mdi:gesture-tap', schema: [
  { name: 'tap_action', selector: ACT(tap) }, { name: 'hold_action', selector: ACT(hold) }] });
const LABELS = { entity: 'Entity', entities: 'Entities', name: 'Name', room: 'Room / subtitle', step: 'Set-point step', icon: 'Icon', label: 'Sub-label (overrides state)',
  attribute: 'Show attribute instead of state', show_state: 'Show state', active: 'Lavender "active" tint', layout: 'Style (tile or button)', compact: 'Compact (1x1 tile)',
  text_color: 'Text colour (CSS)', icon_color: 'Icon colour (CSS)', accent_color: 'Active / accent tint (CSS)', background_color: 'Background tint (CSS)',
  tap_action: 'Tap action', hold_action: 'Hold action', confirm: 'Ask for confirmation', confirm_text: 'Confirmation text', show_media: 'Show now playing',
  show_artist: 'Show artist', unit: 'Word after the count (e.g. "on", "lights on")', none_label: 'Text when none are on',
  navigation_path: 'Navigate to', alt_navigation_path: 'Toggle back to (when already on "Navigate to")', keep_query: 'Keep URL parameters (?kiosk&wp_enabled…)' };
Object.assign(LABELS, { theme: 'Theme', day_light: 'Light style while the sun is up (dark text on white glass)', aspect: 'Tile shape (for the "height follows width" sizes)',
  label: 'Sub-label (overrides state)', empty_label: 'Text when the attribute is empty' });
const HELPERS = { label: 'Live values: {state} = this entity, {count} = how many are on (groups), {sensor.any_entity} = any entity\'s state.', text_color: 'Any CSS colour, e.g. #ffffff or rgba(255,255,255,.9). Empty = HomeView theme.', accent_color: 'Background when active, e.g. #cbc4ee or a gradient.',
  background_color: 'Card background, e.g. rgba(255,255,255,.12).', alt_navigation_path: 'Makes the card a view switch, e.g. /dashboard/main <-> /dashboard/light.' };
HVThermostatCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'climate' } } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'room', selector: { text: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'step', selector: { number: { min: 0.1, max: 5, step: 0.1, mode: 'box', unit_of_measurement: '°' } } }, { name: 'compact', selector: { boolean: {} } }] },
  COLORS, ACTIONS('more-info', 'more-info')];
const ENTITY_SCHEMA = (domain, tap, hold, extra = []) => [
  { name: 'entity', required: true, selector: { entity: domain ? { domain } : {} } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} }, context: { icon_entity: 'entity' } }] },
  ...extra, COLORS, ACTIONS(tap, hold)];
HVEntityCard.schema = ENTITY_SCHEMA(null, 'more-info', 'more-info', [
  { type: 'grid', name: '', schema: [{ name: 'label', selector: { text: {} } }, { name: 'attribute', selector: { attribute: {} }, context: { filter_entity: 'entity' } }] },
  { name: 'empty_label', selector: { text: {} } },
  { type: 'grid', name: '', schema: [{ name: 'show_state', selector: { boolean: {} } },
    { name: 'active', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'When on / open / playing' }, { value: 'running', label: 'When on / running / above 0' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }] } } }] },
  LAYOUT]);
HVLightCard.schema = ENTITY_SCHEMA('light', 'toggle', 'more-info', [
  { type: 'grid', name: '', schema: [{ name: 'room', selector: { text: {} } }, { name: 'show_state', selector: { boolean: {} } }] }, LAYOUT]);
HVGarageCard.editorDefaults = true;
const GC_FIELDS = [
  { name: 'entity_b', selector: { entity: { domain: 'cover' } } },
  { type: 'grid', name: '', schema: [{ name: 'door_name', selector: { text: {} } }, { name: 'door_b_name', selector: { text: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'both_label', selector: { text: {} } }, { name: 'show_both', selector: { boolean: {} } }] }];
HVGarageCard.schema = ENTITY_SCHEMA('cover', null, 'more-info', [
  { name: 'chooser', selector: { boolean: {} } },
  { type: 'expandable', name: '', flatten: true, title: 'Garage chooser popup (Garage Door / Garage Door B / Open both)', icon: 'mdi:garage-variant', schema: GC_FIELDS },
  { type: 'grid', name: '', schema: [{ name: 'confirm', selector: { boolean: {} } }, { name: 'confirm_text', selector: { text: {} } }] }, LAYOUT]);
HVGarageChooserCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'cover' } } }, ...GC_FIELDS];
Object.assign(LABELS, { chooser: 'Tap opens a popup: open Garage Door, Garage Door B or both (never closes)', entity_b: 'Second door (Garage Door B)',
  door_name: 'Name of the first door (in the popup)', door_b_name: 'Name of the second door (in the popup)', both_label: 'Text of the "open both" button', show_both: 'Show the "open both" button' });
Object.assign(HELPERS, { chooser: 'Needs the second door below. Ask-for-confirmation / Tap action are not used while this is on (Hold still works).' });
HVSceneCard.schema = ENTITY_SCHEMA(['scene', 'script', 'automation', 'button', 'input_button'], null, 'none', [
  { type: 'grid', name: '', schema: [{ name: 'confirm_text', selector: { text: {} } }, { name: 'label', selector: { text: {} } }] }, LAYOUT]);
HVMusicCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'media_player' } } },
  { name: 'speakers', selector: { entity: { domain: 'media_player', multiple: true } } },
  { name: 'now_playing', selector: { boolean: {} } },
  { type: 'expandable', name: '', flatten: true, title: 'Now Playing popup', icon: 'mdi:music-box-outline', schema: [
    { name: 'np_art_background', selector: { boolean: {} } }, { name: 'np_auto_select', selector: { boolean: {} } },
    { name: 'np_show_progress', selector: { boolean: {} } }, { name: 'np_show_volume', selector: { boolean: {} } },
    { name: 'np_show_output', selector: { boolean: {} } }, { name: 'np_show_extra', selector: { boolean: {} } },
    { name: 'np_uppercase_title', selector: { boolean: {} } },
    { name: 'np_popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'fullscreen', label: 'Full screen (edge to edge, swipe down to close)' }, { value: 'window', label: 'Window (rounded panel)' }] } } }] },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'show_media', selector: { boolean: {} } }, { name: 'show_artist', selector: { boolean: {} } }] },
  LAYOUT, COLORS, ACTIONS('more-info', 'more-info')];
HVGroupCard.schema = [
  { name: 'entities', selector: { entity: { multiple: true } } },
  { name: 'entity', selector: { entity: { domain: ['group', 'light', 'switch', 'fan'] } } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'unit', selector: { text: {} } }, { name: 'none_label', selector: { text: {} } }] },
  { name: 'label', selector: { text: {} } },
  LAYOUT, COLORS, ACTIONS('toggle', 'more-info')];
HVNavCard.schema = [
  { name: 'navigation_path', required: true, selector: { navigation: {} } },
  { name: 'alt_navigation_path', selector: { navigation: {} } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'keep_query', selector: { boolean: {} } }, { name: 'label', selector: { text: {} } }] },
  { name: 'entity', selector: { entity: {} } },
  { type: 'grid', name: '', schema: [{ name: 'show_state', selector: { boolean: {} } },
    { name: 'active', selector: { select: { mode: 'dropdown', options: [{ value: 'never', label: 'Never' }, { value: 'entity', label: 'When the entity is on' }, { value: 'always', label: 'Always' }] } } }] },
  LAYOUT, COLORS, { type: 'expandable', name: '', flatten: true, title: 'Interactions', icon: 'mdi:gesture-tap', schema: [{ name: 'hold_action', selector: ACT('none') }] }];
HVBatteryCard.editorDefaults = true;
HVBatteryCard.schema = [
  { name: 'entity', required: true, selector: { entity: { filter: [{ domain: 'sensor', device_class: 'battery' }, { domain: ['sensor', 'number', 'input_number'] }] } } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} }, context: { icon_entity: 'entity' } }] },
  { name: 'charging_entity', selector: { entity: { domain: ['binary_sensor', 'sensor'] } } },
  { name: 'show_percent', selector: { boolean: {} } },
  COLORS, ACTIONS('more-info', 'more-info')];
Object.assign(LABELS, { charging_entity: 'Charging entity (optional)', show_percent: 'Show the % number' });
Object.assign(HELPERS, { charging_entity: 'Shows a bolt while it is on / charging. Empty = found automatically on the same device (e.g. a "Charging" sensor).' });

/* ---------------- edit button (fixed overlay, no grid space) ---------------- */
// Floating "edit" mini button in a corner of the page. Takes no grid space: outside edit mode its own grid cell is hidden and the
// button is drawn as a position:fixed overlay on <body> (so tile transforms / backdrop-filters can't trap it and kiosk-mode can't hide it).
// Tap = full page load of <this view>?disable_km&edit=1 -> kiosk-mode off (header back) + Lovelace edit mode. Works in browsers and the iOS/Android app.
// 1.30.6: tap opens a small menu (Edit page + Device pages theme) unless edit_menu: false.
const PENCIL = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
const EDIT_CSS = `
:host{all:initial}
button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;
 width:var(--s);height:var(--s);border-radius:50%;opacity:var(--o);transition:opacity .2s ease,transform .15s ease,background .2s ease;
 background:var(--bg);border:1px solid var(--bd);box-shadow:var(--sh);color:var(--fg);
 backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%)}
button:hover,button:focus-visible{opacity:1}
button:active{transform:scale(.9);opacity:1}
.menu{position:absolute;min-width:236px;box-sizing:border-box;padding:8px;border-radius:18px;font:500 14px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;
 color:#fff;background:linear-gradient(160deg,rgba(64,72,86,.96),rgba(30,36,46,.97));border:1px solid rgba(255,255,255,.14);box-shadow:0 1.6vh 5vh rgba(0,0,20,.38);
 backdrop-filter:blur(26px) saturate(160%);-webkit-backdrop-filter:blur(26px) saturate(160%);animation:mi .14s ease-out}
@keyframes mi{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.menu button.mi{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:10px 10px;border-radius:11px;cursor:pointer;opacity:1;
 background:none;border:0;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;height:auto;color:inherit;transform:none}
.menu button.mi:hover,.menu button.mi:focus-visible{background:rgba(255,255,255,.10)}
.menu button.mi:active{background:rgba(255,255,255,.16);transform:none}
.menu button.mi[disabled]{opacity:.45;cursor:default}
.menu svg,.menu ha-icon{width:20px;height:20px;--mdc-icon-size:20px;flex:none;fill:currentColor;display:flex}
.menu .sep{height:1px;margin:6px 4px;background:rgba(255,255,255,.12)}
.menu .hd{padding:4px 10px 4px;font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.menu .ck{margin-left:auto;width:18px;height:18px;color:#a99dff;visibility:hidden} .menu [aria-checked="true"] .ck{visibility:visible}
.menu .sw{width:20px;height:20px;border-radius:7px;flex:none;box-sizing:border-box;border:1px solid rgba(255,255,255,.25)}
.menu .st{padding:4px 10px 2px;font-size:12px;color:rgba(255,255,255,.62);min-height:0} .menu .st:empty{display:none} .menu .st.err{color:#ff9f95}
.menu.lt{color:#1c1c1e;background:rgba(250,250,252,.97);border-color:rgba(0,0,0,.08);box-shadow:0 1.4vh 4vh rgba(30,30,60,.18)}
.menu.lt button.mi:hover,.menu.lt button.mi:focus-visible{background:rgba(60,60,67,.08)} .menu.lt .sep{background:rgba(60,60,67,.12)}
.menu.lt .hd{color:rgba(60,60,67,.6)} .menu.lt .ck{color:#5b3fc4} .menu.lt .st{color:rgba(60,60,67,.72)} .menu.lt .sw{border-color:rgba(0,0,0,.12)} .menu.lt .st.err{color:#c4291c}

svg,ha-icon{width:calc(var(--s) * .5);height:calc(var(--s) * .5);--mdc-icon-size:calc(var(--s) * .5);fill:currentColor;display:flex;pointer-events:none}
.dark{--bg:linear-gradient(150deg,rgba(255,255,255,.20),rgba(255,255,255,.08));--bd:rgba(255,255,255,.30);--fg:rgba(255,255,255,.92);
 --sh:inset 0 1px 0 rgba(255,255,255,.25),0 .6vh 1.8vh rgba(6,8,60,.28)}
.light{--bg:linear-gradient(150deg,rgba(255,255,255,.85),rgba(255,255,255,.55));--bd:rgba(0,0,0,.08);--fg:rgba(28,28,40,.72);
 --sh:inset 0 1px 0 rgba(255,255,255,.9),0 .5vh 1.6vh rgba(20,20,50,.12)}
`;
class HVEditButtonCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { position: 'top-right', style: 'auto', admin_only: true, size: 30, offset: 6, opacity: 0.6, show_edit_button: true, show_screensaver_button: true, edit_menu: true }; }
  static getStubConfig() { return { position: 'top-right', style: 'auto', admin_only: true }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  setConfig(c) { if (!c) throw new Error('Invalid configuration'); this._config = Object.assign({}, this.constructor.defaults, c); this._paint(); this._tick(); }
  set hass(h) { this._hass = h; this._tick(); }
  get hass() { return this._hass; }
  getCardSize() { return 1; }
  getGridOptions() { return { columns: 'full', rows: 'auto' }; }
  connectedCallback() { if (!this._t) this._t = setInterval(() => this._tick(), 800); setTimeout(() => this._tick(), 30); }
  disconnectedCallback() { clearInterval(this._t); this._t = null; this._unportal(); }
  url() { // the exact page the button opens
    const c = this._config || {};
    if (c.url) return c.url;
    return location.pathname.replace(/\/$/, '') + '?disable_km&edit=1';
  }
  // finds the Lovelace view (layout-card / masonry / sections) this card sits in; null in the card-editor preview
  _view() { let n = this; for (let i = 0; i < 30 && n; i++) { const h = n.getRootNode && n.getRootNode().host; if (!h) return null; if (h.lovelace !== undefined && /(-LAYOUT|-VIEW)$/.test(h.tagName)) return h; n = h; } return null; }
  _cell(view) {
    // sections view: the wrapper <div class="card"> around our <hui-card> in the grid section (never the whole section)
    if (view.tagName === 'HUI-SECTIONS-VIEW') { let n = this;
      for (let i = 0; i < 20 && n; i++) { if (n.tagName === 'HUI-CARD') { const p = n.parentElement; return p && p.classList && p.classList.contains('card') ? p : null; }
        n = n.parentElement || (n.getRootNode && n.getRootNode().host); }
      return null; }
    let n = this; while (n && n.getRootNode() !== view.shadowRoot) n = n.getRootNode().host; // top-level element in the view
    let c = this; while (c && c.parentElement && c.parentElement.id !== 'root') c = c.parentElement; return (c && c.parentElement) ? c : n; }
  _theme() {
    if (hvThemeOf(this) === 'day') return 'light'; // Day theme: the light button on the white page
    const s = this._config.style; if (s === 'dark' || s === 'light') return s;
    const col = getComputedStyle(this).getPropertyValue('--primary-text-color').trim(), m = col.match(/\d+(\.\d+)?/g);
    if (col.startsWith('#') && col.length >= 7) { const v = [1, 3, 5].map(i => parseInt(col.substr(i, 2), 16)); return (v[0] * .3 + v[1] * .59 + v[2] * .11) > 128 ? 'dark' : 'light'; }
    if (m && m.length >= 3) return (m[0] * .3 + m[1] * .59 + m[2] * .11) > 128 ? 'dark' : 'light';
    return 'dark';
  }
  _btnHTML(theme) {
    const c = this._config, icon = c.icon ? `<ha-icon icon="${esc(c.icon)}"></ha-icon>` : `<svg viewBox="0 0 24 24"><path d="${PENCIL}"/></svg>`;
    const st = `--s:${+c.size || 30}px;--o:${c.opacity}`, ss = this._ssWanted();
    const pen = c.show_edit_button !== false ? `<button class="${theme} pen" style="${st}" aria-label="Edit dashboard" title="Edit dashboard">${icon}</button>` : '';
    const scr = ss ? `<button class="${theme} scr" style="${st}" aria-label="Screensaver settings" title="Screensaver settings"><ha-icon icon="${esc(c.screensaver_icon || 'mdi:monitor-shimmer')}"></ha-icon></button>` : '';
    const v = String(c.position || 'top-right').startsWith('bottom');
    return `<style>${EDIT_CSS}.stack{display:flex;flex-direction:${v ? 'column-reverse' : 'column'};gap:${Math.max(5, Math.round((+c.size || 30) * .3))}px}</style><div class="stack">${pen}${scr}</div>`;
  }
  // the Wallpanel button: only when Wallpanel is installed (it defines <wallpanel-view>) and the option is on
  _ssWanted() { const c = this._config || {}; return c.show_screensaver_button !== false && !!customElements.get('wallpanel-view'); }
  _openScreensaver(e) { e.preventDefault(); e.stopPropagation(); if (this._config.preview_only) return; hvOpenScreensaverSettings(this); }
  _go(e) { e.preventDefault(); e.stopPropagation(); if (this._config.preview_only) return; const u = this.url(); if (this._config.url) location.assign(u); else hvGoEdit(u); }
  _paint() { // in-grid placeholder: visible only in edit mode and in the card editor preview
    if (!this._config) return;
    this.shadowRoot.innerHTML = `<style>:host{display:block}.ph{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;font:500 13px ${FONT};
      color:var(--primary-text-color);background:var(--ha-card-background,var(--card-background-color,rgba(127,127,127,.15)));border:1px dashed var(--divider-color,rgba(127,127,127,.4))}</style>
      <div class="ph"><span class="b"></span><span>Edit button (${esc(this._config.position)}) → ${esc(this.url())}</span></div>`;
    const b = this.shadowRoot.querySelector('.b'), r = b.attachShadow({ mode: 'open' }); r.innerHTML = this._btnHTML(this._theme());
    r.querySelectorAll('button').forEach(x => x.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }));
  }
  _tick() {
    if (!this._config || !this.isConnected) return;
    const view = this._view(), edit = !!(view && view.lovelace && view.lovelace.editMode);
    const allowed = !this._config.admin_only || !this._hass || !this._hass.user || this._hass.user.is_admin;
    if (view) { const cell = this._cell(view); if (cell && cell.style) { const d = edit ? '' : 'none'; if (cell.style.display !== d) cell.style.display = d; } }
    if (view && !edit && allowed && this._hass) this._portal(); else this._unportal();
  }
  _portal() {
    const theme = this._theme(), c = this._config, key = theme + JSON.stringify(c) + this._ssWanted();
    if (this._menuEl && this._fab && this._fab.isConnected) return; // menu open: keep it (re-styled after it closes)
    if (this._fab && this._fab.isConnected && this._fabKey === key) return;
    this._unportal();
    const host = document.createElement('homeview-edit-fab'), r = host.attachShadow({ mode: 'open' });
    const off = (+c.offset || 0) + 'px', [v, h] = String(c.position || 'top-right').split('-');
    // fixed to the viewport, inside the safe area; z-index below dialogs / browser_mod popups / the Wallpanel screensaver
    host.style.cssText = `position:fixed;z-index:${c.z_index || 3};${v === 'bottom' ? 'bottom' : 'top'}:calc(var(--hv-safe-${v === 'bottom' ? 'bottom' : 'top'}, env(safe-area-inset-${v === 'bottom' ? 'bottom' : 'top'},0px)) + ${off});`
      + `${h === 'left' ? 'left' : 'right'}:calc(env(safe-area-inset-${h === 'left' ? 'left' : 'right'},0px) + ${off});display:block;width:auto;height:auto;margin:0;padding:0`;
    r.innerHTML = this._btnHTML(theme);
    const pen = r.querySelector('.pen'), scr = r.querySelector('.scr');
    if (pen) pen.addEventListener('click', e => this._config.edit_menu === false ? this._go(e) : this._menu(e, r, pen));
    if (scr) scr.addEventListener('click', e => this._openScreensaver(e));
    // keep the tap from reaching anything underneath (Wallpanel idle timer still sees the activity on window)
    for (const b of r.querySelectorAll('button')) for (const t of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) b.addEventListener(t, e => e.stopPropagation(), { passive: true });
    document.body.appendChild(host); this._fab = host; this._fabKey = key;
  }
  _unportal() { this._menuClose(); if (this._fab) { this._fab.remove(); this._fab = null; } }
  // 1.30.6: the pencil opens a small menu: "Edit page" + the Device pages theme (Night / Day / Auto). The choice is saved as the
  // `theme` option of the dashboard's NotHomeView Home Screen card (same place as its visual editor), so it persists for everyone.
  _menuClose() { if (this._menuEl) { this._menuEl.remove(); this._menuEl = null; } if (this._menuOff) { this._menuOff(); this._menuOff = null; } }
  _menu(e, r, pen) {
    e.preventDefault(); e.stopPropagation(); if (this._config.preview_only) return;
    if (this._menuEl) { this._menuClose(); return; }
    const root = hvFindRoot(this), lv = root && root.lovelace, cfg = lv && lv.config, hub = cfg ? hvHubCfgOf(cfg) : null;
    const cur = hub && HV_THEMES.includes(hub.theme) ? hub.theme : 'night', admin = !this._hass || !this._hass.user || this._hass.user.is_admin;
    const yaml = lv && lv.mode === 'yaml', can = admin && !!hub && !yaml;
    const m = document.createElement('div'); m.className = 'menu' + (hvThemeOf(this) === 'day' ? ' lt' : ''); m.setAttribute('role', 'menu');
    const [v, h] = String(this._config.position || 'top-right').split('-'), gap = (+this._config.size || 30) + 8 + 'px';
    m.style.cssText = `${v === 'bottom' ? 'bottom' : 'top'}:${gap};${h === 'left' ? 'left' : 'right'}:0;transform-origin:${v === 'bottom' ? 'bottom' : 'top'} ${h === 'left' ? 'left' : 'right'}`;
    const opt = (val, label, sw) => `<button class="mi th" role="menuitemradio" data-v="${val}" aria-checked="${val === cur}"${can ? '' : ' disabled'}><span class="sw" style="background:${sw}"></span><span>${label}</span><svg class="ck" viewBox="0 0 24 24"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/></svg></button>`;
    const why = !admin ? 'Only an admin can change the theme.' : yaml ? 'This dashboard is in YAML mode: set theme: on the Home Screen card in its YAML.' : !hub ? 'Add a NotHomeView Home Screen card to this dashboard to choose a theme.' : '';
    m.innerHTML = `<button class="mi ed" role="menuitem"><svg viewBox="0 0 24 24"><path d="${PENCIL}"/></svg><span>Edit page</span></button><div class="sep"></div>
      <div class="hd">Device pages theme</div>
      ${opt('night', 'Night (dark glass)', 'linear-gradient(150deg,#3b3f8f,#1b1d3a)')}${opt('day', 'Day (white)', 'linear-gradient(150deg,#ffffff,#e6e6eb)')}${opt('auto', 'Auto (follow sun)', 'linear-gradient(90deg,#1b1d3a 50%,#ffffff 50%)')}
      <div class="st${why ? '' : ''}">${esc(why || 'The Home Screen keeps its own look.')}</div>`;
    m.querySelector('.ed').addEventListener('click', ev => this._go(ev));
    m.querySelectorAll('.th').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); this._setTheme(b.dataset.v, m); }));
    for (const t of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click']) m.addEventListener(t, ev => ev.stopPropagation(), { passive: t !== 'click' });
    pen.parentNode.style.position = 'relative'; pen.parentNode.appendChild(m); this._menuEl = m;
    const out = ev => { if (!ev.composedPath().includes(this._fab)) this._menuClose(); }, key = ev => { if (ev.key === 'Escape') this._menuClose(); };
    setTimeout(() => { if (this._menuEl !== m) return; window.addEventListener('pointerdown', out, true); window.addEventListener('keydown', key, true); }, 0);
    this._menuOff = () => { window.removeEventListener('pointerdown', out, true); window.removeEventListener('keydown', key, true); };
    const first = m.querySelector('.ed'); if (first) first.focus({ preventScroll: true });
  }
  async _setTheme(val, m) {
    const st = m.querySelector('.st'), btns = [...m.querySelectorAll('.th')]; st.className = 'st'; st.textContent = 'Saving…'; btns.forEach(b => { b.disabled = true; });
    try {
      const root = hvFindRoot(this), lv = root && root.lovelace, dash = (lv && lv.urlPath) || ssDash();
      const q = { type: 'lovelace/config', force: true }; if (dash) q.url_path = dash;
      const fresh = JSON.parse(JSON.stringify(await this._hass.callWS(q))); // re-read: only this one key changes, everything else stays as saved
      const hub = hvHubCfgOf(fresh); if (!hub) throw new Error('no NotHomeView Home Screen card on this dashboard');
      if (val === 'night') delete hub.theme; else hub.theme = val; // Night = default: the key is removed
      if (lv && typeof lv.saveConfig === 'function' && (lv.urlPath || null) === (dash || null)) await lv.saveConfig(fresh); // updates the open dashboard at once
      else { const sv = { type: 'lovelace/config/save', config: fresh }; if (dash) sv.url_path = dash; await this._hass.callWS(sv); }
      btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === val)));
      st.textContent = 'Saved ✓ Device pages use ' + ({ night: 'Night', day: 'Day', auto: 'Auto' })[val] + '.';
      setTimeout(() => { HVT.key = ''; hvThemeTick(this, this._hass); }, 50);
      hvToast('Device pages theme: ' + ({ night: 'Night (dark glass)', day: 'Day (white)', auto: 'Auto (follow sun)' })[val] + ' ✓'); // the page re-renders (menu closes)
    } catch (e) { st.className = 'st err'; st.textContent = 'Not saved: ' + (e && (e.message || e.code) || e); hvToast('Theme not saved: ' + (e && (e.message || e.code) || e)); }
    btns.forEach(b => { b.disabled = false; });
  }
}
HVEditButtonCard.layoutSection = false; // it takes no grid space
HVEditButtonCard.sizePresets = false;
HVEditButtonCard.schema = [
  { type: 'grid', name: '', schema: [
    { name: 'position', selector: { select: { mode: 'dropdown', options: [{ value: 'top-right', label: 'Top right' }, { value: 'top-left', label: 'Top left' }, { value: 'bottom-right', label: 'Bottom right' }, { value: 'bottom-left', label: 'Bottom left' }] } } },
    { name: 'style', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (from theme)' }, { value: 'dark', label: 'Glass on dark' }, { value: 'light', label: 'Glass on light' }] } } }] },
  { type: 'grid', name: '', schema: [{ name: 'admin_only', selector: { boolean: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'size', selector: { number: { min: 20, max: 60, step: 1, mode: 'box', unit_of_measurement: 'px' } } },
    { name: 'offset', selector: { number: { min: 0, max: 60, step: 1, mode: 'box', unit_of_measurement: 'px' } } }] },
  { name: 'opacity', selector: { number: { min: 0.2, max: 1, step: 0.05, mode: 'slider' } } },
  { name: 'url', selector: { text: {} } },
  { type: 'grid', name: '', schema: [{ name: 'show_edit_button', selector: { boolean: {} } }, { name: 'show_screensaver_button', selector: { boolean: {} } }] },
  { name: 'edit_menu', selector: { boolean: {} } },
  { name: 'screensaver_icon', selector: { icon: {} } }];
HVEditButtonCard.editorDefaults = true;
Object.assign(LABELS, { edit_menu: 'Pencil opens a menu (Edit page + Device pages theme)' });
Object.assign(HELPERS, { edit_menu: 'On: a tap shows "Edit page" and the Night / Day / Auto choice for the device pages (saved on the Home Screen card, admins only). Off: a tap goes straight to the editor.' });
Object.assign(LABELS, { show_edit_button: 'Show the edit pencil', show_screensaver_button: 'Show the screensaver button (below the pencil)', screensaver_icon: 'Screensaver button icon (empty = mdi:monitor-shimmer)' });
Object.assign(HELPERS, { show_screensaver_button: 'Opens the Wallpanel screensaver settings for this dashboard. Only shown when Wallpanel is installed.' });
Object.assign(LABELS, { position: 'Corner', style: 'Look', admin_only: 'Admins only', size: 'Size', offset: 'Distance from the edge', opacity: 'Opacity when idle', url: 'Open URL (empty = this view with ?disable_km&edit=1)' });
Object.assign(HELPERS, { url: 'Default reloads the current view without kiosk-mode and in edit mode.' });

/* ---------------- now playing (Apple HomePad style) ---------------- */
// Full "Now Playing" panel: blurred-artwork background, big artwork, title/artist, live progress, transport controls,
// a volume pop-over and an output picker that switches between several media players. Works as a dashboard card and
// as browser_mod popup content (set `height`, e.g. min(calc(var(--hv-vh,100dvh) - 48px), 640px), when the parent has no height).
const NP_CSS = `
:host{display:block;width:100%;height:100%;aspect-ratio:var(--hv-np-aspect,1.05);-webkit-tap-highlight-color:transparent}
:host([fixed]){aspect-ratio:auto}
:host([dragging]) ha-card{cursor:grabbing}
.grab{position:absolute;z-index:6;left:50%;top:calc(env(safe-area-inset-top,0px) * var(--hv-np-safe,0) + 7px);width:38px;height:5px;margin-left:-19px;border-radius:3px;
 background:rgba(255,255,255,.42);box-shadow:0 1px 4px rgba(0,0,0,.25);display:none;pointer-events:none}
:host([swipe]) .grab{display:block}
:host([fs]){--hv-np-safe:1}
:host([fs]) ha-card{border-radius:0 !important;border:none !important;box-shadow:none !important}
/* !important: card-mod / frosted-glass themes and popup styles restyle every ha-card */
ha-card{position:relative !important;height:100%;width:100%;box-sizing:border-box;overflow:hidden !important;border-radius:var(--hv-np-radius,28px) !important;
 border:1px solid rgba(255,255,255,.10) !important;font-family:${FONT};color:#fff;container-type:size;user-select:none;-webkit-user-select:none;
 background:var(--hv-np-bg,linear-gradient(160deg,rgba(78,92,108,.94) 0%,rgba(46,56,68,.95) 55%,rgba(30,37,46,.97) 100%)) !important;
 backdrop-filter:blur(30px) saturate(150%) !important;-webkit-backdrop-filter:blur(30px) saturate(150%) !important;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 2vh 6vh rgba(0,0,20,.35) !important}
ha-card::before,ha-card::after{content:none !important;display:none !important}
/* Day theme: Now Playing keeps its dark artwork look (also where a HomeView style helper paints every card with --hv-bg) */
:host([hv-day]){--hv-bg:var(--hv-np-bg,linear-gradient(160deg,rgba(78,92,108,.94) 0%,rgba(46,56,68,.95) 55%,rgba(30,37,46,.97) 100%));--hv-bg-on:var(--hv-bg);--hv-border:rgba(255,255,255,.10);--hv-border-on:rgba(255,255,255,.10);
 --hv-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 2vh 6vh rgba(0,0,20,.35);--hv-shadow-on:var(--hv-shadow);--hv-blur:blur(30px) saturate(150%);--hv-text:#fff;--hv-text2:rgba(255,255,255,.66);--hv-text-on:#fff;--hv-text2-on:rgba(255,255,255,.8);--hv-icon:#fff;--hv-icon-on:#fff;--primary-text-color:#fff;--secondary-text-color:rgba(255,255,255,.66)}
.bg,.bg i,.shade{position:absolute;inset:0;pointer-events:none}
.bg i{inset:-18%;background-size:cover;background-position:center;opacity:0;transition:opacity .9s ease;
 filter:blur(var(--hv-np-blur,52px)) saturate(1.45) brightness(.9);transform:translateZ(0) scale(1.08)}
.bg i.on{opacity:1}
.shade{background:linear-gradient(180deg,rgba(10,14,22,.30) 0%,rgba(10,14,22,.42) 55%,rgba(10,14,22,.62) 100%);opacity:0;transition:opacity .9s ease}
.hasbg .shade{opacity:1}
.w,.pop{--s:min(1cqw,1.04cqh)}
.w{position:relative;height:100%;box-sizing:border-box;padding:calc(var(--s)*4.2) calc(var(--s)*4.6) calc(var(--s)*3.4);
 display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto auto;grid-template-areas:"top" "stage" "prog" "ctl";row-gap:calc(var(--s)*1.6)}
button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;-webkit-tap-highlight-color:transparent;border-radius:999px;transition:transform .12s ease,background .2s,opacity .2s}
button:active{transform:scale(.9)} button:focus-visible{outline:2px solid rgba(255,255,255,.6);outline-offset:2px}
button[disabled]{opacity:.35;pointer-events:none}
ha-icon{display:flex;color:inherit}
.glass{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.top{grid-area:top;display:flex;justify-content:space-between;align-items:center;z-index:2}
.rb{width:calc(var(--s)*7.4);height:calc(var(--s)*7.4)} .rb ha-icon{--mdc-icon-size:calc(var(--s)*4.2)}
.pill{display:flex;align-items:center;border-radius:999px;height:calc(var(--s)*7.4);padding:0 calc(var(--s)*1)}
.pill button{height:100%;padding:0 calc(var(--s)*1.4)} .pill ha-icon{--mdc-icon-size:calc(var(--s)*4.2)}
.stage{grid-area:stage;position:relative;min-height:0;display:flex;justify-content:center;align-items:stretch}
.art{position:relative;height:100%;aspect-ratio:1;max-width:min(100%,calc(var(--s)*62));max-height:min(100%,calc(var(--s)*62));border-radius:calc(var(--s)*3.2);overflow:hidden;
 background:linear-gradient(145deg,rgba(255,255,255,.18),rgba(255,255,255,.06));box-shadow:0 1.6cqh 4cqh rgba(0,0,0,.35);align-self:flex-start}
.art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s ease}
.art img.on{opacity:1}
.ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);transition:opacity .4s}
.ph ha-icon{--mdc-icon-size:calc(var(--s)*16)} .hasart .ph{opacity:0}
.meta{position:absolute;left:0;right:0;bottom:calc(var(--s)*.4);display:flex;align-items:flex-end;gap:calc(var(--s)*2);z-index:2}
.tx{flex:1;min-width:0;text-shadow:0 1px 10px rgba(0,0,0,.45)}
.t{font-size:calc(var(--s)*4.6);font-weight:700;letter-spacing:.01em;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.upper .t{text-transform:uppercase}
.ar{font-size:calc(var(--s)*3.3);font-weight:500;color:rgba(255,255,255,.62);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:calc(var(--s)*.4)}
.more{width:calc(var(--s)*5.6);height:calc(var(--s)*5.6);flex:none;margin-bottom:calc(var(--s)*1)} .more ha-icon{--mdc-icon-size:calc(var(--s)*3.6)}
.prog{grid-area:prog;z-index:1}
.bar{position:relative;height:max(3px,calc(var(--s)*.75));border-radius:9px;background:rgba(255,255,255,.22);overflow:hidden}
.bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.9);border-radius:9px}
.times{display:flex;justify-content:space-between;font-size:calc(var(--s)*2.5);font-weight:600;color:rgba(255,255,255,.6);margin-top:calc(var(--s)*1.1);font-variant-numeric:tabular-nums}
.noprog .times{visibility:hidden} .noprog .bar i{width:0 !important}
.ctl{grid-area:ctl;display:flex;justify-content:space-between;align-items:center}
.ctl button{width:calc(var(--s)*11);height:calc(var(--s)*10)}
.ctl .sm ha-icon{--mdc-icon-size:calc(var(--s)*4.4);opacity:.9} .ctl .md ha-icon{--mdc-icon-size:calc(var(--s)*8.4)} .ctl .big ha-icon{--mdc-icon-size:calc(var(--s)*10.5)}
.ctl .tr{display:flex;gap:calc(var(--s)*6);align-items:center}
.ctl .ghost{visibility:hidden;pointer-events:none}
/* pop-overs: volume and output */
.pop{position:absolute;z-index:5;top:calc(var(--s)*13.5);right:calc(var(--s)*4.6);min-width:min(calc(var(--s)*52),80%);max-width:calc(100% - var(--s)*9.2);box-sizing:border-box;
 padding:calc(var(--s)*2.2);border-radius:calc(var(--s)*3.6);background:rgba(36,42,52,.78);border:1px solid rgba(255,255,255,.14);
 backdrop-filter:blur(26px) saturate(160%);-webkit-backdrop-filter:blur(26px) saturate(160%);box-shadow:0 2cqh 5cqh rgba(0,0,0,.4);
 opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top right;pointer-events:none;transition:opacity .18s,transform .18s}
.pop.open{opacity:1;transform:none;pointer-events:auto}
.vol{display:flex;align-items:center;gap:calc(var(--s)*2)} .vol button{width:calc(var(--s)*6.4);height:calc(var(--s)*6.4);flex:none} .vol ha-icon{--mdc-icon-size:calc(var(--s)*4.4)}
.vol .pct{font-size:calc(var(--s)*2.8);font-weight:600;color:rgba(255,255,255,.7);min-width:3.2em;text-align:right;font-variant-numeric:tabular-nums}
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:calc(var(--s)*5.6);border-radius:999px;margin:0;cursor:pointer;
 background:linear-gradient(90deg,rgba(255,255,255,.92) 0 var(--v,0%),rgba(255,255,255,.2) var(--v,0%) 100%);overflow:hidden}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:1px;height:100%;background:transparent;box-shadow:none}
input[type=range]::-moz-range-thumb{width:1px;height:100%;border:0;background:transparent}
.out .h{font-size:calc(var(--s)*2.6);font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em;padding:0 calc(var(--s)*1.4) calc(var(--s)*1.2)}
.out button{width:100%;justify-content:flex-start;gap:calc(var(--s)*2.2);padding:calc(var(--s)*1.6) calc(var(--s)*1.4);border-radius:calc(var(--s)*2.2);text-align:left}
.out button:hover{background:rgba(255,255,255,.08)} .out button.sel{background:rgba(255,255,255,.16)}
.out ha-icon{--mdc-icon-size:calc(var(--s)*4.6);flex:none} .out .n{font-size:calc(var(--s)*3.2);font-weight:600} .out .d{font-size:calc(var(--s)*2.5);color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.out .l{flex:1;min-width:0} .out .ck{opacity:0} .out .sel .ck{opacity:1}
.eq{display:flex;gap:2px;align-items:flex-end;height:calc(var(--s)*3);opacity:0} .playing .eq{opacity:1}
.eq b{width:3px;background:#fff;border-radius:2px;animation:hvnpeq 1s ease-in-out infinite} .eq b:nth-child(2){animation-delay:-.3s} .eq b:nth-child(3){animation-delay:-.6s}
@keyframes hvnpeq{0%,100%{height:30%}50%{height:100%}}
/* full screen: the artwork-blur background fills the screen; the window composition (centred art, title / artist over the
   art's bottom-left, progress, controls) is centred on top and fills the height: top buttons ~40 px under the grabber,
   controls ~30 px above the bottom / home indicator, bigger art; the column width follows the art (never side by side) */
:host([fs]) .w,:host([fs]) .pop{
 --npt:calc(env(safe-area-inset-top,0px) + 39px);--npb:calc(env(safe-area-inset-bottom,0px) + 20px);
 --nph0:min(calc(100cqh - var(--npt) - var(--npb)),900px);
 --nph:min(var(--nph0),calc((100cqw - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px) - 24px) / 1.16));
 --npw:calc(var(--nph) * 1.16);
 --s:calc(var(--nph) / 112)}
:host([fs]) .w{position:absolute;left:50%;top:calc(var(--npt) + (var(--nph0) - var(--nph)) / 2);width:var(--npw);height:var(--nph);transform:translateX(-50%);
 padding:calc(var(--s)*2.6) calc(var(--s)*4.6) calc(var(--s)*1.8);row-gap:calc(var(--s)*1.2)}
:host([fs]) .ctl button{height:calc(var(--s)*8.6)}
:host([fs]) .art{max-width:100%;max-height:100%}
:host([fs]) .pop{top:calc(var(--npt) + (var(--nph0) - var(--nph)) / 2 + var(--s) * 12.5);right:calc(50% - var(--npw) / 2 + var(--s) * 4.6)}
/* full screen, PORTRAIT (phone, tablet held upright): one tall column — top buttons, big square art, title / artist under the
   art, progress, then large touch-size controls. Width follows the screen (max 600 px), height follows the width, centred.
   Landscape full screen and the window popup are not affected. */
@container (max-aspect-ratio: 9/10){
 :host([fs]) .w,:host([fs]) .pop{
  --npa:calc(100cqh - var(--npt) - var(--npb));
  --npw:min(calc(100cqw - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px) - 32px),600px,calc(var(--npa) / 1.62));
  --nph:min(var(--npa),calc(var(--npw) * 1.78));
  --s:calc(var(--npw) / 100);--nprb:clamp(34px,calc(var(--s) * 8),46px)}
 :host([fs]) .pop{--s:clamp(4.4px,calc(var(--npw) / 100),6px)}
 :host([fs]) .w{top:calc(var(--npt) + (var(--npa) - var(--nph)) / 2);width:var(--npw);height:var(--nph);padding:0;
  grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto auto auto;grid-template-areas:"top" "stage" "meta" "prog" "ctl";row-gap:calc(var(--s) * 4)}
 :host([fs]) .stage{display:contents}
 :host([fs]) .art{grid-area:stage;width:100%;height:auto;max-width:100%;max-height:100%;aspect-ratio:1;align-self:center;justify-self:center;border-radius:calc(var(--s) * 3)}
 :host([fs]) .meta{grid-area:meta;position:static;align-items:center}
 :host([fs]) .t{font-size:clamp(18px,calc(var(--s) * 6),32px)} :host([fs]) .ar{font-size:clamp(14px,calc(var(--s) * 4.4),24px)}
 :host([fs]) .more{width:clamp(32px,calc(var(--s) * 7),42px);height:clamp(32px,calc(var(--s) * 7),42px);margin:0} :host([fs]) .more ha-icon{--mdc-icon-size:clamp(18px,calc(var(--s) * 4.4),24px)}
 :host([fs]) .rb{width:var(--nprb);height:var(--nprb)} :host([fs]) .pill{height:var(--nprb);padding:0 6px} :host([fs]) .pill button{padding:0 clamp(8px,calc(var(--s) * 2),14px)}
 :host([fs]) .rb ha-icon,:host([fs]) .pill ha-icon{--mdc-icon-size:clamp(18px,calc(var(--s) * 4.6),26px)}
 :host([fs]) .bar{height:max(4px,calc(var(--s) * 1))} :host([fs]) .times{font-size:clamp(11px,calc(var(--s) * 3),15px);margin-top:calc(var(--s) * 1.6)}
 :host([fs]) .ctl button{width:clamp(48px,calc(var(--s) * 16),96px);height:clamp(48px,calc(var(--s) * 14),84px)}
 :host([fs]) .ctl .sm ha-icon{--mdc-icon-size:clamp(20px,calc(var(--s) * 5.6),28px)} :host([fs]) .ctl .md ha-icon{--mdc-icon-size:clamp(30px,calc(var(--s) * 10),56px)}
 :host([fs]) .ctl .big ha-icon{--mdc-icon-size:clamp(40px,calc(var(--s) * 13),72px)} :host([fs]) .ctl .tr{gap:clamp(8px,calc(var(--s) * 5),40px)}
 :host([fs]) .pop{top:calc(var(--npt) + (var(--npa) - var(--nph)) / 2 + var(--nprb) + 10px);right:calc(50% - var(--npw) / 2);min-width:min(calc(var(--npw) * .86),420px);max-width:var(--npw)}
}
/* window mode, landscape (short wide popups such as a phone): art on the left, info + controls on the right */
@container (min-aspect-ratio: 13/10){
 :host(:not([fs])) .w,:host(:not([fs])) .pop{--s:min(.62cqw,1.25cqh)}
 :host(:not([fs])) .w{grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto auto auto;
  grid-template-areas:"art top" "art gap" "art meta" "art prog" "art ctl";column-gap:calc(var(--s)*7);row-gap:calc(var(--s)*2.6);padding:calc(var(--s)*5)}
 :host(:not([fs])) .stage{display:contents} :host(:not([fs])) .art{grid-area:art;height:auto;width:min(calc(100cqh - var(--s)*10), 54cqw);max-width:none;max-height:none;align-self:center}
 :host(:not([fs])) .meta{grid-area:meta;position:static} :host(:not([fs])) .t{font-size:calc(var(--s)*6)} :host(:not([fs])) .ar{font-size:calc(var(--s)*4.2)}
 :host(:not([fs])) .ctl button{width:calc(var(--s)*10);height:calc(var(--s)*10);flex:0 1 auto;min-width:0} :host(:not([fs])) .ctl .tr{gap:calc(var(--s)*2)}
 :host(:not([fs])) .pop{top:calc(var(--s)*15);right:calc(var(--s)*5);min-width:min(calc(var(--s)*62),60%)}
}
/* small dashboard sizes (Size 2 × 3 / 2 × 6, or any card under ~260 px tall): a compact tile, art + title / artist + transport */
@container (max-height:260px){
 :host(:not([fs])) .top,:host(:not([fs])) .prog,:host(:not([fs])) .ctl .sm,:host(:not([fs])) .more{display:none}
 :host(:not([fs])) .w{padding:7cqh 7cqw;grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"stage" "ctl";row-gap:3cqh;column-gap:0}
 :host(:not([fs])) .stage{display:flex} :host(:not([fs])) .art{grid-area:auto;height:100%;width:auto;max-width:100%;max-height:100%;border-radius:clamp(8px,8cqmin,14px);align-self:center}
 :host(:not([fs])) .meta{grid-area:auto;position:absolute;left:0;right:0;bottom:0;padding:0 4px 3px}
 :host(:not([fs])) .stage{justify-content:center}
 :host(:not([fs])) .t{font-size:clamp(10px,9cqmin,16px)} :host(:not([fs])) .ar{font-size:clamp(9px,7.5cqmin,13px);margin-top:1px}
 :host(:not([fs])) .ph ha-icon{--mdc-icon-size:clamp(18px,22cqmin,44px)}
 :host(:not([fs])) .ctl{justify-content:center} :host(:not([fs])) .ctl .tr{gap:clamp(6px,6cqw,22px)}
 :host(:not([fs])) .ctl button{width:clamp(24px,22cqmin,48px);height:clamp(24px,22cqmin,48px)}
 :host(:not([fs])) .ctl .md ha-icon{--mdc-icon-size:clamp(16px,15cqmin,30px)} :host(:not([fs])) .ctl .big ha-icon{--mdc-icon-size:clamp(20px,20cqmin,40px)}
}
/* small and wide (2 × 6): art on the left, title / artist and transport on the right */
@container (max-height:260px) and (min-aspect-ratio: 13/10){
 :host(:not([fs])) .w{grid-template-columns:auto minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto auto;grid-template-areas:"art gap" "art meta" "art ctl";column-gap:5cqw;row-gap:2cqh;padding:8cqh 5cqw}
 :host(:not([fs])) .stage{display:contents} :host(:not([fs])) .art{grid-area:art;height:100%;width:auto;aspect-ratio:1}
 :host(:not([fs])) .meta{grid-area:meta;position:static;padding:0}
 :host(:not([fs])) .t{font-size:clamp(11px,13cqh,18px)} :host(:not([fs])) .ar{font-size:clamp(10px,10cqh,14px)}
 :host(:not([fs])) .ctl{justify-content:flex-start;min-width:0} :host(:not([fs])) .ctl .tr{gap:clamp(2px,2.5cqw,16px)}
 :host(:not([fs])) .art{max-width:42cqw;max-height:100%}
}
`;
const NP_FEAT = { PAUSE: 1, VOLUME_SET: 4, VOLUME_MUTE: 8, PREV: 16, NEXT: 32, PLAY: 16384 };
const npTime = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
class HVNowPlayingCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { auto_select: true, art_background: true, show_progress: true, show_volume: true, show_output: true, show_extra: true, uppercase_title: true, popup_style: 'window', swipe_to_close: true }; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('media_player.')) || 'media_player.example' }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  setConfig(c) {
    if (!c || !c.entity) throw new Error('Please choose a media player');
    this._config = Object.assign({}, this.constructor.defaults, c);
    if (this._config.height) { this.setAttribute('fixed', ''); this.style.height = this._config.height; } else { this.removeAttribute('fixed'); this.style.removeProperty('height'); }
    this.toggleAttribute('fs', this._config.popup_style === 'fullscreen'); this._swipeAttr();
    this._sig = null; this._render();
  }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, rows: 8, min_columns: 3, min_rows: 2 }; }
  getLayoutOptions() { return { grid_columns: 4, grid_rows: 8, grid_min_columns: 2, grid_min_rows: 4 }; }
  connectedCallback() { if (!this._iv) this._iv = setInterval(() => this._progress(), 1000); this._render(); this._resetDrag(); setTimeout(() => this._swipeAttr(), 0); setTimeout(() => this._swipeAttr(), 400); }
  // --- swipe down to close (only when shown inside a browser_mod popup)
  _popupHost() { let n = this; for (let i = 0; n && i < 40; i++) { if (n.tagName === 'BROWSER-MOD-POPUP') return n; n = n.parentNode || n.host; } return null; }
  _swipeAttr() { this._inPopup = !!this._popupHost(); this.toggleAttribute('swipe', !!(this._config && this._config.swipe_to_close !== false && this._inPopup)); }
  _resetDrag() { this.style.removeProperty('transform'); this.style.removeProperty('opacity'); this.style.removeProperty('transition'); this.removeAttribute('dragging'); }
  _bindSwipe() {
    const el = this; let st = null;
    const card = this._card;
    card.addEventListener('pointerdown', e => {
      if (!this.hasAttribute('swipe') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.composedPath().some(n => n.tagName === 'BUTTON' || n.tagName === 'INPUT' || (n.classList && n.classList.contains('pop')))) return;
      const r = this.getBoundingClientRect();
      if (e.clientY - r.top > Math.max(120, r.height * 0.5)) return;          // start the drag in the top half of the card
      st = { id: e.pointerId, x: e.clientX, y: e.clientY, h: r.height, on: false, dy: 0, v: 0, lt: e.timeStamp, ly: e.clientY };
    });
    card.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.on) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) { st = null; return; }   // up or sideways: not a dismiss
        st.on = true; try { card.setPointerCapture(e.pointerId); } catch (x) {}
        this.setAttribute('dragging', ''); this.style.transition = 'none'; this._pop(null);
      }
      const dt = Math.max(1, e.timeStamp - st.lt); st.v = (e.clientY - st.ly) / dt; st.lt = e.timeStamp; st.ly = e.clientY;
      st.dy = Math.max(0, dy);
      el.style.transform = `translate3d(0, ${st.dy.toFixed(1)}px, 0)`;
      el.style.opacity = String(Math.max(0.35, 1 - st.dy / (st.h * 0.9)).toFixed(3));
      e.preventDefault();
    });
    const end = e => {
      if (!st || e.pointerId !== st.id) return; const s0 = st; st = null;
      if (!s0.on) return;
      this._suppressClick = true; setTimeout(() => this._suppressClick = false, 60);
      const far = s0.dy > Math.min(160, s0.h * 0.22), fast = s0.v > 0.7 && s0.dy > 40;
      if (e.type !== 'pointercancel' && (far || fast)) this._dismiss(s0.h); else this._snapBack();
    };
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }
  _snapBack() {
    this.style.transition = 'transform .32s cubic-bezier(.2,.9,.25,1.15), opacity .25s ease';
    this.style.transform = 'translate3d(0,0,0)'; this.style.opacity = '1';
    this.removeAttribute('dragging'); setTimeout(() => { if (!this.hasAttribute('dragging')) this._resetDrag(); }, 360);
    this.dispatchEvent(new CustomEvent('homeview-swipe', { detail: { result: 'snap' } }));
  }
  _dismiss(h) {
    this.style.transition = 'transform .24s ease-in, opacity .24s ease-in';
    this.style.transform = `translate3d(0, ${Math.round(h || window.innerHeight)}px, 0)`; this.style.opacity = '0';
    this.dispatchEvent(new CustomEvent('homeview-swipe', { detail: { result: 'dismiss' } }));
    setTimeout(() => {
      fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.close_popup', data: {} } });
      setTimeout(() => { const pop = this._popupHost(); if (pop && this.isConnected && typeof pop.closeDialog === 'function') try { pop.closeDialog(); } catch (x) {} }, 350);
      setTimeout(() => this._resetDrag(), 700);
    }, 230);
  }
  disconnectedCallback() { clearInterval(this._iv); this._iv = null; }
  get _ids() { const c = this._config || {}; return [c.entity].concat(c.entities || []).map(e => typeof e === 'string' ? e : e && e.entity).filter((e, i, a) => e && a.indexOf(e) === i); }
  _player() {
    const h = this._hass, ids = this._ids, st = id => h.states[id];
    if (this._sel && st(this._sel)) return st(this._sel);
    if (this._config.auto_select !== false) {
      const p = ids.map(st).find(s => s && s.state === 'playing') || ids.map(st).find(s => s && s.state === 'paused');
      if (p) return p;
    }
    return st(ids[0]);
  }
  _build() {
    this.shadowRoot.innerHTML = `<style>${NP_CSS}</style><ha-card><div class="bg"><i></i><i></i><div class="shade"></div></div>
      <div class="w">
        <div class="top"><button class="rb glass" data-a="app" aria-label="Music"><ha-icon icon="mdi:music-note"></ha-icon></button>
          <div class="pill glass"><button data-a="output" aria-label="Output"><ha-icon icon="mdi:cast-audio"></ha-icon></button><button data-a="volume" aria-label="Volume"><ha-icon class="vi" icon="mdi:volume-high"></ha-icon></button></div></div>
        <div class="stage"><div class="art"><div class="ph"><ha-icon icon="mdi:music-note"></ha-icon></div><img alt=""><img alt=""></div>
          <div class="meta"><div class="tx"><div class="t"></div><div class="ar"></div></div><button class="more glass" data-a="more" aria-label="More"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button></div></div>
        <div class="prog"><div class="bar"><i></i></div><div class="times"><span class="el">0:00</span><span class="rm">-0:00</span></div></div>
        <div class="ctl"><button class="sm" data-a="lyrics" aria-label="Lyrics"><ha-icon icon="mdi:comment-quote-outline"></ha-icon></button>
          <div class="tr"><button class="md" data-a="prev" aria-label="Previous"><ha-icon icon="mdi:rewind"></ha-icon></button>
          <button class="big" data-a="play" aria-label="Play/Pause"><ha-icon class="pi" icon="mdi:play"></ha-icon></button>
          <button class="md" data-a="next" aria-label="Next"><ha-icon icon="mdi:fast-forward"></ha-icon></button></div>
          <button class="sm" data-a="queue" aria-label="Queue"><ha-icon icon="mdi:format-list-bulleted"></ha-icon></button></div>
      </div>
      <div class="pop vol"><button data-a="mute" aria-label="Mute"><ha-icon class="vi" icon="mdi:volume-high"></ha-icon></button><input type="range" min="0" max="100" step="1" aria-label="Volume"><span class="pct"></span></div>
      <div class="pop out"></div><div class="grab" aria-hidden="true"></div></ha-card>`;
    const R = this.shadowRoot; this._$ = s => R.querySelector(s);
    this._card = this._$('ha-card'); this._bgs = [...R.querySelectorAll('.bg i')]; this._imgs = [...R.querySelectorAll('.art img')];
    R.addEventListener('click', e => { if (this._suppressClick) { e.stopPropagation(); return; } const b = e.composedPath().find(n => n.dataset && n.dataset.a); if (b) { e.stopPropagation(); this._act(b.dataset.a, b); } else if (!e.composedPath().some(n => n.classList && n.classList.contains('pop'))) this._pop(null); });
    const rng = this._$('input[type=range]');
    rng.addEventListener('input', () => { this._volDrag = true; this._paintVol(rng.value / 100); });
    rng.addEventListener('change', () => { const p = this._player(); this._volDrag = false; if (p) this._call('volume_set', { volume_level: rng.value / 100 }, p.entity_id); });
    this._card.style.touchAction = 'none'; rng.style.touchAction = 'pan-x';
    this._bindSwipe();
    this._built = true;
  }
  _call(svc, data = {}, id) { const p = id || (this._player() || {}).entity_id; if (!p) return; this._hass.callService('media_player', svc, Object.assign({ entity_id: p }, data)); }
  _moreInfo() { const p = this._player(); if (!p) return; fire(this, 'hass-more-info', { entityId: p.entity_id }); }
  _act(a, el) {
    const p = this._player();
    switch (a) {
      case 'play': this._call('media_play_pause'); break;
      case 'prev': this._call('media_previous_track'); break;
      case 'next': this._call('media_next_track'); break;
      case 'mute': if (p) this._call('volume_mute', { is_volume_muted: !p.attributes.is_volume_muted }); break;
      case 'volume': this._pop(this._open === 'vol' ? null : 'vol'); break;
      case 'output': this._pop(this._open === 'out' ? null : 'out'); break;
      case 'pick': this._sel = el.dataset.id; this._sig = null; this._pop(null); this._render(); break;
      case 'app': case 'more': case 'lyrics': case 'queue': this._pop(null); this._moreInfo(); break;
    }
  }
  _pop(which) { this._open = which; this._$('.vol').classList.toggle('open', which === 'vol'); this._$('.out').classList.toggle('open', which === 'out'); if (which === 'out') this._paintOut(); }
  _paintVol(v) {
    const rng = this._$('input[type=range]'), p = this._player(), muted = p && p.attributes.is_volume_muted;
    const pc = Math.round((v || 0) * 100); if (!this._volDrag || document.activeElement !== rng) rng.value = pc;
    rng.style.setProperty('--v', pc + '%'); this._$('.pct').textContent = pc + '%';
    const ic = muted || !pc ? 'mdi:volume-off' : pc < 34 ? 'mdi:volume-low' : pc < 67 ? 'mdi:volume-medium' : 'mdi:volume-high';
    this.shadowRoot.querySelectorAll('.vi').forEach(i => i.icon = ic);
  }
  _paintOut() {
    const h = this._hass, cur = (this._player() || {}).entity_id;
    this._$('.out').innerHTML = `<div class="h">${esc(this._config.output_title || 'Speakers')}</div>` + this._ids.map(id => {
      const s = h.states[id], a = s ? s.attributes : {}, on = s && ['playing', 'paused'].includes(s.state);
      const d = !s ? 'Not found' : on && a.media_title ? `${a.media_title}${a.media_artist ? ' · ' + a.media_artist : ''}` : fmtState(h, s);
      return `<button data-a="pick" data-id="${esc(id)}" class="${id === cur ? 'sel' : ''} ${s && s.state === 'playing' ? 'playing' : ''}"><ha-icon icon="${s && /group|home_speakers/.test(id) ? 'mdi:speaker-multiple' : 'mdi:speaker'}"></ha-icon>
        <span class="l"><div class="n">${esc(a.friendly_name || id)}</div><div class="d">${esc(d)}</div></span><span class="eq"><b></b><b></b><b></b></span><ha-icon class="ck" icon="mdi:check"></ha-icon></button>`;
    }).join('');
  }
  _artUrl(a) {
    const p = a.entity_picture_local || a.entity_picture; if (!p) return '';
    if (/^(https?:|data:|blob:)/.test(p)) return p;
    try { return this._hass.hassUrl ? this._hass.hassUrl(p) : p; } catch (e) { return p; }
  }
  _setArt(url) {
    if (url === this._art) return; this._art = url; const tok = this._artTok = (this._artTok || 0) + 1;
    const show = ok => {
      if (tok !== this._artTok) return;
      const bgOn = ok && this._config.art_background !== false;
      this._fi = (this._fi || 0) ^ 1; const i = this._fi;
      this._imgs[i].src = ok ? url : ''; this._imgs[i].classList.toggle('on', ok); this._imgs[i ^ 1].classList.remove('on');
      this._bgs[i].style.backgroundImage = bgOn ? `url("${url.replace(/"/g, '%22')}")` : 'none'; this._bgs[i].classList.toggle('on', bgOn); this._bgs[i ^ 1].classList.remove('on');
      this._card.classList.toggle('hasart', ok); this._card.classList.toggle('hasbg', bgOn);
    };
    if (!url) return show(false);
    const im = new Image(); im.onload = () => show(true); im.onerror = () => show(false); im.src = url;
  }
  _render() {
    if (!this._config || !this._hass || !this.isConnected && this._built) return;
    const h = this._hass, ids = this._ids;
    const sig = JSON.stringify(ids.map(e => { const s = h.states[e]; return s ? [s.state, s.last_updated, s.attributes] : 0; })) + '|' + this._sel + '|' + JSON.stringify(this._config);
    if (this._built && sig === this._sig) return; this._sig = sig;
    if (!this._built) this._build();
    const c = this._config, p = this._player(), a = p ? p.attributes : {};
    const active = p && ['playing', 'paused', 'buffering'].includes(p.state);
    const generic = !a.media_title;
    const notPlaying = !active || generic;
    this._card.classList.toggle('upper', c.uppercase_title !== false);
    // playing with no track info (e.g. Netflix on an Apple TV): show the app; nothing at all: "Not Playing" with a play button
    const appOnly = !!(p && p.state === 'playing' && !a.media_title && a.app_name);
    this._$('.t').textContent = !p ? 'Not found' : appOnly ? a.app_name : notPlaying && !a.media_title ? (c.idle_title || 'Not Playing') : a.media_title;
    this._$('.ar').textContent = !p ? (ids[0] || '') : appOnly ? (a.friendly_name || p.entity_id) : notPlaying && !a.media_title ? (a.friendly_name || p.entity_id) : (a.media_artist || a.media_album_name || [a.app_name, a.source].find(x => x && x !== a.media_title) || a.friendly_name || '');
    this._setArt(active ? this._artUrl(a) : '');
    const f = Number(a.supported_features) || 0, has = b => !f || (f & b);
    const pb = this._$('[data-a="play"]'); pb.querySelector('ha-icon').icon = p && p.state === 'playing' && (a.media_title || appOnly) ? (has(NP_FEAT.PAUSE) ? 'mdi:pause' : 'mdi:stop') : 'mdi:play';
    pb.toggleAttribute('disabled', !p || p.state === 'unavailable');
    this._$('[data-a="prev"]').toggleAttribute('disabled', !p || !active || !has(NP_FEAT.PREV));
    this._$('[data-a="next"]').toggleAttribute('disabled', !p || !active || !has(NP_FEAT.NEXT));
    const vis = (sel, on) => this.shadowRoot.querySelectorAll(sel).forEach(e => e.style.display = on ? '' : 'none');
    vis('[data-a="volume"]', c.show_volume !== false); vis('[data-a="output"]', c.show_output !== false && ids.length > 1);
    vis('.pill', c.show_volume !== false || (c.show_output !== false && ids.length > 1)); vis('.prog', c.show_progress !== false);
    ['lyrics', 'queue', 'more', 'app'].forEach(k => this._$(`[data-a="${k}"]`).classList.toggle('ghost', c.show_extra === false));
    this._$('[data-a="more"]').style.visibility = c.show_extra === false ? 'hidden' : '';
    this._paintVol(a.volume_level); if (this._open === 'out') this._paintOut();
    this._progress();
  }
  _progress() {
    if (!this._built || !this._hass) return;
    const p = this._player(), a = p ? p.attributes : {}, dur = Number(a.media_duration) || 0;
    const prog = this._$('.prog'), ok = p && dur > 0 && ['playing', 'paused', 'buffering'].includes(p.state);
    prog.classList.toggle('noprog', !ok); if (!ok) return;
    let pos = Number(a.media_position) || 0;
    if (p.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
    pos = Math.max(0, Math.min(pos, dur));
    this._$('.bar i').style.width = (pos / dur * 100).toFixed(2) + '%';
    this._$('.el').textContent = npTime(pos); this._$('.rm').textContent = '-' + npTime(dur - pos);
  }
}
HVNowPlayingCard.layoutSection = false;
HVNowPlayingCard.editorDefaults = true;
HVMusicCard.editorDefaults = true;
// the Music editor shows `entities` as "Speakers to switch between" (field `speakers`); the saved YAML keeps `entities`
HVMusicCard.editorAlias = { speakers: 'entities' };
Object.assign(LABELS, { speakers: 'Speakers to switch between', now_playing: 'Open Now Playing popup on tap',
  np_art_background: 'Blurred artwork background', np_auto_select: 'Start on whichever speaker is playing', np_show_progress: 'Progress bar',
  np_show_volume: 'Volume button', np_show_output: 'Speaker picker', np_show_extra: 'Lyrics, queue and … buttons', np_uppercase_title: 'Uppercase title', np_popup_style: 'Popup style' });
Object.assign(HELPERS, { speakers: 'The Entity above is the default speaker. The tile shows whichever of these is playing, and the popup\'s speaker pill switches between them.',
  now_playing: 'Tap opens the NotHomeView Now Playing popup for these speakers (needs browser_mod). Turn off to use the Tap action under Interactions instead.' });
HVNowPlayingCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'media_player' } } },
  { name: 'entities', selector: { entity: { domain: 'media_player', multiple: true } } },
  { name: 'auto_select', selector: { boolean: {} } }, { name: 'art_background', selector: { boolean: {} } },
  { type: 'expandable', name: '', flatten: true, title: 'Show / hide', icon: 'mdi:toggle-switch-outline', expanded: true, schema: [
    { name: 'show_progress', selector: { boolean: {} } }, { name: 'show_volume', selector: { boolean: {} } },
    { name: 'show_output', selector: { boolean: {} } }, { name: 'show_extra', selector: { boolean: {} } },
    { name: 'uppercase_title', selector: { boolean: {} } }] },
  { type: 'expandable', name: '', flatten: true, title: 'Text & size (optional)', icon: 'mdi:resize', schema: [
    { type: 'grid', name: '', schema: [{ name: 'idle_title', selector: { text: {} } }, { name: 'output_title', selector: { text: {} } }] },
    { name: 'height', selector: { text: {} } }] },
  { type: 'expandable', name: '', flatten: true, title: 'When shown in a popup', icon: 'mdi:dock-window', schema: [
    { name: 'popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'window', label: 'Window (rounded panel)' }, { value: 'fullscreen', label: 'Full screen (edge to edge, safe areas)' }] } } },
    { name: 'swipe_to_close', selector: { boolean: {} } }] }];
Object.assign(LABELS, { popup_style: 'Popup style', swipe_to_close: 'Swipe down to close (shows a grabber)' });
Object.assign(HELPERS, { popup_style: 'Full screen also needs the popup itself to be full screen; the Music tile sets that up for you.' });
Object.assign(LABELS, { auto_select: 'Show whichever player is playing first', art_background: 'Blurred artwork background (crossfades on track change)', show_progress: 'Progress bar',
  show_volume: 'Volume button', show_output: 'Speaker / output picker', show_extra: 'Lyrics, queue and … buttons (open more-info)', uppercase_title: 'Uppercase title',
  idle_title: 'Text when nothing is playing (default "Not Playing")', output_title: 'Speaker list heading (default "Speakers")', height: 'Fixed height (CSS)' });
Object.assign(HELPERS, { entities: 'Players to switch between (the speaker pill). The first entry above is the default.',
  height: 'Leave empty on a dashboard. In a popup use e.g. min(calc(var(--hv-vh,100dvh) - 48px), 640px).' });

/* ---------------- camera (live view tile + large view popup) ---------------- */
// Live camera tile in the HomeView glass style: muted live stream (or a refreshing snapshot), name / status overlay and an
// optional row of glass buttons for any entities (show live on/off state; tap = their own tap action, default toggle or
// more-info). Tap the picture = larger view as a browser_mod popup (window or full screen, swipe down to close).
const HV_SIZES = { '2x3': { columns: 3, rows: 2 }, '2x6': { columns: 6, rows: 2 }, '4x6': { columns: 6, rows: 4 }, '4x3': { columns: 3, rows: 4 } };
// the camera also has a portrait size: 4 rows × 3 columns (one tile wide, two tiles tall)
const SIZE_OPTS_FIXED = [{ value: '2x3', label: '2 × 3 (one tile)' }, { value: '2x6', label: '2 × 6 (two tiles wide)' }, { value: '4x6', label: '4 × 6 (2 tiles wide & tall)' }, { value: '4x3', label: '4 × 3 Tall (one tile wide, two tiles tall)' }];
// responsive sizes (phones / portrait): a share of the section's width, height follows the width (Tile shape)
const RESP_SIZES = { 'r3': { columns: 3, rows: 'auto' }, 'r4': { columns: 4, rows: 'auto' }, 'r6': { columns: 6, rows: 'auto' }, 'r12': { columns: 12, rows: 'auto' } };
const RESP_OPTS = [{ value: 'r3', label: 'Responsive · 3 columns (¼ of a section)' }, { value: 'r4', label: 'Responsive · 4 columns (⅓)' },
  { value: 'r6', label: 'Responsive · 6 columns (½)' }, { value: 'r12', label: 'Responsive · 12 columns (full section width)' }];
const CAM_SIZES = Object.assign({}, HV_SIZES, { '4x3': { columns: 3, rows: 4 } });
const CAM_ASPECT = { '2x3': '1.3', '2x6': '2.75', '4x6': '1.3', '4x3': '0.62' };
const CAM_POPUP_W = 'min(94vw, 960px)';
const CAM_POPUP_HEIGHT = `min(calc(var(--hv-vh, 100dvh) - 24px), calc(${CAM_POPUP_W} * 0.5625 + 0px))`;
const CAM_POPUP_CSS = `ha-dialog,ha-adaptive-dialog{--dialog-surface-margin-top:max(8px, calc((var(--hv-vh, 100dvh) - ${CAM_POPUP_HEIGHT}) / 2)) !important;--popup-min-height:0px !important;--popup-max-height:calc(100dvh - 16px) !important;--popup-border-radius:26px !important;--popup-min-width:${CAM_POPUP_W} !important;--popup-max-width:94vw !important;--popup-width-full:94vw !important;--popup-padding-x:0px !important;--popup-padding-y:0px !important;--ha-dialog-surface-background:transparent;--mdc-theme-surface:transparent;--wa-color-surface-raised:transparent;--ha-card-background:transparent;--card-background-color:transparent;--primary-text-color:#fff;--dialog-box-shadow:none;--dialog-backdrop-filter:blur(6px);--mdc-dialog-scrim-color:rgba(0,0,20,.45)}.content .container{padding:0 !important}@media (max-height:520px){ha-dialog,ha-adaptive-dialog{--popup-max-height:100dvh !important}.content .container{padding:12px 0 !important}}`;
const CAM_TOGGLE = ['light', 'switch', 'fan', 'input_boolean', 'cover', 'siren', 'humidifier', 'automation', 'valve', 'group', 'climate', 'media_player', 'water_heater', 'lock'];
const CAM_CSS = `
:host{display:block;width:100%;height:100%;aspect-ratio:var(--hv-cam-aspect,1.3);-webkit-tap-highlight-color:transparent}
:host([fixed]){aspect-ratio:auto}
ha-card{position:relative !important;height:100%;width:100%;box-sizing:border-box;overflow:hidden !important;border-radius:var(--hv-radius,22px) !important;
 border:1px solid var(--hv-border,rgba(255,255,255,.35)) !important;box-shadow:var(--hv-shadow,0 8px 24px rgba(0,0,30,.16)) !important;
 background:#0d1117 !important;font-family:${FONT};color:#fff;container-type:size;user-select:none;-webkit-user-select:none;cursor:pointer;touch-action:manipulation}
ha-card::before,ha-card::after{content:none !important;display:none !important}
:host([large]) ha-card{border-radius:26px !important;border:1px solid rgba(255,255,255,.12) !important;cursor:default;touch-action:none;background:#05070a !important}
:host([fs]) ha-card{border-radius:0 !important;border:none !important;box-shadow:none !important}
:host([dragging]) ha-card{cursor:grabbing}
.media,.media>*{position:absolute;inset:0;width:100%;height:100%}
.media img{object-fit:cover;opacity:0;transition:opacity .4s ease} .media img.on{opacity:1}
:host([large]) .media img{object-fit:contain}
.media ha-camera-stream{opacity:0;transition:opacity .5s ease;--video-max-height:100%;display:block}
.media ha-camera-stream.on{opacity:1}
.ph{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;text-align:center;padding:0 12px;box-sizing:border-box;align-items:center;justify-content:center;color:rgba(255,255,255,.55);font-size:13px;font-weight:600;
 background:linear-gradient(160deg,#2b3340,#151a22)} .ph ha-icon{--mdc-icon-size:min(34px,22cqh)} .has .ph{display:none}
.media img.pv{object-fit:cover} .st.tap .dot{display:none}
.ev .e.src{background:rgba(20,22,28,.5)}
.ph.poster{background:radial-gradient(120% 90% at 20% 0%,rgba(120,150,210,.38),rgba(0,0,0,0) 60%),radial-gradient(90% 80% at 100% 100%,rgba(150,120,220,.28),rgba(0,0,0,0) 60%),linear-gradient(160deg,#2b3340,#141821);color:rgba(255,255,255,.82)}
.ph.poster .pi{display:flex;align-items:center;justify-content:center;width:min(54px,30cqh);height:min(54px,30cqh);border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.ph.poster .pi ha-icon{--mdc-icon-size:min(26px,15cqh)}
.ph .pi{display:none} .ph.poster>ha-icon{display:none} .ph.poster .pi{display:flex}
.err{position:absolute;inset:0;z-index:2;display:none;flex-direction:column;gap:10px;align-items:center;justify-content:center;text-align:center;padding:0 18px;box-sizing:border-box;
 background:linear-gradient(160deg,rgba(43,51,64,.92),rgba(21,26,34,.94));font-size:13px;font-weight:600;color:rgba(255,255,255,.88)} .err.on{display:flex}
.err button{padding:8px 18px;font-size:13px;font-weight:650} .err ha-icon{--mdc-icon-size:26px;opacity:.8}
.hasrow .ph{padding:clamp(28px,22cqh,48px) 12px clamp(36px,30cqh,64px)} .ph.t ha-icon{opacity:.8}
@container (max-height:180px){ .ph.t>ha-icon{display:none} }
.shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 62%,rgba(0,0,0,.42) 100%)}
.ov{position:absolute;z-index:3;left:var(--p);top:var(--p);right:var(--p);display:flex;align-items:center;gap:8px;pointer-events:none;--p:clamp(8px,4.5cqmin,16px)}
:host([large]) .ov{--p:clamp(12px,3cqmin,22px);right:calc(var(--p) + 52px);top:calc(var(--p) + env(safe-area-inset-top,0px) * var(--hv-cam-safe,0) + 8px);left:calc(var(--p) + env(safe-area-inset-left,0px) * var(--hv-cam-safe,0))}
.chip{display:flex;align-items:center;gap:7px;min-width:0;padding:5px 11px 5px 9px;border-radius:999px;background:rgba(20,22,28,.38);border:1px solid rgba(255,255,255,.16);
 backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);box-shadow:0 2px 10px rgba(0,0,0,.18)}
.nm{font-size:clamp(12px,6.2cqmin,15px);font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,.35)}
:host([large]) .nm{font-size:clamp(13px,2.6cqmin,17px)}
.st{font-size:clamp(10px,5cqmin,12px);font-weight:600;color:rgba(255,255,255,.75);white-space:nowrap;display:flex;align-items:center;gap:5px}
.dot{width:7px;height:7px;border-radius:50%;background:#9aa3ad;flex:none} .live .dot{background:#ff453a;box-shadow:0 0 0 3px rgba(255,69,58,.25);animation:hvcamp 2s ease-in-out infinite}
@container (max-width:200px){ .sx{display:none} .chip{gap:6px;padding:5px 10px 5px 9px} }
@keyframes hvcamp{50%{box-shadow:0 0 0 5px rgba(255,69,58,0)}}
.x{position:absolute;z-index:3;top:calc(clamp(12px,3cqmin,22px) + env(safe-area-inset-top,0px) * var(--hv-cam-safe,0) + 6px);right:calc(clamp(12px,3cqmin,22px) + env(safe-area-inset-right,0px) * var(--hv-cam-safe,0));
 width:38px;height:38px;display:none} :host([large]) .x{display:flex}
button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;border-radius:999px;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,background .2s,color .2s}
button:active{transform:scale(.92)} button:focus-visible{outline:2px solid rgba(255,255,255,.7);outline-offset:2px}
.glass{background:rgba(20,22,28,.38);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);box-shadow:0 2px 12px rgba(0,0,0,.2)}
ha-icon,ha-state-icon{display:flex;color:inherit;--mdc-icon-size:calc(var(--b) * .5)}
.x ha-icon{--mdc-icon-size:20px}
/* button row: scales with the tile; icons only on small tiles, icon + name when there is room */
.row{position:absolute;left:var(--p);right:var(--p);bottom:var(--p);display:flex;justify-content:center;gap:var(--g);z-index:2;--p:clamp(7px,4cqmin,16px);
 --b:clamp(30px,min(24cqh,15cqw),46px);--g:clamp(6px,2.4cqw,12px)}
.row:empty{display:none}
.row button{height:var(--b);min-width:var(--b);flex:0 1 auto;min-width:0;max-width:100%;padding:0 calc(var(--b) * .25);gap:7px}
.row button .l{display:none;font-size:calc(var(--b) * .32);font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row button.on{background:rgba(255,255,255,.9);color:#1c1c1e;border-color:rgba(255,255,255,.9)}
.row button.un{opacity:.45}
.row.lbl button .l{display:block} .row.lbl button{padding:0 calc(var(--b) * .42) 0 calc(var(--b) * .3)}
@container (min-height:300px){ .row{--b:clamp(36px,min(13cqh,11cqw),50px)} }
:host([large]) .row{--b:clamp(40px,min(9cqh,8cqw),54px);--g:12px;--p:clamp(14px,3cqmin,26px);bottom:calc(var(--p) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0))}
:host([fs]){--hv-cam-safe:1}
.bdg{flex:none;font-size:clamp(9px,4.4cqmin,11px);font-weight:750;letter-spacing:.3px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.22);color:#fff;white-space:nowrap}
.bdg:empty{display:none}
@container (max-width:200px){ .bdg{display:none} }
/* 1.32.0: last-event chips (event entities: doorbell, motion …) */
.ev{position:absolute;left:var(--p);right:var(--p);bottom:var(--p);display:flex;flex-wrap:wrap;gap:6px;pointer-events:none;z-index:1;--p:clamp(8px,4.5cqmin,16px)}
.ev:empty{display:none} :host(:not([large])) ha-card.hasrow .ev{display:none}
.ev .e{display:flex;align-items:center;gap:5px;min-width:0;padding:4px 10px 4px 8px;border-radius:999px;background:rgba(20,22,28,.38);border:1px solid rgba(255,255,255,.16);
 backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);font-size:clamp(10px,5cqmin,12px);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ev .e ha-icon{--mdc-icon-size:14px;flex:none} .ev .e span{overflow:hidden;text-overflow:ellipsis}
@container (max-height:120px){ .ev .e:nth-child(n+2){display:none} }
@container (max-height:180px){ .ev{flex-wrap:nowrap;overflow:hidden} .ph.poster *{display:none !important} }
:host([large]) .ev{justify-content:center;--p:clamp(14px,3cqmin,26px);bottom:calc(var(--p) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0))}
:host([large]) ha-card.hasctl .ev{bottom:calc(var(--p) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0) + 132px)}
:host([large]) .ev .e{font-size:13px;padding:6px 12px 6px 10px}
/* 1.32.0: large-view controls (History, Talk in the vendor app, Sound) */
.ctl{display:none;position:absolute;left:0;right:0;z-index:2;justify-content:center;align-items:flex-start;gap:clamp(22px,7cqw,44px);
 bottom:calc(clamp(14px,3cqmin,26px) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0))}
:host([large]) .ctl:not(:empty){display:flex}
.ctl .c{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:600;color:rgba(255,255,255,.92);text-shadow:0 1px 4px rgba(0,0,0,.45);min-width:64px;text-align:center}
.ctl button{width:54px;height:54px;margin-top:13px} .ctl button ha-icon{--mdc-icon-size:24px}
.ctl .talk button{width:80px;height:80px;margin-top:0;background:rgba(120,180,255,.3);border-color:rgba(170,210,255,.8);box-shadow:0 0 0 8px rgba(120,180,255,.13),0 10px 30px rgba(0,0,0,.35)}
.ctl .talk ha-icon{--mdc-icon-size:36px} .ctl .talk b{font-size:15px} .ctl small{font-size:11px;font-weight:500;opacity:.78;margin-top:-4px;white-space:nowrap}
.ctl .c.on button{background:rgba(255,255,255,.9);color:#1c1c1e;border-color:rgba(255,255,255,.9)}
:host([large]) ha-card.hasctl .row{bottom:calc(var(--p) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0) + 132px)}
:host([large]) ha-card.hasctl.hasev .row{bottom:calc(var(--p) + env(safe-area-inset-bottom,0px) * var(--hv-cam-safe,0) + 176px)}
.grab{position:absolute;z-index:6;left:50%;top:calc(env(safe-area-inset-top,0px) * var(--hv-cam-safe,0) + 7px);width:38px;height:5px;margin-left:-19px;border-radius:3px;
 background:rgba(255,255,255,.5);box-shadow:0 1px 4px rgba(0,0,0,.3);display:none;pointer-events:none}
:host([swipe]) .grab{display:block}
`;
// 1.32.0: "Talk" opens the camera maker's app (Home Assistant has no two-way talk for Nest / Ring). Custom URL schemes: the iOS / Android
// companion apps hand window.open() of these to the system (as HA's own "url" tap action does).
const CAM_TALK = { google_home: { url: 'googlehome://', label: 'Google Home' }, ring: { url: 'ring://', label: 'Ring' } };
// 1.32.0: the camera's maker from its integration (entity registry platform), else brand / attribution
function camVendor(h, id) { const e = h && h.entities && h.entities[id], st = h && h.states[id], a = (st && st.attributes) || {};
  const p = String((e && e.platform) || '').toLowerCase(), t = (String(a.brand || '') + ' ' + String(a.attribution || '')).toLowerCase();
  if (p === 'nest' || /google nest|\bnest\b/.test(t)) return 'nest'; if (p === 'ring' || /ring\.com|\bring\b/.test(t)) return 'ring'; return p || ''; }
const CAM_VENDOR = { nest: { badge: 'Nest', talk: 'google_home' }, ring: { badge: 'Ring', talk: 'ring' } };
// Google's SDM API rate-limits live streams (GenerateWebRtcStream / ExtendWebRtcStream) per user: Nest tiles show a poster and only
// the opened large view streams (one stream, stopped when it closes, no automatic retries)
const CAM_RATE = /429|RESOURCE_EXHAUSTED|Too Many Requests|Rate limited/i;
// 1.32.0: still previews for tiles without live video (Nest): the newest of the last Nest event image (Home Assistant's Nest media
// source, read when an event entity changes) and the last frame seen in the large view (saved in this browser, and for admins also
// in Home Assistant's media folder, /media/nothomeview_camera_previews/<camera>.jpg, one file per camera, overwritten).
// No camera commands: nothing here starts a stream.
const CAM_PV_DIR = 'nothomeview_camera_previews', CAM_PV_LS = 'hvCamPrev:', camPvFile = id => String(id).split('.').pop() + '.jpg', camPvCache = {};
function camPvLocal(id) { try { const j = JSON.parse(localStorage.getItem(CAM_PV_LS + id) || 'null'); if (j && j.d && j.t) return { url: j.d, t: j.t, kind: 'viewed', label: 'Viewed' }; } catch (e) {} return null; }
function camPvShared(h, id) { const k = 's' + id;
  if (!camPvCache[k]) camPvCache[k] = (async () => { try {
    const r = await h.callWS({ type: 'media_source/resolve_media', media_content_id: `media-source://media_source/local/${CAM_PV_DIR}/${camPvFile(id)}` });
    const res = await fetch(h.hassUrl ? h.hassUrl(r.url) : r.url, { cache: 'no-store' }); if (!res.ok) return null;
    const lm = Date.parse(res.headers.get('last-modified') || ''), b = await res.blob(); if (!b.size || !/^image\//.test(b.type || 'image/')) return null;
    return { url: URL.createObjectURL(b), t: isNaN(lm) ? 1 : lm, kind: 'viewed', label: 'Viewed' }; } catch (e) { return null; } })();
  return camPvCache[k]; }
function camPvEvent(h, id, key) { const e = h.entities && h.entities[id], dev = e && e.device_id; if (!dev) return Promise.resolve(null); const k = 'e' + id + '|' + key;
  if (!camPvCache[k]) camPvCache[k] = (async () => { try {
    const r = await h.callWS({ type: 'media_source/browse_media', media_content_id: `media-source://nest/${dev}` });
    const ev = (r.children || []).filter(x => x.thumbnail).map(x => { const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*(.*)$/.exec(x.title || '');
      return { x, t: m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime() : 0, label: m && m[7] ? m[7].split(/[,·]/)[0].trim() : 'Event' }; }).sort((a, b) => b.t - a.t);
    if (!ev.length) return null; const n = ev[0]; let url = n.x.thumbnail;
    if (/^\/api\//.test(url)) { const sg = await h.callWS({ type: 'auth/sign_path', path: url, expires: 3600 }); url = sg.path; }
    return { url: h.hassUrl ? h.hassUrl(url) : url, t: n.t || 1, kind: 'event', label: n.label || 'Event' }; } catch (e) { return null; } })();
  return camPvCache[k]; }
async function camPvSave(h, id, d) { const t = Date.now();
  const put = () => localStorage.setItem(CAM_PV_LS + id, JSON.stringify({ t, d }));
  try { put(); } catch (e) { try { Object.keys(localStorage).filter(k => k.startsWith(CAM_PV_LS) && k !== CAM_PV_LS + id).forEach(k => localStorage.removeItem(k)); put(); } catch (e2) {} }
  window.dispatchEvent(new CustomEvent('hv-cam-preview', { detail: { entity: id } }));
  if (!(h && h.user && h.user.is_admin) || !h.fetchWithAuth) return;
  try { const b = await (await fetch(d)).blob(), fd = new FormData(); fd.append('media_content_id', `media-source://media_source/local/${CAM_PV_DIR}`); fd.append('file', b, camPvFile(id));
    const r = await h.fetchWithAuth('/api/media_source/local_source/upload', { method: 'POST', body: fd }); delete camPvCache['s' + id];
    (window.__hvCamPv = window.__hvCamPv || []).push({ id, ok: r.ok, status: r.status, size: b.size, t });
  } catch (e) { console.warn('NotHomeView: camera preview upload failed', e); } }
const CAM_EV_ICON = { doorbell: 'mdi:doorbell', motion: 'mdi:motion-sensor', button: 'mdi:gesture-tap-button' };
function camWhen(h, v) { // event entity state (ISO time) -> "8:42 PM" today, "Yesterday 8:42 PM", else "Oct 27"
  const d = v && !UNAVAILABLE.includes(v) && v !== 'unknown' ? new Date(v) : null; if (!d || isNaN(d)) return 'none yet';
  const L = (h && h.locale) || {}, lang = L.language || (h && h.language) || navigator.language, o = { hour: 'numeric', minute: '2-digit' };
  if (L.time_format === '12') o.hour12 = true; else if (L.time_format === '24') o.hour12 = false;
  const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), dd = Math.round((day(new Date()) - day(d)) / 864e5);
  let t; try { t = d.toLocaleTimeString(lang, o); } catch (e) { t = d.toLocaleTimeString(); }
  if (dd <= 0) return t; if (dd === 1) return 'Yesterday ' + t;
  try { return d.toLocaleDateString(lang, { month: 'short', day: 'numeric' }); } catch (e) { return d.toLocaleDateString(); }
}
class HVCameraCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { camera_view: 'live', size: '2x3', show_name: true, show_status: true, tap_opens: true, popup_style: 'fullscreen', swipe_to_close: true, show_history: true, show_sound: true, show_preview: true }; }
  static getStubConfig(hass) { const ids = Object.keys(hass.states).filter(k => k.startsWith('camera.')); return { entity: ids.find(k => !UNAVAILABLE.includes(hass.states[k].state)) || ids[0] || 'camera.example' }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  // the Size dropdown writes grid_options (sections grid cells) when it is changed
  static editorTransform(cfg, val, prev) {
    const ns = val.size || '2x3', ps = (prev && prev.size) || '2x3';
    if (ns !== ps && CAM_SIZES[ns]) cfg.grid_options = Object.assign({}, cfg.grid_options || {}, CAM_SIZES[ns]);
    if (Array.isArray(cfg.buttons)) { cfg.buttons = cfg.buttons.filter(b => b && b.entity).map(b => { const o = {}; for (const k of Object.keys(b)) if (b[k] !== '' && b[k] != null) o[k] = b[k]; return o; }); if (!cfg.buttons.length) delete cfg.buttons; }
    if (Array.isArray(cfg.events)) { cfg.events = cfg.events.filter(b => b && b.entity).map(b => { const o = {}; for (const k of Object.keys(b)) if (b[k] !== '' && b[k] != null) o[k] = b[k]; return o; }); if (!cfg.events.length) delete cfg.events; }
    if (cfg.live_tile === true) cfg.live_tile = 'on'; else if (cfg.live_tile === false) cfg.live_tile = 'off'; else if (cfg.live_tile !== 'on' && cfg.live_tile !== 'off') delete cfg.live_tile;
    if (!cfg.talk_app || cfg.talk_app === 'auto') { delete cfg.talk_app; } if (cfg.talk_app !== 'custom') { delete cfg.talk_url; delete cfg.talk_label; }
    return cfg;
  }
  setConfig(c) {
    if (!c || !c.entity) throw new Error('Please choose a camera');
    const prev = this._config;
    this._config = Object.assign({}, this.constructor.defaults, c);
    const C = this._config;
    if (C.height) { this.setAttribute('fixed', ''); this.style.height = C.height; } else { this.removeAttribute('fixed'); this.style.removeProperty('height'); }
    this.style.setProperty('--hv-cam-aspect', CAM_ASPECT[C.size] || '1.3');
    this.toggleAttribute('large', !!C.large); this.toggleAttribute('fs', !!C.large && C.popup_style === 'fullscreen');
    if (this._built && (!prev || prev.entity !== C.entity || prev.camera_view !== C.camera_view)) this._mediaKey = null;
    this._swipeAttr(); this._sig = null; this._render();
  }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  getCardSize() { return ({ '2x3': 3, '2x6': 3, '4x6': 6, '4x3': 6 })[(this._config || {}).size] || 3; }
  getGridOptions() { const g = CAM_SIZES[(this._config || {}).size] || CAM_SIZES['2x3']; return Object.assign({}, g, { min_columns: 3, min_rows: 2 }); }
  getLayoutOptions() { const g = this.getGridOptions(); return { grid_columns: Math.max(1, Math.round(g.columns / 3)), grid_rows: g.rows, grid_min_columns: 1, grid_min_rows: 2 }; }
  connectedCallback() { if (!this._pvH) this._pvH = ev => { if (this._config && ev.detail && ev.detail.entity === this._config.entity && !this._config.large) { this._pvBump = (this._pvBump || 0) + 1; this._prevCheck(); } };
    addEventListener('hv-cam-preview', this._pvH); this._render(); this._resetDrag(); this._timer(); setTimeout(() => this._swipeAttr(), 0); setTimeout(() => this._swipeAttr(), 400); }
  disconnectedCallback() { removeEventListener('hv-cam-preview', this._pvH); clearInterval(this._iv); this._iv = null; const me = this; setTimeout(() => { if (!me.isConnected && me._streamEl) { me._stopStream(); me._mediaKey = null; } }, 0); }
  _timer() { clearInterval(this._iv); this._iv = setInterval(() => this._tick(), 1000); }
  get _stateObj() { return this._hass && this._config ? this._hass.states[this._config.entity] : undefined; }
  _btns() { return (this._config.buttons || []).map(b => typeof b === 'string' ? { entity: b } : b).filter(b => b && b.entity); }
  _evs() { return (this._config.events || []).map(b => typeof b === 'string' ? { entity: b } : b).filter(b => b && b.entity); }
  _vendor() { return camVendor(this._hass, this._config.entity); }
  _badge() { const c = this._config; if (c.badge === 'none') return ''; if (c.badge && c.badge !== 'auto') return c.badge; const v = CAM_VENDOR[this._vendor()]; return v ? v.badge : ''; }
  _talkApp() { const c = this._config; if (c.talk_app && c.talk_app !== 'auto') return c.talk_app; const v = CAM_VENDOR[this._vendor()]; return v ? v.talk : 'none'; }
  // live video on the tile: live_tile true / false; default off for Nest (rate limits), on for the others. The large view always streams.
  _tileLive() { const c = this._config; if (c.large) return true; if (c.live_tile === true || c.live_tile === 'on') return true; if (c.live_tile === false || c.live_tile === 'off') return false; return this._vendor() !== 'nest'; }
  _noSnap() { return this._vendor() === 'nest'; }
  // a still preview instead of live video on the tile (Nest by default, or live_tile: off)
  _previewMode() { const c = this._config; if (c.show_preview === false || c.camera_view === 'snapshot') return false; if (c.live_tile === true || c.live_tile === 'on') return false; if (c.live_tile === false || c.live_tile === 'off') return true; return this._vendor() === 'nest'; }
  _prevCheck() { if (this._config.large || !this._previewMode() || !this._hass) return;
    const h = this._hass, id = this._config.entity;
    if (this._pvIdsFor !== id) { const dev = (h.entities[id] || {}).device_id; this._pvIdsFor = id; this._pvIds = dev ? Object.values(h.entities).filter(e => e.device_id === dev && /^event\./.test(e.entity_id)).map(e => e.entity_id) : []; }
    const evk = this._evs().map(e => e.entity).concat(this._pvIds).map(e => (h.states[e] || {}).state).join('|');
    const key = this._config.entity + '#' + evk + '#' + (this._pvBump || 0); if (key === this._pvKey) return; this._pvKey = key; this._prevLoad(evk); }
  async _prevLoad(evk) { const h = this._hass, id = this._config.entity, tok = this._pvTok = (this._pvTok || 0) + 1;
    const all = (await Promise.all([camPvLocal(id), camPvShared(h, id), camPvEvent(h, id, evk)])).filter(Boolean).sort((a, b) => b.t - a.t);
    if (tok !== this._pvTok) return; this._pvList = all; this._prevShow(0); }
  _prevShow(i) { const p = (this._pvList || [])[i], img = this._$('.pv'); if (!img) return;
    if (!p) { this._pv = null; img.classList.remove('on'); img.removeAttribute('src'); if (!this._snapOk) this._card.classList.remove('has'); this._sig = null; this._render(); return; }
    img.onload = () => { this._pv = p; img.classList.add('on'); this._card.classList.add('has'); this._sig = null; this._render(); };
    img.onerror = () => this._prevShow(i + 1); if (img.src !== p.url) img.src = p.url; else img.onload(); }
  // large view: once the live video has played for a moment, keep one small frame as this camera's preview
  _capture() { const c = this._config; if (this._captured || !c.large || !this._previewMode() || !this._live) return;
    const v = this._videos().find(x => x.readyState >= 2 && x.videoWidth && !x.paused); if (!v) { this._capAt = 0; return; }
    if (!this._capAt) { this._capAt = Date.now(); return; } if (Date.now() - this._capAt < 1500) return; this._captured = true;
    try { const w = Math.min(640, v.videoWidth), hh = Math.round(v.videoHeight * w / v.videoWidth), cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
      cv.getContext('2d').drawImage(v, 0, 0, w, hh); let d = cv.toDataURL('image/jpeg', 0.72); if (d.length > 110000) d = cv.toDataURL('image/jpeg', 0.55);
      if (d.length > 2000) camPvSave(this._hass, c.entity, d); } catch (e) { console.warn('NotHomeView: camera frame not captured', e); } } // Nest WebRTC cameras have no still images in Home Assistant
  _talk() { const c = this._config, t = CAM_TALK[this._talkApp()]; if (this._talkApp() === 'custom') return c.talk_url ? { url: c.talk_url, label: c.talk_label || 'app' } : null; return t || null; }
  // large view: the glass control row (only controls that work: History = HA history of the camera + its events, Talk = vendor app,
  // Sound = unmute the live stream, shown once the stream carries an audio track)
  _ctlItems() { const c = this._config; if (!c.large) return []; const o = [], t = this._talk();
    if (c.show_history !== false) o.push({ k: 'hist', icon: 'mdi:history', label: 'History' });
    if (t) o.push({ k: 'talk', icon: 'mdi:microphone', label: c.talk_name || 'Talk', cap: 'Opens ' + t.label });
    if (c.show_sound !== false && this._hasAudio) o.push({ k: 'snd', icon: this._unmuted ? 'mdi:volume-high' : 'mdi:volume-off', label: this._unmuted ? 'Sound on' : 'Sound', on: !!this._unmuted });
    return o; }
  _ctl(k) { const c = this._config;
    if (k === 'talk') { const t = this._talk(); if (t && t.url) window.open(t.url); return; }
    if (k === 'hist') { const ids = [c.entity].concat(this._evs().map(e => e.entity)).join(','), st = new Date(Date.now() - 24 * 3600e3).toISOString();
      const path = `/history?entity_id=${encodeURIComponent(ids)}&start_date=${encodeURIComponent(st)}`; this._close();
      setTimeout(() => { history.pushState(null, '', path); fire(window, 'location-changed', { replace: false }); }, 380); return; }
    if (k === 'retry') { this._err = null; this._$('.err').classList.remove('on'); this._mediaKey = null; this._ensureMedia(true); this._status(); return; }
    if (k === 'snd') { this._unmuted = !this._unmuted; this._applyMute(); this._sig = null; this._render(); }
  }
  _videos() { const o = [], w = r => { for (const e of r.querySelectorAll('*')) { if (e.tagName === 'VIDEO') o.push(e); if (e.shadowRoot) w(e.shadowRoot); } }; try { if (this._streamEl) w(this._streamEl.shadowRoot || this._streamEl); } catch (e) {} return o; }
  _applyMute() { const m = !this._unmuted; if (this._streamEl) this._streamEl.muted = m; for (const v of this._videos()) { v.muted = m; if (!m) { try { v.play(); } catch (e) {} } } }
  _audioCheck() { if (this._hasAudio || !this._config.large || this._config.show_sound === false || !this._live) return;
    const has = this._videos().some(v => { try { const so = v.srcObject; if (so && so.getAudioTracks && so.getAudioTracks().length) return true; if (v.audioTracks && v.audioTracks.length) return true; if (v.mozHasAudio || v.webkitAudioDecodedByteCount > 0) return true; } catch (e) {} return false; });
    if (has) { this._hasAudio = true; this._sig = null; this._render(); } }
  _build() {
    this.shadowRoot.innerHTML = `<style>${CAM_CSS}</style><ha-card tabindex="0" role="button">
      <div class="media"><div class="ph"><ha-icon icon="mdi:cctv"></ha-icon><span class="pi"><ha-icon icon="mdi:cctv"></ha-icon></span><span class="pt"></span></div><img alt=""><img alt=""><img class="pv" alt=""></div><div class="shade"></div>
      <div class="err"><ha-icon icon="mdi:video-off-outline"></ha-icon><span class="et"></span><button class="glass" data-own data-c="retry">Retry</button></div>
      <div class="ov"><div class="chip"><div class="nm"></div><span class="bdg"></span><div class="st"><span class="dot"></span><span class="sx"></span></div></div></div>
      <button class="x glass" data-own aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
      <div class="ev"></div><div class="row"></div><div class="ctl"></div><div class="grab" aria-hidden="true"></div></ha-card>`;
    const R = this.shadowRoot; this._$ = s => R.querySelector(s);
    this._card = this._$('ha-card'); this._media = this._$('.media'); this._imgs = [...R.querySelectorAll('.media img')]; this._imgI = 0;
    this._card.addEventListener('click', e => {
      if (this._suppressClick) return;
      const b = e.composedPath().find(n => n.tagName === 'BUTTON');
      if (b) { e.stopPropagation(); if (b.classList.contains('x')) this._close(); else if (b.dataset.i != null) this._runButton(+b.dataset.i); else if (b.dataset.c) this._ctl(b.dataset.c); return; }
      if (!this._config.large && this._config.tap_opens !== false) this.openLarge();
      else if (!this._config.large) fire(this, 'hass-more-info', { entityId: this._config.entity });
    });
    if (this._config.large) { const og = this._hvOrigin || (this._hvOrigin = hvPopTake()), x = this._card.querySelector('.x'); if (og && x && hvPenOK(og, og._hass)) hvPen(x, () => { this._close(); setTimeout(() => hvPopEdit(og, { card: og }), 420); }); } // 1.32.0: edit pencil
    this._card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === this._card) { e.preventDefault(); if (!this._config.large) this.openLarge(); } });
    this._bindSwipe(); this._built = true;
    if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this._fit()); this._ro.observe(this._card); }
  }
  // names next to the icons only when every button gets about 110 px; otherwise round icon buttons
  _fit() { const row = this._$('.row'), n = row.children.length; if (!n) return; const w = this._card.clientWidth - 32; row.classList.toggle('lbl', w / n >= (this._config.large ? 130 : 132)); }
  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();
    const c = this._config, s = this._stateObj, btns = this._btns();
    const evs = this._evs(), ctl = this._ctlItems(), dayKey0 = new Date().toDateString();
    const sig = JSON.stringify([s && s.state, btns.map(b => { const x = this._hass.states[b.entity]; return x ? [x.state, x.attributes.friendly_name] : 0; }), c,
      evs.map(e => { const x = this._hass.states[e.entity]; return x ? [x.state, x.attributes.event_type] : 0; }), ctl, dayKey0, this._pv && [this._pv.kind, this._pv.t], Math.floor(Date.now() / 60e3)]);
    this._media.classList.toggle('dead', !s || UNAVAILABLE.includes(s.state));
    this._ensureMedia(); this._prevCheck();
    if (sig === this._sig) return; this._sig = sig;
    const name = c.name != null && c.name !== '' ? c.name : (s ? s.attributes.friendly_name || s.entity_id : c.entity);
    this._$('.nm').textContent = name; this._$('.ov').style.display = c.show_name === false && c.show_status === false ? 'none' : '';
    this._$('.nm').style.display = c.show_name === false ? 'none' : ''; this._$('.st').style.display = c.show_status === false ? 'none' : '';
    this._$('.pt').textContent = !s ? 'Camera not found' : UNAVAILABLE.includes(s.state) ? 'Camera unavailable' : ''; this._$('.ph').classList.toggle('t', !!this._$('.pt').textContent);
    this._card.setAttribute('aria-label', name);
    this._$('.bdg').textContent = this._badge();
    const ev = this._$('.ev'); ev.innerHTML = ''; this._card.classList.toggle('hasev', evs.length > 0 || !!(this._pv && !c.large));
    if (this._pv && !c.large) { const p = this._pv, el = document.createElement('div'); el.className = 'e src'; const ic = document.createElement('ha-icon'); ic.icon = p.kind === 'viewed' ? 'mdi:eye-outline' : 'mdi:image-outline';
      const tx = document.createElement('span'); tx.textContent = p.label + ' · ' + camWhen(this._hass, new Date(p.t).toISOString()); el.append(ic, tx); ev.appendChild(el); }
    for (const e of evs) { const x = this._hass.states[e.entity], dc = x && x.attributes.device_class;
      const el = document.createElement('div'); el.className = 'e'; const ic = document.createElement('ha-icon'); ic.icon = e.icon || CAM_EV_ICON[dc] || 'mdi:bell-ring-outline';
      const tx = document.createElement('span'); tx.textContent = (e.name || (x ? x.attributes.friendly_name : e.entity)) + ' · ' + (x ? camWhen(this._hass, x.state) : 'not found');
      el.append(ic, tx); ev.appendChild(el); }
    const cb = this._$('.ctl'); this._card.classList.toggle('hasctl', ctl.length > 0);
    cb.innerHTML = ctl.map(o => `<div class="c ${o.k === 'talk' ? 'talk' : ''} ${o.on ? 'on' : ''}"><button class="glass" data-own data-c="${o.k}"><ha-icon></ha-icon></button><b></b>${o.cap ? '<small></small>' : ''}</div>`).join('');
    ctl.forEach((o, i) => { const d = cb.children[i]; d.querySelector('ha-icon').icon = o.icon; d.querySelector('b').textContent = o.label; d.querySelector('button').setAttribute('aria-label', o.label + (o.cap ? ' – ' + o.cap : ''));
      if (o.cap) d.querySelector('small').textContent = o.cap; });
    const row = this._$('.row'); this._card.classList.toggle('hasrow', btns.length > 0);
    row.innerHTML = btns.map((b, i) => `<button class="glass" data-own data-i="${i}"><span class="ic"></span><span class="l"></span></button>`).join('');
    btns.forEach((b, i) => {
      const el = row.children[i], x = this._hass.states[b.entity];
      const nm = b.name || (x ? x.attributes.friendly_name || b.entity : b.entity);
      el.classList.toggle('on', stateActive(x)); el.classList.toggle('un', !x || UNAVAILABLE.includes(x.state));
      el.setAttribute('aria-label', nm + (x ? ', ' + fmtState(this._hass, x) : '')); el.title = nm;
      el.querySelector('.l').textContent = nm;
      let ic; if (x) { ic = document.createElement('ha-state-icon'); ic.hass = this._hass; ic.stateObj = x; if (b.icon) ic.icon = b.icon; }
      else { ic = document.createElement('ha-icon'); ic.icon = b.icon || 'mdi:help-circle-outline'; }
      el.querySelector('.ic').appendChild(ic);
    });
    this._fit(); this._status();
  }
  // live stream (ha-camera-stream, muted, no controls) over a snapshot that refreshes; snapshot mode = the snapshot only
  _stopStream() { if (this._streamEl) { try { this._streamEl.remove(); } catch (e) {} this._streamEl = null; } this._live = false; }
  _ensureMedia() {
    const c = this._config, s = this._stateObj, live = this._tileLive() && c.camera_view !== 'snapshot';
    const key = c.entity + '|' + c.camera_view + '|' + (s && !UNAVAILABLE.includes(s.state) ? 1 : 0) + '|' + (live ? 'L' : 'P');
    if (this._streamEl) { this._streamEl.hass = this._hass; }
    if (key === this._mediaKey) return; this._mediaKey = key;
    this._stopStream(); this._err = null; const eo = this._$('.err'); if (eo) eo.classList.remove('on');
    this._lastSnap = 0; this._snapOk = false; this._snapErr = false; this._failed = false; this._snapFails = 0; this._snap();
    this._$('.ph').classList.toggle('poster', !live && this._noSnap());
    if (!s || UNAVAILABLE.includes(s.state) || !live || !this.isConnected) { if (!this.isConnected) this._mediaKey = null; return; }
    const make = () => {
      if (this._mediaKey !== key) return;
      const v = document.createElement('ha-camera-stream'); v.hass = this._hass; v.stateObj = s; v.muted = true; v.controls = false; v.allowExoPlayer = false;
      v.fitMode = c.large ? 'contain' : 'cover'; v.setAttribute('muted', ''); v.addEventListener('load', () => this._markLive(), true);
      this._media.appendChild(v); this._streamEl = v; this._streamAt = Date.now();
    };
    if (customElements.get('ha-camera-stream')) make();
    else HVCameraCard._loadStream().then(ok => ok && make());
  }
  static _loadStream() {
    if (!HVCameraCard._lp) HVCameraCard._lp = (async () => {
      try { if (window.loadCardHelpers) { const h = await window.loadCardHelpers(); const el = h.createCardElement({ type: 'picture-entity', entity: 'camera.hv_preload', camera_view: 'live' }); el && el.remove && el.remove(); } } catch (e) {}
      return Promise.race([customElements.whenDefined('ha-camera-stream').then(() => true), new Promise(r => setTimeout(() => r(!!customElements.get('ha-camera-stream')), 15000))]);
    })();
    return HVCameraCard._lp;
  }
  // the HA player shows its errors in an ha-alert inside its shadow roots: read it, stop the stream (no retry loop), show our own message
  _streamError() { const out = [], w = r => { for (const e of r.querySelectorAll('ha-alert')) out.push(e.textContent || ''); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) w(e.shadowRoot); };
    try { w(this._streamEl.shadowRoot || this._streamEl); } catch (e) {} const t = out.join(' ').trim(); return t || null; }
  _showErr(m) { this._err = m; this._stopStream(); const rate = CAM_RATE.test(m);
    this._$('.et').textContent = rate ? (this._vendor() === 'nest' ? 'Google is limiting live view. Try again in a minute.' : 'Live view is rate limited. Try again in a minute.') : 'Live view didn’t start. ' + m.replace(/\s+/g, ' ').slice(0, 120);
    this._$('.err').classList.add('on'); this._status(); }
  _markLive() { if (!this._streamEl) return; this._streamEl.classList.add('on'); if (!this._live) { this._live = true; this._status(); } }
  _videoReady() { // the players live in nested shadow roots; a <video> with decoded frames = live
    const find = r => { for (const e of r.querySelectorAll('*')) { if (e.tagName === 'VIDEO' && e.readyState >= 2 && e.videoWidth) return true; if (e.tagName === 'IMG' && e.complete && e.naturalWidth && /mjpeg|camera_proxy_stream/.test(e.src)) return true; if (e.shadowRoot && find(e.shadowRoot)) return true; } return false; };
    try { return this._streamEl && find(this._streamEl.shadowRoot || this._streamEl); } catch (e) { return false; }
  }
  _snap() {
    const s = this._stateObj; if (!s || UNAVAILABLE.includes(s.state) || !s.attributes.entity_picture || !this._hass || this._noSnap()) return;
    this._lastSnap = Date.now();
    let u = s.attributes.entity_picture; u = this._hass.hassUrl ? this._hass.hassUrl(u) : u; u += (u.includes('?') ? '&' : '?') + '_t=' + Date.now();
    const pre = new Image(); pre.onload = () => { const nx = this._imgs[this._imgI ^ 1]; nx.src = u; nx.classList.add('on'); this._imgs[this._imgI].classList.remove('on'); this._imgI ^= 1; this._card.classList.add('has'); this._snapOk = true; this._status(); };
    pre.onerror = () => { this._snapFails = (this._snapFails || 0) + 1; if (!this._snapOk) { this._snapErr = true; this._status(); } }; pre.src = u;
  }
  _tick() {
    if (!this._built || !this._config) return;
    if (this._streamEl && !this._live && this._videoReady()) this._markLive();
    if (this._streamEl && !this._err) { const m = this._streamError(); if (m) this._showErr(m); }
    if (this._config.large && this._live) { this._capture(); this._audioCheck(); if (this._unmuted) this._applyMute(); }
    let every = this._config.camera_view === 'snapshot' ? (this._config.large ? 3000 : 10000) : (this._live ? 0 : 10000);
    if (every && this._snapFails) every = Math.min(300000, every * Math.pow(3, Math.min(this._snapFails, 4))); // failing snapshots: back off (no hammering)
    if (every && Date.now() - this._lastSnap > every) this._snap();
    if (this._streamEl && !this._live && Date.now() - this._streamAt > 25000 && !this._failed) { this._failed = true; this._status(); }
  }
  _status() {
    const c = this._config, s = this._stateObj, st = this._$('.st'); if (!st) return;
    let t; if (!s) t = 'Not found'; else if (UNAVAILABLE.includes(s.state)) t = 'Unavailable';
    else if (this._err) t = CAM_RATE.test(this._err) ? 'Limited' : 'Error';
    else if (!this._tileLive() && c.camera_view !== 'snapshot') t = this._snapOk ? 'Snapshot' : 'Tap for live';
    else if (c.camera_view === 'snapshot') t = this._snapErr && !this._snapOk ? 'No snapshot' : 'Snapshot'; else if (this._live) t = 'Live'; else if (this._failed) t = 'Snapshot'; else t = 'Connecting…';
    st.classList.toggle('live', t === 'Live'); st.classList.toggle('tap', t === 'Tap for live'); this._$('.sx').textContent = t === 'Tap for live' ? '▶ Tap for live' : t;
    const pt = this._$('.pt'); if (s && !UNAVAILABLE.includes(s.state)) pt.textContent = t === 'No snapshot' ? 'No snapshot image' : t === 'Connecting…' ? 'Connecting…' : t === 'Tap for live' ? 'Tap for live view' : ''; this._$('.ph').classList.toggle('t', !!pt.textContent);
  }
  _runButton(i) {
    const b = this._btns()[i]; if (!b) return; const d = domainOf(b.entity);
    const def = { action: CAM_TOGGLE.includes(d) ? 'toggle' : ['scene', 'script', 'button', 'input_button'].includes(d) ? 'perform-action' : 'more-info' };
    let cfg = b.tap_action && b.tap_action.action ? b.tap_action : def;
    if (cfg.action === 'perform-action' && !cfg.perform_action && !cfg.service) cfg = { action: 'perform-action', perform_action: d === 'script' ? 'script.turn_on' : d === 'scene' ? 'scene.turn_on' : d + '.press', target: { entity_id: b.entity } };
    // run the action here (not via hass-action): this card also lives inside browser_mod popups, outside the dashboard
    const h = this._hass, x = h.states[b.entity];
    const go = () => {
      switch (cfg.action) {
        case 'none': return;
        case 'more-info': fire(this, 'hass-more-info', { entityId: cfg.entity || b.entity }); return;
        case 'toggle':
          if (d === 'lock') { if (x) h.callService('lock', x.state === 'locked' ? 'unlock' : 'lock', { entity_id: b.entity }); return; }
          h.callService('homeassistant', 'toggle', { entity_id: b.entity }); return;
        case 'perform-action': case 'call-service': {
          const [dm, sv] = String(cfg.perform_action || cfg.service || '').split('.'); if (!dm || !sv) return;
          h.callService(dm, sv, Object.assign({}, cfg.data || cfg.service_data || {}), cfg.target); return; }
        case 'navigate': if (cfg.navigation_path) { history.pushState(null, '', cfg.navigation_path); fire(window, 'location-changed', { replace: !!cfg.navigation_replace }); } return;
        case 'url': if (cfg.url_path) window.open(cfg.url_path); return;
        case 'assist': fire(this, 'show-dialog', { dialogTag: 'ha-voice-command-dialog', dialogImport: () => Promise.resolve(), dialogParams: { pipeline_id: cfg.pipeline_id || 'last_used', start_listening: cfg.start_listening } }); return;
        default: fire(this, 'hass-action', { config: { entity: b.entity, tap_action: cfg }, action: 'tap' });
      }
    };
    const cf = cfg.confirmation; if (cf) { if (!confirm((cf && cf.text) || 'Are you sure?')) return; }
    go();
  }
  popupData() {
    const c = this._config, fs = c.popup_style !== 'window', content = Object.assign({}, c, { type: 'custom:homeview-camera-card', large: true, height: fs ? NP_POPUP_HEIGHT_FS : CAM_POPUP_HEIGHT });
    delete content.grid_options; delete content.view_layout; delete content.size;
    const st = fs ? 'hvcamfs' : 'hvcam';
    return { content, dismissable: true, initial_style: st, style_sequence: [st], popup_styles: [{ style: st, styles: fs ? NP_POPUP_CSS_FS + '.content .container{background:#05070a}' : CAM_POPUP_CSS }] };
  }
  openLarge() {
    if (!window.browser_mod) { fire(this, 'hass-more-info', { entityId: this._config.entity }); return; }
    hvPopFrom(this);
    fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data: this.popupData() } });
  }
  _close() { this._dismiss(this.getBoundingClientRect().height || window.innerHeight); }
  _pop() {}
}
// swipe down to close: same gesture as the Now Playing popup
for (const k of ['_popupHost', '_swipeAttr', '_resetDrag', '_bindSwipe', '_snapBack', '_dismiss']) HVCameraCard.prototype[k] = HVNowPlayingCard.prototype[k];
HVCameraCard.layoutSection = false;
HVCameraCard.editorDefaults = true;
HVCameraCard.sizePresetsMap = CAM_SIZES;
HVCameraCard.sizeOptionsExtra = []; // 1.32.0: 4 × 3 Tall is a standard size now
HVCameraCard.sizeOptions = [...SIZE_OPTS_FIXED, ...HVCameraCard.sizeOptionsExtra];
HVCameraCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'camera' } } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } },
    { name: 'camera_view', selector: { select: { mode: 'dropdown', options: [{ value: 'live', label: 'Live video' }, { value: 'snapshot', label: 'Snapshot (refreshes every 10 s)' }] } } }] },
  { name: 'hv_size' }, // the shared Size dropdown (filled in by the editor)
  { name: 'buttons', selector: { object: { multiple: true, label_field: 'name', description_field: 'entity', fields: {
    entity: { label: 'Entity', required: true, selector: { entity: {} } },
    name: { label: 'Name (optional)', selector: { text: {} } },
    icon: { label: 'Icon (optional)', selector: { icon: {} } },
    tap_action: { label: 'Tap action (default: toggle, or more-info if it can’t toggle)', selector: { ui_action: { default_action: 'toggle' } } } } } } },
  { type: 'grid', name: '', schema: [{ name: 'show_name', selector: { boolean: {} } }, { name: 'show_status', selector: { boolean: {} } }] },
  { name: 'badge', selector: { text: {} } },
  { name: 'show_preview', selector: { boolean: {} } },
  { name: 'live_tile', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Automatic (Nest: picture, tap for live; others: live)' }, { value: 'on', label: 'Live video on the tile' }, { value: 'off', label: 'No live video on the tile (tap for live)' }] } } },
  { name: 'events', selector: { object: { multiple: true, label_field: 'name', description_field: 'entity', fields: {
    entity: { label: 'Event entity', required: true, selector: { entity: { domain: 'event' } } },
    name: { label: 'Name (optional, e.g. Doorbell, Motion)', selector: { text: {} } },
    icon: { label: 'Icon (optional)', selector: { icon: {} } } } } } },
  { type: 'expandable', name: '', flatten: true, title: 'Large view (tap the picture)', icon: 'mdi:arrow-expand', schema: [
    { name: 'tap_opens', selector: { boolean: {} } },
    { name: 'talk_app', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Automatic (Nest: Google Home, Ring: Ring)' }, { value: 'none', label: 'No Talk button' }, { value: 'google_home', label: 'Google Home app (Nest)' }, { value: 'ring', label: 'Ring app' }, { value: 'custom', label: 'Another app (URL below)' }] } } },
    { type: 'grid', name: '', schema: [{ name: 'talk_url', selector: { text: {} } }, { name: 'talk_label', selector: { text: {} } }] },
    { type: 'grid', name: '', schema: [{ name: 'show_history', selector: { boolean: {} } }, { name: 'show_sound', selector: { boolean: {} } }] },
    { name: 'popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'fullscreen', label: 'Full screen (edge to edge, swipe down to close)' }, { value: 'window', label: 'Window (rounded panel)' }] } } },
    { name: 'swipe_to_close', selector: { boolean: {} } }] }];
Object.assign(LABELS, { show_name: 'Show name', camera_view: 'Live or snapshot', size: 'Size', buttons: 'Buttons', show_status: 'Show status (Live / Snapshot)', tap_opens: 'Open the large view on tap',
  badge: 'Label next to the name (empty = the camera’s maker, e.g. Nest, Ring; none = no label)', live_tile: 'Live video on the tile', show_preview: 'Still preview on the tile (last event image or last frame you watched)', events: 'Last-event chips', talk_app: 'Talk button (opens the camera app)', talk_url: 'App URL (Another app)', talk_label: 'App name (Another app)',
  show_history: 'History button', show_sound: 'Sound button (when the stream has audio)' });
Object.assign(HELPERS, {
  buttons: 'Glass buttons along the bottom of the tile and the large view. They light up when the entity is on.',
  tap_opens: 'Needs browser_mod. Off = tap opens the camera’s more-info.',
  events: 'Event entities (doorbell press, motion …): each shows a chip with the time of its last event.',
  talk_app: 'Home Assistant can’t do two-way talk for Nest or Ring: the large view’s Talk button opens the maker’s app, where you talk.',
  talk_url: 'A URL scheme, e.g. myapp:// or shortcuts://run-shortcut?name=…' });

/* ---------------- person (Find My style) ---------------- */
// Round avatar (entity_picture, else initials) on a warm tan disc, optional status badge (e.g. a Focus sensor), bold name and the
// location: the zone when in one (Home), otherwise the street + city from the phone's geocoded-location sensor, else the state.
// Tap = a larger browser_mod popup with a native map of the person, name, location and since when.
const PER_POPUP_W = 'min(94vw, 760px)';
const PER_POPUP_HEIGHT = 'min(calc(var(--hv-vh, 100dvh) - 24px), 600px)';
const PER_POPUP_CSS = CAM_POPUP_CSS.split(CAM_POPUP_HEIGHT).join(PER_POPUP_HEIGHT).split(CAM_POPUP_W).join(PER_POPUP_W);
const PER_SIZES = { '2x3': HV_SIZES['2x3'], '4x6': HV_SIZES['4x6'] };
const perAway = st => ['not_home', 'unknown', 'unavailable'].includes(st);
function perFindGeo(hass, p) { // the mobile app's *_geocoded_location sensor on one of the person's trackers
  const E = hass && hass.entities; if (!E || !p) return null;
  const tr = [p.attributes.source, ...(p.attributes.device_trackers || [])].filter(Boolean);
  const devs = [...new Set(tr.map(t => E[t] && E[t].device_id).filter(Boolean))];
  const all = Object.values(E).filter(e => /^sensor\..*geocoded_location$/.test(e.entity_id) && devs.includes(e.device_id) && hass.states[e.entity_id]);
  all.sort((a, b) => devs.indexOf(a.device_id) - devs.indexOf(b.device_id));
  const ok = all.find(e => !UNAVAILABLE.includes(hass.states[e.entity_id].state));
  return (ok || all[0] || {}).entity_id || null;
}
function perAddress(g) { // "123 Main St\nSpringfield ST 00000\nCountry" -> "Main St, Springfield"
  if (!g || UNAVAILABLE.includes(g.state) || !g.state) return '';
  const a = g.attributes || {}, st = a.Thoroughfare || a.thoroughfare, city = a.Locality || a.locality;
  if (st || city) return [st || a.Name, city].filter(Boolean).join(', ');
  const L = String(g.state).split(/\n|,\s*/).map(x => x.trim()).filter(Boolean);
  const street = (L[0] || '').replace(/^\d+[\w-]*\s+/, ''), town = (L[1] || '').split(/\s+[A-Z]{2}\s|\s+\d/)[0];
  return [street, town].filter(Boolean).join(', ');
}
class HVPersonCard extends HVBase {
  static get needsEntity() { return true; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('person.')) || 'person.example' }; }
  validate(c) { super.validate(c); if (domainOf(c.entity) !== 'person') throw new Error('homeview-person-card needs a person entity'); }
  setConfig(c) {
    super.setConfig(c); const C = this._config;
    this.toggleAttribute('large', !!C.large);
    if (C.height) { this.setAttribute('fixed', ''); this.style.height = C.height; } else { this.removeAttribute('fixed'); this.style.removeProperty('height'); }
    if (this._swipeAttr) this._swipeAttr();
  }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 3, rows: 2, min_columns: 3, min_rows: 2 }; }
  connectedCallback() { if (this._resetDrag) this._resetDrag(); setTimeout(() => this._swipeAttr(), 0); setTimeout(() => this._swipeAttr(), 400); }
  _geoId() { const c = this._config; if (c.location_entity) return c.location_entity; const p = this.stateObj;
    const k = (p && p.attributes.source) + '|' + c.entity; if (this._geoKey !== k || this._geoEnts !== this._hass.entities) { this._geoKey = k; this._geoEnts = this._hass.entities; this._geo = perFindGeo(this._hass, p); } return this._geo; }
  watched() { return [this._config.entity, this._hass ? this._geoId() : null, this._config.badge_entity].filter(Boolean); }
  static get css() { return `
:host([fixed]){aspect-ratio:auto}
.pp{height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3.2cqh;padding:7cqh 7cqw 8cqh;text-align:center;pointer-events:none;color:var(--hv-text,#fff)}
.av{position:relative;width:min(50cqh,46cqw);aspect-ratio:1;flex:none}
.ci{width:100%;height:100%;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;
 background:radial-gradient(circle at 34% 28%,#fbe0b0 0%,#eab676 55%,#d4964f 100%);box-shadow:0 1cqh 3cqh rgba(0,0,0,.25),inset 0 0 0 1px rgba(255,255,255,.25)}
.ci img{width:100%;height:100%;object-fit:cover;display:block}
.ci .in{font-family:${ROUND};font-weight:700;font-size:min(19cqh,17cqw);color:#7b4a16;letter-spacing:.02em}
.ci ha-icon{--mdc-icon-size:min(28cqh,25cqw);color:#7b4a16;display:flex}
.bd{position:absolute;top:-3%;right:-9%;width:38%;aspect-ratio:1;border-radius:50%;background:#f4f3fa;display:none;align-items:center;justify-content:center;
 box-shadow:0 .6cqh 1.8cqh rgba(0,0,0,.28)} .bd.on{display:flex}
.bd ha-state-icon,.bd ha-icon{--mdc-icon-size:min(11cqh,10cqw);color:#5e5ce6;display:flex}
.tx2{min-width:0;width:100%;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.nm{font-size:min(11.5cqh,8.5cqw);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.lc{font-size:min(8.8cqh,6.6cqw);font-weight:500;color:var(--hv-text2,rgba(255,255,255,.66));line-height:1.22;margin-top:.6cqh;
 display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lc.one{-webkit-line-clamp:1}
:host([auto]) .nm{font-size:max(13px,min(11.5cqh,8.5cqw))} :host([auto]) .lc{font-size:max(11px,min(8.8cqh,6.6cqw))}
:host([floor]) .nm{font-size:max(13px,min(11.5cqh,10cqw))} :host([floor]) .lc{font-size:max(11px,min(8.8cqh,8cqw))}
.since,.mapw,.x,.grab{display:none}
/* the large view (popup) */
:host([large]) ha-card{cursor:default;border-radius:26px !important;border:1px solid rgba(255,255,255,.12) !important;touch-action:none;
 background:linear-gradient(160deg,rgba(64,72,86,.96) 0%,rgba(36,42,52,.97) 60%,rgba(24,28,36,.98) 100%) !important;backdrop-filter:blur(30px) !important;-webkit-backdrop-filter:blur(30px) !important}
:host([large]) ha-ripple{display:none}
:host([large]) .pp{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);grid-template-areas:"av tx" "map map";
 align-items:center;justify-items:start;text-align:left;gap:18px 18px;padding:26px 24px 24px;pointer-events:auto;color:#fff}
:host([large]) .av{grid-area:av;width:76px} :host([large]) .ci .in{font-size:28px} :host([large]) .ci ha-icon{--mdc-icon-size:40px}
:host([large]) .bd ha-state-icon,:host([large]) .bd ha-icon{--mdc-icon-size:16px}
:host([large]) .tx2{grid-area:tx;padding-right:46px} :host([large]) .nm{font-size:24px} :host([large]) .lc{font-size:16px;color:rgba(255,255,255,.72);-webkit-line-clamp:2}
:host([large]) .since{display:block;font-size:13px;font-weight:500;color:rgba(255,255,255,.55);margin-top:5px}
:host([large]) .mapw{display:block;grid-area:map;align-self:stretch;justify-self:stretch;position:relative;min-height:0;border-radius:18px;overflow:hidden;
 border:1px solid rgba(255,255,255,.12);background:#1b2028;touch-action:auto}
.mapw > *{position:absolute;inset:0;height:100%;--ha-card-border-radius:0;--ha-card-border-width:0}
:host([large]) .x{display:flex;position:absolute;z-index:3;top:20px;right:20px;width:38px;height:38px;border-radius:50%;align-items:center;justify-content:center;cursor:pointer;
 background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);color:#fff} .x ha-icon{--mdc-icon-size:20px;display:flex}
:host([swipe]) .grab{display:block;position:absolute;z-index:4;top:8px;left:50%;width:40px;height:5px;margin-left:-20px;border-radius:9px;background:rgba(255,255,255,.42);pointer-events:none}
@media (max-height:520px){ :host([large]) .pp{grid-template-columns:auto minmax(0,1fr) minmax(0,1.5fr);grid-template-rows:auto minmax(0,1fr);grid-template-areas:"av tx map" ". . map";padding:20px} }`; }
  _build() {
    super._build();
    this._root.innerHTML = `<div class="pp"><div class="av"><div class="ci"></div><div class="bd"></div></div>
      <div class="tx2"><div class="nm"></div><div class="lc"></div><div class="since"></div></div><div class="mapw pop"></div></div>
      <div class="x" role="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></div><div class="grab" aria-hidden="true"></div>`;
    this._pp = this._root.querySelector('.pp');
    this._root.querySelector('.x').addEventListener('click', e => { e.stopPropagation(); this._dismiss(this.getBoundingClientRect().height); });
    if (this._config.large) { const og = this._hvOrigin || (this._hvOrigin = hvPopTake()); if (og && hvPenOK(og, og._hass)) hvPen(this._root.querySelector('.x'), () => { this._dismiss(this.getBoundingClientRect().height); setTimeout(() => hvPopEdit(og, { card: og }), 420); }); }
    this._card.addEventListener('pointerdown', e => { if (this._config.large && e.composedPath().some(n => n.classList && n.classList.contains('x'))) e.stopPropagation(); }, true);
    this._bindSwipe();
    if (this._config.large) this._makeMap();
  }
  async _makeMap() {
    const w = this._root.querySelector('.mapw'); if (!w || this._map) return;
    try {
      const h = window.loadCardHelpers ? await window.loadCardHelpers() : null; if (!h) return;
      const m = h.createCardElement({ type: 'map', entities: [{ entity: this._config.entity }], default_zoom: 15, hours_to_show: 0, auto_fit: true, theme_mode: 'auto' });
      m.layout = 'grid'; m.hass = this._hass; w.appendChild(m); this._map = m;
    } catch (e) { console.warn('homeview-person-card map', e); }
  }
  customAction(kind) { // tap = the large popup (browser_mod), or more-info without browser_mod; nothing inside the popup itself
    if (this._config.large) return true;
    if (kind !== 'tap' || this._config.tap_action) return false;
    if (!window.browser_mod) { fire(this, 'hass-more-info', { entityId: this._config.entity }); return true; }
    hvPopFrom(this); fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data: this.popupData() } }); return true;
  }
  popupData() {
    const content = Object.assign({}, this._config, { type: 'custom:homeview-person-card', large: true, height: PER_POPUP_HEIGHT });
    delete content.grid_options; delete content.view_layout; delete content.size;
    return { content, dismissable: true, initial_style: 'hvperson', style_sequence: ['hvperson'], popup_styles: [{ style: 'hvperson', styles: PER_POPUP_CSS }] };
  }
  location() {
    const s = this.stateObj, h = this._hass; if (!s) return 'Not found';
    if (!perAway(s.state)) return fmtState(h, s);
    const gid = this._geoId(), a = perAddress(gid ? h.states[gid] : null);
    return a || fmtState(h, s);
  }
  update() {
    const c = this._config, s = this.stateObj, h = this._hass, a = s ? s.attributes : {};
    this._card.classList.toggle('unavailable', !s);
    const name = c.name != null && c.name !== '' ? c.name : (a.friendly_name || (s ? s.entity_id : 'Person'));
    const pic = a.entity_picture ? (h.hassUrl ? h.hassUrl(a.entity_picture) : a.entity_picture) : '';
    const ci = this._root.querySelector('.ci');
    if (ci.dataset.k !== pic + '|' + name) { ci.dataset.k = pic + '|' + name; ci.innerHTML = '';
      const ini = String(name).trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
      const fb = () => { ci.innerHTML = ini ? `<span class="in">${esc(ini)}</span>` : '<ha-icon icon="mdi:account"></ha-icon>'; };
      if (pic) { const im = new Image(); im.alt = ''; im.onerror = fb; im.src = pic; ci.appendChild(im); } else fb(); }
    const bd = this._root.querySelector('.bd'), bs = c.badge_entity ? h.states[c.badge_entity] : null;
    const on = !!bs && !UNAVAILABLE.includes(bs.state) && !['off', 'false', 'idle', 'none', '0', ''].includes(String(bs.state).toLowerCase());
    bd.classList.toggle('on', on);
    if (on) { if (!this._bdi || this._bdi.stateObj !== bs) { bd.innerHTML = ''; const i = document.createElement('ha-state-icon'); i.hass = h; i.stateObj = bs;
      if (!bs.attributes.icon && domainOf(bs.entity_id) === 'binary_sensor') i.icon = 'mdi:moon-waning-crescent'; bd.appendChild(i); this._bdi = i; } else this._bdi.hass = h; }
    else { bd.innerHTML = ''; this._bdi = null; }
    const loc = this.location();
    this._root.querySelector('.nm').textContent = name;
    const lc = this._root.querySelector('.lc'); lc.textContent = loc;
    if (c.large && s) {
      const t = new Date(s.last_changed), lang = (h.locale && h.locale.language) || undefined;
      let rel = ''; try { const d = (t - Date.now()) / 1000, A = Math.abs(d), rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
        rel = A < 60 ? rtf.format(Math.round(d), 'second') : A < 3600 ? rtf.format(Math.round(d / 60), 'minute') : A < 86400 ? rtf.format(Math.round(d / 3600), 'hour') : rtf.format(Math.round(d / 86400), 'day'); } catch (e) {}
      const tm = t.toLocaleString(lang, Date.now() - t < 86400000 ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      this._root.querySelector('.since').textContent = `${perAway(s.state) ? 'Away' : 'Here'} since ${tm}${rel ? ' · ' + rel : ''}`;
      if (this._map) this._map.hass = h; else this._makeMap();
    }
    this._card.setAttribute('aria-label', `${name}, ${loc}`);
  }
  _pop() {}
}
for (const k of ['_popupHost', '_swipeAttr', '_resetDrag', '_bindSwipe', '_snapBack', '_dismiss']) HVPersonCard.prototype[k] = HVNowPlayingCard.prototype[k];
HVPersonCard.sizePresetsMap = PER_SIZES;
Object.assign(PER_SIZES, RESP_SIZES);
HVPersonCard.sizeOptions = [{ value: '2x3', label: '2 × 3 (one tile)' }, { value: '4x6', label: '4 × 6 (2 tiles wide & tall)' }, ...RESP_OPTS];
HVPersonCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'person' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'location_entity', selector: { entity: { domain: 'sensor' } } },
  { name: 'badge_entity', selector: { entity: {} } }, COLORS, ACTIONS(null, 'none')];
Object.assign(LABELS, { location_entity: 'Location sensor (optional)', badge_entity: 'Badge entity (optional)' });
Object.assign(HELPERS, { location_entity: 'Street and city when away from a zone. Empty = the phone\'s "Geocoded location" sensor, found automatically.',
  badge_entity: 'Shows a small badge on the avatar while it is on, e.g. a Focus / Do Not Disturb sensor. Empty = no badge.' });

/* ---------------- screensaver settings (Wallpanel) ----------------
   A friendly form for the dashboard's `wallpanel:` config, opened from the screensaver button under the edit pencil (or used as a
   card). Reads the dashboard's lovelace config, shows the common Wallpanel options with proper controls, and Save writes ONLY the
   options that were changed back into `wallpanel:` (re-reading the config first, so every other key and manual edit is kept).
   Wallpanel picks the new config up by itself (it listens for lovelace_updated). Preview starts the screensaver now. */
const SS_POPUP_W = 'min(94vw, 720px)';
const SS_POPUP_HEIGHT = 'min(calc(var(--hv-vh, 100dvh) - 24px), 680px)';
const SS_POPUP_CSS = CAM_POPUP_CSS.split(CAM_POPUP_HEIGHT).join(SS_POPUP_HEIGHT).split(CAM_POPUP_W).join(SS_POPUP_W);
const SS_CLOCK_OFF = 'ha-card{display:none !important}/*hv-clock-off*/';
// Wallpanel 3.x defaults for the keys we show (used when the key is not in the config)
const SS_DEF = { enabled: false, idle_time: 15, fade_in_time: 3, crossfade_time: 3, display_time: 15, show_images: true, image_url: 'https://picsum.photos/${width}/${height}?random=${timestamp}',
  media_order: 'sorted', image_fit_landscape: 'cover', image_fit_portrait: 'contain', show_progress_bar: false, show_image_info: false, black_screen_after_time: 0, keep_screen_on_time: 0,
  fullscreen: false, hide_toolbar: false, hide_sidebar: false, stop_screensaver_on_mouse_move: true, stop_screensaver_on_mouse_click: true, disable_screensaver_on_browser_mod_popup: false };
const SS_PLAIN = Object.keys(SS_DEF);
// Wallpanel puts <wallpanel-view> inside home-assistant > home-assistant-main's shadow root
const ssWallpanel = () => { const d = document.querySelector('wallpanel-view'); if (d) return d; const ha = document.querySelector('home-assistant'), m = ha && ha.shadowRoot && ha.shadowRoot.querySelector('home-assistant-main');
  return (m && m.shadowRoot && m.shadowRoot.querySelector('wallpanel-view')) || null; };
const ssDash = () => { const seg = decodeURIComponent(location.pathname.split('/')[1] || ''); return seg && seg !== 'lovelace' ? seg : null; };
// 1.32.0: shared album links as a photo source (Google Photos, iCloud shared albums, OneDrive). Google and iCloud don't let browsers read their
// album pages / API (no CORS), so those go through the optional NotHomeView Album Links helper (custom_components/nothomeview_albums: it reads the
// album on the Home Assistant server and offers it as media-source://nothomeview_albums/<album>). OneDrive works in the browser too (its API allows it).
const HV_ALB_MS = 'media-source://nothomeview_albums/';
const HV_ALB_NAME = { google: 'Google Photos album', icloud: 'iCloud shared album', onedrive: 'OneDrive folder / album' };
// 1.32.0: recognise every current share-link format (pasted with spaces, without https://, with tracking parameters):
//   Google Photos  photos.app.goo.gl/…, goo.gl/…, photos.google.com/(u/N/)share/…?key=…  (photos.google.com/album/… = private: needs a shared link)
//   iCloud         photos.icloud.com/shared/album/<token> (iOS 26+), www.icloud.com/sharedalbum/#<token> (older albums);
//                  share.icloud.com/photos/… = an "iCloud Link" to a few photos, not an album
//   OneDrive       1drv.ms/… (/a/, /f/, /u/ …), onedrive.live.com/…, photos.onedrive.com/…, *.sharepoint.com/…
const HV_ALB_TRACK = /^(utm_\w+|fbclid|gclid|igshid|mibextid|si|_ga|ref_src)$/i;
function hvAlbumInfo(raw) { let u = String(raw || '').trim().replace(/^[<"'(\[]+|[>"')\].,;]+$/g, '').trim(); if (!u) return { prov: null, url: '' };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  let x; try { x = new URL(u); } catch (e) { return { prov: null, url: u }; }
  if (!/^https?:$/.test(x.protocol)) return { prov: null, url: u }; x.protocol = 'https:';
  const h = x.hostname.toLowerCase().replace(/^(m|www)\./, (m0, a) => a === 'www' ? 'www.' : ''), p = x.pathname;
  [...x.searchParams.keys()].forEach(k => { if (HV_ALB_TRACK.test(k)) x.searchParams.delete(k); });
  let prov = null, issue = null, kind = '';
  if (h === 'photos.app.goo.gl' || (h === 'goo.gl' && p.length > 1)) prov = 'google';
  else if (h === 'photos.google.com') { prov = 'google'; if (!/^\/(u\/\d+\/)?share\/[^/]+/i.test(p)) issue = 'gprivate'; }
  else if (/^(www\.)?icloud\.com(\.cn)?$/.test(h)) { prov = 'icloud'; if (/^\/sharedalbum\b/i.test(p)) kind = 'legacy'; else if (/^\/photos\b/i.test(p)) issue = 'iclink'; else issue = 'icother'; }
  else if (/^photos\.icloud\.com(\.cn)?$/.test(h)) { prov = 'icloud'; kind = 'ck'; if (!/^\/shared\/album\/[^/]+/i.test(p)) issue = 'icother'; }
  else if (/^share\.icloud\.com(\.cn)?$/.test(h)) { prov = 'icloud'; issue = 'iclink'; }
  else if (h === '1drv.ms' || h === 'onedrive.live.com' || h === 'photos.onedrive.com' || h === 'onedrive.com' || /(^|\.)sharepoint\.com$/.test(h)) prov = 'onedrive';
  return { prov, kind, issue, url: x.toString(), host: h }; }
const hvAlbumProv = u => hvAlbumInfo(u).prov;
const HV_ALB_ISSUE = { gprivate: 'this is a private album link (photos.google.com/album/…). Open the album, tap Share → Create link, and paste that link (photos.app.goo.gl/…).',
  iclink: 'this is an "iCloud Link" to a few photos, not a shared album. In Photos make a Shared Album, turn on "Anyone with the Link" (older albums: "Public Website") and paste the album link (photos.icloud.com/shared/album/…).',
  icother: 'this iCloud link isn\'t a shared album. Paste the album link from Photos → the shared album → People → "Anyone with the Link" → Share Link (photos.icloud.com/shared/album/…).' };
// iCloud shared albums of iOS 26+ (photos.icloud.com/shared/album/<token>): CloudKit Web Services; anyone-with-the-link albums resolve without
// an account and the API allows cross-origin reads, so the browser reads them directly (no helper needed). Photo links last about an hour.
const HV_CK = 'https://ckdatabasews.icloud.com', HV_CKQ = 'clientBuildNumber=2640BuildBeta21&clientMasteringNumber=2640BuildBeta21';
function hvCkPick(f, target = 2048) { let best = null, bw = -1, fb = null, fw = -1, jpg = false;
  for (const k of Object.keys(f || {})) { if (!/^res.*Res$/.test(k) || /Vid/.test(k)) continue; const v = f[k] && f[k].value, dl = v && v.downloadURL; if (!dl) continue;
    const w = Number((f[k.replace(/Res$/, 'Width')] || {}).value || 0), isJ = /JPEG/i.test(k) || /jpe?g/i.test(String((f[k.replace(/Res$/, 'FileType')] || {}).value || ''));
    const u = String(dl).replace('${f}', 'photo.jpg');
    if ((isJ || !jpg) && w >= target && (bw < 0 || w < bw || (isJ && !jpg))) { best = u; bw = w; jpg = isJ; }
    if (w > fw && (isJ || !fb)) { fw = w; fb = u; } }
  return best || fb; }
async function hvICloudCK(url) { const tok = (String(url).match(/shared\/album\/([^/?#]+)/i) || [])[1]; if (!tok) throw new Error('no album token in this iCloud link');
  const post = async (u, b) => { const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(b) }); if (!r.ok) throw new Error('iCloud answered ' + r.status); return r.json(); };
  const rs = await post(`${HV_CK}/database/1/com.apple.photos.cloud/production/public/records/resolve?${HV_CKQ}`, { shortGUIDs: [{ value: tok }] }), r0 = (rs.results || [])[0] || {};
  const acc = r0.anonymousPublicAccess || {};
  if (!r0.zoneID || !acc.token) throw new Error(r0.requireAppleLogin || (r0.zoneID && !acc.token) ? 'this album is invite-only. In Photos open it → People → turn on "Anyone with the Link".' : 'iCloud can\'t find this shared album. Check the link, and that "Anyone with the Link" is on.');
  const z = r0.zoneID, zone = { zoneName: z.zoneName, ownerRecordName: z.ownerRecordName, zoneType: z.zoneType || 'REGULAR_CUSTOM_ZONE' }, part = String(acc.databasePartition || HV_CK).replace(/:443$/, '');
  const title = ((((r0.share || {}).fields || {})['cloudkit.title']) || {}).value || 'iCloud shared album';
  const qu = `${part}/database/1/com.apple.photos.cloud/production/shared/records/query?${HV_CKQ}&publicAccessAuthToken=${encodeURIComponent(acc.token)}`, ids = [];
  let mk = null, n = 0; do { const b = { query: { recordType: 'CPLAssetAndMasterByAssetDateWithoutHiddenOrDeleted', filterBy: [{ fieldName: 'direction', comparator: 'EQUALS', fieldValue: { value: 'DESCENDING', type: 'STRING' } }] }, zoneID: zone, resultsLimit: 200 };
    if (mk) b.continuationMarker = mk; const r = await post(qu, b);
    for (const rec of r.records || []) { if (rec.recordType !== 'CPLMaster') continue; const f = rec.fields || {}, it = String((f.itemType || {}).value || '').toLowerCase(); if (/movie|video/.test(it)) continue;
      const u = hvCkPick(f); if (u) ids.push(u); }
    mk = r.continuationMarker || null; n++; } while (mk && n < 20 && ids.length < 2000);
  if (!ids.length) throw new Error('the iCloud shared album has no photos');
  return { title, count: ids.length, ids, expires: Date.now() + 50 * 60e3 }; }
const hvB64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hvUnB64u = s => { try { const t = s.replace(/-/g, '+').replace(/_/g, '/'); return decodeURIComponent(escape(atob(t + '='.repeat((4 - t.length % 4) % 4)))); } catch (e) { return ''; } };
// OneDrive in the browser: guest token + the "shares" API (both allow cross-origin reads); 1920 px thumbnails, links valid a few hours
async function hvOneDrive(url) { const W = window.__hvOD || (window.__hvOD = {});
  if (!W.t || W.exp < Date.now() + 6e5) { const r = await fetch('https://api-badgerp.svc.ms/v1.0/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: '5cbed6ac-a083-4e14-b191-b4ba07653de2' }) });
    if (!r.ok) throw new Error('OneDrive guest access failed (' + r.status + ')'); const b = await r.json(); W.t = (b.authScheme || 'Badger') + ' ' + b.token; W.exp = Date.now() + 6 * 36e5; }
  const H = { Authorization: W.t, Prefer: 'autoredeem' }, sid = 'u!' + btoa(unescape(encodeURIComponent(url.trim()))).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
  const base = `https://api.onedrive.com/v1.0/shares/${sid}/driveItem`, r0 = await fetch(base, { headers: H });
  if (!r0.ok && /sharepoint\.com/i.test(url)) throw new Error('OneDrive for work or school (SharePoint) links can\'t be opened without signing in. Share the folder from a personal OneDrive (1drv.ms/…) instead.');
  if (!r0.ok) throw new Error(r0.status === 401 || r0.status === 403 || r0.status === 404 ? 'OneDrive couldn\'t open this link (is it shared with "Anyone with the link"?)' : 'OneDrive answered ' + r0.status);
  const root = await r0.json(), ids = [], folders = [[base + '/children', 0]]; let exp = Date.now() + 3 * 36e5;
  while (folders.length && ids.length < 2000) { const [f, depth] = folders.shift(); let next = f + '?$expand=thumbnails($select=c1920x1920)&$top=200';
    while (next && ids.length < 2000) { const r = await fetch(next, { headers: H }); if (!r.ok) break; const b = await r.json();
      for (const c of b.value || []) { if (c.folder && depth < 2) { const pr = c.parentReference || {}; folders.push([`https://api.onedrive.com/v1.0/drives/${pr.driveId}/items/${c.id}/children`, depth + 1]); continue; }
        if (!(c.image || /^image\//.test((c.file || {}).mimeType || ''))) continue; const th = (((c.thumbnails || [])[0] || {}).c1920x1920 || {}).url, u = th || c['@content.downloadUrl']; if (!u) continue; ids.push(u);
        const m = decodeURIComponent(decodeURIComponent(u)).match(/tempauth=v1e?\.([A-Za-z0-9_-]+)/); if (m) { try { const j = JSON.parse(atob(m[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - m[1].length % 4) % 4))); if (j.exp) exp = Math.min(exp, j.exp * 1000); } catch (e) {} } }
      next = b['@odata.nextLink']; } }
  if (!ids.length) throw new Error('No photos found in this OneDrive folder');
  return { title: root.name || 'OneDrive folder', count: ids.length, ids, expires: exp }; }
// check / load an album link: { ok, provider, title, count, via: 'helper' | 'browser', media_id | ids, error, noHelper }
async function hvAlbumLoad(hass, url) { const inf = hvAlbumInfo(url), prov = inf.prov; url = inf.url;
  if (!prov) return { ok: false, error: 'Not a Google Photos, iCloud shared album or OneDrive link' };
  if (inf.issue) return { ok: false, provider: prov, issue: inf.issue, error: HV_ALB_ISSUE[inf.issue] };
  try { const r = await hass.callWS({ type: 'nothomeview_albums/check', url }); return Object.assign({ via: 'helper' }, r); }
  catch (e) { if (!(e && e.code === 'unknown_command')) return { ok: false, provider: prov, error: (e && e.message) || String(e) }; }
  if (prov === 'onedrive' || inf.kind === 'ck') { try { return Object.assign({ ok: true, provider: prov, via: 'browser', noHelper: true }, prov === 'onedrive' ? await hvOneDrive(url) : await hvICloudCK(url)); } catch (e) { return { ok: false, provider: prov, noHelper: true, error: (e && e.message) || String(e) }; } }
  return { ok: false, provider: prov, noHelper: true, needHelper: true, error: `${prov === 'google' ? 'Google Photos' : 'iCloud (for older sharedalbum links)'} doesn't let a browser read its albums, so Home Assistant needs the small NotHomeView Album Links helper for this link (a one-time setup, see the NotHomeView docs: "Album links").` }; }
const hvAlbumStatus = (st, url) => { const inf = hvAlbumInfo(url), prov = inf.prov, nm = HV_ALB_NAME[prov];
  if (!inf.url) return 'Paste a shared album link: Google Photos (photos.app.goo.gl/…), iCloud shared album (photos.icloud.com/shared/album/… or icloud.com/sharedalbum/#…, with "Anyone with the Link" on) or OneDrive (1drv.ms/…, "Anyone with the link").';
  if (!prov) return `⚠ This doesn't look like a shared album link${inf.host ? ` (${inf.host})` : ''}. Supported: Google Photos (photos.app.goo.gl/…), iCloud shared albums (photos.icloud.com/shared/album/…) and OneDrive (1drv.ms/…).`;
  if (inf.issue) return `⚠ Recognized: ${nm}, but ${HV_ALB_ISSUE[inf.issue]}`;
  if (!st || String(st.url || '').trim() !== String(url).trim()) return `Recognized: ${nm}. Checking…`;
  if (!st.ok && st.needHelper) return `Recognized ✓ ${nm}. ${st.error} Until then, the photos come from the media folder.`;
  if (!st.ok) return `⚠ Recognized: ${nm}. ${String(st.error || '').replace(/^[a-z](?![A-Z])/, c => c.toUpperCase()).replace(/([^.!?])$/, '$1.')} Until it works, the photos come from the media folder.`;
  return `✓ ${nm} “${st.title}”: ${st.count} photo${st.count === 1 ? '' : 's'}${st.via === 'browser' ? ' (read by the browser)' : ' (via the Album Links helper)'}. The list refreshes every 6 hours; Order = Random shuffles it.`; };
function hvOpenScreensaverSettings(from) {
  const content = { type: 'custom:homeview-screensaver-card', dashboard: ssDash(), large: true, height: SS_POPUP_HEIGHT };
  if (window.browser_mod) { fire(from, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup',
    data: { content, dismissable: true, initial_style: 'hvss', style_sequence: ['hvss'], popup_styles: [{ style: 'hvss', styles: SS_POPUP_CSS }] } } }); return; }
  // no browser_mod: a plain overlay with the same card
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,20,.45);backdrop-filter:blur(6px)';
  const el = document.createElement('homeview-screensaver-card'); el.setConfig(Object.assign({}, content, { height: '' })); el.style.cssText = `width:${SS_POPUP_W};height:${SS_POPUP_HEIGHT}`;
  el.hass = document.querySelector('home-assistant') && document.querySelector('home-assistant').hass; el._overlay = ov;
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); }); ov.appendChild(el); document.body.appendChild(ov);
}
const ssClock = wp => { const cs = (wp && Array.isArray(wp.cards)) ? wp.cards : []; const i = cs.findIndex(c => c && c.type === 'clock'); return { i, c: i >= 0 ? cs[i] : null }; };
const ssClockHidden = c => { const cm = c && c.card_mod && c.card_mod.style; const d = typeof cm === 'string' ? cm : cm && cm['.']; return !!d && d.includes(SS_CLOCK_OFF); };
const SS_CSS = `
:host{display:block;height:100%;width:100%;-webkit-tap-highlight-color:transparent}
:host([fixed]){height:auto}
ha-card{position:relative !important;height:100%;width:100%;box-sizing:border-box;overflow:hidden !important;display:flex;flex-direction:column;font-family:${FONT};color:#fff;
 border-radius:26px !important;border:1px solid rgba(255,255,255,.12) !important;box-shadow:0 2vh 6vh rgba(0,0,20,.35) !important;
 background:linear-gradient(160deg,rgba(64,72,86,.97) 0%,rgba(36,42,52,.98) 60%,rgba(24,28,36,.99) 100%) !important;backdrop-filter:blur(30px) !important;-webkit-backdrop-filter:blur(30px) !important;
 --primary-text-color:#fff;--secondary-text-color:rgba(255,255,255,.62);--text-primary-color:#fff;--primary-color:#8f86ff;--accent-color:#8f86ff;--divider-color:rgba(255,255,255,.12);
 --card-background-color:#262c36;--ha-card-background:#262c36;--mdc-theme-surface:#262c36;--input-fill-color:rgba(255,255,255,.07);--mdc-text-field-fill-color:rgba(255,255,255,.07);
 --input-ink-color:#fff;--input-label-ink-color:rgba(255,255,255,.62);--mdc-text-field-ink-color:#fff;--mdc-text-field-label-ink-color:rgba(255,255,255,.62);--mdc-select-ink-color:#fff;
 --mdc-select-fill-color:rgba(255,255,255,.07);--mdc-select-label-ink-color:rgba(255,255,255,.62);--mdc-theme-text-primary-on-background:#fff;--switch-checked-color:#8f86ff;
 --ha-color-fill-neutral-quiet-resting:rgba(255,255,255,.07);--wa-color-surface-default:#262c36;--wa-color-text-normal:#fff;--ha-color-text-primary:#fff;--ha-color-text-secondary:rgba(255,255,255,.62);
 --ha-color-form-background:rgba(255,255,255,.07);--ha-color-border-neutral-quiet:rgba(255,255,255,.18);--mdc-dialog-content-ink-color:#fff;color-scheme:dark}
:host(:not([large])) ha-card{border-radius:var(--hv-radius,22px) !important}
.hd{display:flex;align-items:center;gap:14px;padding:22px 24px 14px;flex:none;touch-action:none}
.hd .ic{width:44px;height:44px;border-radius:14px;flex:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,rgba(143,134,255,.55),rgba(110,90,210,.35));border:1px solid rgba(255,255,255,.18)}
.hd .ic ha-icon{--mdc-icon-size:24px;display:flex}
.hd .tt{flex:1;min-width:0} .hd .t1{font-size:20px;font-weight:700} .hd .t2{font-size:13px;color:rgba(255,255,255,.6);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.x{width:38px;height:38px;border-radius:50%;flex:none;display:none;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16)}
:host([large]) .x{display:flex} .x ha-icon{--mdc-icon-size:20px;display:flex}
.bd{flex:1;min-height:0;overflow:auto;padding:4px 20px 12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y}
.msg{padding:18px 4px;color:rgba(255,255,255,.7);font-size:14px;line-height:1.4}
.ft{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 20px 14px;flex:none;border-top:1px solid rgba(255,255,255,.08)}
.ft .st{flex:1;min-width:0;font-size:13px;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft .hint{flex:0 0 100%;order:9;font-size:12px;line-height:1.35;color:rgba(255,255,255,.5);text-align:right}
.ft .st.ok{color:#7be0a0} .ft .st.err{color:#ff8a80}
.ft button{all:unset;box-sizing:border-box;cursor:pointer;height:40px;padding:0 18px;border-radius:999px;font:600 14px ${FONT};display:flex;align-items:center;gap:8px;white-space:nowrap;
 background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);color:#fff;transition:transform .12s ease,opacity .2s}
.ft button:active{transform:scale(.95)} .ft button[disabled]{opacity:.4;pointer-events:none} .ft button ha-icon{--mdc-icon-size:18px;display:flex}
.ft .save{background:linear-gradient(150deg,#8f86ff,#6e5ad2);border-color:rgba(255,255,255,.25)}
.grab{display:none;position:absolute;z-index:4;top:8px;left:50%;width:40px;height:5px;margin-left:-20px;border-radius:9px;background:rgba(255,255,255,.42);pointer-events:none}
:host([swipe]) .grab{display:block}
@media (max-width:520px){ .ft .st{flex-basis:100%;order:3} .ft .hint{text-align:left} }
@media (max-height:520px){ .hd{padding:14px 20px 8px} .hd .ic{width:36px;height:36px;border-radius:12px} .hd .t1{font-size:17px} .ft{padding:8px 16px 10px} .ft button{height:36px} }
`;
class HVScreensaverCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getStubConfig() { return {}; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  setConfig(c) {
    this._config = Object.assign({}, c || {});
    this.toggleAttribute('large', !!this._config.large);
    if (this._config.height) { this.setAttribute('fixed', ''); this.style.height = this._config.height; } else { this.removeAttribute('fixed'); this.style.removeProperty('height'); }
    if (this._built) this._load();
  }
  set hass(h) { const first = !this._hass; this._hass = h; if (!this._built) this._build(); if (this._form) this._form.hass = h; if (first) this._load(); }
  get hass() { return this._hass; }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, rows: 8, min_columns: 6, min_rows: 6 }; }
  connectedCallback() { if (this._resetDrag) this._resetDrag(); setTimeout(() => this._swipeAttr(), 0); setTimeout(() => this._swipeAttr(), 400); }
  get _dash() { const d = this._config && this._config.dashboard; return d === undefined ? ssDash() : (d || null); }
  _build() {
    this.shadowRoot.innerHTML = `<style>${SS_CSS}</style><ha-card><div class="hd"><div class="ic"><ha-icon icon="mdi:monitor-shimmer"></ha-icon></div>
      <div class="tt"><div class="t1">Screensaver</div><div class="t2">Wallpanel</div></div><div class="x" role="button" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></div></div>
      <div class="bd pop"><div class="msg">Loading…</div></div>
      <div class="ft"><div class="st"></div><button class="pv"><ha-icon icon="mdi:play-circle-outline"></ha-icon>Preview</button><button class="save" disabled><ha-icon icon="mdi:content-save-outline"></ha-icon>Save</button><div class="hint">Shows the screensaver now with the values above, even while it is off. Nothing is saved. Tap the screen to stop.</div></div>
      <div class="grab" aria-hidden="true"></div></ha-card>`;
    const R = this.shadowRoot; this._card = R.querySelector('ha-card'); this._bd = R.querySelector('.bd'); this._st = R.querySelector('.st');
    R.querySelector('.x').addEventListener('click', () => this._close());
    R.querySelector('.save').addEventListener('click', () => this._save());
    R.querySelector('.pv').addEventListener('click', () => this._preview());
    this._bindSwipe(); this._built = true;
    const t2 = R.querySelector('.t2'), note = () => { const m = hvWpMissing(); if (m) { if (!t2.dataset.t) t2.dataset.t = t2.textContent; t2.textContent = HV_WP_HINT; } else if (t2.dataset.t) { t2.textContent = t2.dataset.t; delete t2.dataset.t; } t2.title = m ? HV_WP_URL : ''; };
    this._wpNoteFn = note;
    if (!hvHasWallpanel()) { note(); setTimeout(note, 13000); hvWhenWallpanel(note); } // Wallpanel missing: say so (the form still works and saves)
  }
  _status(t, cls) { this._st.textContent = t || ''; this._st.className = 'st' + (cls ? ' ' + cls : ''); }
  async _fetch() { const m = { type: 'lovelace/config', force: true }; if (this._dash) m.url_path = this._dash; return this._hass.callWS(m); }
  async _load() {
    if (!this._hass || !this._built) return;
    this._status('');
    try {
      const cfg = await this._fetch(); this._cfg = cfg;
      const wp = cfg.wallpanel || {}; this._wp0 = JSON.parse(JSON.stringify(wp));
      this._views = (cfg.views || []).map((v, i) => ({ value: v.path || String(i), label: v.title || v.path || 'View ' + (i + 1) }));
      const t2 = this.shadowRoot.querySelector('.t2'); t2.textContent = 'Wallpanel · ' + ((cfg.title || this._dash || 'Overview')); delete t2.dataset.t; if (this._wpNoteFn && !hvHasWallpanel()) this._wpNoteFn();
      this._data0 = this._toData(wp); this._data = Object.assign({}, this._data0);
      this._renderForm();
      this.shadowRoot.querySelector('.save').disabled = false;
      if (!cfg.wallpanel) this._status('No Wallpanel settings yet on this dashboard: Save creates them.');
    } catch (e) { this._bd.innerHTML = `<div class="msg">Could not read this dashboard's config: ${esc(e && (e.message || e.code) || e)}</div>`; }
  }
  _toData(wp) {
    const d = {}; for (const k of SS_PLAIN) d[k] = wp[k] !== undefined ? wp[k] : SS_DEF[k];
    d.enabled_on_views = Array.isArray(wp.enabled_on_views) ? wp.enabled_on_views.slice() : [];
    d.exclude_videos = Array.isArray(wp.exclude_media_types) && wp.exclude_media_types.includes('video');
    const { c } = ssClock(wp);
    d.clock_show = !!c && !ssClockHidden(c); d.clock_format = c && String(c.time_format) === '24' ? '24' : '12'; d.clock_seconds = !!(c && c.show_seconds);
    d.source = !d.show_images ? 'none' : String(d.image_url || '').startsWith(HV_ALB_MS) ? 'album' : /^media-source:\/\//.test(d.image_url) ? 'media' : /picsum\.photos/.test(d.image_url) ? 'picsum' : 'url';
    d.album_url = d.source === 'album' ? hvUnB64u(String(d.image_url).slice(HV_ALB_MS.length).split('/')[0]) : '';
    d.media_folder = d.source === 'media' ? d.image_url : 'media-source://media_source/local/';
    d.web_url = d.source === 'url' ? d.image_url : '';
    return d;
  }
  _schema() {
    const n = (name, min, max, step, unit) => ({ name, selector: { number: { min, max: Math.max(max, +this._data[name] || 0), step, mode: 'slider', unit_of_measurement: unit } } });
    const sel = (name, opts) => ({ name, selector: { select: { mode: 'dropdown', options: opts } } });
    const b = name => ({ name, selector: { boolean: {} } });
    const src = this._data.source;
    const photos = [sel('source', [{ value: 'media', label: 'Media folder (Home Assistant media)' }, { value: 'album', label: 'Album link (Google Photos, iCloud, OneDrive)' }, { value: 'url', label: 'Web address (URL)' }, { value: 'picsum', label: 'Random photos (picsum.photos)' }, { value: 'none', label: 'No photos (clock only)' }])];
    if (src === 'media') photos.push({ name: 'media_folder', selector: { text: {} } });
    if (src === 'url') photos.push({ name: 'web_url', selector: { text: { type: 'url' } } });
    if (src === 'album') { photos.push({ name: 'album_url', selector: { text: { type: 'url' } } }); this._albCheck(); }
    if (src !== 'none') photos.push(n('display_time', 5, 600, 5, 's'), n('crossfade_time', 0, 10, 0.5, 's'), sel('media_order', [{ value: 'random', label: 'Random' }, { value: 'sorted', label: 'In order (by name)' }, { value: 'random_path', label: 'Random folder, then in order' }]),
      { type: 'grid', name: '', schema: [sel('image_fit_landscape', [{ value: 'cover', label: 'Fill the screen (crop)' }, { value: 'contain', label: 'Whole photo (bars)' }, { value: 'fill', label: 'Stretch' }]),
        sel('image_fit_portrait', [{ value: 'cover', label: 'Fill the screen (crop)' }, { value: 'contain', label: 'Whole photo (bars)' }, { value: 'fill', label: 'Stretch' }])] },
      { type: 'grid', name: '', schema: [b('exclude_videos'), b('show_progress_bar')] }, b('show_image_info'));
    return [
      b('enabled'), n('idle_time', 10, 1800, 10, 's'), n('fade_in_time', 0, 10, 0.5, 's'),
      ...(this._views.length > 1 ? [{ name: 'enabled_on_views', selector: { select: { multiple: true, mode: 'list', options: this._views } } }] : []),
      { type: 'expandable', name: '', flatten: true, title: 'Photos', icon: 'mdi:image-multiple-outline', expanded: true, schema: photos },
      { type: 'expandable', name: '', flatten: true, title: 'Clock', icon: 'mdi:clock-outline', expanded: true, schema: [
        b('clock_show'), { type: 'grid', name: '', schema: [sel('clock_format', [{ value: '12', label: '12-hour (AM/PM hidden)' }, { value: '24', label: '24-hour' }]), b('clock_seconds')] }] },
      { type: 'expandable', name: '', flatten: true, title: 'Screen & behaviour', icon: 'mdi:tablet-dashboard', schema: [
        n('black_screen_after_time', 0, 7200, 60, 's'), { name: 'keep_screen_on_time', selector: { number: { min: 0, max: 604800, step: 60, mode: 'box', unit_of_measurement: 's' } } },
        { type: 'grid', name: '', schema: [b('fullscreen'), b('hide_toolbar')] }, { type: 'grid', name: '', schema: [b('hide_sidebar'), b('disable_screensaver_on_browser_mod_popup')] },
        { type: 'grid', name: '', schema: [b('stop_screensaver_on_mouse_move'), b('stop_screensaver_on_mouse_click')] }] }];
  }
  // album link (1.32.0): Wallpanel reads it through the Album Links helper's media source, so the helper is needed here (checked before saving)
  _albCheck() { const u = String((this._data || {}).album_url || '').trim(); if (!u || !hvAlbumProv(u) || (this._albSt && this._albSt.url === u) || this._albQ === u) return;
    this._albQ = u; clearTimeout(this._albT); this._albT = setTimeout(() => hvAlbumLoad(this._hass, u).then(r => { if (this._albQ !== u) return; this._albQ = null;
      this._albSt = Object.assign({ url: u }, r); delete this._albSt.ids; if (r.ok && r.via === 'browser') Object.assign(this._albSt, { ok: false, error: 'The screensaver needs the NotHomeView Album Links helper for album links (the Home Screen\'s Photos tile can show OneDrive links without it).' });
      if (this._form) this._form.schema = this._schema(); }), 600); }
  _albTxt() { return hvAlbumStatus(this._albSt, (this._data || {}).album_url).replace(' Until it works, the photos come from the media folder.', ' Saving is blocked until it works.'); }
  _renderForm() {
    if (!this._form) {
      this._bd.innerHTML = ''; const f = document.createElement('ha-form'); this._form = f;
      f.computeLabel = s => SS_LABELS[s.name] || s.name; f.computeHelper = s => s.name === 'album_url' ? this._albTxt() : SS_HELPERS[s.name];
      f.addEventListener('value-changed', ev => { ev.stopPropagation(); const v = Object.assign({}, ev.detail.value);
        for (const k of Object.keys(this._data)) if ((v[k] === undefined || v[k] === '' || v[k] === null) && k !== 'web_url' && k !== 'media_folder' && k !== 'album_url') v[k] = this._data[k]; // a cleared (x) dropdown keeps its value
        const srcCh = v.source !== this._data.source || v.album_url !== this._data.album_url; this._data = Object.assign({}, this._data, v);
        if (srcCh) this._renderForm(); this._status(this._changes().length ? 'Unsaved changes' : ''); });
      this._bd.appendChild(f);
    }
    this._form.hass = this._hass; this._form.data = this._data; this._form.schema = this._schema();
  }
  _changes() { const a = this._data0 || {}, b = this._data || {}; return Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); }
  // apply only the changed fields onto a fresh copy of the dashboard's current wallpanel config
  _apply(wp, ch) {
    const d = this._data, set = (k, v) => { wp[k] = v; };
    for (const k of SS_PLAIN) if (ch.includes(k) && k !== 'image_url' && k !== 'show_images') set(k, d[k]);
    if (ch.includes('enabled_on_views')) { if (d.enabled_on_views && d.enabled_on_views.length) wp.enabled_on_views = d.enabled_on_views.slice(); else delete wp.enabled_on_views; }
    if (['source', 'media_folder', 'web_url', 'album_url'].some(k => ch.includes(k))) {
      if (d.source === 'none') wp.show_images = false;
      else { if (wp.show_images === false) wp.show_images = true;
        wp.image_url = d.source === 'album' ? HV_ALB_MS + hvB64u(String(d.album_url || '').trim()) : d.source === 'media' ? (String(d.media_folder || '').trim() || 'media-source://media_source/local/') : d.source === 'picsum' ? SS_DEF.image_url : String(d.web_url || '').trim(); }
    }
    if (ch.includes('exclude_videos')) { const l = Array.isArray(wp.exclude_media_types) ? wp.exclude_media_types.filter(x => x !== 'video') : []; if (d.exclude_videos) l.push('video'); if (l.length || 'exclude_media_types' in wp) wp.exclude_media_types = l; }
    if (['clock_show', 'clock_format', 'clock_seconds'].some(k => ch.includes(k))) {
      if (!Array.isArray(wp.cards)) wp.cards = [];
      let { i, c } = ssClock(wp);
      if (!c && d.clock_show) { c = { type: 'clock', clock_style: 'digital', clock_size: 'large', time_format: d.clock_format, show_seconds: !!d.clock_seconds, no_background: true }; wp.cards.unshift(c); i = 0; }
      if (c) { c = JSON.parse(JSON.stringify(c)); wp.cards[i] = c;
        if (ch.includes('clock_format')) c.time_format = d.clock_format;
        if (ch.includes('clock_seconds')) c.show_seconds = !!d.clock_seconds;
        if (ch.includes('clock_show')) { // hide / show without losing the clock's own settings or CSS (keeps .time-part.am-pm{display:none})
          if (!c.card_mod) c.card_mod = {}; let st = c.card_mod.style; if (typeof st === 'string') st = { '.': st }; else st = Object.assign({}, st || {});
          let dot = (st['.'] || '').split(SS_CLOCK_OFF).join(''); if (!d.clock_show) dot += SS_CLOCK_OFF; if (dot) st['.'] = dot; else delete st['.']; c.card_mod.style = st; } }
    }
    return wp;
  }
  async _save() {
    const btn = this.shadowRoot.querySelector('.save'); btn.disabled = true; this._status('Saving…');
    if (this._data && this._data.source === 'album' && this._changes().some(k => k === 'source' || k === 'album_url')) { const u = String(this._data.album_url || '').trim(), r = u ? await hvAlbumLoad(this._hass, u) : { ok: false, error: 'Paste an album link first.' };
      if (!r.ok || r.via !== 'helper') { this._status('Not saved: ' + (!r.ok ? r.error : 'the screensaver needs the NotHomeView Album Links helper for album links.'), 'err'); btn.disabled = false; return; } }
    try {
      const cfg = await this._fetch(), wp = this._apply(JSON.parse(JSON.stringify(cfg.wallpanel || {})), this._changes());
      const out = Object.assign({}, cfg, { wallpanel: wp }); const m = { type: 'lovelace/config/save', config: out }; if (this._dash) m.url_path = this._dash;
      await this._hass.callWS(m);
      this._cfg = out; this._wp0 = JSON.parse(JSON.stringify(wp)); this._data0 = this._toData(wp); this._data = Object.assign({}, this._data0); this._renderForm();
      this._status('Saved ✓ The screensaver uses the new settings now.', 'ok');
      this.dispatchEvent(new CustomEvent('homeview-screensaver-saved', { bubbles: true, composed: true, detail: { wallpanel: wp } }));
    } catch (e) { this._status('Save failed: ' + (e && (e.message || e.code) || e), 'err'); }
    btn.disabled = false;
  }
  // Preview (1.30.2). Wallpanel refuses to start while `enabled` is false (it also drops its photos, fullscreen ... when disabled) and while a browser_mod popup is open,
  // and its settings are private to it. So the preview hands it a TEMPORARY copy of the settings through the page address (Wallpanel's own `wp_*` URL options:
  // enabled on + the unsaved values from this sheet), starts it, and puts the address and Wallpanel's real settings back as soon as the screensaver stops.
  // Nothing is saved; Wallpanel's saved `enabled` stays as it is.
  _previewParams() {
    const d = this._data || {}, ch = this._changes(), wp = this._apply(JSON.parse(JSON.stringify(this._wp0 || {})), ch), o = {};
    for (const k of ['idle_time', 'fade_in_time', 'display_time', 'crossfade_time', 'media_order', 'image_fit_landscape', 'image_fit_portrait', 'black_screen_after_time', 'show_images', 'image_url', 'show_progress_bar', 'show_image_info'])
      if (wp[k] !== undefined && JSON.stringify(wp[k]) !== JSON.stringify((this._wp0 || {})[k])) o[k] = wp[k];
    o.idle_time = d.idle_time; o.fade_in_time = d.fade_in_time;
    const here = decodeURIComponent(location.pathname.split('/')[2] || ''), views = (d.enabled_on_views || []).slice();
    if (views.length) { if (here && !views.includes(here)) views.push(here); o.enabled_on_views = JSON.stringify(views); }
    else if (Array.isArray((this._wp0 || {}).enabled_on_views) && this._wp0.enabled_on_views.length) { const all = this._views.map(v => v.value); if (here && !all.includes(here)) all.push(here); o.enabled_on_views = JSON.stringify(all); }
    Object.assign(o, { enabled: true, fullscreen: false, keep_screen_on_time: 0, hide_toolbar: false, hide_sidebar: false, disable_screensaver_on_browser_mod_popup: false });
    return o;
  }
  _preview() {
    const w = ssWallpanel();
    if (!w || typeof w.startScreensaver !== 'function') { this._status('Wallpanel is not running on this page.', 'err'); return; }
    if (this._pvBusy) return; this._pvBusy = true;
    const host = document.querySelector('home-assistant') || window, url0 = location.pathname + location.search + location.hash, st0 = history.state;
    const relocate = () => host.dispatchEvent(new Event('location-changed', { bubbles: true, cancelable: false, composed: true }));
    const done = () => { // Wallpanel back to its saved settings: change the address once (so it re-reads it), then restore it exactly
      this._pvBusy = false; try { history.replaceState(st0, '', url0 + (url0.includes('#') ? '' : '#hv-preview-end')); relocate();
        setTimeout(() => { try { history.replaceState(st0, '', url0); relocate(); } catch (e) {} }, 250); } catch (e) {} };
    const popupOpen = () => { const m = document.querySelector('home-assistant'); return !!(m && m.shadowRoot && [...m.shadowRoot.querySelectorAll('*')].some(e => e.tagName.toLowerCase().startsWith('browser-mod-popup') && e.shadowRoot && e.shadowRoot.querySelector('ha-dialog'))); };
    const apply = () => { const q = new URLSearchParams(location.search); for (const [k, v] of Object.entries(this._previewParams())) q.set('wp_' + k, typeof v === 'string' ? v : String(v));
      history.replaceState(st0, '', location.pathname + '?' + q.toString() + location.hash); relocate(); };
    const start = () => {
      try { apply(); } catch (e) { done(); fire(host, 'hass-notification', { message: 'Preview could not start.' }); return; }
      // Wallpanel notices the new address after ~30 ms and re-reads its settings (and would stop a running screensaver on an address change), so start only after that
      setTimeout(() => { try { if (!/[?&]wp_enabled=true/.test(location.search)) { apply(); } } catch (e) { /* checked below */ }
        setTimeout(() => { try { const r = w.startScreensaver(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* checked below */ }
          let t = 0; const iv = setInterval(() => { t++;
            if (!w.screensaverRunning()) { clearInterval(iv); if (t <= 2) fire(host, 'hass-notification', { message: 'Preview could not start. Is Wallpanel running on this page?' }); done(); } }, 300); }, 100); }, 150);
    };
    // the sheet is a browser_mod popup: let it finish closing first (its closing also touches the page address), then switch Wallpanel over
    const afterClose = () => { let n = 0; const iv = setInterval(() => { if (!popupOpen() || ++n > 30) { clearInterval(iv); setTimeout(start, 120); } }, 100); };
    if (this.hasAttribute('large')) { this._close(); setTimeout(afterClose, 350); } else start();
  }
  _close() {
    if (this._overlay) { this._overlay.remove(); return; }
    if (this._popupHost()) this._dismiss(this.getBoundingClientRect().height || window.innerHeight);
  }
  _pop() {}
}
for (const k of ['_popupHost', '_swipeAttr', '_resetDrag', '_bindSwipe', '_snapBack', '_dismiss']) HVScreensaverCard.prototype[k] = HVNowPlayingCard.prototype[k];
const SS_LABELS = { enabled: 'Screensaver on', idle_time: 'Start after (idle)', fade_in_time: 'Fade in', enabled_on_views: 'Only on these views (none ticked = all views)',
  source: 'Photos from', media_folder: 'Media folder', web_url: 'Photo URL', album_url: 'Album link', display_time: 'Switch photo every', crossfade_time: 'Crossfade between photos', media_order: 'Order',
  image_fit_landscape: 'Landscape photos', image_fit_portrait: 'Portrait photos', exclude_videos: 'Skip videos', show_progress_bar: 'Progress bar', show_image_info: 'Show photo info',
  clock_show: 'Show the clock', clock_format: 'Time format', clock_seconds: 'Seconds',
  black_screen_after_time: 'Turn the screen black after (0 = never)', keep_screen_on_time: 'Keep the screen on for (0 = off)', fullscreen: 'Full screen', hide_toolbar: 'Hide the top bar',
  hide_sidebar: 'Hide the sidebar', disable_screensaver_on_browser_mod_popup: 'Not while a popup is open', stop_screensaver_on_mouse_move: 'Stop on mouse move', stop_screensaver_on_mouse_click: 'Stop on tap / click' };
const SS_HELPERS = { media_folder: 'e.g. media-source://media_source/local/ (Media → My media). Every photo in the folder is used.', idle_time: 'Seconds without touching the screen.',
  web_url: 'One image address; ${width}, ${height} and ${timestamp} are filled in by Wallpanel.', keep_screen_on_time: 'Seconds (86400 = a day). Uses the screen wake lock.' };
HVScreensaverCard.schema = [{ name: 'dashboard', selector: { text: {} } }];
Object.assign(LABELS, { dashboard: 'Dashboard URL (empty = this dashboard)' });
HVScreensaverCard.layoutSection = false; HVScreensaverCard.sizePresets = false;

/* ---------------- Layout section (size & position in the grid) ----------------
   Home Assistant only shows its own "Layout" tab in a sections view. In layout-card grids (custom:grid-layout) and other
   CSS-grid views a card's size/position is its `view_layout` (grid-column / grid-row). Every HomeView editor gets a
   "Layout" section that reads and writes exactly that, so the card can be resized and moved without YAML. */
const VL_MAX = 6;
const vlParse = v => { // grid-column / grid-row string -> { span: '1'..'6' | 'full' | 'custom', start: 'auto' | '1'..'6' }
  if (v == null || v === '') return { span: '1', start: 'auto' };
  const t = String(v).trim().replace(/\s+/g, ' ');
  let m;
  if ((m = t.match(/^span (\d+)$/))) return { span: m[1], start: 'auto' };
  if ((m = t.match(/^(\d+) ?\/ ?span (\d+)$/))) return { span: m[2], start: m[1] };
  if ((m = t.match(/^(\d+) ?\/ ?-1$/))) return { span: 'full', start: m[1] === '1' ? 'auto' : m[1] };
  if ((m = t.match(/^(\d+) ?\/ ?(\d+)$/)) && +m[2] > +m[1]) return { span: String(+m[2] - +m[1]), start: m[1] };
  if ((m = t.match(/^(\d+)$/))) return { span: '1', start: m[1] };
  return { span: 'custom', start: 'auto', raw: t };
};
const vlBuild = (span, start) => {
  if (span === 'full') return (start && start !== 'auto' ? start : '1') + ' / -1';
  const n = Math.max(1, parseInt(span, 10) || 1);
  if (!start || start === 'auto') return n === 1 ? undefined : 'span ' + n;
  return start + ' / span ' + n;
};
const VL_FIELDS = ['vl_columns', 'vl_rows', 'vl_column_start', 'vl_row_start'];
const vlOpts = (word, fullLabel, raw) => [...Array.from({ length: VL_MAX }, (_, i) => ({ value: String(i + 1), label: `${i + 1} ${word}${i ? 's' : ''}` })),
  { value: 'full', label: fullLabel }, ...(raw ? [{ value: 'custom', label: `Custom (YAML): ${raw}` }] : [])];
const vlStart = word => [{ value: 'auto', label: 'Auto (next free spot)' }, ...Array.from({ length: VL_MAX }, (_, i) => ({ value: String(i + 1), label: `${word} ${i + 1}` }))];
const vlSchema = (c, r) => ({ type: 'expandable', name: '', flatten: true, title: 'Layout (size & position)', icon: 'mdi:view-grid-outline', schema: [
  { type: 'grid', name: '', schema: [
    { name: 'vl_columns', selector: { select: { mode: 'dropdown', options: vlOpts('column', 'Full width', c.raw) } } },
    { name: 'vl_rows', selector: { select: { mode: 'dropdown', options: vlOpts('row', 'Full height', r.raw) } } }] },
  { type: 'grid', name: '', schema: [
    { name: 'vl_column_start', selector: { select: { mode: 'dropdown', options: vlStart('Column') } } },
    { name: 'vl_row_start', selector: { select: { mode: 'dropdown', options: vlStart('Row') } } }] }] });
Object.assign(LABELS, { vl_columns: 'Width', vl_rows: 'Height', vl_column_start: 'Start column', vl_row_start: 'Start row' });
Object.assign(HELPERS, { vl_column_start: 'Auto = fill the next free cell. Pick a column/row to pin the card there.' });

// true when the dashboard view being edited is a native sections view (then HA's own Layout tab handles size & position)
function hvInSectionsView(lovelace) {
  try {
    const views = lovelace && lovelace.config && lovelace.config.views;
    if (views) { const seg = decodeURIComponent(location.pathname.split('/')[2] || '');
      const v = views.find((x, i) => (x.path || String(i)) === seg) || (seg === '' ? views[0] : null);
      if (v) return v.type === 'sections'; }
  } catch (e) {}
  const find = (root, d) => { if (d > 12) return false; for (const e of root.querySelectorAll('*')) { if (e.tagName === 'HUI-SECTIONS-VIEW') return true; if (e.shadowRoot && find(e.shadowRoot, d + 1)) return true; } return false; };
  try { return find(document, 0); } catch (e) { return false; }
}
/* ---------------- Size presets (every HomeView card) ----------------
   Rows × columns of the sections grid. Picking one writes grid_options; the dropdown shows the card's current size, or
   "Custom" when it was resized some other way (e.g. HA's own Layout tab). */
const SIZE_OPTS = [...SIZE_OPTS_FIXED, ...RESP_OPTS];
Object.assign(HV_SIZES, RESP_SIZES);
const ASPECT_FIELD = { name: 'aspect', selector: { select: { mode: 'dropdown', options: [{ value: '1.12', label: 'Standard tile' }, { value: '1', label: 'Square' },
  { value: '1.5', label: 'Wide (3 : 2)' }, { value: '2.4', label: 'Extra wide (strip)' }] } } };
Object.assign(LABELS, { hv_size: 'Size' });
Object.assign(HELPERS, { hv_size: 'Rows × columns of the sections grid. One NotHomeView tile is 2 × 3.' });
const hvSizeOf = (cls, cfg) => {
  let d = {}; try { d = cls.prototype.getGridOptions.call({ _config: Object.assign({}, cls.defaults || {}, cfg) }) || {}; } catch (e) {}
  const g = cfg.grid_options || {}, cols = g.columns != null ? g.columns : d.columns, rows = g.rows != null ? g.rows : d.rows;
  const P = hvPresets(cls), key = Object.keys(P).find(k => P[k].columns === cols && P[k].rows === rows);
  return { key: key || 'custom', cols, rows, opts: cls.sizeOptions || [...SIZE_OPTS, ...(cls.sizeOptionsExtra || [])] };
};
const hvPresets = cls => (cls && cls.sizePresetsMap) || HV_SIZES;
const hvSizeField = cur => ({ name: 'hv_size', selector: { select: { mode: 'dropdown', options: [...cur.opts,
  ...(cur.key === 'custom' ? [{ value: 'custom', label: `Custom${cur.rows != null && cur.cols != null ? ` (${cur.rows} × ${cur.cols})` : ''}` }] : [])] } } });
const hvWithSize = (schema, cur, cls) => { // camera: in place of its placeholder; others: before Colours / the first expandable section
  const f = hvSizeField(cur), out = schema.slice(), i = out.findIndex(x => x && x.name === 'hv_size');
  if (i >= 0) { out[i] = f; return out; }
  let j = out.findIndex(x => x && x.type === 'expandable' && /Colour/.test(x.title || '')); if (j < 0) j = out.findIndex(x => x && x.type === 'expandable');
  const add = cls && cls.prototype instanceof HVBase ? [{ type: 'grid', name: '', schema: [f, ASPECT_FIELD] }] : [f];
  out.splice(j < 0 ? out.length : j, 0, ...add); return out;
};
class HVEditor extends HTMLElement {
  get _sizes() { return !!this.cardClass && this.cardClass.sizePresets !== false; }
  setConfig(c) { this._config = c; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  get _hasLayout() {
    if (this.cardClass && this.cardClass.layoutSection === false) return false;
    if (this._inSections === undefined) this._inSections = hvInSectionsView(this.lovelace);
    return !this._inSections;
  }
  // layout-card wraps every card editor: its setConfig stashes view_layout in this._layoutData and strips it from the config,
  // and on every UI change it writes this._layoutData back into the saved config. So read it from there, and update it when
  // the Layout section changes (otherwise the old value would be written back and the change would not stick).
  _vlCurrent() { return (this._config && this._config.view_layout) || this._layoutData || {}; }
  _vlState() {
    const vl = this._vlCurrent();
    const c = vlParse(vl['grid-column']), r = vlParse(vl['grid-row']);
    if (vl['grid-area']) { c.span = c.raw ? 'custom' : c.span; }
    return { c, r, data: { vl_columns: c.span, vl_rows: r.span, vl_column_start: c.start, vl_row_start: r.start } };
  }
  _emit(cfg) { fire(this, 'config-changed', { config: cfg }); }
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] || s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => {
        ev.stopPropagation();
        const val = Object.assign({}, ev.detail.value), cfg = {};
        for (const k of Object.keys(val)) if (!VL_FIELDS.includes(k) && k !== 'hv_size') cfg[k] = val[k];
        for (const k of Object.keys(cfg)) if (cfg[k] === '' || cfg[k] === undefined || (Array.isArray(cfg[k]) && !cfg[k].length && k === 'entities')) delete cfg[k];
        const AL = (this.cardClass && this.cardClass.editorAlias) || {};
        for (const [f, k] of Object.entries(AL)) if (f in val) { if (val[f] && val[f].length) cfg[k] = val[f]; else delete cfg[k]; delete cfg[f]; }
        const ED = this.cardClass && this.cardClass.editorDefaults ? this.cardClass.defaults : null; // toggles that default to on: show them on, and keep defaults out of the YAML
        if (ED) for (const k of Object.keys(ED)) if (cfg[k] === ED[k]) delete cfg[k];
        if (this._hasLayout) {
          const DEF = { vl_columns: '1', vl_rows: '1', vl_column_start: 'auto', vl_row_start: 'auto' }; // a cleared (x) dropdown = default
          for (const k of VL_FIELDS) if (val[k] == null || val[k] === '') val[k] = DEF[k];
          const old = this._vlState().data, changed = VL_FIELDS.some(k => val[k] !== old[k]);
          if (changed) { // rewrite view_layout's grid-column / grid-row, keep any other view_layout keys
            const vl = Object.assign({}, this._vlCurrent()); delete vl['grid-area'];
            const set = (key, span, start, prev) => { if (span === 'custom') { if (prev != null) vl[key] = prev; return; }
              const v = vlBuild(span, start); if (v === undefined) delete vl[key]; else vl[key] = v; };
            const prevVl = this._vlCurrent();
            set('grid-column', val.vl_columns, val.vl_column_start, prevVl['grid-column']);
            set('grid-row', val.vl_rows, val.vl_row_start, prevVl['grid-row']);
            if (Object.keys(vl).length) cfg.view_layout = vl; else delete cfg.view_layout;
            this._layoutData = cfg.view_layout; // keep layout-card's stash in sync
          }
        }
        if (this.cardClass && this.cardClass.editorTransform) this.cardClass.editorTransform(cfg, val, this._config); // edits cfg in place
        const PS = hvPresets(this.cardClass);
        if (this._sizes && val.hv_size && PS[val.hv_size] && val.hv_size !== hvSizeOf(this.cardClass, this._config).key) {
          cfg.grid_options = Object.assign({}, this._config.grid_options || {}, PS[val.hv_size]);
          if (this.cardClass === HVCameraCard) { if (val.hv_size === '2x3') delete cfg.size; else cfg.size = val.hv_size; }
        }
        this._emit(cfg);
      });
      this.appendChild(this._form);
      if (this._hasLayout) {
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0 4px;font-size:12px;color:var(--secondary-text-color)';
        bar.innerHTML = '<span class="vlnote"></span>';
        const btn = document.createElement(customElements.get('ha-button') ? 'ha-button' : 'button');
        btn.textContent = 'Reset layout'; btn.setAttribute('appearance', 'plain'); btn.setAttribute('size', 'small');
        btn.addEventListener('click', () => {
          const cfg = Object.assign({}, this._config), vl = Object.assign({}, this._vlCurrent());
          delete vl['grid-column']; delete vl['grid-row']; delete vl['grid-area'];
          if (Object.keys(vl).length) cfg.view_layout = vl; else delete cfg.view_layout;
          this._layoutData = cfg.view_layout;
          this._emit(cfg);
        });
        bar.appendChild(btn); this.appendChild(bar); this._bar = bar;
      }
    }
    const L = this._hasLayout ? this._vlState() : null;
    this._form.hass = this._hass;
    const ED = this.cardClass && this.cardClass.editorDefaults ? this.cardClass.defaults : null;
    const AL = (this.cardClass && this.cardClass.editorAlias) || {};
    const data = ED || Object.keys(AL).length ? Object.assign({}, ED || {}, this._config) : this._config;
    for (const [f, k] of Object.entries(AL)) { data[f] = this._config[k]; delete data[k]; }
    const SZ = this._sizes ? hvSizeOf(this.cardClass, this._config) : null;
    this._form.data = Object.assign({}, data, L ? L.data : {}, SZ ? { hv_size: SZ.key } : {});
    const base = (this.cardClass && this.cardClass.schema) || [];
    this._form.schema = [...(SZ ? hvWithSize(base, SZ, this.cardClass) : base.filter(x => !x || x.name !== 'hv_size')), ...(L ? [vlSchema(L.c, L.r)] : [])];
    hvWpHint(this, this.cardClass === HVScreensaverCard || (this.cardClass === HVEditButtonCard && this._config.show_screensaver_button !== false));
    if (this._bar) {
      const vl = this._vlCurrent();
      const parts = ['grid-column', 'grid-row', 'grid-area'].filter(k => vl[k]).map(k => `${k}: ${vl[k]}`);
      this._bar.querySelector('.vlnote').textContent = parts.length ? 'Grid: ' + parts.join(' · ') + '. Save to see it in the dashboard grid.' : 'Grid: 1 × 1, auto position.';
    }
  }
}

/* ---------------- registration ---------------- */
/* ---------------- calendar ---------------- */
// Upcoming events from one or more calendars on NotHomeView glass: header (title + chevron, tap = tap_action), then per day a
// date block (weekday / day / month, optional forecast) and the day's events (title, time range or "All day", location).
// Events come from the calendar REST API (read only) and refresh every few minutes; tapping an event opens a details sheet.
const WX_ICON = { 'clear-night': 'mdi:weather-night', cloudy: 'mdi:weather-cloudy', exceptional: 'mdi:alert-circle-outline', fog: 'mdi:weather-fog',
  hail: 'mdi:weather-hail', lightning: 'mdi:weather-lightning', 'lightning-rainy': 'mdi:weather-lightning-rainy', partlycloudy: 'mdi:weather-partly-cloudy',
  pouring: 'mdi:weather-pouring', rainy: 'mdi:weather-rainy', snowy: 'mdi:weather-snowy', 'snowy-rainy': 'mdi:weather-snowy-rainy', sunny: 'mdi:weather-sunny',
  windy: 'mdi:weather-windy', 'windy-variant': 'mdi:weather-windy-variant' };
const calDate = v => { if (!v) return null; if (typeof v === 'object') v = v.dateTime || v.date; if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); } return new Date(v); };
const calAllDay = e => { const s = e.start; return typeof s === 'string' ? /^\d{4}-\d{2}-\d{2}$/.test(s) : !!(s && s.date && !s.dateTime); };
const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
class HVCalendarCard extends HVBase {
  static get defaults() { return { title: 'Calendar', days: 7, max_events: 4, show_location: true, show_weather: false, refresh_interval: 5 }; }
  static getStubConfig(hass) { return { entities: Object.keys(hass.states).filter(k => k.startsWith('calendar.')).slice(0, 3), title: 'Calendar' }; }
  validate(c) { if (!c.entities || !c.entities.length) throw new Error('Choose at least one calendar'); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 3, min_columns: 4, min_rows: 2 }; }
  _ids() { return (this._config.entities || []).map(e => typeof e === 'string' ? e : e.entity).filter(Boolean); }
  _wx() { const c = this._config; if (!c.show_weather) return null; return c.weather_entity || (this._hass && Object.keys(this._hass.states).find(k => k.startsWith('weather.'))) || null; }
  watched() { return this._ids().concat(this._hass ? [this._wx()] : []).filter(Boolean); }
  defaultAction() { return { action: 'none' }; }
  setConfig(c) { super.setConfig(c); this._fkey = null; this._wsub(); }
  connectedCallback() { clearInterval(this._tick); this._tick = setInterval(() => { this._fkey = null; this._sig = null; this._render(); }, 60000); this._wsub(); }
  disconnectedCallback() { clearInterval(this._tick); this._unsubWx(); }
  _unsubWx() { if (this._wxUnsub) { const u = this._wxUnsub; this._wxUnsub = null; this._wxFor = null; Promise.resolve(u).then(f => f && f()).catch(() => {}); } }
  _wsub() { // daily forecast for the date blocks (read only subscription, no service call)
    const id = this._wx(); if (!this._hass || !this.isConnected) return;
    if (this._wxFor === id) return; this._unsubWx(); this._fc = null; if (!id) return;
    this._wxFor = id;
    try { this._wxUnsub = this._hass.connection.subscribeMessage(m => { this._fc = m.forecast || []; this._paint(); },
      { type: 'weather/subscribe_forecast', forecast_type: 'daily', entity_id: id }); if (this._wxUnsub.catch) this._wxUnsub.catch(() => { this._fc = null; }); } catch (e) {}
  }
  async _fetch() {
    const c = this._config, ids = this._ids(), now = new Date(), from = startOfDay(now);
    const to = new Date(from.getTime() + Math.max(1, Number(c.days) || 7, c.layout === 'wide' ? (Number(c.columns) || 3) * 2 : 1) * 864e5);
    const q = `?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`;
    const seq = (this._seq = (this._seq || 0) + 1);
    const res = await Promise.all(ids.map(id => this._hass.callApi('GET', `calendars/${id}${q}`).then(r => (r || []).map(e => Object.assign({}, e, { _cal: id }))).catch(() => [])));
    if (seq !== this._seq) return;
    const seen = new Set(), list = [];
    for (const e of res.flat()) {
      const s = calDate(e.start), en = calDate(e.end) || s; if (!s) continue;
      if (en <= now && !(calAllDay(e) && en > from)) continue; // already over
      const k = (e.summary || '') + '|' + s.getTime(); if (seen.has(k)) continue; seen.add(k); // same event in two calendars
      list.push(Object.assign(e, { _s: s, _e: en, _all: calAllDay(e) }));
    }
    list.sort((a, b) => a._s - b._s || (b._all - a._all));
    this._events = list; this._paint();
  }
  update() {
    this._wsub();
    const key = this._ids().map(id => { const s = this._hass.states[id]; return s ? s.state + (s.attributes.message || '') + (s.attributes.start_time || '') : ''; }).join('|') + '|' + this._config.days;
    const iv = Math.max(1, Number(this._config.refresh_interval) || 5) * 60000;
    if (key !== this._fkey || !this._ft || Date.now() - this._ft > iv) { this._fkey = key; this._ft = Date.now(); this._fetch(); }
    this._paint();
  }
  _fmtT(d) { const h = this._hass, lang = (h.locale && h.locale.language) || navigator.language, tf = h.locale && h.locale.time_format;
    const o = { hour: 'numeric', minute: '2-digit' }; if (tf === '12') o.hour12 = true; else if (tf === '24') o.hour12 = false;
    return d.toLocaleTimeString(lang, o); }
  _timeText(e) { if (e._all) { const days = Math.round((startOfDay(e._e) - startOfDay(e._s)) / 864e5); return days > 1 ? `All day · ${days} days` : 'All day'; }
    const multi = dayKey(e._s) !== dayKey(new Date(e._e.getTime() - 1));
    return `${this._fmtT(e._s)} – ${multi ? e._e.toLocaleDateString((this._hass.locale || {}).language, { month: 'short', day: 'numeric' }) + ' ' : ''}${this._fmtT(e._e)}`; }
  _paint() {
    if (!this._built || !this._hass) return;
    if (this._config.layout === 'wide') { this._paintWide(); return; }
    const c = this._config, h = this._hass, lang = (h.locale && h.locale.language) || navigator.language, max = Math.max(1, Number(c.max_events) || 4);
    const today = startOfDay(new Date()), ev = (this._events || []).slice(0, max);
    const groups = []; for (const e of ev) { const d = e._s < today ? today : startOfDay(e._s), k = dayKey(d); let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, d, ev: [] }); g.ev.push(e); }
    const fc = {}; for (const f of (this._fc || [])) { const d = new Date(f.datetime); fc[dayKey(d)] = f; }
    const wxu = this._wx() && h.states[this._wx()] ? '°' : '';
    const day = g => { const f = c.show_weather ? fc[g.k] : null, isT = g.k === dayKey(today);
      return `<div class="day"><div class="db${isT ? ' today' : ''}"><div class="wd">${esc(g.d.toLocaleDateString(lang, { weekday: 'short' }))}</div>
        <div class="dn">${g.d.getDate()}</div><div class="mo">${esc(g.d.toLocaleDateString(lang, { month: 'short' }))}</div>
        ${f ? `<div class="wx"><ha-icon icon="${WX_ICON[f.condition] || 'mdi:weather-partly-cloudy'}"></ha-icon><span>${Math.round(f.temperature)}${wxu}</span></div>` : ''}</div>
        <div class="evs">${g.ev.map(e => `<div class="ev" data-own data-i="${ev.indexOf(e)}" role="button" tabindex="0"><div class="et">${esc(e.summary || '(No title)')}</div>
          <div class="em"><ha-icon icon="mdi:clock-outline"></ha-icon><span class="tm">${esc(this._timeText(e))}</span></div>
          ${c.show_location && e.location ? `<div class="em"><ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${esc(e.location)}</span></div>` : ''}</div>`).join('')}</div></div>`; };
    const body = this._events == null ? `<div class="empty"><span>Loading…</span></div>`
      : !groups.length ? `<div class="empty"><ha-icon icon="mdi:calendar-check-outline"></ha-icon><span>No upcoming events</span></div>` : groups.map(day).join('');
    this._root.innerHTML = `<div class="cal"><div class="hd"><ha-icon class="hi" icon="${esc(c.icon || 'mdi:calendar')}"></ha-icon><span class="ht">${esc(c.title != null ? c.title : 'Calendar')}</span>
      ${(this.actionConfig('tap') || {}).action !== 'none' ? '<ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>' : ''}</div><div class="list">${body}</div></div>`;
    this._card.setAttribute('aria-label', `${c.title || 'Calendar'}, ${ev.length} upcoming events`);
    this._root.querySelectorAll('.ev').forEach(el => {
      const open = e2 => { e2.stopPropagation(); this._details(ev[Number(el.dataset.i)]); };
      el.addEventListener('click', open); el.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); open(k); } });
    });
    requestAnimationFrame(() => this._fit());
  }
  // Wide layout: the next N days side by side (Today / Tomorrow / weekday), each column with its forecast and events.
  // Narrow cards (phones) keep the columns readable and scroll them sideways.
  _paintWide() {
    const c = this._config, h = this._hass, lang = (h.locale && h.locale.language) || navigator.language, nc = Math.max(1, Math.min(7, Number(c.columns) || 3)), rows = this._wideRows(), n = nc * rows;
    const today = startOfDay(new Date()), fc = {}; for (const f of (this._fc || [])) fc[dayKey(new Date(f.datetime))] = f;
    const cols = []; for (let i = 0; i < n; i++) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i), e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); cols.push({ i, d, e, k: dayKey(d), ev: [] }); }
    const all = this._wev = (this._events || []);
    for (const ev of all) for (const col of cols) if (ev._s < col.e && ev._e > col.d) col.ev.push(ev);
    const rel = i => { if (i < 2) { try { const s = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(i, 'day'); return s.charAt(0).toUpperCase() + s.slice(1); } catch (x) {} return i ? 'Tomorrow' : 'Today'; }
      return cols[i].d.toLocaleDateString(lang, { weekday: 'long' }); };
    const tt = e => e._all ? 'All day' : this._fmtT(e._s) + (e._e - e._s > 60000 ? ' – ' + this._fmtT(e._e) : '');
    this._narrowNow = !!(this._card && this._card.clientWidth && this._card.clientWidth < 520);
    const col = cl => { const f = c.show_weather ? fc[cl.k] : null;
      return `<div class="col${cl.i === 0 ? ' today' : ''}"><div class="ch"><div class="cn">${esc(rel(cl.i))}</div><div class="cd">${esc(cl.d.toLocaleDateString(lang, rows > 1 && !this._narrowNow ? { month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }))}</div>
        ${f ? `<div class="cw"><ha-icon icon="${WX_ICON[f.condition] || 'mdi:weather-partly-cloudy'}"></ha-icon><span>${Math.round(f.temperature)}°${f.templow != null ? `<i>${Math.round(f.templow)}°</i>` : ''}</span></div>` : ''}</div>
        <div class="evs">${cl.ev.length ? cl.ev.map(e => `<div class="ev${e._all ? ' ad' : ''}" data-own data-i="${all.indexOf(e)}" role="button" tabindex="0"><div class="et">${esc(e.summary || '(No title)')}</div>
          <div class="em"><span>${esc(tt(e))}${c.show_location && e.location ? ' · ' + esc(e.location) : ''}</span></div></div>`).join('') : `<div class="none">${this._events == null ? 'Loading…' : 'Nothing planned'}</div>`}</div><div class="more"></div></div>`; };
    const narrow = this._card && this._card.clientWidth && this._card.clientWidth < 520; this._narrow = narrow;
    this._rowsPainted = rows; this._root.innerHTML = `<div class="cal wide${narrow ? ' stack' : rows > 1 ? ' r2' : ''}" style="--nc:${nc}"><div class="hd"><ha-icon class="hi" icon="${esc(c.icon || 'mdi:calendar')}"></ha-icon><span class="ht">${esc(c.title != null ? c.title : 'Calendar')}</span>
      ${(this.actionConfig('tap') || {}).action !== 'none' ? '<ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>' : ''}</div><div class="cols">${cols.map(col).join('')}</div></div>`;
    this._card.setAttribute('aria-label', `${c.title || 'Calendar'}, next ${n} days`);
    this._root.querySelectorAll('.ev').forEach(el => {
      const open = e2 => { e2.stopPropagation(); this._details(all[Number(el.dataset.i)]); };
      el.addEventListener('click', open); el.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); open(k); } });
    });
    requestAnimationFrame(() => this._fit());
  }
  _build() { super._build(); if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this._fit()); this._ro.observe(this._card); } }
  // tall wide cards (e.g. tablet portrait) show a second row of days instead of empty space; rows: 1 / 2 forces it
  _wideRows() { const c = this._config; if (Number(c.rows) === 1 || Number(c.rows) === 2) return Number(c.rows); const card = this._card; if (!card) return 1;
    const H = card.clientHeight, W = card.clientWidth; return (H > 600 && W >= 560) || (W && W < 520) ? 2 : 1; }
  _fitWide(root) {
    const nw = !!(this._card && this._card.clientWidth && this._card.clientWidth < 520);
    if (this._wideRows() !== this._rowsPainted || nw !== !!this._narrow) { this._paintWide(); return; }
    if (nw) return; // stacked days scroll instead // per column: hide events that don't fit, show "+N more"
    const rb = root.getBoundingClientRect().bottom + 1; root.querySelectorAll('.col').forEach(cl => { cl.style.visibility = ''; });
    for (const cl of root.querySelectorAll('.col')) { if (cl.getBoundingClientRect().top + 40 > rb) { cl.style.visibility = 'hidden'; continue; } const box = cl.querySelector('.evs'), more = cl.querySelector('.more'), evs = [...box.querySelectorAll('.ev')];
      evs.forEach(e => { e.style.display = ''; }); more.textContent = ''; more.style.display = 'none'; if (!evs.length) continue;
      const two = this._rowsPainted === 2, bot = Math.min(root.getBoundingClientRect().bottom, two ? cl.getBoundingClientRect().bottom : 1e9) - 8; let hid = 0;
      if (evs[evs.length - 1].getBoundingClientRect().bottom > bot) { const lb = bot - 18; // reserve a line for "+N more"; in 2 rows each day box is its own limit
        for (const e of evs) if (hid || e.getBoundingClientRect().bottom > lb) { hid++; e.style.display = 'none'; } }
      if (hid) { more.style.display = ''; more.textContent = `+${hid} more`; } }
  }
  _fit() {
    if (this._config && this._config.layout === 'wide') { const r = this._root && this._root.querySelector('.cols'); if (r) this._fitWide(r); return; } // hide events that would only be half visible; drop days left empty
    const list = this._root.querySelector('.list'); if (!list) return; const lb = list.getBoundingClientRect().bottom + 1;
    list.querySelectorAll('.ev').forEach(e => { e.style.display = ''; });
    list.querySelectorAll('.day').forEach(d => { d.style.display = ''; });
    const evs = [...list.querySelectorAll('.ev')]; let cut = false;
    for (const e of evs) { if (cut || e.getBoundingClientRect().bottom > lb) { cut = true; e.style.display = 'none'; } }
    list.querySelectorAll('.day').forEach((d, i) => { if (i > 0 && ![...d.querySelectorAll('.ev')].some(e => e.style.display !== 'none')) d.style.display = 'none'; });
  }
  _details(e) { // glass details sheet on top of the page; nothing is sent to Home Assistant
    if (!e) return; const h = this._hass, lang = (h.locale && h.locale.language) || navigator.language;
    const cal = h.states[e._cal], calName = cal ? cal.attributes.friendly_name || e._cal : e._cal;
    const date = e._s.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' });
    const host = document.createElement('div'); host.className = 'hv-cal-sheet';
    const sr = host.attachShadow({ mode: 'open' }), dayStyle = this.hasAttribute('day');
    sr.innerHTML = `<style>
:host{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;font-family:${FONT};-webkit-tap-highlight-color:transparent}
.bg{position:absolute;inset:0;background:rgba(6,8,30,.38);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:f .18s ease}
.p{position:relative;box-sizing:border-box;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 48px);overflow:auto;padding:22px 22px 18px;border-radius:26px;
 background:${dayStyle ? 'linear-gradient(150deg,rgba(255,255,255,.9),rgba(255,255,255,.76))' : 'linear-gradient(150deg,rgba(60,58,110,.72),rgba(28,28,60,.78))'};
 border:1px solid ${dayStyle ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.22)'};color:${dayStyle ? '#14263b' : '#fff'};
 box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 20px 60px rgba(6,8,60,.45);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);animation:u .22s ease}
@keyframes f{from{opacity:0}} @keyframes u{from{opacity:0;transform:translateY(12px) scale(.98)}}
.cn{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:999px;
 background:rgba(196,182,255,.28);color:${dayStyle ? '#4b3bb5' : '#e6defe'}}
h2{margin:12px 0 10px;font-size:22px;line-height:1.25;font-weight:700;overflow-wrap:break-word;word-break:normal;hyphens:auto}
.r{display:flex;gap:10px;align-items:flex-start;margin:8px 0;font-size:15px;line-height:1.35;opacity:.92;overflow-wrap:break-word;word-break:normal}
.r ha-icon{--mdc-icon-size:19px;flex:none;opacity:.75;margin-top:1px}
.d{margin-top:14px;padding-top:12px;border-top:1px solid ${dayStyle ? 'rgba(20,40,70,.12)' : 'rgba(255,255,255,.14)'};font-size:14px;line-height:1.45;white-space:pre-wrap;opacity:.85;overflow-wrap:break-word}
.x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;
 background:${dayStyle ? 'rgba(20,40,70,.08)' : 'rgba(255,255,255,.12)'};color:inherit}
.x ha-icon{--mdc-icon-size:20px}
</style><div class="bg"></div><div class="p" role="dialog" aria-modal="true"><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
<span class="cn"><ha-icon icon="mdi:calendar" style="--mdc-icon-size:14px"></ha-icon>${esc(calName)}</span>
<h2>${esc(e.summary || '(No title)')}</h2>
<div class="r"><ha-icon icon="mdi:calendar-today"></ha-icon><span>${esc(date)}</span></div>
<div class="r"><ha-icon icon="mdi:clock-outline"></ha-icon><span>${esc(this._timeText(e))}</span></div>
${e.location ? `<div class="r"><ha-icon icon="mdi:map-marker-outline"></ha-icon><span>${esc(e.location)}</span></div>` : ''}
${e.description ? `<div class="d">${esc(String(e.description).replace(/<[^>]+>/g, ' ').trim())}</div>` : ''}</div>`;
    const close = () => { host.remove(); removeEventListener('keydown', key); };
    const key = k => { if (k.key === 'Escape') close(); };
    sr.querySelector('.bg').addEventListener('click', close); sr.querySelector('.x').addEventListener('click', close); addEventListener('keydown', key);
    if (hvFullPopups()) hvFhCard(host, sr, sr.querySelector('.p'), close, '560px');
    document.body.appendChild(host); sr.querySelector('.x').focus();
  }
  static get css() { return `
ha-card{cursor:default}
.cal{height:100%;box-sizing:border-box;display:flex;flex-direction:column;padding:max(10px,min(4.2cqw,16px)) max(10px,min(4.2cqw,18px)) 6px;color:var(--hv-text,#fff);gap:max(6px,min(2.4cqw,10px))}
.hd{display:flex;align-items:center;gap:6px;flex:none;cursor:pointer;min-width:0;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.hd .hi{--mdc-icon-size:max(16px,min(6cqw,22px));color:var(--hv-icon,#fff);display:flex}
.ht{font-size:max(13px,min(5.4cqw,18px));font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chev{--mdc-icon-size:max(16px,min(5.6cqw,20px));opacity:.7;display:flex;margin-left:-2px}
.list{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:max(6px,min(2.4cqw,10px))}
.day{display:flex;gap:max(6px,min(3cqw,12px));align-items:flex-start;flex:none}
.db{flex:none;width:max(36px,min(15cqw,56px));text-align:center;line-height:1.05;padding-top:2px;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.wd,.mo{font-size:max(10px,min(3.6cqw,12px));font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--hv-text2,rgba(255,255,255,.66))}
.dn{font-family:${ROUND};font-size:max(20px,min(9cqw,30px));font-weight:500;margin:1px 0;font-variant-numeric:tabular-nums}
.today .dn{color:var(--hv-accent,#d4c9ff)} :host([day]) .today .dn{color:#5a45d6}
.wx{display:flex;flex-direction:column;align-items:center;gap:1px;margin-top:5px;font-size:max(10px,min(3.4cqw,12px));color:var(--hv-text2,rgba(255,255,255,.66))}
.wx ha-icon{--mdc-icon-size:max(14px,min(5cqw,18px));display:flex}
.evs{flex:1;min-width:0;display:flex;flex-direction:column;gap:max(5px,min(2cqw,8px))}
.ev{position:relative;box-sizing:border-box;padding:max(6px,min(2.4cqw,9px)) max(8px,min(3cqw,12px)) max(6px,min(2.4cqw,9px)) max(11px,min(4cqw,15px));
 border-radius:max(12px,min(4.4cqw,16px));cursor:pointer;min-width:0;
 background:color-mix(in srgb,var(--hv-text,#fff) 9%,transparent);border:1px solid color-mix(in srgb,var(--hv-text,#fff) 14%,transparent);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.14);transition:background .15s ease}
.ev::before{content:'';position:absolute;left:max(4px,min(1.6cqw,6px));top:22%;bottom:22%;width:3px;border-radius:3px;background:var(--hv-accent,#c4b6ff)}
:host([day]) .ev::before{background:#7b68ee}
.ev:active{background:color-mix(in srgb,var(--hv-text,#fff) 16%,transparent)}
.et{font-size:max(12.5px,min(4.6cqw,16px));font-weight:650;line-height:1.22;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
 overflow-wrap:normal;word-break:normal;hyphens:manual}
.em{display:flex;align-items:center;gap:4px;margin-top:2px;font-size:max(11px,min(3.8cqw,13.5px));color:var(--hv-text2,rgba(255,255,255,.66));min-width:0}
.em span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.em ha-icon{--mdc-icon-size:max(12px,min(4cqw,14px));flex:none;display:flex;opacity:.85}
.em span.tm{white-space:normal;overflow:visible} .em:has(.tm){align-items:flex-start} .em:has(.tm) ha-icon{margin-top:.15em}
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--hv-text2,rgba(255,255,255,.66));font-size:max(12px,min(4.4cqw,15px));text-align:center}
.empty ha-icon{--mdc-icon-size:max(26px,min(11cqw,40px));opacity:.8}
.cal.stack .cols{flex-direction:column;align-items:stretch;overflow-x:hidden;overflow-y:auto;scroll-snap-type:none;overscroll-behavior-y:contain;padding-bottom:4px}
.cal.stack .col{flex:none;min-width:0;gap:7px;padding:10px 12px} .cal.stack .col .evs{overflow:visible} .cal.stack .none{padding:0 2px 2px}
.cal.r2 .cols{display:grid;grid-template-columns:repeat(var(--nc,3),1fr);grid-auto-rows:auto;align-content:start;align-items:start;overflow:hidden}
.cal.r2 .cols{grid-template-rows:repeat(2,minmax(0,1fr));align-items:stretch} .cal.r2 .col{min-height:0;overflow:hidden;max-height:none}
.cal.r2 .ch{grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline} .cal.r2 .cd{grid-row:1;grid-column:2} .cal.r2 .et,.cal.r2 .em{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .cal.r2 .cw{grid-row:1;grid-column:3;align-self:center}
.cols{flex:1;min-height:0;display:flex;align-items:flex-start;gap:max(8px,min(1.4cqw,14px));overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;padding-bottom:8px}
.cols::-webkit-scrollbar{display:none}
.col{flex:1 1 0;min-width:min(190px,74cqw);scroll-snap-align:start;display:flex;flex-direction:column;gap:8px;min-height:0;box-sizing:border-box;padding:12px 12px 10px;border-radius:20px;
 background:color-mix(in srgb,var(--hv-text,#fff) 6%,transparent);border:1px solid color-mix(in srgb,var(--hv-text,#fff) 9%,transparent)}
.ch{display:grid;grid-template-columns:1fr auto;column-gap:8px;row-gap:1px;align-items:center;flex:none;min-width:0;text-shadow:var(--hv-shade,0 1px 6px rgba(0,0,40,.25))}
.cn{font-size:17px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0} .today .cn{color:var(--hv-accent,#d4c9ff)} :host([day]) .today .cn{color:#5a45d6}
.cd{font-size:13px;font-weight:500;color:var(--hv-text2,rgba(255,255,255,.66));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.cw{grid-row:1/3;grid-column:2;display:flex;align-items:center;gap:4px;font-size:14px;font-weight:600;white-space:nowrap}
.cw ha-icon{--mdc-icon-size:20px;display:flex} .cw i{font-style:normal;font-weight:500;margin-left:4px;color:var(--hv-text2,rgba(255,255,255,.66))}
.col .evs{flex:none;min-height:0;overflow:visible;gap:7px} .col{max-height:100%}
.col .ev.ad::before{top:18%;bottom:18%;background:var(--hv-text2,rgba(255,255,255,.6))}
.col .et{font-size:15px} .col .em{font-size:13px}
.none{color:var(--hv-text2,rgba(255,255,255,.6));font-size:14px;padding:6px 2px}
.more{flex:none;font-size:12.5px;font-weight:600;color:var(--hv-text2,rgba(255,255,255,.7));padding:0 4px}`; }
}
HVCalendarCard.schema = [
  { name: 'calendars', required: true, selector: { entity: { domain: 'calendar', multiple: true } } },
  { type: 'grid', name: '', schema: [{ name: 'title', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'days', selector: { number: { min: 1, max: 60, mode: 'box' } } }, { name: 'max_events', selector: { number: { min: 1, max: 30, mode: 'box' } } }] },
  { type: 'grid', name: '', schema: [{ name: 'show_location', selector: { boolean: {} } }, { name: 'show_weather', selector: { boolean: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'weather_entity', selector: { entity: { domain: 'weather' } } }, { name: 'refresh_interval', selector: { number: { min: 1, max: 120, mode: 'box', unit_of_measurement: 'min' } } }] },
  { type: 'grid', name: '', schema: [{ name: 'layout', selector: { select: { mode: 'dropdown', options: [{ value: 'list', label: 'List (days stacked)' }, { value: 'wide', label: 'Wide: days side by side' }] } } },
    { name: 'columns', selector: { number: { min: 1, max: 7, mode: 'box' } } }, { name: 'rows', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (2 when tall)' }, { value: '1', label: '1' }, { value: '2', label: '2' }] } } }] },
  COLORS, ACTIONS('none', 'none')];
HVCalendarCard.editorDefaults = true;
HVCalendarCard.editorAlias = { calendars: 'entities' };
HVCalendarCard.sizePresetsMap = Object.assign({}, HV_SIZES, { '3x6': { columns: 6, rows: 3 }, '4x12': { columns: 12, rows: 4 }, '5x12': { columns: 12, rows: 5 } });
HVCalendarCard.sizeOptionsExtra = [{ value: '3x6', label: '3 × 6 (half a section, 3 rows)' }, { value: '4x12', label: '4 × 12 (full section, 4 rows)' }, { value: '5x12', label: '5 × 12 (full section, 5 rows)' }];
Object.assign(LABELS, { calendars: 'Calendars', title: 'Title', days: 'Days ahead', max_events: 'Max events', show_location: 'Show location', show_weather: 'Show weather per day',
  weather_entity: 'Weather entity (empty = first one found)', refresh_interval: 'Refresh every', layout: 'Layout', columns: 'Days side by side (wide layout)', rows: 'Rows of days (wide layout)' });
Object.assign(HELPERS, { calendars: 'Events from all of these are merged and sorted by time.', show_weather: 'Daily forecast under each date. Tapping an event opens its details; the Tap action (Interactions) is for the header.' });

/* ---------------- TV (tile + Now Playing-style TV popup) ---------------- */
// homeview-tv-player-card = the Now Playing popup layout with a 16:9 picture, power, app / source picker, TV switcher and an
// optional remote (D-pad) that sends remote.send_command to the TV's remote entity (found on the same device, or set).
const TV_KEYS = { // remote.send_command names per integration
  apple_tv: { up: 'up', down: 'down', left: 'left', right: 'right', select: 'select', back: 'menu', home: 'home', menu: 'top_menu' },
  roku: { up: 'up', down: 'down', left: 'left', right: 'right', select: 'select', back: 'back', home: 'home', menu: 'info' },
  androidtv_remote: { up: 'DPAD_UP', down: 'DPAD_DOWN', left: 'DPAD_LEFT', right: 'DPAD_RIGHT', select: 'DPAD_CENTER', back: 'BACK', home: 'HOME', menu: 'MENU' },
  androidtv: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', select: 'CENTER', back: 'BACK', home: 'HOME', menu: 'MENU' },
  braviatv: { up: 'Up', down: 'Down', left: 'Left', right: 'Right', select: 'Confirm', back: 'Return', home: 'Home', menu: 'Options' } };
const TV_OFF = ['off', 'standby', 'unavailable', 'unknown'];
// no artwork: app icon + app colour (tinted placeholder and background glow)
const TV_APPS = [[/youtube/i, 'mdi:youtube', '#ff2a3d'], [/netflix/i, 'mdi:netflix', '#e50914'], [/plex/i, 'mdi:plex', '#e5a00d'], [/spotify/i, 'mdi:spotify', '#1db954'],
  [/twitch/i, 'mdi:twitch', '#9146ff'], [/prime|amazon/i, 'mdi:filmstrip-box', '#00a8e1'], [/disney/i, 'mdi:castle', '#2c5cff'], [/crave/i, 'mdi:movie-open', '#2f6bff'],
  [/hulu/i, 'mdi:hulu', '#1ce783'], [/apple tv|^tv$/i, 'mdi:apple', '#8e8e93'], [/music/i, 'mdi:music', '#fa2d48'], [/hdmi|input|playstation|xbox|switch/i, 'mdi:video-input-hdmi', '#6e7bff']];
const tvApp = n => { if (!n) return null; const m = TV_APPS.find(([re]) => re.test(n)); return m ? { icon: m[1], color: m[2] } : { icon: 'mdi:application-outline', color: '#7b6cf6' }; };
const TV_CSS = `
:host([tv]) .art{aspect-ratio:16/9;max-width:100%}
:host([tv]) .ph ha-icon{--mdc-icon-size:calc(var(--s)*13)}
:host([tv]) .ph{flex-direction:column;gap:calc(var(--s)*1.6)}
:host([tv]) .ph .app{text-align:center;font-size:calc(var(--s)*3.4);font-weight:650;opacity:.9}
:host([tv]) .ph.tint{color:#fff;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--tv-app) 55%,transparent) 0%,transparent 70%)}
:host([tv]) .rb.on{background:rgba(196,182,255,.42);border-color:rgba(225,215,255,.5)}
:host([tv][fs]) .w,:host([tv][fs]) .pop{--nph:min(var(--nph0),calc((100cqw - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px) - 24px) / 1.5));--npw:calc(var(--nph) * 1.5)}
@container (max-aspect-ratio: 9/10){
 :host([tv][fs]) .w,:host([tv][fs]) .pop{--npw:min(calc(100cqw - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px) - 32px),640px,calc(var(--npa) / 1.25));
  --nph:min(var(--npa),calc(var(--npw) * 1.36))}
 :host([tv][fs]) .art{width:100%;height:auto;aspect-ratio:16/9}
}
.lst .h{font-size:calc(var(--s)*2.6);font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em;padding:0 calc(var(--s)*1.4) calc(var(--s)*1.2)}
.lst{max-height:min(60cqh,calc(var(--s)*80));overflow:auto}
.lst button{width:100%;justify-content:flex-start;gap:calc(var(--s)*2.2);padding:calc(var(--s)*1.6) calc(var(--s)*1.4);border-radius:calc(var(--s)*2.2);text-align:left;font-size:calc(var(--s)*3.2);font-weight:600}
.lst button:hover{background:rgba(255,255,255,.08)} .lst button.sel{background:rgba(255,255,255,.16)}
.lst ha-icon{--mdc-icon-size:calc(var(--s)*4.6);flex:none} .lst .ck{opacity:0;margin-left:auto} .lst .sel .ck{opacity:1}
.rem{display:flex;flex-direction:column;align-items:center;gap:calc(var(--s)*3);padding:calc(var(--s)*3.4) calc(var(--s)*3)}
.pad{position:relative;width:calc(var(--s)*44);height:calc(var(--s)*44);border-radius:50%;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);
 display:grid;grid-template:1fr 1.25fr 1fr / 1fr 1.25fr 1fr}
.pad button{border-radius:50%} .pad ha-icon{--mdc-icon-size:calc(var(--s)*7)}
.pad .u{grid-area:1/2} .pad .l{grid-area:2/1} .pad .r{grid-area:2/3} .pad .d{grid-area:3/2}
.pad .ok{grid-area:2/2;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);font-size:calc(var(--s)*3.4);font-weight:700;letter-spacing:.04em}
.keys{display:flex;gap:calc(var(--s)*3)} .keys button{width:calc(var(--s)*12);height:calc(var(--s)*12)} .keys ha-icon{--mdc-icon-size:calc(var(--s)*5.4)}
.rem .nm{font-size:calc(var(--s)*2.6);font-weight:600;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.06em}
:host([fs]) .pop.rem,:host([fs]) .pop.lst{--s:clamp(4.4px,calc(var(--npw) / 100),6px)}`;
class HVTvPlayerCard extends HVNowPlayingCard {
  static get defaults() { return Object.assign({}, super.defaults, { show_remote: true, output_title: 'TVs', idle_title: 'Nothing playing' }); }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('media_player.') && /tv/.test(k)) || 'media_player.example' }; }
  setConfig(c) { super.setConfig(c); this.setAttribute('tv', ''); }
  _build() {
    super._build();
    const R = this.shadowRoot; R.querySelector('style').textContent += TV_CSS;
    const app = this._$('[data-a="app"]'); app.style.display = 'none';
    app.insertAdjacentHTML('beforebegin', '<button class="rb glass" data-a="power" aria-label="Power"><ha-icon icon="mdi:power"></ha-icon></button>');
    this._$('[data-a="output"] ha-icon').icon = 'mdi:television';
    this._$('.ph ha-icon').icon = 'mdi:television-play'; this._$('.ph').insertAdjacentHTML('beforeend', '<div class="app"></div>');
    const ly = this._$('[data-a="lyrics"]'), qu = this._$('[data-a="queue"]'); ly.style.display = 'none'; qu.style.display = 'none';
    ly.insertAdjacentHTML('beforebegin', '<button class="sm" data-a="remote" aria-label="Remote"><ha-icon icon="mdi:remote-tv"></ha-icon></button>');
    qu.insertAdjacentHTML('afterend', '<button class="sm" data-a="source" aria-label="Apps and sources"><ha-icon icon="mdi:apps"></ha-icon></button>');
    this._card.insertAdjacentHTML('beforeend', `<div class="pop lst src"></div><div class="pop rem"><div class="nm"></div>
      <div class="pad"><button class="u" data-a="rk" data-k="up" aria-label="Up"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
      <button class="l" data-a="rk" data-k="left" aria-label="Left"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
      <button class="ok" data-a="rk" data-k="select" aria-label="Select">OK</button>
      <button class="r" data-a="rk" data-k="right" aria-label="Right"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
      <button class="d" data-a="rk" data-k="down" aria-label="Down"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div>
      <div class="keys"><button class="glass" data-a="rk" data-k="back" aria-label="Back"><ha-icon icon="mdi:arrow-u-left-top"></ha-icon></button>
      <button class="glass" data-a="rk" data-k="home" aria-label="Home"><ha-icon icon="mdi:home-outline"></ha-icon></button>
      <button class="glass" data-a="rk" data-k="menu" aria-label="Menu"><ha-icon icon="mdi:menu"></ha-icon></button>
      <button class="glass" data-a="play" aria-label="Play/Pause"><ha-icon icon="mdi:play-pause"></ha-icon></button></div></div>`);
  }
  _remote() { // the TV's remote entity: configured one for the main TV, else the remote.* on the same device
    const c = this._config, h = this._hass, p = this._player(); if (!p) return null;
    if (c.remote_entity && p.entity_id === c.entity) return c.remote_entity;
    const E = h.entities || {}, me = E[p.entity_id];
    if (me && me.device_id) { const r = Object.values(E).find(e => e.device_id === me.device_id && e.entity_id.startsWith('remote.')); if (r) return r.entity_id; }
    const guess = 'remote.' + p.entity_id.split('.')[1]; return h.states[guess] ? guess : null;
  }
  _act(a, el) {
    const p = this._player(), h = this._hass;
    switch (a) {
      case 'power': if (p) this._call(TV_OFF.includes(p.state) ? 'turn_on' : 'turn_off'); return;
      case 'source': this._pop(this._open === 'src' ? null : 'src'); return;
      case 'pick-src': this._call('select_source', { source: el.dataset.s }); this._pop(null); return;
      case 'remote': this._pop(this._open === 'rem' ? null : 'rem'); return;
      case 'rk': { const r = this._remote(); if (!r) return; const E = h.entities || {}, plat = (E[r] && E[r].platform) || (E[p && p.entity_id] || {}).platform;
        const map = TV_KEYS[plat] || TV_KEYS.apple_tv; h.callService('remote', 'send_command', { entity_id: r, command: map[el.dataset.k] || el.dataset.k }); return; }
    }
    super._act(a, el);
  }
  _pop(w) {
    this._open = w; const t = (s, on) => { const e = this._$(s); if (e) e.classList.toggle('open', on); };
    t('.vol', w === 'vol'); t('.out', w === 'out'); t('.src', w === 'src'); t('.rem', w === 'rem');
    if (w === 'out') this._paintOut(); if (w === 'src') this._paintSrc(); if (w === 'rem') this._paintRem();
  }
  _paintOut() { super._paintOut(); this.shadowRoot.querySelectorAll('.out button > ha-icon:first-child').forEach(i => i.icon = 'mdi:television'); }
  _paintSrc() {
    const p = this._player(), a = p ? p.attributes : {}, list = a.source_list || [], cur = a.source || a.app_name;
    this._$('.src').innerHTML = `<div class="h">${esc(a.app_name || a.source ? 'Apps & sources' : 'Apps & sources')}</div>` + (list.length ? list.map(s =>
      `<button data-a="pick-src" data-s="${esc(s)}" class="${s === cur ? 'sel' : ''}"><ha-icon icon="mdi:application-outline"></ha-icon><span>${esc(s)}</span><ha-icon class="ck" icon="mdi:check"></ha-icon></button>`).join('')
      : `<div class="h" style="text-transform:none;letter-spacing:0">This TV doesn't list its apps</div>`);
  }
  _paintRem() { const p = this._player(); this._$('.rem .nm').textContent = p ? (p.attributes.friendly_name || p.entity_id) : ''; }
  _render() {
    super._render(); if (!this._built || !this._hass) return;
    const c = this._config, p = this._player(), a = p ? p.attributes : {}, f = Number(a.supported_features) || 0;
    const pw = this._$('[data-a="power"]'); pw.classList.toggle('on', !!p && !TV_OFF.includes(p.state)); pw.toggleAttribute('disabled', !p || p.state === 'unavailable' || !(f & (128 | 256)));
    const rm = this._$('[data-a="remote"]'), hasR = c.show_remote !== false && !!this._remote(); rm.classList.toggle('ghost', !hasR);
    const sb = this._$('[data-a="source"]'); sb.classList.toggle('ghost', !(a.source_list && a.source_list.length));
    const appName = p && !TV_OFF.includes(p.state) ? (a.app_name || a.source || '') : '', st = tvApp(appName), ph = this._$('.ph');
    this._$('.ph .app').textContent = appName; this._$('.ph ha-icon').icon = st ? st.icon : 'mdi:television-play';
    ph.classList.toggle('tint', !!st); if (st) ph.style.setProperty('--tv-app', st.color); else ph.style.removeProperty('--tv-app');
    // glow of the app colour behind everything while there is no artwork (artwork, when present, still drives the blurred background)
    if (st) this.style.setProperty('--hv-np-bg', `radial-gradient(120% 85% at 50% 30%,color-mix(in srgb,${st.color} 38%,#232b36) 0%,#1f2631 62%,#161b23 100%)`);
    else this.style.removeProperty('--hv-np-bg');
    if (p && !a.media_title && (a.app_name || a.source) && !['playing', 'paused'].includes(p.state)) this._$('.ar').textContent = (a.app_name || a.source) + ' · ' + (a.friendly_name || '');
    if (this._open === 'src') this._paintSrc(); if (this._open === 'rem') this._paintRem();
    if (this._open === 'rem' && !hasR) this._pop(null);
  }
}
HVTvPlayerCard.layoutSection = false;
HVTvPlayerCard.editorDefaults = true;
HVTvPlayerCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'media_player' } } },
  { name: 'entities', selector: { entity: { domain: 'media_player', multiple: true } } },
  { name: 'remote_entity', selector: { entity: { domain: 'remote' } } },
  { type: 'grid', name: '', schema: [{ name: 'show_remote', selector: { boolean: {} } }, { name: 'art_background', selector: { boolean: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'show_volume', selector: { boolean: {} } }, { name: 'show_progress', selector: { boolean: {} } }] },
  { name: 'popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'window', label: 'Window' }, { value: 'fullscreen', label: 'Full screen' }] } } }];

// the dashboard tile: looks like the Music tile; shows TV name, app · title (or state); tap = TV popup
class HVTvCard extends HVMusicCard {
  static get defaults() { return Object.assign({}, super.defaults, { show_remote: true, follow_playing: true }); }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('media_player.') && /tv/.test(k)) || 'media_player.example', name: 'TV' }; }
  _player() {
    const c = this._config, ids = [c.entity].concat(c.entities || []).filter(Boolean);
    if (c.follow_playing === false) return this.stateObj;
    return ids.map(e => this._hass.states[e]).find(s => s && s.state === 'playing') || this.stateObj;
  }
  view() {
    const c = this._config, p = this._player(), a = p ? p.attributes : {}, on = p && ['playing', 'paused', 'buffering'].includes(p.state);
    const app = a.app_name || a.source, title = a.media_title && a.media_title !== app && a.media_title !== 'TV' ? a.media_title : '';
    let sec = on ? [app, title].filter(Boolean).join(' · ') || fmtState(this._hass, p) : fmtState(this._hass, p);
    if (on && p.state === 'paused') sec = 'Paused · ' + sec;
    if (c.show_state === false) sec = '';
    const multi = (c.entities || []).length;
    const name = c.name != null ? c.name : (p ? (multi ? (p.attributes.friendly_name || 'TV') : (p.attributes.friendly_name || 'TV')) : 'TV');
    return { stateObj: p, icon: c.icon || 'mdi:television', name, secondary: p ? sec : 'Not found', active: !!p && p.state === 'playing', layout: c.layout };
  }
  nowPlayingData() {
    const d = super.nowPlayingData(), c = this._config;
    d.content.type = 'custom:homeview-tv-player-card';
    if (c.remote_entity) d.content.remote_entity = c.remote_entity;
    if (c.show_remote === false) d.content.show_remote = false;
    delete d.content.show_extra; delete d.content.uppercase_title; d.content.uppercase_title = false;
    return d;
  }
}
HVTvCard.editorDefaults = true;
HVTvCard.editorAlias = { tvs: 'entities' };
HVTvCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'media_player' } } },
  { name: 'tvs', selector: { entity: { domain: 'media_player', multiple: true } } },
  { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
  { name: 'remote_entity', selector: { entity: { domain: 'remote' } } },
  { type: 'grid', name: '', schema: [{ name: 'show_remote', selector: { boolean: {} } }, { name: 'show_state', selector: { boolean: {} } }] },
  { name: 'follow_playing', selector: { boolean: {} } },
  { name: 'np_popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'fullscreen', label: 'Full screen' }, { value: 'window', label: 'Window' }] } } },
  { type: 'grid', name: '', schema: [{ name: 'np_art_background', selector: { boolean: {} } }, { name: 'np_show_volume', selector: { boolean: {} } }] },
  COLORS, ACTIONS(null, 'more-info')];
Object.assign(LABELS, { follow_playing: 'Tile shows whichever TV is playing', tvs: 'TVs to switch between', remote_entity: 'Remote entity (optional)', show_remote: 'Remote / D-pad button', popup_style: 'Display mode', np_popup_style: 'Display mode' });
Object.assign(HELPERS, { tvs: 'The Entity above is the default TV. The tile shows whichever is playing; the popup\'s TV button switches between them.',
  remote_entity: 'For the D-pad (Apple TV, Roku, Android TV, Bravia). Empty = the remote on the same device as each TV, found automatically.' });

/* ---------------- page grid (container) ---------------- */
// NotHomeView Page Grid: its child cards flow, in order, into pages of R x C big tiles that fill the screen. Portrait and
// landscape have their own rows x columns (default 3 x 3 / 3 x 4). Pages sit side by side in a native CSS scroll-snap
// scroller (swipe with momentum; iOS Safari / companion app), with page dots. A tile's size comes from its Size
// (grid_options: 3 columns x 2 rows = one tile, 6 x 4 = 2 x 2 tiles, "full" = whole row); a "NotHomeView Page Break" card starts a new page.
const GRID_SHAPES = { fill: 0, tall: 1.6, balanced: 1.4, square: 1.05 };
const gridSpan = (cfg, C, R) => { const g = cfg.grid_options || {};
  const cs = g.columns === 'full' ? C : Math.max(1, Math.min(C, Math.round((Number(g.columns) || 3) / 3)));
  const rs = Math.max(1, Math.min(R, Math.round((typeof g.rows === 'number' ? g.rows : 2) / 2))); return [cs, rs]; };
function gridPack(items, C, R, dense = true) { // first fit in order; dense: a tile that fits a hole on an earlier page goes there
  const pages = [], occs = [], names = []; let minPage = 0;           // (no back-filling across a Page Break)
  const newPage = () => { occs.push(Array.from({ length: R }, () => Array(C).fill(false))); pages.push([]); };
  newPage();
  for (const it of items) {
    if (it.brk) { if (pages[pages.length - 1].length) newPage(); minPage = pages.length - 1; if (it.name) names[pages.length - 1] = String(it.name); continue; }
    const [cs, rs] = it.span; let spot = null, pi = -1;
    const fits = (occ, r, c) => { if (r + rs > R || c + cs > C) return false; for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) if (occ[i][j]) return false; return true; };
    const tryPage = k => { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (fits(occs[k], r, c)) { spot = [r, c]; pi = k; return true; } return false; };
    for (let k = dense ? minPage : pages.length - 1; k < pages.length && !spot; k++) tryPage(k);
    if (!spot) { if (pages[pages.length - 1].length) newPage(); tryPage(pages.length - 1); }
    if (!spot) continue;
    for (let i = spot[0]; i < spot[0] + rs; i++) for (let j = spot[1]; j < spot[1] + cs; j++) occs[pi][i][j] = true;
    pages[pi].push({ it, r: spot[0], c: spot[1], cs, rs });
    if (pages.length > 30) break;
  }
  if (pages.length > 1 && !pages[pages.length - 1].length) pages.pop();
  pages.names = names.slice(0, pages.length); return pages;
}
class HVGridCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._page = 0; }
  static get defaults() { return { theme: 'inherit', portrait_rows: 3, portrait_columns: 3, landscape_rows: 3, landscape_columns: 4, portrait_shape: 'balanced', gap: 12, first_page_name: '', show_dots: true, fill_height: true, auto_rows: false, full_bleed: true, dense: true, edge_sidebar: true, swipe_back: false, swipe_back_path: '', block_pull_refresh: true }; }
  static getStubConfig() { return { cards: [{ type: 'clock', clock_style: 'analog', grid_options: { columns: 3, rows: 2 } }, { type: 'custom:homeview-nav-card', name: 'Home', icon: 'mdi:home-outline', navigation_path: '/lovelace/0' }] }; }
  static getConfigElement() { return document.createElement('homeview-grid-card-editor'); }
  setConfig(c) {
    if (!c || !Array.isArray(c.cards)) throw new Error('Add some cards (cards: [...])');
    const old = this._config; this._config = Object.assign({}, HVGridCard.defaults, c);
    if (!old || JSON.stringify(old.cards) !== JSON.stringify(c.cards)) this._makeChildren(); else this._layout(true);
  }
  set hass(h) { this._hass = h; (this._kids || []).forEach(k => { if (k.el) k.el.hass = h; }); this._arrBtn(); }
  get hass() { return this._hass; }
  // 1.32.0: small "Arrange" button next to the page dots (admins, storage-mode dashboards, outside HA's edit mode)
  _arrBtn() { hvGridCards.add(this); const b = this._arrB; if (!b) return; const now = Date.now(); if (this._arrT && now - this._arrT < 4000 && !this._arrF) return; this._arrT = now; this._arrF = false;
    const c = this._config || {}; b.hidden = !(c.arrange !== false && c.show_dots !== false && !this._edit && !this._arr && this.isConnected && hvEclOK(this)); }
  set editMode(v) { if (!v && this._edit && this._arrDirty && !this._arr) hvEcl.flush(this, 'Saved'); if (!!v !== !!this._edit) hvEditShift(this, v); this._edit = v; (this._kids || []).forEach(k => { if (k.el) k.el.editMode = v; }); hvGridCards.add(this); this.toggleAttribute('hv-edit', !!v); if (v) { if (this._arr) hvEcl.arrange(this, false, true); hvEcl.start(); } this._arrF = true; this._arrBtn(); } // 1.31.1: tap a tile to edit it
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 'full', rows: 'auto', min_columns: 12 }; }
  connectedCallback() {
    if (!this._bound) { this._bound = () => this._layout(); }
    addEventListener('resize', this._bound); addEventListener('hv-layout', this._bound); addEventListener('orientationchange', this._bound); if (window.visualViewport) visualViewport.addEventListener('resize', this._bound);
    if (window.ResizeObserver && !this._ro) { this._ro = new ResizeObserver(() => this._layout()); this._ro.observe(this); }
    this._edgeBind(true); this._backBind(true);
    [900, 3000].forEach(t => setTimeout(() => { this._arrF = true; this._arrBtn(); }, t));
    requestAnimationFrame(() => this._layout(true)); setTimeout(() => this._layout(true), 600); setTimeout(() => this._layout(), 1700); // 1700: after the edit buttons appear
  }
  // Edge swipe: a touch that starts in the left ~24 px and moves right opens Home Assistant's sidebar drawer (narrow screens,
  // where the sidebar is a drawer) instead of moving the page scroller. Mid-screen swipes keep paging the grid.
  _edgeBind(on) {
    if (!this._edgeH) { let st = null;
      const ts = e => { st = null; const c = this._config || {}; if (c.edge_sidebar === false || this._edit || !this.isConnected || e.touches.length !== 1) return;
        const t = e.touches[0]; if (t.clientX <= 24 + this._px('env(safe-area-inset-left, 0px)')) st = { x: t.clientX, y: t.clientY, done: false }; };
      const tm = e => { if (!st) return; const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
        if (e.cancelable) e.preventDefault(); // hold the page scroller still during the edge gesture
        if (!st.done && dx > 36 && Math.abs(dy) < dx) { st.done = true; this._openSidebar(); }
        else if (!st.done && Math.abs(dy) > 60) st = null; };
      const te = () => { st = null; };
      this._edgeH = [['touchstart', ts, { capture: true, passive: true }], ['touchmove', tm, { capture: true, passive: false }], ['touchend', te, true], ['touchcancel', te, true]]; }
    for (const [t, f, o] of this._edgeH) on ? addEventListener(t, f, o) : removeEventListener(t, f, o);
  }
  _drawer() { try { return document.querySelector('home-assistant').shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-drawer'); } catch (e) { return null; } }
  _openSidebar() {
    if (innerWidth >= 870) return; // wide screens: HA docks the sidebar (a saved preference) - leave that alone
    const d = this._drawer(); if (d && d.open) return;
    this.dispatchEvent(new CustomEvent('hass-toggle-menu', { bubbles: true, composed: true, detail: { open: true } }));
  }
  // Swipe down from the top (option): back to the launch page. The whole page follows the finger; a grab pill shows it's possible.
  _backPath() { const c = this._config || {}; return c.swipe_back_path || `/${ssDash() || 'lovelace'}/main`; }
  _backBind(on) {
    if (!this._back) this._back = hvPullDown({ ok: (t) => { const c = this._config || {}; if (!c.swipe_back || this._edit || !this.isConnected || scrollY > 2 || hvFhBusy()) return false;
        if (location.pathname.replace(/\/$/, '') === this._backPath().replace(/\?.*$/, '').replace(/\/$/, '')) return false;
        return t.clientY <= this._px('var(--hv-safe-top, env(safe-area-inset-top, 0px))') + 96; },
      target: hvHaRoot, done: () => hvNavigate(this._backPath()) });
    if (!!on !== !!this._backOn) this._back.bind(!!on); this._backOn = !!on;
    const c = this._config || {}; hvPTR.set(this, !!on && !!c.swipe_back && c.block_pull_refresh !== false);
  }
  disconnectedCallback() { const me = this; setTimeout(() => { if (!me.isConnected && me._arrDirty && me._edit && !me._arr) hvEcl.flush(me, 'Saved'); }, 400); setTimeout(() => { if (!me.isConnected && me._kids) hvGridPool.push({ g: me, t: Date.now(), kids: me._kids.filter(k => k.el && !k.brk).map(k => ({ j: JSON.stringify(k.cfg), el: k.el })) }); }, 0);
    this._edgeBind(false); this._backBind(false); removeEventListener('resize', this._bound); removeEventListener('hv-layout', this._bound); removeEventListener('orientationchange', this._bound); if (window.visualViewport) visualViewport.removeEventListener('resize', this._bound); }
  _shell() {
    if (this._sc) return;
    this.shadowRoot.innerHTML = `<style>
:host{display:block;width:100%;-webkit-tap-highlight-color:transparent}
.sc{display:flex;box-sizing:border-box;width:calc(100% + var(--bl,0px) + var(--br,0px));margin-left:calc(-1 * var(--bl,0px));overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x pan-y;scroll-behavior:auto}
.sc::-webkit-scrollbar{display:none}
.pg{flex:0 0 100%;width:100%;box-sizing:border-box;padding:0 var(--pr,0px) 0 var(--pl,0px);scroll-snap-align:start;scroll-snap-stop:always;display:grid;justify-content:center;align-content:center;height:var(--ph,auto);
 grid-template-columns:repeat(var(--c),var(--cw));grid-template-rows:repeat(var(--r),var(--ch));gap:var(--g)}
.cell{position:relative;min-width:0;min-height:0;display:flex}
:host([hv-edit]) .cell::after{content:'';position:absolute;inset:1px;border-radius:var(--hv-radius,22px);border:1.5px dashed rgba(255,255,255,.45);pointer-events:none;z-index:5}
:host([hv-edit][day]) .cell::after{border-color:rgba(60,60,67,.35)}
.cell > *{flex:1;min-width:0;min-height:0;height:100%;width:100%;display:block}
.dots{display:flex;justify-content:center;gap:8px;height:22px;align-items:center;margin-top:6px}
.dots button{all:unset;cursor:pointer;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.38);box-shadow:0 1px 3px rgba(0,0,30,.25);transition:all .25s ease}
.dots button.on{width:22px;border-radius:4px;background:rgba(255,255,255,.95)}
.dots.hide{display:none}
.dots.tabs{gap:8px;height:28px;margin-top:4px}
.dots button.tab{width:auto;height:26px;padding:0 13px;border-radius:13px;font:600 12.5px/26px ${FONT};color:rgba(255,255,255,.9);background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.24),0 1px 3px rgba(0,0,30,.2);
 backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);white-space:nowrap}
.dots button.tab.on{width:auto;border-radius:13px;background:rgba(255,255,255,.92);color:#1c1c1e}
:host([hv-day]) .dots button.tab{color:rgba(30,30,40,.85);background:rgba(255,255,255,.45);box-shadow:inset 0 0 0 1px rgba(60,60,67,.18)} :host([hv-day]) .dots button.tab.on{background:rgba(60,60,67,.72);color:#fff}
:host([hv-day]) .dots button{background:rgba(60,60,67,.22);box-shadow:none} :host([hv-day]) .dots button.on{background:rgba(60,60,67,.62)}
.pill{position:fixed;left:50%;top:calc(var(--hv-safe-top, env(safe-area-inset-top, 0px)) + 5px);width:38px;height:5px;margin-left:-19px;border-radius:3px;background:rgba(255,255,255,.55);box-shadow:0 1px 4px rgba(0,0,30,.25);pointer-events:none;z-index:3}
.pill[hidden]{display:none}
.empty{padding:24px;text-align:center;color:var(--primary-text-color);opacity:.7}
:host{position:relative} .arr{display:none !important;all:unset;position:absolute;right:6px;bottom:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,.85);background:rgba(0,0,30,.18);touch-action:manipulation;z-index:2}
.arr[hidden]{display:none} .arr ha-icon{--mdc-icon-size:18px;display:flex} :host([hv-day]) .arr{color:rgba(60,60,67,.75);background:rgba(60,60,67,.1)}
</style><div class="sc"></div><div class="dots"></div><div class="pill" hidden></div>`;
    this._arrB = null; // 1.32.0: no Arrange button any more: long-press the grid (or use HA's edit mode)
    this._sc = this.shadowRoot.querySelector('.sc'); this._dots = this.shadowRoot.querySelector('.dots');
    this._sc.addEventListener('scroll', () => { cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(() => {
      const w = this._sc.clientWidth || 1, i = Math.round(this._sc.scrollLeft / w); if (i !== this._page) { this._page = i; this._paintDots(); } }); }, { passive: true });
    // Snap safety net: native CSS snap does the paging (iOS/Android momentum); if a WebView leaves the scroller between pages
    // (no snap applied), settle on the nearest page once the finger is up and scrolling has stopped, biased to the swipe direction.
    const sc = this._sc; let down = false, from = 0, idle;
    const settle = () => { if (down || this._mSw) return; const w = sc.clientWidth || 1, x = sc.scrollLeft, d = x - from * w;
      if (Math.abs(x - Math.round(x / w) * w) < 2) { from = Math.round(x / w); return; }
      let t = Math.abs(d) > w * 0.18 ? from + Math.sign(d) * Math.max(1, Math.round(Math.abs(d) / w)) : from;
      t = Math.max(0, Math.min((this._nPages || 1) - 1, t)); from = t; sc.scrollTo({ left: t * w, behavior: 'smooth' }); };
    sc.addEventListener('touchstart', () => { down = this._down = true; from = Math.round(sc.scrollLeft / (sc.clientWidth || 1)); }, { passive: true });
    const up = () => { down = this._down = false; clearTimeout(idle); idle = setTimeout(settle, 160); };
    sc.addEventListener('touchend', up, { passive: true }); sc.addEventListener('touchcancel', up, { passive: true });
    sc.addEventListener('scroll', () => { clearTimeout(idle); idle = setTimeout(settle, 160); }, { passive: true });
    this._dots.addEventListener('click', e => { const b = e.composedPath().find(n => n.dataset && n.dataset.i != null); if (!b) return;
      this._sc.scrollTo({ left: Number(b.dataset.i) * this._sc.clientWidth, behavior: 'smooth' }); });
  }
  async _makeChildren() {
    this._shell(); const tok = this._tok = (this._tok || 0) + 1;
    const own = (this._kids || []).filter(k => k.el && !k.brk).map(k => ({ j: JSON.stringify(k.cfg), lj: hvLooseJ(k.cfg), el: k.el })); // reuse these first
    const helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; if (tok !== this._tok) return;
    const kids = (this._config.cards || []).map((cfg, i) => {
      if (!cfg || cfg.type === 'custom:homeview-page-break') return { cfg, brk: true };
      let el = hvGridTake(own, cfg); if (!el) try { el = helpers ? helpers.createCardElement(cfg) : document.createElement('div'); } catch (e) { el = document.createElement('div'); el.textContent = String(e); }
      if (this._hass) el.hass = this._hass; if (this._edit != null) el.editMode = this._edit;
      const cell = document.createElement('div'); cell.className = 'cell'; cell.appendChild(el);
      if (el.tagName && el.tagName.startsWith('HOMEVIEW-')) el.setAttribute('floor', '');
      const k = { cfg, el, cell };
      el._hvK = k; if (!el._hvRb) { el._hvRb = 1; el.addEventListener('ll-rebuild', ev => { ev.stopPropagation(); const kk = el._hvK; if (!kk || !helpers) return; try { const n = helpers.createCardElement(kk.cfg); n.hass = this._hass; if (n.tagName.startsWith('HOMEVIEW-')) n.setAttribute('floor', ''); n._hvK = kk; kk.cell.replaceChild(n, kk.el); kk.el = n; } catch (x) {} }); }
      return k;
    });
    this._kids = kids; this._packSig = null; this._layout(true);
  }
  _px(css) { let p = this._probe; if (!p || !p.isConnected) { p = this._probe = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;width:0;pointer-events:none'; this.shadowRoot.appendChild(p); }
    p.style.height = css; return p.getBoundingClientRect().height; }
  _layout(force) {
    if (!this._sc || !this._kids || !this.isConnected) return;
    const c = this._config, fr = this._hvFrame ? this._hvFrame() : null, r0 = this.getBoundingClientRect(), W = r0.width; if (!W) return;
    // inside a slide-up sheet (launch page): measure against the sheet, not the screen (transform-proof: relative to the sheet)
    const rect = fr ? { top: r0.top - fr.y, left: r0.left - fr.x, right: r0.right - fr.x, width: W } : r0;
    const vw = fr ? fr.w : document.documentElement.clientWidth || innerWidth, vh = fr ? fr.h : innerHeight;
    const portrait = vh >= vw;
    const g = Math.max(0, Number(c.gap) || 0);
    // Full-bleed pages: the scroller spans the whole screen width and every page carries its own side padding (= the
    // dashboard's side margin, at least the tile gap), so mid-swipe two pages are separated by a clear gutter and nothing
    // is clipped at the screen edge. Not in edit mode or in the card-editor preview (card far from the screen edges).
    const L = rect.left, Rm = vw - rect.right;
    const bleed = !this._edit && c.full_bleed !== false && L >= 0 && Rm >= 0 && L <= 48 && Rm <= 48;
    const pl = bleed ? Math.max(L, g) : 0, pr = bleed ? Math.max(Rm, g) : 0;
    const C = Math.max(1, Number(portrait ? c.portrait_columns : c.landscape_columns) || (portrait ? 3 : 4));
    const cw = Math.floor(((bleed ? vw - pl - pr : W) - (C - 1) * g) / C);
    const dotsH = c.show_dots === false ? 0 : 28;
    const safeTop = fr ? 0 : this._px('var(--hv-safe-top, env(safe-area-inset-top, 0px))');
    const bottom = this._px('var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px))') + 10;
    // portrait: start below the status bar and the floating edit / screensaver buttons (they sit over the top-right tile otherwise)
    let top = rect.top;
    if (portrait) { top = Math.max(top, safeTop + 6);
      if (!fr) for (const f of document.querySelectorAll('homeview-edit-fab')) { const fb = f.getBoundingClientRect(); if (fb.height && fb.top < vh / 3) top = Math.max(top, fb.bottom + 8); } }
    const padTop = Math.max(0, Math.round(top - rect.top)); if (!this._edit && !fr && r0.height) this._nTop = r0.top + (window.scrollY || 0); // where the grid sits in the normal view
    // 1.32.0: in HA's edit mode the edit toolbar / hidden helper cards push the grid down; keep the normal-view tile size (the page scrolls)
    const nk = vw + 'x' + vh, NL = HVGridCard._norm || (HVGridCard._norm = {});
    const nn = NL[nk + location.pathname] || {}, useN = (this._edit || (this._exitT && Date.now() - this._exitT < 2200)) && !fr; const topN = useN ? (nn.top != null ? nn.top : Math.min(top, Math.round(vh * 0.2))) : top;
    const avail = vh - topN - bottom - dotsH;
    let R = Math.max(1, Number(portrait ? c.portrait_rows : c.landscape_rows) || 3);
    const autoRows = portrait && c.auto_rows === true && c.fill_height !== false;
    if (autoRows) { let best = 1e9; // the row count whose tiles come out closest to square (a touch taller than wide, like the landscape tiles)
      for (let r = 2; r <= 8; r++) { const h = (avail - (r - 1) * g) / r; if (h < 70) break; const d = Math.abs(Math.log(h / cw / 1.1)); if (d < best) { best = d; R = r; } } }
    if (useN && autoRows && nn.R) R = nn.R; // edit mode: same row count as the normal view
    if (!this._edit && !fr) NL[nk + location.pathname] = { top, R };
    let ch = Math.floor((avail - (R - 1) * g) / R);
    const ratio = portrait && !autoRows ? (GRID_SHAPES[c.portrait_shape] ?? GRID_SHAPES.balanced) : 0;
    if (c.fill_height === false || ch < 60) ch = Math.max(ch, Math.round(cw * (ratio || 1)));
    if (ratio) ch = Math.min(ch, Math.round(cw * ratio));
    ch = Math.max(60, ch);
    // portrait: centre the grid vertically when the shape caps the tile height
    this._sc.style.setProperty('--ph', (c.fill_height !== false && avail > R * ch + (R - 1) * g + 1) ? Math.floor(avail) + 'px' : 'auto');
    this.style.paddingTop = padTop ? padTop + 'px' : '';
    const S0 = this._sc.style; S0.setProperty('--bl', (bleed ? L : 0) + 'px'); S0.setProperty('--br', (bleed ? Rm : 0) + 'px');
    S0.setProperty('--pl', pl + 'px'); S0.setProperty('--pr', pr + 'px');
    const items = this._kids.map(k => k.brk ? { brk: true, name: k.cfg && k.cfg.name } : { k, span: gridSpan(k.cfg, C, R) });
    const pages = gridPack(items, C, R, c.dense !== false);
    const sig = `${C}x${R}|` + pages.map(p => p.map(x => `${this._kids.indexOf(x.it.k)}@${x.r},${x.c}`).join(';')).join('/');
    const S = this._sc.style; S.setProperty('--c', C); S.setProperty('--r', R); S.setProperty('--cw', cw + 'px'); S.setProperty('--ch', ch + 'px'); S.setProperty('--g', g + 'px');
    if (sig !== this._packSig || force) {
      const keepPage = this._page || 0; this._packSig = sig;
      const frag = document.createDocumentFragment();
      pages.forEach(p => { const pg = document.createElement('div'); pg.className = 'pg';
        p.forEach(x => { const cell = x.it.k.cell; cell.style.gridArea = `${x.r + 1} / ${x.c + 1} / span ${x.rs} / span ${x.cs}`; pg.appendChild(cell); }); frag.appendChild(pg); });
      this._sc.replaceChildren(frag); if (!this._kids.some(k => !k.brk)) this._sc.innerHTML = '<div class="empty">Add cards in the editor</div>';
      this._nPages = pages.length; this._page = Math.min(keepPage, pages.length - 1);
      const nm = Array.from({ length: pages.length }, (_, i) => pages.names[i] || (i === 0 && c.first_page_name) || '');
      this._names = nm.slice(1).some(Boolean) ? nm.map((n, i) => n || 'Page ' + (i + 1)) : null; this._dots.innerHTML = '';
      if (this._flipR) { const m = this._flipR, sw = this._sc.clientWidth || 1; this._flipR = null; // 1.32.0: resize preview: the other tiles glide to their new places
        for (const k of this._kids) { const o = k.el && m.get(k.el); if (!o || !k.cell) continue; const n = k.cell.getBoundingClientRect(); if (!n.width || !n.height) continue;
          const dx = o.left - n.left, dy = o.top - n.top, sx = o.width / n.width, sy = o.height / n.height; if (Math.abs(dx) > sw / 2 || (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01)) continue;
          try { k.cell.animate([{ transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transformOrigin: '0 0', transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }); } catch (e) {} } }
    }
    this._deepLink();
    requestAnimationFrame(() => { const w = this._sc.clientWidth, x = (this._page || 0) * w; // keep the current page exactly in place after a resize
      if (!this._down && Math.abs(this._sc.scrollLeft - x) > 1) this._sc.scrollLeft = x; });
    this._dots.classList.toggle('hide', c.show_dots === false || (this._nPages || 1) < 2); this._paintDots();
    if (this._backOn) hvPTR.set(this, !!c.swipe_back && c.block_pull_refresh !== false);
    const pill = this.shadowRoot.querySelector('.pill'); if (pill) pill.hidden = !c.swipe_back || !!this._edit || !bleed;
  }
  _paintDots() { const n = this._nPages || 1, T = this._names;
    if (this._dots.children.length !== n) { this._dots.innerHTML = Array.from({ length: n }, (_, i) => `<button data-i="${i}" aria-label="Page ${i + 1}"${T ? ' class="tab"' : ''}></button>`).join('');
      if (T) [...this._dots.children].forEach((b, i) => { b.textContent = T[i]; b.setAttribute('aria-label', T[i]); }); }
    this._dots.classList.toggle('tabs', !!T);
    [...this._dots.children].forEach((b, i) => b.classList.toggle('on', i === this._page)); }
  // ?hv_page=<page name or number>: open that page (e.g. a Home Screen shortcut to Security > Cameras); the parameter is then dropped
  _deepLink() { let q = null; try { q = new URLSearchParams(location.search).get('hv_page'); } catch (e) {} if (!q || this._edit) return;
    const T = this._names || [], want = hvSlug(q); let i = T.findIndex(n => n && hvSlug(n) === want);
    if (i < 0 && /^\d+$/.test(q) && (this._nPages || 1) > 1) i = Number(q) - 1;
    if (i < 0 || i >= (this._nPages || 1)) return;
    this._page = i; try { const q2 = location.search.replace(/^\?/, '').split('&').filter(x => x && !/^hv_page(=|$)/.test(x)).join('&'); history.replaceState(history.state, '', location.pathname + (q2 ? '?' + q2 : '') + location.hash); } catch (e) {}
    this._paintDots(); const go = () => { if (this._sc) this._sc.scrollLeft = i * (this._sc.clientWidth || 0); }; go(); requestAnimationFrame(go); setTimeout(go, 120); }
}
class HVPageBreakCard extends HTMLElement {
  setConfig(c) { this._config = c; this.style.display = 'block'; this.innerHTML = '<div style="padding:10px;text-align:center;border:1px dashed rgba(255,255,255,.4);border-radius:12px;font:600 12px sans-serif;opacity:.7"></div>';
    this.firstChild.textContent = c && c.name ? '— new page: ' + c.name + ' —' : '— new page —'; }
  set hass(h) {} getCardSize() { return 1; } getGridOptions() { return { columns: 'full', rows: 1 }; }
  static getStubConfig() { return {}; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
}
// 1.32.0: a named page shows as a tab under the grid (instead of the dots) and can be opened with ?hv_page=<name>
HVPageBreakCard.sizePresets = false; HVPageBreakCard.layoutSection = false;
HVPageBreakCard.schema = [{ name: 'name', selector: { text: {} } }];
Object.assign(LABELS, { first_page_name: 'First page name (tabs)' });
const HV_THEME_OPTS = [{ value: 'night', label: 'Night (dark glass, default)' }, { value: 'day', label: 'Day (white)' }, { value: 'auto', label: 'Auto (follow sun)' }];
const GRID_SCHEMA = [
  { name: 'theme', selector: { select: { mode: 'dropdown', options: [{ value: 'inherit', label: 'Same as all device pages (default)' }].concat(HV_THEME_OPTS.map(o => o.value === 'night' ? { value: 'night', label: 'Night (dark glass)' } : o)) } } },
  { type: 'grid', name: '', schema: [{ name: 'portrait_rows', selector: { number: { min: 1, max: 6, mode: 'box' } } }, { name: 'portrait_columns', selector: { number: { min: 1, max: 6, mode: 'box' } } }] },
  { type: 'grid', name: '', schema: [{ name: 'landscape_rows', selector: { number: { min: 1, max: 6, mode: 'box' } } }, { name: 'landscape_columns', selector: { number: { min: 1, max: 8, mode: 'box' } } }] },
  { type: 'grid', name: '', schema: [{ name: 'portrait_shape', selector: { select: { mode: 'dropdown', options: [{ value: 'balanced', label: 'Balanced (a bit taller than wide)' },
    { value: 'square', label: 'Square-ish' }, { value: 'tall', label: 'Tall' }, { value: 'fill', label: 'Fill the whole screen height' }] } } }, { name: 'gap', selector: { number: { min: 0, max: 40, mode: 'box', unit_of_measurement: 'px' } } }] },
  { type: 'grid', name: '', schema: [{ name: 'show_dots', selector: { boolean: {} } }, { name: 'fill_height', selector: { boolean: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'auto_rows', selector: { boolean: {} } }, { name: 'full_bleed', selector: { boolean: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'dense', selector: { boolean: {} } }, { name: 'edge_sidebar', selector: { boolean: {} } }] },
  { type: 'grid', name: '', schema: [{ name: 'swipe_back', selector: { boolean: {} } }, { name: 'swipe_back_path', selector: { navigation: {} } }] },
  { name: 'block_pull_refresh', selector: { boolean: {} } },
  { name: 'first_page_name', selector: { text: {} } }];
Object.assign(LABELS, { portrait_rows: 'Portrait: rows per page', portrait_columns: 'Portrait: columns', landscape_rows: 'Landscape: rows per page', landscape_columns: 'Landscape: columns',
  portrait_shape: 'Portrait tile shape', gap: 'Gap between tiles', show_dots: 'Page dots', fill_height: 'Size tiles to the screen height',
  auto_rows: 'Portrait: auto rows (fill the screen with near-square tiles)', full_bleed: 'Edge-to-edge pages (gutter between pages)', dense: 'Fill gaps with later tiles', edge_sidebar: 'Edge swipe opens sidebar (from the left edge, phones)', swipe_back: 'Swipe down from the top to go back', swipe_back_path: 'Swipe down goes to (empty = /<dashboard>/main)', block_pull_refresh: 'Block pull-to-refresh (with swipe down to go back)' });
/* 1.31.1: tap-to-edit for the NotHomeView Page Grid (device pages). In the dashboard's edit mode every tile shows a thin outline;
   tapping a tile opens the card editor straight on THAT tile's own visual editor (entity picker, name, icon, tap action, size).
   The grid editor itself is now: a picture of the tiles (tap one to edit it, move / duplicate / delete / add), the selected tile's
   editor, and the page layout options folded away underneath. No YAML or layout editor needed. */
const HV_TAP = { cfg: null, i: -1, t: 0 };
const hvGridCards = new Set();
// 1.32.0: tile elements of a Page Grid that just left the page (HA re-creates the view after a dashboard save): a new grid with the same
// tiles takes them over, so saving a move doesn't blank the page while every tile is created again
const hvGridPool = [], hvGridDirty = new Set();
addEventListener('beforeunload', e => { const d = [...hvGridDirty].filter(g => g._arrDirty); if (!d.length) return; d.forEach(g => hvEcl.flush(g)); e.preventDefault(); e.returnValue = ''; });
/* 1.32.0: entering / leaving HA's edit mode adds / removes HA's view header ("Add title / Add badge") and the section bar above the
   grid. Make an empty header compact and scroll by the difference so the tiles stay where they were (no jump). */
const HV_HDR_CSS = `.container.edit-mode{padding:0 !important;min-height:0 !important} .container.edit-mode .layout{flex-direction:row !important;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;padding:2px 0 !important;min-height:0 !important}
.container.edit-mode .heading,.container.edit-mode .badges{margin:0 !important;padding:0 !important;flex:0 0 auto !important;width:auto !important} .container.edit-mode .add{margin:0 !important}
.actions-container{position:absolute !important;right:0;top:0;height:auto !important;z-index:1}`;
let hvHdrSheet = null;
function hvHeaderCompact(g) { const v = hvHuiView(g), sv = v && (v.querySelector('hui-sections-view') || (v.shadowRoot && v.shadowRoot.querySelector('hui-sections-view')));
  const h = sv && sv.shadowRoot && sv.shadowRoot.querySelector('hui-view-header'); if (!h || !h.shadowRoot) return;
  const cfg = (h.config || {}); if (cfg.card && cfg.card.content || (h.badges && h.badges.length)) return; // only an empty header
  try { if (!hvHdrSheet) { hvHdrSheet = new CSSStyleSheet(); hvHdrSheet.replaceSync(HV_HDR_CSS); } if (!h.shadowRoot.adoptedStyleSheets.includes(hvHdrSheet)) h.shadowRoot.adoptedStyleSheets = [...h.shadowRoot.adoptedStyleSheets, hvHdrSheet]; h.style.position = 'relative'; } catch (e) {} }
function hvEditShift(g, on) { if (g._shiftT || g._nTop == null) return; const y0 = g._nTop, t0 = Date.now();
  // entering: scroll so the grid stays put. Leaving: the normal page sits at the top again (its tiles are sized from there)
  if (!on) g._exitT = t0; // leaving: HA drops its edit chrome over ~1-2 s; keep the tiles' size and screen position meanwhile
  const fix = () => { if (!on) { if (g._edit || !g.isConnected) return; const r = g.getBoundingClientRect(); if (!r.height) return; const dy = r.top - y0; if (Math.abs(dy) > 2) window.scrollBy(0, dy); return; }
    if (!g._edit || !g.isConnected) return; hvHeaderCompact(g); const r = g.getBoundingClientRect(); if (!r.height) return; const dy = r.top - y0; if (Math.abs(dy) > 2) window.scrollBy(0, dy); };
  const step = () => { fix(); if (Date.now() - t0 < 2200) requestAnimationFrame(step); else { g._shiftT = null; if (!on) { g._exitT = 0; if (window.scrollY && g.getBoundingClientRect().top + window.scrollY <= y0 + 4) window.scrollTo(0, 0); g._layout && g._layout(); } } }; g._shiftT = 1; requestAnimationFrame(step);
  const r = hvFindRoot(g), v = hvHuiView(g); Promise.resolve(r && r.updateComplete).then(() => v && v.updateComplete).then(fix, () => {}); } // before the first paint
// 1.32.0: a tile whose only change is its size (resize handle) keeps its element: it gets the new config, no remount
const hvLooseJ = c => { if (!c || typeof c !== 'object') return JSON.stringify(c); const o = Object.assign({}, c); delete o.grid_options; delete o.size; return JSON.stringify(o); };
function hvGridTake(own, cfg) { const j = JSON.stringify(cfg); let i = own.findIndex(x => x.j === j); if (i >= 0) return own.splice(i, 1)[0].el;
  const lj = hvLooseJ(cfg); i = own.findIndex(x => x.lj && x.lj === lj); if (i >= 0) { const el = own.splice(i, 1)[0].el; try { if (typeof el.setConfig === 'function') el.setConfig(cfg); } catch (e) { return null; } return el; }
  const now = Date.now(); for (let n = hvGridPool.length - 1; n >= 0; n--) { const e = hvGridPool[n]; if (now - e.t > 8000 || e.g.isConnected) { hvGridPool.splice(n, 1); continue; }
    i = e.kids.findIndex(x => x.j === j); if (i >= 0) return e.kids.splice(i, 1)[0].el; } return null; }
const hvTapPick = e => { const x = e.clientX, y = e.clientY; if (x == null) return;
  for (const g of hvGridCards) { if (!g.isConnected) { hvGridCards.delete(g); continue; } if (!g._edit || !g._kids) continue;
    const r = g.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    const i = g._kids.findIndex(k => { if (!k.cell || !k.cell.isConnected) return false; const b = k.cell.getBoundingClientRect(); return b.width > 0 && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; });
    HV_TAP.cfg = JSON.stringify((g._config && g._config.cards) || []); HV_TAP.i = i; HV_TAP.t = Date.now(); return; } };
addEventListener('pointerdown', hvTapPick, true);
// 1.32.0: long-press (0.6 s, finger still) anywhere on a Page Grid enters arrange mode; the release that follows is swallowed so the tile's own hold / tap doesn't fire
{ let lp = null, eat = 0; const stopLp = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
  addEventListener('pointerdown', e => { stopLp(); if (e.button > 0 || !e.isPrimary) return; const x = e.clientX, y = e.clientY;
    const g = [...hvGridCards].find(g => { if (!g.isConnected || g._edit || g._arr || (g._config && g._config.arrange === false)) return false; const b = g.getBoundingClientRect(); return b.width > 0 && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; });
    const hb = g ? null : [...HV_HUBS].find(h => { if (hvHubArr.hub || !h.isConnected || h._sheetO || !h._w || (h._config && h._config.arrange === false)) return false; const b = h.getBoundingClientRect(); return b.width > 0 && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; });
    if ((!g && !hb) || hvEcl.drag || hvHubArr.drag || e.composedPath().some(n => n && n.id === 'hv-edit-layer')) return;
    lp = { x, y, t: setTimeout(() => { lp = null; if (g) { if (!hvEclOK(g)) return; eat = Date.now(); rel = 0; hvEcl.arrange(g, true); } else { if (!hvHubArr.ok(hb)) return; eat = Date.now(); rel = 0; hvHubArr.enter(hb); } }, 600) }; }, true);
  addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) stopLp(); }, true);
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, stopLp, true);
  addEventListener('scroll', stopLp, { capture: true, passive: true });
  // eat = time arrange mode was entered; after the finger lifts, keep eating the trailing mouseup / click for 0.6 s
  let rel = 0; const eatOn = () => eat && (!rel || Date.now() - rel < 600);
  for (const t of ['pointerup', 'touchend', 'mouseup', 'click', 'contextmenu']) addEventListener(t, e => { if (!eatOn()) { eat = rel = 0; return; } e.stopImmediatePropagation(); if (e.cancelable) e.preventDefault();
    if ((t === 'touchend' || t === 'pointerup') && !rel) { rel = Date.now(); setTimeout(() => { eat = rel = 0; }, 650); } }, true); }
/* 1.32.0: per-tile controls in the dashboard's edit mode (room / device pages, the Page Grid). Home Assistant puts an overlay over every card while
   editing, so these controls live in a layer above the page (positioned over each tile) and follow it while it scrolls or pages. Every tile:
   tap = its menu, hold = lift and drag (drop marker, auto page flip at the edges), sideways slide = swipe pages, corner handle = resize; a "⋯" menu like HA's own card menu:
   Edit (that tile's own editor), Move earlier / later, Duplicate, Delete (asks first). Changes are written to the saved dashboard exactly like
   the visual editor does. Admins in storage (UI) mode only. */
const hvEclOK = g => { const h = g._hass, root = hvFindRoot(g), lv = root && root.lovelace; return !!(h && h.user && h.user.is_admin === true && lv && lv.config && lv.mode !== 'yaml'); };
function hvGridAt(cfg, grid) { const sig = grid._arrSig || JSON.stringify((grid._config && grid._config.cards) || []), out = [];
  const walk = (o, v, d) => { if (!o || typeof o !== 'object' || d > 14) return; if (Array.isArray(o)) { o.forEach(x => walk(x, v, d + 1)); return; }
    if (o.type === 'custom:homeview-grid-card' && JSON.stringify(o.cards || []) === sig) out.push({ node: o, v });
    for (const k of ['sections', 'cards', 'card', 'elements']) if (o[k]) walk(o[k], v, d + 1); };
  (cfg.views || []).forEach((vw, v) => walk(vw, v, 0)); return out; }
// re-read the saved dashboard, let fn(cards) return this Page Grid's new tile list, save it (like the visual editor does)
/* 1.32.0: a "quiet" save. HA rebuilds every section and card of the view whenever its config object changes (all tiles,
   chips and style helpers are re-created: a blank flash + re-styling). When the Page Grid already shows the new tiles and
   nothing else changed on the server, the view's one-shot rebuild is skipped: the config is saved and HA's lovelace state
   updated (undo, editors and later saves stay correct), the DOM on screen is kept. */
function hvHuiView(el) { let n = el; for (let i = 0; i < 40 && n; i++) { if (n.localName === 'hui-view') return n; n = n.parentNode || n.host; } return null; }
async function hvQuietSave(grid, lv, cfg) { const view = hvHuiView(grid); if (!view || typeof view._initializeConfig !== 'function' || Object.prototype.hasOwnProperty.call(view, '_initializeConfig')) return lv.saveConfig(cfg);
  view._initializeConfig = () => Promise.resolve(); const root = hvFindRoot(grid);
  try { await lv.saveConfig(cfg); } finally { try { await (root && root.updateComplete); await view.updateComplete; } catch (e) {} await new Promise(r => setTimeout(r, 0)); delete view._initializeConfig; } }
async function hvGridMutate(grid, fn, quiet) { const root = hvFindRoot(grid), lv = root && root.lovelace;
  if (!lv) throw new Error('open this from the dashboard to save'); if (lv.mode === 'yaml') throw new Error('this dashboard is in YAML mode: edit it in the YAML');
  const dash = lv.urlPath || ssDash(), q = { type: 'lovelace/config', force: true }; if (dash) q.url_path = dash;
  const fresh = JSON.parse(JSON.stringify(await grid._hass.callWS(q))), hits = hvGridAt(fresh, grid), hit = hits.find(x => x.v === root._curView) || hits[0];
  if (!hit) throw new Error('this page changed since it loaded: reload the page and try again');
  const same = quiet && JSON.stringify(fresh) === JSON.stringify(lv.rawConfig || lv.config); hit.node.cards = fn((hit.node.cards || []).slice());
  if (typeof lv.saveConfig === 'function' && (lv.urlPath || null) === (dash || null)) { if (same) await hvQuietSave(grid, lv, fresh); else await lv.saveConfig(fresh); }
  else { const sv = { type: 'lovelace/config/save', config: fresh }; if (dash) sv.url_path = dash; await grid._hass.callWS(sv); } }
/* 1.32.0: HA's card edit-mode wrapper (hui-card-edit-mode) greys the whole card and puts a pencil in the middle when it's touched. Over a
   Page Grid / the Home Screen that hides the tiles and their own controls, so for these two cards only: no grey box, no centre pencil, and
   HA's ⋮ card menu (Edit / Duplicate / Copy / Cut / Delete) stays visible as a small glass button in the bottom-right corner. */
const HV_EDW_CSS = `.card-overlay{opacity:1!important;pointer-events:none!important;background:none!important}.card-overlay .control{display:none!important}
.card-overlay .more{pointer-events:auto}
.more ha-icon-button{top:auto!important;bottom:-2px!important;right:auto!important;inset-inline-end:4px!important;inset-inline-start:auto!important;color:#fff;--ha-icon-button-size:32px;
 background:rgba(28,30,42,.34)!important;background-image:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.07))!important;border:1px solid rgba(255,255,255,.32);box-sizing:border-box;
 box-shadow:0 6px 18px rgba(0,0,20,.28),inset 0 1px 0 rgba(255,255,255,.25);backdrop-filter:blur(22px) saturate(170%);-webkit-backdrop-filter:blur(22px) saturate(170%)}
:host([hv-day]) .more ha-icon-button{color:#1c1c1e;background:rgba(255,255,255,.5)!important;background-image:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.3))!important;border-color:rgba(255,255,255,.85);box-shadow:0 6px 16px rgba(30,30,60,.16),inset 0 1px 0 rgba(255,255,255,.9)}`;
let hvEdwSheet = null;
function hvEditChrome(card) { if (!card || !card.isConnected) return false; let n = card, w = null;
  for (let d = 0; n && d < 8; d++) { if (n.tagName === 'HUI-CARD-EDIT-MODE') { w = n; break; } if (n.tagName === 'HUI-SECTION' || n.tagName === 'HUI-VIEW') break; n = n.parentNode || n.host; }
  if (!w || !w.shadowRoot) return false; const day = card.hasAttribute('hv-day'); if (w.hasAttribute('hv-day') !== day) w.toggleAttribute('hv-day', day);
  try { if (!hvEdwSheet) { hvEdwSheet = new CSSStyleSheet(); hvEdwSheet.replaceSync(HV_EDW_CSS); } const sr = w.shadowRoot; if (!sr.adoptedStyleSheets.includes(hvEdwSheet)) sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, hvEdwSheet]; } catch (e) { return false; }
  return true; }
const hvEditChromeSoon = card => [0, 300, 1200, 3000].forEach(t => setTimeout(() => { if (card._edit) hvEditChrome(card); }, t));
const HV_ECL_CSS = `:host{all:initial;--gtx:#fff;--gbg:rgba(28,30,42,.34);--gbi:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.07));--gbd:rgba(255,255,255,.32);--gsh:0 8px 26px rgba(0,0,20,.3),inset 0 1px 0 rgba(255,255,255,.25);--gbl:blur(22px) saturate(170%);--acc:#0a84ff}
:host([day]){--gtx:#1c1c1e;--gbg:rgba(255,255,255,.5);--gbi:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.3));--gbd:rgba(255,255,255,.85);--gsh:0 8px 24px rgba(30,30,60,.16),inset 0 1px 0 rgba(255,255,255,.9)}
.lay{position:fixed;inset:0;pointer-events:none;z-index:6;font-family:var(--paper-font-body1_-_font-family,-apple-system,BlinkMacSystemFont,Roboto,sans-serif);-webkit-tap-highlight-color:transparent}
.gl,.b i,.rz i,.menu,.abar,.szl,.hint,.ghost{background-color:var(--gbg);background-image:var(--gbi);border:1px solid var(--gbd);box-shadow:var(--gsh);color:var(--gtx);backdrop-filter:var(--gbl);-webkit-backdrop-filter:var(--gbl);box-sizing:border-box}
.c{position:fixed;left:0;top:0;pointer-events:none;display:block}
.b{position:absolute;top:0;width:var(--bs,40px);height:var(--bs,40px);display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-sizing:border-box;border:0;padding:0;background:none;color:inherit}
.cv{position:absolute;inset:0;border-radius:var(--rr,22px);pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:pointer;outline:1.5px dashed rgba(255,255,255,.5);outline-offset:-1px;background:rgba(255,255,255,.035)}
:host([day]) .cv{outline-color:rgba(60,60,67,.35)}
.c.arr .cv{cursor:grab;animation:jig .5s ease-in-out infinite alternate} @keyframes jig{from{transform:rotate(-.6deg)}to{transform:rotate(.6deg)}}
.c.off .cv{animation:none;opacity:0}
.abar{position:fixed;z-index:2;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:flex;align-items:center;gap:8px;padding:6px 6px 6px 16px;border-radius:999px;pointer-events:auto;font-size:13px;white-space:nowrap;max-width:calc(100vw - 16px)}
.abar span{overflow:hidden;text-overflow:ellipsis;opacity:.8} .abar button{all:unset;box-sizing:border-box;min-height:40px;padding:0 18px;border-radius:999px;font-size:15px;font-weight:600;cursor:pointer;touch-action:manipulation}
.abar .ok{background:color-mix(in srgb,var(--acc) 82%,transparent);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)} .abar .no{background:rgba(127,127,127,.16)}
.b.m{right:0;touch-action:manipulation} .c.app .b.m{top:-12px;right:-12px}
.b i{display:flex;align-items:center;justify-content:center;width:var(--bi,30px);height:var(--bi,30px);border-radius:50%;transition:transform .12s}
.b:active i{transform:scale(.9)} .b ha-icon{--mdc-icon-size:20px;display:flex}
.rz{position:absolute;right:0;bottom:0;width:var(--bs,40px);height:var(--bs,40px);pointer-events:auto;touch-action:none;cursor:nwse-resize;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.rz i{position:relative;display:block;width:var(--bi,30px);height:var(--bi,30px);border-radius:50%;transition:transform .12s}
.rz i::before{content:'';position:absolute;right:28%;bottom:28%;width:38%;height:38%;border-right:3px solid currentColor;border-bottom:3px solid currentColor;border-bottom-right-radius:70%;opacity:.95}
.rz:active i{transform:scale(1.12)} .c.nr .rz{display:none}
.tgt{position:fixed;pointer-events:none;border-radius:var(--rr,22px);border:1.5px dashed rgba(255,255,255,.42);box-sizing:border-box;transition:left .18s,top .18s;display:flex;align-items:flex-end;justify-content:flex-end;padding:6px 10px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6)}
.tgt.on{border:2px solid rgba(255,255,255,.85);background:rgba(255,255,255,.07);color:#fff}
:host([day]) .tgt{border-color:rgba(60,60,67,.3);color:rgba(60,60,67,.55)} :host([day]) .tgt.on{border-color:rgba(60,60,67,.7);color:#1c1c1e}
.live{position:fixed;pointer-events:none;border-radius:var(--rr,22px);box-shadow:0 0 0 2.5px var(--acc),0 12px 30px rgba(0,0,20,.35);transition:left .2s,top .2s,width .2s,height .2s}
.live.pulse{animation:pulse .28s ease-out} @keyframes pulse{0%{transform:scale(1)}40%{transform:scale(1.025)}100%{transform:scale(1)}}
.szl{position:fixed;pointer-events:none;padding:7px 14px;border-radius:999px;font-size:14px;font-weight:700;white-space:nowrap;z-index:3}
.dim{position:fixed;pointer-events:none;border-radius:var(--rr,22px);background:rgba(127,127,127,.22);outline:1.5px dashed rgba(255,255,255,.55);outline-offset:-2px}
.drop{position:fixed;pointer-events:none;border-radius:var(--rr,22px);border:2.5px solid rgba(255,255,255,.9);background:rgba(255,255,255,.12);box-sizing:border-box;transition:left .08s,top .08s,width .08s,height .08s}
.ghost{position:fixed;pointer-events:none;border-radius:var(--rr,22px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:8px;overflow:hidden;font-size:13px;font-weight:600;transform-origin:center;box-shadow:0 18px 40px rgba(0,0,20,.45),inset 0 1px 0 rgba(255,255,255,.3)}
.ghost ha-icon,.ghost ha-state-icon{--mdc-icon-size:30px;display:flex} .ghost span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hint{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 18px);padding:9px 16px;border-radius:999px;font-size:13px;font-weight:600;pointer-events:none;z-index:3}
.scrim{position:fixed;inset:0;pointer-events:auto;z-index:3}
.menu{position:fixed;z-index:4;pointer-events:auto;min-width:212px;max-width:calc(100vw - 16px);padding:6px 0;border-radius:18px;overflow:hidden;animation:pop .12s ease-out;transform-origin:top right;--gbg:rgba(28,30,42,.5)}
:host([day]) .menu{--gbg:rgba(255,255,255,.72)}
@keyframes pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.menu .t{padding:8px 16px 6px;font-size:12px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.menu button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:14px;width:100%;min-height:46px;padding:0 18px;font-size:15px;cursor:pointer;color:inherit}
.menu button:hover,.menu button:focus-visible{background:rgba(255,255,255,.14)} :host([day]) .menu button:hover,:host([day]) .menu button:focus-visible{background:rgba(60,60,67,.1)} .menu button[disabled]{opacity:.38;cursor:default;pointer-events:none}
.menu button ha-icon{--mdc-icon-size:22px;opacity:.85;display:flex} .menu button.del{color:#ff6961} :host([day]) .menu button.del{color:#d70015} .menu button.del ha-icon{opacity:1}
.menu .sep{height:1px;margin:4px 0;background:rgba(127,127,127,.32)} .menu .q{padding:10px 18px 4px;font-size:15px;line-height:1.35}
.menu .row{display:flex}.menu .row button{justify-content:center;gap:6px;font-weight:600}`;
const HV_RZ = { '2x3': [1, 1], '2x6': [2, 1], '4x6': [2, 2], '4x3': [1, 2] }, HV_RZ_N = { '2x3': 'One tile', '2x6': 'Two wide', '4x6': 'Large', '4x3': 'Tall' };
const hvEcl = { host: null, sr: null, lay: null, ctl: new WeakMap(), timer: null, drag: null, menu: null, busy: false,
  label(g, i) { const c = g._kids[i] && g._kids[i].cfg, st = c && c.entity && g._hass && g._hass.states[c.entity]; if (!c) return 'Tile';
    return c.name || c.title || (st && st.attributes.friendly_name) || c.entity || hvTileTypeName(c.type); },
  icon(g, i) { const c = g._kids[i] && g._kids[i].cfg; return (c && c.icon) || HV_TILE_ICON[c && c.type] || 'mdi:card-outline'; },
  ensure() { if (this.host && this.host.isConnected) return;
    const h = this.host = document.createElement('div'); h.id = 'hv-edit-layer'; const sr = this.sr = h.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>${HV_ECL_CSS}</style><div class="lay"></div>`; this.lay = sr.querySelector('.lay'); document.body.appendChild(h);
    const stop = e => { if (this.drag) e.preventDefault(); }; // finger drags move the tile, never the page
    document.addEventListener('touchmove', stop, { passive: false, capture: true }); this._stop = stop;
    addEventListener('scroll', () => this.kick(), { capture: true, passive: true }); addEventListener('resize', () => this.kick());
    addEventListener('keydown', e => { if (e.key === 'Escape' && this.rs) this.endResize(); if (e.key === 'Escape' && (this.menu || this.drag)) { if (this.drag) this.endDrag(false); this.closeMenu(); } }, true); },
  kick() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.tick(); }); },
  start() { if (this.timer) return; this.timer = setInterval(() => this.tick(), 150); this.kick(); },
  tick() { for (const g of hvGridCards) if (g._arr && !g.isConnected) this.arrange(g, false, true);
    const gs = [...hvGridCards].filter(g => g.isConnected && (g._edit || g._arr) && g._kids && hvEclOK(g)); 
    if (!gs.length && hvHubArr.hub) { clearInterval(this.timer); this.timer = null; return; }
    if (!gs.length) { clearInterval(this.timer); this.timer = null; this.closeMenu(); if (this.drag) this.endDrag(false); if (this.host) { this.host.remove(); this.host = null; this.ctl = new WeakMap(); } return; }
    this.ensure(); this.bar(gs.find(g => g._arr && !g._edit)); { const day = gs.some(g => g.hasAttribute('hv-day')); if (this.host.hasAttribute('day') !== day) this.host.toggleAttribute('day', day); } const vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight, live = new Set();
    for (const g of gs) { if (g._edit) hvEditChrome(g); const root = hvFindRoot(g), hd = root && root.shadowRoot && root.shadowRoot.querySelector('.header'), top = hd ? hd.getBoundingClientRect().bottom : 0, gr = g.getBoundingClientRect();
      const L = Math.max(0, gr.left) - 2, R = Math.min(vw, gr.right) + 2;
      const rr = getComputedStyle(g).getPropertyValue('--hv-radius').trim();
      g._kids.forEach((k, i) => { if (!k.cell || !k.cell.isConnected || k.brk) return; const r = k.cell.getBoundingClientRect(), el = k.el; let c = this.ctl.get(el);
        if (!c) { c = document.createElement('div'); c.className = 'c'; c.innerHTML = `<div class="cv"></div><button class="b m" aria-label="Tile options" aria-haspopup="menu" title="Edit, move, resize, duplicate, delete"><i><ha-icon icon="mdi:dots-horizontal"></ha-icon></i></button><div class="rz" role="button" aria-label="Resize (drag the corner)" title="Drag to resize"><i></i></div>`;
          const kk = () => g._kids.find(x => x.el === el);
          c.querySelector('.cv').addEventListener('pointerdown', e => { const k2 = kk(); if (k2) this.press(g, k2, e); });
          c.querySelector('.rz').addEventListener('pointerdown', e => { const k2 = kk(); if (k2) this.resize(g, k2, e); });
          c.querySelector('.m').addEventListener('click', e => { e.stopPropagation(); const k2 = kk(); if (k2) this.openMenu(g, k2, c.querySelector('.m')); });
          c.querySelector('.m').addEventListener('keydown', e => e.stopPropagation()); this.lay.appendChild(c); this.ctl.set(el, c); }
        live.add(c); const bs = Math.max(36, Math.min(44, Math.round(r.width * 0.34))), bi = Math.max(28, bs - 10), pad = 2;
        // 1.32.0: tiles on the next / previous page show their controls too while a swipe brings them in (clipped to the grid)
        const vis = r.width > 0 && r.right > L + 24 && r.left < R - 24 && r.bottom > top + 24 && r.top < vh - 12;
        c.style.display = vis ? '' : 'none'; if (!vis) return; c.style.setProperty('--bs', bs + 'px'); c.style.setProperty('--bi', bi + 'px'); if (rr) c.style.setProperty('--rr', rr);
        const cl = Math.max(0, L - r.left), cr = Math.max(0, r.right - R), ct = Math.max(0, top - r.top); c.style.clipPath = cl || cr || ct ? `inset(${Math.round(ct)}px ${Math.round(cr)}px 0 ${Math.round(cl)}px)` : '';
        c.style.width = (r.width - pad * 2) + 'px'; c.style.height = (r.height - pad * 2) + 'px'; c.style.setProperty('--th', (r.height - pad * 2) + 'px'); c.classList.toggle('arr', !!(g._arr && !g._edit));
        c.classList.toggle('nr', !this.sizes(g, k).length); c.classList.toggle('off', !!(this.rs && this.rs.el === el)); c.style.transform = `translate(${Math.round(r.left + pad)}px,${Math.round(r.top + pad)}px)`; }); }
    for (const c of [...this.lay.querySelectorAll(':scope > .c:not(.hc)')]) if (!live.has(c)) c.remove(); },
  // ---- 1.32.0: touch a tile: tap = its menu, hold = pick it up (drag to move), slide sideways = swipe the grid's pages, slide up / down = scroll ----
  press(g, k, e) { if ((e.button != null && e.button > 0) || this.drag || this.rs) return; e.preventDefault(); e.stopPropagation(); this.closeMenu();
    const cv = e.currentTarget, sc = g._sc, w = (sc && sc.clientWidth) || 1, el = k.el;
    const p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, mode: '', sl: sc ? sc.scrollLeft : 0, sy: window.scrollY || 0, pg: sc ? Math.round(sc.scrollLeft / w) : 0 };
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    const off = () => { clearTimeout(p.t); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
    const mv = ev => { if (ev.pointerId !== p.id) return; p.x = ev.clientX; p.y = ev.clientY; const dx = p.x - p.x0, dy = p.y - p.y0;
      if (!p.mode && Math.hypot(dx, dy) > 8) { clearTimeout(p.t); p.mode = Math.abs(dx) > Math.abs(dy) && (g._nPages || 1) > 1 && sc ? 'swipe' : 'scroll'; if (p.mode === 'swipe') { g._mSw = true; sc.style.scrollSnapType = 'none'; } }
      if (p.mode === 'swipe') sc.scrollLeft = Math.max(0, Math.min(sc.scrollWidth - w, p.sl - dx)); else if (p.mode === 'scroll') window.scrollTo(window.scrollX || 0, p.sy - dy); };
    const up = ev => { if (ev.pointerId !== p.id) return; off(); try { cv.releasePointerCapture(p.id); } catch (x) {}
      if (p.mode === 'swipe') { const d = sc.scrollLeft - p.pg * w; let t = Math.abs(d) > w * 0.18 ? p.pg + Math.sign(d) : p.pg; t = Math.max(0, Math.min((g._nPages || 1) - 1, t));
        sc.scrollTo({ left: t * w, behavior: 'smooth' }); setTimeout(() => { sc.style.scrollSnapType = ''; g._mSw = false; if (Math.abs(sc.scrollLeft - t * w) > 1) sc.scrollLeft = t * w; this.kick(); }, 480); }
      else if (!p.mode && ev.type === 'pointerup') { const k2 = g._kids.find(x => x.el === el), c = this.ctl.get(el); if (k2 && c) this.openMenu(g, k2, c.querySelector('.m')); } };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    p.t = setTimeout(() => { if (p.mode) return; p.mode = 'drag'; off(); const k2 = g._kids.find(x => x.el === el); if (!k2) return;
      this.startDrag(g, k2, { button: 0, pointerId: p.id, clientX: p.x0, clientY: p.y0, currentTarget: cv, preventDefault() {}, stopPropagation() {} }, true);
      if (this.drag && (p.x !== p.x0 || p.y !== p.y0)) this.moveDrag({ clientX: p.x, clientY: p.y, preventDefault() {} }); }, 260); },
  // ---- 1.32.0: the corner handle: drag to resize; snaps only to the four tile sizes (and only the ones that card offers) ----
  sizes(g, k) { const c = (k && k.cfg) || {}; if (!c.type || c.type === 'custom:homeview-page-break' || !g._sc) return [];
    const cls = customElements.get(String(c.type).replace(/^custom:/, '')), o = cls && cls.sizeOptions; let ks = Object.keys(HV_RZ);
    if (Array.isArray(o)) ks = ks.filter(x => o.some(y => y && y.value === x));
    const C = Number(g._sc.style.getPropertyValue('--c')) || 3, R = Number(g._sc.style.getPropertyValue('--r')) || 3; ks = ks.filter(x => HV_RZ[x][0] <= C && HV_RZ[x][1] <= R); return ks.length > 1 ? ks : []; },
  keyOf(g, cfg) { const C = Number(g._sc.style.getPropertyValue('--c')) || 3, R = Number(g._sc.style.getPropertyValue('--r')) || 3, [cs, rs] = gridSpan(cfg || {}, C, R);
    return Object.keys(HV_RZ).find(x => HV_RZ[x][0] === cs && HV_RZ[x][1] === rs) || '2x3'; },
  resize(g, k, e) { if ((e.button != null && e.button > 0) || this.drag || this.rs) return; const ks = this.sizes(g, k); if (!ks.length) return; e.preventDefault(); e.stopPropagation(); this.closeMenu();
    const st = g._sc.style, cw = parseFloat(st.getPropertyValue('--cw')) || 100, ch = parseFloat(st.getPropertyValue('--ch')) || 100, gap = parseFloat(st.getPropertyValue('--g')) || 0, el = k.el, h0 = e.currentTarget;
    const r0 = k.cell.getBoundingClientRect(), cur = this.keyOf(g, k.cfg), rr = getComputedStyle(g).getPropertyValue('--hv-radius').trim();
    const d = this.rs = { g, el, ks, cw, ch, gap, cur, first: cur, id: e.pointerId, o0: r0, zones: [], x: e.clientX, y: e.clientY };
    try { h0.setPointerCapture(e.pointerId); } catch (x) {}
    const mk = cls => { const n = document.createElement('div'); n.className = cls; if (rr) n.style.setProperty('--rr', rr); this.lay.appendChild(n); return n; };
    for (const key of ks) { const z = mk('tgt'); z.dataset.k = key; z.textContent = key.replace('x', ' × '); d.zones.push(z); }
    d.live = mk('live'); d.lbl = mk('szl');
    const paint = () => { const kk = g._kids.find(x => x.el === el); if (!kk || !kk.cell || !kk.cell.isConnected) return; const r = kk.cell.getBoundingClientRect(); if (!r.width) return;
      for (const z of d.zones) { const [cs, rs] = HV_RZ[z.dataset.k]; this.pos(z, { left: r.left, top: r.top, width: cs * cw + (cs - 1) * gap, height: rs * ch + (rs - 1) * gap }); z.classList.toggle('on', z.dataset.k === d.cur); }
      this.pos(d.live, r); d.lbl.textContent = `${d.cur.replace('x', ' × ')} · ${HV_RZ_N[d.cur]}`;
      const lw = d.lbl.offsetWidth || 120, vw = document.documentElement.clientWidth || innerWidth; d.lbl.style.left = Math.max(8, Math.min(vw - lw - 8, d.x - lw / 2)) + 'px'; d.lbl.style.top = Math.max(8, d.y - 64) + 'px'; };
    d.paint = paint; paint(); d.iv = setInterval(paint, 60); if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) {}
    d.mv = ev => { if (ev.pointerId !== d.id) return; ev.preventDefault(); d.x = ev.clientX; d.y = ev.clientY;
      // size from where the finger is, measured from the tile's top-left when the drag started: past the middle of the next cell = that cell joins
      const fx = d.x - d.o0.left, fy = d.y - d.o0.top, cs = fx > cw * 1.5 + gap ? 2 : 1, rs = fy > ch * 1.5 + gap ? 2 : 1;
      let key = Object.keys(HV_RZ).find(x => HV_RZ[x][0] === cs && HV_RZ[x][1] === rs);
      if (!ks.includes(key)) key = ks.slice().sort((a, b) => { const da = Math.abs(HV_RZ[a][0] - cs) + Math.abs(HV_RZ[a][1] - rs), db = Math.abs(HV_RZ[b][0] - cs) + Math.abs(HV_RZ[b][1] - rs); return da - db || (b === d.cur) - (a === d.cur); })[0];
      if (key !== d.cur) { d.cur = key; this.setSize(g, el, key); d.live.classList.remove('pulse'); void d.live.offsetWidth; d.live.classList.add('pulse'); if (navigator.vibrate) try { navigator.vibrate(8); } catch (x) {} }
      paint(); };
    d.up = ev => { if (ev.pointerId !== d.id) return; this.endResize(); };
    addEventListener('pointermove', d.mv, true); addEventListener('pointerup', d.up, true); addEventListener('pointercancel', d.up, true); d.h0 = h0; this.kick(); },
  endResize() { const d = this.rs; if (!d) return; this.rs = null; clearInterval(d.iv); removeEventListener('pointermove', d.mv, true); removeEventListener('pointerup', d.up, true); removeEventListener('pointercancel', d.up, true);
    try { d.h0.releasePointerCapture(d.id); } catch (x) {} [...d.zones, d.live, d.lbl].forEach(n => n && n.remove()); this.kick();
    if (d.cur !== d.first && d.g._edit) hvToast(`Tile resized to ${d.cur.replace('x', ' × ')} · saved when you tap Done`, 'hv-arrange'); },
  setSize(g, el, key) { const i = g._kids.findIndex(x => x.el === el); if (i < 0) return; const [cs, rs] = HV_RZ[key];
    this.apply(g, cards => { const c = cards[i]; if (!c) return cards; c.grid_options = Object.assign({}, c.grid_options || {}, { columns: cs * 3, rows: rs * 2 }); // same keys as the Size dropdown
      if (c.type === 'custom:homeview-camera-card') { if (key === '2x3') delete c.size; else c.size = key; } return cards; }, null, true, true); },
  // ---- drag ----
  startDrag(g, k, e, cv) { if (e.button != null && e.button > 0 || this.drag) return; e.preventDefault(); e.stopPropagation(); this.closeMenu();
    const i = g._kids.indexOf(k), r = k.cell.getBoundingClientRect(), btn = e.currentTarget;
    const d = this.drag = { g, k, i, id: e.pointerId, x0: e.clientX, y0: e.clientY, r, over: -1, btn, edge: 0, edgeT: 0, cv, t0: Date.now() };
    try { btn.setPointerCapture(e.pointerId); } catch (x) {}
    const dim = document.createElement('div'); dim.className = 'dim'; this.pos(dim, r); const drop = document.createElement('div'); drop.className = 'drop'; drop.style.display = 'none';
    const gh = document.createElement('div'); gh.className = 'ghost'; gh.innerHTML = '<ha-icon></ha-icon><span></span>'; { const c = g._kids[i].cfg, st = c && c.entity && g._hass.states[c.entity], ic0 = gh.querySelector('ha-icon');
      if (st && customElements.get('ha-state-icon')) { const ic = document.createElement('ha-state-icon'); ic.hass = g._hass; ic.stateObj = st; if (c.icon) ic.icon = c.icon; ic0.replaceWith(ic); } else ic0.setAttribute('icon', this.icon(g, i)); } gh.querySelector('span').textContent = this.label(g, i);
    this.pos(gh, r); gh.style.transform = 'scale(1.06)'; gh.style.opacity = '.96'; this.lay.append(dim, drop, gh); d.dim = dim; d.drop = drop; d.gh = gh;
    d.mv = ev => { if (ev.pointerId === d.id) this.moveDrag(ev); }; d.up = ev => { if (ev.pointerId === d.id) this.endDrag(ev.type === 'pointerup'); };
    btn.addEventListener('pointermove', d.mv); btn.addEventListener('pointerup', d.up); btn.addEventListener('pointercancel', d.up);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
    d.iv = setInterval(() => this.hit(d), 120);
    const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'Drop on another tile to move it there'; this.lay.appendChild(hint); d.hint = hint; },
  pos(el, r) { el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; },
  moveDrag(e) { const d = this.drag; if (!d) return; e.preventDefault(); d.x = e.clientX; d.y = e.clientY; if (Math.hypot(d.x - d.x0, d.y - d.y0) > 8) d.moved = true; d.gh.style.transform = `translate(${d.x - d.x0}px,${d.y - d.y0}px) scale(1.06)`; this.hit(d); },
  hit(d) { const x = d.x, y = d.y; if (x == null) return; let over = -1;
    d.g._kids.forEach((k, i) => { if (over >= 0 || i === d.i || !k.cell || !k.cell.isConnected) return; const r = k.cell.getBoundingClientRect(); if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) over = i; });
    if (over !== d.over) { d.over = over; if (over >= 0) { this.pos(d.drop, d.g._kids[over].cell.getBoundingClientRect()); d.drop.style.display = ''; } else d.drop.style.display = 'none'; }
    else if (over >= 0) this.pos(d.drop, d.g._kids[over].cell.getBoundingClientRect());
    // hold near the left / right edge of the grid: flip to the previous / next page (also while the finger rests there)
    const gr = d.g.getBoundingClientRect(), sc = d.g._sc, w = sc ? sc.clientWidth : 0, edge = x < gr.left + 36 ? -1 : x > gr.right - 36 ? 1 : 0;
    if (edge !== d.edge) { d.edge = edge; d.edgeT = Date.now(); } else if (edge && Date.now() - d.edgeT > 600 && sc) { d.edgeT = Date.now(); const p = Math.max(0, Math.min((d.g._nPages || 1) - 1, Math.round(sc.scrollLeft / w) + edge)); sc.scrollTo({ left: p * w, behavior: 'smooth' }); } },
  endDrag(ok) { const d = this.drag; if (!d) return; this.drag = null; const { btn } = d; clearInterval(d.iv);
    try { btn.releasePointerCapture(d.id); } catch (x) {} btn.removeEventListener('pointermove', d.mv); btn.removeEventListener('pointerup', d.up); btn.removeEventListener('pointercancel', d.up);
    [d.dim, d.drop, d.hint].forEach(n => n && n.remove());
    if (ok && d.over >= 0 && d.over !== d.i) { d.gh.style.transition = 'all .16s ease-out'; this.pos(d.gh, d.g._kids[d.over].cell.getBoundingClientRect()); d.gh.style.transform = 'scale(1)'; d.gh.style.opacity = '.4'; setTimeout(() => d.gh.remove(), 260);
      this.apply(d.g, cards => { const t = cards.splice(d.i, 1)[0]; cards.splice(d.over, 0, t); return cards; }, 'Tile moved'); }
    else { d.gh.style.transition = 'all .16s ease-out'; this.pos(d.gh, d.r); d.gh.style.transform = 'scale(1)'; d.gh.style.opacity = '0'; setTimeout(() => d.gh.remove(), 200);
      if (ok && d.cv && !d.moved) { const c = this.ctl.get(d.k.el); if (c) this.openMenu(d.g, d.k, c.querySelector('.m')); } } }, // hold and let go without moving: its menu
  async apply(g, fn, ok, quiet, flip) { if (!g._arrSig) { g._arrSig = JSON.stringify(g._config.cards || []); g._arrOrig = JSON.parse(g._arrSig); }
    if (flip) g._flipR = new Map(g._kids.filter(k => k.el && k.cell && k.cell.isConnected).map(k => [k.el, k.cell.getBoundingClientRect()]));
    g.setConfig(Object.assign({}, g._config, { cards: fn(JSON.parse(JSON.stringify(g._config.cards || []))) })); g._arrDirty = true; this.kick(); setTimeout(() => this.kick(), 120);
    if (g._edit) { hvGridDirty.add(g); if (!quiet) hvToast((ok || 'Changed') + ' · saved when you tap Done', 'hv-arrange'); } }, // HA edit mode: kept until Done / leaving the page (one quiet save, no rebuild)
  flush(g, ok) { clearTimeout(g._svT); g._svT = null; if (!g._arrDirty) return Promise.resolve(true); if (g._svP) return g._svP.then(() => this.flush(g, ok));
    const j = JSON.stringify(g._config.cards || []), cards = JSON.parse(j);
    return g._svP = hvGridMutate(g, () => cards, true).then(() => { g._svP = null; if (JSON.stringify(g._config.cards || []) === j) { g._arrSig = null; g._arrOrig = null; g._arrDirty = false; hvGridDirty.delete(g); } else { g._arrSig = j; this.flush(g, ok); } if (ok) hvToast(ok, 'hv-arrange'); return true; },
      e => { g._svP = null; hvToast('Could not save: ' + (e && e.message || e), 'hv-arrange'); return false; }); },
  async _saveNow(g, fn, ok) { if (this.busy) return; this.busy = true;
    try { await hvGridMutate(g, fn); hvToast(ok); } catch (e) { hvToast('Could not save: ' + (e && e.message || e)); } this.busy = false; this.kick(); },
  // ---- arrange mode (1.32.0): move / edit tiles without HA's dashboard edit mode; changes are saved on Done ----
  arrange(g, on, discard) { if (on) { if (g._edit || g._arr || !hvEclOK(g)) return; [...hvGridCards].forEach(o => o !== g && o._arr && this.arrange(o, false, true));
      g._arr = true; g._arrSig = null; g._arrDirty = false; g.toggleAttribute('hv-arr', true); hvGridCards.add(g); g._arrF = true; g._arrBtn(); if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) {} this.start(); return Promise.resolve(true); }
    if (!g._arr) return Promise.resolve(true); this.closeMenu(); if (this.drag) this.endDrag(false);
    const fin = () => { g._arr = false; g._arrSig = null; g._arrOrig = null; g._arrDirty = false; g.toggleAttribute('hv-arr', false); g._arrF = true; g._arrBtn(); this.kick(); };
    if (discard || !g._arrDirty) { if (g._arrDirty && g._arrOrig) g.setConfig(Object.assign({}, g._config, { cards: g._arrOrig })); fin(); return Promise.resolve(true); }
    if (this.busy) return Promise.resolve(false); this.busy = true; const cards = JSON.parse(JSON.stringify(g._config.cards || []));
    return hvGridMutate(g, () => cards, true).then(() => { this.busy = false; fin(); hvToast('Saved', 'hv-arrange'); return true; }, e => { this.busy = false; hvToast('Could not save: ' + (e && e.message || e), 'hv-arrange'); return false; }); },
  bar(g) { let b = this.sr && this.sr.querySelector('.abar:not(.hb)'); if (!g) { if (b) b.remove(); return; } if (!b) { b = document.createElement('div'); b.className = 'abar';
      b.innerHTML = '<span>Hold to move · drag a corner to resize</span><button class="no">Cancel</button><button class="ok">Done</button>'; this.lay.appendChild(b); }
    b.querySelector('.no').onclick = e => { e.stopPropagation(); this.arrange(g, false, true); }; b.querySelector('.ok').onclick = e => { e.stopPropagation(); this.arrange(g, false); }; },
  // ---- the ⋯ menu ----
  closeMenu() { if (!this.menu) return; this.menu.remove(); this.menu = null; },
  openMenu(g, k, anchor) { this.closeMenu(); this.ensure(); const i = g._kids.indexOf(k), n = g._kids.length;
    const wrap = this.menu = document.createElement('div'); wrap.innerHTML = '<div class="scrim"></div><div class="menu" role="menu"></div>';
    const m = wrap.querySelector('.menu'), close = () => this.closeMenu(), t0 = Date.now();
    const item = (ic, txt, fn, cls, dis) => { const b = document.createElement('button'); b.setAttribute('role', 'menuitem'); if (cls) b.className = cls; if (dis) b.disabled = true;
      b.innerHTML = '<ha-icon></ha-icon><span></span>'; b.querySelector('ha-icon').setAttribute('icon', ic); b.querySelector('span').textContent = txt; b.addEventListener('click', e => { e.stopPropagation(); if (Date.now() - t0 < 400) return; fn(); }); m.appendChild(b); return b; }; // t0: ignore the click from the tap that opened the menu
    const head = document.createElement('div'); head.className = 't'; head.textContent = this.label(g, i); m.appendChild(head);
    item('mdi:pencil', 'Edit', () => { close(); this.edit(g, k, i); });
    item('mdi:arrow-left', 'Move earlier', () => { close(); this.apply(g, c => { [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; }, 'Tile moved earlier'); }, '', i <= 0);
    item('mdi:arrow-right', 'Move later', () => { close(); this.apply(g, c => { [c[i + 1], c[i]] = [c[i], c[i + 1]]; return c; }, 'Tile moved later'); }, '', i >= n - 1);
    item('mdi:content-copy', 'Duplicate', () => { close(); this.apply(g, c => { c.splice(i + 1, 0, JSON.parse(JSON.stringify(c[i]))); return c; }, 'Tile duplicated'); });
    const sep = document.createElement('div'); sep.className = 'sep'; m.appendChild(sep);
    item('mdi:delete-outline', 'Delete', () => { m.innerHTML = ''; const q = document.createElement('div'); q.className = 'q'; q.textContent = `Delete “${this.label(g, i)}”?`; m.appendChild(q);
      const row = document.createElement('div'); row.className = 'row'; m.appendChild(row);
      const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; if (cls) b.className = cls; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); row.appendChild(b); return b; };
      mk('Cancel', '', close); mk('Delete', 'del', () => { close(); this.apply(g, c => { c.splice(i, 1); return c; }, 'Tile deleted'); }); this.place(m, anchor); }, 'del');
    wrap.querySelector('.scrim').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); close(); });
    this.lay.appendChild(wrap); this.place(m, anchor); const f = m.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); },
  place(m, anchor) { const a = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight, mw = m.offsetWidth, mh = m.offsetHeight;
    let l = a.right - mw; l = Math.max(8, Math.min(vw - mw - 8, l)); let t = a.bottom + 4; if (t + mh > vh - 8) t = Math.max(8, a.top - mh - 4);
    m.style.left = l + 'px'; m.style.top = t + 'px'; m.style.transformOrigin = (a.right - l > mw / 2 ? 'top right' : 'top left'); },
  async edit(g, k, i) { if (g._arr && !g._edit) { if (!(await this.arrange(g, false))) return; } else if (g._arrDirty) { if (!(await this.flush(g))) return; }
    const root = hvFindRoot(g), lv = root && root.lovelace; if (!lv) return;
    const sig = JSON.stringify((g._config && g._config.cards) || []), hit = hvGridAt(lv.config, g), at = hit.find(x => x.v === root._curView) || hit[0];
    HV_TAP.cfg = sig; HV_TAP.i = i; HV_TAP.t = Date.now();
    const path = at && hvCardPath(lv.config, o => o === at.node, root._curView); if (path && hvOpenCardEditor(root, path)) return; hvToast('Tap the tile itself to edit it'); } };
/* 1.32.0: Home Screen arrange. Long-press the Home Screen (admins, UI-mode dashboards): the apps, the Photos tile and the extra tiles get the same
   glass controls as room pages: tap = options (⋯), hold = pick up and drag (apps among apps, tiles among tiles), corner handle = resize
   (the Home Screen row has two sizes: one tile or two wide). Everything updates in place; one quiet save on Done (no rebuild), Cancel undoes. */
const hvInDialog = el => { for (let n = el, d = 0; n && d < 40; d++) { if (n.tagName && /DIALOG|HUI-CARD-PREVIEW/.test(n.tagName)) return true; n = n.parentNode || (n.host !== undefined ? n.host : null); } return false; };
async function hvHubMutate(h, sig0, raw) { const root = hvFindRoot(h), lv = root && root.lovelace;
  if (!lv) throw new Error('open this from the dashboard to save'); if (lv.mode === 'yaml') throw new Error('this dashboard is in YAML mode: edit it in the YAML');
  const dash = lv.urlPath || ssDash(), q = { type: 'lovelace/config', force: true }; if (dash) q.url_path = dash;
  const fresh = JSON.parse(JSON.stringify(await h._hass.callWS(q))), hubs = [];
  const walk = (o, d) => { if (!o || typeof o !== 'object' || d > 14) return; if (!Array.isArray(o) && o.type === 'custom:homeview-hub-card') hubs.push(o); for (const v of Array.isArray(o) ? o : Object.values(o)) walk(v, d + 1); };
  walk(fresh.views, 0); const node = hubs.find(o => JSON.stringify(o) === sig0) || (hubs.length === 1 ? hubs[0] : null);
  if (!node) throw new Error('the Home Screen changed since it loaded: reload the page and try again');
  const same = JSON.stringify(fresh) === JSON.stringify(lv.rawConfig || lv.config);
  for (const k of Object.keys(node)) delete node[k]; Object.assign(node, JSON.parse(JSON.stringify(raw)));
  if (typeof lv.saveConfig === 'function' && (lv.urlPath || null) === (dash || null)) { if (same) await hvQuietSave(h, lv, fresh); else await lv.saveConfig(fresh); }
  else { const sv = { type: 'lovelace/config/save', config: fresh }; if (dash) sv.url_path = dash; await h._hass.callWS(sv); } }
const hvHubArr = { hub: null, orig: null, ctl: new Map(), timer: null, drag: null, rs: null, dirty: false, busy: false,
  ok(h) { return !!(h && h._w && h.isConnected && !h._sheetO && h._config && h._config.arrange !== false && !hvInDialog(h) && hvEclOK(h)); },
  raw() { return JSON.parse(JSON.stringify(this.hub._hvRaw || {})); },
  enter(h) { if (this.hub || !this.ok(h)) return; this.hub = h; this.orig = JSON.stringify(h._hvRaw || {}); this.dirty = false; hvEcl.ensure(); h.toggleAttribute('hv-arr', true);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (x) {} this.timer = setInterval(() => this.tick(), 150); this._k = () => this.tick(); addEventListener('scroll', this._k, { capture: true, passive: true }); addEventListener('resize', this._k); this.tick(); },
  exit(save) { const h = this.hub; if (!h) return Promise.resolve(true); hvEcl.closeMenu(); this.endDrag(false); this.endResize();
    const fin = () => { clearInterval(this.timer); this.timer = null; removeEventListener('scroll', this._k, true); removeEventListener('resize', this._k); for (const c of this.ctl.values()) c.remove(); this.ctl.clear(); this.bar(false);
      h.toggleAttribute('hv-arr', false); this.hub = null; this.dirty = false; hvEcl.kick(); };
    if (!save || !this.dirty) { if (this.dirty) h._arrSet(JSON.parse(this.orig)); fin(); return Promise.resolve(true); }
    if (this.busy) return Promise.resolve(false); this.busy = true; const raw = this.raw();
    return hvHubMutate(h, this.orig, raw).then(() => { this.busy = false; fin(); hvToast('Saved', 'hv-arrange'); return true; },
      e => { this.busy = false; hvToast('Could not save: ' + (e && e.message || e), 'hv-arrange'); return false; }); },
  change(fn) { const raw = this.raw(); fn(raw); this.dirty = true; this.hub._arrSet(raw); [40, 200, 450].forEach(t => setTimeout(() => this.tick(), t)); },
  bar(on) { const lay = hvEcl.lay; let b = lay && lay.querySelector('.abar.hb'); if (!on) { if (b) b.remove(); return; } if (b || !lay) return;
    b = document.createElement('div'); b.className = 'abar hb'; b.innerHTML = '<span>Hold to move · drag a corner to resize</span><button class="no">Cancel</button><button class="ok">Done</button>'; lay.appendChild(b);
    b.querySelector('.no').onclick = e => { e.stopPropagation(); this.exit(false); }; b.querySelector('.ok').onclick = e => { e.stopPropagation(); this.exit(true); }; },
  items() { const h = this.hub, w = h && h._w, out = []; if (!w) return out;
    w.querySelectorAll('.apps .app').forEach((el, i) => out.push({ kind: 'app', i, el }));
    const ph = w.querySelector('.phw .pw'); if (ph) out.push({ kind: 'photo', i: 0, el: ph });
    (h._sideEls || []).forEach((el, i) => { if (el.isConnected && !(el.parentNode && el.parentNode.hidden)) out.push({ kind: 'side', i, el }); }); return out; },
  find(el) { return this.items().find(x => x.el === el); },
  box(it) { return (it.kind === 'app' ? (it.el.querySelector('.ico') || it.el) : it.el).getBoundingClientRect(); },
  label(it) { const c = this.hub._config; if (it.kind === 'app') return (c.apps[it.i] && c.apps[it.i].name) || 'App'; if (it.kind === 'photo') return c.photo_label || 'Photos';
    const s = (c.side_cards || []).filter(x => x && x.type)[it.i] || {}, st = s.entity && this.hub._hass && this.hub._hass.states[s.entity];
    return s.name || s.title || (st && st.attributes.friendly_name) || hvTileTypeName(s.type); },
  units(it) { const c = this.hub._config; return it.kind === 'photo' ? (c.photo_size === 'square' ? 1 : 2) : it.kind === 'side' ? (hubTileSizes(c)[it.i] === 2 ? 2 : 1) : 1; },
  tick() { const h = this.hub; if (!h) return; if (!h.isConnected || h._sheetO) { this.exit(false); return; }
    hvEcl.ensure(); this.bar(true); const lay = hvEcl.lay, day = h.hasAttribute('hv-day'); if (hvEcl.host.hasAttribute('day') !== day) hvEcl.host.toggleAttribute('day', day);
    const live = new Set(), vh = innerHeight;
    for (const it of this.items()) { let c = this.ctl.get(it.el);
      if (!c) { c = document.createElement('div'); c.className = 'c arr hc'; const el = it.el;
        c.innerHTML = `<div class="cv"></div><button class="b m" aria-label="Options" aria-haspopup="menu" title="Options"><i><ha-icon icon="mdi:dots-horizontal"></ha-icon></i></button>${it.kind !== 'app' ? '<div class="rz" role="button" aria-label="Resize (drag the corner)" title="Drag to resize"><i></i></div>' : ''}`;
        c.querySelector('.cv').addEventListener('pointerdown', e => { const x = this.find(el); if (x) this.press(x, e); });
        const rz = c.querySelector('.rz'); if (rz) rz.addEventListener('pointerdown', e => { const x = this.find(el); if (x) this.resize(x, e); });
        c.querySelector('.m').addEventListener('click', e => { e.stopPropagation(); const x = this.find(el); if (x) this.menu(x, c.querySelector('.m')); });
        lay.appendChild(c); this.ctl.set(el, c); }
      live.add(c); const r = this.box(it), vis = r.width > 0 && r.bottom > 0 && r.top < vh; c.style.display = vis ? '' : 'none'; if (!vis) continue;
      const app = it.kind === 'app', bs = app ? 30 : Math.max(30, Math.min(42, Math.round(Math.min(r.width, r.height) * 0.36))), bi = app ? 24 : Math.max(24, bs - 10); c.classList.toggle('app', app); let rr = getComputedStyle(it.kind === 'app' ? (it.el.querySelector('.ico') || it.el) : it.el).borderTopLeftRadius;
      if (!rr || rr === '0px') rr = it.kind === 'app' ? Math.round(r.width * 0.23) + 'px' : '22px';
      c.style.setProperty('--bs', bs + 'px'); c.style.setProperty('--bi', bi + 'px'); c.style.setProperty('--rr', rr); c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
      c.style.transform = `translate(${Math.round(r.left)}px,${Math.round(r.top)}px)`; c.classList.toggle('off', !!(this.rs && this.rs.el === it.el) || !!(this.drag && this.drag.el === it.el)); }
    for (const [el, c] of [...this.ctl]) if (!live.has(c)) { c.remove(); this.ctl.delete(el); } },
  // tap = menu; hold = drag (the Photos tile: its menu); slide = scroll the page
  press(it, e) { if ((e.button != null && e.button > 0) || this.drag || this.rs) return; e.preventDefault(); e.stopPropagation(); hvEcl.closeMenu();
    const cv = e.currentTarget, el = it.el, p = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, mode: '', sy: window.scrollY || 0 };
    try { cv.setPointerCapture(p.id); } catch (x) {}
    const off = () => { clearTimeout(p.t); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
    const mv = ev => { if (ev.pointerId !== p.id) return; p.x = ev.clientX; p.y = ev.clientY; if (!p.mode && Math.hypot(p.x - p.x0, p.y - p.y0) > 8) { clearTimeout(p.t); p.mode = 'scroll'; }
      if (p.mode === 'scroll') window.scrollTo(window.scrollX || 0, p.sy - (p.y - p.y0)); };
    const up = ev => { if (ev.pointerId !== p.id) return; off(); try { cv.releasePointerCapture(p.id); } catch (x) {}
      if (!p.mode && ev.type === 'pointerup') { const x = this.find(el), c = this.ctl.get(el); if (x && c) this.menu(x, c.querySelector('.m')); } };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    p.t = setTimeout(() => { if (p.mode) return; p.mode = 'drag'; off(); const x = this.find(el); if (!x) return;
      if (x.kind === 'photo' || this.items().filter(y => y.kind === x.kind).length < 2) { try { cv.releasePointerCapture(p.id); } catch (z) {} const c = this.ctl.get(el); if (c) this.menu(x, c.querySelector('.m')); return; }
      this.startDrag(x, cv, p); }, 260); },
  startDrag(it, cv, p) { const r = this.box(it), lay = hvEcl.lay, rr = this.ctl.get(it.el) && this.ctl.get(it.el).style.getPropertyValue('--rr');
    const d = this.drag = { it, el: it.el, kind: it.kind, i: it.i, id: p.id, x0: p.x0, y0: p.y0, x: p.x, y: p.y, cv, over: -1 };
    const mk = cls => { const n = document.createElement('div'); n.className = cls; if (rr) n.style.setProperty('--rr', rr); lay.appendChild(n); return n; };
    d.dim = mk('dim'); hvEcl.pos(d.dim, r); d.drop = mk('drop'); d.drop.style.display = 'none'; d.gh = mk('ghost'); d.gh.innerHTML = '<ha-icon></ha-icon><span></span>';
    const a = it.kind === 'app' && this.hub._config.apps[it.i]; d.gh.querySelector('ha-icon').setAttribute('icon', a ? (a.icon === 'hv:home' ? 'mdi:home' : a.icon || 'mdi:apps') : 'mdi:card-outline');
    d.gh.querySelector('span').textContent = this.label(it); hvEcl.pos(d.gh, r); d.gh.style.transform = 'scale(1.06)'; d.r = r;
    d.mv = ev => { if (ev.pointerId !== d.id) return; ev.preventDefault(); d.x = ev.clientX; d.y = ev.clientY; this.moveDrag(); };
    d.up = ev => { if (ev.pointerId !== d.id) return; this.endDrag(ev.type === 'pointerup'); };
    try { cv.setPointerCapture(p.id); } catch (x) {} cv.addEventListener('pointermove', d.mv); cv.addEventListener('pointerup', d.up); cv.addEventListener('pointercancel', d.up);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {} this.moveDrag(); this.tick(); },
  moveDrag() { const d = this.drag; if (!d) return; d.gh.style.transform = `translate(${d.x - d.x0}px,${d.y - d.y0}px) scale(1.06)`; let over = -1, orect = null;
    for (const it of this.items()) { if (it.kind !== d.kind || it.el === d.el) continue; const b = this.box(it); if (d.x >= b.left && d.x <= b.right && d.y >= b.top && d.y <= b.bottom) { over = it.i; orect = b; break; } }
    d.over = over; if (orect) { hvEcl.pos(d.drop, orect); d.drop.style.display = ''; } else d.drop.style.display = 'none'; },
  endDrag(ok) { const d = this.drag; if (!d) return; this.drag = null; try { d.cv.releasePointerCapture(d.id); } catch (x) {}
    d.cv.removeEventListener('pointermove', d.mv); d.cv.removeEventListener('pointerup', d.up); d.cv.removeEventListener('pointercancel', d.up); [d.dim, d.drop].forEach(n => n.remove());
    d.gh.style.transition = 'all .16s ease-out'; d.gh.style.opacity = '0'; d.gh.style.transform = 'scale(1)'; setTimeout(() => d.gh.remove(), 200);
    if (ok && d.over >= 0 && d.over !== d.i) this.move(d.kind, d.i, d.over); this.tick(); },
  sideRows(raw) { const cards = (raw.side_cards || []).filter(x => x && x.type), sz = String(raw.side_sizes || '').trim() ? hubSizes(raw.side_sizes) : null;
    return cards.map((card, i) => ({ card, tile: Array.isArray(raw.side_tiles) ? raw.side_tiles[i] || null : null, sz: sz ? sz[i] || 1 : null })); },
  sideWrite(raw, rows) { const had = Array.isArray(raw.side_tiles); raw.side_cards = rows.map(r => r.card);
    if (had || rows.some(r => r.tile)) raw.side_tiles = rows.map(r => r.tile || {}); if (String(raw.side_sizes || '').trim()) raw.side_sizes = rows.map(r => (r.sz === 2 ? 'W' : 'S')).join(', '); },
  edit(raw, kind, fn) { if (kind === 'app') { if (!Array.isArray(raw.apps) || !raw.apps.length) raw.apps = HUB_APPS.map(a => Object.assign({}, a)); fn(raw.apps); }
    else { const rows = this.sideRows(raw); fn(rows); this.sideWrite(raw, rows); } },
  move(kind, i, j) { this.change(raw => this.edit(raw, kind, a => { const t = a.splice(i, 1)[0]; a.splice(j, 0, t); })); },
  setUnits(it, u) { if (this.units(it) === u) return; this.change(raw => { if (it.kind === 'photo') { raw.photo_size = u === 2 ? 'wide' : 'square'; return; }
    this.edit(raw, 'side', rows => { const r = rows[it.i]; if (!r) return; r.tile = Object.assign({}, r.tile || {}, { size: u === 2 ? 'wide' : 'square' }); if (r.sz != null) r.sz = u; }); }); },
  // corner handle: one tile / two wide (the Home Screen row's two sizes)
  resize(it, e) { if ((e.button != null && e.button > 0) || this.drag || this.rs) return; e.preventDefault(); e.stopPropagation(); hvEcl.closeMenu();
    const r0 = this.box(it), U = r0.height, tg = parseFloat(this.hub._w.style.getPropertyValue('--cg2')) || 16, h0 = e.currentTarget, lay = hvEcl.lay, rr = this.ctl.get(it.el) && this.ctl.get(it.el).style.getPropertyValue('--rr');
    const d = this.rs = { it, el: it.el, u: this.units(it), first: this.units(it), id: e.pointerId, o0: r0, U, tg, x: e.clientX, y: e.clientY, zones: [] };
    try { h0.setPointerCapture(e.pointerId); } catch (x) {}
    const mk = cls => { const n = document.createElement('div'); n.className = cls; if (rr) n.style.setProperty('--rr', rr); lay.appendChild(n); return n; };
    for (const u of [1, 2]) { const z = mk('tgt'); z.dataset.u = u; z.textContent = u === 2 ? '2 × 6' : '2 × 3'; d.zones.push(z); } d.live = mk('live'); d.lbl = mk('szl');
    const paint = () => { const x = this.find(d.el); if (!x) return; const r = this.box(x); if (!r.width) return;
      for (const z of d.zones) { const u = Number(z.dataset.u); hvEcl.pos(z, { left: r.left, top: r.top, width: u === 2 ? 2 * U + tg : U, height: U }); z.classList.toggle('on', u === d.u); }
      hvEcl.pos(d.live, r); d.lbl.textContent = d.u === 2 ? '2 × 6 · Two wide' : '2 × 3 · One tile';
      const lw = d.lbl.offsetWidth || 120, vw = document.documentElement.clientWidth || innerWidth; d.lbl.style.left = Math.max(8, Math.min(vw - lw - 8, d.x - lw / 2)) + 'px'; d.lbl.style.top = Math.max(8, d.y - 64) + 'px'; };
    d.iv = setInterval(paint, 60); paint(); if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) {}
    d.mv = ev => { if (ev.pointerId !== d.id) return; ev.preventDefault(); d.x = ev.clientX; d.y = ev.clientY; const u = d.x - d.o0.left > U * 1.5 + tg ? 2 : 1;
      if (u !== d.u) { d.u = u; const x = this.find(d.el); if (x) this.setUnits(x, u); d.live.classList.remove('pulse'); void d.live.offsetWidth; d.live.classList.add('pulse'); if (navigator.vibrate) try { navigator.vibrate(8); } catch (z) {} } paint(); };
    d.up = ev => { if (ev.pointerId !== d.id) return; this.endResize(); }; d.h0 = h0;
    addEventListener('pointermove', d.mv, true); addEventListener('pointerup', d.up, true); addEventListener('pointercancel', d.up, true); this.tick(); },
  endResize() { const d = this.rs; if (!d) return; this.rs = null; clearInterval(d.iv); removeEventListener('pointermove', d.mv, true); removeEventListener('pointerup', d.up, true); removeEventListener('pointercancel', d.up, true);
    try { d.h0.releasePointerCapture(d.id); } catch (x) {} [...d.zones, d.live, d.lbl].forEach(n => n && n.remove()); this.tick(); },
  async openEditor() { const h = this.hub; if (!(await this.exit(true))) return; const root = hvFindRoot(h), lv = root && root.lovelace; if (!lv) return; const sig = JSON.stringify(h._hvRaw || {});
    const path = hvCardPath(lv.config, o => o && o.type === 'custom:homeview-hub-card' && JSON.stringify(o) === sig, root._curView); if (path && hvOpenCardEditor(root, path)) return;
    hvToast('Open the dashboard editor (pencil) and tap the Home Screen card to edit it'); },
  menu(it, anchor) { hvEcl.closeMenu(); hvEcl.ensure(); const wrap = hvEcl.menu = document.createElement('div'); wrap.innerHTML = '<div class="scrim"></div><div class="menu" role="menu"></div>';
    const m = wrap.querySelector('.menu'), close = () => hvEcl.closeMenu(), t0 = Date.now(), n = this.items().filter(x => x.kind === it.kind).length;
    const item = (ic, txt, fn, cls, dis) => { const b = document.createElement('button'); b.setAttribute('role', 'menuitem'); if (cls) b.className = cls; if (dis) b.disabled = true;
      b.innerHTML = '<ha-icon></ha-icon><span></span>'; b.querySelector('ha-icon').setAttribute('icon', ic); b.querySelector('span').textContent = txt; b.addEventListener('click', e => { e.stopPropagation(); if (Date.now() - t0 < 400) return; fn(); }); m.appendChild(b); return b; };
    const sep = () => { const s = document.createElement('div'); s.className = 'sep'; m.appendChild(s); };
    const head = document.createElement('div'); head.className = 't'; head.textContent = this.label(it); m.appendChild(head);
    item('mdi:pencil', 'Edit', () => { close(); this.openEditor(); });
    if (it.kind !== 'photo') { item('mdi:arrow-left', 'Move earlier', () => { close(); this.move(it.kind, it.i, it.i - 1); }, '', it.i <= 0);
      item('mdi:arrow-right', 'Move later', () => { close(); this.move(it.kind, it.i, it.i + 1); }, '', it.i >= n - 1); }
    if (it.kind !== 'app') { const u = this.units(it); item(u === 1 ? 'mdi:check' : 'mdi:square-rounded-outline', '2 × 3 · One tile', () => { close(); this.setUnits(it, 1); });
      item(u === 2 ? 'mdi:check' : 'mdi:rectangle-outline', '2 × 6 · Two wide', () => { close(); this.setUnits(it, 2); }); }
    if (it.kind === 'side') item('mdi:content-copy', 'Duplicate', () => { close(); this.change(raw => this.edit(raw, 'side', a => a.splice(it.i + 1, 0, JSON.parse(JSON.stringify(a[it.i]))))); });
    if (it.kind !== 'photo') { sep(); item('mdi:delete-outline', 'Delete', () => { m.innerHTML = ''; const q = document.createElement('div'); q.className = 'q'; q.textContent = `Delete “${this.label(it)}”?`; m.appendChild(q);
      const row = document.createElement('div'); row.className = 'row'; m.appendChild(row);
      const mk = (t, cls, fn) => { const b = document.createElement('button'); b.textContent = t; if (cls) b.className = cls; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); row.appendChild(b); };
      mk('Cancel', '', close); mk('Delete', 'del', () => { close(); this.change(raw => this.edit(raw, it.kind, a => a.splice(it.i, 1))); }); hvEcl.place(m, anchor); }, 'del', it.kind === 'app' && n <= 1); }
    wrap.querySelector('.scrim').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); close(); });
    hvEcl.lay.appendChild(wrap); hvEcl.place(m, anchor); const f = m.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); } };
const HV_TILE_ICON = { clock: 'mdi:clock-outline', 'custom:homeview-nav-card': 'mdi:arrow-right-circle-outline', 'custom:homeview-calendar-card': 'mdi:calendar',
  'custom:homeview-house-card': 'mdi:home-outline', 'custom:homeview-group-card': 'mdi:lightbulb-group-outline', 'custom:homeview-thermostat-card': 'mdi:thermostat',
  'custom:homeview-music-card': 'mdi:music', 'custom:homeview-tv-card': 'mdi:television', 'custom:homeview-camera-card': 'mdi:cctv', 'custom:homeview-people-card': 'mdi:account-group-outline' };
const hvTileTypeName = t => { t = String(t || ''); const c = (window.customCards || []).find(x => 'custom:' + x.type === t); if (c) return c.name.replace(/^NotHomeView /, '');
  return t.replace(/^custom:/, '').replace(/^homeview-|-card$/g, '').replace(/-/g, ' ').replace(/^./, m => m.toUpperCase()); };
const HV_GE_CSS = `.hv-ge .hd{margin:4px 0 2px;font-weight:600;font-size:15px}.hv-ge .note{margin:0 0 10px;opacity:.75;font-size:13px;line-height:1.35}
.hv-ge .tiles{display:grid;grid-template-columns:repeat(var(--hv-ge-cols,4),minmax(0,1fr));gap:8px;margin-bottom:10px}
.hv-ge .t{all:unset;box-sizing:border-box;cursor:pointer;min-height:64px;padding:8px 6px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;
 background:var(--secondary-background-color,rgba(127,127,127,.12));border:2px solid transparent;font-size:12px;line-height:1.2;color:var(--primary-text-color);overflow:hidden}
.hv-ge .t:hover{border-color:var(--divider-color,rgba(127,127,127,.35))} .hv-ge .t.sel{border-color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 14%,transparent)}
.hv-ge .t span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;max-width:100%}
.hv-ge .t ha-state-icon,.hv-ge .t ha-icon{--mdc-icon-size:24px;color:var(--secondary-text-color)} .hv-ge .t.sel ha-state-icon,.hv-ge .t.sel ha-icon{color:var(--primary-color)}
.hv-ge .pb{grid-column:1/-1;all:unset;grid-column:1/-1;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:12px;opacity:.8;padding:2px 0;color:var(--secondary-text-color)}
.hv-ge .pb::before,.hv-ge .pb::after{content:'';flex:1;border-top:1px dashed currentColor;opacity:.6} .hv-ge .pb.sel{color:var(--primary-color);opacity:1}
.hv-ge .bar{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}.hv-ge .bar button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:4px;min-height:36px;box-sizing:border-box;padding:6px 14px;border-radius:999px;font-size:13px;
 border:1px solid var(--divider-color,rgba(127,127,127,.35));color:var(--primary-text-color)}.hv-ge .bar button:disabled{opacity:.4;cursor:default}.hv-ge .bar button ha-icon{--mdc-icon-size:18px}
.hv-ge .bar .grow{flex:1}.hv-ge .ed{border:1px solid var(--divider-color,rgba(127,127,127,.35));border-radius:12px;padding:12px;margin-bottom:12px}
.hv-ge .edh{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px}.hv-ge .edh small{font-weight:400;opacity:.7}
.hv-ge ha-expansion-panel{margin-top:4px;--expansion-panel-content-padding:0 0 8px}`;
class HVGridEditor extends HTMLElement {
  setConfig(c) { this._config = c; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  set lovelace(l) { this._lovelace = l; if (this._ce) this._ce.lovelace = l; }
  _emit(cfg) { this._config = cfg; fire(this, 'config-changed', { config: cfg }); }
  _cards() { return (this._config.cards || []).slice(); }
  _set(cards, sel) { if (sel != null) this._sel = sel; this._emit(Object.assign({}, this._config, { cards })); this._paint(true); }
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._root) this._build();
    this._form.hass = this._hass; this._form.data = Object.assign({}, HVGridCard.defaults, this._config); this._form.schema = GRID_SCHEMA;
    this._paint();
  }
  _build() {
    const r = this._root = document.createElement('div'); r.className = 'hv-ge';
    r.innerHTML = `<style>${HV_GE_CSS}</style><div class="hd">Tiles</div><p class="note">Tap a tile to change it: pick another entity, rename it, change its icon, what a tap does or its size.
      Tip: in the dashboard's edit mode you can tap a tile on the page itself to jump straight here.</p><div class="tiles" role="listbox" aria-label="Tiles"></div>
      <div class="bar"><button data-a="left" title="Move earlier"><ha-icon icon="mdi:arrow-left"></ha-icon>Move</button><button data-a="right" title="Move later">Move<ha-icon icon="mdi:arrow-right"></ha-icon></button>
      <button data-a="dup"><ha-icon icon="mdi:content-copy"></ha-icon>Duplicate</button><button data-a="del"><ha-icon icon="mdi:delete-outline"></ha-icon>Remove</button><span class="grow"></span>
      <button data-a="add"><ha-icon icon="mdi:plus"></ha-icon>Add tile</button><button data-a="brk"><ha-icon icon="mdi:format-page-break"></ha-icon>New page</button></div>
      <div class="ed"></div>`;
    r.querySelector('.bar').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b && !b.disabled) this._act(b.dataset.a); });
    r.querySelector('.tiles').addEventListener('click', ev => { const b = ev.target.closest('[data-i]'); if (b) { this._sel = +b.dataset.i; this._jump = true; this._paint(true); } });
    const f = this._form = document.createElement('ha-form');
    f.computeLabel = s => LABELS[s.name] || s.name;
    f.computeHelper = s => s.name === 'theme' ? 'The look of this device page: its tiles, popups and page background. "Same as all device pages" uses the Device pages theme set on the Home Screen card (Night when there is none).' : s.name === 'portrait_shape' ? 'Tiles fill the width; their height follows this shape and the screen height.' : undefined;
    f.addEventListener('value-changed', ev => { ev.stopPropagation(); const v = Object.assign({}, ev.detail.value), cfg = Object.assign({}, this._config);
      for (const k of Object.keys(HVGridCard.defaults)) { if (v[k] === undefined || v[k] === '' || v[k] === HVGridCard.defaults[k]) delete cfg[k]; else cfg[k] = v[k]; }
      this._emit(cfg); });
    f.hass = this._hass; f.schema = GRID_SCHEMA; f.data = Object.assign({}, HVGridCard.defaults, this._config);
    const xp = document.createElement(customElements.get('ha-expansion-panel') ? 'ha-expansion-panel' : 'details'); xp.setAttribute('outlined', ''); xp.header = 'Page layout (rows, columns, theme, gestures)';
    if (xp.tagName === 'DETAILS') xp.innerHTML = '<summary>Page layout (rows, columns, theme, gestures)</summary>'; xp.appendChild(f); r.appendChild(xp);
    this.appendChild(r);
    // opened by tapping a tile on the dashboard: start on that tile
    const cs = JSON.stringify(this._config.cards || []);
    if (HV_TAP.cfg === cs && Date.now() - HV_TAP.t < 5000 && HV_TAP.i >= 0) { this._sel = HV_TAP.i; this._jump = true; } HV_TAP.cfg = null;
    if (this._sel == null) this._sel = (this._config.cards || []).length ? 0 : -1;
  }
  _label(c) { if (!c) return '?'; if (c.type === 'custom:homeview-page-break') return 'New page';
    const st = c.entity && this._hass && this._hass.states[c.entity];
    return c.name || c.title || (st && st.attributes.friendly_name) || c.entity || hvTileTypeName(c.type); }
  _paint(force) {
    if (!this._root) return; const cards = this._cards(), sig = JSON.stringify(cards) + '|' + this._sel;
    if (this._sel >= cards.length) this._sel = cards.length - 1;
    if (!force && sig === this._sig) { if (this._ce) this._ce.hass = this._hass; return; } this._sig = sig;
    const box = this._root.querySelector('.tiles'); box.style.setProperty('--hv-ge-cols', Math.max(2, Math.min(6, this._config.landscape_columns || 4)));
    box.innerHTML = ''; let pg = 1;
    cards.forEach((c, i) => { const sel = i === this._sel;
      if (c && c.type === 'custom:homeview-page-break') { pg++; const b = document.createElement('button'); b.className = 'pb' + (sel ? ' sel' : ''); b.dataset.i = i; b.textContent = c.name ? 'Page ' + pg + ' · ' + c.name : 'Page ' + pg; box.appendChild(b); return; }
      const b = document.createElement('button'); b.className = 't' + (sel ? ' sel' : ''); b.dataset.i = i; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', sel);
      const st = c && c.entity && this._hass.states[c.entity]; let ic;
      if (st && customElements.get('ha-state-icon')) { ic = document.createElement('ha-state-icon'); ic.hass = this._hass; ic.stateObj = st; if (c.icon) ic.icon = c.icon; }
      else { ic = document.createElement('ha-icon'); ic.icon = (c && c.icon) || HV_TILE_ICON[c && c.type] || 'mdi:card-outline'; }
      const t = document.createElement('span'); t.textContent = this._label(c); b.append(ic, t); box.appendChild(b); });
    const bar = this._root.querySelector('.bar'), n = cards.length, s = this._sel;
    bar.querySelector('[data-a=left]').disabled = s <= 0; bar.querySelector('[data-a=right]').disabled = s < 0 || s >= n - 1;
    bar.querySelector('[data-a=dup]').disabled = s < 0; bar.querySelector('[data-a=del]').disabled = s < 0;
    this._editor(cards[s], s);
  }
  async _editor(c, i) {
    const ed = this._root.querySelector('.ed'); if (!c) { ed.innerHTML = '<div class="note">No tiles yet: tap "Add tile".</div>'; this._ce = null; this._ceKey = null; return; }
    const key = i + '|' + c.type, cs = JSON.stringify(c);
    if (this._ce && this._ceKey === key) { if (this._ceVal !== cs) { this._ceVal = cs; this._ce.value = c; if (this._ce.setConfig && !this._ce.tagName.startsWith('HUI-')) this._ce.setConfig(c); } this._ce.hass = this._hass; return; }
    this._ceKey = key; this._ceVal = cs; ed.innerHTML = `<div class="edh"></div>`;
    ed.firstChild.innerHTML = `Tile ${i + 1}: <span></span> <small></small>`; ed.firstChild.querySelector('span').textContent = this._label(c); ed.firstChild.querySelector('small').textContent = hvTileTypeName(c.type);
    let el;
    if (customElements.get('hui-card-element-editor')) { el = document.createElement('hui-card-element-editor'); el.hass = this._hass; if (this._lovelace) el.lovelace = this._lovelace; el.value = c; }
    else { try { const cls = customElements.get(String(c.type).replace(/^custom:/, '')); el = cls && cls.getConfigElement ? await cls.getConfigElement() : null; } catch (e) { el = null; }
      if (el) { el.hass = this._hass; if (el.setConfig) el.setConfig(c); } }
    if (this._ceKey !== key) return;
    if (!el) { ed.insertAdjacentHTML('beforeend', '<div class="note">This tile has no visual editor; use "Show code editor".</div>'); this._ce = null; return; }
    el.addEventListener('config-changed', ev => { ev.stopPropagation(); const nc = ev.detail && ev.detail.config; if (!nc || ev.detail.error) return;
      const cards = this._cards(); if (i >= cards.length) return; cards[i] = nc; this._ceVal = JSON.stringify(nc); const sp = ed.querySelector('.edh span'); if (sp) sp.textContent = this._label(nc);
      if (nc.type !== c.type) this._ceKey = null; this._emit(Object.assign({}, this._config, { cards })); this._paint(); });
    el.addEventListener('GUImode-changed', ev => ev.stopPropagation());
    this._ce = el; ed.appendChild(el);
    if (this._jump) { this._jump = false; setTimeout(() => { if (ed.isConnected) ed.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 350); } // straight to the tapped tile's fields
  }
  _act(a) { const cards = this._cards(), s = this._sel;
    if (a === 'left' && s > 0) { [cards[s - 1], cards[s]] = [cards[s], cards[s - 1]]; this._ceKey = null; return this._set(cards, s - 1); }
    if (a === 'right' && s < cards.length - 1) { [cards[s + 1], cards[s]] = [cards[s], cards[s + 1]]; this._ceKey = null; return this._set(cards, s + 1); }
    if (a === 'dup' && s >= 0) { cards.splice(s + 1, 0, JSON.parse(JSON.stringify(cards[s]))); this._ceKey = null; return this._set(cards, s + 1); }
    if (a === 'del' && s >= 0) { cards.splice(s, 1); this._ceKey = null; return this._set(cards, Math.min(s, cards.length - 1)); }
    if (a === 'add' || a === 'brk') { const at = s >= 0 ? s + 1 : cards.length;
      const nc = a === 'brk' ? { type: 'custom:homeview-page-break' } : Object.assign({ type: 'custom:homeview-entity-card' }, HVEntityCard.getStubConfig(this._hass));
      cards.splice(at, 0, nc); this._ceKey = null; return this._set(cards, at); } }
}
if (!customElements.get('homeview-grid-card-editor')) customElements.define('homeview-grid-card-editor', HVGridEditor);

/* ---------------- chips row ---------------- */
// NotHomeView Chips: a horizontally scrollable row of glass pills. Each chip = an entity (light / switch / group: on-off with the
// lavender "on" highlight, tap toggles; climate: current temperature; anything else: its state) or just a navigation target.
// Tap / hold actions per chip, "Light style while the sun is up" like the tiles. Avoids the floating edit / screensaver buttons.
const CHIP_TOGGLE = ['light', 'switch', 'fan', 'input_boolean', 'group', 'automation', 'siren'];
const CHIP_CSS = `:host{display:block;-webkit-tap-highlight-color:transparent;font-family:${FONT}}
${(BASE_CSS.match(/:host\(\[day\]\)\{[\s\S]*?\}/) || [''])[0]}
.row{display:flex;gap:var(--chip-gap,8px);overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;
 padding:3px 2px 6px;touch-action:pan-x;mask-image:linear-gradient(90deg,#000 calc(100% - 18px),transparent);-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 18px),transparent)}
.row::-webkit-scrollbar{display:none}
.chip{all:unset;box-sizing:border-box;flex:none;display:inline-flex;align-items:center;gap:.5em;height:var(--chip-h,clamp(38px,5.4vw,50px));padding:0 1.05em 0 .8em;border-radius:999px;cursor:pointer;
 font-size:var(--chip-font,clamp(13px,1.95vw,17px));font-weight:600;line-height:1;white-space:nowrap;color:var(--hv-text,#fff);
 background:var(--hv-bg,linear-gradient(150deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.07) 100%));border:1px solid var(--hv-border,rgba(255,255,255,.25));
 box-shadow:var(--hv-shadow,inset 0 1px 0 rgba(255,255,255,.25),0 6px 18px rgba(6,8,60,.22));
 backdrop-filter:blur(20px) saturate(170%);-webkit-backdrop-filter:blur(20px) saturate(170%);
 transition:background .25s ease,border-color .25s ease,transform .12s ease;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.chip:active{transform:scale(.96)}
.chip:focus-visible{outline:2px solid var(--hv-accent,#d4c9ff)}
.chip.on{background:var(--hv-bg-on,linear-gradient(150deg,rgba(196,182,255,.46) 0%,rgba(160,140,250,.34) 100%));border-color:var(--hv-border-on,rgba(225,215,255,.42));color:var(--hv-text-on,#fff)}
.chip ha-state-icon,.chip ha-icon{--mdc-icon-size:1.3em;width:1.3em;height:1.3em;display:flex;color:var(--hv-icon,#fff);flex:none}
.chip.on ha-state-icon,.chip.on ha-icon{color:var(--hv-icon-on,#f3efff)}
.chip .v{font-weight:500;color:var(--hv-text2,rgba(255,255,255,.7))} .chip.on .v{color:var(--hv-text2-on,rgba(255,255,255,.85))}
.chip.unavailable{opacity:.5}
.empty{opacity:.7;padding:8px;color:var(--primary-text-color)}
${HV_DAY_HOST}`;
class HVChipsCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { chips: [], day_light: false, show_state: true }; }
  static getStubConfig() { return { chips: [{ entity: 'sun.sun' }, { name: 'Home', icon: 'mdi:home-outline', tap_action: { action: 'navigate', navigation_path: '/lovelace/0' } }] }; }
  static getConfigElement() { return document.createElement('homeview-chips-card-editor'); }
  setConfig(c) { if (!c || (c.chips != null && !Array.isArray(c.chips))) throw new Error('chips must be a list');
    this._config = Object.assign({}, HVChipsCard.defaults, c, { chips: (c.chips || []).filter(x => x && typeof x === 'object') }); this._sig = null; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  getCardSize() { return 1; }
  getGridOptions() { return { columns: 'full', rows: 'auto' }; }
  connectedCallback() { if (!this._rz) { this._rz = () => this._avoidFab(); } addEventListener('resize', this._rz); this._rz(); setTimeout(this._rz, 1800); }
  disconnectedCallback() { removeEventListener('resize', this._rz); this._closePicker(); }
  _view(ch) {
    const h = this._hass, s = ch.entity ? h.states[ch.entity] : null, d = ch.entity ? domainOf(ch.entity) : '';
    const name = ch.name != null && ch.name !== '' ? ch.name : (s ? (s.attributes.friendly_name || ch.entity) : (ch.entity || ''));
    let val = '', on = false;
    if (s) {
      if (CHIP_TOGGLE.includes(d)) { on = s.state === 'on'; val = on ? (d === 'light' && s.attributes.brightness != null && !(s.attributes.entity_id && s.attributes.entity_id.length) ? Math.round(s.attributes.brightness / 2.55) + '%' : 'On') : (s.state === 'off' ? 'Off' : (h.formatEntityState ? h.formatEntityState(s) : s.state)); }
      else if (d === 'climate') { const t = s.attributes.current_temperature; val = t != null ? (Math.round(t * 10) / 10) + '°' : (h.formatEntityState ? h.formatEntityState(s) : s.state); on = s.attributes.hvac_action === 'heating' || s.attributes.hvac_action === 'cooling'; }
      else { val = h.formatEntityState ? h.formatEntityState(s) : s.state; on = ['on', 'open', 'opening', 'home', 'playing', 'unlocked'].includes(s.state); }
    }
    if (!s && Array.isArray(ch.count_entities)) { const n = ch.count_entities.filter(i => h.states[i] && ['on', 'open', 'playing', 'unlocked'].includes(h.states[i].state)).length; val = String(n); on = n > 0; } // 1.31.0
    if (ch.show_state === false || this._config.show_state === false && ch.show_state !== true) val = '';
    return { s, d, name, val, on: on && ch.highlight !== false, unavailable: !!(s && s.state === 'unavailable') };
  }
  _action(ch, kind) {
    const a = ch[kind + '_action']; if (a) return a;
    const d = ch.entity ? domainOf(ch.entity) : '';
    if (kind === 'tap') return ch.entity ? (CHIP_TOGGLE.includes(d) ? { action: 'toggle' } : { action: 'more-info' }) : { action: 'none' };
    return ch.entity ? { action: 'more-info' } : { action: 'none' };
  }
  _run(i, kind) { const ch = this._config.chips[i]; if (!ch) return;
    if (kind === 'tap' && ch.room_picker) { this._openPicker(ch); return; }
    const cfg = this._action(ch, kind); if (!cfg || cfg.action === 'none') return;
    if (navigator.vibrate && kind === 'hold') try { navigator.vibrate(30); } catch (e) {}
    fire(this, 'hass-action', { config: { entity: ch.entity, [kind + '_action']: cfg }, action: kind }); }
  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config, sun = this._hass.states['sun.sun'];
    this.toggleAttribute('day', !!(c.day_light && sun && sun.state === 'above_horizon'));
    const views = c.chips.map(ch => this._view(ch));
    const sig = JSON.stringify([views.map(v => [v.name, v.val, v.on, v.unavailable, v.s && v.s.attributes.icon]), c.chips.map(x => x.icon || ''), this._hass.locale && this._hass.locale.language]);
    if (sig === this._sig && this._row) return; this._sig = sig;
    if (!this._row) { this.shadowRoot.innerHTML = `<style>${CHIP_CSS}</style><div class="row" role="toolbar"></div>`; this._row = this.shadowRoot.querySelector('.row'); this._bind(); }
    this._row.innerHTML = c.chips.length ? '' : '<div class="empty">Add chips in the editor</div>';
    views.forEach((v, i) => { const ch = c.chips[i], b = document.createElement('button');
      b.className = 'chip' + (v.on ? ' on' : '') + (v.unavailable ? ' unavailable' : ''); b.dataset.i = i; b.setAttribute('aria-label', [v.name, v.val].filter(Boolean).join(', '));
      let ic; if (v.s && !ch.icon) { ic = document.createElement('ha-state-icon'); ic.hass = this._hass; ic.stateObj = v.s; } else { ic = document.createElement('ha-icon'); ic.icon = ch.icon || 'mdi:gesture-tap'; if (v.s && ch.icon) { ic = document.createElement('ha-state-icon'); ic.hass = this._hass; ic.stateObj = v.s; ic.icon = ch.icon; } }
      b.appendChild(ic);
      if (v.name) { const n = document.createElement('span'); n.className = 'n'; n.textContent = v.name; b.appendChild(n); }
      if (v.val) { const s = document.createElement('span'); s.className = 'v'; s.textContent = v.val; b.appendChild(s); }
      this._row.appendChild(b); });
    this._avoidFab();
  }
  _bind() { // tap / hold per chip; a horizontal scroll of the row cancels the press
    const r = this._row; let t = null, held = false, i = -1, sx = 0, sy = 0;
    const cancel = () => { clearTimeout(t); t = null; i = -1; held = false; };
    r.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; const b = e.composedPath().find(n => n.classList && n.classList.contains('chip')); if (!b) return;
      i = Number(b.dataset.i); held = false; sx = e.clientX; sy = e.clientY; clearTimeout(t); t = setTimeout(() => { t = null; held = true; }, 500); });
    r.addEventListener('pointermove', e => { if (i >= 0 && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
    r.addEventListener('pointerup', () => { if (i < 0) return; const k = i, h = held; cancel(); const ch = this._config.chips[k];
      this._run(k, h && ch && this._action(ch, 'hold').action !== 'none' ? 'hold' : 'tap'); });
    r.addEventListener('pointercancel', cancel); r.addEventListener('scroll', cancel, { passive: true });
    r.addEventListener('contextmenu', e => e.preventDefault());
    r.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const b = e.composedPath().find(n => n.classList && n.classList.contains('chip')); if (b) { e.preventDefault(); this._run(Number(b.dataset.i), 'tap'); } });
  }
  // ---- room picker: a NotHomeView glass sheet listing rooms (icon, name, live status); tap a room to go to its page
  _roomStatus(rm) {
    const h = this._hass, areas = [].concat(rm.area || []).filter(Boolean); if (!areas.length || !h.entities) return rm.status || '';
    let on = 0, lights = 0, temp = null;
    for (const [id, e] of Object.entries(h.entities)) {
      if (!e || e.hidden || e.entity_category) continue;
      const a = e.area_id || (e.device_id && h.devices && h.devices[e.device_id] ? h.devices[e.device_id].area_id : null); if (!areas.includes(a)) continue;
      const st = h.states[id]; if (!st) continue; const d = domainOf(id);
      if (d === 'light' && !(st.attributes.entity_id && st.attributes.entity_id.length) && st.state !== 'unavailable') { lights++; if (st.state === 'on') on++; }
      if (d === 'climate' && temp == null && st.attributes.current_temperature != null) temp = st.attributes.current_temperature;
    }
    const parts = []; if (lights) parts.push(on ? `${on} light${on > 1 ? 's' : ''} on` : 'Lights off'); if (temp != null) parts.push((Math.round(temp * 10) / 10) + '°');
    return { text: parts.join(' · ') || rm.status || '', on: on > 0 };
  }
  _openPicker(ch) {
    this._closePicker(); const rooms = (ch.rooms || []).filter(r => r && (r.name || r.navigation_path));
    const host = this._pick = document.createElement('homeview-room-picker'), r = host.attachShadow({ mode: 'open' });
    host.toggleAttribute('day', this.hasAttribute('day')); host.toggleAttribute('hv-day', this.hasAttribute('hv-day'));
    r.innerHTML = `<style>${PICK_CSS}</style><div class="bd"></div><div class="sh" role="dialog" aria-modal="true" aria-label="${esc(ch.picker_title || ch.name || 'Rooms')}">
      <div class="hd"><span>${esc(ch.picker_title || ch.name || 'Rooms')}</span><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="gr">${rooms.map((rm, k) => { const st = this._roomStatus(rm), t = typeof st === 'string' ? { text: st, on: false } : st;
        return `<button class="rm${t.on ? ' on' : ''}" data-k="${k}"><ha-icon icon="${esc(rm.icon || 'mdi:door')}"></ha-icon><span class="t"><span class="n">${esc(rm.name || '')}</span>${t.text ? `<span class="s">${esc(t.text)}</span>` : ''}</span></button>`; }).join('') || '<div class="s">Add rooms to this chip in the editor</div>'}</div></div>`;
    const close = () => this._closePicker(); if (hvFullPopups()) hvFhCard(host, r, r.querySelector('.sh'), close, '600px');
    r.querySelector('.bd').addEventListener('click', close); r.querySelector('.x').addEventListener('click', close);
    if (hvPenOK(this, this._hass)) hvPen(r.querySelector('.x'), () => { close(); setTimeout(() => hvPopEdit(this, { card: this }), 260); }, { gap: 6 });
    this._esc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }; addEventListener('keydown', this._esc, true); // first (capture): Escape closes only the picker
    r.querySelectorAll('.rm').forEach(b => b.addEventListener('click', () => { const rm = rooms[Number(b.dataset.k)]; close();
      if (rm && rm.navigation_path) fire(this, 'hass-action', { config: { tap_action: { action: 'navigate', navigation_path: rm.navigation_path } }, action: 'tap' }); }));
    // 1.30.7: chips on a device page shown as a sheet over the Home Screen: open in the sheet's own layer (in front of it; closing
    // returns to the sheet). Elsewhere on <body> as before.
    (hvSheetLayer(this) || document.body).appendChild(host); requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('in')));
  }
  _closePicker() { if (this._esc) { removeEventListener('keydown', this._esc, true); this._esc = null; } const p = this._pick; this._pick = null;
    if (p) { p.classList.remove('in'); setTimeout(() => p.remove(), 220); } }
  _avoidFab() { // keep the chips clear of the floating edit / screensaver buttons (top corner)
    if (!this._row || !this.isConnected) return;
    // stay below the status bar / notch (iOS safe area) when the dashboard has no header
    let p = this._probe; if (!p || !p.isConnected) { p = this._probe = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;width:0;pointer-events:none;height:var(--hv-safe-top, env(safe-area-inset-top, 0px))'; this.shadowRoot.appendChild(p); }
    const safeTop = p.getBoundingClientRect().height, top0 = this.getBoundingClientRect().top; // border-box top: padding doesn't move it
    const pt = safeTop && top0 < safeTop + 4 ? Math.round(safeTop + 4 - top0) + 'px' : '';
    if (this.style.paddingTop !== pt) { this.style.paddingTop = pt; requestAnimationFrame(() => dispatchEvent(new Event('hv-layout'))); } // page grid below re-measures
    const me = this.getBoundingClientRect(); let pr = 0;
    for (const f of document.querySelectorAll('homeview-edit-fab')) { const r = f.getBoundingClientRect(); if (r.height && r.top < me.bottom && r.bottom > me.top && r.left < me.right) pr = Math.max(pr, me.right - r.left + 6); }
    this._row.style.marginRight = pr ? pr + 'px' : '';
  }
}
const PICK_CSS = `:host{position:fixed;inset:0;z-index:8;font-family:${FONT};-webkit-tap-highlight-color:transparent}
${(BASE_CSS.match(/:host\(\[day\]\)\{[\s\S]*?\}/) || [''])[0]}
.bd{position:absolute;inset:0;background:rgba(4,6,24,.42);opacity:0;transition:opacity .22s ease}
:host(.in) .bd{opacity:1}
.sh{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%) scale(.97);opacity:0;transition:transform .28s cubic-bezier(.2,.9,.3,1.08),opacity .2s ease;
 width:min(600px,calc(100vw - 28px));max-height:calc(100% - 90px);overflow:auto;box-sizing:border-box;padding:18px;border-radius:30px;color:var(--hv-text,#fff);
 background:var(--hv-sheet,linear-gradient(150deg,rgba(52,60,120,.62) 0%,rgba(22,26,60,.72) 100%));border:1px solid var(--hv-border,rgba(255,255,255,.25));
 backdrop-filter:blur(30px) saturate(170%);-webkit-backdrop-filter:blur(30px) saturate(170%);box-shadow:0 24px 70px rgba(0,0,30,.45)}
:host(.in) .sh{transform:translate(-50%,-50%);opacity:1}
:host([day]) .sh{--hv-sheet:linear-gradient(150deg,rgba(255,255,255,.90) 0%,rgba(236,244,255,.82) 100%);box-shadow:0 24px 70px rgba(40,90,140,.25)}
${HV_DAY_HOST}
:host([hv-day]) .bd{background:rgba(0,0,0,.22)} :host([hv-day]) .sh{--hv-sheet:#f2f2f6;box-shadow:0 24px 70px rgba(30,30,60,.22)} :host([hv-day]) .x{background:rgba(120,120,128,.16)}
.hd{display:flex;align-items:center;justify-content:space-between;font-size:21px;font-weight:700;margin:2px 4px 14px}
.x{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.16);color:var(--hv-text,#fff)}
.x ha-icon{--mdc-icon-size:22px;display:flex}
.gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(140px,40vw),1fr));gap:10px}
.rm{all:unset;cursor:pointer;box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:14px;min-height:68px;border-radius:22px;
 background:var(--hv-bg,linear-gradient(150deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.07) 100%));border:1px solid var(--hv-border,rgba(255,255,255,.25));transition:transform .12s ease}
.rm:active{transform:scale(.97)} .rm:focus-visible{outline:2px solid var(--hv-accent,#d4c9ff)}
.rm.on{background:var(--hv-bg-on,linear-gradient(150deg,rgba(196,182,255,.46) 0%,rgba(160,140,250,.34) 100%));border-color:var(--hv-border-on,rgba(225,215,255,.42))}
.rm ha-icon{--mdc-icon-size:28px;width:28px;height:28px;display:flex;flex:none;color:var(--hv-icon,#fff)} .rm.on ha-icon{color:var(--hv-icon-on,#f3efff)}
.t{min-width:0} .n{display:block;font-weight:650;font-size:16px;line-height:1.2} .s{display:block;font-size:13px;line-height:1.3;margin-top:2px;color:var(--hv-text2,rgba(255,255,255,.7))}
.rm.on .n{color:var(--hv-text-on,#fff)} .rm.on .s{color:var(--hv-text2-on,rgba(255,255,255,.85))}`;
const CHIP_FIELDS = {
  entity: { label: 'Entity (light group, climate, ... - leave empty for a navigation chip)', selector: { entity: {} } },
  name: { label: 'Name', selector: { text: {} } },
  icon: { label: 'Icon', selector: { icon: {} } },
  show_state: { label: 'Show state / temperature', selector: { boolean: {} }, default: true },
  tap_action: { label: 'Tap action (default: toggle for lights / switches, more-info otherwise)', selector: { ui_action: {} } },
  hold_action: { label: 'Hold action (default: more-info)', selector: { ui_action: {} } },
  room_picker: { label: 'Tap opens the room picker (instead of the tap action)', selector: { boolean: {} } },
  picker_title: { label: 'Room picker title', selector: { text: {} } },
  rooms: { label: 'Room picker: rooms', selector: { object: { multiple: true, label_field: 'name', description_field: 'navigation_path', fields: {
    name: { label: 'Name', selector: { text: {} } }, icon: { label: 'Icon', selector: { icon: {} } },
    navigation_path: { label: 'Opens (view)', selector: { navigation: {} } },
    area: { label: 'Area(s) for the status line (lights on, temperature)', selector: { area: { multiple: true } } } } } } } };
const CHIPS_SCHEMA = [
  { name: 'chips', selector: { object: { multiple: true, label_field: 'name', description_field: 'entity', fields: CHIP_FIELDS } } },
  { type: 'grid', name: '', schema: [{ name: 'day_light', selector: { boolean: {} } }, { name: 'show_state', selector: { boolean: {} } }] }];
class HVChipsEditor extends HTMLElement {
  setConfig(c) { this._config = c; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) { const f = this._form = document.createElement('ha-form');
      f.computeLabel = s => s.name === 'chips' ? 'Chips (drag to reorder, pencil to edit)' : s.name === 'show_state' ? 'Show states on all chips' : (LABELS[s.name] || s.name);
      f.computeHelper = s => s.name === 'chips' ? 'Each chip: an entity (light group, thermostat, ...) and/or a tap action such as Navigate to a view.' : undefined;
      f.hass = this._hass; f.schema = CHIPS_SCHEMA; f.data = Object.assign({}, HVChipsCard.defaults, this._config);
      f.addEventListener('value-changed', ev => { ev.stopPropagation(); const v = ev.detail.value, cfg = Object.assign({}, this._config);
        cfg.chips = (v.chips || []).map(x => { const o = {}; for (const [k, val] of Object.entries(x || {})) if (val !== undefined && val !== '' && !(k === 'show_state' && val === true)) o[k] = val; return o; });
        for (const k of ['day_light', 'show_state']) { if (v[k] === undefined || v[k] === HVChipsCard.defaults[k]) delete cfg[k]; else cfg[k] = v[k]; }
        this._config = cfg; fire(this, 'config-changed', { config: cfg }); });
      this.appendChild(f); }
    this._form.hass = this._hass; this._form.schema = CHIPS_SCHEMA; this._form.data = Object.assign({}, HVChipsCard.defaults, this._config);
  }
}
if (!customElements.get('homeview-chips-card-editor')) customElements.define('homeview-chips-card-editor', HVChipsEditor);


/* ---------------- swipe down to go back ----------------
   hvPullDown: a vertical drag that starts near the top (or while the content is scrolled to the top) moves `target()` with the
   finger (slide + fade); released far enough (or flicked) it calls done(), otherwise it springs back. Horizontal swipes, the
   left-edge sidebar swipe and normal scrolling are left alone (direction lock; only engages for a clearly downward drag). */
function hvPullDown(o) { // o: { on: el|window, ok(touch, ev) -> bool, target() -> el, done(), threshold }
  let st = null;
  const reset = (el, anim) => { if (!el) return; el.style.transition = anim ? 'transform .28s cubic-bezier(.2,.9,.3,1), opacity .28s ease' : ''; el.style.transform = ''; el.style.opacity = '';
    if (anim) setTimeout(() => { el.style.transition = ''; el.style.willChange = ''; }, 300); };
  const ts = e => { st = null; if (e.touches.length !== 1) return; const t = e.touches[0]; if (t.clientX <= 28 || !o.ok(t, e)) return;
    st = { x: t.clientX, y: t.clientY, t: Date.now(), on: false, dy: 0, el: null }; };
  const tm = e => { if (!st) return; const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
    if (!st.on) { if (Math.abs(dx) > 14 && Math.abs(dx) > dy) { st = null; return; } if (dy < -6) { st = null; return; }
      if (dy > 14 && dy > Math.abs(dx) * 1.4) { st.on = true; st.y0 = t.clientY; st.el = o.target(); if (st.el) st.el.style.willChange = 'transform,opacity'; } else return; }
    if (e.cancelable) e.preventDefault(); st.dy = Math.max(0, t.clientY - st.y0); const H = innerHeight || 800;
    if (st.el) { st.el.style.transition = 'none'; st.el.style.transform = `translateY(${st.dy}px) scale(${1 - Math.min(.06, st.dy / H * .12)})`; st.el.style.opacity = String(1 - Math.min(.55, st.dy / H * .9)); } };
  const te = () => { if (!st) return; const s0 = st; st = null; if (!s0.on) return; const v = s0.dy / Math.max(1, Date.now() - s0.t), H = innerHeight || 800;
    if (s0.dy > (o.threshold || Math.min(160, H * .2)) || (v > .6 && s0.dy > 50)) { const el = s0.el;
      if (el) { el.style.transition = 'transform .22s ease-in, opacity .22s ease-in'; el.style.transform = `translateY(${Math.round(H * .4)}px) scale(.94)`; el.style.opacity = '0'; }
      setTimeout(() => { o.done(); setTimeout(() => reset(el, false), 60); }, 200); }
    else reset(s0.el, true); };
  const L = [['touchstart', ts, { capture: true, passive: true }], ['touchmove', tm, { capture: true, passive: false }], ['touchend', te, true], ['touchcancel', te, true]];
  return { bind: on => { const n = o.on || window; for (const [t, f, op] of L) on ? n.addEventListener(t, f, op) : n.removeEventListener(t, f, op); } };
}
const hvNavigate = path => { if (location.search && !path.includes('?')) path += location.search; history.pushState(null, '', path); fire(window, 'location-changed', { replace: false }); };
const hvHaRoot = () => document.querySelector('home-assistant');

/* ---------------- block pull-to-refresh ----------------
   While a card that wants it is on the page (hub card; page grid with swipe-back), a downward drag that would overscroll the
   page at the top is cancelled (touchmove preventDefault, non-passive), so neither the HA iOS / Android app's native
   pull-to-refresh nor Chrome's / Safari's overscroll kicks in. Inner scrollers that can still scroll up keep scrolling,
   horizontal swipes are never touched. Also sets overscroll-behavior-y: none on the page while active. */
const hvPTR = (() => { const owners = new Set(); let st = null, saved = null;
  const docTop = () => { const se = document.scrollingElement || document.documentElement; return (se.scrollTop || 0) <= 0 && (window.scrollY || 0) <= 0; };
  const scroller = path => { for (const n of path) { if (!(n instanceof Element)) continue; if (n === document.documentElement || n === document.body) break;
    if (n.scrollHeight > n.clientHeight + 1) { const oy = getComputedStyle(n).overflowY; if (oy === 'auto' || oy === 'scroll') return n; } } return null; };
  const ts = e => { st = null; if (!owners.size || e.touches.length !== 1) return; const t = e.touches[0]; st = { x: t.clientX, y: t.clientY, sc: scroller(e.composedPath()) }; };
  const tm = e => { if (!st || !e.cancelable || e.touches.length !== 1) return; const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
    if (dy <= 0 || Math.abs(dx) > dy) return;              // up, or sideways (paging, sidebar swipe): leave alone
    if (st.sc && st.sc.scrollTop > 0) return;               // an inner list that can still scroll up
    if (!docTop()) return;                                   // the page itself is scrolled: normal scroll back up
    e.preventDefault(); };
  const te = () => { st = null; };
  const css = on => { const els = [document.documentElement, document.body, document.querySelector('home-assistant')].filter(Boolean);
    if (on && !saved) { saved = els.map(el => [el, el.style.overscrollBehaviorY]); els.forEach(el => { el.style.overscrollBehaviorY = 'none'; }); }
    if (!on && saved) { saved.forEach(([el, v]) => { el.style.overscrollBehaviorY = v; }); saved = null; } };
  const L = [['touchstart', ts, { capture: true, passive: true }], ['touchmove', tm, { capture: true, passive: false }], ['touchend', te, true], ['touchcancel', te, true]];
  return { set(owner, on) { const had = owners.size; if (on) owners.add(owner); else owners.delete(owner);
    if (!had && owners.size) { for (const [t, f, o] of L) addEventListener(t, f, o); css(true); }
    if (had && !owners.size) { for (const [t, f, o] of L) removeEventListener(t, f, o); css(false); } } };
})();

/* ---------------- slide-up sheet (Apple modal sheet) ----------------
   Used by the launch page for Home / Security (the view's cards), Weather and enlarged tiles: slides up from the bottom, the
   launch page behind scales down a little with rounded corners and dims; grab pill + X; drag down anywhere at the top (or on
   the pill) and it follows the finger, the launch page scaling back up; past a threshold it drops away. Horizontal swipes
   (Home page paging) and scrolling inside the sheet are left alone. */
const SHEET_EASE = 'cubic-bezier(.32,.72,0,1)';
const SHEET_CSS = `:host{position:fixed;inset:0;z-index:9;font-family:${FONT};color:#fff;-webkit-tap-highlight-color:transparent}
.scrim{position:absolute;inset:0;background:rgba(0,0,0,.45);opacity:0}
.sh{position:absolute;left:0;right:0;bottom:0;top:var(--st,40px);border-radius:var(--sr,18px) var(--sr,18px) 0 0;overflow:hidden;background:var(--sbg,#16161c);
 box-shadow:0 -8px 32px rgba(0,0,0,.35);transform:translate3d(0,100%,0);contain:layout paint}
.grab{position:absolute;left:0;right:0;top:0;height:34px;z-index:6;touch-action:none;cursor:grab}
.grab::before{content:'';position:absolute;left:50%;top:7px;width:38px;height:5px;margin-left:-19px;border-radius:3px;background:rgba(255,255,255,.62);box-shadow:0 1px 4px rgba(0,0,30,.3)}
.x{all:unset;cursor:pointer;position:absolute;top:12px;right:14px;z-index:7;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
 background:rgba(120,120,128,.38);color:#fff;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.x ha-icon{--mdc-icon-size:20px;display:flex}
.bd{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;box-sizing:border-box;padding:52px var(--spx,16px) 16px}
.bd > .cw{margin-bottom:8px}
:host([hv-day]){color:#1c1c1e} :host([hv-day]) .scrim{background:rgba(0,0,0,.22)} :host([hv-day]) .sh{box-shadow:0 -8px 32px rgba(30,30,60,.14)}
:host([hv-day]) .grab::before{background:rgba(60,60,67,.32);box-shadow:none} :host([hv-day]) .x{background:rgba(120,120,128,.16);color:#3c3c43}
:host([full]) .bd{top:var(--sft,0px)} :host([full]) .grab{top:var(--sft,0px)} :host([full]) .x{top:calc(12px + var(--sft,0px))}`;
// the shadow root of the Home Screen sheet an element sits in (null when it is not in one)
const hvSheetLayer = el => { let n = el; for (let i = 0; i < 60 && n; i++) { if (n.tagName === 'HOMEVIEW-SHEET') return n.shadowRoot; n = n.parentNode || n.host; } return null; };
// a popup / dialog of Home Assistant or browser_mod is open (Escape belongs to it, not to a sheet underneath)
const hvDialogOpen = () => { const ha = document.querySelector('home-assistant'), r = ha && ha.shadowRoot; if (!r) return false;
  for (const d of r.querySelectorAll('browser-mod-popup, ha-more-info-dialog, dialog-box')) { const x = d.shadowRoot && d.shadowRoot.querySelector('ha-dialog, ha-md-dialog, ha-adaptive-dialog, wa-dialog, dialog');
    if (d.open === true || d.hasAttribute('open') || (x && (x.open === true || x.hasAttribute('open')))) return true; }
  return false; };
function hvSheet(o) { // o: { parent, launch() -> [els], label, bg, build(bd, frame) -> { hass }, onClose() }
  const host = document.createElement('homeview-sheet'), sr = host.attachShadow({ mode: 'open' });
  sr.innerHTML = `<style>${SHEET_CSS}</style><div class="scrim"></div><div class="sh" role="dialog" aria-modal="true" aria-label="${esc(o.label || '')}"><div class="bd"></div><div class="grab" aria-hidden="true"></div><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>`;
  const sh = sr.querySelector('.sh'), bd = sr.querySelector('.bd'), scrim = sr.querySelector('.scrim'), grab = sr.querySelector('.grab');
  const day = o.day === true || (o.day !== false && hvDayNow()); host.toggleAttribute('hv-day', day); // Day theme: light sheet (the music / photo / weather sheets keep their own dark look)
  if (day) sh.style.setProperty('--sbg', o.dayBg || '#eeeef0'); else if (o.bg) sh.style.setProperty('--sbg', o.bg);
  // cards inside report their own visibility / rebuilds: never let that reach the launch page's section (it would hide the hub)
  for (const t of ['card-visibility-changed', 'll-rebuild', 'll-upgrade']) host.addEventListener(t, e => e.stopPropagation());
  (o.parent || document.body).appendChild(host);
  const pr = document.createElement('div'); pr.style.cssText = 'position:absolute;width:0;height:var(--hv-safe-top, env(safe-area-inset-top, 0px))'; sr.appendChild(pr);
  const safeT = pr.getBoundingClientRect().height || 0; pr.remove();
  const vw = innerWidth, vh = innerHeight, st = Math.round(Math.max(safeT + 10, vh * (vw > 700 ? 0.035 : 0.02)));
  host.style.setProperty('--st', (o.full ? 0 : st) + 'px'); host.style.setProperty('--sr', (o.full ? 0 : vw > 700 ? 22 : 16) + 'px');
  if (o.full) { hvFhOpen.add(host); host.setAttribute('full', ''); host.style.setProperty('--sft', safeT + 'px'); } // 1.31.1: full height, content below the safe area host.style.setProperty('--spx', Math.round(Math.max(12, Math.min(40, vw * 0.03))) + 'px');
  const fabs = [...document.querySelectorAll('homeview-edit-fab')]; fabs.forEach(f => { f.style.visibility = 'hidden'; });
  const L = () => (o.launch ? o.launch() : []).filter(Boolean), H = () => sh.offsetHeight || vh;
  let dyNow = 0, closed = false;
  const apply = (dy, anim, dur) => { dyNow = dy; const h = H(), p = Math.max(0, Math.min(1, 1 - dy / h)), d = (dur || 0.45) + 's ' + SHEET_EASE;
    sh.style.transition = anim ? 'transform ' + d : 'none'; sh.style.transform = `translate3d(0,${dy.toFixed(1)}px,0)`;
    scrim.style.transition = anim ? 'opacity ' + d : 'none'; scrim.style.opacity = p.toFixed(3);
    for (const el of L()) { el.style.transition = anim ? `transform ${d}, border-radius ${d}` : 'none'; el.style.transformOrigin = '50% 0';
      el.style.transform = p > 0.002 ? `translate3d(0,${(safeT * 0.6 * p + 8 * p).toFixed(1)}px,0) scale(${(1 - 0.075 * p).toFixed(4)})` : ''; el.style.borderRadius = p > 0.002 ? Math.round(18 * p) + 'px' : ''; } };
  const frame = () => { const r = sh.getBoundingClientRect(); return { x: r.left, y: r.top, w: sh.offsetWidth, h: sh.offsetHeight }; };
  apply(H(), false); const api = o.build ? o.build(bd, frame) || {} : {};
  sh.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(() => apply(0, true, 0.5)));
  setTimeout(() => dispatchEvent(new Event('hv-layout')), 60); setTimeout(() => dispatchEvent(new Event('hv-layout')), 560);
  const key = k => { if (k.key === 'Escape' && !sr.querySelector('homeview-room-picker') && !hvDialogOpen()) close(); };
  const close = () => { if (closed) return; closed = true; removeEventListener('keydown', key); const left = Math.max(0.2, 0.36 * (1 - dyNow / H()));
    apply(H(), true, left); setTimeout(() => { for (const el of L()) { el.style.transition = ''; el.style.transform = ''; el.style.borderRadius = ''; el.style.transformOrigin = ''; }
      host.remove(); fabs.forEach(f => { f.style.visibility = ''; }); if (o.onClose) o.onClose(); }, left * 1000 + 30); };
  sr.querySelector('.x').addEventListener('click', close); addEventListener('keydown', key);
  if (o.edit) hvPen(sr.querySelector('.x'), o.edit); // 1.32.0: edit pencil (admins)
  // drag to dismiss: from the pill / top strip, or anywhere while the content under the finger is scrolled to the top
  let g = null;
  const scroller = path => { for (const n of path) { if (n === sh) break; if (!(n instanceof Element)) continue;
    if (n.scrollHeight > n.clientHeight + 1) { const oy = getComputedStyle(n).overflowY; if (oy === 'auto' || oy === 'scroll') return n; } } return null; };
  sh.addEventListener('touchstart', e => { g = null; if (closed || e.touches.length !== 1) return; const t = e.touches[0], path = e.composedPath(), top = sh.getBoundingClientRect().top;
    const onGrab = path.includes(grab) || t.clientY - top < 34, sc = scroller(path); if (!onGrab && sc && sc.scrollTop > 1) return;
    // never steal a drag that starts on a slider / seek bar / text field; a sheet can narrow it further (o.dragOk)
    if (!onGrab && path.some(n => n instanceof Element && (/^(INPUT|TEXTAREA|SELECT|HA-SLIDER|HA-CONTROL-SLIDER|MD-SLIDER|HA-TEXTFIELD)$/.test(n.tagName) || n.getAttribute('role') === 'slider' || n.hasAttribute('data-no-sheet-drag')))) return;
    if (!onGrab && o.dragOk && !o.dragOk(path, t.clientY - top, sh.offsetHeight)) return;
    g = { x: t.clientX, y: t.clientY, t: Date.now(), on: false, dy: 0, grab: onGrab }; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (!g) return; const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
    if (!g.on) { if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      if (dy > 0 && (g.grab || dy >= Math.abs(dx) * 1.1)) { g.on = true; g.y0 = t.clientY; g.t = Date.now(); } else { g = null; return; } }
    if (e.cancelable) e.preventDefault(); g.dy = Math.max(0, t.clientY - g.y0); apply(g.dy, false); }, { passive: false });
  const end = () => { if (!g) return; const s0 = g; g = null; if (!s0.on) return; const v = s0.dy / Math.max(1, Date.now() - s0.t);
    if (s0.dy > H() * 0.22 || (v > 0.5 && s0.dy > 40)) close(); else apply(0, true, 0.38); };
  sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
  return { close, host, set hass(h) { if (api) api.hass = h; }, get dy() { return dyNow; } };
}
// fit a card inside a fixed box. Default "contain": centre it; picture-elements (e.g. the house hero) is scaled so the
// picture and all its labels fit, then centred on their combined bounds. With opt.zoom the picture is sized to zoom x the
// box width (cropped at the sides if > 1), sat low in the box with sky above, labels kept inside the box; opt.label scales
// the labels; opt.sky paints a scene sky (hvSky) behind it. The card keeps its own (glass) frame filling the box.
const HV_SKY_CSS = `.hv-sky{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:inherit;background:linear-gradient(180deg,var(--sky-t,#8cc9fb) 0%,var(--sky-b,#b4e4fe) 100%);transition:background 1.6s ease}
.hv-sky::after{content:'';position:absolute;inset:0;background:rgba(3,5,9,var(--sky-dim,0));transition:background 1.6s ease}
.hv-sky i{position:absolute;inset:-20%;display:none;pointer-events:none}
.hv-sky[fx=sun] .sun{display:block;background:radial-gradient(28% 28% at 82% 18%,rgba(255,246,214,.75) 0%,rgba(255,236,170,.25) 45%,rgba(255,236,170,0) 100%)}
.hv-sky[fx=clouds] .c1,.hv-sky[fx=rain] .c1,.hv-sky[fx=snow] .c1{display:block;background:radial-gradient(22% 9% at 20% 22%,rgba(255,255,255,.55),rgba(255,255,255,0) 70%),radial-gradient(26% 10% at 62% 14%,rgba(255,255,255,.5),rgba(255,255,255,0) 70%),radial-gradient(18% 7% at 88% 30%,rgba(255,255,255,.45),rgba(255,255,255,0) 70%);animation:hvskyc 70s linear infinite}
.hv-sky[fx=clouds] .c2,.hv-sky[fx=rain] .c2{display:block;background:radial-gradient(30% 11% at 35% 34%,rgba(255,255,255,.35),rgba(255,255,255,0) 70%),radial-gradient(24% 9% at 78% 8%,rgba(255,255,255,.35),rgba(255,255,255,0) 70%);animation:hvskyc 110s linear infinite reverse}
.hv-sky[fx=rain] .c1,.hv-sky[fx=rain] .c2{filter:brightness(.72) saturate(.6)}
.hv-sky[fx=rain] .rn{display:block;inset:0;background-image:repeating-linear-gradient(103deg,rgba(220,232,245,0) 0 9px,rgba(220,232,245,.38) 9px 10px,rgba(220,232,245,0) 10px 23px);background-size:46px 46px;-webkit-mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.25));mask-image:linear-gradient(180deg,#000,rgba(0,0,0,.25));animation:hvskyr .5s linear infinite}
.hv-sky[fx=snow] .sn{display:block;inset:0;background-image:radial-gradient(1.6px 1.6px at 10% 20%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 30% 70%,#fff 98%,transparent),radial-gradient(2px 2px at 55% 35%,#fff 98%,transparent),radial-gradient(1.4px 1.4px at 75% 80%,#fff 98%,transparent),radial-gradient(1.8px 1.8px at 90% 10%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 42% 92%,#fff 98%,transparent);background-size:90px 90px;opacity:.85;animation:hvskys 9s linear infinite}
.hv-sky[fx=stars] .st{display:block;inset:0;background-image:radial-gradient(1px 1px at 12% 18%,#fff 98%,transparent),radial-gradient(1px 1px at 34% 8%,#fff 98%,transparent),radial-gradient(1.4px 1.4px at 58% 26%,#fff 98%,transparent),radial-gradient(1px 1px at 72% 12%,#fff 98%,transparent),radial-gradient(1.2px 1.2px at 90% 34%,#fff 98%,transparent),radial-gradient(1px 1px at 22% 40%,#fff 98%,transparent),radial-gradient(1px 1px at 46% 46%,#fff 98%,transparent);background-size:140px 120px;-webkit-mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.2) 70%,transparent);mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.2) 70%,transparent);opacity:.7;animation:hvskyt 5s ease-in-out infinite alternate}
@keyframes hvskyc{from{transform:translateX(-12%)}to{transform:translateX(12%)}}
@keyframes hvskyr{from{background-position:0 0}to{background-position:-10px 46px}}
@keyframes hvskys{from{background-position:0 0}to{background-position:18px 90px}}
@keyframes hvskyt{from{opacity:.45}to{opacity:.8}}
@media (prefers-reduced-motion:reduce){.hv-sky i{animation:none !important}}`;
// the same sky as the example dashboard's scene background (sensor.house_scene + sun + moon phase), plus light weather effects
const HV_MOON_SKY = { new_moon: ['#0d0f0e', '#0d0f0e'], waxing_crescent: ['#121822', '#0d1013'], waning_crescent: ['#121822', '#0d1013'], first_quarter: ['#15202f', '#0e1218'], last_quarter: ['#15202f', '#0e1218'],
  waxing_gibbous: ['#182538', '#0e141d'], waning_gibbous: ['#182538', '#0e141d'], full_moon: ['#1b2a40', '#0f1622'] };
const HV_DAY_SKY = { sunny: ['#8cc9fb', '#b4e4fe'], cloudy: ['#9fb3c4', '#c4d1dc'], rainy: ['#5d6f80', '#8a9aa8'], snowy: ['#cfe0ee', '#eef4f9'] };
function hvSky(hass, entity, sim) {
  const S = (hass && hass.states) || {}, raw = sim || (S[entity || 'sensor.house_scene'] || {}).state || '', s = raw.replace('_open', '').replace('_off', '');
  const day = sim ? !/night/.test(raw) : (S['sun.sun'] || {}).state === 'above_horizon', moon = (HV_MOON_SKY[(S['sensor.moon_phase'] || {}).state] || HV_MOON_SKY.new_moon);
  let c = s === 'night' ? moon : day && HV_DAY_SKY[s] ? HV_DAY_SKY[s] : day ? HV_DAY_SKY.sunny : moon, dim = 0;
  if (/^night_off/.test(raw)) c = ['#05080e', '#020306']; else if (/^night/.test(raw)) dim = 0.45;
  const fx = s === 'rainy' ? 'rain' : s === 'snowy' ? 'snow' : s === 'cloudy' ? 'clouds' : !day || s === 'night' ? 'stars' : 'sun';
  return { top: c[0], bottom: c[1], dim, fx, sig: [c[0], c[1], dim, fx].join() };
}
function hvFitCard(el, W, H, pad, opt) {
  opt = opt || {}; const sr = el && el.shadowRoot, card = sr && sr.querySelector('ha-card'); if (!card || !W || !H) return false;
  let st = sr.querySelector('style[data-hv-fit]'); if (!st) { st = document.createElement('style'); st.setAttribute('data-hv-fit', ''); }
  if (sr.lastElementChild !== st) sr.appendChild(st); // last, so it wins over card-mod
  const root = card.querySelector('#root');
  const css = `ha-card{height:100% !important;box-sizing:border-box !important;padding:0 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;overflow:hidden !important;position:relative}`
    + (root ? `#root{position:relative;z-index:1;flex:none !important;width:var(--hv-fit-w,100%) !important;transform:translate(var(--hv-fit-x,0px),var(--hv-fit-y,0px)) scale(var(--hv-fit-k,1));transform-origin:50% 50%}` : '')
    + (opt.sky ? HV_SKY_CSS : '');
  if (st.textContent !== css) st.textContent = css;
  // sky layer (inside the glass frame, behind the picture; the picture's feathered edges blend into it)
  let sky = card.querySelector(':scope > .hv-sky');
  if (opt.sky) { if (!sky) { sky = document.createElement('div'); sky.className = 'hv-sky'; sky.innerHTML = '<i class="sun"></i><i class="c1"></i><i class="c2"></i><i class="rn"></i><i class="sn"></i><i class="st"></i>'; }
    if (card.firstElementChild !== sky) card.insertBefore(sky, card.firstChild);
    const k = opt.sky; sky.style.setProperty('--sky-t', k.top); sky.style.setProperty('--sky-b', k.bottom); sky.style.setProperty('--sky-dim', String(k.dim || 0)); sky.setAttribute('fx', k.fx || ''); }
  else if (sky) sky.remove();
  if (!root) return true;
  const S = (k, v) => card.style.setProperty(k, v);
  const labels = [...root.querySelectorAll('.element')].filter(e => e.tagName === 'BUTTON-CARD' || /hui-state-label|hui-state-badge/i.test(e.tagName));
  labels.forEach(e => { e.style.translate = ''; e.style.scale = ''; });
  const ext = all => { const rr = root.getBoundingClientRect(); let l = rr.left, t = rr.top, r = rr.right, b = rr.bottom;
    for (const e of root.querySelectorAll('.element')) { const x = e.getBoundingClientRect(); if (!x.height || !x.width) continue; if (!all && x.top < rr.bottom - 2) continue; l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom); }
    return { l, t, r, b, w: r - l, h: b - t, rr }; };
  S('--hv-fit-x', '0px'); S('--hv-fit-y', '0px'); S('--hv-fit-k', '1');
  const zoom = Number(opt.zoom) || 0, ls = Math.max(0.4, Math.min(3, Number(opt.label) || 1)), minD = 320;
  if (!zoom) { // contain: everything fits
    const iw = Math.max(40, W - 2 * pad), ih = Math.max(40, H - 2 * pad);
    S('--hv-fit-w', iw + 'px'); let e = ext(true); if (!e.rr.height) return false;
    const wt = Math.floor(iw * Math.min(1, iw / Math.max(1, e.w), ih / Math.max(1, e.h))), D = Math.max(wt, minD);
    S('--hv-fit-w', D + 'px'); e = ext(true); const k = Math.min(1, iw / Math.max(1, e.w), ih / Math.max(1, e.h)); S('--hv-fit-k', k.toFixed(4));
    if (ls !== 1) hvScaleLabels(root, labels, ls);
    e = ext(true); const cr = card.getBoundingClientRect();
    S('--hv-fit-x', Math.round((cr.left + cr.right) / 2 - (e.l + e.r) / 2) + 'px'); S('--hv-fit-y', Math.round((cr.top + cr.bottom) / 2 - (e.t + e.b) / 2) + 'px');
    return true; }
  // zoom: the picture is zoom x the box width; labels scaled; the picture + the labels under it sit low in the box (sky above)
  const D = Math.max(minD, Math.round(W * zoom)); S('--hv-fit-w', D + 'px'); const k = Math.max(0.1, W * zoom / D); S('--hv-fit-k', k.toFixed(4));
  if (ls !== 1) hvScaleLabels(root, labels, ls);
  let e = ext(false); if (!e.rr.height) return false; const cr = card.getBoundingClientRect();
  const free = H - e.h, dy = free > 0 ? cr.top + free * 0.78 - e.t : cr.top + (H - e.h) / 2 - e.t;
  S('--hv-fit-x', Math.round((cr.left + cr.right) / 2 - (e.rr.left + e.rr.right) / 2) + 'px'); S('--hv-fit-y', Math.round(dy) + 'px');
  // keep every label inside the box (nudged in, in the picture's own coordinates)
  const p2 = Math.max(6, pad * 0.6), cb = card.getBoundingClientRect();
  for (const lb of labels) { const x = lb.getBoundingClientRect(); if (!x.width) continue; let mx = 0, my = 0;
    if (x.left < cb.left + p2) mx = cb.left + p2 - x.left; else if (x.right > cb.right - p2) mx = cb.right - p2 - x.right;
    if (x.top < cb.top + p2) my = cb.top + p2 - x.top; else if (x.bottom > cb.bottom - p2) my = cb.bottom - p2 - x.bottom;
    if (mx || my) lb.style.translate = `${(mx / k).toFixed(1)}px ${(my / k).toFixed(1)}px`; }
  return true;
}
// labels grow from their anchor side (left labels from the left, right from the right, bottom ones from the centre)
function hvScaleLabels(root, labels, ls) { const rr = root.getBoundingClientRect(), mid = (rr.left + rr.right) / 2;
  for (const lb of labels) { const x = lb.getBoundingClientRect(); if (!x.width) continue; const c = (x.left + x.right) / 2, below = x.top >= rr.bottom - 4;
    lb.style.transformOrigin = below ? '50% 0' : c < mid - rr.width * 0.1 ? '0 0' : c > mid + rr.width * 0.1 ? '100% 0' : '50% 0'; lb.style.scale = String(ls); } }
// Is the Wallpanel screensaver enabled here? Same resolution as Wallpanel: dashboard config, wp_ URL params, profile,
// device.<browser_mod id> / user.<name> profiles, profile_entity; then enabled + enabled_on_views (this view).
const hvMerge = (a, b) => { const o = Object.assign({}, a); for (const k in b || {}) { const v = b[k];
  o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? hvMerge(o[k], v) : v; } return o; };
function hvWallpanelOn(hass, wp, view) {
  const w = ssWallpanel(); if (!w || typeof w.startScreensaver !== 'function') return false;
  const q = new URLSearchParams(location.search); if (q.get('edit') === '1') return false;
  const base = Object.assign({}, wp || {}); if (base.enabled_on_tabs && !base.enabled_on_views) base.enabled_on_views = base.enabled_on_tabs;
  let c = hvMerge({ enabled: false, enabled_on_views: [] }, base); const qp = {};
  for (const [k0, v0] of q) { if (!k0.startsWith('wp_')) continue; let k = k0.slice(3), v = v0; if (k === 'enabled_on_tabs') k = 'enabled_on_views';
    try { v = JSON.parse(v0); } catch (e) {} if (k === 'enabled_on_views' && typeof v === 'string') v = v.split(','); qp[k] = v; }
  c = hvMerge(c, qp); const P = c.profiles || {};
  if (c.profile && P[c.profile]) c = hvMerge(c, P[c.profile]);
  const bm = window.browser_mod, dev = bm && (bm.entity_id || (bm.browserID && String(bm.browserID).replace('-', '_')));
  if (dev && P['device.' + dev]) c = hvMerge(c, P['device.' + dev]);
  const u = hass && hass.user; for (const n of [u && u.id, u && u.username, u && u.name]) { if (!n) continue; const k = 'user.' + String(n).toLowerCase().replace(/\s/g, '_'); if (P[k]) { c = hvMerge(c, P[k]); break; } }
  c = hvMerge(c, qp); const pe = c.profile_entity, ps = pe && hass && hass.states[pe] && hass.states[pe].state; if (ps && P[ps]) c = hvMerge(c, P[ps]);
  if (!c.enabled) return false; const ev = c.enabled_on_views; return !(Array.isArray(ev) && ev.length && view && !ev.includes(view));
}
/* ---------------- launch hub (Apple home hub style) ---------------- */
// NotHomeView Hub: a full-screen launch page like the Apple home hub: greeting + the user's name (top left), their avatar
// (top right), a 2 x 2 grid of iOS-style app icons and a Photos widget cycling the Wallpanel photos with a crossfade, a
// heavily blurred, enlarged copy of the current photo as the page background under a see-through tint (Background
// transparency: 0 = the classic near-opaque gradient, 100 = clear photo; no photo = the gradient), and optionally a wide calendar.
// Photos are only read from Home Assistant (media source browse / resolve), never stored.
const HUB_HOME_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="hvh1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb340"/><stop offset="1" stop-color="#ff7a00"/></linearGradient>
<linearGradient id="hvh2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffa21f"/></linearGradient></defs>
<path d="M50 13 L88 44.5 Q90 46.3 90 49 L90 83 Q90 88 85 88 L15 88 Q10 88 10 83 L10 49 Q10 46.3 12 44.5 Z" fill="url(#hvh1)"/>
<path d="M50 30 L75 51 Q76.5 52.3 76.5 54.3 L76.5 78 Q76.5 81 73.5 81 L26.5 81 Q23.5 81 23.5 78 L23.5 54.3 Q23.5 52.3 25 51 Z" fill="url(#hvh2)"/>
<path d="M50 46 L63 57 L63 75 L37 75 L37 57 Z" fill="#fff3d6"/><rect x="45" y="62" width="10" height="13" rx="2" fill="#ffb340"/></svg>`;
const HUB_APPS = [
  { name: 'Home', icon: 'hv:home', color_from: '#ffffff', color_to: '#ededf2', kind: 'navigate', navigation_path: 'home' },
  { name: 'Security', icon: 'mdi:shield-home', color_from: '#5b8cff', color_to: '#2b3fd6', kind: 'navigate', navigation_path: 'security' },
  { name: 'Music', icon: 'mdi:music-note', color_from: '#ff6b81', color_to: '#f5163d', kind: 'now_playing' },
  { name: 'Weather', icon: 'mdi:weather-partly-cloudy', color_from: '#5ec8ff', color_to: '#1a73e8', kind: 'weather' }];
const HUB_CSS = `:host{display:block;position:relative;font-family:${FONT};color:#fff;-webkit-tap-highlight-color:transparent}
.bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;background:var(--hv-wall,radial-gradient(120% 90% at 20% 10%,#4b3a66 0%,#1c1a33 55%,#0d0f1a 100%))}
:host([contained]) .bg{position:absolute;border-radius:24px;z-index:0}
.bgi{position:absolute;inset:calc(-2 * var(--blur,32px));background-size:cover;background-position:center;filter:blur(var(--blur,32px)) saturate(1.35);transform:scale(1.08);opacity:0;transition:opacity 2.2s ease}
.bgi.on{opacity:1}
:host(:not([bgphoto])) .bgi{display:none}
.tint{position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 10%,#4b3a66 0%,#1c1a33 55%,#0d0f1a 100%);opacity:var(--tint,.24);transition:opacity .2s ease}
:host(:not([bgphoto])) .tint{display:none}
.dim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,calc(var(--dim,.35) + .08)) 0%,rgba(0,0,0,var(--dim,.35)) 40%,rgba(0,0,0,calc(var(--dim,.35) + .12)) 100%)}
:host([bgphoto]) .dim{--dk:calc(var(--dim,.32) * var(--dsc,.55));--m:var(--dmix,0);background:linear-gradient(180deg,rgba(0,0,0,calc(var(--m) * (var(--dim,.32) + .08) + (1 - var(--m)) * var(--dk) * .95)) 0%,rgba(0,0,0,calc(var(--m) * (var(--dim,.32) + .01) + (1 - var(--m)) * var(--dk) * .38)) 35%,rgba(0,0,0,calc(var(--m) * (var(--dim,.32) + .04) + (1 - var(--m)) * var(--dk) * .32)) 60%,rgba(0,0,0,calc(var(--m) * (var(--dim,.32) + .12) + (1 - var(--m)) * var(--dk) * .88)) 100%),rgba(255,255,255,calc(var(--bgt,.6) * .09))}
.w{position:relative;z-index:1;box-sizing:border-box;display:flex;flex-direction:column;padding:var(--pt,24px) var(--px,32px) var(--pb,20px);gap:var(--gap,24px);min-height:var(--h,auto)}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex:none}
.gr{text-transform:uppercase;font-size:var(--gfs,22px);line-height:1.22;letter-spacing:.01em;text-shadow:0 1px 8px rgba(0,0,0,.25);min-width:0}
.g1{font-weight:400;color:rgba(255,255,255,.82)} .g2{font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.av{all:unset;cursor:pointer;flex:none;width:var(--av,64px);height:var(--av,64px);border-radius:50%;box-sizing:border-box;padding:3px;
 background:var(--ring,linear-gradient(150deg,#c7b8ff,#8f7bf0));box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .12s ease}
.av:active{transform:scale(.95)}
.tr{display:flex;align-items:center;gap:calc(var(--av,64px) * .22);flex:none}
.amic{all:unset;cursor:pointer;flex:none;width:calc(var(--av,64px) * .78);height:calc(var(--av,64px) * .78);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 4px 14px rgba(0,0,0,.2);transition:transform .12s ease}
.amic:active{transform:scale(.94)} .amic ha-icon{--mdc-icon-size:calc(var(--av,64px) * .4);display:flex}
.tpill{all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;height:calc(var(--av,64px) * .6);padding:0 14px;border-radius:999px;background:rgba(255,159,10,.22);color:#ffb340;font-weight:700;font-variant-numeric:tabular-nums;font-size:calc(var(--av,64px) * .28);border:1px solid rgba(255,159,10,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)} .tpill[hidden]{display:none} .tpill ha-icon{--mdc-icon-size:calc(var(--av,64px) * .32);display:flex}
.av .pic{width:100%;height:100%;border-radius:50%;background:#2a2a40 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:calc(var(--av,64px) * .4)}
.mid{display:flex;gap:var(--cg2,40px);align-items:flex-start;flex:none}
.apps{display:grid;grid-template-columns:repeat(var(--ac,2),var(--I,110px));column-gap:var(--cg,40px);row-gap:var(--rg,22px)}
.app{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:var(--lg,9px);width:var(--I,110px)}
.ico{width:var(--I,110px);height:var(--I,110px);border-radius:22.5%;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
 box-shadow:0 calc(var(--I) * .06) calc(var(--I) * .16) rgba(0,0,0,.28);transition:transform .14s ease,filter .14s ease}
.ico::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 1px 0 rgba(255,255,255,.35);pointer-events:none}
.app:active .ico,.pw:active{transform:scale(.94);filter:brightness(.92)}
.app:focus-visible .ico,.pw:focus-visible{outline:3px solid rgba(255,255,255,.8);outline-offset:3px}
.ico ha-icon{--mdc-icon-size:calc(var(--I,110px) * .58);display:flex;filter:drop-shadow(0 1px 2px rgba(0,0,0,.12))}
.ico svg{width:80%;height:80%}
.lb{font-size:var(--lfs,17px);line-height:var(--lh,22px);font-weight:500;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.35);white-space:nowrap;max-width:calc(var(--I,110px) + var(--cg,40px));overflow:hidden;text-overflow:ellipsis}
.phw{display:flex;flex-direction:column;align-items:center;gap:var(--lg,9px);flex:none}
.pw{all:unset;cursor:pointer;position:relative;width:var(--pw,300px);height:var(--ph,290px);border-radius:calc(var(--I,110px) * .26);overflow:hidden;background:rgba(255,255,255,.12);
 box-shadow:0 calc(var(--I) * .06) calc(var(--I) * .2) rgba(0,0,0,.3);transition:transform .14s ease,filter .14s ease}
.pi{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity var(--fade,1.6s) ease}
.pi.on{opacity:1}
.pw .ph0{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.75)} .pw .ph0 ha-icon{--mdc-icon-size:calc(var(--I) * .5)}
.row{display:flex;gap:var(--cg2,40px);align-items:flex-start;flex:none;min-width:0}
.tile{position:relative;flex:none;width:var(--tw,300px);height:var(--th,var(--ph,290px))}
.tile > *{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;--hv-aspect:auto}
.below{display:flex;flex-wrap:wrap;gap:var(--cg2,40px);flex:none} .below[hidden]{display:none}
.calw{flex:1 1 0;min-height:var(--calmin,240px);position:relative}
.calw > *{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto}
.empty{opacity:.7;padding:12px}
.ssp{position:fixed;left:50%;top:calc(var(--hv-safe-top, env(safe-area-inset-top, 0px)) + 5px);width:38px;height:5px;margin-left:-19px;border-radius:3px;background:rgba(255,255,255,.55);box-shadow:0 1px 4px rgba(0,0,30,.25);pointer-events:none;z-index:3}
.ssp[hidden],:host([contained]) .ssp{display:none}
.tile.fit > *{cursor:pointer}
.ssv{position:fixed;inset:0;z-index:0;display:none;overflow:hidden;pointer-events:none;background:#000;will-change:transform;transform:translate3d(0,-100%,0)}
.ssin{position:absolute;inset:0;will-change:transform}
.ssb,.sss{position:absolute;inset:0;background:#111 center/cover no-repeat}
.ssb{inset:-60px;filter:blur(28px) brightness(.75);transform:scale(1.04)} .sss{opacity:0;will-change:opacity}
.ssg{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15) 40%,rgba(0,0,0,.45))}
.ssc{position:absolute;left:0;right:0;top:3vh;text-align:center;color:rgba(255,255,255,.62);text-shadow:0 .4vh 4vh rgba(0,0,0,.16);opacity:0;will-change:opacity;
  font-family:ui-rounded,"SF Pro Rounded","Nunito",-apple-system,BlinkMacSystemFont,sans-serif}
.sst{font-size:min(40vh,27vw);font-weight:500;line-height:1;letter-spacing:-.005em} .ssd{display:none}
.wpn{position:fixed;left:50%;bottom:calc(10px + var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px)));transform:translateX(-50%);z-index:3;max-width:calc(100vw - 32px);box-sizing:border-box;
 padding:5px 12px;border-radius:999px;font-size:12px;line-height:1.3;text-align:center;color:rgba(255,255,255,.85);background:rgba(0,0,0,.30);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:none}
:host([contained]) .wpn{position:absolute}`;
const hubWeatherBg = (cond, night) => {
  const n = night, g = { sunny: ['#2f86e0', '#8cc8f5'], 'clear-night': ['#0b1736', '#2a3d75'], partlycloudy: n ? ['#141d3a', '#3a4a72'] : ['#3d7fd0', '#9cc3e8'],
    cloudy: n ? ['#1d2333', '#40485c'] : ['#5d7190', '#a9b7c9'], rainy: ['#33445c', '#6c7d93'], pouring: ['#2a3446', '#5b6a80'], lightning: ['#252a3d', '#555b78'], 'lightning-rainy': ['#252a3d', '#555b78'],
    snowy: ['#8399b2', '#d3dce8'], 'snowy-rainy': ['#6d7f95', '#b8c4d2'], fog: ['#7e8a98', '#c0c7cf'], hail: ['#4c5a6e', '#98a6b6'], windy: ['#4a7cc0', '#a6c4e2'], 'windy-variant': ['#4a7cc0', '#a6c4e2'] }[cond] || (n ? ['#101a36', '#33406a'] : ['#3c7fd2', '#9cc6ec']);
  const clouds = /cloud|rain|pour|snow|fog|lightning|hail/.test(cond) ? `radial-gradient(60% 35% at 30% 18%,rgba(255,255,255,${n ? .10 : .45}),transparent 70%),radial-gradient(55% 30% at 75% 26%,rgba(255,255,255,${n ? .08 : .38}),transparent 70%),` : '';
  const sun = cond === 'sunny' || (cond === 'partlycloudy' && !n) ? 'radial-gradient(30% 22% at 18% 6%,rgba(255,250,220,.55),transparent 70%),' : '';
  return `${sun}${clouds}linear-gradient(180deg,${g[0]} 0%,${g[1]} 100%)`; };
const HUB_WX_COLOR = { sunny: '#ffd60a', 'clear-night': '#f2f2f7', rainy: '#9fd8ff', pouring: '#9fd8ff', lightning: '#ffe066', 'lightning-rainy': '#ffe066' };

/* 1.31.0: illustrated sky header for the weather sheet (opt-in: Home Screen card `weather_sky_header: true`).
   The live condition picks one of five skies (sunny, partly cloudy, cloudy, rain, snow), with a night version when the sun is
   down. Pure CSS + small inline SVG tiles; only transform / opacity are animated (cheap on a wall tablet); no motion when the
   device asks for reduced motion. */
const WX_SKY_KIND = c => /^(sunny|clear-night)$/.test(c) ? 'sunny' : /^(partlycloudy|windy|windy-variant)$/.test(c) ? 'partly'
  : /^(rainy|pouring|lightning|lightning-rainy|hail)$/.test(c) ? 'rain' : /^(snowy|snowy-rainy)$/.test(c) ? 'snow' : /^(cloudy|fog|exceptional)$/.test(c) ? 'cloudy' : 'partly';
const WX_SKY_G = { sunny: [['#1260cc', '#3b8ae4', '#8ec6f3'], ['#040b22', '#0f1d4a', '#2a3c72']], partly: [['#2468c8', '#5797e0', '#a6cbee'], ['#071030', '#16244c', '#33457a']],
  cloudy: [['#53667e', '#7b8da4', '#b3bfcd'], ['#121824', '#252d3c', '#434c60']], rain: [['#2b384b', '#48586e', '#7a899d'], ['#0c121b', '#1b2331', '#384254']],
  snow: [['#6f86a1', '#9cafc5', '#d8e0ea'], ['#1c2536', '#364259', '#5c6982']] };
const WX_SKY_PN = { sunny: 'rgba(14,52,120,.26)', partly: 'rgba(16,52,116,.26)', cloudy: 'rgba(36,46,62,.26)', rain: 'rgba(14,22,34,.32)', snow: 'rgba(52,68,92,.26)', night: 'rgba(6,12,30,.36)' };
const wxSvg = b => `url('data:image/svg+xml,${encodeURIComponent(b).replace(/'/g, '%27')}')`;
const wxCloud = (t, b, o) => wxSvg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 130'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${t}'/><stop offset='1' stop-color='${b}'/></linearGradient><filter id='f' x='-15%' y='-25%' width='130%' height='150%'><feGaussianBlur stdDeviation='4.6'/></filter></defs><g fill='url(#g)' filter='url(#f)' opacity='${o}'><circle cx='72' cy='74' r='34'/><circle cx='114' cy='54' r='44'/><circle cx='94' cy='40' r='26'/><circle cx='140' cy='46' r='30'/><circle cx='162' cy='70' r='33'/><circle cx='194' cy='88' r='22'/><circle cx='44' cy='92' r='22'/><circle cx='26' cy='102' r='12'/><circle cx='214' cy='100' r='12'/><rect x='44' y='78' width='152' height='34' rx='17'/></g></svg>`);
const WX_RAIN = (h, op) => wxSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='150' height='${h}'><g stroke='#dbe8ff' stroke-linecap='round' stroke-width='1.4' opacity='${op}'>` +
  [[8, .1], [31, .55], [52, .25], [77, .7], [96, .05], [118, .45], [139, .8]].map(([x, y]) => `<line x1='${x}' y1='${Math.round(y * h * .7)}' x2='${x}' y2='${Math.round(y * h * .7 + h * .26)}'/>`).join('') + '</g></svg>');
const WX_SNOW = (w, n, r, op) => { let k = 7, pts = ''; for (let i = 0; i < n; i++) { k = (k * 9301 + 49297) % 233280; const x = k / 233280 * w; k = (k * 9301 + 49297) % 233280; const y = k / 233280 * w; k = (k * 9301 + 49297) % 233280;
  pts += `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='${(r * (.6 + k / 233280 * .8)).toFixed(1)}'/>`; }
  return wxSvg(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${w}'><g fill='#fff' opacity='${op}'>${pts}</g></svg>`); };
const WX_STARS = WX_SNOW(260, 26, 1.05, .85);
// clouds per sky: [left %, top %, width %, drift seconds, delay, layer opacity]
const WX_CLOUDS = { sunny: [], partly: [[54, 0, 56, 70, -20, 1], [-10, 20, 42, 90, -50, .92], [74, 34, 34, 80, -10, .8]],
  cloudy: [[-14, -6, 64, 90, -30, 1], [36, -10, 70, 110, -70, 1], [6, 16, 58, 80, -10, .95], [56, 18, 56, 100, -40, .95], [-10, 34, 50, 120, -90, .8], [52, 38, 54, 95, -5, .8]],
  rain: [[-14, -8, 66, 90, -30, 1], [36, -12, 72, 110, -70, 1], [4, 12, 60, 80, -10, 1], [54, 14, 58, 100, -40, 1], [-6, 30, 52, 120, -60, .9], [50, 32, 56, 95, -5, .9]],
  snow: [[-12, -8, 64, 100, -30, 1], [38, -10, 68, 120, -70, 1], [8, 14, 56, 90, -10, .9], [58, 18, 52, 110, -40, .9]] };
const WX_CLOUD_COL = { partly: ['#ffffff', '#dfe7f1', .95], cloudy: ['#eef2f6', '#a9b5c4', .95], rain: ['#a3adbb', '#5d6879', .97], snow: ['#f4f7fa', '#c3ccd8', .95] };
const WX_CLOUD_NIGHT = { partly: ['#5b6888', '#2b3554', .85], cloudy: ['#4d5669', '#262d3c', .95], rain: ['#3d4556', '#1c222e', .97], snow: ['#7d889e', '#4a546a', .9] };
function wxSkyHtml(kind, night, cond) {
  const cl = WX_CLOUDS[kind] || [], col = (night ? WX_CLOUD_NIGHT : WX_CLOUD_COL)[kind], img = col ? wxCloud(col[0], col[1], col[2]) : '';
  let h = '';
  if (night) h += `<i class="stars" style="background-image:${WX_STARS}"></i>` + (kind === 'sunny' || kind === 'partly' ? '<i class="moon"></i>' : '');
  else if (kind === 'sunny' || kind === 'partly') h += '<i class="sun"></i><i class="halo"></i>';
  else if (kind === 'cloudy' || kind === 'snow') h += '<i class="glow"></i>';
  h += cl.map(([l, t, w, d, dl, o], i) => `<i class="cl" style="left:${l}%;top:${t}%;width:${w}%;opacity:${o};background-image:${img};animation-duration:${d}s;animation-delay:${dl}s;animation-direction:${i % 2 ? 'alternate-reverse' : 'alternate'}"></i>`).join('');
  if (kind === 'rain') { const heavy = /pouring|lightning|hail/.test(cond);
    h += `<b class="pw"><i class="rn r1" style="background-image:${WX_RAIN(140, .55)}"></i><i class="rn r2" style="background-image:${WX_RAIN(90, .35)}"></i>${heavy ? `<i class="rn r3" style="background-image:${WX_RAIN(110, .5)}"></i>` : ''}</b>`;
    if (/lightning/.test(cond)) h += '<i class="flash"></i>'; }
  if (kind === 'snow') h += `<b class="pw sw"><i class="sn s1" style="background-image:${WX_SNOW(220, 16, 2.6, .95)}"></i><i class="sn s2" style="background-image:${WX_SNOW(140, 14, 1.6, .7)}"></i>${/rain/.test(cond) ? `<i class="rn r2" style="background-image:${WX_RAIN(90, .3)}"></i>` : ''}</b>`;
  if (cond === 'fog') h += '<i class="haze"></i>';
  return h + '<i class="scr"></i>'; }
const WX_SKY_CSS = `.wxh{position:absolute;left:0;right:0;top:0;height:min(82%,720px);overflow:hidden;pointer-events:none;opacity:0;transition:opacity .5s ease;
 -webkit-mask-image:linear-gradient(180deg,#000 62%,transparent);mask-image:linear-gradient(180deg,#000 62%,transparent)}
:host(.in) .wxh{opacity:1}
.wxh i,.wxh b{position:absolute;display:block}
.wxh .sun{left:6%;top:-16%;width:min(60vmin,520px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fffef6 0 7%,rgba(255,248,214,.92) 11%,rgba(255,236,170,.45) 24%,rgba(255,226,150,.16) 42%,transparent 66%);animation:wxp 7s ease-in-out infinite alternate}
.wxh .halo{left:50%;top:44%;width:min(120vmin,1100px);aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,transparent 52%,rgba(255,255,255,.05) 55%,rgba(255,240,220,.07) 57%,transparent 61%)}
.wxh .glow{left:20%;top:-30%;width:min(80vmin,700px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 65%)}
.wxh .moon{right:12%;top:9%;width:min(11vmin,90px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 36% 34%,#fffdf4 0 34%,#ece7d6 70%,#d9d3c0);box-shadow:0 0 30px 6px rgba(255,250,225,.28),0 0 90px 30px rgba(190,205,255,.12)}
.wxh .stars{inset:0 0 25% 0;background-size:260px 260px;animation:wxt 5s ease-in-out infinite alternate}
.wxh .cl{aspect-ratio:240/130;background:center/100% 100% no-repeat;animation:wxd 80s ease-in-out infinite alternate;will-change:transform}
.wxh .pw{inset:-10% -15% 0 -15%;transform:rotate(9deg);overflow:hidden}
.wxh .rn{left:0;right:0;top:-140px;bottom:0;background-repeat:repeat;animation:wxr .55s linear infinite;will-change:transform}
.wxh .rn.r1{background-size:150px 140px} .wxh .rn.r2{top:-90px;background-size:150px 90px;animation-duration:.42s;background-position:60px 0} .wxh .rn.r3{top:-110px;background-size:150px 110px;animation-duration:.48s;background-position:100px 0}
.wxh .sw{transform:none;animation:wxs 6s ease-in-out infinite alternate}
.wxh .sn{left:0;right:0;top:-220px;bottom:0;background-size:220px 220px;animation:wxf 9s linear infinite;will-change:transform}
.wxh .sn.s2{top:-140px;background-size:140px 140px;animation:wxf2 6s linear infinite}
.wxh .flash{inset:0;background:rgba(235,240,255,.55);opacity:0;animation:wxl 9s linear infinite}
.wxh .scr{left:50%;top:6%;width:min(70vmin,620px);height:min(56vmin,480px);transform:translateX(-50%);background:radial-gradient(closest-side,rgba(10,25,55,.20),rgba(10,25,55,.08) 60%,transparent)}
.wxh .haze{left:0;right:0;bottom:0;height:55%;background:linear-gradient(180deg,transparent,rgba(225,230,236,.55))}
@keyframes wxd{from{transform:translate3d(-7%,0,0)}to{transform:translate3d(7%,0,0)}}
@keyframes wxp{from{opacity:.85;transform:scale(.97)}to{opacity:1;transform:scale(1.03)}}
@keyframes wxt{from{opacity:.55}to{opacity:1}}
@keyframes wxr{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,140px,0)}}
.wxh .rn.r2{animation-name:wxr2} @keyframes wxr2{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,90px,0)}}
.wxh .rn.r3{animation-name:wxr3} @keyframes wxr3{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,110px,0)}}
@keyframes wxf{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,220px,0)}}
@keyframes wxf2{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,140px,0)}}
@keyframes wxs{from{transform:translate3d(-12px,0,0)}to{transform:translate3d(12px,0,0)}}
@keyframes wxl{0%,90%,100%{opacity:0}91%{opacity:.9}92%{opacity:.1}93.5%{opacity:.7}96%{opacity:0}}
:host([sky]) .hero{position:relative;margin:clamp(14px,7vh,80px) 0 clamp(22px,9vh,96px);text-shadow:0 1px 2px rgba(0,0,0,.12),0 2px 16px rgba(0,0,0,.26)}
:host([sky][k=snow]:not([night])) .hero,:host([sky][k=cloudy]:not([night])) .hero{text-shadow:0 1px 3px rgba(0,0,0,.18),0 2px 18px rgba(0,0,0,.30)}
:host([sky]) .pn{background:var(--wx-pn);border-color:rgba(255,255,255,.16)}
:host([sky][wday]) .pn{background:rgba(255,255,255,.80);border-color:rgba(255,255,255,.7);color:#1c1c1e;box-shadow:0 6px 24px rgba(20,30,60,.10);backdrop-filter:blur(22px) saturate(140%);-webkit-backdrop-filter:blur(22px) saturate(140%)}
:host([sky][wday]) .pt{color:rgba(60,60,67,.66);border-bottom-color:rgba(60,60,67,.14)}
:host([sky][wday]) .dl .d{border-bottom-color:rgba(60,60,67,.10)} :host([sky][wday]) .dl .lo{color:rgba(60,60,67,.55)} :host([sky][wday]) .dl .rng{background:rgba(60,60,67,.12)}
:host([sky][wday]) .h .p{color:#0a7ad9}
@media (prefers-reduced-motion:reduce){.wxh *{animation:none !important}}`;
// icon colours on the white (Day) forecast panels
const HUB_WX_COLOR_DAY = { sunny: '#f2a900', 'clear-night': '#5e5ce6', partlycloudy: '#7c8794', cloudy: '#8e8e93', rainy: '#0a84ff', pouring: '#0a6fd6', lightning: '#e0a100', 'lightning-rainy': '#e0a100', snowy: '#64a8e0', 'snowy-rainy': '#5b9bd5', fog: '#8e8e93', hail: '#5b9bd5', windy: '#6e7c8c', 'windy-variant': '#6e7c8c' };
const WX_CSS = `:host{position:fixed;inset:0;z-index:8;font-family:${FONT};color:#fff;-webkit-tap-highlight-color:transparent}
.sky{position:absolute;inset:0;opacity:0;transition:opacity .3s ease} :host(.in) .sky{opacity:1}
.sc{position:absolute;inset:0;overflow:auto;box-sizing:border-box;padding:max(18px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));
 display:flex;flex-direction:column;align-items:center;opacity:0;transform:translateY(14px);transition:opacity .3s ease,transform .35s cubic-bezier(.2,.9,.3,1)}
:host(.in) .sc{opacity:1;transform:none}
.bar{align-self:stretch;display:flex;justify-content:space-between;align-items:center;min-height:44px;position:relative}
.bar::before{content:'';position:absolute;left:50%;top:-10px;width:38px;height:5px;margin-left:-19px;border-radius:3px;background:rgba(255,255,255,.6)}
.clk{font-size:20px;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.2)}
.x{all:unset;cursor:pointer;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.2);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.x ha-icon{--mdc-icon-size:24px;display:flex}
.hero{text-align:center;text-shadow:0 1px 10px rgba(0,0,0,.18);margin:clamp(4px,3vh,40px) 0 clamp(14px,4vh,48px)}
.loc{font-size:clamp(28px,4.6vmin,46px);font-weight:500;letter-spacing:-.01em}
.tmp{font-size:clamp(84px,17vmin,170px);font-weight:200;line-height:1;margin:2px 0 4px 0.12em;letter-spacing:-.03em}
.cnd{font-size:clamp(18px,2.8vmin,26px);font-weight:500} .hl{font-size:clamp(17px,2.6vmin,24px);font-weight:500;margin-top:2px}
.pn{box-sizing:border-box;width:min(100%,980px);border-radius:24px;padding:14px 18px 16px;margin-bottom:14px;
 background:rgba(30,60,120,.22);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%)}
.pt{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.72);padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.16)}
.pt ha-icon{--mdc-icon-size:16px;display:flex}
.hr{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding-top:12px;overscroll-behavior-x:contain} .hr::-webkit-scrollbar{display:none}
.h{flex:none;min-width:62px;display:flex;flex-direction:column;align-items:center;gap:10px;font-size:16px;font-weight:600}
.h .t{font-size:15px} .h .t small{font-size:12px;font-weight:600;margin-left:1px} .h ha-icon{--mdc-icon-size:30px;display:flex} .h .p{font-size:12px;color:#9fd8ff;margin-top:-8px;min-height:14px}
.dl .d{display:grid;grid-template-columns:minmax(70px,1fr) 36px 52px minmax(80px,2.2fr) 52px;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid rgba(255,255,255,.12);font-size:17px;font-weight:600}
.dl .d:last-child{border-bottom:0} .dl ha-icon{--mdc-icon-size:26px;display:flex} .dl .lo{color:rgba(255,255,255,.62);text-align:right}
.dl .rng{height:5px;border-radius:5px;background:rgba(0,0,0,.18);position:relative;overflow:hidden} .dl .rng i{position:absolute;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#8fd5ff,#ffd60a,#ff9f0a)}
@media (min-width:900px) and (orientation:landscape){.grid2{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;width:min(100%,1100px);align-items:start}.grid2 .pn{width:auto;margin:0;min-width:0}}`;
const hvPreload = u => new Promise((ok, no) => { const im = new Image(); im.onload = ok; im.onerror = no; im.src = u; if (im.decode) im.decode().then(ok, () => {}); });

/* Photo loader (1.30.2): the viewer's Previous / Next and the gallery used to fetch full-size photos from Home Assistant (often 2-8 MB over the cloud link) one
   neighbour at a time, with no limit and no memory. Now: a small priority queue with at most 3 downloads at once (0 = the photo you asked for, 1-4 = the next 2
   and previous 2, 5 = gallery thumbnails), the decoded images of the most recent photos are kept (LRU), and every photo that is downloaded also leaves a small
   thumbnail (memory + IndexedDB) so the gallery and a not-yet-loaded photo can be shown at once, the next time without downloading anything. */
const HVL = (() => {
  const MAXC = 3, LRU_MAX = 9, Q = [], lru = new Map(), jobs = new Map(), TH = new Map(); let act = 0, seq = 0, dbp = null;
  const pump = () => { while (act < MAXC && Q.length) { Q.sort((a, b) => a.p - b.p || a.n - b.n); Q.shift().run(); } };
  const db = () => dbp || (dbp = new Promise(ok => { try { const r = indexedDB.open('hv-photo-thumbs', 1); r.onupgradeneeded = () => r.result.createObjectStore('t'); r.onsuccess = () => ok(r.result); r.onerror = r.onblocked = () => ok(null); } catch (e) { ok(null); } }));
  const idb = async (mode, fn) => { const d = await db(); if (!d) return null; return new Promise(ok => { try { const tx = d.transaction('t', mode), rq = fn(tx.objectStore('t')); tx.oncomplete = () => ok(rq && rq.result); tx.onerror = tx.onabort = () => ok(null); } catch (e) { ok(null); } }); };
  const thumb = async id => { if (TH.has(id)) return TH.get(id); const b = await idb('readonly', s => s.get(id));
    if (b && b.blob) { const u = URL.createObjectURL(b.blob); if (!TH.has(id)) TH.set(id, u); return TH.get(id); } return null; };
  const idle = f => { try { if (window.requestIdleCallback) return requestIdleCallback(f, { timeout: 4000 }); } catch (e) { /* fall through */ } return setTimeout(f, 600); };
  const makeThumb = (id, im) => new Promise(ok => { try { if (!id || TH.has(id)) return ok(TH.get(id) || null); const w = im.naturalWidth, h = im.naturalHeight; if (!w || !h) return ok(null);
    const k = Math.min(1, 360 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k)), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const fin = () => { try { c.toBlob(bl => { if (!bl) return ok(null); const u = URL.createObjectURL(bl); TH.set(id, u); idb('readwrite', s => s.put({ blob: bl, t: Date.now() }, id)); ok(u); }, 'image/jpeg', 0.72); } catch (e) { ok(null); } }; // a photo from another site (album link) can't be copied: no cached thumbnail
    const plain = () => { c.getContext('2d').drawImage(im, 0, 0, cw, ch); fin(); };
    if (window.createImageBitmap) createImageBitmap(im, { resizeWidth: cw, resizeHeight: ch, resizeQuality: 'medium' }).then(bm => { c.getContext('2d').drawImage(bm, 0, 0); if (bm.close) bm.close(); fin(); }, plain); else plain(); } catch (e) { ok(null); } });
  const keep = (url, im) => { lru.delete(url); lru.set(url, im); while (lru.size > LRU_MAX) lru.delete(lru.keys().next().value); };
  // load(url, priority, id, { keep: false } for thumbnails only) -> Promise<Image> (decoded). .cancel() drops it while it is still waiting in the queue.
  const load = (url, p, id, o) => { o = o || {}; const hit = lru.get(url); if (hit) { keep(url, hit); return Object.assign(Promise.resolve(hit), { cancel() {} }); }
    let j = jobs.get(url); if (j) { j.p = Math.min(j.p, p); if (o.keep !== false) j.keep = true; if (id && !j.id) j.id = id; return j.pr; }
    j = { url, p, n: seq++, id, keep: o.keep !== false, started: false };
    j.pr = new Promise((ok, no) => { j.no = no;
      j.run = () => { j.started = true; act++; const im = new Image(); let fin = false;
        const end = (err, v) => { if (fin) return; fin = true; clearTimeout(tm); act--; jobs.delete(url); if (err) no(err); else ok(v); pump(); };
        const tm = setTimeout(() => { im.src = ''; end(new Error('timeout')); }, 90000);
        im.decoding = 'async'; im.onerror = () => end(new Error('load'));
        im.onload = async () => { try { if (im.decode) await im.decode(); } catch (e) { /* still usable */ }
          if (j.keep) keep(url, im); if (j.id) { if (j.keep) idle(() => makeThumb(j.id, im)); else await makeThumb(j.id, im); } end(null, im); };
        im.src = url; }; });
    j.pr.catch(() => {}); j.pr.cancel = () => { if (!j.started && j.p >= 5 && Q.includes(j)) { Q.splice(Q.indexOf(j), 1); jobs.delete(url); j.no(new Error('cancelled')); } };
    jobs.set(url, j); Q.push(j); pump(); return j.pr; };
  // drop queued neighbour jobs (priority 1-4) that are not in `keepUrls` any more (we moved on)
  const prune = keepUrls => { for (const j of Q.slice()) if (j.p >= 1 && j.p <= 4 && !keepUrls.has(j.url)) { Q.splice(Q.indexOf(j), 1); jobs.delete(j.url); j.no(new Error('cancelled')); } };
  const dropGallery = () => { for (const j of Q.slice()) if (j.p >= 5) { Q.splice(Q.indexOf(j), 1); jobs.delete(j.url); j.no(new Error('cancelled')); } };
  return { load, has: url => lru.has(url), thumb, thumbSync: id => TH.get(id) || null, prune, dropGallery, stats: () => ({ lru: lru.size, queued: Q.length, active: act, thumbs: TH.size }) };
})();
const PV_CSS = `.pv{position:absolute;inset:0;overflow:hidden;background:#0b0b10;color:#fff;font-family:${FONT};user-select:none;-webkit-user-select:none}
.pvb{position:absolute;inset:-40px;background:#111 center/cover no-repeat;filter:blur(38px) brightness(.55) saturate(1.2);transform:scale(1.1)}
.pvs{position:absolute;left:0;right:0;top:44px;bottom:calc(96px + var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px)));touch-action:pan-y}
.pvi{position:absolute;inset:0 var(--pvx,12px);background:center/contain no-repeat;opacity:0;transition:opacity .38s ease,transform .38s cubic-bezier(.2,.9,.3,1);will-change:transform,opacity;filter:drop-shadow(0 10px 30px rgba(0,0,0,.45))}
.pvi.on{opacity:1}
.pv.ld .pvs::after{content:'';position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;animation:pvspin .8s linear infinite}
@keyframes pvspin{to{transform:rotate(360deg)}}
.pvh{position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 62px 0 20px;pointer-events:none;font-size:17px;font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.pvn{font-size:14px;font-weight:500;opacity:.75;font-variant-numeric:tabular-nums} .sh:has(> .hvpen) .pvh{padding-right:108px}
.pve{position:absolute;left:0;right:0;top:44px;bottom:96px;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:.7} .pve[hidden]{display:none}
.pvc{position:absolute;left:0;right:0;bottom:0;padding:12px max(16px,env(safe-area-inset-left)) calc(14px + var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px)));display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}
.pvk{all:unset;cursor:pointer;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:48px;padding:0 20px;border-radius:24px;font-size:16px;font-weight:600;color:#fff;
 background:rgba(255,255,255,.16);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);transition:transform .12s ease,background .15s ease,opacity .15s ease}
.pvk:active{transform:scale(.95);background:rgba(255,255,255,.26)} .pvk:focus-visible{outline:3px solid rgba(255,255,255,.8);outline-offset:2px} .pvk[disabled]{opacity:.35;pointer-events:none}
.pvk ha-icon{--mdc-icon-size:26px;display:flex} .pvp,.pvx{flex:1 1 0;max-width:190px}
.pva{background:linear-gradient(180deg,#4f9dff,#2a6df0);box-shadow:0 4px 14px rgba(30,90,230,.4)} .pva:active{background:linear-gradient(180deg,#3f8bf0,#215fdc)}
@media (max-width:640px){.pva{order:3;flex:1 1 100%;max-width:none}.pvk{height:46px}.pvs{bottom:calc(150px + var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px)))}.pve{bottom:150px}.pvi{inset:0 4px}}
.pg{box-sizing:border-box;padding:0 max(14px,env(safe-area-inset-left)) calc(24px + var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px)));min-height:100%;color:#fff;font-family:${FONT}}
.pgh{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 calc(-1 * max(14px,env(safe-area-inset-left))) 10px;padding:42px calc(max(14px,env(safe-area-inset-left)) + 36px) 10px max(14px,env(safe-area-inset-left));background:rgba(18,18,26,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.pgt{display:flex;flex-direction:column;min-width:0} .pgt b{font-size:22px;font-weight:700;letter-spacing:-.01em} .pgc{font-size:13px;opacity:.65;min-height:16px}
.pgh .pvk{height:42px;padding:0 16px;font-size:15px;background:linear-gradient(180deg,#4f9dff,#2a6df0)} .pgh .pvk ha-icon{--mdc-icon-size:22px}
.pgs{margin:0 0 12px;padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.12);font-size:14px;line-height:1.35} .pgs.err{background:rgba(255,69,58,.22)} .pgs[hidden],.pgm[hidden]{display:none}
.pgm{padding:40px 12px;text-align:center;opacity:.7;font-size:16px}
.pam{position:absolute;z-index:8;box-sizing:border-box;width:max-content;min-width:250px;max-width:min(352px,calc(100% - 16px));padding:6px;border-radius:18px;background:rgba(46,46,58,.74);backdrop-filter:blur(30px) saturate(1.6);-webkit-backdrop-filter:blur(30px) saturate(1.6);
 box-shadow:0 18px 50px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.13);transform-origin:top right;animation:pamin .18s cubic-bezier(.2,.9,.3,1)} @keyframes pamin{from{opacity:0;transform:scale(.9)}}
.pam .mi{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:8px 12px;border-radius:12px;cursor:pointer;color:#fff;-webkit-tap-highlight-color:transparent;transition:background .12s ease}
.pam .mi:active{background:rgba(255,255,255,.16)} .pam .mi:focus-visible{outline:2px solid rgba(255,255,255,.8);outline-offset:-2px} .pam .mi[disabled]{opacity:.42;pointer-events:none}
.pam .mi+.mi{box-shadow:0 -1px 0 rgba(255,255,255,.08)} .pam .mi ha-icon{--mdc-icon-size:24px;display:flex;flex:none}
.pam .mt{display:flex;flex-direction:column;min-width:0;gap:1px} .pam .mt b{font-size:16px;font-weight:600} .pam .mt span{font-size:12.5px;opacity:.68;line-height:1.3}
.pam .cur{padding:10px 12px 10px;font-size:13px;line-height:1.35;border-bottom:1px solid rgba(255,255,255,.12);margin-bottom:4px;overflow-wrap:anywhere}
.pam .cur b{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-bottom:3px} .pam .cur .u{display:block;margin-top:3px;font-size:11.5px;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pam .why{padding:6px 12px 8px;font-size:12.5px;opacity:.72;line-height:1.35}
.pal{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(0,0,12,.42);animation:pafade .2s ease;font-family:${FONT};color:#fff}
@keyframes pafade{from{opacity:0}} .pal .bx{width:min(480px,100%);box-sizing:border-box;padding:22px 20px 18px;border-radius:24px;background:rgba(46,46,58,.8);backdrop-filter:blur(34px) saturate(1.6);-webkit-backdrop-filter:blur(34px) saturate(1.6);
 box-shadow:0 24px 70px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.13);animation:pamin .22s cubic-bezier(.2,.9,.3,1)}
.pal h3{margin:0 0 6px;font-size:20px;font-weight:700} .pal p{margin:0 0 14px;font-size:13.5px;opacity:.72;line-height:1.4}
.pal input{all:unset;box-sizing:border-box;width:100%;height:48px;padding:0 14px;border-radius:14px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);font-size:16px;color:#fff;-webkit-user-select:text;user-select:text;cursor:text}
.pal input:focus{box-shadow:inset 0 0 0 2px #4f9dff} .pal input::placeholder{color:rgba(255,255,255,.4)}
.pal .pr{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 0} .pal .pr span{padding:4px 10px;border-radius:999px;font-size:12px;background:rgba(255,255,255,.08);opacity:.55;transition:all .15s ease} .pal .pr span.on{opacity:1;background:rgba(79,157,255,.35)}
.pal .st{margin:12px 0 0;font-size:13.5px;line-height:1.4;min-height:19px;opacity:.85} .pal .st.ok{color:#8be3a9;opacity:1} .pal .st.err{color:#ffb7b0;opacity:1} .pal .st.warn{color:#ffe08a;opacity:1}
.pal .bt{display:flex;gap:10px;justify-content:flex-end;margin-top:18px} .pal .bt .pvk{height:44px;padding:0 22px;font-size:15px} .pal .bt .sv{background:linear-gradient(180deg,#4f9dff,#2a6df0)}
@media (max-width:640px){.pal{align-items:flex-start;padding-top:max(90px,14vh)}.pal .bt .pvk{flex:1}}
.pgg{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--gt,118px),1fr));gap:6px}
.gt{all:unset;cursor:pointer;position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.08);-webkit-tap-highlight-color:transparent}
.gt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .35s ease} .gt.ld img{opacity:1}
.gt ha-icon{position:absolute;left:50%;top:50%;margin:-14px 0 0 -14px;--mdc-icon-size:28px;opacity:0;display:flex;color:rgba(255,255,255,.55)} .gt.bad ha-icon{opacity:1}
.gt:active{transform:scale(.96)} .gt:focus-visible{outline:3px solid #fff;outline-offset:-3px}
.gt.cur::after{content:'';position:absolute;inset:0;border-radius:10px;box-shadow:inset 0 0 0 3px #4f9dff,inset 0 0 0 5px rgba(255,255,255,.9)}
.gt.new::before{content:'NEW';position:absolute;left:6px;top:6px;z-index:2;padding:2px 6px;border-radius:6px;background:#30d158;color:#04210d;font-size:10px;font-weight:800;letter-spacing:.04em}
@media (min-width:900px){.pgg{--gt:150px}}
:host([hv-day]) .pg{color:#1c1c1e} :host([hv-day]) .pgh{background:rgba(242,242,246,.9)} :host([hv-day]) .pgc{opacity:.75}
:host([hv-day]) .pgs{background:rgba(60,60,67,.08)} :host([hv-day]) .pgs.err{background:rgba(255,59,48,.14)} :host([hv-day]) .gt{background:rgba(60,60,67,.08)}
:host([hv-day]) .gt ha-icon{color:rgba(60,60,67,.45)} :host([hv-day]) .gt:focus-visible{outline-color:#5b3fc4}`;
/* ---------------- 1.31.0: Assistant (voice or typed, any Assist pipeline) + countdown timer ----------------
 * Home Screen card options: assistant_enabled, assistant_pipeline (empty = Home Assistant's preferred pipeline), assistant_button
 * (mic button beside the avatar), assistant_theme, assistant_speak (play the spoken reply), assistant_auto_listen, timer_sound.
 * Voice: the microphone of the device showing the dashboard (getUserMedia; needs HTTPS) is resampled to 16 kHz 16-bit mono and
 * streamed to the pipeline (assist_pipeline/run, stt stage). The transcript is checked here for timer requests first ("set a timer
 * for 15 minutes", "cancel / pause / resume the timer", "how much time is left"): those run a timer in this browser, so they work
 * without a voice satellite. Anything else goes to the pipeline's conversation agent (intent stage, optional tts).
 * The timer lives in this browser (localStorage), survives a reload and opens a full-screen countdown. */
const HV_NUMS = { zero: 0, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, couple: 2, few: 3 };
// "one and a half hours" -> "1.5 hours"; "twenty five" -> "25"; "half an hour" -> "30 minutes"
function hvWordsToNum(t) {
  t = ' ' + String(t || '').toLowerCase().replace(/[-–]/g, ' ').replace(/[^\w.:' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  t = t.replace(/ (a |an |one )?half (an|a) hour /g, ' 30 minutes ').replace(/ (a |an )?quarter (of )?(an |a )?hour /g, ' 15 minutes ').replace(/ half (a|an) minute /g, ' 30 seconds ')
    .replace(/ three quarters? (of )?(an |a )?hour /g, ' 45 minutes ').replace(/ (a )?couple (of )?/g, ' two ');
  const w = t.trim().split(' '), out = []; let cur = null;
  const flush = () => { if (cur != null) { out.push(String(cur)); cur = null; } };
  for (let i = 0; i < w.length; i++) { const x = w[i];
    if (x in HV_NUMS && !((x === 'a' || x === 'an') && !/^(minute|min|hour|hr|second|sec|half)/.test(w[i + 1] || ''))) {
      const v = HV_NUMS[x]; if (cur != null && cur >= 20 && cur % 10 === 0 && v < 10) cur += v; else { flush(); cur = v; } continue; }
    if (/^\d+(\.\d+)?$/.test(x)) { flush(); cur = parseFloat(x); continue; }
    if (x === 'and' && w[i + 1] === 'a' && w[i + 2] === 'half' && cur != null) { cur += 0.5; i += 2; continue; }
    if (x === 'half' && cur == null) { cur = 0.5; continue; }
    flush(); out.push(x); }
  flush(); return ' ' + out.join(' ') + ' '; }
// seconds in a phrase ("15 minutes", "1 hour and 20 minutes", "90 seconds", "5 min timer", "1:30"), or 0
function hvDuration(t) { const s = hvWordsToNum(t); let sec = 0, hit = false;
  const re = /(\d+(?:\.\d+)?) ?(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g; let m;
  while ((m = re.exec(s))) { hit = true; const n = parseFloat(m[1]), u = m[2][0]; sec += n * (u === 'h' ? 3600 : u === 'm' ? 60 : 1); }
  if (!hit) { const c = s.match(/ (\d{1,2}):(\d{2}) /); if (c) sec = +c[1] * 60 + +c[2]; }
  return Math.round(sec); }
const HV_TIMER_STOP = new Set(['a', 'an', 'the', 'my', 'set', 'start', 'make', 'create', 'new', 'put', 'begin', 'minute', 'minutes', 'second', 'seconds', 'hour', 'hours', 'min', 'mins', 'sec', 'secs', 'kitchen', 'one', 'another', 'and', 'half', 'up']);
// { cmd: 'start', secs, label } | { cmd: 'cancel' | 'pause' | 'resume' | 'status' } | null
function hvTimerIntent(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[^\w:' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  if (!/ (timers?|countdown|count down)\b/.test(t)) {
    const d0 = / (count down|countdown) (from )?/.test(t) ? hvDuration(t) : 0; return d0 ? { cmd: 'start', secs: d0, label: '' } : null; }
  if (/ (cancel|stop|delete|remove|clear|dismiss|end|turn off|kill)\b/.test(t)) return { cmd: 'cancel' };
  if (/ (pause|hold|freeze)\b/.test(t)) return { cmd: 'pause' };
  if (/ (resume|continue|unpause|restart|un pause)\b/.test(t)) return { cmd: 'resume' };
  const secs = hvDuration(t);
  if (secs > 0) { const lm = t.match(/ ([a-z']+) timer /); const label = lm && !HV_TIMER_STOP.has(lm[1]) && !/^\d/.test(lm[1]) ? lm[1] : '';
    return { cmd: 'start', secs: Math.min(secs, 24 * 3600), label }; }
  if (/ (how (much|long)|time left|remaining|status|check)\b/.test(t)) return { cmd: 'status' };
  if (/ (set|start|create|make|new|begin)\b/.test(t)) return { cmd: 'ask' };
  return null; }
const hvFmtLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
const hvFmtTotal = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
  return [h ? h + ' HR' : '', m ? m + ' MIN' : '', x ? x + ' SEC' : ''].filter(Boolean).join(' ') || '0 SEC'; };
const hvSayLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60, p = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  return [h ? p(h, 'hour') : '', m ? p(m, 'minute') : '', x && !h ? p(x, 'second') : ''].filter(Boolean).join(' and ') || 'no time'; };
// one shared AudioContext, unlocked by a tap (the mic button / an app), so the alert can sound later without a new gesture
const hvAudio = () => { try { if (!window.__hvAC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; window.__hvAC = new C(); }
  if (window.__hvAC.state === 'suspended') window.__hvAC.resume().catch(() => {}); return window.__hvAC; } catch (e) { return null; } };
/* 1.32.0: the assistant's spoken replies. iOS (Safari and the Companion app) only lets a page play sound after a tap: a new Audio()
 * created when the reply arrives (seconds after the tap, after network round trips) is refused (NotAllowedError) and stays silent.
 * So ONE <audio> element is primed with a short silent clip inside the tap (mic button, orb, send) and reused for every reply; if it is
 * still refused, the mp3 is decoded and played through the AudioContext that was also resumed in the tap. */
const HV_SILENT = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
const hvSpk = () => { let a = window.__hvSpk; if (!a) { a = window.__hvSpk = new Audio(); a.setAttribute('playsinline', ''); a.playsInline = true; a.preload = 'auto'; } return a; };
const hvSpkUnlock = () => { hvAudio(); const a = hvSpk(); if (a.__hvOk || !a.paused) return; try { a.muted = false; a.src = HV_SILENT; const p = a.play(); if (p && p.then) p.then(() => { a.__hvOk = true; }).catch(() => {}); else a.__hvOk = true; } catch (e) { /* not in a tap */ } };
const hvSession = t => { try { if (navigator.audioSession && navigator.audioSession.type !== t) navigator.audioSession.type = t; } catch (e) { /* Safari 16.4+ only */ } };
// play a reply (url from the pipeline's tts-end, e.g. /api/tts_proxy/<token>.mp3); on: { start(), end(), fail(err) }; returns { stop() }
function hvPlayTts(h, u, on) { let url = u; try { url = h && h.hassUrl ? h.hassUrl(u) : new URL(u, location.href).href; } catch (e) { /* keep u */ }
  let stopped = false, src = null; const a = hvSpk(); hvSession('playback');
  const fin = f => { if (stopped) return; stopped = true; hvSession('auto'); f(); };
  const viaWA = async () => { const ac = hvAudio(); if (!ac) throw new Error('no Web Audio'); const r = await fetch(url, { credentials: 'same-origin' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer(); if (stopped) return; const ab = await new Promise((ok, no) => ac.decodeAudioData(buf, ok, no)); if (stopped) return;
    if (ac.state === 'suspended') await ac.resume(); src = ac.createBufferSource(); src.buffer = ab; src.connect(ac.destination); src.onended = () => fin(on.end); src.start(); on.start(); };
  a.onended = () => fin(on.end); a.muted = false; a.volume = 1; a.src = url;
  let p; try { p = a.play(); } catch (e) { p = Promise.reject(e); }
  Promise.resolve(p).then(() => { if (!stopped) on.start(); }).catch(e => { if (stopped) return; a.onended = null;
    viaWA().catch(e2 => fin(() => on.fail(e && e.name === 'NotAllowedError' ? e : (e2 || e)))); });
  return { stop: () => { stopped = true; hvSession('auto'); a.onended = null; try { a.pause(); } catch (e) {} try { src && src.stop(); } catch (e) {} } }; }
// ---- the timer (one per browser)
const HVTM = {
  KEY: 'hv-timer-v1', st: null, iv: 0, scr: null, opts: { sound: true },
  load() { try { const j = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (j && j.total > 0) this.st = j; } catch (e) {} if (this.st) this._run(); return this.st; },
  save() { try { if (this.st) localStorage.setItem(this.KEY, JSON.stringify(this.st)); else localStorage.removeItem(this.KEY); } catch (e) {} },
  left() { const s = this.st; if (!s) return 0; return s.paused != null ? s.paused : Math.max(0, s.end - Date.now()); },
  start(secs, label) { this.st = { total: secs, end: Date.now() + secs * 1000, paused: null, label: label || '', done: false }; this.save(); this._run(); this.show(); },
  pause() { const s = this.st; if (!s || s.done || s.paused != null) return; s.paused = this.left(); this.save(); this._paint(); },
  resume() { const s = this.st; if (!s || s.done || s.paused == null) return; s.end = Date.now() + s.paused; s.paused = null; this.save(); this._run(); this._paint(); },
  add(secs) { const s = this.st; if (!s || s.done) return; if (s.paused != null) s.paused += secs * 1000; else s.end += secs * 1000; s.total += secs; this.save(); this._paint(); },
  cancel() { this.st = null; this.save(); this._stopAlarm(); clearInterval(this.iv); this.iv = 0; if (this.scr) this.scr.close(); this._pill(); },
  _run() { if (this.iv) return; this.iv = setInterval(() => this._tick(), 250); this._tick(); },
  _tick() { const s = this.st; if (!s) { clearInterval(this.iv); this.iv = 0; return; }
    if (!s.done && s.paused == null && Date.now() >= s.end) { s.done = true; this.save(); this.show(); this._alarm(); }
    this._paint(); this._pill(); },
  show() { if (!this.st) return; if (!this.scr || !this.scr.isConnected) this.scr = hvTimerScreen(this); this._paint(); },
  _paint() { if (this.scr && this.scr.isConnected) this.scr.paint(); },
  _pill() { for (const f of hvTimerPills) try { f(); } catch (e) {} },
  _alarm() { this._stopAlarm(); if (this.opts.sound === false) return; const ac = hvAudio(); if (!ac) return; let n = 0;
    const ring = () => { if (!this.st || !this.st.done || n++ > 60) return this._stopAlarm(); const t0 = ac.currentTime;
      for (let k = 0; k < 3; k++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = k === 2 ? 1175 : 880;
        g.gain.setValueAtTime(0, t0 + k * 0.22); g.gain.linearRampToValueAtTime(0.32, t0 + k * 0.22 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + k * 0.22 + 0.2);
        o.connect(g); g.connect(ac.destination); o.start(t0 + k * 0.22); o.stop(t0 + k * 0.22 + 0.22); } };
    ring(); this._al = setInterval(ring, 1600); },
  _stopAlarm() { clearInterval(this._al); this._al = 0; } };
const hvTimerPills = new Set();
const TIMER_CSS = `:host{position:fixed;inset:0;z-index:12;background:#000;color:#fff;font-family:${FONT};-webkit-tap-highlight-color:transparent;opacity:0;transition:opacity .35s ease;touch-action:manipulation}
:host(.in){opacity:1}
svg.ring{position:absolute;inset:0;width:100%;height:100%}
svg.ring line{stroke-width:var(--tw,5px);stroke-linecap:round;stroke:#ff9f0a;transition:stroke .4s ease,opacity .4s ease}
svg.ring line.off{stroke:#5a3a12;opacity:.55}
.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.t{font-size:min(24vw,30vh);font-weight:600;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums;font-family:ui-rounded,"SF Pro Rounded","Nunito",${FONT}}
.l{margin-top:min(2.4vh,18px);font-size:min(4.6vw,4.4vh);font-weight:600;color:#ff9f0a;letter-spacing:.02em;text-transform:uppercase}
.ctl{position:absolute;left:0;right:0;bottom:max(9vh,calc(28px + env(safe-area-inset-bottom)));display:flex;justify-content:center;gap:min(5vw,40px);transition:opacity .4s ease}
.ctl button,.mn{all:unset;cursor:pointer;width:min(15vw,72px);height:min(15vw,72px);border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12);color:#fff}
.ctl button ha-icon,.mn ha-icon{--mdc-icon-size:min(7vw,32px);display:flex}
.ctl button.pp{background:rgba(255,159,10,.24);color:#ff9f0a} .ctl button.add{font-size:min(4vw,18px);font-weight:700}
.mn{position:absolute;top:calc(${HV_FH_SAFE} + max(40px,7vmin));left:calc(env(safe-area-inset-left,0px) + max(40px,7vmin));width:46px;height:46px} .mn ha-icon{--mdc-icon-size:26px}
:host([paused]) .t{opacity:.55} :host([paused]) svg.ring line{opacity:.7}
:host([done]) .ctl,:host([done]) .mn{opacity:0;pointer-events:none}
:host([done]){animation:hvtf 1.6s ease-in-out infinite} :host([done]) .t{animation:hvtp 1.6s ease-in-out infinite}
.dn{margin-top:min(3vh,22px);font-size:min(3.6vw,3.4vh);color:rgba(255,255,255,.7);display:none} :host([done]) .dn{display:block}
@keyframes hvtf{0%,100%{background:#000}50%{background:#4a2600}} @keyframes hvtp{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){:host([done]),:host([done]) .t{animation:none} :host([done]){background:#3a1e00}}`;
// tick positions on a rounded rectangle inset from the screen edge, clockwise from the top centre
function hvTicks(W, H, N) { const m = Math.max(14, Math.min(W, H) * 0.05), L = Math.max(10, Math.min(W, H) * 0.035), w = W - 2 * m, h = H - 2 * m, r = Math.min(w, h) * 0.2;
  const segs = [], add = (len, f) => segs.push({ len, f }), q = Math.PI / 2 * r;
  add(w / 2 - r, d => [W / 2 + d, m, 0, 1]); add(q, d => { const a = -Math.PI / 2 + d / r; return [W - m - r + r * Math.cos(a), m + r + r * Math.sin(a), -Math.cos(a), -Math.sin(a)]; });
  add(h - 2 * r, d => [W - m, m + r + d, -1, 0]); add(q, d => { const a = d / r; return [W - m - r + r * Math.cos(a), H - m - r + r * Math.sin(a), -Math.cos(a), -Math.sin(a)]; });
  add(w - 2 * r, d => [W - m - r - d, H - m, 0, -1]); add(q, d => { const a = Math.PI / 2 + d / r; return [m + r + r * Math.cos(a), H - m - r + r * Math.sin(a), -Math.cos(a), -Math.sin(a)]; });
  add(h - 2 * r, d => [m, H - m - r - d, 1, 0]); add(q, d => { const a = Math.PI + d / r; return [m + r + r * Math.cos(a), m + r + r * Math.sin(a), -Math.cos(a), -Math.sin(a)]; });
  add(w / 2 - r, d => [m + r + d, m, 0, 1]);
  const P = segs.reduce((a, s) => a + s.len, 0), out = [];
  for (let i = 0; i < N; i++) { let d = i / N * P, k = 0; while (k < segs.length - 1 && d > segs[k].len) { d -= segs[k].len; k++; } const [x, y, nx, ny] = segs[k].f(d); out.push([x, y, x + nx * L, y + ny * L]); }
  return out; }
function hvTimerScreen(T) {
  const host = document.createElement('homeview-timer'), sr = host.attachShadow({ mode: 'open' }); const N = 60;
  sr.innerHTML = `<style>${TIMER_CSS}</style><svg class="ring" aria-hidden="true"></svg><div class="c" role="timer" aria-live="off"><div class="t"></div><div class="l"></div><div class="dn">Time's up · tap anywhere to dismiss</div></div>
    <button class="mn" aria-label="Minimise (the timer keeps running)"><ha-icon icon="mdi:chevron-down"></ha-icon></button>
    <div class="ctl"><button class="cx" aria-label="Cancel timer"><ha-icon icon="mdi:close"></ha-icon></button><button class="pp" aria-label="Pause"><ha-icon icon="mdi:pause"></ha-icon></button><button class="add" aria-label="Add one minute">+1</button></div>`;
  const svg = sr.querySelector('svg'), tEl = sr.querySelector('.t'), lEl = sr.querySelector('.l'), pp = sr.querySelector('.pp'); let lines = [], lastOn = -1, W = 0, H = 0;
  const layout = () => { W = innerWidth; H = innerHeight; svg.setAttribute('viewBox', `0 0 ${W} ${H}`); host.style.setProperty('--tw', Math.max(3, Math.min(W, H) * 0.008).toFixed(1) + 'px');
    // keep the ring clear of the notch / status bar / home indicator: inside the safe area
    const ins = (() => { const pr = document.createElement('div'); pr.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;padding:${HV_FH_SAFE} env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)`;
      sr.appendChild(pr); const cs = getComputedStyle(pr), r = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].map(k => parseFloat(cs[k]) || 0); pr.remove(); return r; })();
    const [it, ir, ib, il] = ins;
    svg.innerHTML = hvTicks(W - il - ir, H - it - ib, N).map(p => [p[0] + il, p[1] + it, p[2] + il, p[3] + it]).map(p => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${p[2].toFixed(1)}" y2="${p[3].toFixed(1)}"/>`).join(''); lines = [...svg.querySelectorAll('line')]; lastOn = -1; host.paint(); };
  host.paint = () => { const s = T.st; if (!s) return; const left = T.left(), on = s.done ? N : Math.ceil(left / (s.total * 1000) * N);
    tEl.textContent = s.done ? '0:00' : hvFmtLeft(left); const ls = Math.max(0, Math.ceil(left / 1000)); // the orange line: minutes left (seconds in the last minute)
    lEl.textContent = (s.label ? s.label + ' · ' : '') + (s.done ? hvFmtTotal(s.total) + ' timer' : (ls >= 60 ? Math.ceil(ls / 60) + ' MIN' : ls + ' SEC') + (s.paused != null ? ' left · paused' : ' left'));
    if (on !== lastOn) { lastOn = on; lines.forEach((l, i) => l.classList.toggle('off', i >= on)); }
    host.toggleAttribute('paused', s.paused != null); host.toggleAttribute('done', !!s.done);
    pp.innerHTML = `<ha-icon icon="mdi:${s.paused != null ? 'play' : 'pause'}"></ha-icon>`; pp.setAttribute('aria-label', s.paused != null ? 'Resume' : 'Pause'); };
  host.close = () => { removeEventListener('resize', layout); removeEventListener('keydown', key); host.classList.remove('in'); setTimeout(() => host.remove(), 350); if (T.scr === host) T.scr = null; };
  const key = e => { if (e.key === 'Escape') { if (T.st && T.st.done) T.cancel(); else host.close(); } };
  host.addEventListener('click', e => { const b = e.composedPath().find(n => n.tagName === 'BUTTON'); hvAudio();
    if (T.st && T.st.done) { T.cancel(); return; } // finished: a tap anywhere dismisses it
    if (!b) return; if (b.classList.contains('cx')) T.cancel(); else if (b.classList.contains('pp')) (T.st.paused != null ? T.resume() : T.pause()); else if (b.classList.contains('add')) T.add(60); else if (b.classList.contains('mn')) host.close(); });
  hvSwipeClose({ el: host, alive: () => host.isConnected && !(T.st && T.st.done), close: () => host.close() }); // swipe down: minimise (keeps running)
  { const hub = [...HV_HUBS].find(x => x.isConnected); hvPen(sr.querySelector('.mn'), hub && hub._penFn()); } // 1.32.0: edit pencil (Home Screen card: Assistant & timer)
  addEventListener('resize', layout); addEventListener('keydown', key); document.body.appendChild(host); layout(); requestAnimationFrame(() => host.classList.add('in'));
  return host; }

// ---- the assistant popup
const ASSIST_CSS = `:host{position:fixed;inset:0;z-index:11;font-family:${FONT};-webkit-tap-highlight-color:transparent;--fg:#1c1c1e;--fg2:rgba(60,60,67,.62);--bub:#fff;--ubub:#0a84ff;--inp:rgba(118,118,128,.12);--sep:rgba(60,60,67,.12);--crd:rgba(255,255,255,.92);color:var(--fg);
 --st:${HV_FH_SAFE};--sb:env(safe-area-inset-bottom,0px);--sl:env(safe-area-inset-left,0px);--sr:env(safe-area-inset-right,0px)}
:host([night]){--fg:#fff;--fg2:rgba(235,235,245,.6);--bub:rgba(255,255,255,.10);--inp:rgba(118,118,128,.26);--sep:rgba(255,255,255,.10);--crd:rgba(255,255,255,.08)}
.wrap{position:absolute;inset:0;opacity:0;transform:translate3d(0,24px,0);transition:opacity .28s ease,transform .38s cubic-bezier(.2,.9,.3,1)} :host(.in) .wrap{opacity:1;transform:none}
.bg{position:absolute;inset:0;background:rgba(242,242,247,.94);backdrop-filter:blur(34px) saturate(150%);-webkit-backdrop-filter:blur(34px) saturate(150%)}
:host([night]) .bg{background:rgba(8,8,12,.93)}
@keyframes hvsp{to{transform:rotate(360deg)}}
.cd{position:absolute;inset:0;display:flex;flex-direction:column;box-sizing:border-box;
 padding:calc(var(--st) + 6px) max(14px,var(--sr)) max(12px,var(--sb)) max(14px,var(--sl))}
.col{width:100%;max-width:780px;margin:0 auto;min-height:0;display:flex;flex-direction:column}
.hd{flex:none;display:flex;align-items:center;gap:12px;padding:16px 4px 10px;position:relative}
.grab{position:absolute;left:50%;top:2px;width:38px;height:5px;margin-left:-19px;border-radius:3px;background:rgba(127,127,135,.5)}
.orb{flex:none;width:38px;height:38px;border-radius:50%;position:relative;transform:scale(var(--lv,1));transition:transform .08s linear}
.orb::before{content:'';position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(#ff5fd2,#a259ff,#3b82ff,#2fe0d0,#ffd25e,#ff7a59,#ff5fd2);filter:blur(6px);opacity:.75;animation:hvsp 6s linear infinite}
.orb::after{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 35%,#4a4a5e 0,#1d1d28 55%,#0b0b12 100%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18),inset 0 -5px 10px rgba(160,110,255,.45),inset 0 5px 9px rgba(80,200,255,.35)}
:host([st=listening]) .orb::before{opacity:1;animation-duration:2.2s} :host([st=thinking]) .orb::before{opacity:1;animation-duration:.9s}
.ti{flex:1;min-width:0} .ti b{display:block;font-size:17px;font-weight:700} .ti span{display:block;font-size:12.5px;color:var(--fg2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.x{all:unset;cursor:pointer;flex:none;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--inp);color:var(--fg2)} .x ha-icon{--mdc-icon-size:20px;display:flex}
.bd{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:6px 4px 14px;scrollbar-width:none} .bd::-webkit-scrollbar{display:none}
.log{display:flex;flex-direction:column;gap:12px}
.m{max-width:min(88%,640px);animation:hvmi .28s ease both} @keyframes hvmi{from{opacity:0;transform:translate3d(0,8px,0)}}
.m.u{align-self:flex-end;background:var(--ubub);color:#fff;padding:10px 15px;border-radius:20px 20px 6px 20px;font-size:16px;line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere}
.m.u.live{background:transparent;color:var(--fg2);border:1.5px dashed var(--sep);font-style:italic}
.m.u .w{opacity:0;animation:hvwi .25s ease forwards}  @keyframes hvwi{to{opacity:1}}
.wave{display:inline-flex;gap:3px;align-items:center;height:16px;margin-left:8px;vertical-align:middle} .wave i{width:3px;border-radius:2px;background:currentColor;height:calc(4px + var(--lv0,0) * var(--k) * 12px);transition:height .08s linear}
.m.a{align-self:flex-start;width:min(88%,640px)}
.m.a .re{font-size:clamp(19px,2.6vmin,24px);font-weight:600;line-height:1.3;letter-spacing:-.01em;white-space:pre-wrap;overflow-wrap:anywhere}
.m.a.hi .re{font-size:clamp(24px,3.6vmin,32px)}
.dots{display:inline-flex;gap:5px;padding:6px 0} .dots i{width:8px;height:8px;border-radius:50%;background:var(--fg2);animation:hvdt 1.2s ease-in-out infinite} .dots i:nth-child(2){animation-delay:.15s} .dots i:nth-child(3){animation-delay:.3s}
@keyframes hvdt{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:none}}
.rows{display:flex;flex-direction:column;gap:8px;margin:10px 0 2px} .rows:empty{display:none}
.sec{font-size:15px;font-weight:700;margin:8px 4px 0}
.row{display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:16px;font-size:15px;font-weight:600;background:var(--pb,rgba(120,120,128,.12));color:var(--pc,var(--fg))}
.row ha-icon{--mdc-icon-size:20px;display:flex;color:var(--pi,currentColor);flex:none} .row .tx{flex:1;min-width:0} .row .rt{font-weight:500;font-size:13px;opacity:.75;flex:none}
.row.o{--pb:#fdebd3;--pc:#7a4a00;--pi:#f08c00} .row.b{--pb:#dceafc;--pc:#0b3d7a;--pi:#0a84ff;border-left:4px solid #0a84ff;padding-left:11px} .row.g{--pb:#dcf5e3;--pc:#14532d;--pi:#30a14e} .row.p{--pb:#ece6fd;--pc:#3f2a8c;--pi:#7a5af8}
:host([night]) .row.o{--pb:rgba(255,159,10,.18);--pc:#ffd29a} :host([night]) .row.b{--pb:rgba(10,132,255,.20);--pc:#b9dbff} :host([night]) .row.g{--pb:rgba(48,209,88,.18);--pc:#b4f0c4} :host([night]) .row.p{--pb:rgba(150,120,255,.20);--pc:#d8cdff}
.err{margin-top:10px;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;background:rgba(255,59,48,.10);color:#c4271c} :host([night]) .err{color:#ff8a80;background:rgba(255,69,58,.16)}
/* answer cards */
.card{margin-top:12px;border-radius:22px;padding:16px 18px;background:var(--crd);box-shadow:0 6px 24px rgba(20,30,60,.08);border:1px solid var(--sep)}
.card .ct{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--fg2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px} .card .ct ha-icon{--mdc-icon-size:18px;display:flex}
.wx{color:#fff;border:none;background:var(--wxbg,linear-gradient(180deg,#2468c8,#6aa8e8))}
.wx .ct{color:rgba(255,255,255,.75)} .wx .now{display:flex;align-items:center;gap:14px} .wx .now ha-icon{--mdc-icon-size:54px;display:flex}
.wx .tmp{font-size:46px;font-weight:300;line-height:1} .wx .cnd{font-size:16px;font-weight:600} .wx .hl{font-size:14px;opacity:.85}
.wx .hrs{display:flex;gap:4px;margin-top:14px;overflow-x:auto;scrollbar-width:none} .wx .hrs::-webkit-scrollbar{display:none}
.wx .h{flex:1 0 52px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px;font-weight:600} .wx .h ha-icon{--mdc-icon-size:22px;display:flex} .wx .h .t{opacity:.8;font-weight:500}
.cal .day{font-size:14px;font-weight:700;margin:10px 2px 6px} .cal .day:first-of-type{margin-top:0}
.cal .ev{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:var(--inp);margin-bottom:6px;font-size:15px;font-weight:600}
.cal .ev i{flex:none;width:4px;align-self:stretch;border-radius:2px;background:var(--cc,#7a5af8)} .cal .ev .s{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .cal .ev .tm{flex:none;font-size:13px;font-weight:500;color:var(--fg2)}
.cal .none{font-size:15px;color:var(--fg2);padding:4px 2px}
.sug{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 2px} .sug[hidden]{display:none}
.sug button{all:unset;cursor:pointer;padding:9px 14px;border-radius:999px;font-size:14px;font-weight:600;background:var(--inp);color:var(--fg)} .sug button:active{opacity:.6}
.ft{flex:none;display:flex;align-items:center;gap:10px;padding:10px 0 0}
.mic{all:unset;cursor:pointer;flex:none;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7a5af8,#0a84ff);color:#fff;box-shadow:0 4px 14px rgba(90,90,250,.35)}
.mic ha-icon{--mdc-icon-size:26px;display:flex} :host([st=listening]) .mic{background:#ff3b30;box-shadow:0 0 0 6px rgba(255,59,48,.18)} .mic[disabled],.mic.nostt{opacity:.45;box-shadow:none}
.in{flex:1;min-width:0;height:46px;border-radius:23px;background:var(--inp);display:flex;align-items:center;padding:0 6px 0 16px}
.in input{all:unset;flex:1;min-width:0;font-size:16px;color:var(--fg)} .in input::placeholder{color:var(--fg2)}
.snd{all:unset;cursor:pointer;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0a84ff} .snd ha-icon{--mdc-icon-size:24px;display:flex}
.jump{all:unset;cursor:pointer;position:absolute;left:50%;transform:translateX(-50%);bottom:calc(max(12px,var(--sb)) + 70px);padding:6px 12px;border-radius:999px;background:var(--fg);color:var(--bub);font-size:13px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.2);display:none}
:host([night]) .jump{color:#000} .jump.on{display:block}
/* 1.32.0: quiet mode (per device) in the header */
.qb{all:unset;cursor:pointer;flex:none;height:34px;padding:0 12px 0 10px;border-radius:17px;display:flex;align-items:center;gap:5px;background:var(--inp);color:var(--fg2);font-size:13px;font-weight:600;white-space:nowrap}
.qb ha-icon{--mdc-icon-size:18px;display:flex} .qb.on{color:#0a84ff} :host([night]) .qb.on{color:#64b5ff}
.qp{flex:none;margin:0 4px 10px;padding:12px 14px;border-radius:18px;background:var(--crd);border:1px solid var(--sep)} .qp[hidden]{display:none}
.qp .qh{font-size:12px;font-weight:700;color:var(--fg2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.seg{display:flex;gap:3px;padding:3px;border-radius:12px;background:var(--inp)}
.seg button{all:unset;cursor:pointer;flex:1;text-align:center;padding:8px 0;border-radius:9px;font-size:15px;font-weight:600;color:var(--fg)}
.seg button.sel{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.14)} :host([night]) .seg button.sel{background:rgba(255,255,255,.22)}
.qd{margin-top:9px;font-size:13px;line-height:1.4;color:var(--fg2)} .qd b{color:var(--fg);font-weight:600}
/* 1.32.0: the floating orb (mic button): only the orb over the clear dashboard (no blur, no dimming, no glowing edge); tap it for the chat */
.ov{position:absolute;inset:0;display:none;opacity:0;transition:opacity .25s ease} :host([orb]) .ov{display:block} :host([orb].in) .ov{opacity:1} :host([orb]) .wrap{display:none}
.ow{position:absolute;left:0;right:0;margin:0 auto;top:max(46px,calc(var(--st) + 6px));width:min(330px,calc(100vw - 32px));display:flex;flex-direction:column;align-items:center;
 color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 12px rgba(0,0,0,.45);pointer-events:none;transform-origin:50% 0;animation:hvop .45s cubic-bezier(.2,1.25,.4,1) backwards} /* backwards, not both: a held opacity animation would stop the caption's backdrop blur */
@keyframes hvop{from{opacity:0;transform:scale(.55) translate3d(0,-10px,0)}}
.bo{all:unset;cursor:pointer;pointer-events:auto;position:relative;flex:none;--os:116px;width:var(--os);height:var(--os);border-radius:50%;transform:scale(var(--lv,1));
 transition:width .35s cubic-bezier(.2,.9,.3,1),height .35s cubic-bezier(.2,.9,.3,1),transform .08s linear;-webkit-tap-highlight-color:transparent}
:host([cap]) .bo{--os:92px}
.bo span{position:absolute;border-radius:50%;display:block}
.bo .ha{inset:-26px;background:conic-gradient(from 200deg,#ff5fd2,#a259ff,#3b82ff,#2fe0d0,#ffd25e,#ff7a59,#ff5fd2);filter:blur(26px);opacity:.55;animation:hvsp 6s linear infinite}
.bo .ri{inset:-3px;background:conic-gradient(from 200deg,#ff5fd2,#a259ff,#3b82ff,#2fe0d0,#ffd25e,#ff7a59,#ff5fd2);filter:blur(3px);opacity:.95;animation:hvsp 6s linear infinite}
.bo .co{inset:0;overflow:hidden;background:radial-gradient(circle at 50% 30%,rgba(90,90,115,.9) 0,rgba(22,22,34,.94) 58%,rgba(6,6,12,.97) 100%);
 box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.28),inset 0 -18px 30px rgba(160,110,255,.45),inset 0 14px 26px rgba(80,200,255,.30)}
.bo .bd1{left:14%;right:14%;top:48%;height:16%;background:linear-gradient(90deg,transparent,#ff7ad9 18%,#a98bff 36%,#6fb6ff 52%,#5ff0e0 66%,#ffe27a 82%,transparent);filter:blur(6px);opacity:.95;animation:hvbw 3.2s ease-in-out infinite}
.bo .bd2{left:24%;right:24%;top:56%;height:7%;background:linear-gradient(90deg,transparent,#fff 40%,#fff 60%,transparent);filter:blur(4px);opacity:.55;animation:hvbw 3.2s ease-in-out infinite reverse}
.bo .sp{left:22%;top:8%;width:56%;height:30%;background:linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,0));filter:blur(1px)}
.bo .li{left:16%;right:16%;bottom:10%;height:22%;border-radius:0 0 999px 999px;box-shadow:inset 0 -1.5px 0 rgba(255,255,255,.35)}
@keyframes hvbw{0%,100%{transform:rotate(-6deg) translate3d(-7%,0,0) scaleX(.9)}50%{transform:rotate(-6deg) translate3d(7%,0,0) scaleX(1.08)}}
:host([st=listening]) .bo .ha{opacity:calc(.55 + var(--lv0,0) * .4);animation-duration:2.6s} :host([st=listening]) .bo .ri{animation-duration:2.6s} :host([st=listening]) .bo .bd1{animation-duration:1.3s}
:host([st=thinking]) .bo .ha,:host([st=thinking]) .bo .ri{animation-duration:.9s} :host([st=thinking]) .bo .ha{opacity:.8}
:host([st=speaking]) .bo .ha{animation:hvsp 3s linear infinite,hvpl 1.1s ease-in-out infinite} :host([st=speaking]) .bo .co{animation:hvps 1.1s ease-in-out infinite}
@keyframes hvpl{50%{opacity:.85}} @keyframes hvps{50%{transform:scale(1.04)}}
.ost{margin-top:24px;font-size:15px;font-weight:600;letter-spacing:.2px;display:flex;align-items:center;gap:8px;min-height:18px} .ost .wave{margin-left:0} .ost .wave i{background:#fff;height:calc(5px + var(--k) * 6px + var(--lv0,0) * var(--k) * 10px)}
:host(:not([st=listening])) .ost .wave{display:none}
.ohint{margin-top:6px;font-size:12px;opacity:.75}
:host([cap]) .ost,:host([cap]) .ohint{display:none}
.cap{pointer-events:auto;cursor:pointer;margin-top:22px;width:100%;box-sizing:border-box;padding:14px 16px;border-radius:22px;color:#fff;text-shadow:none;background:rgba(20,22,34,.55);
 backdrop-filter:blur(24px) saturate(140%);-webkit-backdrop-filter:blur(24px) saturate(140%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2),0 10px 30px rgba(0,0,0,.35);animation:hvmi .3s ease backwards}
.cap[hidden]{display:none} .cap .q{font-size:13px;opacity:.6;margin-bottom:6px;overflow-wrap:anywhere} .cap .q:empty{display:none}
.cap .a{font-size:17px;line-height:1.35;font-weight:500;white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:7;overflow:hidden}
.cap.er .a{font-size:15px;color:#ffb4ab}
.cap .mt{margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:11px;opacity:.65} .cap .mt span{display:flex;align-items:center;gap:4px} .cap .mt ha-icon{--mdc-icon-size:13px;display:flex}
@media (prefers-reduced-motion:reduce){.orb::before,.dots i,.m,.m.u .w,.bo span,.ow,.cap{animation:none !important} .wrap{transition:opacity .2s}}`;
// response text -> intro + rows (markdown lists, "Day:" headings, times, all-day items)
function hvAssistRows(text) {
  const lines = String(text || '').replace(/\*\*|__|`/g, '').split(/\n+/).map(x => x.trim()).filter(Boolean); let intro = [], rows = [];
  for (const l of lines) { const li = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (li) rows.push({ t: li[1] }); else if ((rows.length || intro.length) && /:$/.test(l) && l.length < 60) rows.push({ h: l.replace(/:$/, '') }); else if (!rows.length) intro.push(l); else rows.push({ t: l }); }
  if (!rows.length && intro.length > 1 && intro.slice(1).every(x => /:$/.test(x) || x.length < 90)) { rows = intro.slice(1).map(x => /:$/.test(x) ? { h: x.replace(/:$/, '') } : { t: x }); intro = intro.slice(0, 1); }
  const cls = t => /\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b\d{1,2}:\d{2}\b/i.test(t) && !/all[ -]day/i.test(t) ? 'b' : /all[ -]day|birthday|anniversary|holiday/i.test(t) ? 'o' : 'p';
  rows = rows.map(r => r.h ? r : Object.assign(r, { c: cls(r.t), i: cls(r.t) === 'o' && /birthday/i.test(r.t) ? 'mdi:cake-variant' : cls(r.t) === 'b' ? 'mdi:clock-outline' : cls(r.t) === 'o' ? 'mdi:calendar' : 'mdi:circle-small' }));
  return { intro: intro.join('\n'), rows }; }
// which answer card fits a request: by the entities the agent touched, else by words in the question
const HV_WX_Q = /\b(weather|forecast|temperature|degrees|outside|rain(ing|y)?|snow(ing|y)?|sunny|cloudy|wind(y)?|umbrella|jacket|humid(ity)?|storm|frost)\b/i;
const HV_CAL_Q = /\b(calendar|schedule|agenda|events?|appointments?|meetings?|plans|planned|busy|free tonight|what'?s on|what is on|happening|birthdays?)\b/i;
function hvAssistCardKind(q, r) { const ids = r && r.data ? [].concat(r.data.success || [], r.data.targets || []).map(t => t && t.id || '') : [];
  if (ids.some(i => /^weather\./.test(i)) || HV_WX_Q.test(q || '')) return 'weather';
  if (ids.some(i => /^calendar\./.test(i)) || HV_CAL_Q.test(q || '')) return 'calendar'; return ''; }
// weather card (reads the weather entity + a one-off forecast subscription)
function hvAssistWeather(hub, el, keep) {
  const h = hub._hass, c = hub._config, id = c.weather_entity || (h.states['weather.forecast_home'] ? 'weather.forecast_home' : Object.keys(h.states).find(k => k.startsWith('weather.')));
  const s = id && h.states[id]; if (!s) return false; const a = s.attributes, sun = h.states['sun.sun'], night = sun ? sun.state === 'below_horizon' : false, u = a.temperature_unit || '°';
  const lang = (h.locale && h.locale.language) || navigator.language, tf = h.locale && h.locale.time_format;
  const ic = (cnd, nt) => (nt && cnd === 'partlycloudy') ? 'mdi:weather-night-partly-cloudy' : (WX_ICON[cnd] || 'mdi:weather-partly-cloudy');
  const card = document.createElement('div'); card.className = 'card wx'; card.style.setProperty('--wxbg', hubWeatherBg(s.state, night)); el.appendChild(card);
  let hrs = [], days = []; const paint = () => { const today = days[0];
    card.innerHTML = `<div class="ct"><ha-icon icon="mdi:map-marker-outline"></ha-icon>${esc(c.location_name || (h.config && h.config.location_name) || a.friendly_name || 'Weather')}</div>
      <div class="now"><ha-icon icon="${ic(s.state, night)}" style="color:${HUB_WX_COLOR[s.state] || '#fff'}"></ha-icon><div><div class="tmp">${a.temperature != null ? Math.round(a.temperature) + '°' : '—'}</div>
      <div class="cnd">${esc(fmtState(h, s))}</div><div class="hl">${today ? `H:${Math.round(today.temperature)}°  L:${Math.round(today.templow ?? today.temperature)}°` : esc(a.humidity != null ? `Humidity ${a.humidity}%` : '')}</div></div></div>
      ${hrs.length ? `<div class="hrs">${hrs.slice(0, 8).map((f, i) => { const d = new Date(f.datetime), hh = d.getHours(); const o = { hour: 'numeric' }; if (tf === '24') o.hour12 = false; else if (tf === '12') o.hour12 = true;
        return `<div class="h"><span class="t">${i ? esc(d.toLocaleTimeString(lang, o)) : 'Now'}</span><ha-icon icon="${ic(f.condition, hh < 6 || hh >= 20)}" style="color:${HUB_WX_COLOR[f.condition] || '#fff'}"></ha-icon><span>${Math.round(f.temperature)}°</span></div>`; }).join('')}</div>` : ''}`; keep(); };
  const sub = (type, cb) => { try { const p = h.connection.subscribeMessage(m => { cb(m.forecast || []); paint(); p.then(f => f && f()).catch(() => {}); }, { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: id }); if (p.catch) p.catch(() => {}); } catch (e) {} };
  paint(); sub('hourly', f => { hrs = f.filter(x => new Date(x.datetime) > Date.now() - 36e5); }); sub('daily', f => { days = f; }); return true; }
// calendar card (calendar events API: read only), range from the question: today / tomorrow / this week (default: next 7 days)
const HV_CAL_COLS = ['#7a5af8', '#0a84ff', '#30a14e', '#f08c00', '#ff375f', '#5ac8fa'];
async function hvAssistCalendar(hub, el, q, keep) {
  const h = hub._hass, c = hub._config, all = Object.keys(h.states).filter(k => k.startsWith('calendar.'));
  const ids = (Array.isArray(c.calendar_entities) && c.calendar_entities.length ? c.calendar_entities : all).filter(k => h.states[k]).slice(0, 8); if (!ids.length) return false;
  const now = new Date(), d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()); let from = now, to = new Date(d0.getTime() + 7 * 864e5), title = 'Next 7 days';
  if (/\btomorrow\b/i.test(q)) { from = new Date(d0.getTime() + 864e5); to = new Date(d0.getTime() + 2 * 864e5); title = 'Tomorrow'; }
  else if (/\b(today|tonight)\b/i.test(q)) { to = new Date(d0.getTime() + 864e5); title = 'Today'; }
  const card = document.createElement('div'); card.className = 'card cal'; card.innerHTML = `<div class="ct"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${title}</div><div class="none">Loading…</div>`; el.appendChild(card); keep();
  const lang = (h.locale && h.locale.language) || navigator.language, tf = h.locale && h.locale.time_format, to12 = tf === '24' ? false : tf === '12' ? true : undefined;
  const evs = []; await Promise.all(ids.map(async (id, k) => { try { const r = await h.callApi('GET', `calendars/${id}?start=${encodeURIComponent(from.toISOString())}&end=${encodeURIComponent(to.toISOString())}`);
    for (const e of r || []) { const ad = !!(e.start && e.start.date && !e.start.dateTime), st = ad ? new Date(e.start.date + 'T00:00:00') : new Date(e.start.dateTime || e.start);
      evs.push({ st, ad, s: e.summary || '(No title)', col: HV_CAL_COLS[k % HV_CAL_COLS.length] }); } } catch (e) {} }));
  evs.sort((a, b) => a.st - b.st || (b.ad - a.ad)); const list = evs.slice(0, 10); let html = `<div class="ct"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${title}</div>`, day = '';
  if (!list.length) html += `<div class="none">Nothing planned.</div>`;
  for (const e of list) { const dk = e.st.toDateString(); if (dk !== day) { day = dk; const dd = Math.round((new Date(e.st.getFullYear(), e.st.getMonth(), e.st.getDate()) - d0) / 864e5);
      html += `<div class="day">${dd <= 0 ? 'Today' : dd === 1 ? 'Tomorrow' : esc(e.st.toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric' }))}</div>`; }
    html += `<div class="ev" style="--cc:${e.col}"><i></i><span class="s">${esc(e.s)}</span><span class="tm">${e.ad ? 'All day' : esc(e.st.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit', hour12: to12 }))}</span></div>`; }
  if (evs.length > list.length) html += `<div class="none">+${evs.length - list.length} more</div>`;
  card.innerHTML = html; keep(); return true; }
/* 1.32.0: quiet mode, chosen per device (Off / On / Auto, kept in this browser's localStorage like the timer). Quiet = the reply is not spoken;
 * the request and the answer show as a caption under the orb. Auto: the card's volume sensor when it reports a number (quiet under
 * assistant_quiet_volume_below %, default 5; percent or 0-1), otherwise the quiet hours (assistant_quiet_start / _end, default 23:30-10:00);
 * a Focus / Do Not Disturb sensor that is on (assistant_quiet_focus_entity) makes it quiet too. */
const HV_QUIET_LS = 'nothomeview-assistant-quiet';
const hvQuietPref = () => { try { const v = localStorage.getItem(HV_QUIET_LS); return v === 'on' || v === 'auto' ? v : 'off'; } catch (e) { return 'off'; } };
const hvQuietSet = v => { try { if (v === 'on' || v === 'auto') localStorage.setItem(HV_QUIET_LS, v); else localStorage.removeItem(HV_QUIET_LS); } catch (e) { /* no storage */ } };
const hvHm = (s, d) => { const m = /^\s*(\d{1,2}):(\d{2})/.exec(String(s == null ? '' : s)); return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : d; };
const hvHmTxt = m => new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function hvQuietNow(c, h) {
  const mode = hvQuietPref(), S = id => (id && h && h.states && h.states[id]) || null, nm = s => (s.attributes && s.attributes.friendly_name) || s.entity_id;
  if (mode === 'off') return { mode, quiet: false, why: '', desc: 'Replies are spoken (when the assistant has a voice).' };
  if (mode === 'on') return { mode, quiet: true, why: 'Quiet mode', desc: 'Replies are not spoken: your request and the answer appear as text under the orb.' };
  const fs = S(c.assistant_quiet_focus_entity), focus = !!fs && !/^(off|false|none|unknown|unavailable|)$/i.test(String(fs.state).trim());
  const vs = S(c.assistant_quiet_volume_entity), vn = vs ? parseFloat(vs.state) : NaN, thr = Number(c.assistant_quiet_volume_below) > 0 ? Number(c.assistant_quiet_volume_below) : 5;
  let quiet = false, why = '', desc;
  if (vs && isFinite(vn)) { const pct = (vs.attributes && vs.attributes.unit_of_measurement === '%') || vn > 1 ? vn : vn * 100;
    desc = `Auto: quiet when ${nm(vs)} is under ${thr}% (now ${Math.round(pct)}%).`; if (pct < thr) { quiet = true; why = `Volume under ${thr}%`; } }
  else { const a = hvHm(c.assistant_quiet_start, 1410), b = hvHm(c.assistant_quiet_end, 600), d = new Date(), n = d.getHours() * 60 + d.getMinutes();
    const inside = a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
    desc = `Auto: quiet from ${hvHmTxt(a)} to ${hvHmTxt(b)}` + (vs ? ` (${nm(vs)} isn't reporting).` : ' (no volume sensor set for this Home Screen).'); if (inside) { quiet = true; why = 'Quiet hours'; } }
  if (fs) desc += ` Also quiet while ${nm(fs)} is on.`; if (focus && !quiet) { quiet = true; why = 'Focus is on'; }
  return { mode, quiet, why, desc: desc + (quiet ? ` Quiet now (${why.toLowerCase()}).` : ' Not quiet right now.') }; }
function hvAssist(hub, o) {
  o = o || {}; let compact = !!o.orb;
  const c = hub._config, h0 = hub._hass; const theme = c.assistant_theme && c.assistant_theme !== 'same' ? c.assistant_theme : c.theme;
  const host = document.createElement('homeview-assist'), sr = host.attachShadow({ mode: 'open' }); host.toggleAttribute('night', hvMode(theme, h0) !== 'day');
  sr.innerHTML = `<style>${ASSIST_CSS}</style><div class="ov"><div class="ow"><button class="bo" aria-label="Open the chat"><span class="ha"></span><span class="ri"></span><span class="co"><span class="bd1"></span><span class="bd2"></span><span class="sp"></span><span class="li"></span></span></button>
    <div class="ost" role="status"><span class="wave" aria-hidden="true"><i style="--k:.5"></i><i style="--k:.8"></i><i style="--k:1"></i><i style="--k:.6"></i><i style="--k:.9"></i><i style="--k:.45"></i><i style="--k:.7"></i></span><span class="olt"></span></div>
    <div class="ohint">Tap the orb to see the chat</div><div class="cap" hidden aria-live="polite"><div class="q"></div><div class="a"></div><div class="mt"><span class="why"></span><span>Tap orb for chat</span></div></div></div></div>
    <div class="wrap"><div class="bg"></div>
    <div class="cd" role="dialog" aria-modal="true" aria-label="Assistant"><div class="col" style="flex:1 1 auto">
    <div class="hd"><div class="grab" aria-hidden="true"></div><div class="orb" aria-hidden="true"></div><div class="ti"><b>Assistant</b><span class="pl"></span></div><button class="qb" aria-label="Quiet mode on this device" aria-expanded="false"><ha-icon></ha-icon><span></span></button><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
    <div class="qp" hidden><div class="qh">Quiet mode · this device</div><div class="seg" role="radiogroup" aria-label="Quiet mode"><button data-q="off" role="radio">Off</button><button data-q="on" role="radio">On</button><button data-q="auto" role="radio">Auto</button></div><div class="qd"></div></div>
    <div class="bd"><div class="log" aria-live="polite"></div></div>
    <div class="ft"><button class="mic" aria-label="Speak"><ha-icon icon="mdi:microphone"></ha-icon></button><form class="in"><input type="text" enterkeyhint="send" autocomplete="off" placeholder="Type to Assist…" aria-label="Type a request"><button class="snd" type="submit" aria-label="Send"><ha-icon icon="mdi:arrow-up-circle"></ha-icon></button></form></div>
    </div></div><button class="jump" aria-label="Show the newest message">Newest ↓</button></div>`;
  const $ = s => sr.querySelector(s), wrap = $('.wrap'), bd = $('.bd'), log = $('.log'), mic = $('.mic'), inp = $('input'), orb = $('.orb'), jump = $('.jump');
  const ov = $('.ov'), bo = $('.bo'), olt = $('.olt'), cap = $('.cap'); host.toggleAttribute('orb', compact);
  const pipe = c.assistant_pipeline && c.assistant_pipeline !== 'preferred' ? c.assistant_pipeline : null; let convId = null, rec = null, unsub = null, closed = false, player = null, runTok = 0, micS = null, keepCap = false;
  // 1.32.0: the orb (compact) view: status under the orb, the caption (quiet mode / no voice) and closing itself a few seconds after the reply
  let asked = false, capMode = compact, capWhy = '', capShown = false, dt = null;
  const orbLabel = { listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' };
  const showCap = (q, a, why, er) => { if (!compact) return; if (q != null) cap.querySelector('.q').textContent = q ? `“${q}”` : ''; cap.querySelector('.a').textContent = a || '';
    cap.querySelector('.why').innerHTML = why ? `<ha-icon icon="${er ? 'mdi:alert-circle-outline' : 'mdi:volume-off'}"></ha-icon>${esc(why)}` : ''; cap.classList.toggle('er', !!er);
    cap.hidden = false; capShown = true; host.setAttribute('cap', ''); };
  const hideCap = () => { cap.hidden = true; capShown = false; host.removeAttribute('cap'); };
  const st = s => { host.setAttribute('st', s); if (!compact) return; clearTimeout(dt); dt = null; olt.textContent = orbLabel[s] || (asked ? '' : 'Listening…');
    if (s === 'listening' && !keepCap) hideCap();
    if (s === 'idle' && asked) { const n = capShown ? (cap.querySelector('.a').textContent.length + cap.querySelector('.q').textContent.length) : 0;
      dt = setTimeout(() => { if (compact) close(); }, capShown ? Math.max(5000, Math.min(14000, 4000 + n * 55)) : 2500); } };
  // --- the chat: newest at the bottom; follows new content only while the user is at the bottom
  let stick = true; const atEnd = () => bd.scrollHeight - bd.scrollTop - bd.clientHeight < 48;
  const keep = () => { if (stick) requestAnimationFrame(() => { bd.scrollTop = bd.scrollHeight; }); else jump.classList.add('on'); };
  bd.addEventListener('scroll', () => { stick = atEnd(); if (stick) jump.classList.remove('on'); }, { passive: true });
  jump.addEventListener('click', () => { stick = true; jump.classList.remove('on'); bd.scrollTo({ top: bd.scrollHeight, behavior: 'smooth' }); });
  const add = (cls, html) => { const m = document.createElement('div'); m.className = 'm ' + cls; if (html != null) m.innerHTML = html; log.appendChild(m); keep(); return m; };
  const userMsg = text => add('u', esc(text));
  const rowsHtml = list => list.map(x => x.h ? `<div class="sec">${esc(x.h)}</div>` : `<div class="row ${x.c || 'p'}"><ha-icon icon="${esc(x.i || 'mdi:circle-small')}"></ha-icon><span class="tx">${esc(x.t)}</span>${x.r ? `<span class="rt">${esc(x.r)}</span>` : ''}</div>`).join('');
  const botMsg = () => add('a', '<div class="re"><span class="dots"><i></i><i></i><i></i></span></div><div class="rows"></div>');
  const fill = (m, text, extra) => { const r = hvAssistRows(text), re = m.querySelector('.re'); re.textContent = r.intro || (r.rows.length ? '' : text || '');
    if (compact && asked && capMode) showCap(null, [re.textContent].concat((extra || []).concat(r.rows).filter(x => x.t).map(x => '• ' + x.t + (x.r ? ' · ' + x.r : ''))).filter(Boolean).join('\n'), capWhy || 'Shown as text');
    m.classList.toggle('hi', !r.rows.length && !(extra || []).length && re.textContent.length < 40); m.querySelector('.rows').innerHTML = rowsHtml((extra || []).concat(r.rows)); keep(); };
  const say = (text, extra) => { const m = botMsg(); fill(m, text, extra); return m; };
  const note = (m, msg) => { if (!msg) return; if (compact) { asked = true; showCap(null, msg, 'Tap orb for details', true); } const e = document.createElement('div'); e.className = 'err'; e.setAttribute('role', 'alert'); e.textContent = msg; (m || add('a', '')).appendChild(e); keep(); };
  // first message + suggestions (they go away with the first request)
  const hello = say('How can I help?'); const sugEl = document.createElement('div'); sugEl.className = 'sug';
  sugEl.innerHTML = "<button>What time is it?</button><button>What's the weather like?</button><button>What's on my calendar?</button><button>Set a timer for 10 minutes</button>"; hello.appendChild(sugEl);
  // the pipeline (name in the header; which stages it has: no speech-to-text = typing only, no text-to-speech = silent replies)
  const pinfoP = (async () => { try { const r = await h0.callWS({ type: 'assist_pipeline/pipeline/list' }); const id = pipe || r.preferred_pipeline, p = (r.pipelines || []).find(x => x.id === id);
    if (p && !closed) $('.pl').textContent = p.name; if (!p && pipe && !closed) note(null, 'The assistant chosen for this Home Screen no longer exists. Pick another one in the Home Screen settings (Assistant & timer).');
    if (p && !p.stt_engine) mic.classList.add('nostt'); return p || null; } catch (e) { return null; } })();
  let pinfoCache = null; pinfoP.then(p => { pinfoCache = p; });
  const noStt = p => `“${p.name}” has no speech-to-text set up, so it can only read what you type. Type below, or choose a pipeline with speech-to-text (Settings → Voice assistants).`;
  // conversation agents that fail (an expired or wrong API key, the service is down) often answer with a generic apology instead of an error
  const agentErr = (sp, rt) => (rt === 'error' && !sp) || /unexpected error|problem (talking|communicating)|(invalid|incorrect|wrong) api key|unauthori[sz]ed|authenticat(ion|e) (error|failed)|quota|rate limit/i.test(sp || '');
  const micOff = () => { if (micS) { const m = micS; micS = null; m.getTracks().forEach(t => t.stop()); } };
  const micLive = () => !!micS && micS.getAudioTracks().some(t => t.readyState === 'live' && t.enabled);
  const stopRec = () => { if (!rec) return; const r = rec; rec = null; try { r.stop(); } catch (e) {} host.style.removeProperty('--lv'); host.style.removeProperty('--lv0'); };
  const endRun = () => { if (unsub) { const u = unsub; unsub = null; Promise.resolve(u).then(f => f && f()).catch(() => {}); } };
  // closing clears the chat and the conversation (a new popup starts fresh)
  const close = () => { if (closed) return; closed = true; clearTimeout(dt); runTok++; stopRec(); endRun(); convId = null; if (player) { player.stop(); player = null; } micOff();
    removeEventListener('keydown', key); host.classList.remove('in'); setTimeout(() => host.remove(), 320); hub._assistO = null; hvFhOpen.delete(host); };
  const key = e => { if (e.key === 'Escape' && !(HVTM.scr && HVTM.scr.isConnected)) close(); };
  // swipe down to close: from the header (always) or anywhere once the chat is scrolled to the top (hvSwipeClose leaves a scrolled list alone)
  if (!compact) hvFhOpen.add(host);
  // tap the orb (or its caption): the chat; tap anywhere else: close (only the orb is on screen, the dashboard stays clear)
  const expand = () => { if (!compact || closed) return; compact = false; clearTimeout(dt); dt = null; host.removeAttribute('orb'); host.removeAttribute('cap'); host.classList.remove('in'); hvFhOpen.add(host);
    requestAnimationFrame(() => requestAnimationFrame(() => { host.classList.add('in'); stick = true; bd.scrollTop = bd.scrollHeight; })); };
  ov.addEventListener('click', e => { const p = e.composedPath(); if (p.includes(bo) || p.includes(cap)) { hvSpkUnlock(); expand(); } else close(); });
  hvSwipeClose({ el: wrap, alive: () => host.isConnected && !closed, close, grab: (path, y) => y < $('.hd').getBoundingClientRect().bottom,
    dragOk: path => !path.some(n => n === $('.ft') || n === jump) });
  // a local timer command? (works with every pipeline, no satellite needed). The countdown opens over the chat; the chat stays.
  let wantDur = false;
  const timerCmd = text => { let ti = hvTimerIntent(text); if (!ti && wantDur && hvDuration(text) > 0) ti = { cmd: 'start', secs: Math.min(hvDuration(text), 86400), label: '' }; wantDur = false; if (!ti) return false;
    if (ti.cmd === 'ask') { wantDur = true; say('For how long?'); st('idle'); if (c.assistant_auto_listen !== false) setTimeout(() => { if (!closed && !rec) listen(true); }, 700); return true; } HVTM.opts.sound = c.timer_sound !== false; const s = HVTM.st;
    if (ti.cmd === 'start') { say(`Timer set for ${hvSayLeft(ti.secs * 1000)}.`, [{ c: 'o', i: 'mdi:timer-outline', t: (ti.label ? ti.label.replace(/^./, x => x.toUpperCase()) + ' timer' : 'Timer'), r: hvFmtTotal(ti.secs) }]); st('idle');
      setTimeout(() => { if (!closed) HVTM.start(ti.secs, ti.label); }, 900); return true; }
    if (!s) { say("There's no timer running."); st('idle'); return true; }
    if (ti.cmd === 'cancel') { HVTM.cancel(); say('Timer cancelled.'); }
    else if (ti.cmd === 'pause') { HVTM.pause(); say(`Timer paused with ${hvSayLeft(HVTM.left())} left.`); }
    else if (ti.cmd === 'resume') { HVTM.resume(); say(`Timer resumed: ${hvSayLeft(HVTM.left())} left.`); setTimeout(() => { if (!closed) HVTM.show(); }, 900); }
    else say(s.done ? 'Your timer is done.' : `${hvSayLeft(HVTM.left())} left${s.paused != null ? ' (paused)' : ''}.`);
    st('idle'); return true; };
  const ask = (text, um) => { const tok = ++runTok; sugEl.hidden = true; stick = true; if (!um) userMsg(text); asked = true; keepCap = false; capMode = compact; capWhy = ''; if (compact) cap.querySelector('.q').textContent = `“${text}”`; if (timerCmd(text)) return;
    st('thinking'); endRun(); run(text, tok, true, botMsg()); };
  const run = async (text, tok, tts, m) => { const pi = await pinfoP; if (tok !== runTok) return; const qn = hvQuietNow(c, hub._hass); const speak = tts && !qn.quiet && c.assistant_speak !== false && !(pi && !pi.tts_engine);
    capMode = compact && !speak; capWhy = qn.quiet ? qn.why + ' · shown as text' : 'Shown as text';
    const msg = { type: 'assist_pipeline/run', start_stage: 'intent', end_stage: speak ? 'tts' : 'intent', input: { text }, conversation_id: convId };
    if (pipe) msg.pipeline = pipe; let streamed = '', answered = false, cont = false; const re = m.querySelector('.re');
    const failed = er => { if (tok !== runTok) return; if (speak && !answered && /text.to.speech|tts/i.test(er || '')) { endRun(); run(text, tok, false, m); return; } // no voice for the reply: answer silently
      if (!answered) re.textContent = ''; note(m, er || 'The assistant could not answer.'); st('idle'); micOff(); };
    try { unsub = hub._hass.connection.subscribeMessage(ev => { if (tok !== runTok) return; const d = ev.data || {};
      if (ev.type === 'intent-progress') { const dl = d.chat_log_delta; if (dl && typeof dl.content === 'string') { streamed += dl.content; re.textContent = streamed; keep(); } }
      else if (ev.type === 'intent-end') { answered = true; const o = d.intent_output || {}, r = o.response || {}; convId = o.conversation_id || convId;
        const sp = (r.speech && r.speech.plain && r.speech.plain.speech) || ''; const ex = [];
        if (r.response_type === 'action_done' && r.data) { for (const t of (r.data.success || []).slice(0, 8)) { if (/^(weather|calendar)\./.test(t.id || '')) continue; const s0 = t.id && hub._hass.states[t.id];
          ex.push({ c: 'g', i: 'mdi:check-circle', t: t.name || t.id, r: s0 ? fmtState(hub._hass, s0) : '' }); }
          for (const t of (r.data.failed || []).slice(0, 4)) ex.push({ c: 'o', i: 'mdi:alert-circle-outline', t: t.name || t.id, r: 'failed' }); }
        const bad = agentErr(sp, r.response_type), quota = bad && /resource.exhausted|quota|rate.limit|\b429\b|too many requests/i.test(sp);
        // an agent error can carry the provider's raw error payload (JSON): show only its first sentence
        const shown = bad ? ((sp.split(/\s*[{\[]|\n|\.:/)[0] || '').trim().replace(/[:\s]+$/, '') || 'Sorry, something went wrong.') : sp;
        fill(m, shown || (r.response_type === 'error' ? 'Sorry, something went wrong.' : 'Done.'), ex); st(speak ? 'thinking' : 'idle');
        cont = !bad && r.response_type !== 'error' && (o.continue_conversation === true || /\?["”'’)\s]*$/.test(shown || ''));
        const an = `“${(pinfoCache || {}).name || 'This assistant'}”`;
        if (bad && !/timer/i.test(text)) note(m, quota ? `${an} couldn't answer: its AI service has hit its usage limit (quota) for now. Try again later, or pick another assistant in the Home Screen settings.`
          : `${an} couldn't answer: its conversation agent reported an error. Check that integration (for example its API key) in Settings → Devices & services, or pick another assistant in the Home Screen settings.`);
        // answer cards: weather / calendar, from this Home Assistant's own states (read only)
        const kind = hvAssistCardKind(text, r); if (kind === 'weather') hvAssistWeather(hub, m, keep); else if (kind === 'calendar') hvAssistCalendar(hub, m, text, keep);
        // the agent itself may have tried a timer (HassStartTimer needs a satellite): fall back to ours
        if (r.response_type === 'error' && /timer/i.test(text)) timerCmd(text);
        if (!speak) done(cont); }
      else if (ev.type === 'tts-end') { const u = d.tts_output && d.tts_output.url; // no sound: show the reply as text (and why)
        const txt = why => { if (compact && !capShown) showCap(null, re.textContent, why || 'Shown as text'); done(cont); };
        if (u && !closed) { micOff(); if (player) player.stop(); const me = player = hvPlayTts(hub._hass, u, { start: () => { if (player === me) st('speaking'); },
          end: () => { if (player !== me) return; player = null; done(cont); },
          fail: e => { if (player !== me) return; player = null; const n = (e && (e.name || e.message)) || 'error'; console.warn('NotHomeView: the spoken reply could not play', e);
            if (!compact) note(m, `The spoken reply couldn't play on this device (${n}).`); txt(`Sound couldn't play (${n}) · shown as text`); } }); }
        else txt(); }
      else if (ev.type === 'error') failed(d.message || d.code);
      else if (ev.type === 'run-end') { endRun(); if (host.getAttribute('st') === 'thinking' && !player) st('idle'); } }, msg);
      if (unsub && unsub.catch) unsub.catch(e => failed((e && e.message) || 'The assistant is not available.')); }
    catch (e) { failed(String(e && e.message || e)); } };
  // 1.32.0: after the reply (spoken, or shown as text): listen again when the assistant asked something (a question mark, or the
  // agent's continue_conversation), with the same conversation; otherwise finish (the orb closes a few seconds later)
  const done = cnt => { if (closed) return; if (cnt && c.assistant_continue !== false) { listen(true, true); return; } st('idle'); micOff(); };
  // live line while speaking: Home Assistant's pipelines send the words only when speech-to-text is done (no partial text), so the
  // bubble shows that it hears you (level bars, "Hearing you…") and then writes the transcript in word by word
  const liveMsg = () => { const m = add('u live', '<span class="lt">Listening…</span><span class="wave" aria-hidden="true"><i style="--k:.5"></i><i style="--k:1"></i><i style="--k:.7"></i><i style="--k:.9"></i><i style="--k:.4"></i></span>'); return m; };
  const typeIn = (m, text) => { m.classList.remove('live'); if (compact) cap.querySelector('.q').textContent = `“${text}”`; m.innerHTML = text.split(/(\s+)/).map((w, i) => /^\s+$/.test(w) ? w : `<span class="w" style="animation-delay:${Math.min(i * 30, 900)}ms">${esc(w)}</span>`).join(''); keep(); };
  // --- voice: mic -> 16 kHz PCM -> stt stage; the transcript then goes through ask()
  const listen = async (auto, fol) => {
    if (rec) { rec.finish(); return; } // second tap: done speaking
    if (player) { player.stop(); player = null; } hvSession('auto');
    const pi = await pinfoP; if (closed) return; if (pi && !pi.stt_engine) { if (!auto) note(null, noStt(pi)); else if (compact) expand(); st('idle'); return; } // opened by itself: no error, the dimmed mic explains on a tap
    const md = navigator.mediaDevices; if (!window.isSecureContext || !md || !md.getUserMedia) {
      note(null, "This browser can't use the microphone here (it needs HTTPS and microphone support). Type your request below instead."); mic.disabled = true; return; }
    const ac = hvAudio(); let stream; asked = true; keepCap = !!(fol && compact && capShown);
    if (keepCap) cap.querySelector('.why').innerHTML = '<ha-icon icon="mdi:microphone"></ha-icon>Listening for your answer…'; st('listening'); sugEl.hidden = true; stick = true; const lm = liveMsg(), lt = lm.querySelector('.lt');
    const drop = () => { if (lm.isConnected) lm.remove(); };
    try { stream = micLive() ? micS : await md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }); micS = stream; } // the open mic is reused for a follow-up
    catch (e) { st('idle'); drop(); const n = e && e.name;
      note(null, n === 'NotAllowedError' || n === 'SecurityError' ? 'Microphone access was blocked. Allow the microphone for this site (browser or app settings), or type your request below.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No microphone was found on this device. Type your request below.' : "The microphone couldn't start (" + (e && e.message || n) + '). Type your request below.'); return; }
    if (closed) { micOff(); return; }
    const tok = ++runTok; let hid = null, q = [], ended = false, sentEnd = false, srcN = null, proc = null; const RATE = ac ? ac.sampleRate : 48000;
    const sendBin = buf => { const sock = hub._hass.connection.socket; if (!sock || sock.readyState !== 1) return; const b = new Uint8Array(1 + buf.byteLength); b[0] = hid; b.set(new Uint8Array(buf.buffer || buf), 1); sock.send(b); };
    let ratio = RATE / 16000, carry = new Float32Array(0), acc = [], accN = 0;
    const onPcm = f32 => { if (ended) return; let lv = 0; for (let i = 0; i < f32.length; i += 8) lv = Math.max(lv, Math.abs(f32[i])); const l0 = Math.min(1, lv * 4);
      host.style.setProperty('--lv', (1 + Math.min(0.35, lv * 1.6)).toFixed(3)); host.style.setProperty('--lv0', l0.toFixed(2));
      const all = new Float32Array(carry.length + f32.length); all.set(carry); all.set(f32, carry.length); const n = Math.floor(all.length / ratio), out = new Int16Array(n);
      for (let i = 0; i < n; i++) { const p = i * ratio, k = Math.floor(p), fr = p - k, a = all[k], b = all[Math.min(k + 1, all.length - 1)], v = a + (b - a) * fr; out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff; }
      carry = all.slice(Math.floor(n * ratio)); acc.push(out); accN += n;
      if (accN >= 1600) { const m = new Int16Array(accN); let o = 0; for (const x of acc) { m.set(x, o); o += x.length; } acc = []; accN = 0; if (hid != null) sendBin(m); else q.push(m); } };
    const stopAudio = () => { try { proc && proc.disconnect(); srcN && srcN.disconnect(); } catch (e) {} }; // the stream stays open (micS) until a reply is spoken or the assistant closes
    const finish = () => { if (ended) return; ended = true; stopAudio(); host.style.removeProperty('--lv'); host.style.removeProperty('--lv0'); if (hid != null && !sentEnd) { sentEnd = true; const sock = hub._hass.connection.socket; if (sock && sock.readyState === 1) sock.send(new Uint8Array([hid])); }
      if (tok === runTok) { st('thinking'); if (lt) lt.textContent = 'Got it…'; } };
    rec = { finish, stop: () => { finish(); runTok++; endRun(); drop(); } };
    try { srcN = ac.createMediaStreamSource(stream);
      if (ac.audioWorklet && window.AudioWorkletNode) {
        if (!window.__hvWorklet) window.__hvWorklet = ac.audioWorklet.addModule(URL.createObjectURL(new Blob([`registerProcessor('hv-rec',class extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}})`], { type: 'text/javascript' })));
        await window.__hvWorklet; proc = new AudioWorkletNode(ac, 'hv-rec'); proc.port.onmessage = e => onPcm(e.data); srcN.connect(proc); }
      else { proc = ac.createScriptProcessor(4096, 1, 1); proc.onaudioprocess = e => onPcm(e.inputBuffer.getChannelData(0)); srcN.connect(proc); proc.connect(ac.destination); } }
    catch (e) { stopAudio(); micOff(); rec = null; st('idle'); drop(); note(null, "The microphone couldn't start (" + (e && e.message || e) + '). Type your request below.'); return; }
    endRun(); const msg = { type: 'assist_pipeline/run', start_stage: 'stt', end_stage: 'stt', input: { sample_rate: 16000 }, timeout: 60 }; if (pipe) msg.pipeline = pipe;
    const safety = setTimeout(() => { if (rec && rec.finish === finish) finish(); }, 15000); // never listen for more than 15 s
    // a follow-up: nobody answers within a few seconds -> stop listening (the orb closes)
    let heard = false; const quietEnd = () => { clearTimeout(sil); if (closed) return; if (rec && rec.finish === finish) rec.stop(); rec = null; keepCap = false; micOff(); if (compact) close(); else st('idle'); };
    const sil = fol ? setTimeout(() => { if (!heard && tok === runTok) quietEnd(); }, keepCap ? 8000 : 6000) : null;
    const fail = m => { clearTimeout(safety); clearTimeout(sil); if (fol && !heard) { quietEnd(); return; } finish(); rec = null; endRun(); st('idle'); drop(); micOff(); note(null, m); };
    try { unsub = hub._hass.connection.subscribeMessage(ev => { if (tok !== runTok) return; const d = ev.data || {};
      if (ev.type === 'run-start') { hid = d.runner_data && d.runner_data.stt_binary_handler_id; if (hid == null) return; for (const m of q) sendBin(m); q = []; if (ended && !sentEnd) { sentEnd = true; hub._hass.connection.socket.send(new Uint8Array([hid])); } }
      else if (ev.type === 'stt-vad-start') { heard = true; clearTimeout(sil); if (lt) lt.textContent = 'Hearing you…'; }
      else if (ev.type === 'stt-vad-end') finish();
      else if (ev.type === 'stt-end') { clearTimeout(safety); clearTimeout(sil); finish(); rec = null; endRun(); const t = ((d.stt_output || {}).text || '').trim();
        if (!t) { if (fol) { drop(); quietEnd(); return; } st('idle'); drop(); micOff(); say("Sorry, I didn't catch that."); return; } typeIn(lm, t); ask(t, lm); }
      else if (ev.type === 'error') fail(d.code === 'stt-no-text-recognized' ? "Sorry, I didn't catch that. Try again or type below."
        : d.code === 'stt-stream-failed' ? `The speech-to-text service of “${(pinfoCache || {}).name || 'this assistant'}” failed. Try again, type below, or choose a pipeline with another speech-to-text engine (Settings → Voice assistants).`
        : (d.message || d.code || 'Speech recognition failed.'));
      else if (ev.type === 'run-end') { if (rec && rec.finish === finish) { finish(); rec = null; } } }, msg);
      if (unsub && unsub.catch) unsub.catch(e => { if (tok !== runTok) return; const m = (e && e.message) || ''; fail(/speech.to.text|stt/i.test(m) && pinfoCache ? noStt(pinfoCache) : m || 'The assistant is not available.'); }); }
    catch (e) { fail(String(e && e.message || e)); } };
  sugEl.addEventListener('click', e => { const b = e.composedPath().find(n => n.tagName === 'BUTTON'); if (b) { hvSpkUnlock(); stopRec(); ask(b.textContent.replace(/\?$/, '')); } });
  const qb = $('.qb'), qp = $('.qp'), qPaint = () => { const q = hvQuietNow(c, hub._hass);
    qb.querySelector('ha-icon').setAttribute('icon', q.mode === 'off' ? 'mdi:volume-high' : q.quiet ? 'mdi:volume-off' : 'mdi:volume-medium');
    qb.querySelector('span').textContent = 'Quiet: ' + ({ off: 'Off', on: 'On', auto: 'Auto' })[q.mode]; qb.classList.toggle('on', q.mode !== 'off');
    qp.querySelectorAll('[data-q]').forEach(b => { const on = b.dataset.q === q.mode; b.classList.toggle('sel', on); b.setAttribute('aria-checked', String(on)); }); qp.querySelector('.qd').textContent = q.desc; };
  qb.addEventListener('click', () => { qp.hidden = !qp.hidden; qb.setAttribute('aria-expanded', String(!qp.hidden)); qPaint(); });
  qp.addEventListener('click', e => { const b = e.composedPath().find(n => n.dataset && n.dataset.q); if (b) { hvQuietSet(b.dataset.q); qPaint(); } }); qPaint();
  $('.x').addEventListener('click', close); hvPen($('.x'), hub._penFn(), { gap: 8 }); mic.addEventListener('click', () => { hvSpkUnlock(); listen(); });
  $('form').addEventListener('submit', e => { e.preventDefault(); const t = inp.value.trim(); if (!t) return; hvSpkUnlock(); stopRec(); inp.value = ''; ask(t); });
  addEventListener('keydown', key); st('idle');
  (hub.shadowRoot || document.body).appendChild(host); requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('in')));
  return { close, listen, ask, host, expand }; }

try { if (typeof localStorage !== 'undefined' && localStorage.getItem(HVTM.KEY)) setTimeout(() => HVTM.load(), 0); } catch (e) { /* no storage */ }
class HVHubCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._layer = 0; }
  static get defaults() { return { theme: 'night', person: '', morning_start: 5, afternoon_start: 12, evening_start: 17, greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening', photo_source_mode: 'media', photo_album_url: '', photo_source: '', photo_interval: 25, photo_order: 'random', blur: 32, dim: 0.32, bg_transparency: 60, photo_backdrop: true, bg_freeze: true, photo_tap: 'viewer', photo_viewer_nav: true, photo_viewer_swipe: true, photo_viewer_add: true, photo_gallery_upload: true, photo_viewer_pause: true, photo_label: 'Photos', photo_max_aspect: 2.6,
    show_calendar: true, calendar_layout: 'wide', calendar_columns: 3, calendar_days: 7, calendar_title: 'Calendar', calendar_min_height: 240, max_icon: 140, edge_sidebar: true, ss_hold: true, weather_entity: '', photo_size: 'wide', side_portrait: 'below', side_sizes: '', row_units: 3, block_pull_refresh: true, calendar_rows: 'auto', swipe_screensaver: 'auto', full_height_popups: true, popup_edit: true, assistant_enabled: false, assistant_pipeline: 'preferred', assistant_theme: 'same', assistant_button: true, assistant_speak: true, assistant_auto_listen: true, assistant_orb: true, assistant_continue: true, assistant_quiet_volume_below: 5, assistant_quiet_start: '23:30', assistant_quiet_end: '10:00', timer_sound: true }; }
  static getStubConfig(hass) { return { apps: HUB_APPS.map(a => Object.assign({}, a)), calendar_entities: Object.keys((hass && hass.states) || {}).filter(k => k.startsWith('calendar.')).slice(0, 3) }; }
  static getConfigElement() { return document.createElement('homeview-hub-card-editor'); }
  setConfig(c) { if (!c) throw new Error('Invalid configuration'); this._hvRaw = c; const old = this._config, nc = Object.assign({}, HVHubCard.defaults, c);
    if (nc.wallpaper && typeof nc.wallpaper === 'string') this.style.setProperty('--hv-wall', nc.wallpaper); else this.style.removeProperty('--hv-wall'); // 1.31.0
    this._blurX = c.blur !== undefined && c.blur !== null && c.blur !== '' && Number(c.blur) !== HVHubCard.defaults.blur; // an explicit Advanced blur (not the default value) stays exactly as set; the default one follows the transparency slider
    if (!Array.isArray(nc.apps) || !nc.apps.length) nc.apps = HUB_APPS;
    const BG = ['bg_transparency', 'blur', 'dim', 'photo_backdrop', 'bg_freeze'], rest = o => JSON.stringify(Object.keys(o).filter(k => !BG.includes(k)).sort().map(k => [k, o[k]]));
    if (old && this._w && rest(old) === rest(nc)) { // only the background options changed (slider drag): update in place, no rebuild
      this._config = nc; this.style.setProperty('--blur', (Number(nc.blur) || 0) + 'px'); this.style.setProperty('--dim', String(Math.max(0, Math.min(0.9, Number(nc.dim) || 0)))); this._bgMode(); if (nc.bg_freeze === false) this._paintBg(true, true); return; }
    this._config = nc;
    this._sig = null; if (old && (old.photo_source !== c.photo_source || old.photo_order !== c.photo_order || old.photo_source_mode !== c.photo_source_mode || old.photo_album_url !== c.photo_album_url)) { this._ids = null; this._idsExp = 0; this._loadPhotos(); }
    this._calSig = null; this._render(); this._restartTimer(); if (this.isConnected) hvPTR.set(this, this._config.block_pull_refresh !== false); }
  set hass(h) { const first = !this._hass; this._hass = h; this._render(); if (this._cal) this._cal.hass = h; (this._sideEls || []).forEach(e => { e._card.hass = this._simHass(h);
      if (e._fit) { const o = hubTileOpt(this._config, this._sideEls.indexOf(e)); if (o.sky === true && hvSky(h, o.sky_entity, window.__hvSimScene).sig !== e._skySig) requestAnimationFrame(() => this._fitTile(e)); } }); if (first) { this._loadPhotos(); this._loadCfg(); } if (this._sheetO) this._sheetO.hass = h; }
  get hass() { return this._hass; }
  set editMode(v) { this._edit = v; this._layout(); this._ssPaint(); if (v) hvEditChromeSoon(this); }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 'full', rows: 'auto', min_columns: 12 }; }
  connectedCallback() { HV_HUBS.add(this);
    if (!this._bound) this._bound = () => this._layout();
    addEventListener('resize', this._bound); addEventListener('orientationchange', this._bound); addEventListener('hv-layout', this._bound); if (window.visualViewport) visualViewport.addEventListener('resize', this._bound);
    if (window.ResizeObserver && !this._ro) { this._ro = new ResizeObserver(() => this._layout()); this._ro.observe(this); }
    this._edgeBind(true); hvPTR.set(this, (this._config || {}).block_pull_refresh !== false); this._ssBind(true); if (this._hass) this._loadCfg(true);
    if (!this._tpf) this._tpf = () => this._tpillPaint(); hvTimerPills.add(this._tpf); this._tpillPaint();
    clearInterval(this._tick); this._tick = setInterval(() => { this._sig = null; this._render(); if (++this._tn % 4 === 0) this._loadCfg(true); else this._ssPaint(); }, 30000); this._tn = 0;
    if (!this._vis) { this._vis = () => { if (!document.hidden) this._restartTimer(); else this._paintBg(true, true); }; } document.addEventListener('visibilitychange', this._vis);
    requestAnimationFrame(() => this._layout()); setTimeout(() => this._layout(), 700); setTimeout(() => this._layout(), 1800);
    for (const t of [2500, 6000]) setTimeout(() => { this._vk = null; this._layout(); }, t); // re-measure the space below once the page has settled
    if (this._hass) this._loadPhotos(); this._restartTimer(); this._paintBg(true, true); // back on the Home Screen (from another view): one instant catch-up before it shows
  }
  _tpillPaint() { const p = this._tpill; if (!p) return; const s = HVTM.st, on = !!s && this._config.assistant_enabled === true && !(HVTM.scr && HVTM.scr.isConnected); p.hidden = !on;
    if (on) { const t = s.done ? 'Done' : hvFmtLeft(HVTM.left()) + (s.paused != null ? ' ❚❚' : ''); const sp = p.querySelector('span'); if (sp.textContent !== t) sp.textContent = t; } }
  _openAssist() { if (this._assistO || !this._hass) return; hvSpkUnlock(); HVTM.opts.sound = this._config.timer_sound !== false; const al = this._config.assistant_auto_listen !== false;
    this._assistO = hvAssist(this, { orb: al && this._config.assistant_orb !== false }); if (al) this._assistO.listen(true); }
  disconnectedCallback() { HV_HUBS.delete(this); hvTimerPills.delete(this._tpf); if (this._assistO) this._assistO.close(); clearInterval(this._ssHoldIv); this._ssHoldIv = null; this._edgeBind(false); hvPTR.set(this, false); this._ssBind(false); if (this._galO) this._galO.close(); if (this._sheetO) this._sheetO.close(); this._ssPause(false); clearInterval(this._tick); clearTimeout(this._timer); this._timer = null;
    removeEventListener('resize', this._bound); removeEventListener('orientationchange', this._bound); removeEventListener('hv-layout', this._bound); if (window.visualViewport) visualViewport.removeEventListener('resize', this._bound);
    document.removeEventListener('visibilitychange', this._vis); }
  // --- dashboard config (Wallpanel settings, views for the sheets), cached
  async _loadCfg(force) { if (!this._hass) return this._lcfg; if (this._lcfgP && !force) return this._lcfgP;
    this._lcfgP = (async () => { try { const m = { type: 'lovelace/config' }; const d = ssDash(); if (d) m.url_path = d; this._lcfg = await this._hass.callWS(m); } catch (e) {} this._ssPaint(); return this._lcfg; })();
    return this._lcfgP; }
  // --- swipe down from the top: start the Wallpanel screensaver (only when it is enabled here)
  _viewPath() { return decodeURIComponent(location.pathname.split('/')[2] || ''); }
  _wpOnHere() { return !!(this._hass && this._lcfg && hvWallpanelOn(this._hass, (this._lcfg || {}).wallpanel, this._viewPath())); } // Wallpanel's screensaver enabled on this view
  _ssEnabled() { const m = (this._config || {}).swipe_screensaver; if (m === 'off' || m === false) return false; const w = ssWallpanel(); if (!w || typeof w.startScreensaver !== 'function') return false;
    return this._wpOnHere(); } // 1.30.4: 'on' no longer starts a screensaver that is turned off
  _wpNote() { // small note on the Home Screen when the dashboard asks for the screensaver but Wallpanel is missing
    const c = this._config || {}, wp = (this._lcfg || {}).wallpanel, want = !!this._lcfg && ((wp && wp.enabled === true) || c.swipe_screensaver === 'on');
    let n = this.shadowRoot && this.shadowRoot.querySelector('.wpn'); const show = want && !this._edit && hvWpMissing();
    if (!show) { if (n) n.remove(); if (want && !hvHasWallpanel() && !this._wpT) this._wpT = setTimeout(() => { this._wpT = null; this._wpNote(); }, 13000); return; }
    if (!n) { n = document.createElement('div'); n.className = 'wpn'; n.setAttribute('role', 'note'); n.textContent = HV_WP_HINT; this.shadowRoot.appendChild(n); hvWhenWallpanel(() => this._wpNote()); } }
  _ssPaint() { this._wpNote(); this._wpOn = this._wpOnHere(); this._ssOn = !!(this._hass && this._lcfg && this._ssEnabled()); if (this._ssp) this._ssp.hidden = !this._ssOn || !!this._edit; this._ssHoldSet(); }
  // 1.30.2: while the Home Screen is showing and the screensaver is on here, the screensaver stays paused in the background: Wallpanel's idle clock is kept fresh (so it
  // never starts by itself behind the page and costs nothing), and only the Photos card changes its picture, on its own interval. Swiping the page away starts it again.
  _ssHoldSet() { const on = !!this._wpOn && this._config && this._config.ss_hold !== false && this.isConnected && !this._edit;
    if (on && !this._ssHoldIv) { this._ssHoldTick(); this._ssHoldIv = setInterval(() => this._ssHoldTick(), 2000); } else if (!on && this._ssHoldIv) { clearInterval(this._ssHoldIv); this._ssHoldIv = null; } }
  _ssHeld() { const w = ssWallpanel(); return !!((w && w.screensaverRunning && w.screensaverRunning()) || this._ssBusy || (this._ssv && this._ssv.style.display === 'block')); } // screensaver up / being pulled in: the card's picture stays as it is
  _ssHoldTick() { if (!this._wpOn || this._edit || !this.isConnected || (this._config && this._config.ss_hold === false) || document.hidden || !this.getClientRects().length) return;
    const w = ssWallpanel(); if (w && !(w.screensaverRunning && w.screensaverRunning())) w.idleSince = Date.now(); }
  // start Wallpanel on the picture the Photos card shows now: Wallpanel keeps its list of photos (the same media-source ids as ours) and steps to the next entry on start,
  // so pointing its index one before ours makes the first photo it shows ours (matched by id; by file name if the id is not in its list)
  _ssSync(w) { try { const L = w && w.mediaList; if (!Array.isArray(L) || !L.length) return false; let i = this._curId ? L.indexOf(this._curId) : -1;
      if (i < 0 && this._cur) { const nm = x => { try { return decodeURIComponent(String(x).split('?')[0].split('/').pop()).toLowerCase(); } catch (e) { return ''; } }, b = nm(this._cur);
        if (b) i = L.findIndex(m => typeof m === 'string' && nm(m) === b); }
      if (i < 0) return false; w.mediaListDirection = 'forwards'; w.mediaIndex = i - 1; return true; } catch (e) { return false; } }
  // Pull down from the top: the launch page follows the finger and reveals a preview of the screensaver (the current photo,
  // blurred -> sharp, with the clock); past the threshold (or a fast flick) the page carries on off the bottom while Wallpanel
  // starts right away; the preview holds until Wallpanel's own layer is up, then the page is put back underneath. Below the
  // threshold it springs back. Transforms / opacity only.
  _ssBind(on) {
    if (!this._ssH) { let g = null;
      const ok = t => this._ssOn && !this._edit && !this._sheetO && !this._ssBusy && this.isConnected && !hvFhBusy() && !this.hasAttribute('contained') && scrollY <= 2 && t.clientX > 28
        && t.clientY <= this._px('var(--hv-safe-top, env(safe-area-inset-top, 0px))') + 96;
      const ts = e => { g = null; if (e.touches.length !== 1) return; const t = e.touches[0]; if (!ok(t)) return; g = { x: t.clientX, y: t.clientY, on: false, pts: [] }; };
      const tm = e => { if (!g) return; const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
        if (!g.on) { if (Math.abs(dx) > 14 && Math.abs(dx) > dy) { g = null; return; } if (dy < -6) { g = null; return; }
          if (dy > 10 && dy > Math.abs(dx) * 1.2) { g.on = true; g.y0 = t.clientY; this._ssPrev(true); } else return; }
        if (e.cancelable) e.preventDefault(); const d = Math.max(0, t.clientY - g.y0), now = performance.now();
        g.pts.push([now, d]); if (g.pts.length > 5) g.pts.shift(); g.dy = d;
        if (!g.raf) g.raf = requestAnimationFrame(() => { g && (g.raf = 0, this._ssPose(g.dy, false)); }); };
      const te = () => { if (!g) return; const s0 = g; g = null; if (!s0.on) return; cancelAnimationFrame(s0.raf);
        const H = innerHeight || 800, p = s0.pts, v = p.length > 1 ? (p[p.length - 1][1] - p[0][1]) / Math.max(1, p[p.length - 1][0] - p[0][0]) : 0;
        if ((s0.dy || 0) > H * 0.25 || (v > 0.55 && s0.dy > 40)) this._ssCommit(s0.dy, v); else this._ssSpring(); };
      this._ssH = [['touchstart', ts, { capture: true, passive: true }], ['touchmove', tm, { capture: true, passive: false }], ['touchend', te, true], ['touchcancel', te, true]]; }
    if (!!on !== !!this._ssOnB) for (const [t, f, o] of this._ssH) on ? addEventListener(t, f, o) : removeEventListener(t, f, o); this._ssOnB = !!on; }
  _ssPrev(show) { let v = this._ssv;
    if (!v) { v = this._ssv = document.createElement('div'); v.className = 'ssv';
      v.innerHTML = '<div class="ssin"><div class="ssb"></div><div class="sss"></div><div class="ssg"></div><div class="ssc"><div class="sst"></div><div class="ssd"></div></div></div>'; this.shadowRoot.appendChild(v); }
    if (!show) { v.style.display = 'none'; return v; }
    const bg = this._cur ? `url("${this._cur.replace(/"/g, '%22')}")` : ''; v.querySelector('.ssb').style.backgroundImage = bg; v.querySelector('.sss').style.backgroundImage = bg;
    const n = new Date(), lang = (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language;
    v.querySelector('.sst').textContent = n.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
    v.querySelector('.ssd').textContent = n.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' });
    v.style.display = 'block'; this._ssPose(0, false); return v; }
  // dy = how far the page is pulled down; the preview hangs above the page (its picture held still), sharpening as it opens
  _ssPose(dy, anim, dur, ease) { const H = innerHeight || 800, p = Math.max(0, Math.min(1, dy / H)), v = this._ssv; if (!v) return;
    const tr = anim ? `transform ${dur}ms ${ease}, opacity ${dur}ms ${ease}` : 'none', bg = this.shadowRoot.querySelector('.bg');
    for (const el of [this._w, bg]) { if (!el) continue; el.style.willChange = 'transform'; el.style.transition = tr; el.style.transform = dy > 0.5 ? `translate3d(0,${dy.toFixed(1)}px,0)` : ''; }
    const inn = v.querySelector('.ssin'); v.style.transition = tr; inn.style.transition = tr; v.style.transform = `translate3d(0,${(dy - H).toFixed(1)}px,0)`; inn.style.transform = `translate3d(0,${(H - dy).toFixed(1)}px,0)`;
    const q = Math.min(1, p * 1.8); for (const [c, o] of [['.sss', q], ['.ssc', Math.max(0, (p - 0.15) * 1.6)], ['.ssg', 1 - q * 0.6]]) { const e = v.querySelector(c); e.style.transition = anim ? `opacity ${dur}ms ${ease}` : 'none'; e.style.opacity = String(Math.min(1, o).toFixed(3)); } }
  _ssSpring() { this._ssBusy = true; this._ssPose(0, true, 380, 'cubic-bezier(.32,.72,0,1)'); setTimeout(() => { this._ssReset(); this._ssBusy = false; }, 400); }
  _ssReset() { const bg = this.shadowRoot.querySelector('.bg'); for (const el of [this._w, bg]) if (el) { el.style.transition = 'none'; el.style.transform = ''; el.style.willChange = ''; }
    if (this._ssv) { this._ssv.style.transition = 'none'; this._ssv.style.opacity = ''; this._ssPrev(false); } }
  _ssCommit(dy, v) { this._ssBusy = true; const H = innerHeight || 800, rest = H - dy, dur = Math.round(Math.max(200, Math.min(340, v > 0.3 ? rest / Math.max(v, 1.2) : 320)));
    this._ssPose(H, true, dur, 'cubic-bezier(.17,.84,.32,1)'); const w = ssWallpanel(), t0 = performance.now();
    // start on the next tick, once this touchend is fully dispatched (Wallpanel treats input as "stop")
    setTimeout(() => { if (!this._startSS(true)) setTimeout(() => this._ssSpring(), dur); }, 16);
    const wait = () => { const op = w ? Number(getComputedStyle(w).opacity) : 0, run = w && w.screensaverRunning && w.screensaverRunning();
      const m = w && w.getActiveMediaElement && w.getActiveMediaElement(), ready = !m || m.tagName !== 'IMG' || (m.complete && m.naturalWidth > 0);
      if (run && op > 0.98 && ready && performance.now() - t0 > dur) { // Wallpanel is up: put the launch page back underneath, drop the preview
        this._paintBg(true, true); this._ssReset(); this._ssBusy = false; return; }
      if (performance.now() - t0 > 7000 || (w && w.screensaverRunning && !run && performance.now() - t0 > 1500)) { this._ssSpring(); return; }
      requestAnimationFrame(wait); };
    requestAnimationFrame(wait); }
  _startSS(quick) { const w = ssWallpanel(); if (!this._wpOnHere()) return false; if (w && typeof w.startScreensaver === 'function') { try { this._ssSync(w); w.startScreensaver();
      // the pull preview already covers the screen: let Wallpanel's own layer come up quickly instead of its slow first fade-in
      // (Wallpanel sets its fade-in transition synchronously at start; the next start / stop sets its own again)
      if (quick) w.style.transition = 'opacity 320ms ease-out'; return true; } catch (e) {} } return false; }
  // --- slide-up sheets on the launch page
  // 1.32.0: the popups' edit pencil: closes whatever is open, then the Home Screen card's editor (or a device page in edit mode)
  _penFn(target) { return hvPenOK(this, this._hass) ? () => this._penGo(target) : null; }
  _penGo(target) { if (this._galO) this._galO.close(); if (this._sheetO) this._sheetO.close(); if (this._assistO) this._assistO.close(); if (this._fs) this._fs.close();
    if (HVTM.scr && HVTM.scr.close) HVTM.scr.close(); setTimeout(() => hvPopEdit(this, target || { card: this }), 380); }
  _openSheet(o) { if (this._sheetO) return null;
    const s = hvSheet(Object.assign({ full: this._config.full_height_popups !== false }, o, { edit: 'edit' in o ? o.edit : this._penFn(), day: o.day === true, parent: this.shadowRoot, launch: () => [this.shadowRoot.querySelector('.bg'), this._w],
      onClose: () => { this._sheetO = null; if (o.onClose) o.onClose(); this._layout(); } }));
    this._sheetO = s; if (this._hass) s.hass = this._hass; return s; }
  async _openViewSheet(a) {
    const np = a.navigation_path || 'home', dash = this._dash();
    if (np.startsWith('/') && !np.startsWith(`/${dash}/`)) return false; // another dashboard: navigate
    const vp = np.replace(new RegExp(`^/${dash}/`), '').replace(/^\//, '').replace(/[?#].*$/, '');
    const cfg = await this._loadCfg(), v = cfg && (cfg.views || []).find(x => String(x.path || '') === vp); if (!v) return false;
    let cards = [].concat(...(v.sections || []).map(s0 => s0.cards || []), v.cards || []).filter(x => x && x.type && x.type !== 'custom:homeview-edit-button-card' && !(x.type === 'custom:button-card' && x.template === 'homeview_styles')); // page-level helpers stay on the page
    const helpers = window.loadCardHelpers ? await window.loadCardHelpers() : null; if (!helpers || this._sheetO) return !!this._sheetO;
    // 1.30.7: a device page shown as a sheet follows the Device pages theme (from the live dashboard config, so a change shows at once)
    const live = HVT.cfg || cfg, lv = live && (live.views || []).find(x => String(x.path || '') === vp) || v;
    const mode = hvMode(hvViewTheme(live, lv), this._hass), day = mode === 'day';
    if (day) { hvThemeOver('day'); cards = cards.filter(x => !hvIsBgCard(x)); } // Day: the light grey sheet instead of the page's dark background card
    this._openSheet({ label: v.title || a.name || vp, bg: v.background || '', day, dayBg: '#eeeef0', edit: this._penFn({ view: vp, dash }), onClose: () => { if (HVT.over) hvThemeOver(''); }, build: (bd, frame) => {
      bd._hvOwnTheme = true; bd._hvThemeVal = mode; // the page's cards (and Page Grid tiles) follow this, not the Home Screen
      if (day) bd.style.cssText += ';' + HV_DAY_VARS + ';--primary-text-color:#1c1c1e;--secondary-text-color:rgba(60,60,67,.72)'; // native cards styled with the --hv-* colours
      const els = cards.map(c0 => { const cfg2 = c0.type === 'custom:homeview-grid-card' ? Object.assign({}, c0, { swipe_back: false, edge_sidebar: false, block_pull_refresh: false }) : c0;
        let el; try { el = helpers.createCardElement(cfg2); } catch (e) { el = document.createElement('div'); el.textContent = String(e); }
        el._hvFrame = frame; el.hass = this._hass; const w = document.createElement('div'); w.className = 'cw'; w.appendChild(el); bd.appendChild(w);
        w.addEventListener('card-visibility-changed', e => { w.style.display = e.detail && e.detail.value === false ? 'none' : ''; });
        return el; });
      return { set hass(h) { els.forEach(e => { e.hass = h; }); } }; } });
    return true; }
  // Music: the Now Playing card (same card as the popup) inside the sheet. Its own swipe-to-close is off (the sheet does it);
  // dismiss only from the pill / the artwork area, never from the controls, volume or seek bar.
  _openMusicSheet(a, ids) {
    const d = HVMusicCard.prototype.nowPlayingData.call({ _config: Object.assign({}, NP_TILE_DEFAULTS, a, { entity: ids[0], entities: ids.slice(1) }) });
    const cfg = Object.assign({}, d.content, { height: '100%', popup_style: 'fullscreen', swipe_to_close: false });
    this._openSheet({ label: a.name || 'Music', bg: '#121218', day: false, dragOk: (path, y, h) => y < h * 0.45 && !path.some(n => n instanceof Element && (n.tagName === 'BUTTON' || (n.classList && (n.classList.contains('pop') || n.classList.contains('prog') || n.classList.contains('ctl'))))),
      build: bd => { bd.style.padding = '0'; bd.style.overflow = 'hidden'; const el = document.createElement('homeview-now-playing-card');
        try { el.setConfig(cfg); } catch (e) { el.textContent = String(e); } el.style.cssText = 'display:block;position:absolute;inset:0;height:100%;--hv-safe-top:30px'; el.hass = this._hass; bd.appendChild(el);
        return { set hass(h) { el.hass = h; } }; } }); }
  _openTileSheet(cfg, o) { o = o || {}; const hub = this;
    const helpers = window.loadCardHelpers ? window.loadCardHelpers() : null;
    this._openSheet({ label: 'Enlarged view', bg: 'rgba(22,22,30,.72)', build: bd => {
      bd.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:48px 20px 24px;backdrop-filter:blur(30px) saturate(1.3);-webkit-backdrop-filter:blur(30px) saturate(1.3)';
      const box = document.createElement('div'); box.style.cssText = 'position:relative;flex:none'; bd.appendChild(box); let el = null, ro = null;
      const fit = () => { const W = Math.min(bd.clientWidth - 40, 1200), H = bd.clientHeight - 72; box.style.width = W + 'px'; box.style.height = H + 'px'; if (el) hvFitCard(el, W, H, Math.round(Math.min(W, H) * 0.04), { sky: o.sky === true ? hvSky(this._hass, o.sky_entity, window.__hvSimScene) : null, label: o.label_size_large ? Number(o.label_size_large) : 1.25 }); };
      Promise.resolve(helpers).then(hp => { if (!hp) return; el = hp.createCardElement(cfg); el.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%'; el.hass = this._simHass(this._hass); box.appendChild(el);
        if (window.ResizeObserver) { ro = new ResizeObserver(() => requestAnimationFrame(fit)); setTimeout(() => { const r = el.shadowRoot && el.shadowRoot.querySelector('#root'); if (r) ro.observe(r); }, 300); }
        for (const t of [50, 300, 900, 2000]) setTimeout(fit, t); });
      return { set hass(h) { if (el) el.hass = hub._simHass(h); } }; } }); }
  // --- edge swipe opens the sidebar drawer (same gesture as the Page Grid)
  _edgeBind(on) {
    if (!this._edgeH) { let st = null;
      const ts = e => { st = null; if ((this._config || {}).edge_sidebar === false || this._edit || !this.isConnected || e.touches.length !== 1) return;
        const t = e.touches[0]; if (t.clientX <= 24) st = { x: t.clientX, y: t.clientY, done: false }; };
      const tm = e => { if (!st) return; const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y; if (e.cancelable) e.preventDefault();
        if (!st.done && dx > 36 && Math.abs(dy) < dx) { st.done = true; if (innerWidth < 870) { let d = null; try { d = document.querySelector('home-assistant').shadowRoot.querySelector('home-assistant-main').shadowRoot.querySelector('ha-drawer'); } catch (x) {}
          if (!(d && d.open)) this.dispatchEvent(new CustomEvent('hass-toggle-menu', { bubbles: true, composed: true, detail: { open: true } })); } }
        else if (!st.done && Math.abs(dy) > 60) st = null; };
      const te = () => { st = null; };
      this._edgeH = [['touchstart', ts, { capture: true, passive: true }], ['touchmove', tm, { capture: true, passive: false }], ['touchend', te, true], ['touchcancel', te, true]]; }
    for (const [t, f, o] of this._edgeH) on ? addEventListener(t, f, o) : removeEventListener(t, f, o);
  }
  // --- person / greeting
  _person() { const c = this._config, h = this._hass, S = h.states;
    if (c.person && S[c.person]) return S[c.person];
    const uid = h.user && h.user.id, p = uid && Object.values(S).find(s => s.entity_id.startsWith('person.') && s.attributes.user_id === uid);
    return p || (c.fallback_person && S[c.fallback_person]) || null; }
  _greeting() { const c = this._config, hr = new Date().getHours(), m = Number(c.morning_start), a = Number(c.afternoon_start), e = Number(c.evening_start);
    if (c.night_start !== '' && c.night_start != null) { const n = Number(c.night_start); if (n >= e ? (hr >= n || hr < m) : (hr >= n && hr < m)) return c.greeting_night || 'Good night'; }
    return hr >= m && hr < a ? c.greeting_morning : hr >= a && hr < e ? c.greeting_afternoon : c.greeting_evening; }
  _dash() { return ssDash() || 'lovelace'; }
  _path(p) { if (!p) return ''; return p.startsWith('/') ? p : `/${this._dash()}/${p}`; }
  // --- render
  _rSig() { const c = this._config, h = this._hass, p = this._person();
    const first = (c.name || (p && p.attributes.friendly_name) || (h.user && h.user.name) || '').trim().split(/\s+/)[0] || '';
    return JSON.stringify([first, p && p.attributes.entity_picture, this._greeting(), c.apps, c.ring_color, c.photo_label, c.show_calendar, c.assistant_enabled === true && c.assistant_button !== false]); }
  _appsHtml(c) { const glyph = a => a.icon === 'hv:home' ? HUB_HOME_SVG : `<ha-icon icon="${esc(a.icon || 'mdi:apps')}"></ha-icon>`;
    return c.apps.map((a, i) => `<button class="app" data-app="${i}" aria-label="${esc(a.name || '')}"><span class="ico" style="background:linear-gradient(180deg,${esc(a.color_from || '#8e8e93')} 0%,${esc(a.color_to || a.color_from || '#636366')} 100%);color:${esc(a.glyph_color || '#fff')}">${glyph(a)}</span><span class="lb">${esc(a.name || '')}</span></button>`).join(''); }
  // 1.32.0 Home Screen arrange: a new config applied in place (apps redrawn, side tiles reordered / resized with their elements kept, no rebuild)
  _arrSet(raw) { const old = this._config; this._hvRaw = raw; const nc = Object.assign({}, HVHubCard.defaults, raw); if (!Array.isArray(nc.apps) || !nc.apps.length) nc.apps = HUB_APPS; this._config = nc;
    if (!this._w) return this._render(); if (JSON.stringify(old && old.apps) !== JSON.stringify(nc.apps)) { const a = this._w.querySelector('.apps'); if (a) a.innerHTML = this._appsHtml(nc); }
    this._sig = this._rSig(); this._makeSide(); this._layout(); }
  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config, h = this._hass, p = this._person();
    const first = (c.name || (p && p.attributes.friendly_name) || (h.user && h.user.name) || '').trim().split(/\s+/)[0] || '';
    const pic = p && p.attributes.entity_picture;
    const amic = c.assistant_enabled === true && c.assistant_button !== false;
    const sig = this._rSig();
    if (sig === this._sig && this._w) return; this._sig = sig;
    if (!this._w) {
      this.shadowRoot.innerHTML = `<style>${HUB_CSS}</style><div class="bg"><div class="bgi"></div><div class="bgi"></div><div class="tint"></div><div class="dim"></div></div><div class="w"></div><div class="ssp" hidden title="Swipe down for the screensaver"></div>`;
      this._ssp = this.shadowRoot.querySelector('.ssp'); this._ssPaint();
      this._w = this.shadowRoot.querySelector('.w'); this._bgs = [...this.shadowRoot.querySelectorAll('.bgi')];
      this._w.addEventListener('click', e => { const t = e.composedPath().find(n => n.dataset && (n.dataset.app != null || n.dataset.k)); if (!t) return;
        if (t.dataset.app != null) this._runApp(c => c, Number(t.dataset.app)); else if (t.dataset.k === 'photos') this._photoTap(); else if (t.dataset.k === 'person') this._personTap(); else if (t.dataset.k === 'assist') this._openAssist(); else if (t.dataset.k === 'timer') HVTM.show(); });
    }
    const greet = String(this._greeting() || '').trim().replace(/,?$/, ',');
    const apps = this._appsHtml(c);
    const keepCal = this._cal && c.show_calendar !== false ? this._cal : null;
    this._w.innerHTML = `<div class="top"><div class="gr"><div class="g1">${esc(greet)}</div><div class="g2">${esc(first)}</div></div>
      <div class="tr"><button class="tpill" data-k="timer" hidden aria-label="Show the timer"><ha-icon icon="mdi:timer-outline"></ha-icon><span></span></button>${amic ? '<button class="amic" data-k="assist" aria-label="Assistant"><ha-icon icon="mdi:microphone"></ha-icon></button>' : ''}
      <button class="av" data-k="person" aria-label="${esc(first)}"${c.ring_color ? ` style="--ring:${esc(c.ring_color)}"` : ''}><div class="pic"${pic ? ` style="background-image:url('${esc(pic)}')"` : ''}>${pic ? '' : esc(first.charAt(0))}</div></button></div></div>
      <div class="mid"><div class="apps">${apps}</div><div class="row"><div class="phw"><button class="pw" data-k="photos" aria-label="${esc(c.photo_label || 'Photos')}"><div class="ph0"><ha-icon icon="mdi:image-multiple-outline"></ha-icon></div><div class="pi"></div><div class="pi"></div></button>${c.photo_label ? `<span class="lb">${esc(c.photo_label)}</span>` : ''}</div></div></div>
      <div class="below" hidden></div>${c.show_calendar !== false ? '<div class="calw"></div>' : ''}`;
    this._tpill = this._w.querySelector('.tpill'); this._tpillPaint();
    this._rowEl = this._w.querySelector('.row'); this._belowEl = this._w.querySelector('.below'); this._makeSide();
    this._pis = [...this._w.querySelectorAll('.pi')]; this._paintPhoto(true);
    if (c.show_calendar !== false) { const w = this._w.querySelector('.calw'); this._makeCal(keepCal); w.appendChild(this._cal); } else this._cal = null;
    this._layout();
  }
  // Side slot (Square photos): any cards (picked in the editor), right of the Photos tile, or below the row when there's no room
  async _makeSide() {
    const c = this._config, list = Array.isArray(c.side_cards) ? c.side_cards.filter(x => x && x.type) : [], sig = JSON.stringify(list);
    if (sig !== this._sideSig || !this._sideEls) { this._sideSig = sig; const tok = this._sideTok = (this._sideTok || 0) + 1;
      const helpers = list.length && window.loadCardHelpers ? await window.loadCardHelpers() : null; if (tok !== this._sideTok) return;
      const pool = (this._sideEls || []).filter(w => !w._dead).map(w => ({ j: JSON.stringify(w._cfg), w }));
      (this._sideEls || []).forEach(w => { if (w._dead || !pool.some(x => x.w === w)) w.remove(); });
      this._sideEls = list.map(cfg => { const j = JSON.stringify(cfg), pi = pool.findIndex(x => x.j === j); if (pi >= 0) return pool.splice(pi, 1)[0].w;
        const wrap = document.createElement('div'); wrap.className = 'tile'; let el; try { el = helpers ? helpers.createCardElement(cfg) : document.createElement('div'); } catch (e) { el = document.createElement('div'); el.textContent = String(e); }
        if (this._hass) el.hass = this._hass; if (this._edit != null) el.editMode = this._edit; if (el.tagName && el.tagName.startsWith('HOMEVIEW-')) el.setAttribute('floor', ''); // readable text, like Page Grid tiles
        el.addEventListener('ll-rebuild', ev => { ev.stopPropagation(); wrap._dead = true; this._sideSig = null; this._makeSide(); }); wrap.appendChild(el); wrap._card = el; wrap._cfg = cfg;
        wrap.addEventListener('click', ev => { const o = hubTileOpt(this._config, this._sideEls.indexOf(wrap));
          // 1.32.0: tapping the body of a Now Playing tile opens the Music sheet (like the Music app); its buttons, seek bar and volume / output popovers keep their own taps
          if (!o.enlarge && !this._edit && !this._sheetO && wrap._cfg.type === 'custom:homeview-now-playing-card' && o.tap !== 'none') { const p0 = ev.composedPath();
            if (!p0.some(n => n instanceof Element && (n.tagName === 'BUTTON' || n.tagName === 'INPUT' || (n.classList && (n.classList.contains('pop') || n.classList.contains('prog') || n.classList.contains('ctl'))))) && !(wrap._card && wrap._card._suppressClick)) {
              const ids = [wrap._cfg.entity].concat(wrap._cfg.entities || []).filter(Boolean) , def = Object.keys((this._hass && this._hass.states) || {}).find(k => k.startsWith('media_player.'));
              if (ids.length || def) { ev.stopPropagation(); const a0 = Object.assign({}, wrap._cfg); delete a0.type; delete a0.height; delete a0.entity; delete a0.entities; this._openMusicSheet(a0, ids.length ? ids : [def]); return; } } }
          if (!o.enlarge || this._edit) return;
          const path = ev.composedPath(); for (const n of path) { if (n === wrap) break; if (n.classList && n.classList.contains('element')) return; } // labels keep their own actions
          ev.stopPropagation(); this._openTileSheet(wrap._cfg, o); });
        if (window.ResizeObserver) { wrap._ro = new ResizeObserver(() => { if (wrap._fit) requestAnimationFrame(() => this._fitTile(wrap)); }); setTimeout(() => { const r = el.shadowRoot && el.shadowRoot.querySelector('#root'); if (r) wrap._ro.observe(r); }, 400); }
        return wrap; }); pool.forEach(x => x.w.remove()); }
    (this._sideEls || []).forEach((w, i) => { const o = hubTileOpt(c, i), t = (w._cfg && w._cfg.type) || ''; w._fit = o.fit === 'contain' || (o.fit !== 'fill' && /^picture/.test(t)); });
    if (this._rowEl) { for (const w of this._sideEls) this._rowEl.appendChild(w); this._layout(); }
  }
  _tileFitOpt(o) { const sky = o.sky === true ? hvSky(this._hass, o.sky_entity, window.__hvSimScene) : null;
    return { zoom: o.zoom ? Number(o.zoom) : 0, label: o.label_size ? Number(o.label_size) : 1, sky }; }
  // test hook only: window.__hvSimScene = 'rainy' | 'night' | ... previews a house scene in the tiles (never set by the cards)
  _simHass(h) { const sim = window.__hvSimScene; if (!sim || !h) return h; const id = 'sensor.house_scene', s0 = h.states[id] || { entity_id: id, attributes: {} };
    return Object.assign({}, h, { states: Object.assign({}, h.states, { [id]: Object.assign({}, s0, { state: sim }) }) }); }
  _fitTile(w) { if (this._sheetO || !w.isConnected) return; const W = w.offsetWidth, H = w.offsetHeight; if (!W || !H) return;
    const o = hubTileOpt(this._config, (this._sideEls || []).indexOf(w)), fo = this._tileFitOpt(o); w._skySig = fo.sky ? fo.sky.sig : '';
    if (!hvFitCard(w._card, W, H, Math.round(Math.min(W, H) * 0.06), fo)) setTimeout(() => this._fitTile(w), 400); }
  _makeCal(keep) {
    const c = this._config, ids = c.calendar_entities && c.calendar_entities.length ? c.calendar_entities : Object.keys(this._hass.states).filter(k => k.startsWith('calendar.'));
    const cfg = { type: 'custom:homeview-calendar-card', entities: ids, title: c.calendar_title, layout: c.calendar_layout, columns: c.calendar_columns, rows: c.calendar_rows || 'auto', days: c.calendar_days,
      max_events: 30, show_location: c.calendar_show_location === true, show_weather: c.calendar_show_weather !== false, weather_entity: c.weather_entity || undefined, tap_action: { action: 'none' } };
    const sig = JSON.stringify(cfg); if (keep && sig === this._calSig) { this._cal = keep; return; }
    this._calSig = sig; const el = keep || document.createElement('homeview-calendar-card');
    try { el.setConfig(cfg); } catch (e) { el.textContent = String(e); } el.hass = this._hass; this._cal = el;
  }
  _px(css) { let p = this._probe; if (!p || !p.isConnected) { p = this._probe = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;width:0;pointer-events:none'; this.shadowRoot.appendChild(p); }
    p.style.height = css; return p.getBoundingClientRect().height; }
  _layout() {
    if (!this._w || !this.isConnected || this._sheetO) return; const c = this._config, r = this.getBoundingClientRect(); if (!r.width) return;
    const vw = document.documentElement.clientWidth || innerWidth, vh = innerHeight;
    const full = !this._edit && r.left <= 48 && vw - r.right <= 48 && r.left >= -1; // on the page (not the editor preview / edit mode)
    this.toggleAttribute('contained', !full);
    const S = this._w.style, set = (k, v) => S.setProperty(k, v);
    const safeT = this._px('var(--hv-safe-top, env(safe-area-inset-top, 0px))'), safeB = this._px('var(--hv-safe-bottom, env(safe-area-inset-bottom, 0px))');
    const W = r.width, px = Math.round(Math.max(8, Math.max(18, Math.min(64, vw * 0.05)) - (full ? r.left : 0)));
    const top = full ? Math.max(0, r.top + scrollY) : 0, pt = Math.round(full ? Math.max(safeT + 12, Math.min(48, vh * 0.04)) - top : 20), pb = Math.round(full ? safeB + 16 : 20);
    // fill the screen exactly: minus whatever the view puts below the card (section padding), so the page doesn't scroll
    // re-measured on every viewport size: first fill vh exactly (page overflows by the padding), then subtract that
    const vk = vw + 'x' + vh + (this._edit ? 'e' : ''); if (vk !== this._vk) { this._vk = vk; this._below = 0; setTimeout(() => this._layout(), 300); }
    const sh = document.documentElement.scrollHeight; if (full && sh > vh + 1) this._below = Math.max(0, Math.min(160, sh - (r.bottom + scrollY)));
    const below = full ? this._below || 0 : 0;
    const H = full ? vh - top - below : Math.max(520, r.width * 0.7);
    const Wc = W - 2 * Math.max(0, px), gap = Math.round(Math.max(16, Math.min(36, vh * 0.032)));
    const portrait = vh >= vw, calMin = c.show_calendar !== false ? Number(c.calendar_min_height) || 240 : 0;
    const greetH = Math.max(15, Math.min(26, Wc * 0.03)) * 2.5;
    // icon size: the 2 x 2 apps + Photos (= 2 icons tall) fit the width, and leave room for the calendar below
    let I = Math.min(Wc / 5.2, (H - pt - pb - greetH - gap * 2 - calMin) / 2.75, Number(c.max_icon) || 140);
    // landscape with extra tiles: size everything so the wanted units (Photos + extras, up to row_units) fit beside the apps
    const nA = (c.apps || []).length; let ac = !portrait && nA > 4 ? Math.min(4, Math.ceil(nA / 2)) : 2; // 1.32.0: landscape keeps the apps in 2 rows (5-8 apps) when they fit
    const xs0 = this._sideEls || [];
    if (!portrait && xs0.length) { const sz = hubTileSizes(c), want = Math.min(Number(c.row_units) || 3, (c.photo_size === 'square' ? 1 : 2) + xs0.reduce((a, _, i) => a + (sz[i] === 2 ? 2 : 1), 0));
      const fI = a => (Wc - want * 22) / (a * 1.36 + want * 2.26 + (want - 1) * 0.36) - 1; if (ac > 2 && fI(ac) < 72) ac = 2; // too narrow for wider apps: classic 2 columns
      I = Math.min(I, fI(ac)); }
    if (ac > 2) I = Math.min(I, Wc / (ac * 1.36 + 2.4));
    I = Math.max(portrait && W < 600 ? 60 : 72, Math.floor(I));
    const lfs = Math.round(Math.max(13, Math.min(19, I * 0.155))), lh = Math.round(lfs * 1.3), lg = Math.round(I * 0.08), rg = Math.round(I * 0.18), cg = Math.round(I * 0.36);
    const ph = 2 * I + lg + lh + rg, pwMax = Wc - ac * I - (ac - 1) * cg - Math.round(I * 0.36), square = c.photo_size === 'square';
    // Tile row right of the apps: Photos + the extra cards, Square = 1 unit (ph x ph), Wide = 2 units. As many units as fit
    // (3 on a landscape tablet); what doesn't fit wraps to a row below (squares sized like the photo tile, or hidden).
    const tg = Math.round(I * 0.36), U = ph, fit = Math.max(1, Math.floor((pwMax + tg) / (U + tg))), xs = this._sideEls || [], sizes = hubTileSizes(c);
    const pu = square ? 1 : 2; let used = Math.min(pu, fit), pw;
    if (!xs.length) pw = square ? ph : Math.max(ph * 0.9, Math.min(pwMax, ph * (Number(c.photo_max_aspect) || 2.6))); // alone: Wide fills the row (classic look)
    else pw = used === 2 ? 2 * U + tg : U;
    const bw = Math.min(U, Math.floor((Wc - tg) / 2)), wrapped = [];
    xs.forEach((w, i) => { const u = sizes[i] === 2 ? 2 : 1;
      if (used + u <= fit) { used += u; w.style.setProperty('--tw', (u === 2 ? 2 * U + tg : U) + 'px'); w.style.setProperty('--th', U + 'px'); if (w.parentNode !== this._rowEl) this._rowEl.appendChild(w); }
      else { wrapped.push(w); w.style.setProperty('--tw', Math.min(Wc, u === 2 ? 2 * bw + tg : bw) + 'px'); w.style.setProperty('--th', bw + 'px'); if (w.parentNode !== this._belowEl) this._belowEl.appendChild(w); } });
    if (this._belowEl) this._belowEl.hidden = !wrapped.length || c.side_portrait === 'hide';
    xs.forEach(w => { w.classList.toggle('fit', w._fit); if (w._fit) this._fitTile(w); });
    set('--px', px + 'px'); set('--pt', Math.max(0, pt) + 'px'); set('--pb', pb + 'px'); set('--gap', gap + 'px'); set('--I', I + 'px'); set('--ac', String(ac)); set('--lfs', lfs + 'px'); set('--lh', lh + 'px'); set('--lg', lg + 'px');
    set('--rg', rg + 'px'); set('--cg', cg + 'px'); set('--cg2', Math.round(I * 0.36) + 'px'); set('--ph', ph + 'px'); set('--pw', Math.floor(pw) + 'px');
    set('--gfs', Math.round(Math.max(15, Math.min(26, I * 0.2))) + 'px'); set('--av', Math.round(Math.max(44, Math.min(72, I * 0.56))) + 'px');
    set('--h', Math.floor(H) + 'px'); set('--calmin', calMin + 'px');
    this.style.setProperty('--blur', (Number(c.blur) || 0) + 'px'); this.style.setProperty('--dim', String(Math.max(0, Math.min(0.9, Number(c.dim) || 0))));
    this._bgMode();
    // keep the avatar clear of the floating edit / screensaver buttons
    const av = this._w.querySelector('.av'); if (av) { av.style.marginRight = ''; const ar = av.getBoundingClientRect(); let m = 0;
      for (const f of document.querySelectorAll('homeview-edit-fab')) { const fr = f.getBoundingClientRect(); if (fr.height && fr.left < ar.right && fr.right > ar.left && fr.top < ar.bottom && fr.bottom > ar.top) m = Math.max(m, ar.right - fr.left + 10); }
      if (m) av.style.marginRight = m + 'px'; }
  }
  // --- apps
  _runApp(_, i, page) { const a0 = this._config.apps[i]; if (!a0) return; const a = page ? Object.assign({}, a0, { open_as: 'page' }) : a0; const kind = a.kind || 'navigate';
    if (kind === 'navigate' && a.open_as !== 'page' && !this._edit) { this._openViewSheet(a).then(ok => { if (!ok) this._runApp(_, i, true); }); return; }
    if (kind === 'navigate') { let p = this._path(a.navigation_path || 'home'); if (location.search && !p.includes('?')) p += location.search; history.pushState(null, '', p); fire(window, 'location-changed', { replace: false }); return; }
    if (kind === 'now_playing') { const ids = [a.entity].concat(a.entities || []).filter(Boolean); const def = Object.keys(this._hass.states).find(k => k.startsWith('media_player.'));
      if (a.open_as !== 'page' && !this._edit && (ids[0] || def)) { this._openMusicSheet(a, ids.length ? ids : [def]); return; }
      if (!window.browser_mod) { fire(this, 'hass-more-info', { entityId: ids[0] || def }); return; }
      const data = HVMusicCard.prototype.nowPlayingData.call({ _config: Object.assign({}, NP_TILE_DEFAULTS, { entity: ids[0] || def, entities: ids.slice(1) }) });
      fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data } }); return; }
    if (kind === 'weather') { this._openWeather(a.weather_entity); return; }
    if (kind === 'assistant') { this._openAssist(); return; }
    if (kind === 'photos') { this._openPhoto(); return; }
    const cfg = a.tap_action; if (cfg && cfg.action !== 'none') fire(this, 'hass-action', { config: { entity: a.entity, tap_action: cfg }, action: 'tap' }); }
  _personTap() { const p = this._person(); if (p) fire(this, 'hass-more-info', { entityId: p.entity_id }); }
  // --- photos (same source as the Wallpanel screensaver)
  async _source(noAlbum) { const c = this._config; if (!noAlbum && c.photo_source_mode === 'album' && String(c.photo_album_url || '').trim()) return { album: String(c.photo_album_url).trim(), ex: [] };
    if (c.photo_source) return { url: c.photo_source, ex: [] };
    try { const m = { type: 'lovelace/config' }; const d = ssDash(); if (d) m.url_path = d; const cfg = await this._hass.callWS(m), wp = (cfg && cfg.wallpanel) || {};
      return { url: wp.image_url || 'media-source://media_source/local/', ex: wp.exclude_filenames || [], noVideo: true }; } catch (e) { return { url: 'media-source://media_source/local/', ex: [] }; } }
  // every photo under the source (same walk the tile and Wallpanel use: media-source folders, subfolders too, no videos), max 800
  async _scan(src) { const ids = [];
    if (src.album) { const a = await hvAlbumLoad(this._hass, src.album), S = window.__hvAlbumSt || (window.__hvAlbumSt = {}); S[src.album] = Object.assign({ url: src.album, t: Date.now() }, a);
      if (a.ok && a.via === 'helper' && a.media_id) { src.ttl = 6 * 36e5; return this._scan({ url: a.media_id, ex: [] }); }
      if (a.ok && a.ids) { src.ttl = Math.max(10 * 6e4, Math.min(6 * 36e5, a.expires - Date.now() - 30 * 6e4)); return a.ids.slice(); }
      console.warn('NotHomeView: album link not available, showing the media folder instead:', a.error); src.ttl = 10 * 6e4; // try the link again in 10 minutes
      return this._scan(await this._source(true)); }
    if (/^media-source:\/\//.test(src.url)) { const ex = (src.ex || []).map(x => { try { return new RegExp(x); } catch (e) { return null; } }).filter(Boolean);
      const walk = async (id, depth) => { if (ids.length >= 800 || depth > 5) return; let r; try { r = await this._hass.callWS({ type: 'media_source/browse_media', media_content_id: id }); } catch (e) { return; }
        for (const ch of (r && r.children) || []) { if (ids.length >= 800) break; const nm = ch.media_content_id || '';
          if (ex.some(re => re.test(nm) || re.test(ch.title || ''))) continue;
          if (ch.can_expand && !ch.can_play) await walk(ch.media_content_id, depth + 1);
          else if (ch.media_class === 'image' || /^image\//.test(ch.media_content_type || '')) ids.push(nm); } };
      await walk(src.url.replace(/\/$/, '') + (src.url.endsWith('/') ? '/' : ''), 0); }
    else ids.push(src.url);
    return ids; }
  async _loadPhotos() {
    if (!this._hass || this._loading || this._ids) return; this._loading = true;
    try { const src = await this._source(), C = window.__hvPhotoCache || (window.__hvPhotoCache = {}), key = src.url || 'album:' + src.album;
      let ids = C[key] && Date.now() - C[key].t < (C[key].ttl || 36e5) ? C[key].ids : null;
      if (!ids) { ids = await this._scan(src); C[key] = { t: Date.now(), ids, ttl: src.ttl }; }
      this._idsExp = src.album ? C[key].t + (C[key].ttl || 36e5) : 0; // album lists (and their links) are reloaded when they expire
      ids = ids.slice(); if (this._config.photo_order !== 'sorted') for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
      this._ids = ids; this._pos = -1; if (ids.length) this._next(); }
    finally { this._loading = false; } }
  _urlPeek(id) { if (!/^media-source:\/\//.test(id)) return null; const x = (window.__hvPhotoUrl || {})[id]; return x && Date.now() - x.t < 30 * 6e4 ? x.u : null; }
  async _url(id) { if (!/^media-source:\/\//.test(id)) return id.replace('${timestamp}', Date.now());
    const C = window.__hvPhotoUrl || (window.__hvPhotoUrl = {}), x = C[id]; if (x && Date.now() - x.t < 30 * 6e4) return x.u;
    const P = window.__hvPhotoUrlP || (window.__hvPhotoUrlP = {}); if (P[id]) return P[id];
    return (P[id] = (async () => { try { const r = await this._hass.callWS({ type: 'media_source/resolve_media', media_content_id: id, expires: 3600 }); const u = this._hass.hassUrl ? this._hass.hassUrl(r.url) : r.url; C[id] = { t: Date.now(), u }; return u; } finally { delete P[id]; } })()); }
  // viewer open: the next 2 and previous 2 photos are resolved, downloaded and decoded ahead (priority 1-4, in the direction of travel first); the rest of the folder's links are resolved once in the background
  _prefetch(p, dir) { const ids = this._ids || [], n = ids.length; if (n < 2 || !this._hass || document.hidden) return; const d = dir < 0 ? -1 : 1, keepU = new Set(), at = o => ids[(((p + o) % n) + n) % n];
    const cur = this._cur; if (cur) keepU.add(cur);
    [d, 2 * d, -d, -2 * d].forEach((o, i) => { const id = at(o); if (!id) return; const pk = this._urlPeek(id); if (pk) keepU.add(pk); });
    HVL.prune(keepU);
    [d, 2 * d, -d, -2 * d].forEach((o, i) => { const id = at(o); if (!id || (n < 5 && Math.abs(o) > n - 1)) return; this._url(id).then(u => HVL.load(u, 1 + i, id)).catch(() => {}); });
    this._resolveAll(p); }
  _resolveAll(p) { if (this._resRun || !this._ids || !this._ids.length) return; const ids = this._ids, n = ids.length, order = []; for (let o = 0; o < n; o++) order.push(ids[((p + o) % n + n) % n]);
    this._resRun = true; let i = 0, live = 3; const w = async () => { while (i < order.length && (this._pv || this._galO)) { try { await this._url(order[i++]); } catch (e) { /* later */ } } if (--live === 0) this._resRun = false; }; w(); w(); w(); }
  async _next() {
    if (!this._ids || !this._ids.length || !this.isConnected) return; clearTimeout(this._timer); this._timer = null;
    if (this._idsExp && Date.now() > this._idsExp && !this._loading && !this._pv && !this._galO) { this._idsExp = 0; this._ids = null; this._loadPhotos(); return; }
    for (let tries = 0; tries < 4; tries++) { this._pos = (this._pos + 1) % this._ids.length;
      try { const u = await this._url(this._ids[this._pos]); await HVL.load(u, 0); // no id: the 25 s rotation makes no thumbnail
        if (this._ssHeld()) { this._pos = (this._pos + this._ids.length - 1) % this._ids.length; break; } this._curId = this._ids[this._pos]; this._cur = u; this._layer = 1 - this._layer; this._paintPhoto(); if (this._pv) this._prefetch(this._pos, 1); break; } catch (e) { /* try the next photo */ } }
    this._restartTimer(true); }
  _restartTimer(force) { if (!this.isConnected || !this._ids || !this._ids.length || this._pv) return; if (this._timer && !force) return; clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._timer = null; if (document.hidden) return; if (this._ssHeld()) { this._bgAway(); this._restartTimer(true); return; } this._next(); }, Math.max(5, Number(this._config.photo_interval) || 25) * 1000); }
  // Background transparency (0-100) -> --bgt 0..1; the photo backdrop shows once a photo is loaded (else the gradient)
  // 60 = the approved look (tint .24, darkening x.55). Below 60 the gradient tint grows to fully opaque at 0 (solid gradient, darkening eases to the classic page
  // look); above 60 the tint fades to 0 and the darkening to x.1 at 100 (nearly clear blurred photo).
  _bgMode() { const c = this._config || {}, t = Number(c.bg_transparency), T = Math.max(0, Math.min(100, isNaN(t) || c.bg_transparency === '' || c.bg_transparency == null ? 60 : t)) / 100, st = this.style.setProperty.bind(this.style);
    const tint = T >= 0.6 ? 0.24 * (1 - T) / 0.4 : 0.24 + (0.6 - T) / 0.6 * 0.76, dsc = T <= 0.6 ? 1 - 0.75 * T : 0.55 - (T - 0.6) / 0.4 * 0.45, mix = T >= 0.6 ? 0 : 1 - T / 0.6;
    const bl = Math.max(0, Number(c.blur) || 0), eff = this._blurX ? bl : bl * (T <= 0.6 ? 1 : 1 - (T - 0.6) / 0.4); st('--blur', (Math.round(eff * 2) / 2) + 'px'); // default blur: full to 60, eased to 0 (sharp photo) at 100
    st('--bgt', String(T)); st('--tint', tint.toFixed(4)); st('--dsc', dsc.toFixed(4)); st('--dmix', mix.toFixed(4)); this.toggleAttribute('bgphoto', c.photo_backdrop !== false && !!this._cur); }
  _paintPhoto(instant, dir) { if (!this._cur) return; this._bgMode(); const L = this._layer, bg = `url("${this._cur.replace(/"/g, '%22')}")`;
    const set = this._pis || []; if (set.length > 1) { const on = set[L], off = set[1 - L];
      if (instant) { on.style.transition = 'none'; off.style.transition = 'none'; }
      on.style.backgroundImage = bg; on.classList.add('on'); off.classList.remove('on');
      if (instant) requestAnimationFrame(() => { on.style.transition = ''; off.style.transition = ''; }); }
    this._paintBg(instant, false);
    const ph0 = this._w && this._w.querySelector('.ph0'); if (ph0) ph0.style.display = 'none';
    if (this._fs) this._fs.show(this._cur);
    if (this._pv) this._pv.show(this._cur, dir || 0); }
  // 1.30.4: the blurred backdrop. Frozen (bg_freeze, default on): once it shows a photo it is left completely alone while the Home Screen is showing (no swap, no fade,
  // no style writes), whatever the Photos card does. force = the page is out of sight (screensaver fully up, another view, app hidden) or freeze was turned off:
  // catch up with the current photo once, instantly. Off: follows the Photos card (cross-fade). A re-render never repaints layers already showing this photo.
  _paintBg(instant, force) { const B = this._bgs; if (!B || B.length < 2 || !this._cur) return;
    const live = this._bgEl === B[0] && !!this._bgUrl; if (live && this._bgUrl === this._cur) return;
    if (live && !force && (this._config || {}).bg_freeze !== false) return;
    const n = live ? 1 - this._bgL : 0, on = B[n], off = B[1 - n], im = !!(instant || force);
    if (im) { on.style.transition = 'none'; off.style.transition = 'none'; }
    on.style.backgroundImage = `url("${this._cur.replace(/"/g, '%22')}")`; on.classList.add('on'); off.classList.remove('on');
    if (im) requestAnimationFrame(() => { on.style.transition = ''; off.style.transition = ''; });
    this._bgEl = B[0]; this._bgUrl = this._cur; this._bgL = n; }
  _bgAway() { const w = ssWallpanel(); try { if (w && w.screensaverRunning && w.screensaverRunning() && Number(getComputedStyle(w).opacity) > 0.98) this._paintBg(true, true); } catch (e) { /* later */ } }
  _photoTap() { const c = this._config, t = c.photo_tap || 'viewer'; if (t === 'none' || this._edit) return;
    if (t === 'screensaver') { if (this._startSS()) return; this._openPhotoViewer(); return; }
    if (t === 'fullscreen') { this._openPhoto(); return; }
    this._openPhotoViewer(); } // 'viewer' (default) and the old 'auto'
  _openPhoto() { if (this._fs) return; const host = document.createElement('homeview-photo-view'), sr = host.attachShadow({ mode: 'open' });
    sr.innerHTML = `<style>:host{position:fixed;inset:0;z-index:8;background:#000;cursor:pointer;opacity:0;transition:opacity .3s ease} :host(.in){opacity:1}
      .b,.f{position:absolute;inset:0;background-position:center;background-repeat:no-repeat;transition:opacity 1.6s ease} .b{background-size:cover;filter:blur(40px) brightness(.6);transform:scale(1.15)} .f{background-size:contain}
      .x{all:unset;position:absolute;top:max(14px,env(safe-area-inset-top));right:16px;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.18);color:#fff;backdrop-filter:blur(20px)}
      .x ha-icon{--mdc-icon-size:24px;display:flex}</style><div class="b"></div><div class="f"></div><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>`;
    const show = u => { const bg = `url("${String(u).replace(/"/g, '%22')}")`; sr.querySelector('.b').style.backgroundImage = bg; sr.querySelector('.f').style.backgroundImage = bg; };
    const close = () => { host.classList.remove('in'); setTimeout(() => host.remove(), 300); this._fs = null; removeEventListener('keydown', key); };
    const key = k => { if (k.key === 'Escape') close(); };
    host.addEventListener('click', close); addEventListener('keydown', key); this._fs = { show, close }; hvPen(sr.querySelector('.x'), this._penFn());
    hvPullDown({ on: host, ok: () => true, target: () => host, done: close }).bind(true);
    if (this._cur) show(this._cur); document.body.appendChild(host); requestAnimationFrame(() => host.classList.add('in')); }
  // --- Photos viewer (1.30): tap the Photos tile -> sheet with the current photo big, Previous / Next (+ swipe), "View Gallery" -> gallery (which has the "Add photos" upload button).
  // While it is open the Wallpanel screensaver is held off (its idle clock is kept fresh) and the tile stops rotating by itself; closing resumes both.
  _ssPause(on) { clearInterval(this._ssKeep); this._ssKeep = null;
    const bump = () => { const w = ssWallpanel(); if (w && !(w.screensaverRunning && w.screensaverRunning())) w.idleSince = Date.now(); };
    if (on && this._config.photo_viewer_pause !== false) { this._ssPaused = true; bump(); this._ssKeep = setInterval(bump, 2000); }
    else if (this._ssPaused) { this._ssPaused = false; bump(); } }
  _openPhotoViewer() {
    if (this._sheetO || this._edit) return; const c = this._config;
    this._ssPause(true); clearTimeout(this._timer); this._timer = null;
    const s = this._openSheet({ label: c.photo_label || 'Photos', bg: '#0b0b10', day: false, dragOk: path => !path.some(n => n instanceof Element && n.tagName === 'BUTTON'),
      onClose: () => { if (this._galO) this._galO.close(); if (this._pv && this._pv.dispose) this._pv.dispose(); this._pv = null; this._ssPause(false); this._restartTimer(true); },
      build: bd => this._buildViewer(bd) });
    if (s && this._ids == null && this._hass) this._loadPhotos(); }
  _buildViewer(bd) {
    const hub = this, c = this._config, nav = c.photo_viewer_nav !== false, swipe = nav && c.photo_viewer_swipe !== false, add = c.photo_viewer_add !== false;
    bd.style.cssText = 'padding:0;overflow:hidden';
    bd.innerHTML = `<style>${PV_CSS}</style><div class="pv"><div class="pvb"></div><div class="pvs"><div class="pvi"></div><div class="pvi"></div></div>
      <div class="pvh"><span class="pvt">${esc(c.photo_label || 'Photos')}</span><span class="pvn"></span></div><div class="pve" hidden>No pictures yet</div>
      <div class="pvc">${nav ? '<button class="pvk pvp" aria-label="Previous picture"><ha-icon icon="mdi:chevron-left"></ha-icon><span>Previous</span></button>' : ''}${add ? '<button class="pvk pva" aria-label="View Gallery"><ha-icon icon="mdi:image-multiple"></ha-icon><span>View Gallery</span></button>' : ''}${nav ? '<button class="pvk pvx" aria-label="Next picture"><span>Next</span><ha-icon icon="mdi:chevron-right"></ha-icon></button>' : ''}</div></div>`;
    const root = bd.querySelector('.pv'), back = bd.querySelector('.pvb'), L = [...bd.querySelectorAll('.pvi')], cnt = bd.querySelector('.pvn'), emp = bd.querySelector('.pve'), stage = bd.querySelector('.pvs');
    let cur = 1, shown = null; this._pvEl = root;
    const refresh = () => { const n = (hub._ids || []).length; cnt.textContent = n > 1 && hub._pos >= 0 ? `${hub._pos + 1} / ${n}` : ''; emp.hidden = !!shown || !!hub._loading;
      for (const b of bd.querySelectorAll('.pvp,.pvx')) b.disabled = n < 2; };
    const show = (url, dir) => { if (!url) { refresh(); return; }
      if (url === shown) { refresh(); return; } shown = url; const on = L[cur = 1 - cur], off = L[1 - cur], bg = `url("${String(url).replace(/"/g, '%22')}")`, d = dir || 0, o = 36 * d;
      on.style.transition = 'none'; on.style.transform = o ? `translateX(${o}px)` : ''; on.style.backgroundImage = bg; void on.offsetWidth; on.style.transition = ''; on.style.transform = ''; on.classList.add('on');
      off.classList.remove('on'); off.style.transform = o ? `translateX(${-o}px)` : ''; back.style.backgroundImage = bg; refresh(); };
    hub._pv = { show, refresh, busy: on => root.classList.toggle('ld', !!on) };
    const go = d => { hub._go(d); };
    if (nav) { bd.querySelector('.pvp').addEventListener('click', () => go(-1)); bd.querySelector('.pvx').addEventListener('click', () => go(1)); }
    if (add) bd.querySelector('.pva').addEventListener('click', () => hub._openGallery());
    const key = k => { if (!hub._pv || hub._galO) return; if (nav && k.key === 'ArrowLeft') go(-1); else if (nav && k.key === 'ArrowRight') go(1); };
    addEventListener('keydown', key); hub._pv.dispose = () => removeEventListener('keydown', key);
    if (swipe) { let g = null;
      stage.addEventListener('touchstart', e => { g = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, on: false, dx: 0 } : null; }, { passive: true });
      stage.addEventListener('touchmove', e => { if (!g) return; const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y;
        if (!g.on) { if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) g.on = true; else return; }
        g.dx = dx; const el = L[cur]; el.style.transition = 'none'; el.style.transform = `translateX(${(dx * 0.7).toFixed(0)}px)`; }, { passive: true });
      const end = () => { if (!g) return; const s0 = g; g = null; if (!s0.on) return; const el = L[cur], W = stage.clientWidth || 400;
        el.style.transition = ''; el.style.transform = '';
        if (Math.abs(s0.dx) > Math.min(90, W * 0.18)) go(s0.dx < 0 ? 1 : -1); };
      stage.addEventListener('touchend', end); stage.addEventListener('touchcancel', end); }
    if (hub._cur) show(hub._cur, 0); else refresh();
    if (hub._ids && hub._pos >= 0) hub._prefetch(hub._pos, 1);
    return { set hass(h) {} }; }
  // step through the list (Previous / Next, swipes): the tile, the page backdrop and the viewer all follow
  async _go(d) { this._goQ = (this._goQ || 0) + d; if (this._going) return; this._going = true;
    const tb = setTimeout(() => { if (this._pv) this._pv.busy(true); }, 250); // a slow photo (big file over a slow link): show a spinner
    try { if (!this._ids && this._hass) await this._loadPhotos();
      while (this._goQ) { const q = this._goQ; this._goQ = 0; await this._showPos(this._pos + q, Math.sign(q)); } } finally { clearTimeout(tb); if (this._pv) this._pv.busy(false); this._going = false; this._goQ = 0; } }
  async _showPos(pos, dir) { const n = (this._ids || []).length; if (!n) return false;
    for (let k = 0; k < Math.min(n, 5); k++) { const p = (((pos + k * dir) % n) + n) % n, id = this._ids[p]; let low = false;
      try { const u0 = this._urlPeek(id);
        if (!(u0 && HVL.has(u0)) && this._pv) { this._pos = p; const th = HVL.thumbSync(id) || await HVL.thumb(id); // not loaded yet: the counter moves now, and a small version shows at once
          if (th && this._pv && !this._goQ) { this._pv.show(th, dir); low = true; } else if (this._pv) this._pv.refresh(); }
        const u = await this._url(id); await HVL.load(u, 0, id); this._pos = p;
        if (this._goQ) { this._prefetch(p, dir); return true; } // tapped again meanwhile: go straight on, don't paint this one
        this._curId = id; this._cur = u; this._layer = 1 - this._layer; this._paintPhoto(false, low ? 0 : dir); this._prefetch(p, dir); return true; } catch (e) { /* skip an unreadable picture */ } }
    return false; }
  async _pickId(id) { if (!this._ids) this._ids = []; let p = this._ids.indexOf(id); if (p < 0) { this._ids.push(id); p = this._ids.length - 1; } return this._showPos(p, 1); }
  // --- gallery popup: every photo in the media folder as a thumbnail grid (tap = show it, it also becomes the Photos tile photo) + upload from the device
  async _openGallery() {
    if (this._galO || !this._sheetO || !this._hass) return; const hub = this, c = this._config, h = () => this._hass;
    let src = null, ids = [], busy = false, io = null; const names = () => new Set(ids.map(i => i.split('/').pop().toLowerCase()));
    const folder = () => src && /^media-source:\/\//.test(src.url) ? src.url : null;
    const admin = () => !h().user || h().user.is_admin !== false;
    this._galO = hvSheet({ full: this._config.full_height_popups !== false, edit: this._penFn(), parent: this.shadowRoot, label: 'Photo gallery', bg: '#12121a', day: false, launch: () => [this._pvEl], dragOk: path => !path.some(n => n instanceof Element && n.tagName === 'BUTTON'),
      onClose: () => { this._galO = null; if (io) io.disconnect(); HVL.dropGallery(); },
      build: bd => { bd.style.padding = '0';
        bd.innerHTML = `<style>${PV_CSS}</style><div class="pg"><div class="pgh"><div class="pgt"><b>Photo gallery</b><span class="pgc"></span></div>${c.photo_gallery_upload !== false ? '<button class="pvk pgu"><ha-icon icon="mdi:image-plus"></ha-icon><span>Add photos</span></button>' : ''}</div>
          <input type="file" class="pgf" accept="image/*" multiple hidden><div class="pgs" hidden></div><div class="pgm">Loading photos…</div><div class="pgg"></div></div>`;
        const grid = bd.querySelector('.pgg'), msg = bd.querySelector('.pgm'), cnt = bd.querySelector('.pgc'), st = bd.querySelector('.pgs'), file = bd.querySelector('.pgf'), upb = bd.querySelector('.pgu');
        const status = (t, err) => { st.hidden = !t; st.textContent = t || ''; st.classList.toggle('err', !!err); };
        const paint = fresh => { const curId = hub._ids && hub._ids[hub._pos]; cnt.textContent = ids.length ? `${ids.length} photo${ids.length === 1 ? '' : 's'}` : '';
          msg.hidden = !!ids.length; if (!ids.length) msg.textContent = 'No photos in this folder yet.' + (upb && folder() ? ' Use “Add photos” to upload some.' : '');
          if (io) io.disconnect(); HVL.dropGallery();
          const fill = t => { const id = t.dataset.id, im = t.querySelector('img'), set = u => { im.onload = () => t.classList.add('ld'); im.onerror = () => t.classList.add('bad'); im.src = u; };
            HVL.thumb(id).then(th => { if (th) { set(th); return; } if (!t._req) return;
              return hub._url(id).then(u => { if (!t._req) return; const pr = HVL.load(u, 5, id, { keep: false }); t._job = pr; return pr.then(() => { t._job = null; set(HVL.thumbSync(id) || u); }); }); })
              .catch(() => { t._job = null; if (t._req) { t._req = false; } }); };
          io = new IntersectionObserver(es => { for (const e of es) { const t = e.target;
            if (!e.isIntersecting) { if (t._job && !t.classList.contains('ld')) { t._job.cancel(); t._job = null; t._req = false; } continue; }
            if (t._req || t.classList.contains('ld')) continue; t._req = true; fill(t); } }, { root: bd, rootMargin: '300px' });
          grid.innerHTML = ids.map(id => `<button class="gt${id === curId ? ' cur' : ''}${fresh && fresh.has(id) ? ' new' : ''}" data-id="${esc(id)}" aria-label="${esc(id.split('/').pop())}"><img alt="" loading="lazy" decoding="async" width="150" height="150"><ha-icon icon="mdi:image-broken-variant"></ha-icon></button>`).join('');
          for (const t of grid.children) io.observe(t); };
        grid.addEventListener('click', ev => { const t = ev.composedPath().find(n => n.dataset && n.dataset.id); if (!t) return; hub._pickId(t.dataset.id).then(() => { if (hub._galO) hub._galO.close(); }); });
        const reload = async force => { const r = await hub._listPhotos(force, src); src = r.src; ids = r.ids; };
        if (upb) { const canUp = () => folder() && admin();
          const upload = () => { if (busy) return; if (!folder()) { status(src && src.album ? 'This Home Screen shows an album link: add pictures to the album in its own app (Google Photos, Photos, OneDrive).' : 'Uploads need a media folder as the photo source (media-source://…); this one is a web address.', true); return; }
            if (!admin()) { status('Only a Home Assistant administrator can add pictures.', true); return; } file.click(); };
          // 1.32.0: "Add photos" opens a small menu first: Upload photos (the file picker, as before) or Add album link (Google Photos / iCloud / OneDrive)
          upb.addEventListener('click', e => { e.stopPropagation(); if (busy) return; if (bd.parentNode.querySelector(':scope > .pam')) { closeMenu(); return; } openMenu(); });
          const isAdm = () => !!(h().user && h().user.is_admin === true), albOn = () => hub._config.photo_source_mode === 'album' && !!String(hub._config.photo_album_url || '').trim();
          let menuOff = null; const closeMenu = () => { const m = bd.parentNode.querySelector(':scope > .pam'); if (m) m.remove(); if (menuOff) { menuOff(); menuOff = null; } upb.setAttribute('aria-expanded', 'false'); };
          const openMenu = () => { closeMenu(); const shE = bd.parentNode, m = document.createElement('div'); m.className = 'pam'; m.setAttribute('role', 'menu');
            const lv = (hvFindRoot(hub) || {}).lovelace, yaml = !!(lv && lv.mode === 'yaml'), can = isAdm() && !!lv && !yaml, alb = albOn(), url = String(hub._config.photo_album_url || '').trim();
            const why = !isAdm() ? 'Only a Home Assistant administrator can add photos or change the photo source.' : !lv ? 'Open the dashboard to change the photo source.' : yaml ? 'This dashboard is in YAML mode: set photo_source_mode / photo_album_url in its YAML.' : '';
            const it = (k, icon, t, sub, off) => `<button class="mi" role="menuitem" data-k="${k}"${off ? ' disabled' : ''}><ha-icon icon="${icon}"></ha-icon><span class="mt"><b>${esc(t)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</span></button>`;
            let html = '';
            if (alb) { const st = (window.__hvAlbumSt || {})[url], pv = hvAlbumProv(url);
              html += `<div class="cur"><b>Album link</b>${st && st.ok ? `✓ ${esc(HV_ALB_NAME[pv] || 'Album')} “${esc(st.title)}” · ${st.count} photo${st.count === 1 ? '' : 's'}` : esc(HV_ALB_NAME[pv] || 'Album')}<span class="u">${esc(url)}</span></div>`
                + it('album', 'mdi:link-variant', 'Change album link', 'Google Photos, iCloud or OneDrive', !can) + it('media', 'mdi:folder-image', 'Use media folder instead', 'Home Assistant media (Media → My media)', !can)
                + it('upload', 'mdi:upload', 'Upload photos', 'Not available while an album link is the source: add photos in the album\'s own app', true); }
            else html += it('upload', 'mdi:upload', 'Upload photos', folder() ? 'From this device into the media folder' : 'Needs a media folder as the photo source', !folder() || !isAdm())
              + it('album', 'mdi:link-variant', 'Add album link', 'Google Photos, iCloud or OneDrive', !can);
            m.innerHTML = html + (why ? `<div class="why">${esc(why)}</div>` : '');
            shE.appendChild(m); const place = () => { const a = upb.getBoundingClientRect(), r = shE.getBoundingClientRect(); m.style.top = Math.round(a.bottom - r.top + 8) + 'px'; m.style.right = Math.round(Math.max(8, Math.min(r.right - a.right, r.width - 8 - m.offsetWidth))) + 'px'; }; place(); // on the sheet (not the blurred header) so its frosted glass shows the photos behind
            upb.setAttribute('aria-expanded', 'true');
            for (const t of ['pointerdown', 'touchstart', 'touchend', 'mousedown']) m.addEventListener(t, ev => ev.stopPropagation(), { passive: true });
            m.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.composedPath().find(n => n.tagName === 'BUTTON'); if (!b || b.disabled) return; const k = b.dataset.k; closeMenu();
              if (k === 'upload') upload(); else if (k === 'album') albumSheet(alb ? url : ''); else if (k === 'media') setSource({ photo_source_mode: null, photo_album_url: null }, 'Photos now come from the media folder ✓'); });
            const out = ev => { if (!ev.composedPath().includes(m) && !ev.composedPath().includes(upb)) closeMenu(); }, key = ev => { if (ev.key === 'Escape') { ev.stopImmediatePropagation(); closeMenu(); } };
            setTimeout(() => { if (!m.isConnected) return; addEventListener('pointerdown', out, true); addEventListener('keydown', key, true); }, 0);
            const scr = () => closeMenu(); bd.addEventListener('scroll', scr, { passive: true }); addEventListener('resize', scr);
            menuOff = () => { removeEventListener('pointerdown', out, true); removeEventListener('keydown', key, true); bd.removeEventListener('scroll', scr); removeEventListener('resize', scr); };
            const f1 = m.querySelector('.mi:not([disabled])'); if (f1) f1.focus({ preventScroll: true }); };
          // save the photo source on THIS Home Screen card (re-read, change only these keys, save: same as the visual editor)
          const setSource = async (patch, okMsg) => { status('Saving…'); try { const t = await hvSaveHubCfg(hub, patch); hvToast(okMsg);
              // the dashboard re-renders after a save and may build a new Home Screen card: open the photos again there, so you stay where you were
              for (let i = 0; i < 15; i++) { await new Promise(r => setTimeout(r, 100)); if (!hub.isConnected || !hub._galO) break; }
              if (!hub.isConnected || !hub._galO) { for (let i = 0; i < 40; i++) { const nh = [...HV_HUBS].find(x => x !== hub && x.isConnected && hvCfgMatch(x)(t));
                  if (nh && nh._hass) { if (!nh._sheetO) nh._openPhotoViewer(); setTimeout(() => { if (nh._sheetO && !nh._galO) nh._openGallery(); }, 700); break; } await new Promise(r => setTimeout(r, 100)); } return; }
              hub.setConfig(t); status(okMsg); src = null; ids = []; paint(); await reload(true); paint(); } catch (e) { status('Not saved: ' + ((e && (e.message || e.code)) || e), true); } };
          const albumSheet = cur => { const sh = bd.parentNode; if (sh.querySelector(':scope > .pal')) return;
            const o = document.createElement('div'); o.className = 'pal'; o.innerHTML = `<div class="bx" role="dialog" aria-modal="true" aria-label="Album link"><h3>${cur ? 'Change album link' : 'Add album link'}</h3>
              <p>Paste the link of a shared album. The photos are shown on the Photos tile (and its viewer) instead of the media folder; the list refreshes every 6 hours.</p>
              <input type="url" inputmode="url" enterkeyhint="done" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="https://photos.app.goo.gl/…" aria-label="Album link">
              <div class="pr"><span data-p="google">Google Photos</span><span data-p="icloud">iCloud shared album</span><span data-p="onedrive">OneDrive</span></div>
              <div class="st" aria-live="polite"></div><div class="bt"><button class="pvk cn">Cancel</button><button class="pvk sv" disabled>Save</button></div></div>`;
            sh.appendChild(o); const inp = o.querySelector('input'), stE = o.querySelector('.st'), sv = o.querySelector('.sv'); let chk = null, q = '', tm = null;
            for (const t of ['pointerdown', 'touchstart', 'touchmove', 'touchend', 'mousedown']) o.addEventListener(t, ev => ev.stopPropagation(), { passive: true });
            const close = () => { o.remove(); removeEventListener('keydown', key, true); clearTimeout(tm); };
            const key = ev => { if (ev.key === 'Escape') { ev.stopImmediatePropagation(); ev.preventDefault(); close(); } };
            addEventListener('keydown', key, true);
            const paintSt = () => { const u = inp.value.trim(), pv = hvAlbumProv(u); o.querySelectorAll('.pr span').forEach(x => x.classList.toggle('on', x.dataset.p === pv));
              const ok = !!(chk && chk.url === u && chk.ok), inf = hvAlbumInfo(u); stE.className = 'st' + (ok ? ' ok' : chk && chk.url === u && !chk.ok ? (chk.needHelper ? ' warn' : ' err') : !u || (pv && !inf.issue) ? '' : ' err');
              stE.textContent = !u ? 'Google Photos (photos.app.goo.gl/…), an iCloud shared album with “Anyone with the Link” on (photos.icloud.com/shared/album/…, older albums icloud.com/sharedalbum/#…) or OneDrive (1drv.ms/…, “Anyone with the link”).'
                : hvAlbumStatus(chk, u).replace(' Until it works, the photos come from the media folder.', '').replace(' The list refreshes every 6 hours; Order = Random shuffles it.', '');
              sv.disabled = !ok || u === cur; };
            const check = () => { const u = inp.value.trim(); clearTimeout(tm); paintSt(); if (!u || !hvAlbumProv(u) || hvAlbumInfo(u).issue || (chk && chk.url === u)) return;
              tm = setTimeout(() => { q = u; hvAlbumLoad(h(), u).then(r => { if (q !== u) return; chk = Object.assign({ url: u }, r); delete chk.ids; const S = window.__hvAlbumSt || (window.__hvAlbumSt = {}); if (r.ok) S[u] = Object.assign({ url: u, t: Date.now() }, chk); paintSt(); }); }, 600); };
            inp.addEventListener('input', check); inp.addEventListener('change', check);
            inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (!sv.disabled) sv.click(); } });
            o.querySelector('.cn').addEventListener('click', ev => { ev.stopPropagation(); close(); });
            o.addEventListener('click', ev => { ev.stopPropagation(); if (ev.target === o) close(); });
            sv.addEventListener('click', async ev => { ev.stopPropagation(); const u = inp.value.trim(); if (sv.disabled) return; sv.disabled = true; inp.disabled = true; stE.className = 'st'; stE.textContent = 'Saving…';
              const ttl = chk && chk.title; close(); await setSource({ photo_source_mode: 'album', photo_album_url: hvAlbumInfo(u).url }, `Photos now come from ${HV_ALB_NAME[hvAlbumProv(u)] || 'the album'}${ttl ? ' “' + ttl + '”' : ''} ✓`); });
            inp.value = cur || ''; if (cur) { chk = (window.__hvAlbumSt || {})[cur] ? Object.assign({}, window.__hvAlbumSt[cur], { url: cur }) : null; } paintSt(); check(); setTimeout(() => inp.focus(), 60); };
          file.addEventListener('change', async () => { const files = [...file.files]; file.value = ''; if (!files.length || busy || !canUp()) return; busy = true; upb.disabled = true;
            const before = new Set(ids); let done = 0; const res = await hub._upload(files, folder(), names(), (i, n) => status(`Uploading ${i} of ${n}…`));
            try { await reload(true); } catch (e) {} const fresh = new Set(ids.filter(i => !before.has(i)));
            for (const id of ids) if (hub._ids && !hub._ids.includes(id)) hub._ids.push(id);
            paint(fresh); busy = false; upb.disabled = false;
            status((res.ok.length ? `Added ${res.ok.length} picture${res.ok.length === 1 ? '' : 's'}.` : '') + (res.fail.length ? ` ${res.fail.length} failed: ${res.fail.map(f => f.name + ' (' + f.why + ')').join('; ')}` : ''), !res.ok.length && res.fail.length > 0);
            const n1 = grid.querySelector('.gt.new'); if (n1) n1.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { if (!busy) status(res.fail.length ? st.textContent : ''); }, 9000); }); }
        (async () => { try { await reload(false); paint(); hub._resolveAll(Math.max(0, hub._pos)); const c1 = grid.querySelector('.gt.cur'); if (c1) c1.scrollIntoView({ block: 'center' }); } catch (e) { msg.hidden = false; msg.textContent = 'Could not load the photos: ' + (e && e.message || e); } })();
        return { set hass(v) {} }; } }); }
  async _listPhotos(force, src0) { const src = src0 || await this._source(), C = window.__hvPhotoCache || (window.__hvPhotoCache = {}), key = src.url || 'album:' + src.album;
    let ids = !force && C[key] && Date.now() - C[key].t < (C[key].ttl || 36e5) ? C[key].ids : null; if (!ids) { ids = await this._scan(src); C[key] = { t: Date.now(), ids, ttl: src.ttl }; } return { src, ids: ids.slice() }; }
  // Upload through Home Assistant's media browser API (POST /api/media_source/local_source/upload, multipart media_content_id + file; admin only, 20 MB each).
  // Never overwrites: a name that is already in the folder gets a short suffix. Returns { ok: [names], fail: [{ name, why }] }.
  async _upload(files, folder, taken, onProg) { const out = { ok: [], fail: [] }, h = this._hass, MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif', bmp: 'image/bmp' };
    const url = '/api/media_source/local_source/upload'; let i = 0;
    for (const f of files) { i++; onProg && onProg(i, files.length); const ext = (f.name.match(/\.([A-Za-z0-9]+)$/) || [])[1] || '', type = f.type || MIME[ext.toLowerCase()] || '';
      if (!/^image\//.test(type)) { out.fail.push({ name: f.name, why: 'not a picture' }); continue; }
      if (f.size > 20 * 1024 * 1024) { out.fail.push({ name: f.name, why: 'over 20 MB' }); continue; }
      let nm = f.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '_') || 'photo.' + (ext || 'jpg');
      if (taken.has(nm.toLowerCase())) { const b = nm.replace(/\.[^.]*$/, ''), e = (nm.match(/\.[^.]*$/) || [''])[0]; let k = 0; do { nm = `${b}_${Date.now().toString(36)}${k ? k : ''}${e}`; k++; } while (taken.has(nm.toLowerCase())); }
      taken.add(nm.toLowerCase());
      try { const fd = new FormData(); fd.append('media_content_id', folder); fd.append('file', nm === f.name && f.type === type ? f : new File([f], nm, { type }));
        const r = await (h.fetchWithAuth ? h.fetchWithAuth(url, { method: 'POST', body: fd }) : fetch(h.hassUrl ? h.hassUrl(url) : url, { method: 'POST', body: fd, headers: { Authorization: 'Bearer ' + ((h.auth && (h.auth.accessToken || (h.auth.data && h.auth.data.access_token))) || '') } }));
        if (r.ok) out.ok.push(nm); else out.fail.push({ name: f.name, why: r.status === 401 || r.status === 403 ? 'administrators only' : r.status === 413 ? 'too large' : 'Home Assistant refused it (' + r.status + ')' }); }
      catch (e) { out.fail.push({ name: f.name, why: 'upload failed' }); } }
    return out; }
  // --- weather sheet (Apple Weather style); read-only forecast subscriptions while it is open
  _openWeather(entity) {
    if (this._sheetO) return; const h = this._hass, id = entity || this._config.weather_entity || (h.states['weather.forecast_home'] ? 'weather.forecast_home' : Object.keys(h.states).find(k => k.startsWith('weather.')));
    if (!id) return; const host = document.createElement('homeview-weather-sheet'), sr = host.attachShadow({ mode: 'open' }); let fh = null, fd = null; const subs = [];
    const skyOn = this._config.weather_sky_header === true; let skyKey = ''; host.toggleAttribute('sky', skyOn);
    const sub = (type, cb) => { try { const u = h.connection.subscribeMessage(m => { cb(m.forecast || []); paint(); }, { type: 'weather/subscribe_forecast', forecast_type: type, entity_id: id }); subs.push(u); if (u.catch) u.catch(() => {}); } catch (e) {} };
    const lang = () => (this._hass.locale && this._hass.locale.language) || navigator.language;
    const tf = d => { const o = { hour: 'numeric' }; const t = this._hass.locale && this._hass.locale.time_format; if (t === '24') o.hour12 = false; else if (t === '12') o.hour12 = true;
      const s = d.toLocaleTimeString(lang(), o); const m = s.match(/^(\d+)\s*([^\d\s]+)$/); return m ? `${m[1]}<small>${esc(m[2])}</small>` : esc(s); };
    const paint = () => { const H = this._hass, s = H.states[id]; if (!s) return; const a = s.attributes, sun = H.states['sun.sun'], night = sun ? sun.state === 'below_horizon' : false;
      const today = (fd || [])[0], u = a.temperature_unit || '°';
      if (skyOn) { const k = WX_SKY_KIND(s.state), nt = night || s.state === 'clear-night', g = WX_SKY_G[k][nt ? 1 : 0], key = k + '|' + nt + '|' + s.state;
        if (key !== skyKey) { skyKey = key; sr.querySelector('.wxh').innerHTML = wxSkyHtml(k, nt, s.state); sr.querySelector('.wxh').dataset.v = k + (nt ? '-night' : '');
          sr.querySelector('.sky').style.background = `linear-gradient(180deg,${g[0]} 0%,${g[1]} 45%,${g[2]} 100%)`; host.setAttribute('k', k); host.toggleAttribute('night', nt);
          host.style.setProperty('--wx-pn', nt ? WX_SKY_PN.night : WX_SKY_PN[k]); }
        host.toggleAttribute('wday', hvMode(this._config.theme, H) === 'day'); }
      else sr.querySelector('.sky').style.background = hubWeatherBg(s.state, night);
      sr.querySelector('.clk').textContent = new Date().toLocaleTimeString(lang(), { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
      sr.querySelector('.loc').textContent = (this._config.location_name || (H.config && H.config.location_name) || a.friendly_name || 'Home');
      sr.querySelector('.tmp').textContent = a.temperature != null ? Math.round(a.temperature) + '°' : '—';
      sr.querySelector('.cnd').textContent = fmtState(H, s);
      sr.querySelector('.hl').textContent = today ? `H:${Math.round(today.temperature)}°  L:${Math.round(today.templow)}°` : '';
      const wd = host.hasAttribute('wday'), ic = (cnd, nt) => `<ha-icon icon="${(nt && cnd === 'partlycloudy') ? 'mdi:weather-night-partly-cloudy' : (WX_ICON[cnd] || 'mdi:weather-partly-cloudy')}" style="color:${wd ? HUB_WX_COLOR_DAY[cnd] || '#3c3c43' : HUB_WX_COLOR[cnd] || '#fff'}"></ha-icon>`;
      const hrs = (fh || []).filter(f => new Date(f.datetime) > Date.now() - 36e5).slice(0, 24);
      sr.querySelector('.hr').innerHTML = hrs.length ? hrs.map((f, i) => { const d = new Date(f.datetime), hh = d.getHours(), nt = night ? (hh < 7 || hh >= 19) : (hh < 6 || hh >= 20);
        return `<div class="h"><div class="t">${i ? tf(d) : 'Now'}</div>${ic(f.condition, nt)}<div class="p">${f.precipitation_probability >= 20 ? Math.round(f.precipitation_probability) + '%' : ''}</div><div>${Math.round(f.temperature)}°</div></div>`; }).join('')
        : '<div class="h" style="min-width:auto;opacity:.7">Loading…</div>';
      const days = (fd || []).slice(0, 7), lo = Math.min(...days.map(f => f.templow ?? f.temperature)), hi = Math.max(...days.map(f => f.temperature)), sp = Math.max(1, hi - lo);
      sr.querySelector('.dl').innerHTML = `<div class="pt"><ha-icon icon="mdi:calendar-month-outline"></ha-icon>${days.length}-day forecast</div>` + days.map((f, i) => { const d = new Date(f.datetime), l = f.templow ?? f.temperature;
        return `<div class="d"><div>${i ? esc(d.toLocaleDateString(lang(), { weekday: 'short' })) : 'Today'}</div>${ic(f.condition)}<div class="lo">${Math.round(l)}°</div><div class="rng"><i style="left:${(l - lo) / sp * 100}%;right:${(hi - f.temperature) / sp * 100}%"></i></div><div>${Math.round(f.temperature)}°</div></div>`; }).join('');
      sr.querySelector('.dl').style.display = days.length ? '' : 'none'; };
    sr.innerHTML = `<style>${WX_CSS}${skyOn ? WX_SKY_CSS : ''}</style><div class="sky"></div>${skyOn ? '<div class="wxh" aria-hidden="true"></div>' : ''}<div class="sc" role="dialog" aria-modal="true" aria-label="Weather"><div class="bar"><div class="clk"></div><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="hero"><div class="loc"></div><div class="tmp"></div><div class="cnd"></div><div class="hl"></div></div>
      <div class="grid2"><div class="pn"><div class="pt"><ha-icon icon="mdi:clock-outline"></ha-icon>Hourly forecast</div><div class="hr"></div></div><div class="pn dl"></div></div></div>`;
    const st2 = document.createElement('style'); st2.textContent = ':host{position:absolute !important;inset:0 !important;z-index:auto !important} .sc{padding-top:46px !important} .grid2{width:min(100%,1100px);min-width:0} .bar .x{visibility:hidden} .bar::before{display:none}'; sr.appendChild(st2);
    const tick = setInterval(paint, 30000); paint(); sub('hourly', f => { fh = f; }); sub('daily', f => { fd = f; });
    this._openSheet({ label: 'Weather', bg: '#1d3b66', day: false, build: bd => { bd.style.padding = '0'; bd.style.overflow = 'hidden'; host.classList.add('in'); bd.appendChild(host); return { set hass(v) { paint(); } }; },
      onClose: () => { clearInterval(tick); subs.forEach(u => Promise.resolve(u).then(f => f && f()).catch(() => {})); } }); }
}
const HUB_APP_FIELDS = {
  name: { label: 'Label', selector: { text: {} } },
  icon: { label: 'Icon (hv:home = the Home app house)', selector: { text: {} } },
  color_from: { label: 'Gradient top colour (e.g. #5ec8ff)', selector: { text: {} } },
  color_to: { label: 'Gradient bottom colour', selector: { text: {} } },
  glyph_color: { label: 'Glyph colour (empty = white)', selector: { text: {} } },
  kind: { label: 'What it does', selector: { select: { mode: 'dropdown', options: [{ value: 'navigate', label: 'Open a view' }, { value: 'now_playing', label: 'Now Playing popup' },
    { value: 'weather', label: 'Weather popup' }, { value: 'assistant', label: 'Assistant (voice / typed)' }, { value: 'photos', label: 'Full-screen photos' }, { value: 'action', label: 'Custom tap action' }] } } },
  navigation_path: { label: 'View (Open a view)', selector: { navigation: {} } },
  open_as: { label: 'Open as (Open a view / Now Playing; empty = Sheet)', selector: { select: { mode: 'dropdown', options: [{ value: 'sheet', label: 'Sheet (slides up over the launch page)' }, { value: 'page', label: 'Page / classic popup' }] } } },
  entity: { label: 'Player (Now Playing) / entity (custom action)', selector: { entity: {} } },
  entities: { label: 'Other speakers to switch between (Now Playing)', selector: { entity: { domain: 'media_player', multiple: true } } },
  weather_entity: { label: 'Weather entity (Weather popup)', selector: { entity: { domain: 'weather' } } },
  tap_action: { label: 'Tap action (Custom tap action)', selector: { ui_action: {} } } };
const hubTileOpt = (c, i) => ((c && Array.isArray(c.side_tiles) ? c.side_tiles[i] : null) || {});
const hubTileSizes = c => { const s = hubSizes(c && c.side_sizes); return Array.from({ length: Math.max(s.length, ((c && c.side_cards) || []).length) }, (_, i) => { const o = hubTileOpt(c, i); return o.size === 'wide' ? 2 : o.size === 'square' ? 1 : s[i] || 1; }); };
const hubSizes = t => String(t || '').split(/[\s,;]+/).filter(Boolean).map(x => /^w/i.test(x) || x === '2' ? 2 : 1);
const hubUnitsNote = c => { const n = ((c && c.side_cards) || []).length, sz = hubTileSizes(c), u = (c && c.photo_size === 'square' ? 1 : 2) + Array.from({ length: n }, (_, i) => sz[i] === 2 ? 2 : 1).reduce((a, b) => a + b, 0);
  return `Photos + ${n} extra tile(s) = ${u} unit(s). A landscape tablet fits 3 beside the apps, a portrait tablet / phone 1;` + (u > 3 ? ' ⚠ more than 3: the rest wraps to a row below.' : ' the rest wraps to a row below.'); };
const n_ = (name, min, max, step, unit) => ({ name, selector: { number: Object.assign({ min, max, step: step || 1, mode: 'box' }, unit ? { unit_of_measurement: unit } : {}) } });
const HUB_SCHEMA = [
  { name: 'theme', selector: { select: { mode: 'dropdown', options: HV_THEME_OPTS } } },
  { name: 'apps', selector: { object: { multiple: true, label_field: 'name', description_field: 'kind', fields: HUB_APP_FIELDS } } },
  { type: 'expandable', name: '', flatten: true, title: 'Person & greeting', icon: 'mdi:account-circle-outline', schema: [
    { type: 'grid', name: '', schema: [{ name: 'person', selector: { entity: { domain: 'person' } } }, { name: 'fallback_person', selector: { entity: { domain: 'person' } } }] },
    { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'ring_color', selector: { text: {} } }] },
    { type: 'grid', name: '', schema: [n_('morning_start', 0, 23), n_('afternoon_start', 0, 23), n_('evening_start', 0, 23), n_('night_start', 0, 23)] },
    { type: 'grid', name: '', schema: [{ name: 'greeting_morning', selector: { text: {} } }, { name: 'greeting_afternoon', selector: { text: {} } }, { name: 'greeting_evening', selector: { text: {} } }, { name: 'greeting_night', selector: { text: {} } }] }] },
  { type: 'expandable', name: '', flatten: true, title: 'Photos & background', icon: 'mdi:image-multiple-outline', schema: [
    { name: 'photo_source_mode', selector: { select: { mode: 'dropdown', options: [{ value: 'media', label: 'Media folder (Home Assistant media)' }, { value: 'album', label: 'Album link (Google Photos, iCloud, OneDrive)' }] } } },
    { name: 'photo_source', selector: { text: {} } },
    { type: 'grid', name: '', schema: [n_('photo_interval', 5, 600, 1, 's'), { name: 'photo_order', selector: { select: { mode: 'dropdown', options: [{ value: 'random', label: 'Random' }, { value: 'sorted', label: 'In order' }] } } }] },
    { type: 'grid', name: '', schema: [{ name: 'photo_backdrop', selector: { boolean: {} } }, { name: 'bg_freeze', selector: { boolean: {} } }] },
    { name: 'bg_transparency', selector: { number: { min: 0, max: 100, step: 1, mode: 'slider', unit_of_measurement: '%' } } },
    { name: 'wallpaper', selector: { text: {} } },
    { type: 'expandable', name: '', flatten: true, title: 'Advanced background', icon: 'mdi:tune-variant', schema: [
      { type: 'grid', name: '', schema: [n_('blur', 0, 120, 1, 'px'), n_('dim', 0, 0.9, 0.02)] }] },
    { type: 'grid', name: '', schema: [{ name: 'photo_tap', selector: { select: { mode: 'dropdown', options: [{ value: 'viewer', label: 'Photo viewer (previous / next, add pictures)' }, { value: 'screensaver', label: 'Start the screensaver' }, { value: 'fullscreen', label: 'Full-screen photo (just the picture)' }, { value: 'none', label: 'Nothing' }] } } },
      { name: 'photo_label', selector: { text: {} } }] },
    { type: 'grid', name: '', schema: [{ name: 'photo_viewer_nav', selector: { boolean: {} } }, { name: 'photo_viewer_swipe', selector: { boolean: {} } }, { name: 'photo_viewer_add', selector: { boolean: {} } },
      { name: 'photo_gallery_upload', selector: { boolean: {} } }, { name: 'photo_viewer_pause', selector: { boolean: {} } }] }] },
  { type: 'expandable', name: '', flatten: true, title: 'Calendar', icon: 'mdi:calendar', schema: [
    { type: 'grid', name: '', schema: [{ name: 'show_calendar', selector: { boolean: {} } }, { name: 'calendar_show_weather', selector: { boolean: {} } }] },
    { name: 'calendar_entities', selector: { entity: { domain: 'calendar', multiple: true } } },
    { type: 'grid', name: '', schema: [{ name: 'calendar_layout', selector: { select: { mode: 'dropdown', options: [{ value: 'wide', label: 'Wide: days side by side' }, { value: 'list', label: 'List' }] } } }, n_('calendar_columns', 1, 7), n_('calendar_days', 1, 30)] },
    { name: 'calendar_rows', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (2 when tall)' }, { value: '1', label: '1 row' }, { value: '2', label: '2 rows' }] } } },
    { type: 'grid', name: '', schema: [{ name: 'calendar_title', selector: { text: {} } }, n_('calendar_min_height', 120, 800, 10, 'px')] }] },
  { type: 'expandable', name: '', flatten: true, title: 'Assistant & timer', icon: 'mdi:microphone-message', schema: [
    { type: 'grid', name: '', schema: [{ name: 'assistant_enabled', selector: { boolean: {} } }, { name: 'assistant_button', selector: { boolean: {} } }] },
    { name: 'assistant_pipeline', selector: { select: { mode: 'dropdown', options: [{ value: 'preferred', label: 'Preferred (Home Assistant\'s setting)' }] } } },
    { name: 'assistant_theme', selector: { select: { mode: 'dropdown', options: [{ value: 'same', label: 'Same as the device pages theme' }].concat(HV_THEME_OPTS) } } },
    { type: 'grid', name: '', schema: [{ name: 'assistant_auto_listen', selector: { boolean: {} } }, { name: 'assistant_speak', selector: { boolean: {} } }, { name: 'timer_sound', selector: { boolean: {} } }] },
    { type: 'grid', name: '', schema: [{ name: 'assistant_orb', selector: { boolean: {} } }, { name: 'assistant_continue', selector: { boolean: {} } }] },
    { type: 'expandable', name: '', flatten: true, title: 'Quiet mode: Auto', icon: 'mdi:volume-off', schema: [
      { name: 'assistant_quiet_volume_entity', selector: { entity: { domain: ['sensor', 'number', 'input_number'] } } },
      { name: 'assistant_quiet_volume_below', selector: { number: { min: 1, max: 100, step: 1, mode: 'box', unit_of_measurement: '%' } } },
      { name: 'assistant_quiet_focus_entity', selector: { entity: { domain: ['binary_sensor', 'sensor', 'input_boolean'] } } },
      { type: 'grid', name: '', schema: [{ name: 'assistant_quiet_start', selector: { time: { no_second: true } } }, { name: 'assistant_quiet_end', selector: { time: { no_second: true } } }] }] }] },
  { type: 'expandable', name: '', flatten: true, title: 'Layout & weather', icon: 'mdi:view-dashboard-outline', schema: [
    { type: 'grid', name: '', schema: [{ name: 'photo_size', selector: { select: { mode: 'dropdown', options: [{ value: 'wide', label: 'Wide (2 units; alone it fills the row)' }, { value: 'square', label: 'Square (1 unit)' }] } } }, n_('photo_max_aspect', 0.8, 4, 0.1)] },
    { type: 'grid', name: '', schema: [{ name: 'side_sizes', selector: { text: {} } }, n_('row_units', 1, 6)] },
    { name: 'side_tiles', selector: { object: { multiple: true, label_field: 'size', description_field: 'fit', fields: {
      size: { label: 'Size', selector: { select: { mode: 'dropdown', options: [{ value: 'square', label: 'Square (1 unit)' }, { value: 'wide', label: 'Wide (2 units)' }] } } },
      fit: { label: 'Fit', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (centre pictures, fill the rest)' }, { value: 'contain', label: 'Centre & fit inside' }, { value: 'fill', label: 'Fill the tile' }] } } },
      enlarge: { label: 'Tap opens enlarged view', selector: { boolean: {} } },
      zoom: { label: 'Scale / zoom: picture width vs the tile (empty = fit everything; 1.2 = a little cropped at the sides)', selector: { number: { min: 0.5, max: 2.5, step: 0.05, mode: 'slider' } } },
      label_size: { label: 'Label size (1 = as designed)', selector: { number: { min: 0.5, max: 2.5, step: 0.05, mode: 'slider' } } },
      sky: { label: 'Sky background (house scene: time of day, weather, moon)', selector: { boolean: {} } },
      sky_entity: { label: 'Scene sensor for the sky (empty = sensor.house_scene)', selector: { entity: { domain: 'sensor' } } } } } } },
    { type: 'grid', name: '', schema: [{ name: 'side_portrait', selector: { select: { mode: 'dropdown', options: [{ value: 'below', label: 'Wrap to a row below' }, { value: 'hide', label: 'Hide them' }] } } }, n_('max_icon', 60, 220, 2, 'px')] },
    { type: 'grid', name: '', schema: [{ name: 'weather_entity', selector: { entity: { domain: 'weather' } } }, { name: 'location_name', selector: { text: {} } }] },
    { name: 'weather_sky_header', selector: { boolean: {} } },
    { type: 'grid', name: '', schema: [{ name: 'edge_sidebar', selector: { boolean: {} } }, { name: 'block_pull_refresh', selector: { boolean: {} } }] },
    { name: 'full_height_popups', selector: { boolean: {} } },
    { name: 'popup_edit', selector: { boolean: {} } },
    { name: 'swipe_screensaver', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto (when the screensaver is on here)' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }] } } }, { name: 'ss_hold', selector: { boolean: {} } }] }];
Object.assign(LABELS, { photo_source_mode: 'Photo source', photo_album_url: 'Album link', apps: 'Apps (drag to reorder, pencil to edit)', person: 'Person (empty = the logged-in user)', fallback_person: 'Fallback person (no match)', ring_color: 'Avatar ring colour / gradient',
  morning_start: 'Morning from (hour)', afternoon_start: 'Afternoon from', evening_start: 'Evening from', night_start: 'Night from (empty = evening until morning)', greeting_night: 'Night greeting', greeting_morning: 'Morning greeting', greeting_afternoon: 'Afternoon greeting', greeting_evening: 'Evening greeting',
  wallpaper: 'Wallpaper when there are no photos (any CSS background, e.g. a colour or gradient)', photo_source: 'Media folder (empty = the Wallpanel screensaver\'s, e.g. media-source://media_source/local/)', photo_interval: 'Next photo every', photo_order: 'Order', blur: 'Background blur (px)', dim: 'Edge darkening for text readability (0-0.9)', photo_backdrop: 'Show the current photo, blurred, behind the page', bg_freeze: 'Freeze the blurred background while the Home Screen is showing', bg_transparency: 'Background transparency',
  photo_tap: 'Tapping Photos', photo_label: 'Photos label', photo_viewer_nav: 'Viewer: Previous / Next buttons', photo_viewer_swipe: 'Viewer: swipe left / right to change picture', photo_viewer_add: 'Viewer: View Gallery button', photo_gallery_upload: 'Gallery: let people upload new pictures', photo_viewer_pause: 'Pause the screensaver while the viewer is open', show_calendar: 'Show the calendar', calendar_show_weather: 'Forecast per day', calendar_entities: 'Calendars (empty = all)', calendar_layout: 'Calendar layout',
  calendar_columns: 'Days side by side', calendar_rows: 'Rows of days (phones always stack)', calendar_days: 'Days to load', calendar_title: 'Calendar title', calendar_min_height: 'Calendar min height', max_icon: 'Largest app icon', photo_max_aspect: 'Photos widget: widest aspect (w/h)', photo_size: 'Photos tile size', side_sizes: 'Extra tiles\' sizes, in order: S = square, W = wide (e.g. S, S)', side_portrait: 'Tiles that don\'t fit beside the apps', row_units: 'Landscape: units beside the apps (icons shrink to fit)',
  full_height_popups: 'Full-height popups: every popup on this dashboard reaches the top of the screen; swipe down to close',
  popup_edit: 'Edit pencil next to ✕ in popups (admins only): opens the editor of the card the popup belongs to',
  assistant_enabled: 'Assistant on this Home Screen', assistant_button: 'Mic button beside the avatar', assistant_pipeline: 'Assist pipeline', assistant_theme: 'Assistant look',
  assistant_auto_listen: 'Start listening when it opens', assistant_speak: 'Speak the replies', timer_sound: 'Timer alert sound',
  assistant_orb: 'Mic opens a floating orb (tap it for the chat)', assistant_continue: 'Listen again when the assistant asks something', assistant_quiet_volume_entity: 'Volume sensor of the device (optional)', assistant_quiet_volume_below: 'Quiet when the volume is under',
  assistant_quiet_focus_entity: 'Focus / Do Not Disturb sensor (optional)', assistant_quiet_start: 'Quiet hours from', assistant_quiet_end: 'Quiet hours until',
  location_name: 'Weather location name (empty = Home Assistant\'s)', weather_sky_header: 'Weather popup: animated sky header (sunny, partly cloudy, cloudy, rain, snow; night sky after sunset)', swipe_screensaver: 'Swipe down for screensaver (grab bar at the top)', ss_hold: 'Keep the screensaver paused while the Home Screen is showing',
  side_tiles: 'Extra tile options, in order (1st = first extra tile): size, fit, tap opens enlarged view' });
// the Assist pipeline dropdown lists this Home Assistant's pipelines (assist_pipeline/pipeline/list); a removed one stays selectable so nothing is lost
const hvHubSchemaPipes = r => { if (!r || !Array.isArray(r.pipelines)) return HUB_SCHEMA;
  const opts = [{ value: 'preferred', label: 'Preferred (now: ' + ((r.pipelines.find(p => p.id === r.preferred_pipeline) || {}).name || '?') + ')' }].concat(r.pipelines.map(p => ({ value: p.id, label: p.name })));
  const fix = l => l.map(x => x.name === 'assistant_pipeline' ? Object.assign({}, x, { selector: { select: { mode: 'dropdown', options: opts } } }) : x.schema ? Object.assign({}, x, { schema: fix(x.schema) }) : x);
  return fix(HUB_SCHEMA); };
// the Photos section shows the media folder field or the album link field, after the Photo source choice
const hvHubSchemaAlbum = (sch, album) => { const fix = l => l.map(x => x.name === 'photo_source' && album ? { name: 'photo_album_url', selector: { text: { type: 'url' } } } : x.schema ? Object.assign({}, x, { schema: fix(x.schema) }) : x); return fix(sch); };
class HVHubEditor extends HTMLElement {
  setConfig(c) { this._config = c; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  _render() {
    if (!this._hass || !this._config) return;
    const data = Object.assign({}, HVHubCard.defaults, { calendar_show_weather: true, apps: HUB_APPS }, this._config);
    if (!this._form) { const f = this._form = document.createElement('ha-form');
      f.computeLabel = s => LABELS[s.name] || s.name;
      f.computeHelper = s => s.name === 'bg_transparency' ? '0 = solid gradient, 60 = default look, 100 = clear photo. The preview updates while you drag.' : s.name === 'bg_freeze' ? 'On: the background keeps the photo it had when the Home Screen opened (the Photos card still changes); it moves to the current photo only while the page is out of sight (screensaver up, another view, app in the background). Off: it follows the Photos card.' : s.name === 'ss_hold' ? 'On: the screensaver does not start by itself behind the Home Screen (and uses nothing there); swipe the page away to start it, on the photo the Photos card shows. Off: Wallpanel\'s idle timer runs as before.' : s.name === 'blur' ? 'How soft the photo behind the page is. Left at the default it eases to 0 as Background transparency goes from 60 to 100 (a clear, sharp photo); set a value to keep it fixed.' : s.name === 'dim' ? 'Darkens the top and bottom of the page so the text stays readable; also fades out as transparency goes up.' : s.name === 'photo_viewer_add' ? 'The viewer button that opens the gallery (the gallery keeps its own “Add photos” upload button).' : s.name === 'side_sizes' ? hubUnitsNote(this._config) : s.name === 'photo_source' ? 'The photo viewer, the gallery and uploads all use this folder. Empty = the screensaver\'s folder (Media → My media). Uploading needs a media-source:// folder and an administrator.' : s.name === 'apps' ? 'Each app: label, icon, gradient colours and what it does (open a view, Now Playing, Weather, photos, or any tap action).' : undefined;
      { const h1 = f.computeHelper; f.computeHelper = s => s.name === 'assistant_enabled' ? 'Talk to an Assist pipeline with this device\'s microphone (or type). Timers ("set a timer for 15 minutes", "pause / cancel the timer") run right here, full screen.' : s.name === 'assistant_pipeline' ? 'Which assistant answers (Settings → Voice assistants).' : h1(s); }
      { const h3 = f.computeHelper; f.computeHelper = s => s.name === 'assistant_orb' ? 'On: the mic shows only an animated orb near the top (the dashboard stays clear); tap the orb for the chat. Off: the full chat opens.'
        : s.name === 'assistant_continue' ? 'After a reply that ends with a question (or when the assistant keeps the conversation open), the mic opens again for your answer; it stops after about 6 s of silence.'
        : s.name === 'assistant_quiet_volume_entity' ? 'Quiet mode is chosen on each device (Off / On / Auto) with the Quiet button in the assistant\'s chat. Quiet: the reply is not spoken, it shows as text under the orb. Auto uses this sensor when it reports a number (percent or 0-1), otherwise the quiet hours. A sensor belongs to one phone or tablet: set it on the dashboard that device uses.'
        : s.name === 'assistant_quiet_focus_entity' ? 'Auto is also quiet while this is on (e.g. a phone\'s Focus or Do Not Disturb sensor).' : s.name === 'assistant_quiet_start' ? 'Used by Auto when no volume sensor is set or it isn\'t reporting.' : h3(s); }
      { const h2 = f.computeHelper; f.computeHelper = s => s.name === 'photo_album_url' ? hvAlbumStatus(this._albSt, (this._config || {}).photo_album_url) : s.name === 'photo_source_mode' ? 'Media folder: pictures in Home Assistant\'s media (Media → My media). Album link: a shared Google Photos, iCloud or OneDrive album, used for the Photos tile and its viewer (and the screensaver, if its source is set the same way).' : h2(s); }
      { const h0 = f.computeHelper; f.computeHelper = s => s.name === 'theme' ? 'The look of the device pages (the pages with the button tiles) on this dashboard: their tiles, popups and page background. The Home Screen itself always keeps its own look. Night = dark glass (default); Day = white tiles on a light grey page. A Page Grid card can choose its own.' : h0(s); }
      { const l0 = f.computeLabel; f.computeLabel = s => s.name === 'theme' ? 'Device pages theme' : l0(s); }
      f.addEventListener('input', ev => { const p = ev.composedPath(), sl = p.find(n => n.tagName === 'HA-SLIDER'), sel = p.find(n => n.tagName === 'HA-SELECTOR-NUMBER'); // live preview while dragging
        if (!sl || !sel || sel.label !== LABELS.bg_transparency) return; const v = Number(sl.value); if (isNaN(v)) return; this._live = v;
        if (!this._liveRaf) this._liveRaf = requestAnimationFrame(() => { this._liveRaf = 0; const cfg = Object.assign({}, this._config); if (this._live === HVHubCard.defaults.bg_transparency) delete cfg.bg_transparency; else cfg.bg_transparency = this._live; this._config = cfg; fire(this, 'config-changed', { config: cfg }); }); });
      f.addEventListener('value-changed', ev => { ev.stopPropagation(); const v = ev.detail.value, cfg = { type: this._config.type };
        for (const [k, val] of Object.entries(v)) { if (val === undefined || val === '' || (Array.isArray(val) && !val.length && k !== 'apps')) continue;
          if (k !== 'apps' && HVHubCard.defaults[k] === val) continue; if (k === 'calendar_show_weather' && val === true) continue; cfg[k] = val; }
        if (cfg.apps) cfg.apps = cfg.apps.map(x => { const o = {}; for (const [k, val] of Object.entries(x || {})) if (val !== undefined && val !== '' && !(Array.isArray(val) && !val.length)) o[k] = val; return o; });
        for (const k of Object.keys(this._config)) if (!(k in v) && !(k in cfg)) cfg[k] = this._config[k]; // keep keys the form doesn't show (grid_options, ...)
        this._config = cfg; fire(this, 'config-changed', { config: cfg }); });
      this.appendChild(f); this._stackEd(); }
    if (!this._pipesP) this._pipesP = this._hass.callWS({ type: 'assist_pipeline/pipeline/list' }).then(r => { this._pipes = r; this._render(); }).catch(() => { this._pipes = null; });
    const album = data.photo_source_mode === 'album', au = String(data.photo_album_url || '').trim();
    if (album && au && hvAlbumProv(au) && (!this._albSt || this._albSt.url !== au) && this._albQ !== au) { // check the link (debounced while typing)
      this._albQ = au; clearTimeout(this._albT); this._albT = setTimeout(() => hvAlbumLoad(this._hass, au).then(r => { if (this._albQ !== au) return; this._albSt = Object.assign({ url: au }, r); delete this._albSt.ids; this._albQ = null; this._render(); }), 700); }
    this._form.hass = this._hass; this._form.schema = hvHubSchemaAlbum(hvHubSchemaPipes(this._pipes), album); this._form.data = data;
    hvWpHint(this, true); hvSetupEditorBtn(this); // 1.31.0: first-run setup, on demand // the Home Screen's screensaver features (swipe away, hold, Photos) need Wallpanel
    if (this._stack) { this._stack.hass = this._hass; const js = JSON.stringify(this._config.side_cards || []); if (js !== this._lastSide) { this._lastSide = js; this._stack.setConfig({ type: 'vertical-stack', cards: this._config.side_cards || [] }); } }
  }
}
HVHubEditor.prototype._stackEd = async function () { // the side slot's cards: Home Assistant's own card picker + card editors (as in a vertical stack)
  const hd = document.createElement('div');
  hd.innerHTML = '<p style="margin:18px 0 4px;font-weight:600">Extra tiles (beside Photos)</p><p style="margin:0 0 8px;opacity:.75;font-size:.9em">Any cards (Add card picks from all cards, e.g. NotHomeView ones). They sit in the row right of the apps, same height as the app grid; set their sizes (Square / Wide) above under Layout. What doesn\'t fit wraps to a row below.</p>';
  this.appendChild(hd);
  try { const helpers = await window.loadCardHelpers(); helpers.createCardElement({ type: 'vertical-stack', cards: [] }); await customElements.whenDefined('hui-vertical-stack-card');
    const st = this._stack = await customElements.get('hui-vertical-stack-card').getConfigElement(); st.hass = this._hass; if (this._lovelace) st.lovelace = this._lovelace;
    this._lastSide = JSON.stringify(this._config.side_cards || []); st.setConfig({ type: 'vertical-stack', cards: this._config.side_cards || [] });
    st.addEventListener('config-changed', ev => { ev.stopPropagation(); const cards = (ev.detail.config && ev.detail.config.cards) || []; this._lastSide = JSON.stringify(cards);
      const cfg = Object.assign({}, this._config); if (cards.length) cfg.side_cards = cards; else delete cfg.side_cards; this._config = cfg; fire(this, 'config-changed', { config: cfg }); });
    this.appendChild(st);
    const hideTitle = () => { const r = st.shadowRoot; if (!r) return; for (const x of r.querySelectorAll('ha-form, ha-textfield')) { const sc = x.schema; if ((sc && sc.length === 1 && sc[0].name === 'title') || (x.tagName === 'HA-TEXTFIELD' && /title/i.test(x.label || ''))) x.style.display = 'none'; } };
    Promise.resolve(st.updateComplete).then(hideTitle); setTimeout(hideTitle, 400);
  } catch (e) { hd.insertAdjacentHTML('beforeend', '<p>Card editor unavailable: ' + esc(e) + '</p>'); }
};
Object.defineProperty(HVHubEditor.prototype, 'lovelace', { set(l) { this._lovelace = l; if (this._stack) this._stack.lovelace = l; }, configurable: true });
if (!customElements.get('homeview-hub-card-editor')) customElements.define('homeview-hub-card-editor', HVHubEditor);

const CARDS = [
  ['homeview-hub-card', HVHubCard, 'NotHomeView Hub', 'Apple home hub style launch page: greeting, avatar, app icons, a Photos widget with the screensaver photos, blurred photo background and a wide calendar.'],
  ['homeview-chips-card', HVChipsCard, 'NotHomeView Chips', 'A scrollable row of glass pills: light groups (tap toggles), thermostats with temperature, navigation chips.'],
  ['homeview-thermostat-card', HVThermostatCard, 'NotHomeView Thermostat', 'Big set-point with chevrons, mode and current temperature (NotHomeView glass).'],
  ['homeview-grid-card', HVGridCard, 'NotHomeView Page Grid', 'Big NotHomeView tiles in swipeable pages: 3 × 3 in portrait, 3 × 4 in landscape (adjustable), sized to the screen.'],
  ['homeview-page-break', HVPageBreakCard, 'NotHomeView Page Break', 'Inside a NotHomeView Page Grid: the next tile starts a new page.'],
  ['homeview-tv-card', HVTvCard, 'NotHomeView TV', 'TV tile like the Music tile; tap opens a Now Playing-style TV popup with power, apps, TV switcher and remote.'],
  ['homeview-tv-player-card', HVTvPlayerCard, 'NotHomeView TV Player', 'The TV popup on its own: 16:9 picture, transport, volume, power, apps, TV switcher, D-pad.'],
  ['homeview-calendar-card', HVCalendarCard, 'NotHomeView Calendar', 'Upcoming events from your calendars on NotHomeView glass: date blocks, times, locations, optional weather.'],
  ['homeview-entity-card', HVEntityCard, 'NotHomeView Entity', 'Any entity as a NotHomeView tile: icon, name, state or custom sub-label.'],
  ['homeview-light-card', HVLightCard, 'NotHomeView Light', 'Light tile: tap toggles, shows brightness %, hold for more-info.'],
  ['homeview-garage-chooser-card', HVGarageChooserCard, 'NotHomeView Garage Chooser', 'Popup content: live state of two garage doors with buttons to open door 1, door 2 or both.'],
  ['homeview-garage-card', HVGarageCard, 'NotHomeView Garage', 'Cover / garage door: open or close with optional confirmation, or (chooser) a popup to open door 1, door 2 or both.'],
  ['homeview-group-card', HVGroupCard, 'NotHomeView Group', 'Several entities or a group: "N on", tap toggles all or opens a popup.'],
  ['homeview-scene-card', HVSceneCard, 'NotHomeView Scene', 'Scene or script button with optional confirmation.'],
  ['homeview-music-card', HVMusicCard, 'NotHomeView Music', 'Media player tile showing what is playing; tap opens your music popup or more-info.'],
  ['homeview-nav-card', HVNavCard, 'NotHomeView Navigation', 'Navigate to a view, or toggle between two views, keeping URL parameters.'],
  ['homeview-now-playing-card', HVNowPlayingCard, 'NotHomeView Now Playing', 'Apple-style Now Playing panel: blurred artwork, progress, controls, volume and speaker picker. Use as a card or popup.'],
  ['homeview-camera-card', HVCameraCard, 'NotHomeView Camera', 'Live camera tile (glass) with a name/status overlay and optional state buttons; tap for a large or full-screen view.'],
  ['homeview-battery-card', HVBatteryCard, 'NotHomeView Battery', 'Battery level as a rounded glass bar with a big % (green / yellow / red) and a bolt while charging.'],
  ['homeview-person-card', HVPersonCard, 'NotHomeView People', 'Find My style person tile: round avatar, status badge, name and location (zone or street); tap for a map.'],
  ['homeview-screensaver-card', HVScreensaverCard, 'NotHomeView Screensaver Settings', 'Friendly settings form for this dashboard\'s Wallpanel screensaver (photos, timing, clock); Save writes the wallpanel config.'],
  ['homeview-edit-button-card', HVEditButtonCard, 'NotHomeView Edit Button', 'Small glass pencil button fixed in a corner; opens this dashboard in edit mode with kiosk-mode off.'],
];
if (!customElements.get('homeview-card-editor')) customElements.define('homeview-card-editor', HVEditor);
for (const [, cls] of CARDS) hvThemeWrap(cls); // Night / Day theme (1.30.5)
HVHubCard.prototype._hvOwnTheme = true; HVGridCard.prototype._hvOwnTheme = true;
HVHubCard.prototype._hvNight = true; // its "theme" option is the Device pages theme; the Home Screen itself never changes
window.customCards = window.customCards || [];
for (const [tag, cls, name, description] of CARDS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({ type: tag, name, description, preview: true });
}
console.info(`%c HOMEVIEW-CARDS %c ${HV_VERSION} `, 'color:#fff;background:#6e5ad2;font-weight:700;border-radius:4px 0 0 4px', 'color:#6e5ad2;background:#ece8ff;border-radius:0 4px 4px 0');
/* ---------------- House card (1.31.0) ----------------
   A drawn house with corner labels (weather, garage, lights, climate, lock), for the Home Screen's picture tile. No pictures,
   no plugins: labels only for the entities you set; the windows glow when lights are on after dark; the garage door follows
   the cover. In a Home Screen tile with "Sky background" on it sits over the live sky. */
const HOUSE_SVG = (garageOpen, glow, day) => { const w = glow ? '#ffd27a' : day ? '#bcd8f0' : '#3b4a63', wf = glow ? 'url(#hvg)' : w;
  return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet"><defs>
<linearGradient id="hvw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${day ? '#f4efe6' : '#c9c3ba'}"/><stop offset="1" stop-color="${day ? '#ddd5c8' : '#9d978f'}"/></linearGradient>
<linearGradient id="hvr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b5552"/><stop offset="1" stop-color="#3d3836"/></linearGradient>
<radialGradient id="hvg" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fff1c4"/><stop offset="1" stop-color="#ffb648"/></radialGradient>
<linearGradient id="hvd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${day ? '#f7f7f5' : '#d7d5d0'}"/><stop offset="1" stop-color="${day ? '#e2e1dc' : '#aaa8a2'}"/></linearGradient></defs>
<ellipse cx="200" cy="236" rx="190" ry="12" fill="rgba(0,0,0,.18)"/>
<rect x="0" y="226" width="400" height="24" fill="${day ? '#7fae5e' : '#2f4a2c'}"/><path d="M228 250 L262 226 L352 226 L360 250Z" fill="${day ? '#b8b4ad' : '#5d5a55'}"/>
<g><path d="M30 120 L115 52 L200 120Z" fill="url(#hvr)"/><rect x="42" y="118" width="146" height="110" fill="url(#hvw)"/>
<rect x="56" y="132" width="34" height="30" rx="2" fill="${wf}"/><rect x="140" y="132" width="34" height="30" rx="2" fill="${wf}"/>
<rect x="56" y="180" width="34" height="30" rx="2" fill="${wf}"/><rect x="100" y="172" width="30" height="56" rx="2" fill="#6b4a34"/><circle cx="124" cy="202" r="2" fill="#e8c27a"/>
<rect x="140" y="180" width="34" height="30" rx="2" fill="${wf}"/><path d="M96 92 L115 76 L134 92 L134 108 L96 108Z" fill="${wf}" opacity=".9"/>
<rect x="150" y="62" width="16" height="34" fill="#4a4442"/></g>
<g><path d="M188 150 L274 104 L372 150Z" fill="url(#hvr)"/><rect x="198" y="148" width="164" height="80" fill="url(#hvw)"/>
<rect x="214" y="164" width="132" height="64" rx="3" fill="${garageOpen ? '#1d1f24' : 'url(#hvd)'}"/>
${garageOpen ? '<rect x="214" y="164" width="132" height="12" rx="2" fill="url(#hvd)"/>' : [176, 188, 200, 212].map(y => `<rect x="214" y="${y}" width="132" height="1.4" fill="rgba(0,0,0,.12)"/>`).join('')}</g>
<g><path d="M14 228 L34 150 L54 228Z" fill="${day ? '#3f7a3d' : '#1f3a22'}"/><path d="M19 196 L34 128 L49 196Z" fill="${day ? '#4d8c49' : '#27462a'}"/><rect x="31" y="226" width="6" height="8" fill="#5a3f2b"/></g></svg>`; };
const HOUSE_CSS = `:host{display:block;height:100%} ha-card{position:relative;height:100%;overflow:hidden;border-radius:var(--ha-card-border-radius,22px);background:none;border:none;box-shadow:none;container-type:size}
#hroot{position:absolute;inset:0} .h{position:absolute;left:24%;right:6%;bottom:4%;top:34%;display:flex;align-items:flex-end;justify-content:center} .h svg{width:100%;height:100%;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
.l{position:absolute;font-family:${FONT};color:var(--hl,#fff);text-shadow:0 1px 4px rgba(0,0,0,.45);line-height:1.15;cursor:pointer;font-size:max(8px,4cqw);white-space:nowrap}
.l b{display:block;font-size:1.32em;font-weight:700} .l i{display:block;font-style:normal;opacity:.8} .l small{display:block;font-size:.8em;letter-spacing:.08em;text-transform:uppercase;opacity:.85}
:host([day]) .l{--hl:#16202c;text-shadow:0 1px 3px rgba(255,255,255,.6)} .tl{left:5%;top:5%} .tr{right:5%;top:5%;text-align:right} .ml{left:5%;top:36%} .bl{left:5%;bottom:5%} .br{right:5%;top:27%;text-align:right}`;
class HVHouseCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getStubConfig(hass) { const k = Object.keys((hass && hass.states) || {}); return { weather: k.find(x => x.startsWith('weather.')) || '', garage: k.find(x => x.startsWith('cover.')) || '' }; }
  setConfig(c) { this._config = Object.assign({}, c || {}); this._sig = null; this._paint(); }
  set hass(h) { this._hass = h; this._paint(); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 4 }; }
  _paint() { const h = this._hass, c = this._config; if (!h || !c) return; const S = h.states, st = id => id && S[id], t = (id, s) => h.formatEntityState ? h.formatEntityState(S[id], s) : s;
    const day = (S['sun.sun'] || {}).state !== 'below_horizon', lights = (c.lights || []).filter(id => st(id)), on = lights.filter(id => S[id].state === 'on').length;
    const gar = st(c.garage), wx = st(c.weather), cl = st(c.climate), lk = st(c.lock), U = (h.config && h.config.unit_system && h.config.unit_system.temperature) || '°';
    const lab = [];
    if (wx) lab.push(['tl', 'Weather', wx.attributes.temperature != null ? `${Math.round(wx.attributes.temperature)}${U}` : '', t(c.weather, wx.state), c.weather]);
    if (gar) lab.push(['tr', 'Garage', t(c.garage, gar.state), gar.attributes.friendly_name || '', c.garage]);
    if (lights.length) lab.push(['ml', 'Home', `${on} light${on === 1 ? '' : 's'} on`, 'Lights', null, c.lights_path]);
    if (cl) lab.push(['bl', 'Climate', cl.attributes.current_temperature != null ? `${cl.attributes.current_temperature}${U}` : t(c.climate, cl.state), cl.attributes.hvac_action ? t(c.climate, cl.attributes.hvac_action) : t(c.climate, cl.state), c.climate]);
    if (lk) lab.push(['br', lk.attributes.friendly_name || 'Lock', t(c.lock, lk.state), '', c.lock]);
    const sig = JSON.stringify([day, gar && gar.state, on > 0 && !day, lab]); if (sig === this._sig) return; this._sig = sig;
    this.toggleAttribute('day', day);
    this.shadowRoot.innerHTML = `<style>${HOUSE_CSS}</style><ha-card><div id="hroot"><div class="h">${HOUSE_SVG(gar && gar.state !== 'closed', on > 0 && !day, day)}</div>
      ${lab.map(([p, a, b, i], k) => `<div class="l ${p}" data-k="${k}"><small>${esc(a)}</small><b>${esc(b)}</b>${i ? `<i>${esc(i)}</i>` : ''}</div>`).join('')}</div></ha-card>`;
    this.shadowRoot.querySelectorAll('.l').forEach(n => n.addEventListener('click', e => { e.stopPropagation(); const L = lab[Number(n.dataset.k)];
      if (L[5]) hvNavigate(L[5]); else if (L[4]) fire(this, 'hass-more-info', { entityId: L[4] }); })); }
}
if (!customElements.get('homeview-house-card')) customElements.define('homeview-house-card', HVHouseCard);
(window.customCards = window.customCards || []).push({ type: 'homeview-house-card', name: 'NotHomeView House', description: 'A drawn house with weather, garage, lights, climate and lock labels (for the Home Screen picture tile).', preview: false });
// full_width: true on the Home Screen / page grid card -> its sections view uses the whole window (one full-width column),
// the same as the example dashboard's style template does; without the template or button-card. (1.31.0)
function hvFullWidth(el) { let n = el; for (let i = 0; i < 60 && n; i++) { if (n.tagName === 'HUI-SECTIONS-VIEW') { if (n.style.getPropertyValue('--column-max-width') !== '100vw') n.style.setProperty('--column-max-width', '100vw'); return true; }
  n = n.parentNode || n.host || null; if (n && n.nodeType === 11) n = n.host; } return false; }
for (const t of ['homeview-hub-card', 'homeview-grid-card']) { const C = customElements.get(t); if (!C || C.prototype.__hvFw) continue; C.prototype.__hvFw = true; const sc = C.prototype.setConfig;
  C.prototype.setConfig = function (c) { const r = sc.apply(this, arguments); if (c && c.full_width) { let k = 0; const go = () => { if (!(this.isConnected && hvFullWidth(this)) && ++k < 12) setTimeout(go, 400); }; setTimeout(go, 0); } return r; }; }
// generated pages (full_width grids): the core clock tile follows the page's Night / Day look, like the NotHomeView tiles next to it
function hvClockTint(grid) { const sr = grid.shadowRoot; if (!sr) return; const clocks = [], tiles = [];
  const walk = r => { for (const e of r.querySelectorAll('*')) { if (e.tagName === 'HUI-CLOCK-CARD') clocks.push(e); else { if (/^HOMEVIEW-/.test(e.tagName)) tiles.push(e); if (e.shadowRoot) walk(e.shadowRoot); } } }; walk(sr);
  if (!clocks.length) return; const day = tiles.some(t => t.hasAttribute('day') || t.hasAttribute('hv-day'));
  const V = day ? { '--ha-card-background': '#ffffff', '--card-background-color': '#ffffff', '--ha-card-border-color': 'rgba(0,0,0,.05)', '--primary-text-color': '#14263b', '--secondary-text-color': '#4b6079' }
    : { '--ha-card-background': 'linear-gradient(150deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.07) 100%)', '--card-background-color': '#262827', '--ha-card-border-color': 'rgba(255,255,255,.25)', '--primary-text-color': '#ffffff', '--secondary-text-color': 'rgba(255,255,255,.66)' };
  const t0 = tiles.find(t => t.shadowRoot && t.shadowRoot.querySelector('ha-card')); if (t0) V['--ha-card-border-radius'] = getComputedStyle(t0.shadowRoot.querySelector('ha-card')).borderRadius;
  for (const c of clocks) for (const k in V) if (c.style.getPropertyValue(k) !== V[k]) c.style.setProperty(k, V[k]); }
{ const C = customElements.get('homeview-grid-card'), d = C && Object.getOwnPropertyDescriptor(C.prototype, 'hass');
  if (d && d.set && !C.prototype.__hvCt) { C.prototype.__hvCt = true; Object.defineProperty(C.prototype, 'hass', { configurable: true, get: d.get, set(h) { d.set.call(this, h);
    if (this._config && this._config.full_width) { const t = Date.now(); if (!(this.__ctT > t - 1500)) { this.__ctT = t; setTimeout(() => hvClockTint(this), 300); } } } }); } }
/* ---------------- first-run setup: "Add the NotHomeView dashboard?" ----------------
   Once NotHomeView is installed, an admin opening a dashboard is asked (once) whether to add a ready-made "NotHomeView"
   dashboard. Add: a new storage dashboard is created and filled with a Home Screen plus app pages, built from this Home
   Assistant's own entities (states + entity / device / area registries; hidden, disabled, unavailable and config/diagnostic
   entities are skipped; pages with nothing on them are left out). Uses NotHomeView cards and core cards only, so
   browser_mod, Wallpanel, card-mod, button-card ... are not needed. No: remembered (this browser + the user's profile).
   Never shown to non-admins, on a screen where a kiosk mode is active right now, or when a NotHomeView dashboard already exists
   (one made by this setup, or one using the Home Screen card). Admins also get a bell notification (persistent_notification
   'nothomeview_setup') whose link (?nothomeview_setup=1) opens the dialog; it is dismissed after Add or No.
   Existing users (a dashboard with the Home Screen card already there) get only that notification, once, offering a fresh
   NotHomeView dashboard as an extra dashboard; no dialog pops up for them (1.31.2).
   Bring it back: the "Create NotHomeView dashboard" button in the Home Screen card editor, or NotHomeView.setup() in the
   browser console. NotHomeView.dryRun() returns the generated dashboard config without saving anything. */
const HV_SETUP_KEY = 'nothomeview_setup', HV_SETUP_LS = 'nothomeview-setup';
const HV_SETUP_BG = 'center / cover no-repeat fixed #0d0f0e'; // pages: same as the example dashboard
// Home Screen wallpaper until photos are added (a soft dusk gradient; no picture files needed)
const HV_SETUP_WALL = 'radial-gradient(60% 50% at 15% 18%, #d09a6a 0%, rgba(208,154,106,0) 70%), radial-gradient(55% 50% at 85% 25%, #7f97c6 0%, rgba(127,151,198,0) 70%), radial-gradient(70% 60% at 55% 95%, #6e4a3a 0%, rgba(110,74,58,0) 70%), linear-gradient(160deg, #464a63 0%, #2b2633 100%)';
const HV_SETUP_APPS = { // page -> look of its Home Screen app icon
  lights: ['Lights', 'mdi:lightbulb-group', '#ffd36b', '#ff9f0a'], climate: ['Climate', 'mdi:thermostat', '#ffb37a', '#ff6a3d'],
  security: ['Security', 'mdi:shield-home', '#5b8cff', '#2b3fd6'], media: ['Media', 'mdi:speaker', '#ff6b81', '#f5163d'],
  garage: ['Garage', 'mdi:garage-variant', '#9aa7b8', '#4d5a6b'],
  calendar: ['Calendar', 'mdi:calendar', '#ff8a80', '#e53935'], rooms: ['Rooms', 'mdi:sofa-outline', '#c5a3ff', '#7c4dff'] };
const hvSlug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
// pure: data = { states, entities, devices, areas } -> { config, summary }. url = the dashboard's url_path.
function hvSetupBuild(data, url) {
  const st = data.states || {}, P = p => `/${url}/${p}`;
  const reg = new Map((data.entities || []).map(e => [e.entity_id, e])), dev = new Map((data.devices || []).map(x => [x.id, x]));
  const areas = new Map((data.areas || []).map(a => [a.area_id || a.id, a]));
  const ok = id => { const s = st[id]; if (!s || s.state === 'unavailable') return false; const r = reg.get(id);
    if (r && (r.hidden_by || r.disabled_by || r.hidden === true || r.entity_category)) return false; return !(s.attributes && s.attributes.hidden === true); };
  const areaOf = id => { const r = reg.get(id); if (!r) return null; const d = r.device_id && dev.get(r.device_id); const a = r.area_id || (d && d.area_id) || null; return a && areas.has(a) ? a : null; };
  const nm = id => { const a = (st[id] && st[id].attributes) || {}; return String(a.friendly_name || id.split('.')[1].replace(/_/g, ' ')); };
  const aName = a => (areas.get(a) || {}).name || '';
  const all = Object.keys(st).filter(ok).sort((x, y) => (aName(areaOf(x)) || '\uffff').localeCompare(aName(areaOf(y)) || '\uffff') || nm(x).localeCompare(nm(y)));
  const dom = (d, f) => all.filter(i => i.startsWith(d + '.') && (!f || f(st[i].attributes || {}, i)));
  const dc = a => a.device_class || '';
  // same card set-up as the example dashboard (examples/homeview-example-sections.yaml): 3x2 tiles, 6x4 heroes, day_light on
  const G = (c, cols, rows) => Object.assign(c, { day_light: true, grid_options: { columns: cols || 3, rows: rows || 2 } });
  const ICON = { temperature: 'mdi:thermometer', humidity: 'mdi:water-percent', lock: 'mdi:lock', alarm_control_panel: 'mdi:shield-home', switch: 'mdi:power-socket', fan: 'mdi:fan', vacuum: 'mdi:robot-vacuum', humidifier: 'mdi:air-humidifier', water_heater: 'mdi:water-boiler', valve: 'mdi:valve',
    door: 'mdi:door', garage_door: 'mdi:garage', window: 'mdi:window-closed-variant', opening: 'mdi:door', motion: 'mdi:motion-sensor', occupancy: 'mdi:home-account', presence: 'mdi:home-account', smoke: 'mdi:smoke-detector',
    gas: 'mdi:gas-cylinder', carbon_monoxide: 'mdi:molecule-co', moisture: 'mdi:water-alert', tamper: 'mdi:shield-alert', safety: 'mdi:shield-alert', vibration: 'mdi:vibrate', blind: 'mdi:blinds', shade: 'mdi:roller-shade',
    curtain: 'mdi:curtains', shutter: 'mdi:window-shutter', awning: 'mdi:awning-outline', cover: 'mdi:window-shutter' };
  const icon = id => { const a = st[id].attributes || {}, d = id.split('.')[0]; return a.icon || ICON[dc(a)] || ICON[d] || undefined; };
  const roomOf = id => aName(areaOf(id));
  const tile = (id, hero) => { const d = id.split('.')[0], a = st[id].attributes || {}, name = nm(id), room = roomOf(id);
    if (d === 'light') return G(Object.assign({ type: 'custom:homeview-light-card', entity: id, name, show_state: true }, room && room !== name ? { room } : {}));
    if (d === 'climate') return G({ type: 'custom:homeview-thermostat-card', entity: id, name, step: Number(a.target_temp_step) || 0.5 }, hero ? 6 : 3, hero ? 4 : 2);
    if (d === 'cover' && /garage|gate/.test(dc(a))) return G({ type: 'custom:homeview-garage-card', entity: id, name, confirm: true });
    if (d === 'camera') return G({ type: 'custom:homeview-camera-card', entity: id, name, size: '2x6' }, 6, 2);
    if (d === 'media_player') return dc(a) === 'tv' ? G({ type: 'custom:homeview-tv-card', entity: id, name }) : G({ type: 'custom:homeview-music-card', entity: id, name, show_artist: true, np_show_extra: false });
    if (d === 'scene' || d === 'script') return G({ type: 'custom:homeview-scene-card', entity: id, name, icon: a.icon || (d === 'scene' ? 'mdi:palette' : 'mdi:script-text') });
    if (d === 'person') return G({ type: 'custom:homeview-person-card', entity: id });
    const c = { type: 'custom:homeview-entity-card', entity: id, name }; if (icon(id)) c.icon = icon(id); if (d === 'sensor') c.active = 'never'; return G(c); };
  const clock = () => G({ type: 'clock', clock_style: 'analog', clock_size: 'small', show_seconds: true, seconds_motion: 'continuous', ticks: 'minute', face_style: 'numbers_upright', border: false });
  const SEC_BS = ['door', 'window', 'garage_door', 'opening', 'motion', 'occupancy', 'presence', 'smoke', 'gas', 'carbon_monoxide', 'moisture', 'tamper', 'safety', 'lock', 'vibration'];
  const lights = dom('light'), climate = dom('climate'), covers = dom('cover'), locks = dom('lock'), cams = dom('camera'), alarms = dom('alarm_control_panel');
  const players = dom('media_player'), scenes = dom('scene'), people = dom('person'), cals = dom('calendar');
  const sensors = dom('binary_sensor', a => SEC_BS.includes(dc(a))).slice(0, 24);
  const weather = (dom('weather').find(i => /forecast_home|^weather\.home$/.test(i)) || dom('weather')[0]) || '';
  const garage = covers.filter(i => /garage|gate/.test(dc(st[i].attributes || {})));
  const music = players.filter(i => dc(st[i].attributes || {}) !== 'tv'), player = music[0] || players[0];
  const ROOM_D = /^(light|switch|fan|climate|cover|lock|media_player|camera|humidifier|vacuum|valve|water_heater)\./;
  const rooms = []; for (const [aid, a] of areas) { const ids = all.filter(i => ROOM_D.test(i) && areaOf(i) === aid); if (ids.length) rooms.push({ aid, name: a.name || aid, icon: a.icon || 'mdi:sofa-outline', ids, path: 'room-' + hvSlug(aid) }); }
  rooms.sort((x, y) => x.name.localeCompare(y.name));
  const roomTile = r => { const L = r.ids.filter(i => i.startsWith('light.'));
    return L.length ? G({ type: 'custom:homeview-group-card', name: r.name, icon: r.icon, entities: L, label: '{count} lights on', tap_action: { action: 'navigate', navigation_path: P(r.path) } })
      : G({ type: 'custom:homeview-nav-card', name: r.name, icon: r.icon, navigation_path: P(r.path) }); };
  // pages that have something on them
  const pages = [];
  if (lights.length) pages.push({ key: 'lights', cards: lights.slice(0, 60).map(i => tile(i)) });
  const heroC = [...climate.filter(i => /heating|cooling/.test((st[i].attributes || {}).hvac_action || '')), ...climate.filter(i => !/heating|cooling/.test((st[i].attributes || {}).hvac_action || ''))]; // a working thermostat first
  const airs = [...dom('fan'), ...dom('humidifier'), ...dom('sensor', a => /^(temperature|humidity)$/.test(dc(a)))].slice(0, 12); // climate page: thermostats, then fans / humidifiers / temperature & humidity
  if (climate.length || airs.length) pages.push({ key: 'climate', cards: [...heroC.map((i, k) => tile(i, k === 0 || climate.length <= 2)), ...airs.map(i => tile(i))] });
  if (alarms.length || cams.length || sensors.length || locks.length) pages.push({ key: 'security', cards: [...cams.slice(0, 1), ...alarms, ...locks, ...cams.slice(1), ...sensors].map(i => tile(i)) });
  if (players.length) pages.push({ key: 'media', cards: [...music, ...players.filter(i => !music.includes(i))].slice(0, 24).map(i => tile(i)) });
  if (covers.length) pages.push({ key: 'garage', cards: covers.map(i => tile(i)) });
  if (cals.length) pages.push({ key: 'calendar', cards: [G({ type: 'custom:homeview-calendar-card', entities: cals.slice(0, 8), days: 7, max_events: 5, show_weather: !!weather, weather_entity: weather || undefined }, 12, 8)] });
  if (rooms.length) pages.push({ key: 'rooms', cards: rooms.map(roomTile) });
  const has = k => pages.some(p => p.key === k);
  const chips = here => { const c = [{ name: 'Hub', icon: 'mdi:apps', tap_action: { action: 'navigate', navigation_path: P('main') } }];
    if (here !== 'home') c.push({ name: 'Home', icon: 'mdi:home-outline', tap_action: { action: 'navigate', navigation_path: P('home') } });
    if (rooms.length) c.push({ name: 'Rooms', icon: 'mdi:sofa-outline', room_picker: true, picker_title: 'Rooms', rooms: rooms.map(r => ({ name: r.name, icon: r.icon, navigation_path: P(r.path) })) });
    for (const k of ['climate', 'calendar', 'security']) if (has(k) && k !== here) c.push({ name: HV_SETUP_APPS[k][0], icon: HV_SETUP_APPS[k][1], tap_action: { action: 'navigate', navigation_path: P(k) } });
    if (lights.length) { const on = lights.filter(i => st[i].state === 'on').length; // "Lights on" count, like the example's count chip (no helper sensor needed)
      c.push({ name: 'Lights on', icon: 'mdi:lightbulb-group', count_entities: lights.slice(0, 60), tap_action: { action: 'navigate', navigation_path: P('lights') } }); }
    for (const i of [...lights.filter(i => st[i].state === 'on').slice(0, 2), ...climate.slice(0, 2)]) c.push({ entity: i, name: nm(i) });
    return { type: 'custom:homeview-chips-card', day_light: true, chips: c, grid_options: { columns: 'full', rows: 'auto' } }; };
  const TH = (data.themes || []).includes('HomeView Glass') ? { theme: 'HomeView Glass' } : {}; // the README's theme, when it is installed
  const view = (path, title, icon, cards) => Object.assign({}, TH, { type: 'sections', max_columns: 1, dense_section_placement: true, title, path, icon, subview: true, back_path: P('main'), background: HV_SETUP_BG,
    sections: [{ type: 'grid', cards: [chips(path), { type: 'custom:homeview-grid-card', full_width: true, portrait_shape: 'balanced', portrait_rows: 5, auto_rows: true, swipe_back: true, grid_options: { columns: 'full', rows: 'auto' }, cards }] }] });
  // Home page, laid out like the example: thermostat hero, clock, garage, lights, Home, music, scenes, calendar, tv, cameras, people, rooms
  const lit = [...lights.filter(i => st[i].state === 'on'), ...lights.filter(i => st[i].state !== 'on')]; // lights that are on first
  const home = [...heroC.slice(0, 1).map(i => tile(i, true)), clock(), ...garage.slice(0, 1).map(i => tile(i)), ...lit.slice(0, 2).map(i => tile(i)),
    ...(rooms.length ? [G({ type: 'custom:homeview-nav-card', name: 'Rooms', icon: 'mdi:sofa-outline', navigation_path: P('rooms') })] : []),
    ...(player ? [tile(player)] : []), ...scenes.slice(0, 2).map(i => tile(i)),
    ...(cals.length ? [G({ type: 'custom:homeview-calendar-card', entities: cals.slice(0, 4), days: 7, max_events: 5, show_weather: !!weather, weather_entity: weather || undefined }, 6, 4)] : []),
    ...players.filter(i => dc(st[i].attributes || {}) === 'tv').slice(0, 1).map(i => tile(i)), ...cams.slice(0, 1).map(i => tile(i)), ...people.slice(0, 3).map(i => tile(i)),
    ...locks.slice(0, 2).map(i => tile(i)), ...rooms.slice(0, 4).map(roomTile),
    ...(has('climate') ? [G({ type: 'custom:homeview-nav-card', name: 'Climate', icon: 'mdi:thermostat', navigation_path: P('climate') })] : [])];
  const app = k => { if (k === 'weather') return weather ? { name: 'Weather', icon: 'mdi:weather-partly-cloudy', color_from: '#5ec8ff', color_to: '#1a73e8', kind: 'weather', weather_entity: weather } : null;
    if (!has(k)) return null; const [name, icon, a, b] = HV_SETUP_APPS[k];
    return k === 'media' ? { name: 'Music', icon: 'mdi:music-note', color_from: a, color_to: b, kind: 'now_playing', entity: player, entities: players.filter(i => i !== player).slice(0, 5) }
      : { name, icon, color_from: a, color_to: b, kind: 'navigate', navigation_path: k }; };
  const apps = [{ name: 'Home', icon: 'hv:home', color_from: '#ffffff', color_to: '#ededf2', kind: 'navigate', navigation_path: 'home' }];
  for (const k of ['security', 'media', 'weather', 'lights', 'climate', 'garage', 'calendar', 'rooms']) { if (apps.length >= 4) break; const a = app(k); if (a) apps.push(a); }
  // Home Screen, laid out like the NotHomeView home screen: wallpaper, greeting, apps, photos, now playing, house tile, calendar
  const hub = { type: 'custom:homeview-hub-card', full_width: true, theme: 'auto', apps, wallpaper: HV_SETUP_WALL, bg_transparency: 80, photo_size: 'square', calendar_rows: '2', grid_options: { columns: 'full', rows: 'auto' } };
  if (weather) hub.weather_entity = weather; if (people.length) hub.fallback_person = people[0];
  if (cals.length) hub.calendar_entities = cals.slice(0, 4); else hub.show_calendar = false;
  const house = { type: 'custom:homeview-house-card' }; if (weather) house.weather = weather; if (garage[0]) house.garage = garage[0]; if (heroC[0]) house.climate = heroC[0];
  if (lights.length) { house.lights = lights.slice(0, 60); house.lights_path = P('lights'); } if (locks[0]) house.lock = locks[0];
  const houseTile = Object.assign({ size: 'square', fit: 'contain', sky: true }, weather ? { sky_entity: weather } : {});
  hub.side_cards = player ? [{ type: 'custom:homeview-now-playing-card', entity: player, entities: players.filter(i => i !== player).slice(0, 5), height: '100%' }, house] : [house];
  hub.side_tiles = player ? [{ size: 'square' }, houseTile] : [houseTile]; hub.side_sizes = player ? 'S, S' : 'S';
  const views = [{ type: 'sections', max_columns: 1, title: 'Home Screen', path: 'main', icon: 'mdi:apps',
      sections: [{ type: 'grid', cards: [hub, { type: 'custom:homeview-edit-button-card', position: 'top-right', admin_only: true, grid_options: { columns: 'full', rows: 'auto' } }] }] },
    Object.assign(view('home', 'Home', 'mdi:home-outline', home), { subview: false })];
  for (const p of pages) { const [name, icon] = HV_SETUP_APPS[p.key]; views.push(view(p.key, name, icon, p.cards)); }
  const ORD = ['climate', 'light', 'media_player', 'cover', 'fan', 'switch', 'lock', 'camera'], ord = i => { const k = ORD.indexOf(i.split('.')[0]); return k < 0 ? 99 : k; };
  for (const r of rooms) { const ids = r.ids.slice().sort((x, y) => ord(x) - ord(y)).slice(0, 48); views.push(view(r.path, r.name, r.icon, ids.map(i => tile(i, ids[0] === i && i.startsWith('climate.'))))); }
  const n = views.reduce((s, v) => s + ((v.sections[0].cards[1] || {}).cards || []).length, 0);
  return { config: { title: 'NotHomeView', views }, summary: { pages: views.length, buttons: n, rooms: rooms.length, weather: !!weather, calendars: cals.length, people: people.length } };
}
const hvSetupData = async hass => { const ws = async type => { try { return await hass.callWS({ type }); } catch (e) { return null; } };
  const [e, d, a] = await Promise.all([ws('config/entity_registry/list'), ws('config/device_registry/list'), ws('config/area_registry/list')]);
  return { themes: Object.keys((hass.themes && hass.themes.themes) || {}), states: hass.states, entities: e || Object.values(hass.entities || {}), devices: d || Object.values(hass.devices || {}), areas: a || Object.values(hass.areas || {}) }; };
// a NotHomeView dashboard is already there: one this setup made (nothome-view, nothome-view-2 ...) or one using the Home Screen card (1.31.1)
// returns its url_path ('lovelace' for the default dashboard), false when there is none, null when the list can't be read (1.31.2)
async function hvSetupHasDash(hass) {
  let list = []; try { list = await hass.callWS({ type: 'lovelace/dashboards/list' }); } catch (e) { return null; } // can't tell: don't ask
  const own = list.find(d => /^nothome-view(-\d+)?$/.test(d.url_path || '')); if (own) return own.url_path;
  for (const d of [{ url_path: null, mode: 'storage' }, ...list].slice(0, 30)) { if (d.mode && d.mode !== 'storage') continue;
    try { const m = { type: 'lovelace/config' }; if (d.url_path) m.url_path = d.url_path; const c = await hass.callWS(m);
      if (/custom:homeview-hub-card/.test(JSON.stringify(c))) return d.url_path || 'lovelace'; } catch (e) { /* empty / auto-generated */ } }
  return false; }
// wall tablets / kiosk screens: only when a kiosk mode is actually ACTIVE on this screen right now (1.31.1). Having kiosk-mode or
// Wallpanel installed, or a hidden sidebar, does not count.
const hvHeaderHidden = () => { const r = hvFindRootDeep(), sr = r && r.shadowRoot; if (!sr) return false;
  const h = sr.querySelector('.header, app-header, ha-top-app-bar-fixed, .toolbar'); if (!h) return false; const b = h.getBoundingClientRect(), cs = getComputedStyle(h);
  return cs.display === 'none' || cs.visibility === 'hidden' || b.height < 4 || b.bottom <= 0; };
const hvSetupKiosk = hass => { const q = location.search || '';
  if (/[?&](kiosk|hide_header|hide_sidebar|wp_enabled)\b/.test(q) || window.fully || /Fully|WallPanel/i.test(navigator.userAgent)) return true; // kiosk browsers / URL switches
  try { const r = hvFindRootDeep(), c = (r && r.lovelace && r.lovelace.config) || {}, k = c.kiosk_mode, wp = c.wallpanel;
    if (k && (k.kiosk || k.hide_header) && hvHeaderHidden()) return true;                                          // kiosk-mode hiding the header now
    if (wp && wp.enabled === true && (wp.hide_toolbar || wp.hide_sidebar) && hvHeaderHidden()) return true;          // Wallpanel hiding the toolbar now
  } catch (e) {}
  return false; };
const hvFindRootDeep = () => { const w = (r, d) => { if (!r || d > 9) return null; for (const n of r.querySelectorAll('*')) { if (n.tagName === 'HUI-ROOT') return n; if (n.shadowRoot) { const x = w(n.shadowRoot, d + 1); if (x) return x; } } return null; };
  return w(document, 0); };
const HV_SETUP_ANSWERS = ['dismissed', 'created'];
const hvSetupFlag = { read: async hass => { try { const r = await hass.callWS({ type: 'frontend/get_user_data', key: HV_SETUP_KEY }); return (r && r.value) || {}; } catch (e) { return {}; } },
  get: async hass => { try { const l = localStorage.getItem(HV_SETUP_LS); if (HV_SETUP_ANSWERS.includes(l)) return l; } catch (e) {}
    const v = await hvSetupFlag.read(hass); return HV_SETUP_ANSWERS.includes(v.state) ? v.state : ''; },
  set: async (hass, state, extra) => { if (HV_SETUP_ANSWERS.includes(state)) try { localStorage.setItem(HV_SETUP_LS, state); } catch (e) {}
    const v = Object.assign(await hvSetupFlag.read(hass), extra || {}); if (state) v.state = state; v.at = new Date().toISOString();
    try { await hass.callWS({ type: 'frontend/set_user_data', key: HV_SETUP_KEY, value: v }); } catch (e) {} } };
// the bell notification (persistent_notification, id nothomeview_setup): created once, dismissed after Add or No (1.31.1)
const HV_SETUP_NOTE = 'nothomeview_setup', HV_SETUP_Q = 'nothomeview_setup';
// existing: url_path of the NotHomeView dashboard that is already there (1.31.2: they get this notification too, worded for them,
// but no dialog). The link opens a dashboard that loads NotHomeView: that one, or the dashboard open now (a fresh page load of
// /lovelace/0 can land on Home Assistant's own Home panel, which does not load dashboard resources)
const hvSetupLinkUrl = (hass, existing) => { let seg = existing;
  if (!seg) { const c = (location.pathname || '').split('/')[1], pn = c && hass.panels && hass.panels[c]; if (pn && pn.component_name === 'lovelace') seg = c; }
  return `/${encodeURI(seg || 'lovelace')}/0?${HV_SETUP_Q}=1`; };
const hvSetupNotify = async (hass, existing) => { const link = hvSetupLinkUrl(hass, existing); try { await hass.callService('persistent_notification', 'create', { notification_id: HV_SETUP_NOTE,
  title: existing ? 'Build a fresh NotHomeView dashboard?' : 'NotHomeView is installed',
  message: (existing
    ? 'Want a fresh **NotHomeView** dashboard built from your devices? It\'s added as a new dashboard; your current dashboards aren\'t changed.\n\n'
      + `[**Build a new NotHomeView dashboard**](${link}) (opens the setup dialog; nothing changes until you press Add).\n\n`
    : 'Would you like a ready-made **NotHomeView** dashboard, built from your own lights, climate, cameras and rooms?\n\n'
      + `[**Add the NotHomeView dashboard**](${link}) (opens the setup dialog; nothing changes until you press Add).\n\n`)
    + 'You can also do it later: edit a NotHomeView Home Screen card and press **Create NotHomeView dashboard**, or run `NotHomeView.setup()` in the browser console.' });
  await hvSetupFlag.set(hass, '', { notified: new Date().toISOString() }); } catch (e) {} };
const hvSetupUnnotify = hass => { try { hass.callService('persistent_notification', 'dismiss', { notification_id: HV_SETUP_NOTE }); } catch (e) {} };
async function hvSetupCreate(hass, onStep) {
  const list = await hass.callWS({ type: 'lovelace/dashboards/list' }).catch(() => []);
  // Home Assistant needs a hyphen in a dashboard url
  let url = 'nothome-view', n = 2; const used = new Set((list || []).map(d => d.url_path)); while (used.has(url)) url = `nothome-view-${n++}`;
  if (onStep) onStep('Reading your devices and rooms…'); const { config, summary } = hvSetupBuild(await hvSetupData(hass), url);
  if (onStep) onStep('Creating the dashboard…');
  await hass.callWS({ type: 'lovelace/dashboards/create', url_path: url, title: 'NotHomeView', icon: 'mdi:home-variant', show_in_sidebar: true, require_admin: false, mode: 'storage' });
  if (onStep) onStep('Adding pages…'); await hass.callWS({ type: 'lovelace/config/save', url_path: url, config });
  return { url, summary }; }
const SETUP_CSS = `:host{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;font-family:${FONT};-webkit-tap-highlight-color:transparent;
 --fg:#fff;--fg2:rgba(235,235,245,.66);--card:linear-gradient(150deg,rgba(66,60,120,.62) 0%,rgba(26,26,58,.74) 100%);--bd:rgba(255,255,255,.22);--btn:rgba(255,255,255,.14);--sh:0 30px 80px rgba(0,0,30,.5)}
:host([day]){--fg:#1c1c1e;--fg2:rgba(60,60,67,.7);--card:linear-gradient(150deg,rgba(255,255,255,.88) 0%,rgba(236,242,255,.78) 100%);--bd:rgba(255,255,255,.7);--btn:rgba(120,120,128,.14);--sh:0 30px 80px rgba(40,60,120,.28)}
.scr{position:absolute;inset:0;background:rgba(6,8,24,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .25s ease} :host(.in) .scr{opacity:1}
.cd{position:relative;box-sizing:border-box;width:min(440px,calc(100vw - 32px));padding:30px 26px 22px;border-radius:30px;color:var(--fg);text-align:center;background:var(--card);border:1px solid var(--bd);
 backdrop-filter:blur(34px) saturate(170%);-webkit-backdrop-filter:blur(34px) saturate(170%);box-shadow:var(--sh);transform:translateY(14px) scale(.97);opacity:0;transition:transform .35s cubic-bezier(.2,.9,.3,1),opacity .25s ease}
:host(.in) .cd{transform:none;opacity:1}
.ic{width:72px;height:72px;margin:0 auto 16px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#8f7bff,#4d3ad6);box-shadow:0 10px 26px rgba(77,58,214,.45);color:#fff}
.ic ha-icon{--mdc-icon-size:40px;display:flex}
h2{margin:0 0 8px;font-size:21px;font-weight:700;letter-spacing:-.01em;line-height:1.25} p{margin:0 0 6px;font-size:15px;line-height:1.4;color:var(--fg2)}
.st{min-height:20px;margin:10px 0 0;font-size:14px;color:var(--fg2)} .st.err{color:#ff6b6b}
.bt{display:flex;gap:10px;margin-top:20px} .bt button{all:unset;cursor:pointer;flex:1;height:48px;border-radius:15px;font-size:16px;font-weight:650;display:flex;align-items:center;justify-content:center;background:var(--btn);color:var(--fg);transition:transform .12s ease,opacity .2s}
.bt button:active{transform:scale(.97)} .bt .pr{background:linear-gradient(150deg,#7f6bff,#4d3ad6);color:#fff;box-shadow:0 8px 20px rgba(77,58,214,.35)} .bt button[disabled]{opacity:.5;pointer-events:none}
.sp{display:inline-block;width:14px;height:14px;margin-right:8px;vertical-align:-2px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;animation:s .8s linear infinite} @keyframes s{to{transform:rotate(360deg)}}`;
// the dialog. opts.force: ignore the "asked already" flag (editor button / NotHomeView.setup()); opts.day: force the look
function hvSetupDialog(hass, opts = {}) {
  if (document.querySelector('homeview-setup')) return null;
  const host = document.createElement('homeview-setup'), sr = host.attachShadow({ mode: 'open' });
  const day = opts.day != null ? opts.day : !(hass.themes && hass.themes.darkMode); host.toggleAttribute('day', !!day);
  sr.innerHTML = `<style>${SETUP_CSS}</style><div class="scr"></div><div class="cd" role="dialog" aria-modal="true" aria-labelledby="t"><div class="ic"><ha-icon icon="mdi:home-variant"></ha-icon></div>
    <h2 id="t">Add NotHomeView?</h2><p>Would you like to add new dashboard "NotHomeView" to your dashboard list?</p>
    <p style="font-size:13px">It is built from your own lights, climate, cameras, rooms and more. Nothing else changes, and you can edit or delete it any time.</p>
    <div class="st" aria-live="polite"></div><div class="bt"><button class="no">No</button><button class="pr add">Add</button></div></div>`;
  const $ = s => sr.querySelector(s), stEl = $('.st'), no = $('.no'), add = $('.add');
  const close = () => { host.classList.remove('in'); setTimeout(() => host.remove(), 260); };
  const step = (t, err) => { stEl.classList.toggle('err', !!err); stEl.innerHTML = err ? esc(t) : `<span class="sp"></span>${esc(t)}`; };
  no.addEventListener('click', () => { if (opts.onNo) opts.onNo(); else { hvSetupFlag.set(hass, 'dismissed'); hvSetupUnnotify(hass); } close(); });
  add.addEventListener('click', async () => { if (opts.onAdd) { opts.onAdd(); return; } add.disabled = no.disabled = true;
    try { const r = await hvSetupCreate(hass, t => step(t)); await hvSetupFlag.set(hass, 'created'); hvSetupUnnotify(hass);
      $('h2').textContent = 'NotHomeView is ready'; sr.querySelectorAll('p').forEach(x => x.remove());
      stEl.classList.remove('err'); stEl.textContent = `${r.summary.pages} pages and ${r.summary.buttons} buttons, made from your devices. It is in the sidebar too.`;
      no.textContent = 'Not now'; add.textContent = 'Open it'; no.disabled = add.disabled = false;
      const n2 = no.cloneNode(true), a2 = add.cloneNode(true); no.replaceWith(n2); add.replaceWith(a2);
      n2.addEventListener('click', close); a2.addEventListener('click', () => { close(); hvNavigate(`/${r.url}/main`); });
    } catch (e) { step('Could not create the dashboard: ' + ((e && (e.message || e.code)) || e), true); no.disabled = false; no.textContent = 'Close'; add.disabled = false; add.textContent = 'Try again'; } });
  document.body.appendChild(host); requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('in'))); return host; }
async function hvSetupMaybe(hass) {
  if (!hass || !hass.user || hass.user.is_admin !== true) return 'not admin';
  if (await hvSetupFlag.get(hass)) return 'asked before';
  const has = await hvSetupHasDash(hass); if (has === null) return 'unknown'; // could not list the dashboards: don't ask
  const notified = !!(await hvSetupFlag.read(hass)).notified; // the notification is offered once per user
  // 1.31.2: existing users (a Home Screen dashboard is there) get the notification once, but never the dialog.
  // "exists" itself is not remembered: deleting that dashboard brings the dialog back (unless they said No / Add)
  if (has) { if (!notified) await hvSetupNotify(hass, has); return notified ? 'exists' : 'exists, notified'; }
  if (!notified) hvSetupNotify(hass); // also on kiosk screens (the bell works there)
  if (hvSetupKiosk(hass)) return 'kiosk';
  hvSetupDialog(hass); return 'shown'; }
const hvHaHass = () => { const ha = document.querySelector('home-assistant'); return ha && ha.hass; };
window.NotHomeView = Object.assign(window.NotHomeView || {}, {
  setup: opts => { const h = hvHaHass(); return h ? hvSetupDialog(h, Object.assign({ force: true }, opts)) : null; },
  dryRun: async (url = 'nothome-view') => { const h = hvHaHass(); return hvSetupBuild(await hvSetupData(h), url); }, // returns the config, saves nothing
  build: hvSetupBuild,
  kiosk: () => hvSetupKiosk(hvHaHass()), // is an active kiosk mode hiding the header right now (no dialog then)
  check: () => hvSetupMaybe(hvHaHass()), // the first-run check now (shows the dialog only when it would show by itself); returns why not
  resetSetup: async () => { const h = hvHaHass(); try { localStorage.removeItem(HV_SETUP_LS); } catch (e) {} if (h) try { await h.callWS({ type: 'frontend/set_user_data', key: HV_SETUP_KEY, value: null }); } catch (e) {} } });
// boot: once per page load, as soon as Home Assistant is connected (any page that loaded the dashboard resources), plus the
// ?nothomeview_setup=1 link from the notification, which opens the dialog for an admin (1.31.1)
const hvSetupLink = () => { if (!new RegExp('[?&]' + HV_SETUP_Q + '=1').test(location.search || '')) return; const h = hvHaHass(); if (!h || !h.user) return;
  const u = new URL(location.href); u.searchParams.delete(HV_SETUP_Q); history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  if (h.user.is_admin === true) hvSetupDialog(h, { force: true }); };
(() => { if (window.__hvSetupBoot || window.__hvNoSetup || typeof document === 'undefined' || !document.body) return; window.__hvSetupBoot = true; let tries = 0;
  const tick = () => { const h = hvHaHass(); if (!h || !h.user || !h.connection || !h.states || !Object.keys(h.states).length) { if (++tries < 120) setTimeout(tick, 1500); return; }
    if (new RegExp('[?&]' + HV_SETUP_Q + '=1').test(location.search || '')) { hvSetupLink(); return; }
    if (h.user.is_admin !== true) return; hvSetupMaybe(h).catch(() => {}); };
  for (const ev of ['location-changed', 'popstate']) window.addEventListener(ev, () => setTimeout(hvSetupLink, 300));
  setTimeout(tick, 2500); })();
// "Create NotHomeView dashboard" under the Home Screen card editor
function hvSetupEditorBtn(ed) { if (ed.querySelector('.hv-setup-btn')) return; const w = document.createElement('div'); w.className = 'hv-setup-btn';
  w.style.cssText = 'margin:18px 0 4px;padding:12px 14px;border-radius:12px;border:1px solid var(--divider-color,rgba(127,127,127,.3));display:flex;align-items:center;gap:12px;justify-content:space-between';
  w.innerHTML = '<span style="font-size:14px;color:var(--secondary-text-color)">Make a new NotHomeView dashboard from your own devices (adds a dashboard; this one is not changed).</span><button style="all:unset;cursor:pointer;white-space:nowrap;padding:9px 14px;border-radius:10px;background:var(--primary-color,#4d3ad6);color:var(--text-primary-color,#fff);font-weight:600;font-size:14px">Create NotHomeView dashboard</button>';
  w.querySelector('button').addEventListener('click', () => { if (ed._hass) hvSetupDialog(ed._hass, { force: true }); }); ed.appendChild(w); }
