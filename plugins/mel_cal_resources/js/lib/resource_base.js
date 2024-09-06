import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import {
  DialogPage,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
  DATE_TIME_FORMAT,
} from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { template_resource } from '../../skins/mel_elastic/js_template/resource.js';
import { FavoriteLoader } from './favorite_loader.js';
import { FilterBase, eInputType } from './filter_base.js';
import { ResourceBaseFunctions } from './resources_functions.js';

export { ResourcesBase, ResourceSettings };

/**
 * Contient les classes qui permet de gérer et afficher les ressources
 * @module Resources
 * @property {module:Resources/Filters} Filters
 * @property {module:Resources/Favorites/Loaders} FavoriteLoader
 * @property {module:Resources/Location} Location
 * @property {module:Resources/ResourceBaseFunctions/Functions} Functions
 * @local ResourceData
 * @local ResourcesBase
 * @local ResourceObject
 */

/**
 * @typedef ResourceData
 * @property {string} bal
 * @property {string} batiment
 * @property {?number} capacite
 * @property {?string} caracteristiques
 * @property {?string} description
 * @property {string} dn
 * @property {string} email
 * @property {string[]} email_list
 * @property {string} etage
 * @property {string} fullname
 * @property {string} locality
 * @property {string} name
 * @property {string} postal_code
 * @property {string} room_number
 * @property {?string} service
 * @property {string} street
 * @property {?string} title
 * @property {string} type
 * @property {string} uid
 */

/**
 * @typedef ResourceObject
 * @property {ResourceData} data
 */

/**
 * @class
 * @classdesc Représente une ressource
 * @extends MelObject
 */
class ResourcesBase extends MelObject {
  /**
   * Constructeur de la classe
   * @param {string} name Id de la ressource
   * @param {FilterConfig[]} filters Liste des filtres de la ressource. Ils seront convertit en {@link FilterBase}
   */
  constructor(name, filters) {
    super(name, filters);
  }

  /**
   * Fonction principale
   * @override
   * @private
   * @param  {...any} args
   */
  main(...args) {
    this._init()._setup(...args);
  }

  /**
   * Initialise les variables
   * @private
   * @returns {ResourcesBase} Chaînage
   */
  _init() {
    /**
     * @protected
     * @type {Array<FilterBase>}
     * @description Contient la liste des filtres qui est possible d'appliquer
     * @frommodule Resources/Filters {@linkto FilterBase}
     */
    this._p_filters = [];
    /**
     * @protected
     * @type {Array<ResourceObject>}
     * @description Ressources à afficher dans le tableau
     * @frommodule Resources {@linkto ResourceObject}
     * */
    this._p_resources = [];

    /**
     * Liste des évènements afficher dans l'agenda
     * @type {ResourceEvent[]}
     * @frommodule Resources/ResourceBaseFunctions/Functions
     * @protected
     */
    this._p_events = [];

    /**
     * @package
     * @type {Array<ResourceObject>}
     * @description Ressources à afficher dans le tableau. Ce sont les ressources de départ.
     * @frommodule Resources {@linkto ResourceObject}
     */
    this._init_resources = [];
    /**
     * Date de départ
     * @protected
     * @type {?string}
     */
    this._p_startDate = null;
    /**
     * Date de fin
     * @protected
     * @type {?string}
     */
    this._p_endDate = null;
    /**
     * Heure de départ
     * @protected
     * @type {?string}
     */
    this._p_startTime = null;
    /**
     * Heure de fin
     * @protected
     * @type {?string}
     */
    this._p_endTime = null;
    /**
     * Données en cache
     * @protected
     * @type {Object<string, *>}
     */
    this._p_internal_data = {};

    /**
     * Calendrier
     * @type {external:jQuery}
     */
    this._$calendar = null;

    /**
     * Données en cache
     * @private
     * @type {Object<string , *>}
     */
    this._cache = {};

    /**
     * @type {ResourceBaseFunctions}
     */
    this._functions = new ResourceBaseFunctions(this);

    /**
     * Date et heure de départ de la location
     * @type {?external:moment}
     */
    this.start = null;
    /**
     * Date et heure de fin de la location
     * @type {?external:moment}
     */
    this.end = null;

    /**
     * Journée entière ou non
     * @type {boolean}
     */
    this.all_day = false;

    /**
     * Ressource sélectionnées
     * @type {ResourceData}
     */
    this.selected_resource = null;

    /**
     * Action à faire lors du clique du bouton "Sauvegarder"
     * @type {BnumEvent<Function>}
     */
    this.event_on_save = new BnumEvent();

    /**
     * Id du mode d'évènement associé
     * @type {number}
     */
    this.location_id = null;
    return this;
  }

