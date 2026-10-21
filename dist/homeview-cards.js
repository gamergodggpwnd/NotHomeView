/*! HomeView cards for Home Assistant - one bundle, no build step, no dependencies.
 *  Cards: homeview-now-playing-card, homeview-thermostat-card, homeview-entity-card, homeview-light-card, homeview-garage-card,
 *         homeview-group-card, homeview-scene-card, homeview-music-card, homeview-nav-card, homeview-edit-button-card
 *  Every card has a visual editor (ha-form). Look = HomeView glass tiles; colours come from the
 *  HomeView CSS variables (--hv-*) set by the HomeView theme / style helper, with glass fall-backs. */
const HV_VERSION = '1.12.0';
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
const fmtState = (hass, s) => !s ? '' : (hass.formatEntityState ? hass.formatEntityState(s) : s.state);
const fmtAttr = (hass, s, a) => !s ? '' : (hass.formatEntityAttributeValue ? hass.formatEntityAttributeValue(s, a) : String(s.attributes[a]));

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
    this._built = false; this._sig = null; this._render();
  }
  validate(c) { if (this.constructor.needsEntity && !c.entity) throw new Error('Please choose an entity'); }
  set hass(h) { this._hass = h; this._render(); }
  get hass() { return this._hass; }
  watched() { const c = this._config || {}; return [c.entity].concat(c.entities || []).filter(Boolean).map(e => typeof e === 'string' ? e : e.entity); }
  get stateObj() { return this._hass && this._config.entity ? this._hass.states[this._config.entity] : undefined; }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 3, rows: 2, min_columns: 2, min_rows: 1 }; }
  getLayoutOptions() { const g = this.getGridOptions(); return { grid_columns: g.columns === 'full' ? 'full' : Math.max(1, Math.round(g.columns / 3)), grid_rows: g.rows, grid_min_columns: Math.max(1, Math.round((g.min_columns || 3) / 3)), grid_min_rows: g.min_rows }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  // --- rendering
  _render() {
    if (!this._config || !this._hass) return;
    const sig = JSON.stringify(this.watched().map(e => { const s = this._hass.states[e]; return s ? [s.state, s.last_updated, s.attributes] : 0; })) + (this._pending ?? '') + (this._hass.locale && this._hass.locale.language);
    const loc = this._hass.formatEntityState || this._hass.localize;
    if (this._built && sig === this._sig && loc === this._loc) return;
    this._loc = loc;
    this._loadTranslations();
    this._sig = sig;
    if (!this._built) this._build();
    this._applyColors();
    this.update();
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
.ch.dis{opacity:.3;pointer-events:none}`; }
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
    let sec = c.label != null && c.label !== '' ? c.label : (c.attribute ? fmtAttr(this._hass, s, c.attribute) : fmtState(this._hass, s));
    if (c.show_state === false && !c.label) sec = '';
    const active = c.active === 'always' ? true : c.active === 'never' ? false : stateActive(s);
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
  static get defaults() { return { confirm: true }; }
  static getStubConfig(hass) { return { entity: Object.keys(hass.states).find(k => k.startsWith('cover.')) || 'cover.example', name: 'Garage', confirm: true }; }
  validate(c) { super.validate(c); if (domainOf(c.entity) !== 'cover') throw new Error('homeview-garage-card needs a cover entity'); }
  defaultAction(kind) {
    if (kind !== 'tap') return { action: 'more-info' };
    const c = this._config, s = this.stateObj, closed = !s || ['closed', 'closing'].includes(s.state);
    const a = { action: 'perform-action', perform_action: closed ? 'cover.open_cover' : 'cover.close_cover', target: { entity_id: c.entity } };
    if (c.confirm !== false) a.confirmation = { text: c.confirm_text || `${closed ? 'Open' : 'Close'} ${this.name('the garage door')}?` };
    return a;
  }
  view() { const v = super.view(); return v; }
}
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
    const sec = c.show_state === false ? '' : (n ? `${n} ${word}` : (c.none_label || 'All off'));
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
const HELPERS = { text_color: 'Any CSS colour, e.g. #ffffff or rgba(255,255,255,.9). Empty = HomeView theme.', accent_color: 'Background when active, e.g. #cbc4ee or a gradient.',
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
  { type: 'grid', name: '', schema: [{ name: 'show_state', selector: { boolean: {} } },
    { name: 'active', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'When on / open / playing' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }] } } }] },
  LAYOUT]);
HVLightCard.schema = ENTITY_SCHEMA('light', 'toggle', 'more-info', [
  { type: 'grid', name: '', schema: [{ name: 'room', selector: { text: {} } }, { name: 'show_state', selector: { boolean: {} } }] }, LAYOUT]);
HVGarageCard.schema = ENTITY_SCHEMA('cover', null, 'more-info', [
  { type: 'grid', name: '', schema: [{ name: 'confirm', selector: { boolean: {} } }, { name: 'confirm_text', selector: { text: {} } }] }, LAYOUT]);
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
const PENCIL = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
const EDIT_CSS = `
:host{all:initial}
button{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;
 width:var(--s);height:var(--s);border-radius:50%;opacity:var(--o);transition:opacity .2s ease,transform .15s ease,background .2s ease;
 background:var(--bg);border:1px solid var(--bd);box-shadow:var(--sh);color:var(--fg);
 backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%)}
button:hover,button:focus-visible{opacity:1}
button:active{transform:scale(.9);opacity:1}
svg,ha-icon{width:calc(var(--s) * .5);height:calc(var(--s) * .5);--mdc-icon-size:calc(var(--s) * .5);fill:currentColor;display:flex;pointer-events:none}
.dark{--bg:linear-gradient(150deg,rgba(255,255,255,.20),rgba(255,255,255,.08));--bd:rgba(255,255,255,.30);--fg:rgba(255,255,255,.92);
 --sh:inset 0 1px 0 rgba(255,255,255,.25),0 .6vh 1.8vh rgba(6,8,60,.28)}
.light{--bg:linear-gradient(150deg,rgba(255,255,255,.85),rgba(255,255,255,.55));--bd:rgba(0,0,0,.08);--fg:rgba(28,28,40,.72);
 --sh:inset 0 1px 0 rgba(255,255,255,.9),0 .5vh 1.6vh rgba(20,20,50,.12)}
`;
class HVEditButtonCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { position: 'top-right', style: 'auto', admin_only: true, size: 30, offset: 6, opacity: 0.6, show_edit_button: true, show_screensaver_button: true }; }
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
  _go(e) { e.preventDefault(); e.stopPropagation(); if (this._config.preview_only) return; location.assign(this.url()); }
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
    if (this._fab && this._fab.isConnected && this._fabKey === key) return;
    this._unportal();
    const host = document.createElement('homeview-edit-fab'), r = host.attachShadow({ mode: 'open' });
    const off = (+c.offset || 0) + 'px', [v, h] = String(c.position || 'top-right').split('-');
    // fixed to the viewport, inside the safe area; z-index below dialogs / browser_mod popups / the Wallpanel screensaver
    host.style.cssText = `position:fixed;z-index:${c.z_index || 3};${v === 'bottom' ? 'bottom' : 'top'}:calc(env(safe-area-inset-${v === 'bottom' ? 'bottom' : 'top'},0px) + ${off});`
      + `${h === 'left' ? 'left' : 'right'}:calc(env(safe-area-inset-${h === 'left' ? 'left' : 'right'},0px) + ${off});display:block;width:auto;height:auto;margin:0;padding:0`;
    r.innerHTML = this._btnHTML(theme);
    const pen = r.querySelector('.pen'), scr = r.querySelector('.scr');
    if (pen) pen.addEventListener('click', e => this._go(e));
    if (scr) scr.addEventListener('click', e => this._openScreensaver(e));
    // keep the tap from reaching anything underneath (Wallpanel idle timer still sees the activity on window)
    for (const b of r.querySelectorAll('button')) for (const t of ['pointerdown', 'pointerup', 'touchstart', 'touchend']) b.addEventListener(t, e => e.stopPropagation(), { passive: true });
    document.body.appendChild(host); this._fab = host; this._fabKey = key;
  }
  _unportal() { if (this._fab) { this._fab.remove(); this._fab = null; } }
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
  { name: 'screensaver_icon', selector: { icon: {} } }];
HVEditButtonCard.editorDefaults = true;
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
const HV_SIZES = { '2x3': { columns: 3, rows: 2 }, '2x6': { columns: 6, rows: 2 }, '4x6': { columns: 6, rows: 4 } };
// the camera also has a portrait size: 4 rows × 3 columns (one tile wide, two tiles tall)
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
.hasrow .ph{padding:clamp(28px,22cqh,48px) 12px clamp(36px,30cqh,64px)} .ph.t ha-icon{opacity:.8}
@container (max-height:180px){ .ph.t ha-icon{display:none} }
.shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 62%,rgba(0,0,0,.42) 100%)}
.ov{position:absolute;left:var(--p);top:var(--p);right:var(--p);display:flex;align-items:center;gap:8px;pointer-events:none;--p:clamp(8px,4.5cqmin,16px)}
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
.grab{position:absolute;z-index:6;left:50%;top:calc(env(safe-area-inset-top,0px) * var(--hv-cam-safe,0) + 7px);width:38px;height:5px;margin-left:-19px;border-radius:3px;
 background:rgba(255,255,255,.5);box-shadow:0 1px 4px rgba(0,0,0,.3);display:none;pointer-events:none}
:host([swipe]) .grab{display:block}
`;
class HVCameraCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static get defaults() { return { camera_view: 'live', size: '2x3', show_name: true, show_status: true, tap_opens: true, popup_style: 'fullscreen', swipe_to_close: true }; }
  static getStubConfig(hass) { const ids = Object.keys(hass.states).filter(k => k.startsWith('camera.')); return { entity: ids.find(k => !UNAVAILABLE.includes(hass.states[k].state)) || ids[0] || 'camera.example' }; }
  static getConfigElement() { const e = document.createElement('homeview-card-editor'); e.cardClass = this; return e; }
  // the Size dropdown writes grid_options (sections grid cells) when it is changed
  static editorTransform(cfg, val, prev) {
    const ns = val.size || '2x3', ps = (prev && prev.size) || '2x3';
    if (ns !== ps && CAM_SIZES[ns]) cfg.grid_options = Object.assign({}, cfg.grid_options || {}, CAM_SIZES[ns]);
    if (Array.isArray(cfg.buttons)) { cfg.buttons = cfg.buttons.filter(b => b && b.entity).map(b => { const o = {}; for (const k of Object.keys(b)) if (b[k] !== '' && b[k] != null) o[k] = b[k]; return o; }); if (!cfg.buttons.length) delete cfg.buttons; }
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
  connectedCallback() { this._render(); this._resetDrag(); this._timer(); setTimeout(() => this._swipeAttr(), 0); setTimeout(() => this._swipeAttr(), 400); }
  disconnectedCallback() { clearInterval(this._iv); this._iv = null; }
  _timer() { clearInterval(this._iv); this._iv = setInterval(() => this._tick(), 1000); }
  get _stateObj() { return this._hass && this._config ? this._hass.states[this._config.entity] : undefined; }
  _btns() { return (this._config.buttons || []).map(b => typeof b === 'string' ? { entity: b } : b).filter(b => b && b.entity); }
  _build() {
    this.shadowRoot.innerHTML = `<style>${CAM_CSS}</style><ha-card tabindex="0" role="button">
      <div class="media"><div class="ph"><ha-icon icon="mdi:cctv"></ha-icon><span class="pt"></span></div><img alt=""><img alt=""></div><div class="shade"></div>
      <div class="ov"><div class="chip"><div class="nm"></div><div class="st"><span class="dot"></span><span class="sx"></span></div></div></div>
      <button class="x glass" data-own aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button>
      <div class="row"></div><div class="grab" aria-hidden="true"></div></ha-card>`;
    const R = this.shadowRoot; this._$ = s => R.querySelector(s);
    this._card = this._$('ha-card'); this._media = this._$('.media'); this._imgs = [...R.querySelectorAll('.media img')]; this._imgI = 0;
    this._card.addEventListener('click', e => {
      if (this._suppressClick) return;
      const b = e.composedPath().find(n => n.tagName === 'BUTTON');
      if (b) { e.stopPropagation(); if (b.classList.contains('x')) this._close(); else if (b.dataset.i != null) this._runButton(+b.dataset.i); return; }
      if (!this._config.large && this._config.tap_opens !== false) this.openLarge();
      else if (!this._config.large) fire(this, 'hass-more-info', { entityId: this._config.entity });
    });
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
    const sig = JSON.stringify([s && s.state, btns.map(b => { const x = this._hass.states[b.entity]; return x ? [x.state, x.attributes.friendly_name] : 0; }), c]);
    this._media.classList.toggle('dead', !s || UNAVAILABLE.includes(s.state));
    this._ensureMedia();
    if (sig === this._sig) return; this._sig = sig;
    const name = c.name != null && c.name !== '' ? c.name : (s ? s.attributes.friendly_name || s.entity_id : c.entity);
    this._$('.nm').textContent = name; this._$('.ov').style.display = c.show_name === false && c.show_status === false ? 'none' : '';
    this._$('.nm').style.display = c.show_name === false ? 'none' : ''; this._$('.st').style.display = c.show_status === false ? 'none' : '';
    this._$('.pt').textContent = !s ? 'Camera not found' : UNAVAILABLE.includes(s.state) ? 'Camera unavailable' : ''; this._$('.ph').classList.toggle('t', !!this._$('.pt').textContent);
    this._card.setAttribute('aria-label', name);
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
  _ensureMedia() {
    const c = this._config, s = this._stateObj, key = c.entity + '|' + c.camera_view + '|' + (s && !UNAVAILABLE.includes(s.state) ? 1 : 0);
    if (this._streamEl) { this._streamEl.hass = this._hass; }
    if (key === this._mediaKey) return; this._mediaKey = key;
    if (this._streamEl) { this._streamEl.remove(); this._streamEl = null; } this._live = false;
    this._lastSnap = 0; this._snapOk = false; this._snapErr = false; this._failed = false; this._snap();
    if (!s || UNAVAILABLE.includes(s.state) || c.camera_view === 'snapshot') return;
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
  _markLive() { if (!this._streamEl) return; this._streamEl.classList.add('on'); if (!this._live) { this._live = true; this._status(); } }
  _videoReady() { // the players live in nested shadow roots; a <video> with decoded frames = live
    const find = r => { for (const e of r.querySelectorAll('*')) { if (e.tagName === 'VIDEO' && e.readyState >= 2 && e.videoWidth) return true; if (e.tagName === 'IMG' && e.complete && e.naturalWidth && /mjpeg|camera_proxy_stream/.test(e.src)) return true; if (e.shadowRoot && find(e.shadowRoot)) return true; } return false; };
    try { return this._streamEl && find(this._streamEl.shadowRoot || this._streamEl); } catch (e) { return false; }
  }
  _snap() {
    const s = this._stateObj; if (!s || UNAVAILABLE.includes(s.state) || !s.attributes.entity_picture || !this._hass) return;
    this._lastSnap = Date.now();
    let u = s.attributes.entity_picture; u = this._hass.hassUrl ? this._hass.hassUrl(u) : u; u += (u.includes('?') ? '&' : '?') + '_t=' + Date.now();
    const pre = new Image(); pre.onload = () => { const nx = this._imgs[this._imgI ^ 1]; nx.src = u; nx.classList.add('on'); this._imgs[this._imgI].classList.remove('on'); this._imgI ^= 1; this._card.classList.add('has'); this._snapOk = true; this._status(); };
    pre.onerror = () => { if (!this._snapOk) { this._snapErr = true; this._status(); } }; pre.src = u;
  }
  _tick() {
    if (!this._built || !this._config) return;
    if (this._streamEl && !this._live && this._videoReady()) this._markLive();
    const every = this._config.camera_view === 'snapshot' ? (this._config.large ? 3000 : 10000) : (this._live ? 0 : 10000);
    if (every && Date.now() - this._lastSnap > every) this._snap();
    if (this._streamEl && !this._live && Date.now() - this._streamAt > 25000 && !this._failed) { this._failed = true; this._status(); }
  }
  _status() {
    const c = this._config, s = this._stateObj, st = this._$('.st'); if (!st) return;
    let t; if (!s) t = 'Not found'; else if (UNAVAILABLE.includes(s.state)) t = 'Unavailable';
    else if (c.camera_view === 'snapshot') t = this._snapErr && !this._snapOk ? 'No snapshot' : 'Snapshot'; else if (this._live) t = 'Live'; else if (this._failed) t = 'Snapshot'; else t = 'Connecting…';
    st.classList.toggle('live', t === 'Live'); this._$('.sx').textContent = t;
    const pt = this._$('.pt'); if (s && !UNAVAILABLE.includes(s.state)) pt.textContent = t === 'No snapshot' ? 'No snapshot image' : t === 'Connecting…' ? 'Connecting…' : ''; this._$('.ph').classList.toggle('t', !!pt.textContent);
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
HVCameraCard.sizeOptionsExtra = [{ value: '4x3', label: '4 × 3 Tall (one tile wide, two tiles tall)' }];
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
  { type: 'expandable', name: '', flatten: true, title: 'Large view (tap the picture)', icon: 'mdi:arrow-expand', schema: [
    { name: 'tap_opens', selector: { boolean: {} } },
    { name: 'popup_style', selector: { select: { mode: 'dropdown', options: [{ value: 'fullscreen', label: 'Full screen (edge to edge, swipe down to close)' }, { value: 'window', label: 'Window (rounded panel)' }] } } },
    { name: 'swipe_to_close', selector: { boolean: {} } }] }];
Object.assign(LABELS, { show_name: 'Show name', camera_view: 'Live or snapshot', size: 'Size', buttons: 'Buttons', show_status: 'Show status (Live / Snapshot)', tap_opens: 'Open the large view on tap' });
Object.assign(HELPERS, {
  buttons: 'Glass buttons along the bottom of the tile and the large view. They light up when the entity is on.',
  tap_opens: 'Needs browser_mod. Off = tap opens the camera’s more-info.' });

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
    fire(this, 'll-custom', { action: 'fire-dom-event', browser_mod: { service: 'browser_mod.popup', data: this.popupData() } }); return true;
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
HVPersonCard.sizeOptions = [{ value: '2x3', label: '2 × 3 (one tile)' }, { value: '4x6', label: '4 × 6 (2 tiles wide & tall)' }];
HVPersonCard.schema = [
  { name: 'entity', required: true, selector: { entity: { domain: 'person' } } },
  { name: 'name', selector: { text: {} } },
  { name: 'location_entity', selector: { entity: { domain: 'sensor' } } },
  { name: 'badge_entity', selector: { entity: {} } }];
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
.ft{display:flex;align-items:center;gap:10px;padding:12px 20px 18px;flex:none;border-top:1px solid rgba(255,255,255,.08)}
.ft .st{flex:1;min-width:0;font-size:13px;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft .st.ok{color:#7be0a0} .ft .st.err{color:#ff8a80}
.ft button{all:unset;box-sizing:border-box;cursor:pointer;height:40px;padding:0 18px;border-radius:999px;font:600 14px ${FONT};display:flex;align-items:center;gap:8px;white-space:nowrap;
 background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);color:#fff;transition:transform .12s ease,opacity .2s}
.ft button:active{transform:scale(.95)} .ft button[disabled]{opacity:.4;pointer-events:none} .ft button ha-icon{--mdc-icon-size:18px;display:flex}
.ft .save{background:linear-gradient(150deg,#8f86ff,#6e5ad2);border-color:rgba(255,255,255,.25)}
.grab{display:none;position:absolute;z-index:4;top:8px;left:50%;width:40px;height:5px;margin-left:-20px;border-radius:9px;background:rgba(255,255,255,.42);pointer-events:none}
:host([swipe]) .grab{display:block}
@media (max-width:520px){ .ft{flex-wrap:wrap} .ft .st{flex-basis:100%;order:3} }
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
      <div class="ft"><div class="st"></div><button class="pv"><ha-icon icon="mdi:play-circle-outline"></ha-icon>Preview</button><button class="save" disabled><ha-icon icon="mdi:content-save-outline"></ha-icon>Save</button></div>
      <div class="grab" aria-hidden="true"></div></ha-card>`;
    const R = this.shadowRoot; this._card = R.querySelector('ha-card'); this._bd = R.querySelector('.bd'); this._st = R.querySelector('.st');
    R.querySelector('.x').addEventListener('click', () => this._close());
    R.querySelector('.save').addEventListener('click', () => this._save());
    R.querySelector('.pv').addEventListener('click', () => this._preview());
    this._bindSwipe(); this._built = true;
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
      const t2 = this.shadowRoot.querySelector('.t2'); t2.textContent = 'Wallpanel · ' + ((cfg.title || this._dash || 'Overview'));
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
    d.source = !d.show_images ? 'none' : /^media-source:\/\//.test(d.image_url) ? 'media' : /picsum\.photos/.test(d.image_url) ? 'picsum' : 'url';
    d.media_folder = d.source === 'media' ? d.image_url : 'media-source://media_source/local/';
    d.web_url = d.source === 'url' ? d.image_url : '';
    return d;
  }
  _schema() {
    const n = (name, min, max, step, unit) => ({ name, selector: { number: { min, max: Math.max(max, +this._data[name] || 0), step, mode: 'slider', unit_of_measurement: unit } } });
    const sel = (name, opts) => ({ name, selector: { select: { mode: 'dropdown', options: opts } } });
    const b = name => ({ name, selector: { boolean: {} } });
    const src = this._data.source;
    const photos = [sel('source', [{ value: 'media', label: 'Media folder (Home Assistant media)' }, { value: 'url', label: 'Web address (URL)' }, { value: 'picsum', label: 'Random photos (picsum.photos)' }, { value: 'none', label: 'No photos (clock only)' }])];
    if (src === 'media') photos.push({ name: 'media_folder', selector: { text: {} } });
    if (src === 'url') photos.push({ name: 'web_url', selector: { text: { type: 'url' } } });
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
  _renderForm() {
    if (!this._form) {
      this._bd.innerHTML = ''; const f = document.createElement('ha-form'); this._form = f;
      f.computeLabel = s => SS_LABELS[s.name] || s.name; f.computeHelper = s => SS_HELPERS[s.name];
      f.addEventListener('value-changed', ev => { ev.stopPropagation(); const v = Object.assign({}, ev.detail.value);
        for (const k of Object.keys(this._data)) if ((v[k] === undefined || v[k] === '' || v[k] === null) && k !== 'web_url' && k !== 'media_folder') v[k] = this._data[k]; // a cleared (x) dropdown keeps its value
        const srcCh = v.source !== this._data.source; this._data = Object.assign({}, this._data, v);
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
    if (['source', 'media_folder', 'web_url'].some(k => ch.includes(k))) {
      if (d.source === 'none') wp.show_images = false;
      else { if (wp.show_images === false) wp.show_images = true;
        wp.image_url = d.source === 'media' ? (String(d.media_folder || '').trim() || 'media-source://media_source/local/') : d.source === 'picsum' ? SS_DEF.image_url : String(d.web_url || '').trim(); }
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
  _preview() {
    if (this._changes().length) this._status('Previewing the saved settings (Save first to see your changes).');
    const go = () => { const w = ssWallpanel(); if (w && typeof w.startScreensaver === 'function') { try { w.startScreensaver(); } catch (e) {} } else this._status('Wallpanel is not running on this page.', 'err'); };
    if (this.hasAttribute('large')) { this._close(); setTimeout(go, 700); } else go();
  }
  _close() {
    if (this._overlay) { this._overlay.remove(); return; }
    if (this._popupHost()) this._dismiss(this.getBoundingClientRect().height || window.innerHeight);
  }
  _pop() {}
}
for (const k of ['_popupHost', '_swipeAttr', '_resetDrag', '_bindSwipe', '_snapBack', '_dismiss']) HVScreensaverCard.prototype[k] = HVNowPlayingCard.prototype[k];
const SS_LABELS = { enabled: 'Screensaver on', idle_time: 'Start after (idle)', fade_in_time: 'Fade in', enabled_on_views: 'Only on these views (none ticked = all views)',
  source: 'Photos from', media_folder: 'Media folder', web_url: 'Photo URL', display_time: 'Switch photo every', crossfade_time: 'Crossfade between photos', media_order: 'Order',
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
const SIZE_OPTS = [{ value: '2x3', label: '2 × 3 (one tile)' }, { value: '2x6', label: '2 × 6 (two tiles wide)' }, { value: '4x6', label: '4 × 6 (2 tiles wide & tall)' }];
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
const hvWithSize = (schema, cur) => { // camera: in place of its placeholder; others: before Colours / the first expandable section
  const f = hvSizeField(cur), out = schema.slice(), i = out.findIndex(x => x && x.name === 'hv_size');
  if (i >= 0) { out[i] = f; return out; }
  let j = out.findIndex(x => x && x.type === 'expandable' && /Colour/.test(x.title || '')); if (j < 0) j = out.findIndex(x => x && x.type === 'expandable');
  out.splice(j < 0 ? out.length : j, 0, f); return out;
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
    this._form.schema = [...(SZ ? hvWithSize(base, SZ) : base.filter(x => !x || x.name !== 'hv_size')), ...(L ? [vlSchema(L.c, L.r)] : [])];
    if (this._bar) {
      const vl = this._vlCurrent();
      const parts = ['grid-column', 'grid-row', 'grid-area'].filter(k => vl[k]).map(k => `${k}: ${vl[k]}`);
      this._bar.querySelector('.vlnote').textContent = parts.length ? 'Grid: ' + parts.join(' · ') + '. Save to see it in the dashboard grid.' : 'Grid: 1 × 1, auto position.';
    }
  }
}

/* ---------------- registration ---------------- */
const CARDS = [
  ['homeview-thermostat-card', HVThermostatCard, 'NotHomeView Thermostat', 'Big set-point with chevrons, mode and current temperature (NotHomeView glass).'],
  ['homeview-entity-card', HVEntityCard, 'NotHomeView Entity', 'Any entity as a NotHomeView tile: icon, name, state or custom sub-label.'],
  ['homeview-light-card', HVLightCard, 'NotHomeView Light', 'Light tile: tap toggles, shows brightness %, hold for more-info.'],
  ['homeview-garage-card', HVGarageCard, 'NotHomeView Garage', 'Cover / garage door: open or close with optional confirmation.'],
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
window.customCards = window.customCards || [];
for (const [tag, cls, name, description] of CARDS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  if (!window.customCards.some(c => c.type === tag)) window.customCards.push({ type: tag, name, description, preview: true });
}
console.info(`%c HOMEVIEW-CARDS %c ${HV_VERSION} `, 'color:#fff;background:#6e5ad2;font-weight:700;border-radius:4px 0 0 4px', 'color:#6e5ad2;background:#ece8ff;border-radius:0 4px 4px 0');
