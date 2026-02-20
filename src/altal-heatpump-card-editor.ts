/**
 * Altal Heatpump Card - Editor
 * Home Assistant Lovelace Custom Card Editor
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
}

class AltalHeatpumpCardEditor extends HTMLElement {
    private _config!: CardConfig;
    private _hass: any;
    private _root!: ShadowRoot;

    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
    }

    set hass(hass: any) {
        this._hass = hass;
    }

    setConfig(config: CardConfig) {
        this._config = { ...config };
        this._render();
    }

    private _render() {
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
            value="${this._config.name || ''}" 
            placeholder="Altal Heat Pump">
        </div>

        <div class="section">
          <label>Климат (entity)</label>
          <input type="text" id="climate_entity" 
            value="${this._config.climate_entity || ''}" 
            placeholder="climate.altal_home_heater">
          <div class="hint">climate.* entity для управления</div>
        </div>

        <div class="row" style="margin-top:12px">
          <label>Текущая температура</label>
          <input type="text" id="current_temp_entity" 
            value="${this._config.current_temp_entity || ''}" 
            placeholder="sensor.altal_current_temp">
        </div>

        <div class="row">
          <label>Целевая температура</label>
          <input type="text" id="target_temp_entity" 
            value="${this._config.target_temp_entity || ''}" 
            placeholder="sensor.altal_target_temp">
        </div>

        <div class="row">
          <label>ΔT (дельта)</label>
          <input type="text" id="delta_t_entity" 
            value="${this._config.delta_t_entity || ''}" 
            placeholder="sensor.altal_delta_t">
        </div>

        <div class="row">
          <label>Статус нагрева</label>
          <input type="text" id="heating_entity" 
            value="${this._config.heating_entity || ''}" 
            placeholder="binary_sensor.altal_heating">
        </div>

        <div class="section">
          <label>Изображение (URL)</label>
          <input type="text" id="image" 
            value="${this._config.image || ''}" 
            placeholder="/local/altal-pump.png">
          <div class="hint">Путь к изображению теплового насоса</div>
        </div>

        <div class="row" style="margin-top:12px">
          <label>Быстрые пресеты (через запятую)</label>
          <input type="text" id="quick_presets" 
            value="${(this._config.quick_presets || [19, 20, 22, 24]).join(', ')}" 
            placeholder="19, 20, 22, 24">
        </div>
      </div>
    `;

        // Bind events
        const fields = [
            'name', 'climate_entity', 'current_temp_entity',
            'target_temp_entity', 'delta_t_entity', 'heating_entity', 'image'
        ];

        fields.forEach(field => {
            const input = this._root.getElementById(field) as HTMLInputElement;
            if (input) {
                input.addEventListener('change', (e) => {
                    const value = (e.target as HTMLInputElement).value;
                    this._config = { ...this._config, [field]: value || undefined };
                    this._dispatch();
                });
            }
        });

        const presetsInput = this._root.getElementById('quick_presets') as HTMLInputElement;
        if (presetsInput) {
            presetsInput.addEventListener('change', (e) => {
                const val = (e.target as HTMLInputElement).value;
                const nums = val.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
                this._config = { ...this._config, quick_presets: nums.length ? nums : undefined };
                this._dispatch();
            });
        }
    }

    private _dispatch() {
        const event = new CustomEvent('config-changed', {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
}

customElements.define('altal-heatpump-card-editor', AltalHeatpumpCardEditor);