  /**
   * Assigne les variables
   * @private
   * @param  {...any} args
   */
  _setup(...args) {
    const [name, filters] = args;

    this._name = name;
    this._p_filters = filters.map((x) =>
      new FilterBase(x.name, x.size, {
        load_data_on_change: x.load_data_on_change,
        load_data_on_start: x.load_data,
        input_type: x.type,
        icon: x.icon,
        number: x.number,
      })
        .push_event(this._on_data_loaded.bind(this))
        .push_event_data_changed(this._on_data_changed.bind(this)),
    );

    let _allday;

    Object.defineProperties(this, {
      start: {
        get: () => {
          if (this.all_day) return moment(this._p_startDate, DATE_FORMAT);
          else
            return this._p_startDate && this._p_startTime
              ? moment(
                  `${this._p_startDate} ${this._p_startTime}`,
                  DATE_TIME_FORMAT,
                )
              : null;
        },
        set: (value) => {
          this._p_startDate = value.format(DATE_FORMAT);
          this._p_startTime = value.format(DATE_HOUR_FORMAT);

          $('.input-date-start').val(this._p_startDate);
          $('.input-time-start').val(this._p_startTime);
        },
      },
      end: {
        get: () => {
          if (this.all_day) return moment(this._p_endDate, DATE_FORMAT);
          else
            return this._p_endDate && this._p_endTime
              ? moment(
                  `${this._p_endDate} ${this._p_endTime}`,
                  DATE_TIME_FORMAT,
                )
              : null;
        },
        set: (value) => {
          this._p_endDate = value.format(DATE_FORMAT);
          this._p_endTime = value.format(DATE_HOUR_FORMAT);

          $('.input-date-end').val(this._p_endDate);
          $('.input-time-end').val(this._p_endTime);
        },
      },
      all_day: {
        get: () => $('#rc-allday')?.prop?.('checked') ?? _allday,
        set: (value) => {
          if ($('#rc-allday').length) $('#rc-allday').prop('checked', value);
          else _allday = value;

          if (this._$calendar) this._$calendar.fullCalendar('refetchEvents');
        },
      },
    });
  }

  /**
   * Génère l'agenda avec fullcalendar
   * @package
   * @param {external:jQuery} $fc Div qui contient le fullcalendar
   * @returns {external:jQuery} Div qui contient le fullcalendar
   */
  _generate_ui($fc) {
    if (this._p_resources.length) {
      this._init_resources = [...this._p_resources];
      this._p_resources.length = 0;
    }

    const settings = window.cal?.settings || top.cal.settings;
    const config = {
      resources: this._fetch_resources.bind(this),
      resourceRender: this._functions.resource_render,
      defaultView: 'timelineDay',
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
      height: 200,
      firstHour: settings.first_hour,
      scrollTime: { hours: settings.first_hour },
      slotDuration: { minutes: 60 / settings.timeslots },
      locale: 'fr',
      axisFormat: DATE_HOUR_FORMAT,
      slotLabelFormat: DATE_HOUR_FORMAT,
      selectable: true,
      selectHelper: true,
      //stickyFooterScrollbar:true,
      slotWidth: 50,
      defaultDate: this.start,
      select: this._functions.on_selected_date,
      eventSources: [
        {
          events: this._functions.event_loader,
          id: 'resources',
        },
      ],
    };
    try {
      $fc.css('width', '100%').fullCalendar(config);
      $fc.fullCalendar('render');
      //$fc.fullCalendar('option', 'height', 200);
      //$fc.fullCalendar('render');
    } catch (error) {
      console.error(error);
    }

    return $fc;
  }

  /**
   * Récupère les données pour le fullcalendar
   * @package
   * @param {function} callback
   */
  _fetch_resources(callback) {
    FavoriteLoader.Load(this._name).then((values) => {
      this.try_add_resources(values);

      if (this._init_resources.length) {
        this.try_add_resources(
          this._init_resources.map((x) => (x.data ? x.data : x)),
        );
        this._init_resources.length = 0;
      }

      const data = this._format_resources(this._p_resources, this._p_filters);

      if (!this._first_loaded) this._first_loaded = true;

      if (data.length) callback(data);
      else
        callback([
          {
            id: 'resources',
            title: this.gettext('no-resources', 'mel_cal_resources'),
          },
        ]);
    });
  }

