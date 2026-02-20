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
    ].forEach((i) => {
      this._root.getElementById(i)?.addEventListener("change", (e) => {
        const s = e.target.value;
        this._config = { ...this._config, [i]: s || void 0 }, this._dispatch();
      });
    }), this._root.getElementById("quick_presets")?.addEventListener("change", (i) => {
      const o = i.target.value.split(",").map((e) => parseFloat(e.trim())).filter((e) => !isNaN(e));
      this._config = { ...this._config, quick_presets: o.length ? o : void 0 }, this._dispatch();
    }), this._root.querySelectorAll(".toggle").forEach((i) => {
      i.addEventListener("click", () => {
        const o = i.dataset.field, e = this._config[o], s = e === !1 ? !0 : e === !0 || e === void 0 ? !1 : !e;
        this._config[o] = o === "compact" ? !this._config.compact : s, this._dispatch(), this._render();
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
class M extends HTMLElement {
  constructor() {
    super(), this._history = [], this._pendingTarget = null, this._debounceTimer = null, this._serviceTimer = null, this._icons = {
      flame: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7a.75.75 0 011.1 0c.5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2a.65.65 0 011-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7zm-2.6-7.7c-.2.6-.4 1.3-.4 1.7a3 3 0 006 0c0-1.6-1-3.4-2.2-4.8-.4.6-.9 1.2-1.2 1.6a.7.7 0 01-1.1.1c-.4-.4-.8-.9-1.1-1.6z"/></svg>',
      power: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 3v9"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M18.36 6.64a9 9 0 11-12.73 0"/></svg>',
      minus: '<svg viewBox="0 0 24 24"><rect x="6" y="10.5" width="12" height="3" rx="1.5" fill="currentColor"/></svg>',
      plus: '<svg viewBox="0 0 24 24"><rect x="6" y="10.5" width="12" height="3" rx="1.5" fill="currentColor"/><rect x="10.5" y="6" width="3" height="12" rx="1.5" fill="currentColor"/></svg>',
      thermo: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 15.28V5.5a1.5 1.5 0 00-3 0v9.78A3.5 3.5 0 009 18.5a3.5 3.5 0 007 0 3.5 3.5 0 00-3-3.22zM12 20a2 2 0 01-2-2c0-.74.4-1.39 1-1.73V10h2v6.27c.6.34 1 .99 1 1.73a2 2 0 01-2 2z"/><path fill="currentColor" d="M16 8V5.5C16 3.57 14.43 2 12.5 2h-1C9.57 2 8 3.57 8 5.5V8h2V5.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V8h4z" opacity=".4"/></svg>',
      target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
      delta: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 5L5 19h14L12 5z"/></svg>',
      up: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M7 17l5-5 5 5M7 11l5-5 5 5"/></svg>',
      down: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M7 7l5 5 5-5M7 13l5 5 5-5"/></svg>',
      flat: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" d="M4 12h16"/></svg>',
      heat: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 23c-3.6 0-7-2.4-7-7 0-3.3 2.3-5.7 4.1-7.8l.6-.7a.75.75 0 011.1 0c.5.5 1.3 1.3 1.9 2.3.5-.7 1.1-1.5 1.5-2a.65.65 0 011-.1C17.4 9.5 19 12 19 16c0 4.6-3.4 7-7 7z"/></svg>',
      off: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 8l8 8"/></svg>'
    }, this._root = this.attachShadow({ mode: "open" });
  }
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
      compact: !1,
      ...t
    }, this._hass && this._render();
  }
  set hass(t) {
    const a = this._hass;
    this._hass = t;
    const i = this._val(t, this._config.current_temp_entity);
    if (i !== null) {
      const e = Date.now();
      this._history.push({ temp: i, ts: e }), this._history = this._history.filter((s) => s.ts > e - 30 * 6e4);
    }
    if (this._pendingTarget !== null) {
      const e = t.states[this._config.climate_entity]?.attributes?.temperature;
      e != null && Math.abs(parseFloat(e) - this._pendingTarget) < 0.01 && (this._pendingTarget = null);
    }
    (!a || a.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || a.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || a.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || a.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || a.states[this._config.heating_entity] !== t.states[this._config.heating_entity]) && this._render();
  }
  getCardSize() {
    return this._config?.compact ? 4 : 6;
  }
  /* ── Helpers ────────────────────────────────── */
  _val(t, a) {
    const i = t?.states?.[a];
    if (!i || i.state === "unavailable" || i.state === "unknown") return null;
    const o = parseFloat(i.state);
    return isNaN(o) ? null : o;
  }
  _trend() {
    if (this._history.length < 3) return "stable";
    const t = this._history.slice(-5), a = t[t.length - 1].temp - t[0].temp;
    return a > 0.3 ? "rising" : a < -0.3 ? "falling" : "stable";
  }
  _dtDiag(t, a, i, o) {
    if (!o) return { emoji: "", title: "", text: "", cls: "" };
    if (t === 0) return { emoji: "⏳", title: "Нет данных по ΔT", text: "", cls: "neutral" };
    const e = i - a;
    return e >= 1.5 && (t <= 2 || t >= 10) ? { emoji: "🧊", title: "Переходный режим", text: `${a}→${i}°C. ΔT=${t}°C`, cls: "info" } : e <= 0.7 ? { emoji: "🟢", title: "Поддержание", text: `ΔT=${t}°C — норма`, cls: "good" } : t >= 4 && t <= 7 ? { emoji: "✅", title: `ΔT оптимум: ${t}°C`, text: "", cls: "good" } : t < 4 ? { emoji: "⚠️", title: `ΔT низкий: ${t}°C`, text: "Проверьте расход", cls: "warn" } : { emoji: "⚠️", title: `ΔT высокий: ${t}°C`, text: "Проверьте фильтры", cls: "warn" };
  }
  /* ── Actions ────────────────────────────────── */
  _adjustTemp(t) {
    const a = this._config.step || 0.5, i = this._hass.states[this._config.climate_entity], o = this._pendingTarget ?? parseFloat(i?.attributes?.temperature);
    if (isNaN(o)) return;
    const e = Math.round((o + t * a) * 10) / 10, s = i?.attributes?.min_temp ?? 5, c = i?.attributes?.max_temp ?? 35, r = Math.max(s, Math.min(c, e));
    this._pendingTarget = r;
    const l = this._root.querySelector(".setpoint-val");
    l && (l.textContent = r.toFixed(1) + "°"), this._serviceTimer && clearTimeout(this._serviceTimer), this._serviceTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: r
      });
    }, 600);
  }
  _setPreset(t) {
    this._pendingTarget = t;
    const a = this._root.querySelector(".setpoint-val");
    a && (a.textContent = t.toFixed(1) + "°"), this._serviceTimer && clearTimeout(this._serviceTimer), this._serviceTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: t
      });
    }, 300);
  }
  _setMode(t) {
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.climate_entity,
      hvac_mode: t
    });
  }
  /* ══════════════════ STYLES ══════════════════ */
  _css() {
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
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card"><div style="padding:40px;text-align:center;color:var(--txt2)">Загрузка…</div></div>`;
      return;
    }
    const t = this._config, a = this._hass, i = a.states[t.climate_entity];
    if (!i) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p><code>${t.climate_entity}</code></p></div>`;
      return;
    }
    const o = this._val(a, t.current_temp_entity), e = this._val(a, t.target_temp_entity), s = this._val(a, t.delta_t_entity), r = a.states[t.heating_entity]?.state === "on", l = i.state, g = l === "off", h = this._pendingTarget ?? i.attributes.temperature, m = i.attributes.hvac_modes || ["heat", "off"], b = t.name || i.attributes.friendly_name || "Altal Heat Pump", _ = t.quick_presets || [19, 20, 22, 24], d = this._trend(), w = d === "rising" ? this._icons.up : d === "falling" ? this._icons.down : this._icons.flat, y = d === "rising" ? "Растёт" : d === "falling" ? "Падает" : "Стабильно", p = this._dtDiag(s ?? 0, o ?? 0, e ?? 0, r);
    let v = "off", x = "Выкл";
    r ? (v = "heating", x = "Нагрев") : g || (v = "idle", x = "Ожидание");
    const u = { heat: "Обогрев", off: "Выкл", cool: "Охлажд.", auto: "Авто" }, k = { heat: this._icons.heat, off: this._icons.off }, $ = s != null ? Math.min(100, s / 10 * 100) : 0, T = s != null ? s >= 4 && s <= 7 ? "ok" : s < 2 || s > 10 ? "bad" : "mid" : "ok", C = t.show_image !== !1 && t.image, z = h != null ? parseFloat(h).toFixed(1) : "—";
    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          <!-- TOP ROW: image + name + badge + power -->
          <div class="top-row">
            <div class="top-left">
              ${C ? `<div class="pump-img"><img src="${t.image}" alt="Altal"/></div>` : '<div class="pump-img no-img">ALTAL</div>'}
              <div class="top-info">
                <h2>${b}</h2>
                <div class="sub">${u[l] || l}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="badge ${v}"><span class="dot"></span>${x}</div>
              <button class="pwr ${g ? "" : "on"}" id="pwr">${this._icons.power}</button>
            </div>
          </div>

          <!-- MAIN: ‒ [circle] + -->
          <div class="main-section">
            <button class="side-btn" id="t-dn">${this._icons.minus}</button>
            <div class="circle-wrap">
              <div class="circle-outer">
                <div class="spin ${r ? "on" : ""}"></div>
                <div class="ripple ${r ? "on" : ""}"></div>
                <div class="circle-inner">
                  <div class="glow ${r ? "on" : ""}"></div>
                  <span class="c-label">Сейчас</span>
                  <span class="c-temp ${r ? "heat" : ""}">${o !== null ? o.toFixed(1) : "—"}<span class="u">°</span></span>
                  <span class="trend ${d}">${w} ${y}</span>
                </div>
              </div>
            </div>
            <button class="side-btn" id="t-up">${this._icons.plus}</button>
          </div>

          <!-- SETPOINT below circle -->
          <div class="setpoint">
            <div class="setpoint-lbl">Уставка</div>
            <div class="setpoint-val ${r ? "heat" : ""}">${z}°</div>
          </div>

          <!-- SENSOR GRID -->
          <div class="sensors">
            <div class="sensor">
              <div class="s-ico ${r ? "heat" : ""}">${this._icons.thermo}</div>
              <div class="s-v">${o !== null ? o.toFixed(1) : "—"}°</div>
              <div class="s-l">Сейчас</div>
            </div>
            <div class="sensor">
              <div class="s-ico">${this._icons.target}</div>
              <div class="s-v">${e !== null ? e.toFixed(1) : "—"}°</div>
              <div class="s-l">Уставка</div>
            </div>
            <div class="sensor">
              <div class="s-ico">${this._icons.delta}</div>
              <div class="s-v">${s !== null ? s.toFixed(1) : "—"}°</div>
              <div class="s-l">ΔT</div>
              <div class="pbar-wrap"><div class="pbar ${T}" style="width:${$}%"></div></div>
            </div>
            <div class="sensor">
              <div class="s-ico ${r ? "heat" : ""}">${this._icons.flame}</div>
              <div class="s-v ${r ? "heat" : ""}">${r ? "Да" : "Нет"}</div>
              <div class="s-l">Нагрев</div>
            </div>
          </div>

          <!-- DIAGNOSTICS -->
          ${t.show_diagnostics !== !1 ? `
            <div class="diag ${r ? p.cls : "hide"}">
              <span class="d-em">${p.emoji}</span>
              <div class="d-b">
                <div class="d-t">${p.title}</div>
                ${p.text ? `<div>${p.text}</div>` : ""}
              </div>
            </div>
          ` : ""}

          <!-- PRESETS -->
          ${t.show_presets !== !1 ? `
            <div class="presets">
              ${_.map((n) => `<button class="pre ${h != null && Math.abs(n - parseFloat(h)) < 0.1 ? "on" : ""}" data-t="${n}">${n}°</button>`).join("")}
            </div>
          ` : ""}

          <!-- MODES -->
          <div class="modes">
            ${m.map((n) => `<button class="mode ${n === l ? "on" : ""} ${n}" data-m="${n}">${k[n] || ""} ${u[n] || n}</button>`).join("")}
          </div>

        </div>
      </ha-card>
    `, this._bind(g);
  }
  /* ── Event Binding ─────────────────────────── */
  _bind(t) {
    const a = (e) => this._root.getElementById(e), i = a("t-dn"), o = a("t-up");
    i && i.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjustTemp(-1);
    }), o && o.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjustTemp(1);
    }), a("pwr")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._setMode(t ? "heat" : "off");
    }), this._root.querySelectorAll(".pre").forEach((e) => {
      e.addEventListener("click", (s) => {
        s.preventDefault(), s.stopPropagation();
        const c = parseFloat(s.currentTarget.dataset.t || "20");
        this._setPreset(c);
      });
    }), this._root.querySelectorAll(".mode").forEach((e) => {
      e.addEventListener("click", (s) => {
        s.preventDefault(), s.stopPropagation();
        const c = s.currentTarget.dataset.m || "off";
        this._setMode(c);
      });
    });
  }
}
customElements.define("altal-heatpump-card", M);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "altal-heatpump-card",
  name: "Altal Heater Card",
  description: "Premium neumorphic card for Altal heat pump",
  preview: !0,
  documentationURL: "https://github.com/skeep83/altal_heater_card"
});
console.info(
  "%c ALTAL-HEATER-CARD %c v3.0.0 ",
  "color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;",
  "color: #e6642f; background: #e6e7ee; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;"
);
