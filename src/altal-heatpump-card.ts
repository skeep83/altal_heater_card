/**
 * Altal Heater Card — Home Assistant Lovelace Custom Card
 * Premium neumorphic card — Smart Home App style
 * v4.0.0
 */

import './altal-heatpump-card-editor';

/* ═══════════════════ Types ═══════════════════ */

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

  // v4.2.0 Additions
  text_color?: string;
  animation_color?: string;
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

/* ═══════════════════ Card ═══════════════════ */

class AltalHeatpumpCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;
  private _history: { t: number; ts: number }[] = [];
  private _pendingTarget: number | null = null;
  private _svcTimer: ReturnType<typeof setTimeout> | null = null;
  private _cachedGraph: Record<string, { time: number; svg: string; min: number; max: number }> = {};
  private _activeGraphEntity: string | null = null;

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
      text_color: '',
      animation_color: ''
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

    const c = this._v(hass, this._config.current_temp_entity);
    if (c !== null) {
      const now = Date.now();
      this._history.push({ t: c, ts: now });
      this._history = this._history.filter(r => r.ts > now - 30 * 60_000);
    }

    if (this._pendingTarget !== null) {
      const haT = hass.states[this._config.climate_entity]?.attributes?.temperature;
      if (haT != null && Math.abs(parseFloat(haT) - this._pendingTarget) < 0.01)
        this._pendingTarget = null;
    }

    const chg = !prev ||
      prev.states[this._config.climate_entity] !== hass.states[this._config.climate_entity] ||
      prev.states[this._config.current_temp_entity] !== hass.states[this._config.current_temp_entity] ||
      prev.states[this._config.target_temp_entity] !== hass.states[this._config.target_temp_entity] ||
      prev.states[this._config.delta_t_entity] !== hass.states[this._config.delta_t_entity] ||
      prev.states[this._config.heating_entity] !== hass.states[this._config.heating_entity];

    if (chg) this._render();
  }

  getCardSize() { return this._config?.compact ? 4 : 7; }

  /* ── Helpers ───────────────────────────── */

  private _v(h: Hass, e: string): number | null {
    const s = h?.states?.[e];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const n = parseFloat(s.state);
    return isNaN(n) ? null : n;
  }

  private _trend(): 'up' | 'down' | 'flat' {
    if (this._history.length < 3) return 'flat';
    const r = this._history.slice(-5);
    const d = r[r.length - 1].t - r[0].t;
    return d > 0.3 ? 'up' : d < -0.3 ? 'down' : 'flat';
  }

  /**
   * ΔT Diagnostic logic:
   * ΔT = temperature difference between supply (подача) and return (обратка).
   * Optimal range: 4–7°C when actively heating.
   * 
   * States:
   * - Not heating → no diagnostic shown
   * - ΔT = 0 or unavailable → "waiting for data"
   * - Near setpoint (diff ≤ 0.7°C) → modulation mode, low ΔT is normal
   * - Far from setpoint + abnormal ΔT → transitional/defrost
   * - ΔT 4–7°C → optimal
   * - ΔT < 4°C → too low (high flow rate, many circuits, low compressor power)
   * - ΔT > 7°C → too high (restricted flow, dirty filter, air in system)
   */
  private _dtDiag(dt: number | null, cur: number | null, tgt: number | null, heating: boolean) {
    const empty = { icon: '', title: '', text: '', cls: 'hide' };
    if (!heating) return empty;
    if (dt === null || dt === 0) return { icon: '⏳', title: 'Ожидание данных ΔT', text: 'Данные ещё не получены', cls: 'neutral' };

    const diff = (tgt ?? 0) - (cur ?? 0);

    // Near setpoint → modulation, low ΔT expected
    if (diff <= 0.7 && diff >= -0.5) {
      return {
        icon: '🟢', title: 'Режим поддержания',
        text: `Температура близка к уставке. ΔT ${dt.toFixed(1)}°C — нормально при модуляции`,
        cls: 'good'
      };
    }

    // Far from setpoint + suspicious ΔT → transitional/defrost
    if (diff >= 1.5 && (dt < 2 || dt > 10)) {
      return {
        icon: '🧊', title: 'Переходный режим',
        text: `Нагрев: ${cur?.toFixed(1)} → ${tgt?.toFixed(1)}°C. ΔT=${dt.toFixed(1)}°C — ещё не стабилизировался`,
        cls: 'info'
      };
    }

    // Optimal ΔT
    if (dt >= 4 && dt <= 7) {
      return {
        icon: '✅', title: `ΔT в норме: ${dt.toFixed(1)}°C`,
        text: 'Оптимальная разница подача–обратка',
        cls: 'good'
      };
    }

    // ΔT too low
    if (dt < 4) {
      return {
        icon: '⚠️', title: `ΔT низкий: ${dt.toFixed(1)}°C`,
        text: 'Возможные причины: высокий расход, много контуров, низкая мощность компрессора',
        cls: 'warn'
      };
    }

    // ΔT too high (> 7)
    return {
      icon: '⚠️', title: `ΔT высокий: ${dt.toFixed(1)}°C`,
      text: 'Возможные причины: малый расход, засорён фильтр, воздух в системе, закрыты клапаны',
      cls: 'warn'
    };
  }

  /* ── Actions ───────────────────────────── */

  private _adjust(dir: number) {
    const step = this._config.step || 0.5;
    const cl = this._hass.states[this._config.climate_entity];
    const base = this._pendingTarget ?? parseFloat(cl?.attributes?.temperature);
    if (isNaN(base)) return;

    const next = Math.round((base + dir * step) * 10) / 10;
    const clamped = Math.max(cl?.attributes?.min_temp ?? 5, Math.min(cl?.attributes?.max_temp ?? 35, next));

    this._pendingTarget = clamped;

    // Instant UI update
    const el = this._root.querySelector('.sp-val');
    if (el) el.textContent = clamped.toFixed(1) + '°';

    // Debounced service call
    if (this._svcTimer) clearTimeout(this._svcTimer);
    this._svcTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity, temperature: clamped,
      });
    }, 600);
  }

  private _preset(temp: number) {
    this._pendingTarget = temp;
    const el = this._root.querySelector('.sp-val');
    if (el) el.textContent = temp.toFixed(1) + '°';
    if (this._svcTimer) clearTimeout(this._svcTimer);
    this._svcTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity, temperature: temp,
      });
    }, 300);
  }

  private _mode(m: string) {
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.climate_entity, hvac_mode: m,
    });
  }

  /* ── Interactive Graphs ────────────────────── */

  private async _fetchGraph(entity_id: string, name: string) {
    if (this._activeGraphEntity === entity_id) {
      this._activeGraphEntity = null; // Toggle off
      this._render();
      return;
    }

    this._activeGraphEntity = entity_id;
    this._render(); // Render loading state

    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h
    const cache = this._cachedGraph[entity_id];

    // Cache for 5 minutes
    if (cache && now.getTime() - cache.time < 300000) {
      this._render();
      return;
    }

    try {
      const startStr = past.toISOString();
      const endStr = now.toISOString();
      // Use minimal_response to save bandwidth
      const res = await (this._hass as any).callApi(
        'GET',
        `history/period/${startStr}?filter_entity_id=${entity_id}&end_time=${endStr}&minimal_response`
      );

      if (res && res[0] && res[0].length > 0) {
        let min = Infinity;
        let max = -Infinity;
        const pts: { x: number; y: number }[] = [];

        const startTime = past.getTime();
        const timeSpan = now.getTime() - startTime;

        for (const s of res[0]) {
          const val = parseFloat(s.state);
          if (isNaN(val)) continue;
          if (val < min) min = val;
          if (val > max) max = val;

          const ts = new Date(s.last_changed).getTime();
          pts.push({ x: (ts - startTime) / timeSpan, y: val });
        }

        // Add current state at 100% X
        const curStr = this._hass.states[entity_id]?.state;
        if (curStr) {
          const val = parseFloat(curStr);
          if (!isNaN(val)) {
            pts.push({ x: 1, y: val });
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }

        if (pts.length > 1) {
          // Add 10% padding to Y axis
          const spread = max - min;
          const yPad = spread === 0 ? 1 : spread * 0.1;
          const yMin = min - yPad;
          const yMax = max + yPad;
          const ySpan = yMax - yMin;

          // Generate SVG path
          const w = 300;
          const h = 60;
          let path = `M ${pts[0].x * w},${h - ((pts[0].y - yMin) / ySpan) * h}`;
          let fillPath = `${path}`;

          for (let i = 1; i < pts.length; i++) {
            const x = pts[i].x * w;
            const y = h - ((pts[i].y - yMin) / ySpan) * h;
            // Simple line for efficiency over 24h of data
            path += ` L ${x},${y}`;
          }

          fillPath = `${path} L ${w},${h} L 0,${h} Z`;

          const svg = `
            <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:60px; margin-top:10px; overflow:visible;">
              <defs>
                <linearGradient id="gf_${entity_id}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--heat)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--heat)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="${fillPath}" fill="url(#gf_${entity_id})" />
              <path d="${path}" fill="none" stroke="var(--heat)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          `;

          this._cachedGraph[entity_id] = { time: now.getTime(), svg, min, max };
          if (this._activeGraphEntity === entity_id) this._render();
        } else {
          this._activeGraphEntity = null; // Not enough data
          this._render();
        }
      }
    } catch (e) {
      console.warn("Altal Card - History fetch failed", e);
      this._activeGraphEntity = null;
      this._render();
    }
  }

  /* ── Neumorphic SVG Icons (thin stroke style) ── */
  private _ico = {
    thermo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 10-5 0v11.26a4.5 4.5 0 105 0z"/><circle cx="11.5" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="11.5" y1="14" x2="11.5" y2="18"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
    delta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 4l-8 16h16z"/></svg>`,
    flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.8 1.5-3.2 3-5 1.5 1.8 3 3.2 3 5 0 1.7-1.3 3-3 3z"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v8"/><path d="M17.66 6.34a8 8 0 11-11.32 0"/></svg>`,
    heat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/></svg>`,
    off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`,
    down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    stable: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  };

  /* ══════════════════ CSS ══════════════════ */

  private _css(): string {
    const customText = this._config?.text_color || 'var(--aerogel-text, var(--primary-text-color, #3b3f5c))';
    const customHeat = this._config?.animation_color || 'var(--aerogel-warning, #f07b3f)';

    return `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');

      :host {
        --bg: var(--aerogel-base, var(--card-background-color, #e3e6ec));
        --bg2: var(--aerogel-base-alt, var(--secondary-background-color, #d1d5db));
        --txt: ${customText};
        --txt2: var(--aerogel-text-secondary, var(--secondary-text-color, #8b8fa3));
        --accent: var(--aerogel-accent, var(--primary-color, #6CB4EE));

        --raised: var(--aerogel-convex-lg, 6px 6px 14px rgba(166,180,200,0.7), -6px -6px 14px rgba(255,255,255,0.8));
        --raised-s: var(--aerogel-convex-sm, 3px 3px 8px rgba(166,180,200,0.7), -3px -3px 8px rgba(255,255,255,0.8));
        --inset: var(--aerogel-concave-lg, inset 3px 3px 7px rgba(166,180,200,0.7), inset -3px -3px 7px rgba(255,255,255,0.8));
        --inset-s: var(--aerogel-concave-sm, inset 2px 2px 4px rgba(166,180,200,0.7), inset -2px -2px 4px rgba(255,255,255,0.8));
        --btn: var(--aerogel-flat, 4px 4px 10px rgba(166,180,200,0.7), -4px -4px 10px rgba(255,255,255,0.8));
        --btn-p: var(--aerogel-active, inset 3px 3px 7px rgba(166,180,200,0.7), inset -3px -3px 7px rgba(255,255,255,0.8));

        --heat: ${customHeat};
        --heat-g: rgba(240, 123, 63, 0.15);
        --idle: var(--aerogel-text-secondary, #93a5be);
        --good: var(--success-color, #05a677);
        --warn: var(--aerogel-warning, #e5a100);
        --info: var(--aerogel-accent, #3b82f6);

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
        font-family: var(--aerogel-font, 'Nunito', sans-serif);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      /* ─── Card ─── */
      .card {
        background: var(--bg);
        border-radius: 24px;
        box-shadow: var(--raised);
        overflow: hidden;
        font-family: 'Rubik', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: var(--txt);
        padding: clamp(16px, 5cqw, 24px);
        container-type: inline-size;
      }

      /* ─── Top ─── */
      .top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: clamp(16px, 5cqw, 24px);
      }
      .top-left { display: flex; align-items: center; gap: clamp(12px, 3cqw, 16px); }

      .pump-thumb {
        width: clamp(60px, 15cqw, 80px); aspect-ratio: 1;
        border-radius: 20px;
        background: var(--bg);
        box-shadow: var(--raised-s);
        overflow: hidden; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s;
      }
      .pump-thumb:hover { transform: scale(1.04); }
      .pump-thumb img {
        width: 100%; height: 100%;
        object-fit: cover;
      }
      .pump-thumb.empty {
        font-size: clamp(10px, 2.5cqw, 12px); font-weight: 700;
        color: var(--txt2); letter-spacing: 2px;
      }

      .top-info {}
      .top-info .name {
        font-size: clamp(16px, 4cqw, 20px); font-weight: 600;
        color: var(--txt); line-height: 1.3;
      }
      .top-info .status {
        font-size: clamp(11px, 2.8cqw, 13px); font-weight: 400;
        color: var(--txt2); margin-top: 4px;
      }

      .top-right {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: clamp(6px, 2cqw, 10px);
      }

      /* Badge */
      .badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 14px; border-radius: 20px;
        font-size: clamp(9px, 2cqw, 11px); font-weight: 600;
        letter-spacing: 0.5px;
      }
      .badge .dot { width: 7px; height: 7px; border-radius: 50%; }
      .badge.heating { background: rgba(230,100,47,0.1); color: var(--heat); }
      .badge.heating .dot { background: var(--heat); box-shadow: 0 0 6px var(--heat); animation: blink 1.4s ease-in-out infinite; }
      .badge.idle { background: rgba(147,165,190,0.1); color: var(--idle); }
      .badge.idle .dot { background: var(--idle); }
      .badge.off { background: rgba(100,100,120,0.08); color: #999; }
      .badge.off .dot { background: #aaa; }
      @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }

      /* Power */
      .pwr {
        width: clamp(36px, 9cqw, 44px); aspect-ratio: 1; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--idle); transition: all 0.25s;
      }
      .pwr:hover { box-shadow: 5px 5px 12px var(--sh-d), -5px -5px 12px var(--sh-l); }
      .pwr:active { box-shadow: var(--btn-p); }
      .pwr.on { color: var(--heat); }
      .pwr svg { width: clamp(18px, 4.5cqw, 22px); height: clamp(18px, 4.5cqw, 22px); }

      /* ─── Main dial area ─── */
      .dial-area {
        display: flex; align-items: center; justify-content: center;
        gap: clamp(12px, 4cqw, 20px); margin-bottom: 12px;
      }

      /* Side +/- */
      .side-btn {
        width: clamp(40px, 10cqw, 56px); aspect-ratio: 1; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--txt); flex-shrink: 0;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .side-btn:hover { transform: scale(1.06); box-shadow: var(--raised); }
      .side-btn:active { box-shadow: var(--btn-p); transform: scale(0.94); }
      .side-btn svg { width: clamp(20px, 5cqw, 24px); }

      /* Circle */
      .circle {
        width: clamp(140px, 40cqw, 260px); aspect-ratio: 1;
        border-radius: 50%; flex-shrink: 0;
        background: var(--bg); box-shadow: var(--raised);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .circle-in {
        width: 85%; aspect-ratio: 1;
        border-radius: 50%;
        background: var(--bg); box-shadow: var(--inset);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; z-index: 2; overflow: hidden;
      }

      /* Glow + spin + ripple */
      .glow {
        position: absolute; inset: 0; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.5s;
      }
      .glow.on { background: radial-gradient(circle, var(--heat-g) 0%, transparent 60%); opacity: 1; animation: gp 2.5s ease-in-out infinite; }
      @keyframes gp { 0%,100%{opacity:.4;transform:scale(.97)} 50%{opacity:1;transform:scale(1.03)} }

      .spin-ring {
        position: absolute; inset: -3px; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.4s;
      }
      .spin-ring.on {
        opacity: 1;
        border: 2.5px solid transparent;
        border-top-color: var(--heat);
        border-right-color: rgba(230,100,47,0.3);
        animation: sp 3s linear infinite;
        filter: drop-shadow(0 0 3px var(--heat-g));
      }
      @keyframes sp { to { transform:rotate(360deg); } }

      /* Temp display */
      .c-lbl {
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
        position: relative; z-index: 3;
      }
      .c-val {
        font-size: clamp(32px, 10cqw, 56px); font-weight: 300; line-height: 1;
        color: var(--txt); margin-top: 2px;
        position: relative; z-index: 3; transition: color 0.3s;
      }
      .c-val sup { font-size: clamp(16px, 4cqw, 24px); font-weight: 400; }
      .c-val.hot { color: var(--heat); }

      .c-trend {
        display: flex; align-items: center; gap: 4px;
        margin-top: 6px; font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500;
        color: var(--txt2); position: relative; z-index: 3;
      }
      .c-trend svg { width: clamp(12px, 3.5cqw, 14px); aspect-ratio: 1; }
      .c-trend.up { color: var(--heat); }
      .c-trend.down { color: var(--info); }
      .c-trend.flat { color: var(--good); }

      /* ─── Setpoint below dial ─── */
      .setpoint {
        text-align: center; margin-bottom: clamp(16px, 5cqw, 22px);
      }
      .sp-lbl {
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
      }
      .sp-val {
        font-size: clamp(24px, 7cqw, 36px); font-weight: 600; color: var(--txt);
        line-height: 1.3; transition: color 0.3s;
      }
      .sp-val.hot { color: var(--heat); }

      /* ─── Sensor metrics ─── */
      .metrics {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(clamp(110px, 30cqw, 140px), 1fr));
        gap: clamp(10px, 3cqw, 14px); margin-bottom: 18px;
        width: 100%;
      }
      .metric {
        background: var(--bg);
        box-shadow: var(--raised-s);
        border-radius: 18px; padding: clamp(12px, 3cqw, 16px);
        display: flex; align-items: center; gap: clamp(8px, 2.5cqw, 12px);
        transition: all 0.25s;
        animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .metric:nth-child(1){animation-delay:.1s}
      .metric:nth-child(2){animation-delay:.15s}
      .metric:nth-child(3){animation-delay:.2s}
      .metric:nth-child(4){animation-delay:.25s}
      @keyframes pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:none} }
      .metric:hover { transform: translateY(-2px); box-shadow: var(--raised); }
      .metric:active { box-shadow: var(--inset-s); transform: none; }

      .m-ico {
        width: 44px; height: 44px; border-radius: 14px;
        background: var(--bg); box-shadow: var(--inset-s);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; color: var(--txt2); transition: color 0.3s;
      }
      .m-ico svg { width: 22px; height: 22px; }
      .m-ico.hot { color: var(--heat); }
      .m-ico.ok { color: var(--good); }

      .m-txt {}
      .m-val { font-size: 20px; font-weight: 600; color: var(--txt); line-height: 1.2; }
      .m-val.hot { color: var(--heat); }
      .m-lbl { font-size: 12px; font-weight: 500; color: var(--txt2); margin-top: 2px; }

      /* ΔT bar */
      .dt-bar { 
        height: 4px; border-radius: 4px; margin-top: 6px;
        background: var(--bg); box-shadow: var(--inset-s);
        overflow: hidden; 
      }
      .dt-fill {
        height: 100%; border-radius: 4px;
        transition: width 0.8s ease;
      }
      .dt-fill.ok { background: var(--good); }
      .dt-fill.mid { background: var(--warn); }
      .dt-fill.bad { background: #e53935; }

      /* ─── Diagnostics & Graphs ─── */
      .diag {
        background: var(--bg); box-shadow: var(--inset);
        border-radius: 18px; padding: 16px 20px;
        margin-bottom: 18px; display: flex;
        flex-direction: column;
        align-items: flex-start; gap: 14px;
        font-size: 13px; font-weight: 400; line-height: 1.6;
        color: var(--txt2);
        animation: pop 0.4s 0.3s both;
        overflow: hidden;
      }
      .diag.hide { display: none; }
      
      .diag-row {
        display: flex; width: 100%;
        align-items: flex-start; gap: 14px;
      }
      .diag .d-i { font-size: 24px; flex-shrink: 0; line-height: 1; }
      .diag .d-b { flex: 1; }
      .diag .d-t { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
      .diag.good .d-t { color: var(--good); }
      .diag.warn .d-t { color: var(--warn); }
      .diag.info .d-t { color: var(--info); }
      
      .graph {
        width: 100%;
        border-top: 1px solid rgba(139, 143, 163, 0.15);
        padding-top: 10px;
        margin-top: 2px;
        animation: fadeDown 0.4s ease-out;
      }
      .graph-hdr {
        display: flex; justify-content: space-between;
        font-size: 10px; text-transform: uppercase;
        letter-spacing: 1px; color: var(--txt2); font-weight: 600;
      }
      @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }

      /* ─── Presets ─── */
      .presets {
        display: flex; gap: 10px; justify-content: center;
        flex-wrap: wrap; margin-bottom: 18px;
        animation: pop 0.4s 0.35s both;
      }
      .chip {
        padding: 10px 20px; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: 15px; font-weight: 500; color: var(--txt);
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .chip:hover { transform: translateY(-2px); }
      .chip:active { box-shadow: var(--btn-p); transform: scale(0.95); }
      .chip.on { color: var(--heat); box-shadow: var(--btn-p); font-weight: 600; }

      /* ─── Mode row ─── */
      .modes {
        display: flex; gap: 12px; justify-content: center;
        animation: pop 0.4s 0.4s both;
      }
      .mbtn {
        padding: 12px 22px; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: 13px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
        color: var(--txt2); display: flex; align-items: center; gap: 8px;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .mbtn:hover { transform: translateY(-2px); }
      .mbtn:active { box-shadow: var(--btn-p); transform: scale(0.95); }
      .mbtn.on { box-shadow: var(--btn-p); }
      .mbtn.on.heat { color: var(--heat); }
      .mbtn.on.off { color: var(--idle); }
      .mbtn svg { width: 16px; height: 16px; }

      /* ─── Error ─── */
      .err {
        padding: 40px; text-align: center; border-radius: 24px;
        background: var(--bg); box-shadow: var(--raised);
      }
      .err h3 { font-size: 18px; font-weight: 600; color: #e53935; margin-bottom: 8px; }
      .err p { font-size: 14px; color: var(--txt2); }
    `;
  }

  /* ══════════════════ RENDER ══════════════════ */

  private _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2);font-family:'Rubik',sans-serif">Загрузка…</div>`;
      return;
    }

    const C = this._config;
    const H = this._hass;
    const cl = H.states[C.climate_entity];

    if (!cl) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${C.climate_entity}</p></div>`;
      return;
    }

    const curT = this._v(H, C.current_temp_entity) ?? (cl.attributes.current_temperature !== undefined ? parseFloat(cl.attributes.current_temperature) : null);
    const tgtT = this._v(H, C.target_temp_entity) ?? parseFloat(cl.attributes.temperature);

    // Optional entities graceful fallback
    const dT = C.delta_t_entity ? this._v(H, C.delta_t_entity) : null;

    // Determine heating state (from helper entity OR fallback to native hvac_action)
    let isH = false;
    if (C.heating_entity && H.states[C.heating_entity]) {
      isH = H.states[C.heating_entity].state === 'on';
    } else {
      isH = cl.attributes.hvac_action === 'heating' || (cl.state === 'heat' && curT !== null && curT < tgtT);
    }

    const hvac = cl.state;
    const isOff = hvac === 'off';
    const cTgt = this._pendingTarget ?? cl.attributes.temperature;
    const modes: string[] = cl.attributes.hvac_modes || ['heat', 'off'];
    const name = C.name || cl.attributes.friendly_name || 'Altal Heat Pump';
    const presets = C.quick_presets || [19, 20, 22, 24];

    const tr = this._trend();
    const trIco = tr === 'up' ? this._ico.up : tr === 'down' ? this._ico.down : this._ico.stable;
    const trTxt = tr === 'up' ? 'Растёт' : tr === 'down' ? 'Падает' : 'Стабильно';

    let diag = this._dtDiag(dT, curT, tgtT, isH);

    // Override diagnostics area if a graph is active
    let activeGraphHtml = '';
    if (this._activeGraphEntity) {
      const g = this._cachedGraph[this._activeGraphEntity];
      if (g) {
        let title = 'График';
        if (this._activeGraphEntity === C.current_temp_entity) title = 'Текущая температура';
        if (this._activeGraphEntity === C.target_temp_entity) title = 'Уставка нагрева';
        if (this._activeGraphEntity === C.delta_t_entity) title = 'Дельта T (ΔT)';

        diag = { icon: '📊', title, text: 'Данные за последние 24 часа', cls: 'neutral' };

        activeGraphHtml = `
          <div class="graph">
            <div class="graph-hdr"><span>${g.min.toFixed(1)}</span><span>${g.max.toFixed(1)}</span></div>
            ${g.svg}
          </div>
        `;
      } else {
        diag = { icon: '⌛', title: 'Загрузка', text: 'Получение графиков из истории...', cls: 'neutral' };
      }
    }

    let bCls = 'off', bTxt = 'Выкл';
    if (isH) { bCls = 'heating'; bTxt = 'Нагрев'; }
    else if (!isOff) { bCls = 'idle'; bTxt = 'Ожидание'; }

    const mLbl: Record<string, string> = { heat: 'Обогрев', off: 'Выкл', cool: 'Охлажд.', auto: 'Авто' };
    const mIco: Record<string, string> = { heat: this._ico.heat, off: this._ico.off };

    const dtPct = dT != null ? Math.min(100, (dT / 12) * 100) : 0;
    const dtCls = dT != null ? (dT >= 4 && dT <= 7 ? 'ok' : dT < 3 || dT > 9 ? 'bad' : 'mid') : 'ok';

    const showImg = C.show_image !== false;
    const dispT = cTgt != null ? parseFloat(cTgt).toFixed(1) : '—';

    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          <!-- TOP -->
          <div class="top">
            <div class="top-left">
              ${showImg && C.image
        ? `<div class="pump-thumb"><img src="${C.image}" alt="Heat Pump"/></div>`
        : showImg
          ? `<div class="pump-thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width: 40px; color: var(--txt2);"><path d="M4 14v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 14a2 2 0 002 2h12a2 2 0 002-2M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4M8 11v6M16 11v6"/></svg></div>`
          : ''}
              <div class="top-info">
                <div class="name">${name}</div>
                <div class="status">Тепловой насос · ${mLbl[hvac] || hvac}</div>
              </div>
            </div>
            <div class="top-right">
              <div class="badge ${bCls}"><span class="dot"></span>${bTxt}</div>
              <button class="pwr ${isOff ? '' : 'on'}" id="pwr">${this._ico.power}</button>
            </div>
          </div>

          <!-- DIAL AREA: [-] [circle] [+] -->
          ${C.show_controls !== false ? `
          <div class="dial-area">
            <button class="side-btn" id="dn">${this._ico.minus}</button>
            <div class="circle">
              <div class="spin-ring ${isH ? 'on' : ''}"></div>
              <div class="circle-in">
                <div class="glow ${isH ? 'on' : ''}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${isH ? 'hot' : ''}">${curT !== null ? curT.toFixed(1) : '—'}<sup>°</sup></span>
                <span class="c-trend ${tr}">${trIco} ${trTxt}</span>
              </div>
            </div>
            <button class="side-btn" id="up">${this._ico.plus}</button>
          </div>

          <!-- SETPOINT -->
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${isH ? 'hot' : ''}">${dispT}°</div>
          </div>
          ` : `
          <div class="dial-area">
            <div class="circle">
              <div class="spin-ring ${isH ? 'on' : ''}"></div>
              <div class="circle-in">
                <div class="glow ${isH ? 'on' : ''}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${isH ? 'hot' : ''}">${curT !== null ? curT.toFixed(1) : '—'}<sup>°</sup></span>
                <span class="c-trend ${tr}">${trIco} ${trTxt}</span>
              </div>
            </div>
          </div>
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${isH ? 'hot' : ''}">${dispT}°</div>
          </div>
          `}

          <!-- METRICS -->
          <div class="metrics">
            <div class="metric" id="m_cur" style="cursor: pointer" aria-label="График текущей температуры">
              <div class="m-ico ${isH ? 'hot' : ''}">${this._ico.thermo}</div>
              <div class="m-txt">
                <div class="m-val">${curT !== null ? curT.toFixed(1) : '—'}°C</div>
                <div class="m-lbl">Текущая</div>
              </div>
            </div>
            <div class="metric" id="m_tgt" style="cursor: pointer" aria-label="График уставки">
              <div class="m-ico">${this._ico.target}</div>
              <div class="m-txt">
                <div class="m-val">${tgtT !== null ? tgtT.toFixed(1) : '—'}°C</div>
                <div class="m-lbl">Уставка</div>
              </div>
            </div>
            ${C.delta_t_entity ? `
            <div class="metric" id="m_dt" style="cursor: pointer" aria-label="График дельта T">
              <div class="m-ico">${this._ico.delta}</div>
              <div class="m-txt">
                <div class="m-val">${dT !== null ? dT.toFixed(1) : '—'}°C</div>
                <div class="m-lbl">ΔT</div>
                <div class="dt-bar"><div class="dt-fill ${dtCls}" style="width:${dtPct}%"></div></div>
              </div>
            </div>
            ` : ''}
            <div class="metric" id="m_heat" style="cursor: pointer" aria-label="График статуса нагрева">
              <div class="m-ico ${isH ? 'hot' : ''}">${this._ico.flame}</div>
              <div class="m-txt">
                <div class="m-val ${isH ? 'hot' : ''}">${isH ? 'Активен' : 'Нет'}</div>
                <div class="m-lbl">Нагрев</div>
              </div>
            </div>
          </div>

          <!-- DIAGNOSTICS & GRAPHS -->
          ${C.show_diagnostics !== false || this._activeGraphEntity ? `
            <div class="diag ${(!C.show_diagnostics && !this._activeGraphEntity) || (!this._activeGraphEntity && diag.cls === 'hide') ? 'hide' : diag.cls}">
              <div class="diag-row">
                <span class="d-i">${diag.icon}</span>
                <div class="d-b">
                  <div class="d-t">${diag.title}</div>
                  ${diag.text ? `<div>${diag.text}</div>` : ''}
                </div>
              </div>
              ${activeGraphHtml}
            </div>
          ` : ''}

          <!-- PRESETS -->
          ${C.show_presets !== false ? `
            <div class="presets">
              ${presets.map(p => `<button class="chip ${cTgt != null && Math.abs(p - parseFloat(cTgt)) < 0.1 ? 'on' : ''}" data-t="${p}">${p}°</button>`).join('')}
            </div>
          ` : ''}

          <!-- MODES -->
          <div class="modes">
            ${modes.map(m => `<button class="mbtn ${m === hvac ? 'on' : ''} ${m}" data-m="${m}">${mIco[m] || ''} ${mLbl[m] || m}</button>`).join('')}
          </div>

        </div>
      </ha-card>
    `;

    this._bindAll(isOff);
  }

  /* ── Events ───────────────────────────── */

  private _bindAll(isOff: boolean) {
    const $ = (id: string) => this._root.getElementById(id);

    $('dn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._adjust(-1); });
    $('up')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._adjust(1); });
    $('pwr')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._mode(isOff ? 'heat' : 'off'); });

    // Metric Click Listeners (Graphs)
    $('m_cur')?.addEventListener('click', () => {
      const C = this._config;
      if (C.current_temp_entity) this._fetchGraph(C.current_temp_entity, 'Текущая');
    });
    $('m_tgt')?.addEventListener('click', () => {
      const C = this._config;
      if (C.target_temp_entity) this._fetchGraph(C.target_temp_entity, 'Уставка');
    });
    $('m_dt')?.addEventListener('click', () => {
      const C = this._config;
      if (C.delta_t_entity) this._fetchGraph(C.delta_t_entity, 'ΔT');
    });
    $('m_heat')?.addEventListener('click', () => {
      const C = this._config;
      if (C.heating_entity) this._fetchGraph(C.heating_entity, 'Нагрев');
    });

    this._root.querySelectorAll('.chip').forEach(el =>
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._preset(parseFloat((e.currentTarget as HTMLElement).dataset.t || '20')); })
    );
    this._root.querySelectorAll('.mbtn').forEach(el =>
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._mode((e.currentTarget as HTMLElement).dataset.m || 'off'); })
    );
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
  '%c ALTAL-HEATER-CARD %c v4.0.0 ',
  'color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;',
  'color: #e6642f; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;'
);