  /**
   * Formatte les ressources et récupère seulement celles qui sont filtrés ou non
   * @param {ResourceObject[]} resources
   * @param {FilterBase[]} filters
   * @returns {ResourceObject[]}
   * @frommoduleparam Resources/Filters filters {@linkto FilterBase}
   * @frommodulereturn Resources {@linkto ResourceObject}
   */
  _format_resources(resources, filters) {
    return MelEnumerable.from(resources)
      .where((x) => !MelEnumerable.from(filters).any((f) => !f.filter(x)))
      .orderBy((x) => (this.get_env('fav_resources')?.[x.data.email] ? 0 : 1))
      .toArray();
  }

  /**
   * Fonction get pour la page de dialog retournée
   * @package
   * @param {Function} old Ancienne fonction get bind
   * @returns {external:jQuery}
   */
  _get(old) {
    let $rtn = old();

    let $fc = $rtn.find('[fullcalendar="true"]');

    if ($fc.length) this._$calendar = this._generate_ui($fc);

    this.refresh_calendar_date();

    return $rtn;
  }

  /**
   * Action appelé lorsque les données d'un filtre on été chargés
   * @package
   * @param {ResourceData[]} rcs
   * @param {FilterBase} filter
   * @frommoduleparam Resources/Filters filter
   */
  _on_data_loaded(rcs, filter) {
    let values;
    let resources;
    for (let index = 0, len = this._p_filters.length; index < len; ++index) {
      if (this._p_filters[index]._name !== filter._name) {
        //Réinitialise le filtre
        this._p_filters[index]._$filter
          .html(
            $('<option value="/"></option>')
              .text(
                rcmail.gettext(
                  this._p_filters[index]._name,
                  'mel_cal_resources',
                ),
              )
              .css('display', 'none'),
          )
          .append($('<option value=""></option>').text(EMPTY_STRING));

        if (this._p_filters[index]._input_type === eInputType.multi_select)
          this._p_filters[index]._$filter.html(EMPTY_STRING);

        values = {};
        resources = rcs;

        if (this._p_filters[index]._input_type !== eInputType.multi_select) {
          resources = MelEnumerable.from(rcs);
          if (this._p_filters[index].has_only_number_values()) {
            resources = resources.orderBy(
              (x) => +x[this._p_filters[index]._name],
            );
          } else
            resources = resources.orderBy(
              (x) => x[this._p_filters[index]._name],
            );
        }

        for (const iterator of resources) {
          //Si la données éxiste et qu'elle n'a pas déjà été traitée
          if (
            !values[iterator[this._p_filters[index]._name]] &&
            iterator[this._p_filters[index]._name]
          ) {
            //En multiselect, ce sont les clés des valeurs possible qui servent de filtre
            if (
              this._p_filters[index]._input_type === eInputType.multi_select
            ) {
              for (const current_filter of Object.keys(
                JSON.parse(iterator[this._p_filters[index]._name]),
              )) {
                if (!values[current_filter]) {
                  values[current_filter] = true;
                }
              }
            } else {
              values[iterator[this._p_filters[index]._name]] = true;
              this._p_filters[index]._$filter.append(
                $(
                  `<option value="${iterator[this._p_filters[index]._name]}">${iterator[this._p_filters[index]._name]}</option>`,
                ),
              );
            }
          }
        }

        if (this._p_filters[index]._$filter.children().length > 1)
          this._p_filters[index]._$filter
            .removeAttr('disabled')
            .removeClass('disabled');
        else
          this._p_filters[index]._$filter
            .attr('disabled', 'disabled')
            .removeClass('disabled');
      }

      if (this._p_filters[index]._input_type === eInputType.multi_select) {
        if (Object.keys(values).length) {
          for (const current_filter of MelEnumerable.from(
            Object.keys(values),
          ).orderBy((x) => x)) {
            this._p_filters[index]._$filter.append(
              $(`<option value="${current_filter}">${current_filter}</option>`),
            );
          }

          this._p_filters[index]._$filter.multiselect('enable');
        } else this._p_filters[index]._$filter.multiselect('disable');

        this._p_filters[index]._$filter.multiselect('rebuild');
      }
    }

    this._p_resources.length = 0;
    for (const iterator of rcs) {
      this.try_add_resource(iterator, false);
    }

    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Action à faire lorsqe'un filtre à changer de valeur
   * @package
   */
  _on_data_changed() {
    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Créer une page de dialog à partir de cette ressource
   * @returns {Promise<DialogPage>}
   * @frommodulereturn Modal {@linkto DialogPage}
   * @async
   */
  async create_page() {
    const button_save = RcmailDialogButton.ButtonSave({
      click: this.event_on_save,
    });
    const button_cancel = RcmailDialogButton.ButtonCancel({
      click: () => {
        let $parent = this._$calendar;

        while ($parent && !$parent.hasClass('ui-dialog'))
          $parent = $parent.parent();

        if ($parent) {
          $parent.find('.ui-dialog-titlebar-close').click();
        } else $('.ui-dialog-titlebar-close').click();
      },
    });
    let page = new DialogPage(this._name, {
      title: this._name,
      buttons: [button_cancel, button_save],
    });

    page = template_resource.get_page(
      page,
      (await Promise.allSettled(this._p_filters.map((x) => x.generate()))).map(
        (x) => x.value,
      ),
      this,
    );
    this._last_get = page.get.bind(page);
    page.get = this._get.bind(this, this._last_get);

    return page;
  }

  /**
   * Ajoute une ressource à la liste des ressources si elle n'existe pas
   * @param {ResourceData} rc Ressource à ajouter
   * @param {boolean} [refetch=true] Si vrai, récupère les ressources et le évènements
   * @returns {ResourcesBase} Chaînage
   */
  try_add_resource(rc, refetch = true) {
    if (!this._p_resources.filter((x) => x.data.email === rc.email).length) {
      rc.selected = rc.email === this.selected_resource?.email;
      this._p_resources.push({
        id: rc.email,
        title: rc.name,
        parentid: 'resources',
        data: rc,
      });

      if (refetch) {
        this._$calendar.fullCalendar('refetchResources');
        this._$calendar.fullCalendar('refetchEvents');
      }
    }

    return this;
  }

  /**
   * Ajoute plusieurs ressources si elles éxistent
   * @param {ResourceData[]} rcs Liste des ressources à ajouter
   * @returns {ResourcesBase} Chaînage
   */
  try_add_resources(rcs) {
    for (const iterator of rcs) {
      this.try_add_resource(iterator, false);
    }

    return this;
  }

  /**
   * Met à jours le texte de la date du planning
   * @returns {string}
   */
  refresh_calendar_date() {
    let $div = this._$calendar.parent();
    const text = $div.find('.fc-left h2').text();
    $div.find('.fo-date').text(text);
    return text;
  }

  /**
   * Dessine le calendrier
   */
  render() {
    this._$calendar.fullCalendar('rerender');
  }
}

/**
 * @class
 * @classdesc Représentation d'un paramètre de ressource
 */
class ResourceSettings {
  /**
   * Constructeur de la classe
   * @param {string} setting Valeur du filtre
   */
  constructor(setting) {
    /**
     * @private
     * @type {string}
     * @description Valeur du paramètre
     */
    this._setting = typeof setting === 'string' ? JSON.parse(setting) : setting;
  }

  /**
   * Change le paramètre en string
   * @returns {string}
   */
  toString() {
    return ResourceSettings.ToString(this._setting);
  }

  /**
   * Check si la ressource correspond au filtre
   * @param {ResourceObject} ressource Ressource à chacker
   * @returns {boolean}
   */
  is(ressource) {
    if (!this._setting?.length) return true;
    else if (!ressource.data.caracteristiques) return false;
    else {
      return MelEnumerable.from(this._setting)
        .select((x) =>
          // eslint-disable-next-line quotes
          ressource.data.caracteristiques.includes(x.replaceAll("'", '"')),
        )
        .all((x) => x);
    }
  }

  /**
   * Change le paramètre en string
   * @static
   * @param {string} setting
   * @returns {string}
   */
  static ToString(setting) {
    if (typeof setting === 'string') setting = JSON.parse(setting);

    let str = [];
    for (const key in setting) {
      if (Object.hasOwnProperty.call(setting, key)) {
        const element = setting[key];

        str.push(`${key} x${element}`);
      }
    }

    return str.join(' + ');
  }
}
