import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { Random } from '../../../mel_metapage/js/lib/classes/random.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { ResourceSettings } from './resource_base.js';

export { FilterBase, eInputType };

/**
 * @module Resources/Filters
 * @local LoadDataCallback
 * @local eInputType
 * @local FilterBase
 */

/**
 * @callback LoadDataCallback
 * @param {ResourceData[]} data
 * @param {FilterBase} filter
 * @returns {void}
 */

/**
 * Contient les type d'input disponible pour la classe {@link FilterBase}
 * @enum {string}
 */
const eInputType = {
  select: 'select',
  multi_select: 'multi-select',
};

/**
 * @class
 * @classdesc Représente un filtre
 * @extends MelObject
 */
class FilterBase extends MelObject {
  /**
   * Constructeur du filtre
   * @param {string} name Nom du filtre
   * @param {number} size Taille de la colonne du filtre (de 1 à 12)
   * @param {Object} destructured Paramètres du filtre
   * @param {?string} [destructured.load_data_on_change=null] Si on charge les données à chaque changement
   * @param {?string} [destructured.load_data_on_start=null] Si on charge les données
   * @param {eInputType} [destructured.input_type=eInputType.select] Type de l'input (select ou multi-select)
   * @param {!string} [destructured.icon=EMPTY_STRING] Icône du filtre
   * @param {!boolean} [destructured.number=false] Si les valeurs sont toutes des nombres ou non
   */
  constructor(
    name,
    size,
    {
      load_data_on_change = null,
      load_data_on_start = null,
      input_type = eInputType.select,
      icon = EMPTY_STRING,
      number = false,
    },
  ) {
    super();
    this._init()._setup(
      name,
      size,
      load_data_on_change,
      load_data_on_start,
      input_type,
      icon,
      number,
    );
  }

  /**
   * @private
   * @override
   */
  main() {
    super.main();
  }

  /**
   * Initialise les variables
   * @private
   * @returns {FilterBase} Chaînage
   */
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
     * @type {eInputType}
     */
    this._input_type = EMPTY_STRING;
    /**
     * Filtre
     * @private
     * @type {?external:jQuery}
     */
    this._$filter = null;
    /**
     * Id du filtre
     * @private
     * @type {?string}
     */
    this._id = null;
    /**
     * Icone du filtre
     * @private
     * @type {string}
     */
    this._icon = EMPTY_STRING;
    /**
     * Le valeurs de ce filtre sont seulement des nombres
     * @private
     * @type {boolean}
     */
    this._number = false;
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

