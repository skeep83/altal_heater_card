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
    const t = this._config;
    this._root.innerHTML = `
      <style>
        :host { display: block; }
        .editor {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
        }
        .row { margin-bottom: 14px; }
        label {
          display: block; font-size: 11px; font-weight: 600;
          color: var(--primary-text-color, #44476a);
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        input, select {
          width: 100%; padding: 10px 14px;
          border: 1px solid var(--divider-color, #d1d9e6);
          border-radius: 10px;
          background: var(--card-background-color, #e6e7ee);
          color: var(--primary-text-color, #44476a);
          font-size: 14px; box-sizing: border-box; outline: none;
          box-shadow: inset 1px 1px 3px rgba(163,177,198,0.4), inset -1px -1px 3px rgba(255,255,255,0.3);
          transition: all 0.2s;
        }
        input:focus, select:focus {
          border-color: var(--primary-color, #e6642f);
          box-shadow: 0 0 0 2px rgba(230,100,47,0.15);
        }
        .hint { font-size: 11px; color: var(--secondary-text-color, #7b7e8a); margin-top: 3px; }
        h3 { margin: 0 0 18px; font-size: 18px; font-weight: 700; }
        .section {
          margin-top: 18px; padding-top: 14px;
          border-top: 1px solid var(--divider-color, #d1d9e6);
        }
        .section-title {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--secondary-text-color, #7b7e8a);
          margin-bottom: 12px;
        }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-label {
          font-size: 14px; color: var(--primary-text-color, #44476a);
        }
        .toggle {
          position: relative; width: 44px; height: 24px;
          background: var(--card-background-color, #e6e7ee);
          border-radius: 24px; cursor: pointer;
          box-shadow: inset 1px 1px 3px rgba(163,177,198,0.5), inset -1px -1px 3px rgba(255,255,255,0.4);
          transition: all 0.3s;
        }
        .toggle.on {
          background: #e6642f;
          box-shadow: 0 2px 8px rgba(230,100,47,0.3);
        }
        .toggle .knob {
          position: absolute; top: 2px; left: 2px;
          width: 20px; height: 20px; border-radius: 50%;
          background: white;
          box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .toggle.on .knob { left: 22px; }
      </style>
      <div class="editor">
        <h3>⚙️ Altal Heater Card</h3>

        <div class="row">
          <label>Название</label>
          <input type="text" id="name" value="${t.name || ""}" placeholder="Altal Heat Pump">
        </div>

        <div class="section">
          <div class="section-title">Entities</div>
          <div class="row">
            <label>Climate entity</label>
            <input type="text" id="climate_entity" value="${t.climate_entity || ""}" placeholder="climate.altal_home_heater">
          </div>
          <div class="row">
            <label>Текущая температура</label>
            <input type="text" id="current_temp_entity" value="${t.current_temp_entity || ""}" placeholder="sensor.altal_current_temp">
          </div>
          <div class="row">
            <label>Целевая температура</label>
            <input type="text" id="target_temp_entity" value="${t.target_temp_entity || ""}" placeholder="sensor.altal_target_temp">
          </div>
          <div class="row">
            <label>ΔT (дельта)</label>
            <input type="text" id="delta_t_entity" value="${t.delta_t_entity || ""}" placeholder="sensor.altal_delta_t">
          </div>
          <div class="row">
            <label>Статус нагрева</label>
            <input type="text" id="heating_entity" value="${t.heating_entity || ""}" placeholder="binary_sensor.altal_heating">
          </div>
        </div>

        <div class="section">
          <div class="section-title">Внешний вид</div>
          <div class="row">
            <label>Изображение (URL)</label>
            <input type="text" id="image" value="${t.image || ""}" placeholder="/local/altal-pump.png">
            <div class="hint">Путь к изображению теплового насоса</div>
          </div>
          <div class="row">
            <label>Пресеты (через запятую)</label>
            <input type="text" id="quick_presets" value="${(t.quick_presets || [19, 20, 22, 24]).join(", ")}" placeholder="19, 20, 22, 24">
          </div>
        </div>

        <div class="section">
          <div class="section-title">Настройки отображения</div>
          <div class="toggle-row">
            <span class="toggle-label">Показать изображение</span>
            <div class="toggle ${t.show_image !== !1 ? "on" : ""}" data-field="show_image"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать управление</span>
            <div class="toggle ${t.show_controls !== !1 ? "on" : ""}" data-field="show_controls"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать пресеты</span>
            <div class="toggle ${t.show_presets !== !1 ? "on" : ""}" data-field="show_presets"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Диагностика ΔT</span>
            <div class="toggle ${t.show_diagnostics !== !1 ? "on" : ""}" data-field="show_diagnostics"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Компактный режим</span>
            <div class="toggle ${t.compact ? "on" : ""}" data-field="compact"><div class="knob"></div></div>
          </div>
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
    ].forEach((s) => {
      this._root.getElementById(s)?.addEventListener("change", (e) => {
        const o = e.target.value;
        this._config = { ...this._config, [s]: o || void 0 }, this._dispatch();
      });
    }), this._root.getElementById("quick_presets")?.addEventListener("change", (s) => {
      const i = s.target.value.split(",").map((e) => parseFloat(e.trim())).filter((e) => !isNaN(e));
      this._config = { ...this._config, quick_presets: i.length ? i : void 0 }, this._dispatch();
    }), this._root.querySelectorAll(".toggle").forEach((s) => {
      s.addEventListener("click", () => {
        const i = s.dataset.field, e = this._config[i], o = e === !1 ? !0 : e === !0 || e === void 0 ? !1 : !e;
        this._config[i] = i === "compact" ? !this._config.compact : o, this._dispatch(), this._render();
      });
    });
  }
  _dispatch() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: !0,
      composed: !0
    }));
  }
}
customElements.define("altal-heatpump-card-editor", E);
class S extends HTMLElement {
  constructor() {
    super(), this._history = [], this._debounce = null, this._animFrame = null, this._svg = {
      flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7c.3-.3.8-.3 1.1 0 .5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2 .2-.3.7-.4 1-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7zm-2.6-7.7c-.2.6-.4 1.3-.4 1.7 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1.6-1-3.4-2.2-4.8-.4.6-.9 1.2-1.2 1.6-.3.3-.8.4-1.1.1-.4-.4-.8-.9-1.1-1.6z"/></svg>',
      power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9"/><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/></svg>',
      minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      thermo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0zm-3-9a1 1 0 0 1 1 1v3h-2V5a1 1 0 0 1 1-1z"/></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      delta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 4L4 20h16L12 4z"/></svg>',
      arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M17 7H10M17 7V14"/></svg>',
      arrowDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 7L17 17M17 17H10M17 17V10"/></svg>',
      stable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12H19"/></svg>',
      heat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7c.3-.3.8-.3 1.1 0 .5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2 .2-.3.7-.4 1-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7z"/></svg>',
      off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>'
    }, this._root = this.attachShadow({ mode: "open" });
  }
  /* ── HA lifecycle ──────────────────────────────── */
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
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: !0,
      show_presets: !0,
      show_controls: !0,
      show_image: !0,
      show_graph: !1,
      compact: !1
    };
  }
  setConfig(t) {
    if (!t.climate_entity) throw new Error("Укажите climate_entity");
    this._config = {
      step: 0.5,
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: !0,
      show_presets: !0,
      show_controls: !0,
      show_image: !0,
      show_graph: !1,
      compact: !1,
      ...t
    }, this._hass && this._render();
  }
  set hass(t) {
    const a = this._hass;
    this._hass = t;
    const s = this._sensorVal(t, this._config.current_temp_entity);
    if (s !== null) {
      const e = Date.now();
      this._history.push({ temp: s, ts: e }), this._history = this._history.filter((o) => o.ts > e - 30 * 6e4);
    }
    (!a || a.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || a.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || a.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || a.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || a.states[this._config.heating_entity] !== t.states[this._config.heating_entity]) && this._render();
  }
  getCardSize() {
    return this._config?.compact ? 4 : 7;
  }
  /* ── Helpers ───────────────────────────────────── */
  _sensorVal(t, a) {
    const s = t?.states?.[a];
    if (!s || s.state === "unavailable" || s.state === "unknown") return null;
    const i = parseFloat(s.state);
    return isNaN(i) ? null : i;
  }
  _trend() {
    if (this._history.length < 3) return "stable";
    const t = this._history.slice(-5), a = t[t.length - 1].temp - t[0].temp;
    return a > 0.3 ? "rising" : a < -0.3 ? "falling" : "stable";
  }
  _dtDiag(t, a, s, i) {
    if (!i) return { emoji: "", title: "", text: "", cls: "" };
    if (t === 0) return { emoji: "⏳", title: "Нет данных по ΔT", text: "", cls: "neutral" };
    const e = s - a;
    return e >= 1.5 && (t <= 2 || t >= 10) ? { emoji: "🧊", title: "Переходный режим / дефрост", text: `${a}°C → ${s}°C (${e.toFixed(1)}°C). ΔT=${t}°C`, cls: "info" } : e <= 0.7 ? { emoji: "🟢", title: "Режим поддержания", text: `${a}→${s}°C. ΔT=${t}°C — норма`, cls: "good" } : t >= 4 && t <= 7 ? { emoji: "✅", title: `ΔT оптимум: ${t}°C`, text: "", cls: "good" } : t < 4 ? { emoji: "⚠️", title: `ΔT низкий: ${t}°C`, text: "Проверьте расход / контуры", cls: "warn" } : { emoji: "⚠️", title: `ΔT высокий: ${t}°C`, text: "Проверьте фильтры / циркуляцию", cls: "warn" };
  }
  /* ── Actions ───────────────────────────────────── */
  _setTemp(t) {
    this._debounce && clearTimeout(this._debounce), this._debounce = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: t
      });
    }, 350);
  }
  _setMode(t) {
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.climate_entity,
      hvac_mode: t
    });
  }
  /* ── Animated counter ──────────────────────────── */
  _animateCounters() {
    this._animFrame && cancelAnimationFrame(this._animFrame), this._root.querySelectorAll("[data-count]").forEach((a) => {
      const s = parseFloat(a.dataset.count || "0"), i = a.dataset.suffix || "";
      let e = 0;
      const o = 800, c = performance.now(), r = (d) => {
        const p = d - c, l = Math.min(p / o, 1), v = 1 - Math.pow(1 - l, 3);
        e = s * v, a.textContent = e.toFixed(1) + i, l < 1 && (this._animFrame = requestAnimationFrame(r));
      };
      requestAnimationFrame(r);
    });
  }
  /* ══════════════════ STYLES ══════════════════ */
  _getStyles() {
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
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._getStyles()}</style><div class="card"><div class="body" style="padding:40px;text-align:center;color:var(--neu-text-secondary)">Загрузка…</div></div>`;
      return;
    }
    const t = this._config, a = this._hass, s = a.states[t.climate_entity];
    if (!s) {
      this._root.innerHTML = `<style>${this._getStyles()}</style><div class="error"><h3>Entity не найден</h3><p><code>${t.climate_entity}</code></p></div>`;
      return;
    }
    const i = this._sensorVal(a, t.current_temp_entity), e = this._sensorVal(a, t.target_temp_entity), o = this._sensorVal(a, t.delta_t_entity), r = a.states[t.heating_entity]?.state === "on", d = s.state, p = d === "off", l = s.attributes.temperature, v = s.attributes.hvac_modes || ["heat", "off"], f = t.name || s.attributes.friendly_name || "Altal Heat Pump", w = t.quick_presets || [19, 20, 22, 24], _ = t.step || 0.5, g = this._trend(), y = g === "rising" ? this._svg.arrowUp : g === "falling" ? this._svg.arrowDown : this._svg.stable, k = g === "rising" ? "Растёт" : g === "falling" ? "Падает" : "Стабильно", h = this._dtDiag(o ?? 0, i ?? 0, e ?? 0, r);
    let x = "off", u = "Выкл";
    r ? (x = "heating", u = "Нагрев") : p || (x = "idle", u = "Ожидание");
    const b = { heat: "Обогрев", off: "Выкл", cool: "Охлаждение", auto: "Авто" }, $ = { heat: this._svg.flame, off: this._svg.off, cool: this._svg.off, auto: this._svg.thermo }, z = o != null ? Math.min(100, o / 10 * 100) : 0, C = o != null ? o >= 4 && o <= 7 ? "good" : o < 2 || o > 10 ? "danger" : "warn" : "good", T = t.show_image !== !1 ? t.image ? `<div class="hero"><img src="${t.image}" alt="Altal"/><div class="hero-gradient"></div><div class="status-badge ${x}"><span class="dot"></span>${u}</div></div>` : `<div class="hero no-img"><span class="brand-text">ALTAL</span><div class="hero-gradient"></div><div class="status-badge ${x}"><span class="dot"></span>${u}</div></div>` : "";
    this._root.innerHTML = `
      <style>${this._getStyles()}</style>
      <ha-card>
        <div class="card">
          ${T}

          <div class="body">
            <!-- Header -->
            <div class="header">
              <div>
                <h2>${f}</h2>
                <div class="sub">Тепловой насос • ${b[d] || d}</div>
              </div>
              <button class="power-btn ${p ? "" : "on"}" id="pwr">${this._svg.power}</button>
            </div>

            <!-- Temperature Ring -->
            <div class="temp-section">
              <div class="temp-circle-outer">
                <div class="spin-ring ${r ? "active" : ""}"></div>
                <div class="ripple-ring ${r ? "active" : ""}"></div>
                <div class="temp-circle-inner">
                  <div class="temp-glow ${r ? "active" : ""}"></div>
                  <span class="temp-label">Сейчас</span>
                  <span class="temp-value ${r ? "heating" : ""}" data-count="${i ?? 0}" data-suffix="°C">
                    ${i !== null ? i.toFixed(1) : "—"}°C
                  </span>
                  <span class="temp-trend ${g}">${y} ${k}</span>
                </div>
              </div>
            </div>

            <!-- Sensor Grid -->
            <div class="sensors">
              <div class="sensor">
                <div class="s-icon ${r ? "heating" : ""}">${this._svg.thermo}</div>
                <div class="s-val" data-count="${i ?? 0}" data-suffix="°">${i !== null ? i.toFixed(1) : "—"}°</div>
                <div class="s-lbl">Сейчас</div>
              </div>
              <div class="sensor">
                <div class="s-icon">${this._svg.target}</div>
                <div class="s-val" data-count="${e ?? 0}" data-suffix="°">${e !== null ? e.toFixed(1) : "—"}°</div>
                <div class="s-lbl">Уставка</div>
              </div>
              <div class="sensor">
                <div class="s-icon">${this._svg.delta}</div>
                <div class="s-val" data-count="${o ?? 0}" data-suffix="°">${o !== null ? o.toFixed(1) : "—"}°</div>
                <div class="s-lbl">ΔT</div>
                <div class="progress-wrap"><div class="progress-bar ${C}" style="width:${z}%"></div></div>
              </div>
              <div class="sensor">
                <div class="s-icon ${r ? "heating" : ""}">${this._svg.flame}</div>
                <div class="s-val ${r ? "heating" : ""}">${r ? "Да" : "Нет"}</div>
                <div class="s-lbl">Нагрев</div>
              </div>
            </div>

            <!-- Diagnostics -->
            ${t.show_diagnostics !== !1 ? `
              <div class="diagnostics ${r ? h.cls : "hidden"}">
                <span class="d-emoji">${h.emoji}</span>
                <div class="d-body">
                  <div class="d-title">${h.title}</div>
                  ${h.text ? `<div>${h.text}</div>` : ""}
                </div>
              </div>
            ` : ""}

            <!-- Controls -->
            ${t.show_controls !== !1 ? `
              <div class="controls">
                <button class="ctrl-btn" id="t-down">${this._svg.minus}</button>
                <div class="ctrl-display">
                  <div class="cd-lbl">Уставка</div>
                  <div class="cd-val ${r ? "heating" : ""}">${l != null ? parseFloat(l).toFixed(1) : "—"}°</div>
                </div>
                <button class="ctrl-btn" id="t-up">${this._svg.plus}</button>
              </div>
            ` : ""}

            <!-- Presets -->
            ${t.show_presets !== !1 ? `
              <div class="presets">
                ${w.map((n) => `
                  <button class="preset-chip ${l != null && Math.abs(n - parseFloat(l)) < 0.1 ? "active" : ""}" data-temp="${n}">${n}°</button>
                `).join("")}
              </div>
            ` : ""}

            <!-- HVAC Modes -->
            <div class="hvac-row">
              ${v.map((n) => `
                <button class="hvac-btn ${n === d ? "active" : ""} ${n}" data-mode="${n}">
                  ${$[n] || ""} ${b[n] || n}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </ha-card>
    `, this._bindEvents(l, _, p), requestAnimationFrame(() => this._animateCounters());
  }
  /* ── Events ────────────────────────────────────── */
  _bindEvents(t, a, s) {
    const i = (e) => this._root.getElementById(e);
    i("t-down")?.addEventListener("click", () => {
      t != null && this._setTemp(parseFloat(t) - a);
    }), i("t-up")?.addEventListener("click", () => {
      t != null && this._setTemp(parseFloat(t) + a);
    }), i("pwr")?.addEventListener("click", () => {
      this._setMode(s ? "heat" : "off");
    }), this._root.querySelectorAll(".preset-chip").forEach((e) => {
      e.addEventListener("click", (o) => {
        const c = parseFloat(o.currentTarget.dataset.temp || "20");
        this._setTemp(c);
      });
    }), this._root.querySelectorAll(".hvac-btn").forEach((e) => {
      e.addEventListener("click", (o) => {
        const c = o.currentTarget.dataset.mode || "off";
        this._setMode(c);
      });
    });
  }
}
customElements.define("altal-heatpump-card", S);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "altal-heatpump-card",
  name: "Altal Heater Card",
  description: "Premium neumorphic card for Altal heat pump — Themesberg style",
  preview: !0,
  documentationURL: "https://github.com/skeep83/altal_heater_card"
});
console.info(
  "%c ALTAL-HEATER-CARD %c v2.0.0 ",
  "color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;",
  "color: #e6642f; background: #e6e7ee; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;"
);
