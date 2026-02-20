class z extends HTMLElement {
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
    ].forEach((e) => {
      this._root.getElementById(e)?.addEventListener("change", (s) => {
        const a = s.target.value;
        this._config = { ...this._config, [e]: a || void 0 }, this._dispatch();
      });
    }), this._root.getElementById("quick_presets")?.addEventListener("change", (e) => {
      const i = e.target.value.split(",").map((s) => parseFloat(s.trim())).filter((s) => !isNaN(s));
      this._config = { ...this._config, quick_presets: i.length ? i : void 0 }, this._dispatch();
    }), this._root.querySelectorAll(".toggle").forEach((e) => {
      e.addEventListener("click", () => {
        const i = e.dataset.field, s = this._config[i], a = s === !1 ? !0 : s === !0 || s === void 0 ? !1 : !s;
        this._config[i] = i === "compact" ? !this._config.compact : a, this._dispatch(), this._render();
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
customElements.define("altal-heatpump-card-editor", z);
class E extends HTMLElement {
  constructor() {
    super(), this._history = [], this._pendingTarget = null, this._svcTimer = null, this._ico = {
      thermo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 10-5 0v11.26a4.5 4.5 0 105 0z"/><circle cx="11.5" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="11.5" y1="14" x2="11.5" y2="18"/></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>',
      delta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 4l-8 16h16z"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.8 1.5-3.2 3-5 1.5 1.8 3 3.2 3 5 0 1.7-1.3 3-3 3z"/></svg>',
      minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v8"/><path d="M17.66 6.34a8 8 0 11-11.32 0"/></svg>',
      heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/></svg>',
      off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>',
      down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
      stable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'
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
    const o = this._hass;
    this._hass = t;
    const e = this._v(t, this._config.current_temp_entity);
    if (e !== null) {
      const s = Date.now();
      this._history.push({ t: e, ts: s }), this._history = this._history.filter((a) => a.ts > s - 30 * 6e4);
    }
    if (this._pendingTarget !== null) {
      const s = t.states[this._config.climate_entity]?.attributes?.temperature;
      s != null && Math.abs(parseFloat(s) - this._pendingTarget) < 0.01 && (this._pendingTarget = null);
    }
    (!o || o.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || o.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || o.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || o.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || o.states[this._config.heating_entity] !== t.states[this._config.heating_entity]) && this._render();
  }
  getCardSize() {
    return this._config?.compact ? 4 : 7;
  }
  /* ── Helpers ───────────────────────────── */
  _v(t, o) {
    const e = t?.states?.[o];
    if (!e || e.state === "unavailable" || e.state === "unknown") return null;
    const i = parseFloat(e.state);
    return isNaN(i) ? null : i;
  }
  _trend() {
    if (this._history.length < 3) return "flat";
    const t = this._history.slice(-5), o = t[t.length - 1].t - t[0].t;
    return o > 0.3 ? "up" : o < -0.3 ? "down" : "flat";
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
  _dtDiag(t, o, e, i) {
    const s = { icon: "", title: "", text: "", cls: "hide" };
    if (!i) return s;
    if (t === null || t === 0) return { icon: "⏳", title: "Ожидание данных ΔT", text: "Данные ещё не получены", cls: "neutral" };
    const a = (e ?? 0) - (o ?? 0);
    return a <= 0.7 && a >= -0.5 ? {
      icon: "🟢",
      title: "Режим поддержания",
      text: `Температура близка к уставке. ΔT ${t.toFixed(1)}°C — нормально при модуляции`,
      cls: "good"
    } : a >= 1.5 && (t < 2 || t > 10) ? {
      icon: "🧊",
      title: "Переходный режим",
      text: `Нагрев: ${o?.toFixed(1)} → ${e?.toFixed(1)}°C. ΔT=${t.toFixed(1)}°C — ещё не стабилизировался`,
      cls: "info"
    } : t >= 4 && t <= 7 ? {
      icon: "✅",
      title: `ΔT в норме: ${t.toFixed(1)}°C`,
      text: "Оптимальная разница подача–обратка",
      cls: "good"
    } : t < 4 ? {
      icon: "⚠️",
      title: `ΔT низкий: ${t.toFixed(1)}°C`,
      text: "Возможные причины: высокий расход, много контуров, низкая мощность компрессора",
      cls: "warn"
    } : {
      icon: "⚠️",
      title: `ΔT высокий: ${t.toFixed(1)}°C`,
      text: "Возможные причины: малый расход, засорён фильтр, воздух в системе, закрыты клапаны",
      cls: "warn"
    };
  }
  /* ── Actions ───────────────────────────── */
  _adjust(t) {
    const o = this._config.step || 0.5, e = this._hass.states[this._config.climate_entity], i = this._pendingTarget ?? parseFloat(e?.attributes?.temperature);
    if (isNaN(i)) return;
    const s = Math.round((i + t * o) * 10) / 10, a = Math.max(e?.attributes?.min_temp ?? 5, Math.min(e?.attributes?.max_temp ?? 35, s));
    this._pendingTarget = a;
    const r = this._root.querySelector(".sp-val");
    r && (r.textContent = a.toFixed(1) + "°"), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: a
      });
    }, 600);
  }
  _preset(t) {
    this._pendingTarget = t;
    const o = this._root.querySelector(".sp-val");
    o && (o.textContent = t.toFixed(1) + "°"), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: t
      });
    }, 300);
  }
  _mode(t) {
    this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.climate_entity,
      hvac_mode: t
    });
  }
  /* ══════════════════ CSS ══════════════════ */
  _css() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');

      :host {
        --bg: var(--card-background-color, #e3e6ec);
        --bg2: var(--secondary-background-color, #d1d5db);
        --txt: var(--primary-text-color, #3b3f5c);
        --txt2: var(--secondary-text-color, #8b8fa3);
        --accent: var(--primary-color, #e6642f);

        --sh-d: rgba(166,180,200,0.7);
        --sh-l: rgba(255,255,255,0.8);
        --raised: 6px 6px 14px var(--sh-d), -6px -6px 14px var(--sh-l);
        --raised-s: 3px 3px 8px var(--sh-d), -3px -3px 8px var(--sh-l);
        --inset: inset 3px 3px 7px var(--sh-d), inset -3px -3px 7px var(--sh-l);
        --inset-s: inset 2px 2px 4px var(--sh-d), inset -2px -2px 4px var(--sh-l);
        --btn: 4px 4px 10px var(--sh-d), -4px -4px 10px var(--sh-l);
        --btn-p: inset 3px 3px 7px var(--sh-d), inset -3px -3px 7px var(--sh-l);

        --heat: #e6642f;
        --heat-g: rgba(230,100,47,0.15);
        --idle: #93a5be;
        --good: #05a677;
        --warn: #e5a100;
        --info: #3b82f6;

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
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
        padding: 24px;
      }

      /* ─── Top ─── */
      .top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 24px;
      }
      .top-left { display: flex; align-items: center; gap: 16px; }

      .pump-thumb {
        width: 80px; height: 80px;
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
        font-size: 12px; font-weight: 700;
        color: var(--txt2); letter-spacing: 2px;
      }

      .top-info {}
      .top-info .name {
        font-size: 20px; font-weight: 600;
        color: var(--txt); line-height: 1.3;
      }
      .top-info .status {
        font-size: 13px; font-weight: 400;
        color: var(--txt2); margin-top: 4px;
      }

      .top-right {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: 10px;
      }

      /* Badge */
      .badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 14px; border-radius: 20px;
        font-size: 11px; font-weight: 600;
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
        width: 44px; height: 44px; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--idle); transition: all 0.25s;
      }
      .pwr:hover { box-shadow: 5px 5px 12px var(--sh-d), -5px -5px 12px var(--sh-l); }
      .pwr:active { box-shadow: var(--btn-p); }
      .pwr.on { color: var(--heat); }
      .pwr svg { width: 22px; height: 22px; }

      /* ─── Main dial area ─── */
      .dial-area {
        display: flex; align-items: center; justify-content: center;
        gap: 20px; margin-bottom: 8px;
      }

      /* Side +/- */
      .side-btn {
        width: 52px; height: 52px; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--txt); flex-shrink: 0;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .side-btn:hover { transform: scale(1.06); box-shadow: 5px 5px 12px var(--sh-d), -5px -5px 12px var(--sh-l); }
      .side-btn:active { box-shadow: var(--btn-p); transform: scale(0.94); }
      .side-btn svg { width: 24px; height: 24px; }

      /* Circle */
      .circle {
        width: 180px; height: 180px;
        border-radius: 50%; flex-shrink: 0;
        background: var(--bg); box-shadow: var(--raised);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .circle-in {
        width: 152px; height: 152px;
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
        font-size: 11px; font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
        position: relative; z-index: 3;
      }
      .c-val {
        font-size: 46px; font-weight: 300; line-height: 1;
        color: var(--txt); margin-top: 2px;
        position: relative; z-index: 3; transition: color 0.3s;
      }
      .c-val sup { font-size: 20px; font-weight: 400; }
      .c-val.hot { color: var(--heat); }

      .c-trend {
        display: flex; align-items: center; gap: 4px;
        margin-top: 6px; font-size: 11px; font-weight: 500;
        color: var(--txt2); position: relative; z-index: 3;
      }
      .c-trend svg { width: 14px; height: 14px; }
      .c-trend.up { color: var(--heat); }
      .c-trend.down { color: var(--info); }
      .c-trend.flat { color: var(--good); }

      /* ─── Setpoint below dial ─── */
      .setpoint {
        text-align: center; margin-bottom: 22px;
      }
      .sp-lbl {
        font-size: 11px; font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
      }
      .sp-val {
        font-size: 30px; font-weight: 600; color: var(--txt);
        line-height: 1.3; transition: color 0.3s;
      }
      .sp-val.hot { color: var(--heat); }

      /* ─── Sensor metrics ─── */
      .metrics {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 14px; margin-bottom: 18px;
      }
      .metric {
        background: var(--bg);
        box-shadow: var(--raised-s);
        border-radius: 18px; padding: 16px 18px;
        display: flex; align-items: center; gap: 14px;
        transition: all 0.25s;
        animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .metric:nth-child(1){animation-delay:.1s}
      .metric:nth-child(2){animation-delay:.15s}
      .metric:nth-child(3){animation-delay:.2s}
      .metric:nth-child(4){animation-delay:.25s}
      @keyframes pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:none} }
      .metric:hover { transform: translateY(-2px); box-shadow: 5px 5px 14px var(--sh-d), -5px -5px 14px var(--sh-l); }
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

      /* ─── Diagnostics ─── */
      .diag {
        background: var(--bg); box-shadow: var(--inset);
        border-radius: 18px; padding: 16px 20px;
        margin-bottom: 18px; display: flex;
        align-items: flex-start; gap: 14px;
        font-size: 13px; font-weight: 400; line-height: 1.6;
        color: var(--txt2);
        animation: pop 0.4s 0.3s both;
      }
      .diag.hide { display: none; }
      .diag .d-i { font-size: 24px; flex-shrink: 0; line-height: 1; }
      .diag .d-b { flex: 1; }
      .diag .d-t { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
      .diag.good .d-t { color: var(--good); }
      .diag.warn .d-t { color: var(--warn); }
      .diag.info .d-t { color: var(--info); }

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
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2);font-family:'Rubik',sans-serif">Загрузка…</div>`;
      return;
    }
    const t = this._config, o = this._hass, e = o.states[t.climate_entity];
    if (!e) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${t.climate_entity}</p></div>`;
      return;
    }
    const i = this._v(o, t.current_temp_entity), s = this._v(o, t.target_temp_entity), a = this._v(o, t.delta_t_entity), r = o.states[t.heating_entity]?.state === "on", c = e.state, h = c === "off", p = this._pendingTarget ?? e.attributes.temperature, w = e.attributes.hvac_modes || ["heat", "off"], y = t.name || e.attributes.friendly_name || "Altal Heat Pump", k = t.quick_presets || [19, 20, 22, 24], l = this._trend(), x = l === "up" ? this._ico.up : l === "down" ? this._ico.down : this._ico.stable, u = l === "up" ? "Растёт" : l === "down" ? "Падает" : "Стабильно", d = this._dtDiag(a, i, s, r);
    let g = "off", v = "Выкл";
    r ? (g = "heating", v = "Нагрев") : h || (g = "idle", v = "Ожидание");
    const m = { heat: "Обогрев", off: "Выкл", cool: "Охлажд.", auto: "Авто" }, $ = { heat: this._ico.heat, off: this._ico.off }, T = a != null ? Math.min(100, a / 12 * 100) : 0, C = a != null ? a >= 4 && a <= 7 ? "ok" : a < 3 || a > 9 ? "bad" : "mid" : "ok", f = t.show_image !== !1, b = p != null ? parseFloat(p).toFixed(1) : "—";
    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          <!-- TOP -->
          <div class="top">
            <div class="top-left">
              ${f && t.image ? `<div class="pump-thumb"><img src="${t.image}" alt="Altal"/></div>` : f ? '<div class="pump-thumb empty">ALTAL</div>' : ""}
              <div class="top-info">
                <div class="name">${y}</div>
                <div class="status">Тепловой насос · ${m[c] || c}</div>
              </div>
            </div>
            <div class="top-right">
              <div class="badge ${g}"><span class="dot"></span>${v}</div>
              <button class="pwr ${h ? "" : "on"}" id="pwr">${this._ico.power}</button>
            </div>
          </div>

          <!-- DIAL AREA: [-] [circle] [+] -->
          ${t.show_controls !== !1 ? `
          <div class="dial-area">
            <button class="side-btn" id="dn">${this._ico.minus}</button>
            <div class="circle">
              <div class="spin-ring ${r ? "on" : ""}"></div>
              <div class="circle-in">
                <div class="glow ${r ? "on" : ""}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${r ? "hot" : ""}">${i !== null ? i.toFixed(1) : "—"}<sup>°</sup></span>
                <span class="c-trend ${l}">${x} ${u}</span>
              </div>
            </div>
            <button class="side-btn" id="up">${this._ico.plus}</button>
          </div>

          <!-- SETPOINT -->
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${r ? "hot" : ""}">${b}°</div>
          </div>
          ` : `
          <div class="dial-area">
            <div class="circle">
              <div class="spin-ring ${r ? "on" : ""}"></div>
              <div class="circle-in">
                <div class="glow ${r ? "on" : ""}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${r ? "hot" : ""}">${i !== null ? i.toFixed(1) : "—"}<sup>°</sup></span>
                <span class="c-trend ${l}">${x} ${u}</span>
              </div>
            </div>
          </div>
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${r ? "hot" : ""}">${b}°</div>
          </div>
          `}

          <!-- METRICS -->
          <div class="metrics">
            <div class="metric">
              <div class="m-ico ${r ? "hot" : ""}">${this._ico.thermo}</div>
              <div class="m-txt">
                <div class="m-val">${i !== null ? i.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">Текущая</div>
              </div>
            </div>
            <div class="metric">
              <div class="m-ico">${this._ico.target}</div>
              <div class="m-txt">
                <div class="m-val">${s !== null ? s.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">Уставка</div>
              </div>
            </div>
            <div class="metric">
              <div class="m-ico">${this._ico.delta}</div>
              <div class="m-txt">
                <div class="m-val">${a !== null ? a.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">ΔT</div>
                <div class="dt-bar"><div class="dt-fill ${C}" style="width:${T}%"></div></div>
              </div>
            </div>
            <div class="metric">
              <div class="m-ico ${r ? "hot" : ""}">${this._ico.flame}</div>
              <div class="m-txt">
                <div class="m-val ${r ? "hot" : ""}">${r ? "Активен" : "Нет"}</div>
                <div class="m-lbl">Нагрев</div>
              </div>
            </div>
          </div>

          <!-- DIAGNOSTICS -->
          ${t.show_diagnostics !== !1 ? `
            <div class="diag ${d.cls}">
              <span class="d-i">${d.icon}</span>
              <div class="d-b">
                <div class="d-t">${d.title}</div>
                ${d.text ? `<div>${d.text}</div>` : ""}
              </div>
            </div>
          ` : ""}

          <!-- PRESETS -->
          ${t.show_presets !== !1 ? `
            <div class="presets">
              ${k.map((n) => `<button class="chip ${p != null && Math.abs(n - parseFloat(p)) < 0.1 ? "on" : ""}" data-t="${n}">${n}°</button>`).join("")}
            </div>
          ` : ""}

          <!-- MODES -->
          <div class="modes">
            ${w.map((n) => `<button class="mbtn ${n === c ? "on" : ""} ${n}" data-m="${n}">${$[n] || ""} ${m[n] || n}</button>`).join("")}
          </div>

        </div>
      </ha-card>
    `, this._bindAll(h);
  }
  /* ── Events ───────────────────────────── */
  _bindAll(t) {
    const o = (e) => this._root.getElementById(e);
    o("dn")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjust(-1);
    }), o("up")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjust(1);
    }), o("pwr")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._mode(t ? "heat" : "off");
    }), this._root.querySelectorAll(".chip").forEach(
      (e) => e.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this._preset(parseFloat(i.currentTarget.dataset.t || "20"));
      })
    ), this._root.querySelectorAll(".mbtn").forEach(
      (e) => e.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this._mode(i.currentTarget.dataset.m || "off");
      })
    );
  }
}
customElements.define("altal-heatpump-card", E);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "altal-heatpump-card",
  name: "Altal Heater Card",
  description: "Premium neumorphic card for Altal heat pump",
  preview: !0,
  documentationURL: "https://github.com/skeep83/altal_heater_card"
});
console.info(
  "%c ALTAL-HEATER-CARD %c v4.0.0 ",
  "color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;",
  "color: #e6642f; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;"
);
