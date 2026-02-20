/**
 * Altal Heater Card — Home Assistant Lovelace Custom Card
 * Premium neumorphic card for Altal heat pump
 * Themesberg Neumorphism UI style
 * v2.0.0
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
  show_graph?: boolean;
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
  themes?: { darkMode?: boolean };
}

interface TempRecord { temp: number; ts: number; }

/* ═══════════════════ Card Class ═══════════════════ */

class AltalHeatpumpCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;
  private _history: TempRecord[] = [];
  private _debounce: ReturnType<typeof setTimeout> | null = null;
  private _animFrame: number | null = null;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  /* ── HA lifecycle ──────────────────────────────── */

  static getConfigElement() { return document.createElement('altal-heatpump-card-editor'); }

  static getStubConfig() {
    return {
      climate_entity: 'climate.altal_home_heater',
      current_temp_entity: 'sensor.altal_current_temp',
      target_temp_entity: 'sensor.altal_target_temp',
      delta_t_entity: 'sensor.altal_delta_t',
      heating_entity: 'binary_sensor.altal_heating',
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: true,
      show_presets: true,
      show_controls: true,
      show_image: true,
      show_graph: false,
      compact: false,
    };
  }

  setConfig(config: CardConfig) {
    if (!config.climate_entity) throw new Error('Укажите climate_entity');
    this._config = {
      step: 0.5,
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: true,
      show_presets: true,
      show_controls: true,
      show_image: true,
      show_graph: false,
      compact: false,
      ...config,
    };
    if (this._hass) this._render();
  }

  set hass(hass: Hass) {
    const prev = this._hass;
    this._hass = hass;

    const cur = this._sensorVal(hass, this._config.current_temp_entity);
    if (cur !== null) {
      const now = Date.now();
      this._history.push({ temp: cur, ts: now });
      this._history = this._history.filter(r => r.ts > now - 30 * 60_000);
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

  getCardSize() { return this._config?.compact ? 4 : 7; }

  /* ── Helpers ───────────────────────────────────── */

  private _sensorVal(hass: Hass, eid: string): number | null {
    const s = hass?.states?.[eid];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const n = parseFloat(s.state);
    return isNaN(n) ? null : n;
  }

  private _trend(): 'rising' | 'falling' | 'stable' {
    if (this._history.length < 3) return 'stable';
    const r = this._history.slice(-5);
    const d = r[r.length - 1].temp - r[0].temp;
    if (d > 0.3) return 'rising';
    if (d < -0.3) return 'falling';
    return 'stable';
  }

  private _dtDiag(dt: number, cur: number, tgt: number, heating: boolean): { emoji: string; title: string; text: string; cls: string } {
    if (!heating) return { emoji: '', title: '', text: '', cls: '' };
    if (dt === 0) return { emoji: '⏳', title: 'Нет данных по ΔT', text: '', cls: 'neutral' };
    const diff = tgt - cur;
    if (diff >= 1.5 && (dt <= 2 || dt >= 10))
      return { emoji: '🧊', title: 'Переходный режим / дефрост', text: `${cur}°C → ${tgt}°C (${diff.toFixed(1)}°C). ΔT=${dt}°C`, cls: 'info' };
    if (diff <= 0.7)
      return { emoji: '🟢', title: 'Режим поддержания', text: `${cur}→${tgt}°C. ΔT=${dt}°C — норма`, cls: 'good' };
    if (dt >= 4 && dt <= 7)
      return { emoji: '✅', title: `ΔT оптимум: ${dt}°C`, text: '', cls: 'good' };
    if (dt < 4)
      return { emoji: '⚠️', title: `ΔT низкий: ${dt}°C`, text: 'Проверьте расход / контуры', cls: 'warn' };
    return { emoji: '⚠️', title: `ΔT высокий: ${dt}°C`, text: 'Проверьте фильтры / циркуляцию', cls: 'warn' };
  }

  /* ── Actions ───────────────────────────────────── */

  private _setTemp(temp: number) {
    if (this._debounce) clearTimeout(this._debounce);
    this._debounce = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity, temperature: temp,
      });
    }, 350);
  }

  private _setMode(mode: string) {
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.climate_entity, hvac_mode: mode,
    });
  }

  /* ── Animated counter ──────────────────────────── */

  private _animateCounters() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);
    const counters = this._root.querySelectorAll('[data-count]');
    counters.forEach((el) => {
      const target = parseFloat((el as HTMLElement).dataset.count || '0');
      const suffix = (el as HTMLElement).dataset.suffix || '';
      let current = 0;
      const duration = 800;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        current = target * eased;
        el.textContent = current.toFixed(1) + suffix;
        if (progress < 1) {
          this._animFrame = requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    });
  }

  /* ── SVG Icons ─────────────────────────────────── */
  private _svg = {
    flame: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7c.3-.3.8-.3 1.1 0 .5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2 .2-.3.7-.4 1-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7zm-2.6-7.7c-.2.6-.4 1.3-.4 1.7 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.6-1-3.4-2.2-4.8-.4.6-.9 1.2-1.2 1.6-.3.3-.8.4-1.1.1-.4-.4-.8-.9-1.1-1.6z"/></svg>`,
    power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9"/><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    thermo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-9a1 1 0 0 1 1 1v3h-2V5a1 1 0 0 1 1-1z"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    delta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 4L4 20h16L12 4z"/></svg>`,
    arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H10M17 7V14"/></svg>`,
    arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 7L17 17M17 17H10M17 17V10"/></svg>`,
    stable: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12H19"/></svg>`,
    heat: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7c.3-.3.8-.3 1.1 0 .5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2 .2-.3.7-.4 1-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7z"/></svg>`,
    off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`,
  };

  /* ══════════════════ STYLES ══════════════════ */

  private _getStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap');

      :host {
        /* ═══ Themesberg Neumorphism tokens ═══
         * Use HA theme vars with Themesberg fallbacks.
         * Background: #e6e7ee (Themesberg signature gray-lavender)
         */
        --neu-bg: var(--card-background-color, #e6e7ee);
        --neu-bg-alt: var(--secondary-background-color, #d1d9e6);
        --neu-text: var(--primary-text-color, #44476a);
        --neu-text-secondary: var(--secondary-text-color, #7b7e8a);
        --neu-primary: var(--primary-color, #e6642f);

        /* Neumorphic shadows — Themesberg-style soft shadows */
        --neu-shadow-raised: 6px 6px 12px rgba(163,177,198,0.6), -6px -6px 12px rgba(255,255,255,0.5);
        --neu-shadow-raised-sm: 3px 3px 6px rgba(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.4);
        --neu-shadow-inset: inset 2px 2px 5px rgba(163,177,198,0.7), inset -3px -3px 7px rgba(255,255,255,0.5);
        --neu-shadow-inset-sm: inset 1px 1px 3px rgba(163,177,198,0.5), inset -2px -2px 4px rgba(255,255,255,0.4);
        --neu-shadow-btn: 5px 5px 10px rgba(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5);
        --neu-shadow-btn-press: inset 3px 3px 6px rgba(163,177,198,0.7), inset -3px -3px 6px rgba(255,255,255,0.5);

        /* Accent colors */
        --c-heating: #e6642f;
        --c-heating-glow: rgba(230, 100, 47, 0.25);
        --c-idle: #93a5be;
        --c-good: #05a677;
        --c-warn: #f5b759;
        --c-info: #0948b3;
        --c-danger: #fa5252;
        --c-off: #93a5be;

        display: block;
        width: 100%;
        box-sizing: border-box;
        position: relative;
        z-index: 0;
        isolation: isolate;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      /* ═══ Card Shell ═══ */
      .card {
        background: var(--neu-bg);
        border-radius: 16px;
        box-shadow: var(--neu-shadow-raised);
        overflow: hidden;
        font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: var(--neu-text);
        transition: box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1);
        position: relative;
      }

      .card:hover {
        transform: translateY(-3px);
        box-shadow: 8px 8px 18px rgba(163,177,198,0.65), -8px -8px 18px rgba(255,255,255,0.55);
      }

      /* ═══ HERO ═══ */
      .hero {
        position: relative;
        width: 100%;
        height: 170px;
        overflow: hidden;
        background: linear-gradient(135deg, #31344b 0%, #44476a 50%, #2e305e 100%);
      }

      .hero img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        filter: drop-shadow(0 10px 30px rgba(0,0,0,0.35));
        transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        animation: hero-float 4s ease-in-out infinite;
      }

      @keyframes hero-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }

      .card:hover .hero img {
        transform: scale(1.05) translateY(-3px);
        animation: none;
      }

      .hero-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg,
          transparent 30%,
          rgba(49,52,75,0.3) 65%,
          var(--neu-bg) 100%
        );
        pointer-events: none;
      }

      /* Status Badge */
      .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 24px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: badge-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      @keyframes badge-in {
        0% { opacity: 0; transform: translateY(-10px) scale(0.8); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }

      .status-badge .dot {
        width: 8px; height: 8px; border-radius: 50%;
        transition: all 0.3s;
      }

      .status-badge.heating {
        background: rgba(230, 100, 47, 0.15);
        color: #ff8a65;
        border: 1px solid rgba(230, 100, 47, 0.25);
      }
      .status-badge.heating .dot {
        background: var(--c-heating);
        box-shadow: 0 0 10px var(--c-heating), 0 0 20px rgba(230,100,47,0.3);
        animation: dot-pulse 1.5s ease-in-out infinite;
      }

      .status-badge.idle {
        background: rgba(147, 165, 190, 0.15);
        color: #b0bec5;
        border: 1px solid rgba(147, 165, 190, 0.2);
      }
      .status-badge.idle .dot { background: var(--c-idle); }

      .status-badge.off {
        background: rgba(80, 80, 100, 0.15);
        color: #999;
        border: 1px solid rgba(80, 80, 100, 0.2);
      }
      .status-badge.off .dot { background: #777; }

      @keyframes dot-pulse {
        0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 6px var(--c-heating); }
        50% { transform: scale(1.5); opacity: 0.6; box-shadow: 0 0 16px var(--c-heating); }
      }

      /* No-image fallback */
      .hero.no-img {
        display: flex; align-items: center; justify-content: center;
      }
      .hero.no-img .brand-text {
        font-size: 42px; font-weight: 800; letter-spacing: 10px;
        color: rgba(255,255,255,0.08); text-transform: uppercase;
      }

      /* ═══ BODY ═══ */
      .body { padding: 20px 22px 22px; }

      /* ── Header ── */
      .header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 18px;
        animation: fade-up 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      @keyframes fade-up {
        0% { opacity: 0; transform: translateY(12px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .header h2 {
        font-size: 20px; font-weight: 800; color: var(--neu-text); line-height: 1.2;
      }

      .header .sub {
        font-size: 12px; color: var(--neu-text-secondary); margin-top: 3px; font-weight: 400;
      }

      .power-btn {
        width: 44px; height: 44px; border-radius: 50%; border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-btn);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        color: var(--c-off);
      }
      .power-btn:hover {
        box-shadow: 7px 7px 14px rgba(163,177,198,0.65), -7px -7px 14px rgba(255,255,255,0.55);
        transform: scale(1.05);
      }
      .power-btn:active, .power-btn.pressed {
        box-shadow: var(--neu-shadow-btn-press);
        transform: scale(0.95);
      }
      .power-btn.on { color: var(--c-heating); }
      .power-btn svg { width: 22px; height: 22px; }

      /* ═══ MAIN TEMP DISPLAY ═══ */
      .temp-section {
        display: flex; align-items: center; justify-content: center;
        margin: 4px 0 22px;
        animation: fade-up 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      .temp-circle-outer {
        width: 170px; height: 170px; border-radius: 50%;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-raised);
        display: flex; align-items: center; justify-content: center;
        position: relative;
        transition: box-shadow 0.3s;
      }

      .temp-circle-outer:hover {
        box-shadow: 8px 8px 16px rgba(163,177,198,0.65), -8px -8px 16px rgba(255,255,255,0.55);
      }

      .temp-circle-inner {
        width: 142px; height: 142px; border-radius: 50%;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; z-index: 2; overflow: hidden;
      }

      /* Heating glow inside circle */
      .temp-glow {
        position: absolute; inset: 0; border-radius: 50%;
        pointer-events: none; opacity: 0;
        transition: opacity 0.6s;
      }
      .temp-glow.active {
        background: radial-gradient(circle at center, var(--c-heating-glow) 0%, transparent 65%);
        opacity: 1;
        animation: inner-glow 2.5s ease-in-out infinite;
      }
      @keyframes inner-glow {
        0%, 100% { opacity: 0.5; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
      }

      /* Spinning ring */
      .spin-ring {
        position: absolute; inset: -4px; border-radius: 50%;
        pointer-events: none; opacity: 0;
        transition: opacity 0.5s;
      }
      .spin-ring.active {
        opacity: 1;
        border: 3px solid transparent;
        border-top-color: var(--c-heating);
        border-right-color: rgba(230,100,47,0.4);
        animation: spin 2.5s linear infinite;
        filter: drop-shadow(0 0 4px var(--c-heating-glow));
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Expanding ripple */
      .ripple-ring {
        position: absolute; inset: 10px; border-radius: 50%;
        pointer-events: none; opacity: 0;
      }
      .ripple-ring.active {
        border: 2px solid rgba(230,100,47,0.2);
        animation: ripple-expand 2.5s ease-out infinite;
      }
      @keyframes ripple-expand {
        0% { transform: scale(0.85); opacity: 0.7; }
        100% { transform: scale(1.25); opacity: 0; }
      }

      .temp-label {
        font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
        color: var(--neu-text-secondary); font-weight: 600;
        position: relative; z-index: 3;
      }

      .temp-value {
        font-size: 44px; font-weight: 300; line-height: 1;
        color: var(--neu-text); margin-top: 2px;
        position: relative; z-index: 3;
        transition: color 0.4s;
      }
      .temp-value .unit { font-size: 18px; font-weight: 400; vertical-align: super; margin-left: 1px; }
      .temp-value.heating { color: var(--c-heating); }

      .temp-trend {
        display: flex; align-items: center; gap: 3px;
        margin-top: 6px; font-size: 10px; font-weight: 600;
        position: relative; z-index: 3;
        transition: color 0.4s;
      }
      .temp-trend svg { width: 14px; height: 14px; }
      .temp-trend.rising { color: var(--c-heating); }
      .temp-trend.falling { color: var(--c-info); }
      .temp-trend.stable { color: var(--c-good); }

      /* ═══ SENSOR GRID ═══ */
      .sensors {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 10px; margin-bottom: 18px;
        animation: fade-up 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      .sensor {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-raised-sm);
        border-radius: 14px; padding: 14px 6px;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        cursor: default;
        animation: sensor-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .sensor:nth-child(1) { animation-delay: 0.15s; }
      .sensor:nth-child(2) { animation-delay: 0.25s; }
      .sensor:nth-child(3) { animation-delay: 0.35s; }
      .sensor:nth-child(4) { animation-delay: 0.45s; }

      @keyframes sensor-pop {
        0% { opacity: 0; transform: scale(0.8) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }

      .sensor:hover {
        transform: translateY(-3px);
        box-shadow: 6px 6px 14px rgba(163,177,198,0.65), -6px -6px 14px rgba(255,255,255,0.55);
      }

      .sensor:active {
        box-shadow: var(--neu-shadow-inset-sm);
        transform: translateY(0);
      }

      .sensor .s-icon {
        width: 36px; height: 36px; border-radius: 12px;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset-sm);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 8px;
        color: var(--neu-text-secondary);
        transition: all 0.3s;
      }
      .sensor .s-icon svg { width: 18px; height: 18px; }
      .sensor .s-icon.heating { color: var(--c-heating); }
      .sensor .s-icon.good { color: var(--c-good); }

      .sensor .s-val {
        font-size: 18px; font-weight: 700;
        color: var(--neu-text); line-height: 1.2;
        transition: all 0.3s;
      }
      .sensor .s-val.heating { color: var(--c-heating); }

      .sensor .s-lbl {
        font-size: 9px; font-weight: 700; color: var(--neu-text-secondary);
        text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px;
      }

      /* ═══ PROGRESS BAR (mini ΔT gauge) ═══ */
      .progress-wrap {
        margin: 0 2px 0;
        height: 4px; border-radius: 4px;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset-sm);
        overflow: hidden;
        margin-top: 8px;
      }
      .progress-bar {
        height: 100%; border-radius: 4px;
        transition: width 1s cubic-bezier(0.4,0,0.2,1), background 0.3s;
      }
      .progress-bar.good { background: linear-gradient(90deg, var(--c-good), #2ecc71); }
      .progress-bar.warn { background: linear-gradient(90deg, var(--c-warn), #e67e22); }
      .progress-bar.danger { background: linear-gradient(90deg, var(--c-danger), #e74c3c); }

      /* ═══ DIAGNOSTICS ═══ */
      .diagnostics {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        border-radius: 14px; padding: 14px 16px;
        margin-bottom: 18px;
        display: flex; align-items: flex-start; gap: 12px;
        font-size: 13px; line-height: 1.5;
        color: var(--neu-text-secondary);
        animation: fade-up 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        transition: all 0.3s;
      }
      .diagnostics.hidden { display: none; }
      .diagnostics .d-emoji { font-size: 22px; flex-shrink: 0; }
      .diagnostics .d-body { flex: 1; }
      .diagnostics .d-title { font-weight: 700; color: var(--neu-text); margin-bottom: 2px; }
      .diagnostics.good .d-title { color: var(--c-good); }
      .diagnostics.warn .d-title { color: var(--c-warn); }
      .diagnostics.info .d-title { color: var(--c-info); }

      /* ═══ CONTROLS ═══ */
      .controls {
        display: flex; align-items: center; justify-content: center;
        gap: 18px; margin-bottom: 16px;
        animation: fade-up 0.5s 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      .ctrl-btn {
        width: 50px; height: 50px; border-radius: 50%; border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-btn);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--neu-text); font-size: 20px;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .ctrl-btn:hover {
        transform: scale(1.08);
        box-shadow: 7px 7px 14px rgba(163,177,198,0.65), -7px -7px 14px rgba(255,255,255,0.55);
      }
      .ctrl-btn:active {
        box-shadow: var(--neu-shadow-btn-press);
        transform: scale(0.92);
      }
      .ctrl-btn svg { width: 22px; height: 22px; }

      .ctrl-display {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        border-radius: 16px; padding: 10px 24px;
        text-align: center; min-width: 110px;
      }
      .ctrl-display .cd-lbl {
        font-size: 9px; text-transform: uppercase;
        letter-spacing: 1.2px; color: var(--neu-text-secondary); font-weight: 700;
      }
      .ctrl-display .cd-val {
        font-size: 28px; font-weight: 700; color: var(--neu-text);
        line-height: 1.3; transition: color 0.3s;
      }
      .ctrl-display .cd-val.heating { color: var(--c-heating); }

      /* ═══ PRESETS ═══ */
      .presets {
        display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
        margin-bottom: 16px;
        animation: fade-up 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      .preset-chip {
        padding: 10px 18px; border-radius: 24px; border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-raised-sm);
        cursor: pointer; font-family: inherit;
        font-size: 14px; font-weight: 600;
        color: var(--neu-text);
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .preset-chip:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 5px 5px 12px rgba(163,177,198,0.65), -5px -5px 12px rgba(255,255,255,0.55);
      }
      .preset-chip:active {
        box-shadow: var(--neu-shadow-btn-press);
        transform: scale(0.95);
      }
      .preset-chip.active {
        color: var(--c-heating);
        box-shadow: var(--neu-shadow-btn-press);
        font-weight: 700;
      }

      /* ═══ HVAC MODES ═══ */
      .hvac-row {
        display: flex; gap: 10px; justify-content: center;
        animation: fade-up 0.5s 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
      }

      .hvac-btn {
        padding: 10px 18px; border-radius: 14px; border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-raised-sm);
        cursor: pointer; font-family: inherit;
        font-size: 12px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.8px;
        color: var(--neu-text-secondary);
        display: flex; align-items: center; gap: 8px;
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      .hvac-btn:hover {
        transform: translateY(-2px);
        box-shadow: 5px 5px 12px rgba(163,177,198,0.65), -5px -5px 12px rgba(255,255,255,0.55);
      }
      .hvac-btn:active {
        box-shadow: var(--neu-shadow-btn-press);
        transform: scale(0.95);
      }
      .hvac-btn.active {
        box-shadow: var(--neu-shadow-btn-press);
      }
      .hvac-btn.active.heat { color: var(--c-heating); }
      .hvac-btn.active.off { color: var(--c-off); }
      .hvac-btn svg { width: 16px; height: 16px; }

      /* ═══ ERROR ═══ */
      .error {
        padding: 40px 24px; text-align: center;
        background: var(--neu-bg); border-radius: 16px;
        box-shadow: var(--neu-shadow-raised);
      }
      .error h3 { font-size: 18px; font-weight: 700; color: var(--c-danger); margin-bottom: 10px; }
      .error p { font-size: 14px; color: var(--neu-text-secondary); }
      .error code { font-size: 12px; color: var(--neu-text-secondary); background: var(--neu-bg-alt); padding: 4px 8px; border-radius: 6px; }
    `;
  }

  /* ══════════════════ RENDER ══════════════════ */

  private _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._getStyles()}</style><div class="card"><div class="body" style="padding:40px;text-align:center;color:var(--neu-text-secondary)">Загрузка…</div></div>`;
      return;
    }

    const C = this._config;
    const H = this._hass;
    const climate = H.states[C.climate_entity];

    if (!climate) {
      this._root.innerHTML = `<style>${this._getStyles()}</style><div class="error"><h3>Entity не найден</h3><p><code>${C.climate_entity}</code></p></div>`;
      return;
    }

    const curTemp = this._sensorVal(H, C.current_temp_entity);
    const tgtTemp = this._sensorVal(H, C.target_temp_entity);
    const deltaT = this._sensorVal(H, C.delta_t_entity);
    const heatState = H.states[C.heating_entity];
    const isHeating = heatState?.state === 'on';
    const hvac = climate.state;
    const isOff = hvac === 'off';
    const climateTarget = climate.attributes.temperature;
    const hvacModes: string[] = climate.attributes.hvac_modes || ['heat', 'off'];
    const name = C.name || climate.attributes.friendly_name || 'Altal Heat Pump';
    const presets = C.quick_presets || [19, 20, 22, 24];
    const step = C.step || 0.5;

    const trend = this._trend();
    const trendSvg = trend === 'rising' ? this._svg.arrowUp : trend === 'falling' ? this._svg.arrowDown : this._svg.stable;
    const trendText = trend === 'rising' ? 'Растёт' : trend === 'falling' ? 'Падает' : 'Стабильно';

    const diag = this._dtDiag(deltaT ?? 0, curTemp ?? 0, tgtTemp ?? 0, isHeating);

    let badgeCls = 'off', badgeText = 'Выкл';
    if (isHeating) { badgeCls = 'heating'; badgeText = 'Нагрев'; }
    else if (!isOff) { badgeCls = 'idle'; badgeText = 'Ожидание'; }

    const modeLabels: Record<string, string> = { heat: 'Обогрев', off: 'Выкл', cool: 'Охлаждение', auto: 'Авто' };
    const modeIcons: Record<string, string> = { heat: this._svg.flame, off: this._svg.off, cool: this._svg.off, auto: this._svg.thermo };

    // ΔT progress (0–10 scale)
    const dtPct = deltaT != null ? Math.min(100, (deltaT / 10) * 100) : 0;
    const dtBarCls = deltaT != null ? (deltaT >= 4 && deltaT <= 7 ? 'good' : deltaT < 2 || deltaT > 10 ? 'danger' : 'warn') : 'good';

    // Hero
    const showHero = C.show_image !== false;
    const heroHtml = showHero ? (C.image
      ? `<div class="hero"><img src="${C.image}" alt="Altal"/><div class="hero-gradient"></div><div class="status-badge ${badgeCls}"><span class="dot"></span>${badgeText}</div></div>`
      : `<div class="hero no-img"><span class="brand-text">ALTAL</span><div class="hero-gradient"></div><div class="status-badge ${badgeCls}"><span class="dot"></span>${badgeText}</div></div>`
    ) : '';

    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <ha-card>
        <div class="card">
          ${heroHtml}

          <div class="body">
            <!-- Header -->
            <div class="header">
              <div>
                <h2>${name}</h2>
                <div class="sub">Тепловой насос • ${modeLabels[hvac] || hvac}</div>
              </div>
              <button class="power-btn ${isOff ? '' : 'on'}" id="pwr">${this._svg.power}</button>
            </div>

            <!-- Temperature Ring -->
            <div class="temp-section">
              <div class="temp-circle-outer">
                <div class="spin-ring ${isHeating ? 'active' : ''}"></div>
                <div class="ripple-ring ${isHeating ? 'active' : ''}"></div>
                <div class="temp-circle-inner">
                  <div class="temp-glow ${isHeating ? 'active' : ''}"></div>
                  <span class="temp-label">Сейчас</span>
                  <span class="temp-value ${isHeating ? 'heating' : ''}" data-count="${curTemp ?? 0}" data-suffix="°C">
                    ${curTemp !== null ? curTemp.toFixed(1) : '—'}°C
                  </span>
                  <span class="temp-trend ${trend}">${trendSvg} ${trendText}</span>
                </div>
              </div>
            </div>

            <!-- Sensor Grid -->
            <div class="sensors">
              <div class="sensor">
                <div class="s-icon ${isHeating ? 'heating' : ''}">${this._svg.thermo}</div>
                <div class="s-val" data-count="${curTemp ?? 0}" data-suffix="°">${curTemp !== null ? curTemp.toFixed(1) : '—'}°</div>
                <div class="s-lbl">Сейчас</div>
              </div>
              <div class="sensor">
                <div class="s-icon">${this._svg.target}</div>
                <div class="s-val" data-count="${tgtTemp ?? 0}" data-suffix="°">${tgtTemp !== null ? tgtTemp.toFixed(1) : '—'}°</div>
                <div class="s-lbl">Уставка</div>
              </div>
              <div class="sensor">
                <div class="s-icon">${this._svg.delta}</div>
                <div class="s-val" data-count="${deltaT ?? 0}" data-suffix="°">${deltaT !== null ? deltaT.toFixed(1) : '—'}°</div>
                <div class="s-lbl">ΔT</div>
                <div class="progress-wrap"><div class="progress-bar ${dtBarCls}" style="width:${dtPct}%"></div></div>
              </div>
              <div class="sensor">
                <div class="s-icon ${isHeating ? 'heating' : ''}">${this._svg.flame}</div>
                <div class="s-val ${isHeating ? 'heating' : ''}">${isHeating ? 'Да' : 'Нет'}</div>
                <div class="s-lbl">Нагрев</div>
              </div>
            </div>

            <!-- Diagnostics -->
            ${C.show_diagnostics !== false ? `
              <div class="diagnostics ${isHeating ? diag.cls : 'hidden'}">
                <span class="d-emoji">${diag.emoji}</span>
                <div class="d-body">
                  <div class="d-title">${diag.title}</div>
                  ${diag.text ? `<div>${diag.text}</div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Controls -->
            ${C.show_controls !== false ? `
              <div class="controls">
                <button class="ctrl-btn" id="t-down">${this._svg.minus}</button>
                <div class="ctrl-display">
                  <div class="cd-lbl">Уставка</div>
                  <div class="cd-val ${isHeating ? 'heating' : ''}">${climateTarget != null ? parseFloat(climateTarget).toFixed(1) : '—'}°</div>
                </div>
                <button class="ctrl-btn" id="t-up">${this._svg.plus}</button>
              </div>
            ` : ''}

            <!-- Presets -->
            ${C.show_presets !== false ? `
              <div class="presets">
                ${presets.map(p => `
                  <button class="preset-chip ${climateTarget != null && Math.abs(p - parseFloat(climateTarget)) < 0.1 ? 'active' : ''}" data-temp="${p}">${p}°</button>
                `).join('')}
              </div>
            ` : ''}

            <!-- HVAC Modes -->
            <div class="hvac-row">
              ${hvacModes.map(m => `
                <button class="hvac-btn ${m === hvac ? 'active' : ''} ${m}" data-mode="${m}">
                  ${modeIcons[m] || ''} ${modeLabels[m] || m}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </ha-card>
    `;

    this._bindEvents(climateTarget, step, isOff);
    requestAnimationFrame(() => this._animateCounters());
  }

  /* ── Events ────────────────────────────────────── */

  private _bindEvents(target: any, step: number, isOff: boolean) {
    const $ = (id: string) => this._root.getElementById(id);

    $('t-down')?.addEventListener('click', () => {
      if (target != null) this._setTemp(parseFloat(target) - step);
    });
    $('t-up')?.addEventListener('click', () => {
      if (target != null) this._setTemp(parseFloat(target) + step);
    });
    $('pwr')?.addEventListener('click', () => {
      this._setMode(isOff ? 'heat' : 'off');
    });

    this._root.querySelectorAll('.preset-chip').forEach(el => {
      el.addEventListener('click', (e) => {
        const t = parseFloat((e.currentTarget as HTMLElement).dataset.temp || '20');
        this._setTemp(t);
      });
    });

    this._root.querySelectorAll('.hvac-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const m = (e.currentTarget as HTMLElement).dataset.mode || 'off';
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
  description: 'Premium neumorphic card for Altal heat pump — Themesberg style',
  preview: true,
  documentationURL: 'https://github.com/skeep83/altal_heater_card',
});

console.info(
  '%c ALTAL-HEATER-CARD %c v2.0.0 ',
  'color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;',
  'color: #e6642f; background: #e6e7ee; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;'
);