  /**
   * Associes les valeurs des variables
   * @private
   * @param {*} name
   * @param {*} size
   * @param {*} load_data_on_change
   * @param {*} load_data_on_start
   * @param {*} input_type
   * @param {*} icon
   */
  _setup(
    name,
    size,
    load_data_on_change,
    load_data_on_start,
    input_type,
    icon,
    number,
  ) {
    this._name = name;
    this._size = size;
    this._load_data_on_change = load_data_on_change;
    this._load_data_on_start = load_data_on_start;
    this._input_type = input_type;
    this._icon = icon;
    this._number = number;

    Object.defineProperty(this, 'name', {
      value: rcmail.gettext(name, 'mel_cal_resources'),
      writable: false,
      enumerable: true,
      configurable: false,
    });

    Object.defineProperty(this, '_$filter', {
      get: () => {
        const $filter = $(`#filter-${this._id}`);

        if ($filter.length) return $filter;
        else return parent.$(`#filter-${this._id}`);
      },
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

  /**
   * Génère le select du filtre
   * @private
   * @param {____JsHtml} jshtml
   * @param  {...any} args
   * @returns {any}
   */
  _generate_select(jshtml, ...args) {
    const [localities] = args;

    switch (this._input_type) {
      case 'multi-select':
      case 'select':
        return jshtml
          .select({
            class: localities.length ? 'placeholder' : 'disabled',
            onchange: this.on_select_change.bind(this),
          })
          .addClass('fo-select')
          .attr(
            this._input_type === 'multi-select' ? 'multiple' : 'single',
            true,
          )
          .attr('data-fname', this.name)
          .addClass('pretty-select')
          .attr(
            localities.length ? 'enabled' : 'disabled',
            localities.length ? 'enabled' : 'disabled',
          )
          .option({ value: '' })
          .css('display', 'none')
          .text(rcmail.gettext(this._name, 'mel_cal_resources'))
          .end()
          .attr('id', `filter-${this._id}`)
          .each(
            (jhtml, locality) => {
              return jhtml
                .option({ value: locality.uid })
                .text(locality.name)
                .end();
            },
            ...MelEnumerable.from(localities).orderBy((x) => x.name),
          )
          .end();

      default:
        return jshtml.input({
          type: this._input_type,
          id: `filter-${this._id}`,
        });
    }
  }

  /**
   * Ajoute un évènement qui sera appelé lors du chargement des premières données
   * @param {LoadDataCallback} event Évènement à ajouter qui sera appelé
   * @returns {FilterBase} Chaîne
   */
  push_event(event) {
    this.event_on_data_loaded.push(event);
    return this;
  }

  /**
   *Ajoute un évènement qui sera appelé lors du chargement des données
   * @param {LoadDataCallback} event Évènement à ajouter qui sera appelé
   * @returns {FilterBase} Chaîne
   */
  push_event_data_changed(event) {
    this.event_on_data_changed.push(event);
    return this;
  }

  /**
   * Évènement appelé lors du changement de la valeur du filtre
   */
  on_select_change() {
    if (this._load_data_on_change) this._load_data();
    else this.event_on_data_changed.call(this.value, this);
  }

  /**
   * Récupère les données lorsque le filtre est chargé
   * @private
   * @returns {Promise<*>}
   * @async
   */
  async _load_first_data() {
    let return_data = [];
    await this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'load_element',
      params: {
        _function: this._load_data_on_start,
      },
      on_success: (data) => {
        // console.log('_load_first_data', data);
        if (typeof data === 'string') data = JSON.parse(data);

        return_data = data;
      },
    });

    return return_data;
  }

  /**
   * Récupère les données du filtre lors du changement de la valeur du filtre
   * @private
   * @returns {Promise<*>}
   * @async
   */
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
        // console.log('_load_data', data);
        if (typeof data === 'string') data = JSON.parse(data);

        return_data = data;

        this.event_on_data_loaded.call(return_data, this);
      },
    });

    return return_data;
  }

  /**
   * Génère le filtre.
   *
   * Récupère les valeurs du select en base si elles n'éxistent pas.
   * @async
   * @returns {Promise<____JsHtml>}
   * @frommodulereturn {JsHtml} {@linkto ____JsHtml}
   */
  async generate() {
    const localities = this._load_data_on_start
      ? await this._load_first_data()
      : [];
    return MelHtml.start
      .div({ class: `col-${this._size}` })
      .div()
      .css({ width: '100%', position: 'relative' })
      .icon(this._icon || 'filter_alt', { class: 'fo-filter-icon' })
      .end()
      .action(this._generate_select.bind(this), localities)
      .end()
      .end();
  }

  /**
   * Génère un id
   * @private
   * @returns {string}
   */
  _generate_id() {
    const id = MelEnumerable.random(0, Random.intRange(5, 9))
      .take(Random.intRange(1, 15))
      .toArray()
      .join('')
      .replaceAll('.', '');

    if ($(`#filter-${id}`).length > 0) return this._generate_id();
    else return id;
  }

  /**
   * Vérifie si une resource réuni les conditions du filtre
   * @param {{data:ResourcesBase}} resource Resource à vérifier
   * @returns {boolean}
   */
  filter(resource) {
    if (!(this._$filter.val() || false) || this.value === '/') return true;
    else {
      switch (this._input_type) {
        case 'multi-select':
          return new ResourceSettings(this._$filter.val()).is(resource);
        //break;

        default:
          return (
            // eslint-disable-next-line quotes
            resource.data[this._name].replaceAll('’', "'").toUpperCase() ===
            this._$filter
              .find(`[value="${this.value}"]`)
              .text()
              // eslint-disable-next-line quotes
              .replaceAll('’', "'")
              .toUpperCase()
          );
      }
    }
  }

  has_only_number_values() {
    return this._number;
  }
}
