/**
 * Altal Heater Card - Editor
 * v2.0.0 — Extended settings
 */

interface CardConfig {
  climate_entity?: string;
  current_temp_entity?: string;
  target_temp_entity?: string;
  delta_t_entity?: string;
  heating_entity?: string;
  name?: string;
  image?: string;
  quick_presets?: number[];
  show_diagnostics?: boolean;
  show_presets?: boolean;
  show_controls?: boolean;
  show_image?: boolean;
  compact?: boolean;
}

class AltalHeatpumpCardEditor extends HTMLElement {
  private _config!: CardConfig;
  private _hass: any;
  private _root!: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  set hass(hass: any) { this._hass = hass; }

  setConfig(config: CardConfig) {
    this._config = { ...config };
    this._render();
  }

  private _render() {
    const C = this._config;
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
          <input type="text" id="name" value="${C.name || ''}" placeholder="Altal Heat Pump">
        </div>

        <div class="section">
          <div class="section-title">Entities</div>
          <div class="row">
            <label>Climate entity</label>
            <input type="text" id="climate_entity" value="${C.climate_entity || ''}" placeholder="climate.altal_home_heater">
          </div>
          <div class="row">
            <label>Текущая температура</label>
            <input type="text" id="current_temp_entity" value="${C.current_temp_entity || ''}" placeholder="sensor.altal_current_temp">
          </div>
          <div class="row">
            <label>Целевая температура</label>
            <input type="text" id="target_temp_entity" value="${C.target_temp_entity || ''}" placeholder="sensor.altal_target_temp">
          </div>
          <div class="row">
            <label>ΔT (дельта)</label>
            <input type="text" id="delta_t_entity" value="${C.delta_t_entity || ''}" placeholder="sensor.altal_delta_t">
          </div>
          <div class="row">
            <label>Статус нагрева</label>
            <input type="text" id="heating_entity" value="${C.heating_entity || ''}" placeholder="binary_sensor.altal_heating">
          </div>
        </div>

        <div class="section">
          <div class="section-title">Внешний вид</div>
          <div class="row">
            <label>Изображение (URL)</label>
            <input type="text" id="image" value="${C.image || ''}" placeholder="/local/altal-pump.png">
            <div class="hint">Путь к изображению теплового насоса</div>
          </div>
          <div class="row">
            <label>Пресеты (через запятую)</label>
            <input type="text" id="quick_presets" value="${(C.quick_presets || [19, 20, 22, 24]).join(', ')}" placeholder="19, 20, 22, 24">
          </div>
        </div>

        <div class="section">
          <div class="section-title">Настройки отображения</div>
          <div class="toggle-row">
            <span class="toggle-label">Показать изображение</span>
            <div class="toggle ${C.show_image !== false ? 'on' : ''}" data-field="show_image"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать управление</span>
            <div class="toggle ${C.show_controls !== false ? 'on' : ''}" data-field="show_controls"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать пресеты</span>
            <div class="toggle ${C.show_presets !== false ? 'on' : ''}" data-field="show_presets"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Диагностика ΔT</span>
            <div class="toggle ${C.show_diagnostics !== false ? 'on' : ''}" data-field="show_diagnostics"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Компактный режим</span>
            <div class="toggle ${C.compact ? 'on' : ''}" data-field="compact"><div class="knob"></div></div>
          </div>
        </div>
      </div>
    `;

    // Text inputs
    ['name', 'climate_entity', 'current_temp_entity', 'target_temp_entity',
      'delta_t_entity', 'heating_entity', 'image'].forEach(field => {
        const input = this._root.getElementById(field) as HTMLInputElement;
        input?.addEventListener('change', (e) => {
          const val = (e.target as HTMLInputElement).value;
          this._config = { ...this._config, [field]: val || undefined };
          this._dispatch();
        });
      });

    // Presets
    const presetsInput = this._root.getElementById('quick_presets') as HTMLInputElement;
    presetsInput?.addEventListener('change', (e) => {
      const nums = (e.target as HTMLInputElement).value
        .split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      this._config = { ...this._config, quick_presets: nums.length ? nums : undefined };
      this._dispatch();
    });

    // Toggles
    this._root.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const field = (toggle as HTMLElement).dataset.field as keyof CardConfig;
        const current = this._config[field];
        const newVal = current === false ? true : (current === true || current === undefined ? false : !current);
        (this._config as any)[field] = field === 'compact' ? !this._config.compact : newVal;
        this._dispatch();
        this._render();
      });
    });
  }

  private _dispatch() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true, composed: true,
    }));
  }
}

customElements.define('altal-heatpump-card-editor', AltalHeatpumpCardEditor);
