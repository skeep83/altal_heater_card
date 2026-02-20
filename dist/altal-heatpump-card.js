class E extends HTMLElement {
  constructor() {
    super(), this._root = this.attachShadow({ mode: "open" });
  }
  set hass(t) {
    this._hass = t;
  }
  setConfig(t) {
    this._config = { ...t }, this._render();
  }
  _render() {
    this._root.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .editor {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
        }
        .row {
          margin-bottom: 12px;
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-text-color, #333);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input, select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus {
          border-color: var(--primary-color, #03a9f4);
        }
        .hint {
          font-size: 11px;
          color: var(--secondary-text-color, #888);
          margin-top: 2px;
        }
        h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 500;
        }
        .section {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--divider-color, #e0e0e0);
        }
      </style>
      <div class="editor">
        <h3>Altal Heatpump Card</h3>
        
        <div class="row">
          <label>Название карточки</label>
          <input type="text" id="name" 
            value="${this._config.name || ""}" 
            placeholder="Altal Heat Pump">
        </div>

        <div class="section">
          <label>Климат (entity)</label>
          <input type="text" id="climate_entity" 
            value="${this._config.climate_entity || ""}" 
            placeholder="climate.altal_home_heater">
          <div class="hint">climate.* entity для управления</div>
        </div>

        <div class="row" style="margin-top:12px">
          <label>Текущая температура</label>
          <input type="text" id="current_temp_entity" 
            value="${this._config.current_temp_entity || ""}" 
            placeholder="sensor.altal_current_temp">
        </div>

        <div class="row">
          <label>Целевая температура</label>
          <input type="text" id="target_temp_entity" 
            value="${this._config.target_temp_entity || ""}" 
            placeholder="sensor.altal_target_temp">
        </div>

        <div class="row">
          <label>ΔT (дельта)</label>
          <input type="text" id="delta_t_entity" 
            value="${this._config.delta_t_entity || ""}" 
            placeholder="sensor.altal_delta_t">
        </div>

        <div class="row">
          <label>Статус нагрева</label>
          <input type="text" id="heating_entity" 
            value="${this._config.heating_entity || ""}" 
            placeholder="binary_sensor.altal_heating">
        </div>

        <div class="section">
          <label>Изображение (URL)</label>
          <input type="text" id="image" 
            value="${this._config.image || ""}" 
            placeholder="/local/altal-pump.png">
          <div class="hint">Путь к изображению теплового насоса</div>
        </div>

        <div class="row" style="margin-top:12px">
          <label>Быстрые пресеты (через запятую)</label>
          <input type="text" id="quick_presets" 
            value="${(this._config.quick_presets || [19, 20, 22, 24]).join(", ")}" 
            placeholder="19, 20, 22, 24">
        </div>
      </div>
    `, [
      "name",
      "climate_entity",
      "current_temp_entity",
      "target_temp_entity",
      "delta_t_entity",
      "heating_entity",
      "image"
    ].forEach((i) => {
      const a = this._root.getElementById(i);
      a && a.addEventListener("change", (s) => {
        const o = s.target.value;
        this._config = { ...this._config, [i]: o || void 0 }, this._dispatch();
      });
    });
    const e = this._root.getElementById("quick_presets");
    e && e.addEventListener("change", (i) => {
      const s = i.target.value.split(",").map((o) => parseFloat(o.trim())).filter((o) => !isNaN(o));
      this._config = { ...this._config, quick_presets: s.length ? s : void 0 }, this._dispatch();
    });
  }
  _dispatch() {
    const t = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(t);
  }
}
customElements.define("altal-heatpump-card-editor", E);
class A extends HTMLElement {
  constructor() {
    super(), this._history = [], this._debounce = null, this._iconFlame = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7c.3-.3.8-.3 1.1 0 .5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2 .2-.3.7-.4 1-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7zm-2.6-7.7c-.2.6-.4 1.3-.4 1.7 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.6-1-3.4-2.2-4.8-.4.6-.9 1.2-1.2 1.6-.3.3-.8.4-1.1.1-.4-.4-.8-.9-1.1-1.6z"/></svg>', this._iconSnow = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 1v4.07A7.994 7.994 0 0 0 4.07 11H1v2h3.07A7.994 7.994 0 0 0 11 19.93V23h2v-3.07A7.994 7.994 0 0 0 19.93 13H23v-2h-3.07A7.994 7.994 0 0 0 13 4.07V1h-2zm1 6a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg>', this._iconPower = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v9M18.36 6.64A9 9 0 1 1 5.64 6.64"/></svg>', this._iconMinus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12H19"/></svg>', this._iconPlus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5V19M5 12H19"/></svg>', this._iconThermo = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-9a1 1 0 0 1 1 1v3h-2V5a1 1 0 0 1 1-1z"/></svg>', this._iconTarget = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', this._iconDelta = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3L3 21h18L12 3z"/></svg>', this._root = this.attachShadow({ mode: "open" });
  }
  /* ── HA lifecycle ────────────────────────── */
  static getConfigElement() {
    return document.createElement("altal-heatpump-card-editor");
  }
  static getStubConfig() {
    return {
      climate_entity: "climate.altal_home_heater",
      current_temp_entity: "sensor.altal_current_temp",
      target_temp_entity: "sensor.altal_target_temp",
      delta_t_entity: "sensor.altal_delta_t",
      heating_entity: "binary_sensor.altal_heating",
      quick_presets: [19, 20, 22, 24]
    };
  }
  setConfig(t) {
    if (!t.climate_entity) throw new Error("Please define climate_entity");
    this._config = {
      step: 0.5,
      quick_presets: [19, 20, 22, 24],
      ...t
    }, this._render();
  }
  set hass(t) {
    const e = this._hass;
    this._hass = t;
    const i = this._sensorVal(t, this._config.current_temp_entity);
    if (i !== null) {
      const s = Date.now();
      this._history.push({ temp: i, ts: s }), this._history = this._history.filter((o) => o.ts > s - 30 * 6e4);
    }
    (!e || e.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || e.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || e.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || e.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || e.states[this._config.heating_entity] !== t.states[this._config.heating_entity]) && this._render();
  }
  getCardSize() {
    return 6;
  }
  /* ── Helpers ─────────────────────────────── */
  _sensorVal(t, e) {
    const i = t?.states?.[e];
    if (!i || i.state === "unavailable" || i.state === "unknown") return null;
    const a = parseFloat(i.state);
    return isNaN(a) ? null : a;
  }
  _trend() {
    if (this._history.length < 3) return "stable";
    const t = this._history.slice(-5), e = t[0].temp, a = t[t.length - 1].temp - e;
    return a > 0.3 ? "rising" : a < -0.3 ? "falling" : "stable";
  }
  _trendIcon() {
    const t = this._trend();
    return t === "rising" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H10M17 7V14"/></svg>' : t === "falling" ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 7L17 17M17 17H10M17 17V10"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12H19"/></svg>';
  }
  _dtDiagnostic(t, e, i, a) {
    if (!a) return { emoji: "", title: "", text: "", cls: "" };
    if (t === 0) return { emoji: "⏳", title: "Нет данных по ΔT", text: "", cls: "neutral" };
    const s = i - e, o = 0.7, n = 1.5, l = 4, d = 7;
    return s >= n && (t <= 2 || t >= 10) ? {
      emoji: "🧊",
      title: "Переходный режим / дефрост",
      text: `Сейчас: ${e}°C → ${i}°C (ещё ${s.toFixed(1)}°C). ΔT = ${t}°C. Проверь через 5–10 мин.`,
      cls: "info"
    } : s <= o ? {
      emoji: "🟢",
      title: "Режим поддержания",
      text: `Почти уставка (${e} → ${i}°C). ΔT = ${t}°C — нормально.`,
      cls: "good"
    } : t >= l && t <= d ? { emoji: "✅", title: `ΔT в оптимуме: ${t}°C`, text: "", cls: "good" } : t < l ? {
      emoji: "⚠️",
      title: `ΔT ниже оптимума: ${t}°C`,
      text: "Повышенный расход / много контуров / малая мощность.",
      cls: "warn"
    } : {
      emoji: "⚠️",
      title: `ΔT выше оптимума: ${t}°C`,
      text: "Недостаточный расход (фильтр / воздух / клапаны).",
      cls: "warn"
    };
  }
  /* ── Actions ─────────────────────────────── */
  _setTemp(t) {
    this._debounce && clearTimeout(this._debounce), this._debounce = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: t
      });
    }, 400);
  }
  _setMode(t) {
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.climate_entity,
      hvac_mode: t
    });
  }
  /* ── Styles ──────────────────────────────── */
  _getStyles() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

      :host {
        /* ── Light neumorphic tokens ── */
        --neu-bg: #E4E4E0;
        --neu-bg-alt: #DADAD6;
        --neu-shadow-dark: rgba(166, 166, 160, 0.50);
        --neu-shadow-light: rgba(255, 255, 255, 0.80);
        --neu-shadow-lg: 6px 6px 12px var(--neu-shadow-dark), -6px -6px 12px var(--neu-shadow-light);
        --neu-shadow-sm: 3px 3px 6px rgba(166,166,160,0.35), -3px -3px 6px rgba(255,255,255,0.60);
        --neu-shadow-inset: inset 4px 4px 8px rgba(166,166,160,0.50), inset -4px -4px 8px rgba(255,255,255,0.80);
        --neu-shadow-inset-sm: inset 2px 2px 4px rgba(166,166,160,0.40), inset -2px -2px 4px rgba(255,255,255,0.70);
        --neu-shadow-btn: 5px 5px 10px rgba(166,166,160,0.50), -5px -5px 10px rgba(255,255,255,0.80);
        --neu-shadow-btn-active: inset 3px 3px 6px rgba(166,166,160,0.50), inset -3px -3px 6px rgba(255,255,255,0.80);

        --heating-color: #F06030;
        --heating-glow: rgba(240, 96, 48, 0.25);
        --idle-color: #8A8A80;
        --text-primary: #2D3142;
        --text-secondary: #5C6378;
        --good-color: #4CAF50;
        --warn-color: #FF9800;
        --info-color: #42A5F5;

        display: block;
        width: 100%;
        box-sizing: border-box;
        position: relative;
        z-index: 0;
        isolation: isolate;
      }

      @media (prefers-color-scheme: dark) {
        :host {
          --neu-bg: #2A2A2E;
          --neu-bg-alt: #222226;
          --neu-shadow-dark: rgba(18, 18, 20, 0.70);
          --neu-shadow-light: rgba(58, 58, 62, 0.60);
          --neu-shadow-lg: 6px 6px 12px var(--neu-shadow-dark), -6px -6px 12px var(--neu-shadow-light);
          --neu-shadow-sm: 3px 3px 6px rgba(18,18,20,0.50), -3px -3px 6px rgba(58,58,62,0.40);
          --neu-shadow-inset: inset 4px 4px 8px rgba(18,18,20,0.70), inset -4px -4px 8px rgba(58,58,62,0.60);
          --neu-shadow-inset-sm: inset 2px 2px 4px rgba(18,18,20,0.60), inset -2px -2px 4px rgba(58,58,62,0.50);
          --neu-shadow-btn: 5px 5px 10px rgba(18,18,20,0.70), -5px -5px 10px rgba(58,58,62,0.60);
          --neu-shadow-btn-active: inset 3px 3px 6px rgba(18,18,20,0.70), inset -3px -3px 6px rgba(58,58,62,0.60);

          --heating-color: #FF7043;
          --heating-glow: rgba(255, 112, 67, 0.20);
          --idle-color: #6E6E6A;
          --text-primary: #E8E4DF;
          --text-secondary: #A8A4A0;
          --good-color: #66BB6A;
          --warn-color: #FFA726;
          --info-color: #64B5F6;
        }
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      .card {
        background: var(--neu-bg);
        border-radius: 20px;
        box-shadow: var(--neu-shadow-lg);
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: box-shadow 0.3s ease, transform 0.3s ease;
        position: relative;
      }

      .card:hover {
        transform: translateY(-2px);
        box-shadow: 8px 8px 16px var(--neu-shadow-dark), -8px -8px 16px var(--neu-shadow-light);
      }

      /* ═══════ HERO IMAGE ═══════ */
      .hero {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      }

      .hero img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3));
        transition: transform 0.5s ease;
      }

      .card:hover .hero img {
        transform: scale(1.03);
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg,
          transparent 40%,
          rgba(0,0,0,0.15) 70%,
          var(--neu-bg) 100%
        );
        pointer-events: none;
      }

      .hero-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: all 0.3s ease;
      }

      .hero-badge.heating {
        background: rgba(240, 96, 48, 0.20);
        color: #FF8A65;
        border: 1px solid rgba(240, 96, 48, 0.30);
      }

      .hero-badge.idle {
        background: rgba(138, 138, 128, 0.20);
        color: #BDBDBD;
        border: 1px solid rgba(138, 138, 128, 0.30);
      }

      .hero-badge.off {
        background: rgba(80, 80, 80, 0.20);
        color: #999;
        border: 1px solid rgba(80, 80, 80, 0.30);
      }

      .hero-badge .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .hero-badge.heating .badge-dot {
        background: var(--heating-color);
        box-shadow: 0 0 8px var(--heating-color);
        animation: pulse-dot 1.8s ease-in-out infinite;
      }

      .hero-badge.idle .badge-dot { background: var(--idle-color); }
      .hero-badge.off .badge-dot { background: #666; }

      @keyframes pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.3); }
      }

      /* ═══════ BODY ═══════ */
      .body {
        padding: 16px 20px 20px;
      }

      /* ── Header ── */
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .header-left h2 {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
      }

      .header-left .subtitle {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }

      .power-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-btn);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--idle-color);
      }

      .power-btn:active {
        box-shadow: var(--neu-shadow-btn-active);
      }

      .power-btn.on { color: var(--heating-color); }
      .power-btn svg { width: 20px; height: 20px; }

      /* ═══════ MAIN TEMP DISPLAY ═══════ */
      .temp-display {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 8px 0 20px;
        position: relative;
      }

      .temp-ring {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .temp-ring-inner {
        width: 136px;
        height: 136px;
        border-radius: 50%;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        overflow: hidden;
      }

      .temp-ring-glow {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      .temp-ring-glow.heating {
        background: radial-gradient(circle at center, var(--heating-glow) 0%, transparent 70%);
        opacity: 1;
        animation: glow-pulse 2.2s ease-in-out infinite;
      }

      @keyframes glow-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .temp-ring-progress {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        pointer-events: none;
        transition: all 0.5s ease;
      }

      .temp-ring-progress.heating {
        border: 3px solid transparent;
        border-top-color: var(--heating-color);
        border-right-color: var(--heating-color);
        animation: spin-progress 3s linear infinite;
      }

      @keyframes spin-progress {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .temp-current-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: var(--text-secondary);
        font-weight: 500;
        position: relative;
        z-index: 3;
      }

      .temp-current-value {
        font-size: 42px;
        font-weight: 300;
        color: var(--text-primary);
        line-height: 1;
        margin-top: 2px;
        position: relative;
        z-index: 3;
      }

      .temp-current-value .unit {
        font-size: 18px;
        font-weight: 400;
        vertical-align: super;
        margin-left: 1px;
      }

      .temp-current-value.heating { color: var(--heating-color); }

      .temp-trend {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-top: 4px;
        font-size: 10px;
        font-weight: 500;
        color: var(--text-secondary);
        position: relative;
        z-index: 3;
      }

      .temp-trend svg { width: 14px; height: 14px; }
      .temp-trend.rising { color: var(--heating-color); }
      .temp-trend.falling { color: var(--info-color); }
      .temp-trend.stable { color: var(--good-color); }

      /* ═══════ SENSOR GRID ═══════ */
      .sensors {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 16px;
      }

      .sensor-tile {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-sm);
        border-radius: 14px;
        padding: 12px 8px;
        text-align: center;
        transition: all 0.2s ease;
      }

      .sensor-tile:hover {
        transform: translateY(-1px);
      }

      .sensor-tile .s-icon {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: var(--neu-bg-alt);
        box-shadow: var(--neu-shadow-inset-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 6px;
        color: var(--text-secondary);
      }

      .sensor-tile .s-icon svg { width: 16px; height: 16px; }
      .sensor-tile .s-icon.heating { color: var(--heating-color); }
      .sensor-tile .s-icon.good { color: var(--good-color); }

      .sensor-tile .s-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
      }

      .sensor-tile .s-label {
        font-size: 9px;
        font-weight: 500;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ═══════ ΔT DIAGNOSTIC ═══════ */
      .dt-diagnostic {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        border-radius: 14px;
        padding: 12px 16px;
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--text-secondary);
        transition: all 0.3s ease;
      }

      .dt-diagnostic.hidden { display: none; }

      .dt-diagnostic .dt-emoji {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .dt-diagnostic .dt-content { flex: 1; }

      .dt-diagnostic .dt-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }

      .dt-diagnostic.good .dt-title { color: var(--good-color); }
      .dt-diagnostic.warn .dt-title { color: var(--warn-color); }
      .dt-diagnostic.info .dt-title { color: var(--info-color); }

      /* ═══════ CONTROLS ═══════ */
      .controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 14px;
      }

      .ctrl-btn {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-btn);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }

      .ctrl-btn:active {
        box-shadow: var(--neu-shadow-btn-active);
        transform: scale(0.95);
      }

      .ctrl-btn svg { width: 20px; height: 20px; }

      .ctrl-target {
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-inset);
        border-radius: 14px;
        padding: 8px 20px;
        text-align: center;
        min-width: 100px;
      }

      .ctrl-target .ct-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .ctrl-target .ct-value {
        font-size: 26px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
      }

      .ctrl-target .ct-value.heating { color: var(--heating-color); }

      /* ═══════ QUICK PRESETS ═══════ */
      .presets {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .preset-chip {
        padding: 8px 16px;
        border-radius: 20px;
        border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-sm);
        cursor: pointer;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        transition: all 0.2s ease;
      }

      .preset-chip:active {
        box-shadow: var(--neu-shadow-inset-sm);
      }

      .preset-chip.active {
        color: var(--heating-color);
        box-shadow: var(--neu-shadow-inset-sm);
        font-weight: 600;
      }

      /* ═══════ HVAC MODES ═══════ */
      .hvac-modes {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .hvac-btn {
        padding: 8px 14px;
        border-radius: 12px;
        border: none;
        background: var(--neu-bg);
        box-shadow: var(--neu-shadow-sm);
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s ease;
      }

      .hvac-btn:active {
        box-shadow: var(--neu-shadow-inset-sm);
      }

      .hvac-btn.active {
        box-shadow: var(--neu-shadow-inset-sm);
      }

      .hvac-btn.active.heat { color: var(--heating-color); }
      .hvac-btn.active.off { color: var(--idle-color); }

      .hvac-btn svg { width: 14px; height: 14px; }

      /* ═══════ ERROR ═══════ */
      .error-card {
        padding: 32px 20px;
        text-align: center;
        color: #ef5350;
        background: var(--neu-bg);
        border-radius: 20px;
        box-shadow: var(--neu-shadow-lg);
      }

      .error-card h3 { font-size: 16px; margin-bottom: 8px; }
      .error-card p { font-size: 13px; color: var(--text-secondary); }

      /* ═══════ NO-IMAGE FALLBACK ═══════ */
      .hero-no-img {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
      }

      .hero-no-img .brand {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 6px;
        color: rgba(255,255,255,0.15);
        text-transform: uppercase;
      }
    `;
  }
  /* ── Render ──────────────────────────────── */
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._getStyles()}</style><div class="card" style="padding:20px;text-align:center;color:var(--text-secondary)">Загрузка…</div>`;
      return;
    }
    const t = this._hass.states[this._config.climate_entity];
    if (!t) {
      this._root.innerHTML = `
        <style>${this._getStyles()}</style>
        <div class="error-card">
          <h3>Entity не найден</h3>
          <p>${this._config.climate_entity}</p>
        </div>`;
      return;
    }
    const e = this._sensorVal(this._hass, this._config.current_temp_entity), i = this._sensorVal(this._hass, this._config.target_temp_entity), a = this._sensorVal(this._hass, this._config.delta_t_entity), o = this._hass.states[this._config.heating_entity]?.state === "on", n = t.state, l = n === "off", d = t.attributes.hvac_modes || ["heat", "off"], c = t.attributes.temperature, u = this._config.name || t.attributes.friendly_name || "Altal Heat Pump", h = this._config.image, b = this._config.quick_presets || [19, 20, 22, 24], f = this._config.step || 0.5, g = this._trend(), _ = this._trendIcon(), w = g === "rising" ? "▲" : g === "falling" ? "▼" : "—", p = this._dtDiagnostic(
      a ?? 0,
      e ?? 0,
      i ?? 0,
      o
    );
    let x = "Выкл", v = "off";
    o ? (x = "Нагрев", v = "heating") : l || (x = "Ожидание", v = "idle");
    const y = {
      heat: this._iconFlame,
      off: this._iconPower,
      cool: this._iconSnow,
      auto: this._iconThermo
    }, k = h ? `<img src="${h}" alt="Altal Heat Pump" />` : '<div class="brand">ALTAL</div>', $ = h ? "hero" : "hero hero-no-img";
    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <ha-card>
        <div class="card">

          <!-- HERO -->
          <div class="${$}">
            ${k}
            <div class="hero-overlay"></div>
            <div class="hero-badge ${v}">
              <span class="badge-dot"></span>
              ${x}
            </div>
          </div>

          <div class="body">
            <!-- HEADER -->
            <div class="header">
              <div class="header-left">
                <h2>${u}</h2>
                <div class="subtitle">Тепловой насос • ${n === "heat" ? "Режим обогрева" : n === "off" ? "Выключен" : n}</div>
              </div>
              <button class="power-btn ${l ? "" : "on"}" id="power-toggle">
                ${this._iconPower}
              </button>
            </div>

            <!-- MAIN TEMPERATURE -->
            <div class="temp-display">
              <div class="temp-ring">
                <div class="temp-ring-progress ${o ? "heating" : ""}"></div>
                <div class="temp-ring-inner">
                  <div class="temp-ring-glow ${o ? "heating" : ""}"></div>
                  <span class="temp-current-label">Сейчас</span>
                  <span class="temp-current-value ${o ? "heating" : ""}">
                    ${e !== null ? e.toFixed(1) : "—"}<span class="unit">°C</span>
                  </span>
                  <span class="temp-trend ${g}">
                    ${_} ${w}
                  </span>
                </div>
              </div>
            </div>

            <!-- SENSOR GRID -->
            <div class="sensors">
              <div class="sensor-tile">
                <div class="s-icon ${o ? "heating" : ""}">
                  ${this._iconThermo}
                </div>
                <div class="s-value">${e !== null ? e.toFixed(1) : "—"}°</div>
                <div class="s-label">Сейчас</div>
              </div>
              <div class="sensor-tile">
                <div class="s-icon">
                  ${this._iconTarget}
                </div>
                <div class="s-value">${i !== null ? i.toFixed(1) : "—"}°</div>
                <div class="s-label">Уставка</div>
              </div>
              <div class="sensor-tile">
                <div class="s-icon">
                  ${this._iconDelta}
                </div>
                <div class="s-value">${a !== null ? a.toFixed(1) : "—"}°</div>
                <div class="s-label">ΔT</div>
              </div>
              <div class="sensor-tile">
                <div class="s-icon ${o ? "heating" : ""}">
                  ${this._iconFlame}
                </div>
                <div class="s-value">${o ? "Да" : "Нет"}</div>
                <div class="s-label">Нагрев</div>
              </div>
            </div>

            <!-- ΔT DIAGNOSTIC -->
            <div class="dt-diagnostic ${o ? p.cls : "hidden"}">
              <span class="dt-emoji">${p.emoji}</span>
              <div class="dt-content">
                <div class="dt-title">${p.title}</div>
                ${p.text ? `<div>${p.text}</div>` : ""}
              </div>
            </div>

            <!-- CONTROLS -->
            <div class="controls">
              <button class="ctrl-btn" id="temp-down">${this._iconMinus}</button>
              <div class="ctrl-target">
                <div class="ct-label">Уставка</div>
                <div class="ct-value ${o ? "heating" : ""}">${c != null ? parseFloat(c).toFixed(1) : "—"}°</div>
              </div>
              <button class="ctrl-btn" id="temp-up">${this._iconPlus}</button>
            </div>

            <!-- QUICK PRESETS -->
            <div class="presets">
              ${b.map((r) => `
                <button class="preset-chip ${c != null && Math.abs(r - parseFloat(c)) < 0.1 ? "active" : ""}" data-temp="${r}">
                  ${r}°
                </button>
              `).join("")}
            </div>

            <!-- HVAC MODES -->
            <div class="hvac-modes">
              ${d.map((r) => `
                <button class="hvac-btn ${r === n ? "active" : ""} ${r}" data-mode="${r}">
                  ${y[r] || ""} ${r === "heat" ? "Обогрев" : r === "off" ? "Выкл" : r === "cool" ? "Охлаждение" : r === "auto" ? "Авто" : r}
                </button>
              `).join("")}
            </div>

          </div>
        </div>
      </ha-card>
    `, this._bindEvents(c, f, l);
  }
  /* ── Event binding ───────────────────────── */
  _bindEvents(t, e, i) {
    const a = this._root.getElementById("temp-down"), s = this._root.getElementById("temp-up"), o = this._root.getElementById("power-toggle");
    a?.addEventListener("click", () => {
      t != null && this._setTemp(parseFloat(t) - e);
    }), s?.addEventListener("click", () => {
      t != null && this._setTemp(parseFloat(t) + e);
    }), o?.addEventListener("click", () => {
      i ? this._setMode("heat") : this._setMode("off");
    }), this._root.querySelectorAll(".preset-chip").forEach((n) => {
      n.addEventListener("click", (l) => {
        const d = parseFloat(l.currentTarget.dataset.temp || "20");
        this._setTemp(d);
      });
    }), this._root.querySelectorAll(".hvac-btn").forEach((n) => {
      n.addEventListener("click", (l) => {
        const d = l.currentTarget.dataset.mode || "off";
        this._setMode(d);
      });
    });
  }
}
customElements.define("altal-heatpump-card", A);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "altal-heatpump-card",
  name: "Altal Heatpump Card",
  description: "Neumorphic card for Altal heat pump with temperature monitoring, ΔT diagnostics, and climate control.",
  preview: !0,
  documentationURL: "https://github.com/YOUR_USERNAME/altal-heatpump-card"
});
console.info(
  "%c ALTAL-HEATPUMP-CARD %c v1.0.0 ",
  "color: white; background: #F06030; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 6px;",
  "color: #F06030; background: white; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 6px;"
);
