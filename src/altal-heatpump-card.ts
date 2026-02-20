/**
 * Altal Heater Card — Home Assistant Lovelace Custom Card
 * Premium neumorphic card for Altal heat pump
 * v3.0.0
 */

import './altal-heatpump-card-editor';

/* ═══════════════════ Interfaces ═══════════════════ */

interface CardConfig {
  climate_entity: string;
  current_temp_entity: string;
  target_temp_entity: string;
  delta_t_entity: string;
  heating_entity: string;
  name?: string;
  image?: string;
  quick_presets?: number[];
  step?: number;
  show_diagnostics?: boolean;
  show_presets?: boolean;
  show_controls?: boolean;
  show_image?: boolean;
  compact?: boolean;
}

interface HassEntity {
  state: string;
  attributes: Record<string, any>;
  entity_id: string;
  last_changed?: string;
}

interface Hass {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => Promise<void>;
  config: { unit_system: { temperature: string } };
}

interface TempRecord { temp: number; ts: number; }

/* ═══════════════════ Card ═══════════════════ */

class AltalHeatpumpCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;
  private _history: TempRecord[] = [];
  private _pendingTarget: number | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _serviceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('altal-heatpump-card-editor'); }

  static getStubConfig() {
    return {
      climate_entity: 'climate.altal_home_heater',
      current_temp_entity: 'sensor.altal_current_temp',
      target_temp_entity: 'sensor.altal_target_temp',
      delta_t_entity: 'sensor.altal_delta_t',
      heating_entity: 'binary_sensor.altal_heating',
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: true, show_presets: true,
      show_controls: true, show_image: true, compact: false,
    };
  }

  setConfig(config: CardConfig) {
    if (!config.climate_entity) throw new Error('Укажите climate_entity');
    this._config = {
      step: 0.5, quick_presets: [19, 20, 22, 24],
      show_diagnostics: true, show_presets: true,
      show_controls: true, show_image: true, compact: false,
      ...config,
    };
    if (this._hass) this._render();
  }

  set hass(hass: Hass) {
    const prev = this._hass;
    this._hass = hass;

    const cur = this._val(hass, this._config.current_temp_entity);
    if (cur !== null) {
      const now = Date.now();
      this._history.push({ temp: cur, ts: now });
      this._history = this._history.filter(r => r.ts > now - 30 * 60_000);
    }

    // Clear pending target when HA confirms change
    if (this._pendingTarget !== null) {
      const haTarget = hass.states[this._config.climate_entity]?.attributes?.temperature;
      if (haTarget != null && Math.abs(parseFloat(haTarget) - this._pendingTarget) < 0.01) {
        this._pendingTarget = null;
      }
    }

    const changed =
      !prev ||
      prev.states[this._config.climate_entity] !== hass.states[this._config.climate_entity] ||
      prev.states[this._config.current_temp_entity] !== hass.states[this._config.current_temp_entity] ||
      prev.states[this._config.target_temp_entity] !== hass.states[this._config.target_temp_entity] ||
      prev.states[this._config.delta_t_entity] !== hass.states[this._config.delta_t_entity] ||
      prev.states[this._config.heating_entity] !== hass.states[this._config.heating_entity];

    if (changed) this._render();
  }

  getCardSize() { return this._config?.compact ? 4 : 6; }

  /* ── Helpers ────────────────────────────────── */

  private _val(h: Hass, eid: string): number | null {
    const s = h?.states?.[eid];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const n = parseFloat(s.state);
    return isNaN(n) ? null : n;
  }

  private _trend(): 'rising' | 'falling' | 'stable' {
    if (this._history.length < 3) return 'stable';
    const r = this._history.slice(-5);
    const d = r[r.length - 1].temp - r[0].temp;
    return d > 0.3 ? 'rising' : d < -0.3 ? 'falling' : 'stable';
  }

  private _dtDiag(dt: number, cur: number, tgt: number, heating: boolean) {
    if (!heating) return { emoji: '', title: '', text: '', cls: '' };
    if (dt === 0) return { emoji: '⏳', title: 'Нет данных по ΔT', text: '', cls: 'neutral' };
    const diff = tgt - cur;
    if (diff >= 1.5 && (dt <= 2 || dt >= 10))
      return { emoji: '🧊', title: 'Переходный режим', text: `${cur}→${tgt}°C. ΔT=${dt}°C`, cls: 'info' };
    if (diff <= 0.7)
      return { emoji: '🟢', title: 'Поддержание', text: `ΔT=${dt}°C — норма`, cls: 'good' };
    if (dt >= 4 && dt <= 7)
      return { emoji: '✅', title: `ΔT оптимум: ${dt}°C`, text: '', cls: 'good' };
    if (dt < 4)
      return { emoji: '⚠️', title: `ΔT низкий: ${dt}°C`, text: 'Проверьте расход', cls: 'warn' };
    return { emoji: '⚠️', title: `ΔT высокий: ${dt}°C`, text: 'Проверьте фильтры', cls: 'warn' };
  }

  /* ── Actions ────────────────────────────────── */

  private _adjustTemp(direction: number) {
    const step = this._config.step || 0.5;
    const climate = this._hass.states[this._config.climate_entity];
    const currentTarget = this._pendingTarget ?? parseFloat(climate?.attributes?.temperature);
    if (isNaN(currentTarget)) return;

    const newTarget = Math.round((currentTarget + direction * step) * 10) / 10;
    const minT = climate?.attributes?.min_temp ?? 5;
    const maxT = climate?.attributes?.max_temp ?? 35;
    const clamped = Math.max(minT, Math.min(maxT, newTarget));

    this._pendingTarget = clamped;

    // Update display immediately
    const valEl = this._root.querySelector('.setpoint-val');
    if (valEl) valEl.textContent = clamped.toFixed(1) + '°';

    // Debounce the actual service call
    if (this._serviceTimer) clearTimeout(this._serviceTimer);
    this._serviceTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity,
        temperature: clamped,
      });
    }, 600);
  }

  private _setPreset(temp: number) {
    this._pendingTarget = temp;
    const valEl = this._root.querySelector('.setpoint-val');
    if (valEl) valEl.textContent = temp.toFixed(1) + '°';

    if (this._serviceTimer) clearTimeout(this._serviceTimer);
    this._serviceTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity,
        temperature: temp,
      });
    }, 300);
  }

  private _setMode(mode: string) {
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.climate_entity, hvac_mode: mode,
    });
  }

  /* ── SVG Icons ────────────────────────────────── */
  private _icons = {
    flame: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7a.75.75 0 011.1 0c.5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2a.65.65 0 011-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7zm-2.6-7.7c-.2.6-.4 1.3-.4 1.7a3 3 0 006 0c0-1.6-1-3.4-2.2-4.8-.4.6-.9 1.2-1.2 1.6a.7.7 0 01-1.1.1c-.4-.4-.8-.9-1.1-1.6z"/></svg>`,
    power: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 3v9"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M18.36 6.64a9 9 0 11-12.73 0"/></svg>`,
    minus: `<svg viewBox="0 0 24 24"><rect x="6" y="10.5" width="12" height="3" rx="1.5" fill="currentColor"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><rect x="6" y="10.5" width="12" height="3" rx="1.5" fill="currentColor"/><rect x="10.5" y="6" width="3" height="12" rx="1.5" fill="currentColor"/></svg>`,
    thermo: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 15.28V5.5a1.5 1.5 0 00-3 0v9.78A3.5 3.5 0 009 18.5a3.5 3.5 0 007 0 3.5 3.5 0 00-3-3.22zM12 20a2 2 0 01-2-2c0-.74.4-1.39 1-1.73V10h2v6.27c.6.34 1 .99 1 1.73a2 2 0 01-2 2z"/><path fill="currentColor" d="M16 8V5.5C16 3.57 14.43 2 12.5 2h-1C9.57 2 8 3.57 8 5.5V8h2V5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V8h4z" opacity=".4"/></svg>`,
    target: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    delta: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 5L5 19h14L12 5z"/></svg>`,
    up: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M7 17l5-5 5 5M7 11l5-5 5 5"/></svg>`,
    down: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M7 7l5 5 5-5M7 13l5 5 5-5"/></svg>`,
    flat: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M4 12h16"/></svg>`,
    heat: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7a.75.75 0 011.1 0c.5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2a.65.65 0 011-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7z"/></svg>`,
    off: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 8l8 8"/></svg>`,
  };

  /* ══════════════════ STYLES ══════════════════ */

  private _css(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

      :host {
        --bg: var(--card-background-color, #e6e7ee);
        --bg2: var(--secondary-background-color, #d1d9e6);
        --txt: var(--primary-text-color, #44476a);
        --txt2: var(--secondary-text-color, #7b7e8a);
        --accent: var(--primary-color, #e6642f);
        --sh-dark: rgba(163,177,198,0.6);
        --sh-light: rgba(255,255,255,0.5);
        --raised: 6px 6px 12px var(--sh-dark), -6px -6px 12px var(--sh-light);
        --raised-sm: 3px 3px 6px var(--sh-dark), -3px -3px 6px var(--sh-light);
        --inset: inset 2px 2px 5px var(--sh-dark), inset -3px -3px 7px var(--sh-light);
        --inset-sm: inset 1px 1px 3px var(--sh-dark), inset -2px -2px 4px var(--sh-light);
        --btn: 5px 5px 10px var(--sh-dark), -5px -5px 10px var(--sh-light);
        --btn-press: inset 3px 3px 6px var(--sh-dark), inset -3px -3px 6px var(--sh-light);

        --c-heat: #e6642f;
        --c-heat-glow: rgba(230,100,47,0.2);
        --c-idle: #93a5be;
        --c-good: #05a677;
        --c-warn: #f5b759;
        --c-info: #0948b3;

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      .card {
        background: var(--bg);
        border-radius: 20px;
        box-shadow: var(--raised);
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: var(--txt);
        transition: box-shadow 0.3s ease, transform 0.3s ease;
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: 8px 8px 18px var(--sh-dark), -8px -8px 18px var(--sh-light);
      }

      /* ═══ TOP SECTION: image + badge ═══ */
      .top-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 22px 0;
      }
      .top-left { display: flex; align-items: center; gap: 14px; }

      .pump-img {
        width: 64px; height: 64px;
        border-radius: 16px;
        background: var(--bg);
        box-shadow: var(--raised-sm);
        overflow: hidden;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .pump-img img {
        width: 100%; height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .pump-img:hover img { transform: scale(1.1); }

      .pump-img.no-img {
        font-size: 11px; font-weight: 800;
        color: var(--txt2); letter-spacing: 1px;
      }

      .top-info h2 {
        font-size: 17px; font-weight: 700; line-height: 1.2;
        color: var(--txt);
      }
      .top-info .sub {
        font-size: 12px; font-weight: 500; color: var(--txt2); margin-top: 2px;
      }

      /* Status badge */
      .badge {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 14px; border-radius: 24px;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.8px; text-transform: uppercase;
        animation: badge-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes badge-in {
        0% { opacity: 0; transform: scale(0.85); }
        100% { opacity: 1; transform: scale(1); }
      }
      .badge .dot {
        width: 8px; height: 8px; border-radius: 50%;
      }
      .badge.heating {
        background: rgba(230,100,47,0.12); color: var(--c-heat);
        border: 1px solid rgba(230,100,47,0.2);
      }
      .badge.heating .dot {
        background: var(--c-heat);
        box-shadow: 0 0 8px var(--c-heat);
        animation: dot-blink 1.4s ease-in-out infinite;
      }
      .badge.idle { background: rgba(147,165,190,0.12); color: var(--c-idle); border: 1px solid rgba(147,165,190,0.15); }
      .badge.idle .dot { background: var(--c-idle); }
      .badge.off { background: rgba(100,100,120,0.1); color: #999; border: 1px solid rgba(100,100,120,0.12); }
      .badge.off .dot { background: #999; }

      @keyframes dot-blink {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:0.4; transform:scale(1.4); }
      }

      /* ═══ MAIN SECTION: circle + controls ═══ */
      .main-section {
        display: flex; align-items: center; justify-content: center;
        gap: 0; padding: 20px 16px 6px;
      }

      /* +/- side buttons */
      .side-btn {
        width: 50px; height: 50px; border-radius: 50%; border: none;
        background: var(--bg);
        box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--txt); flex-shrink: 0;
        transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      .side-btn:hover {
        transform: scale(1.08);
        box-shadow: 7px 7px 14px var(--sh-dark), -7px -7px 14px var(--sh-light);
      }
      .side-btn:active {
        box-shadow: var(--btn-press);
        transform: scale(0.92);
      }
      .side-btn svg { width: 22px; height: 22px; }

      /* Temp circle */
      .circle-wrap {
        width: 170px; height: 170px; flex-shrink: 0;
        margin: 0 18px; position: relative;
      }

      .circle-outer {
        width: 170px; height: 170px; border-radius: 50%;
        background: var(--bg);
        box-shadow: var(--raised);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }

      .circle-inner {
        width: 144px; height: 144px; border-radius: 50%;
        background: var(--bg);
        box-shadow: var(--inset);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; z-index: 2; overflow: hidden;
      }

      .glow {
        position: absolute; inset: 0; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.6s;
      }
      .glow.on {
        background: radial-gradient(circle, var(--c-heat-glow) 0%, transparent 65%);
        opacity: 1; animation: glow-p 2.5s ease-in-out infinite;
      }
      @keyframes glow-p { 0%,100%{opacity:0.4;transform:scale(0.97)} 50%{opacity:1;transform:scale(1.03)} }

      .spin {
        position: absolute; inset: -4px; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.5s;
      }
      .spin.on {
        opacity: 1;
        border: 3px solid transparent;
        border-top-color: var(--c-heat);
        border-right-color: rgba(230,100,47,0.35);
        animation: spin-a 2.8s linear infinite;
        filter: drop-shadow(0 0 4px var(--c-heat-glow));
      }
      @keyframes spin-a { to { transform: rotate(360deg); } }

      .ripple {
        position: absolute; inset: 8px; border-radius: 50%;
        pointer-events: none; opacity: 0;
      }
      .ripple.on {
        border: 2px solid rgba(230,100,47,0.15);
        animation: rip 2.8s ease-out infinite;
      }
      @keyframes rip { 0%{transform:scale(0.85);opacity:0.7} 100%{transform:scale(1.25);opacity:0} }

      .c-label {
        font-size: 10px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
        position: relative; z-index: 3;
      }
      .c-temp {
        font-size: 42px; font-weight: 300; line-height: 1;
        color: var(--txt); margin-top: 2px;
        position: relative; z-index: 3;
        transition: color 0.3s;
      }
      .c-temp .u { font-size: 18px; font-weight: 400; vertical-align: super; }
      .c-temp.heat { color: var(--c-heat); }

      .trend {
        display: flex; align-items: center; gap: 3px;
        margin-top: 5px; font-size: 10px; font-weight: 600;
        position: relative; z-index: 3;
      }
      .trend svg { width: 14px; height: 14px; }
      .trend.rising { color: var(--c-heat); }
      .trend.falling { color: var(--c-info); }
      .trend.stable { color: var(--c-good); }

      /* ═══ SETPOINT (below circle) ═══ */
      .setpoint {
        text-align: center; padding: 0 22px 6px;
        animation: fade-u 0.4s 0.1s both;
      }
      .setpoint-lbl {
        font-size: 9px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
      }
      .setpoint-val {
        font-size: 28px; font-weight: 700; color: var(--txt);
        line-height: 1.3; transition: color 0.3s;
      }
      .setpoint-val.heat { color: var(--c-heat); }

      @keyframes fade-u {
        0% { opacity:0; transform:translateY(8px); }
        100% { opacity:1; transform:translateY(0); }
      }

      /* ═══ SENSORS ═══ */
      .sensors {
        display: grid; grid-template-columns: repeat(4,1fr);
        gap: 10px; padding: 0 22px; margin-bottom: 16px;
      }
      .sensor {
        background: var(--bg);
        box-shadow: var(--raised-sm);
        border-radius: 14px; padding: 14px 6px;
        text-align: center;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .sensor:nth-child(1){animation-delay:.1s}
      .sensor:nth-child(2){animation-delay:.2s}
      .sensor:nth-child(3){animation-delay:.3s}
      .sensor:nth-child(4){animation-delay:.4s}
      @keyframes pop { 0%{opacity:0;transform:scale(0.8) translateY(8px)} 100%{opacity:1;transform:none} }
      .sensor:hover { transform:translateY(-3px); box-shadow:6px 6px 14px var(--sh-dark),-6px -6px 14px var(--sh-light); }
      .sensor:active { box-shadow:var(--inset-sm); transform:none; }

      .s-ico {
        width: 36px; height: 36px; border-radius: 12px;
        background: var(--bg); box-shadow: var(--inset-sm);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 8px; color: var(--txt2);
        transition: color 0.3s;
      }
      .s-ico svg { width: 18px; height: 18px; }
      .s-ico.heat { color: var(--c-heat); }
      .s-ico.good { color: var(--c-good); }

      .s-v { font-size: 18px; font-weight: 700; color: var(--txt); line-height: 1.2; }
      .s-v.heat { color: var(--c-heat); }

      .s-l {
        font-size: 9px; font-weight: 700; color: var(--txt2);
        text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px;
      }

      /* Mini progress */
      .pbar-wrap {
        height: 4px; border-radius: 4px;
        background: var(--bg); box-shadow: var(--inset-sm);
        overflow: hidden; margin: 8px 4px 0;
      }
      .pbar {
        height: 100%; border-radius: 4px;
        transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
      }
      .pbar.ok { background: linear-gradient(90deg,var(--c-good),#2ecc71); }
      .pbar.mid { background: linear-gradient(90deg,var(--c-warn),#e67e22); }
      .pbar.bad { background: linear-gradient(90deg,#fa5252,#e74c3c); }

      /* ═══ DIAGNOSTICS ═══ */
      .diag {
        background: var(--bg); box-shadow: var(--inset);
        border-radius: 14px; padding: 14px 16px;
        margin: 0 22px 16px; display: flex;
        align-items: flex-start; gap: 12px;
        font-size: 13px; line-height: 1.5; color: var(--txt2);
        animation: fade-u 0.4s 0.3s both;
      }
      .diag.hide { display: none; }
      .diag .d-em { font-size: 22px; flex-shrink: 0; }
      .diag .d-b { flex: 1; }
      .diag .d-t { font-weight: 700; color: var(--txt); margin-bottom: 2px; }
      .diag.good .d-t { color: var(--c-good); }
      .diag.warn .d-t { color: var(--c-warn); }
      .diag.info .d-t { color: var(--c-info); }

      /* ═══ PRESETS ═══ */
      .presets {
        display: flex; gap: 10px; justify-content: center;
        flex-wrap: wrap; padding: 0 22px; margin-bottom: 14px;
        animation: fade-u 0.4s 0.35s both;
      }
      .pre {
        padding: 9px 18px; border-radius: 24px; border: none;
        background: var(--bg); box-shadow: var(--raised-sm);
        cursor: pointer; font-family: inherit;
        font-size: 14px; font-weight: 600; color: var(--txt);
        transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        -webkit-tap-highlight-color: transparent;
      }
      .pre:hover { transform: translateY(-2px); box-shadow: 5px 5px 12px var(--sh-dark),-5px -5px 12px var(--sh-light); }
      .pre:active { box-shadow: var(--btn-press); transform: scale(0.95); }
      .pre.on { color: var(--c-heat); box-shadow: var(--btn-press); font-weight: 700; }

      /* ═══ MODE ROW ═══ */
      .modes {
        display: flex; gap: 10px; justify-content: center;
        padding: 0 22px 20px;
        animation: fade-u 0.4s 0.4s both;
      }
      .mode {
        padding: 10px 18px; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--raised-sm);
        cursor: pointer; font-family: inherit;
        font-size: 12px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.6px;
        color: var(--txt2); display: flex; align-items: center; gap: 8px;
        transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        -webkit-tap-highlight-color: transparent;
      }
      .mode:hover { transform: translateY(-2px); }
      .mode:active { box-shadow: var(--btn-press); transform: scale(0.95); }
      .mode.on { box-shadow: var(--btn-press); }
      .mode.on.heat { color: var(--c-heat); }
      .mode.on.off { color: var(--c-idle); }
      .mode svg { width: 16px; height: 16px; }

      /* ═══ POWER ═══ */
      .pwr {
        width: 42px; height: 42px; border-radius: 50%; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--c-idle); transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      .pwr:hover { transform: scale(1.08); }
      .pwr:active { box-shadow: var(--btn-press); transform: scale(0.93); }
      .pwr.on { color: var(--c-heat); }
      .pwr svg { width: 20px; height: 20px; }

      /* ═══ ERROR ═══ */
      .err {
        padding: 36px 20px; text-align: center;
        background: var(--bg); border-radius: 20px;
        box-shadow: var(--raised);
      }
      .err h3 { font-size: 16px; font-weight: 700; color: #fa5252; margin-bottom: 8px; }
      .err p { font-size: 13px; color: var(--txt2); }
      .err code { font-size: 12px; background: var(--bg2); padding: 3px 8px; border-radius: 6px; }
    `;
  }

  /* ══════════════════ RENDER ══════════════════ */

  private _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card"><div style="padding:40px;text-align:center;color:var(--txt2)">Загрузка…</div></div>`;
      return;
    }

    const C = this._config;
    const H = this._hass;
    const cl = H.states[C.climate_entity];

    if (!cl) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p><code>${C.climate_entity}</code></p></div>`;
      return;
    }

    const curT = this._val(H, C.current_temp_entity);
    const tgtT = this._val(H, C.target_temp_entity);
    const dT = this._val(H, C.delta_t_entity);
    const hState = H.states[C.heating_entity];
    const isH = hState?.state === 'on';
    const hvac = cl.state;
    const isOff = hvac === 'off';
    const cTarget = this._pendingTarget ?? cl.attributes.temperature;
    const hvacModes: string[] = cl.attributes.hvac_modes || ['heat', 'off'];
    const name = C.name || cl.attributes.friendly_name || 'Altal Heat Pump';
    const presets = C.quick_presets || [19, 20, 22, 24];

    const tr = this._trend();
    const trSvg = tr === 'rising' ? this._icons.up : tr === 'falling' ? this._icons.down : this._icons.flat;
    const trTxt = tr === 'rising' ? 'Растёт' : tr === 'falling' ? 'Падает' : 'Стабильно';

    const diag = this._dtDiag(dT ?? 0, curT ?? 0, tgtT ?? 0, isH);

    let bCls = 'off', bTxt = 'Выкл';
    if (isH) { bCls = 'heating'; bTxt = 'Нагрев'; }
    else if (!isOff) { bCls = 'idle'; bTxt = 'Ожидание'; }

    const mLbl: Record<string, string> = { heat: 'Обогрев', off: 'Выкл', cool: 'Охлажд.', auto: 'Авто' };
    const mIco: Record<string, string> = { heat: this._icons.heat, off: this._icons.off };

    const dtPct = dT != null ? Math.min(100, (dT / 10) * 100) : 0;
    const dtCls = dT != null ? (dT >= 4 && dT <= 7 ? 'ok' : dT < 2 || dT > 10 ? 'bad' : 'mid') : 'ok';

    const showImg = C.show_image !== false && C.image;
    const displayTarget = cTarget != null ? parseFloat(cTarget).toFixed(1) : '—';

    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          <!-- TOP ROW: image + name + badge + power -->
          <div class="top-row">
            <div class="top-left">
              ${showImg
        ? `<div class="pump-img"><img src="${C.image}" alt="Altal"/></div>`
        : `<div class="pump-img no-img">ALTAL</div>`}
              <div class="top-info">
                <h2>${name}</h2>
                <div class="sub">${mLbl[hvac] || hvac}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="badge ${bCls}"><span class="dot"></span>${bTxt}</div>
              <button class="pwr ${isOff ? '' : 'on'}" id="pwr">${this._icons.power}</button>
            </div>
          </div>

          <!-- MAIN: ‒ [circle] + -->
          <div class="main-section">
            <button class="side-btn" id="t-dn">${this._icons.minus}</button>
            <div class="circle-wrap">
              <div class="circle-outer">
                <div class="spin ${isH ? 'on' : ''}"></div>
                <div class="ripple ${isH ? 'on' : ''}"></div>
                <div class="circle-inner">
                  <div class="glow ${isH ? 'on' : ''}"></div>
                  <span class="c-label">Сейчас</span>
                  <span class="c-temp ${isH ? 'heat' : ''}">${curT !== null ? curT.toFixed(1) : '—'}<span class="u">°</span></span>
                  <span class="trend ${tr}">${trSvg} ${trTxt}</span>
                </div>
              </div>
            </div>
            <button class="side-btn" id="t-up">${this._icons.plus}</button>
          </div>

          <!-- SETPOINT below circle -->
          <div class="setpoint">
            <div class="setpoint-lbl">Уставка</div>
            <div class="setpoint-val ${isH ? 'heat' : ''}">${displayTarget}°</div>
          </div>

          <!-- SENSOR GRID -->
          <div class="sensors">
            <div class="sensor">
              <div class="s-ico ${isH ? 'heat' : ''}">${this._icons.thermo}</div>
              <div class="s-v">${curT !== null ? curT.toFixed(1) : '—'}°</div>
              <div class="s-l">Сейчас</div>
            </div>
            <div class="sensor">
              <div class="s-ico">${this._icons.target}</div>
              <div class="s-v">${tgtT !== null ? tgtT.toFixed(1) : '—'}°</div>
              <div class="s-l">Уставка</div>
            </div>
            <div class="sensor">
              <div class="s-ico">${this._icons.delta}</div>
              <div class="s-v">${dT !== null ? dT.toFixed(1) : '—'}°</div>
              <div class="s-l">ΔT</div>
              <div class="pbar-wrap"><div class="pbar ${dtCls}" style="width:${dtPct}%"></div></div>
            </div>
            <div class="sensor">
              <div class="s-ico ${isH ? 'heat' : ''}">${this._icons.flame}</div>
              <div class="s-v ${isH ? 'heat' : ''}">${isH ? 'Да' : 'Нет'}</div>
              <div class="s-l">Нагрев</div>
            </div>
          </div>

          <!-- DIAGNOSTICS -->
          ${C.show_diagnostics !== false ? `
            <div class="diag ${isH ? diag.cls : 'hide'}">
              <span class="d-em">${diag.emoji}</span>
              <div class="d-b">
                <div class="d-t">${diag.title}</div>
                ${diag.text ? `<div>${diag.text}</div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- PRESETS -->
          ${C.show_presets !== false ? `
            <div class="presets">
              ${presets.map(p => `<button class="pre ${cTarget != null && Math.abs(p - parseFloat(cTarget)) < 0.1 ? 'on' : ''}" data-t="${p}">${p}°</button>`).join('')}
            </div>
          ` : ''}

          <!-- MODES -->
          <div class="modes">
            ${hvacModes.map(m => `<button class="mode ${m === hvac ? 'on' : ''} ${m}" data-m="${m}">${mIco[m] || ''} ${mLbl[m] || m}</button>`).join('')}
          </div>

        </div>
      </ha-card>
    `;

    this._bind(isOff);
  }

  /* ── Event Binding ─────────────────────────── */

  private _bind(isOff: boolean) {
    const $ = (id: string) => this._root.getElementById(id);

    // +/- buttons with reliable adjustTemp
    const downBtn = $('t-dn');
    const upBtn = $('t-up');

    if (downBtn) {
      downBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        this._adjustTemp(-1);
      });
    }
    if (upBtn) {
      upBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        this._adjustTemp(1);
      });
    }

    $('pwr')?.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      this._setMode(isOff ? 'heat' : 'off');
    });

    this._root.querySelectorAll('.pre').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t = parseFloat((e.currentTarget as HTMLElement).dataset.t || '20');
        this._setPreset(t);
      });
    });

    this._root.querySelectorAll('.mode').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const m = (e.currentTarget as HTMLElement).dataset.m || 'off';
        this._setMode(m);
      });
    });
  }
}

/* ═══════════════════ Register ═══════════════════ */

customElements.define('altal-heatpump-card', AltalHeatpumpCard);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'altal-heatpump-card',
  name: 'Altal Heater Card',
  description: 'Premium neumorphic card for Altal heat pump',
  preview: true,
  documentationURL: 'https://github.com/skeep83/altal_heater_card',
});

console.info(
  '%c ALTAL-HEATER-CARD %c v3.0.0 ',
  'color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;',
  'color: #e6642f; background: #e6e7ee; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;'
);
