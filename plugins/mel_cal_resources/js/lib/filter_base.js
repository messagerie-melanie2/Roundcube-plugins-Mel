import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Random } from '../../../mel_metapage/js/lib/classes/random.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export { FilterBase };

/**
 * @callback LoadDataCallback
 * @param {any[]} data
 * @param {FilterBase} filter
 * @returns {void}
 */

/**
 * @class
 * @classdesc Représente un filtre
 */
class FilterBase extends MelObject {
  /**
   *
   * @param {string} name
   * @param {number} size
   * @param {!Object} destructured
   * @param {?string} [destructured.load_data_on_change=null]
   * @param {?string} [destructured.load_data_on_start=null]
   * @param {string} [destructured.input_type='select']
   */
  constructor(
    name,
    size,
    {
      load_data_on_change = null,
      load_data_on_start = null,
      input_type = 'select',
    },
  ) {
    super();
    this._init()._setup(
      name,
      size,
      load_data_on_change,
      load_data_on_start,
      input_type,
    );
  }

  _init() {
    /**
     * Id du filtre
     * @private
     * @type {string}
     */
    this._name = EMPTY_STRING;
    /**
     * Taille de la colonne du filtre
     * @private
     * @type {number}
     */
    this._size = 0;
    /**
     * Charger les données à chaque changement
     * @private
     * @type {?string}
     */
    this._load_data_on_change = null;
    /**
     * Charger les données au départ
     * @private
     * @type {?string}
     */
    this._load_data_on_start = null;
    /**
     * Type de l'input
     * @private
     * @type {string}
     */
    this._input_type = EMPTY_STRING;
    /**
     * Filtre
     * @private
     * @type {?external:jQuery}
     */
    this._$filter = null;
    this._id = null;
    /**
     * Texte du filtre
     * @readonly
     * @type {string}
     */
    this.name = EMPTY_STRING;
    /**
     * Valeur du filtre
     * @readonly
     * @type {string}
     */
    this.value = EMPTY_STRING;

    /**
     * Évènement déclenché lors du chargement des données
     * @type {BnumEvent<LoadDataCallback>}
     */
    this.event_on_data_loaded = new BnumEvent();
    /**
     * Évènement déclenché lors du chargement des données
     * @type {BnumEvent}
     */
    this.event_on_data_changed = new BnumEvent();
    return this;
  }

  _setup(name, size, load_data_on_change, load_data_on_start, input_type) {
    this._name = name;
    this._size = size;
    this._load_data_on_change = load_data_on_change;
    this._load_data_on_start = load_data_on_start;
    this._input_type = input_type;

    Object.defineProperty(this, 'name', {
      value: rcmail.gettext(name, 'mel_cal_resources'),
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, '_$filter', {
      get: () => $(`#filter-${this._id}`),
    });

    Object.defineProperty(this, 'value', {
      get: () => {
        return this._$filter?.val?.() || EMPTY_STRING;
      },
    });

    Object.defineProperty(this, '_id', {
      value: this._generate_id(),
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  _generate_select(jshtml, ...args) {
    const [localities] = args;
    switch (this._input_type) {
      case 'multi-select':
        break;

      case 'select':
        return jshtml
          .select({
            class: localities.length ? 'placeholder' : 'disabled',
            onchange: this.on_select_change.bind(this),
          })
          .attr(
            localities.length ? 'enabled' : 'disabled',
            localities.length ? 'enabled' : 'disabled',
          )
          .option({ value: '' })
          .css('display', 'none')
          .text(this._name)
          .end()
          .attr('id', `filter-${this._id}`)
          .each(
            (jhtml, locality) => {
              return jhtml
                .option({ value: locality.uid })
                .text(locality.name)
                .end();
            },
            ...localities,
          )
          .end();

      default:
        return jshtml.input({
          type: this._input_type,
          id: `filter-${this._id}`,
        });
    }

    return jshtml;
  }

  /**
   *
   * @param {LoadDataCallback} event
   * @returns {FilterBase} Chaîne
   */
  push_event(event) {
    this.event_on_data_loaded.push(event);
    return this;
  }

  /**
   *
   * @param {LoadDataCallback} event
   * @returns {FilterBase} Chaîne
   */
  push_event_data_changed(event) {
    this.event_on_data_loaded.push(event);
    return this;
  }

  on_select_change() {
    if (this._load_data_on_change) this._load_data();
    else this.event_on_data_changed.call(this.value, this);
  }

  async _load_first_data() {
    let return_data = [];
    await this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'load_element',
      params: {
        _function: this._load_data_on_start,
      },
      on_success: (data) => {
        if (typeof data === 'string') data = JSON.parse(data);

        return_data = data;
      },
    });

    return return_data;
  }

  async _load_data() {
    let return_data = [];
    await this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'load',
      params: {
        _function: this._load_data_on_change,
        _value: this.value,
      },
      on_success: (data) => {
        if (typeof data === 'string') data = JSON.parse(data);

        return_data = data;

        this.event_on_data_loaded.call(return_data, this);
      },
    });

    return return_data;
  }

  async generate() {
    const localities = this._load_data_on_start
      ? await this._load_first_data()
      : [];
    return MelHtml.start
      .div({ class: `col-${this._size}` })
      .action(this._generate_select.bind(this), localities)
      .end();
  }

  _generate_id() {
    const id = MelEnumerable.random(0, Random.intRange(5, 9))
      .take(Random.intRange(1, 15))
      .toArray()
      .join('')
      .replaceAll('.', '');

    if ($(`#filter-${id}`).length > 0) return this._generate_id();
    else return id;
  }

  filter(resource) {
    return !!resource;
  }
}
