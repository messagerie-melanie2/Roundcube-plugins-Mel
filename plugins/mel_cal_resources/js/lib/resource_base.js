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
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { template_resource } from '../../skins/mel_elastic/js_template/resource.js';
import { FilterBase } from './filter_base.js';
import { ResourceBaseFunctions } from './resources_functions.js';

export { ResourcesBase };

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
 * @class
 * @classdesc Représente une ressource
 * @extends MelObject
 */
class ResourcesBase extends MelObject {
  constructor(name, filters) {
    super(name, filters);
  }

  main(...args) {
    this._init()._setup(...args);
  }

  _init() {
    /**
     * @protected
     * @type {Array<FilterBase>}
     * @description Contient la liste des filtres qui est possible d'appliquer
     */
    this._p_filters = [];
    /**
     * @protected
     * @type {Array}
     * @description Ressources à afficher dans le tableau
     */
    this._p_resources = [];
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
     * Date et heure de départ de la location
     * @type {?external:moment}
     * @readonly
     */
    this.start = null;
    /**
     * Date et heure de fin de la location
     * @type {?external:moment}
     * @readonly
     */
    this.end = null;

    /**
     * @type {boolean}
     * @readonly
     */
    this.all_day = false;

    /**
     * Calendrier
     * @type {external:jQuery}
     */
    this._$calendar = null;

    /**
     * @type {ResourceBaseFunctions}
     */
    this._functions = new ResourceBaseFunctions(this);

    /**
     * Action à faire lors du clique du bouton "Sauvegarder"
     * @type {BnumEvent<function>}
     */
    this.event_on_save = new BnumEvent();
    return this;
  }

  _setup(...args) {
    const [name, filters] = args;

    this._name = name;
    this._p_filters = filters.map((x) =>
      new FilterBase(x.name, x.size, {
        load_data_on_change: x.load_data_on_change,
        load_data_on_start: x.load_data,
        input_type: x.input_type,
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
        },
      },
    });
  }

  /**
   * Créer une page de dialog à partir de cette ressource
   * @returns {Promise<DialogPage>}
   * @async
   */
  async create_page() {
    const button_save = RcmailDialogButton.ButtonSave({
      click: this.event_on_save,
    });
    const button_cancel = RcmailDialogButton.ButtonCancel({});
    let page = new DialogPage('index', {
      title: this._name,
      buttons: [button_save, button_cancel],
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

  _generate_ui($fc) {
    const settings = window.cal?.settings || top.cal.settings;

    try {
      $fc.fullCalendar({
        resources: this._fetch_resources.bind(this),
        resourceRender: (resourceObj, labelTds, bodyTds) => {
          console.log('rc', resourceObj, labelTds, bodyTds);

          if (resourceObj.id !== 'resources') {
            labelTds
              .css('display', 'flex')
              .prepend(
                $(
                  `<input type="radio" id="radio-${resourceObj.data.uid}" value="${resourceObj.data.email}" name="resa" ${resourceObj.data.selected ? 'checked' : EMPTY_STRING} />`,
                ),
              )
              .append(
                MelHtml.start
                  .div({ class: 'star-button-parent' })
                  .button({
                    class: 'star-button',
                    id: `button-${resourceObj.data.uid}`,
                    onclick: this._functions.on_star_clicked.bind(this),
                    'data-favorite':
                      this.get_env('fav_resources')[resourceObj.data.email] ??
                      false,
                    'data-email': resourceObj.data.email,
                  })
                  .icon('star')
                  .end()
                  .end()
                  .end()
                  .generate(),
              );

            labelTds = labelTds.find('.fc-cell-text');
            let parent = labelTds.parent();
            let text = labelTds.text();
            labelTds.remove();
            parent.html(
              $(`<label for="radio-${resourceObj.data.uid}"></label>`)
                .data('id', resourceObj.data.uid)
                .text(text)
                .css('margin', 0)
                .css('padding', 0)
                .click((e) => {
                  console.log('rcs', this._p_resources, e);
                  for (let i = 0; i < this._p_resources.length; ++i) {
                    this._p_resources[i].data.selected = false;
                  }

                  e = $(e.currentTarget);
                  if (!e.attr('for'))
                    e = $(
                      `label[for="${e.attr('id').replace('radio', EMPTY_STRING)}"`,
                    );

                  const id = e.data('id');
                  const index = MelEnumerable.from(this._p_resources)
                    .select((x, i) => ({ x, i }))
                    .where((x) => x.x.id === id)
                    .first().i;
                  this._p_resources[index].data.selected = true;
                }),
            );
          }
        },
        defaultView: 'timelineDay',
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        height: 210,
        firstHour: settings.first_hour,
        scrollTime: settings.first_hour + ':00',
        slotDuration: { minutes: 60 / settings.timeslots },
        locale: 'fr',
        axisFormat: DATE_HOUR_FORMAT,
        slotLabelFormat: DATE_HOUR_FORMAT,
        selectable: true,
        selectHelper: true,
        select: this._functions.on_selected.bind(this),
        eventSources: [
          // {
          //   events: this._source_freebusy.bind(this),
          //   id: 'resources',
          // },
        ],
      });

      $fc.fullCalendar('option', 'height', 210);
      $fc.fullCalendar('render');
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
    const data = MelEnumerable.from(this._p_resources)
      .where(
        (x) => !MelEnumerable.from(this._p_filters).any((f) => !f.filter(x)),
      )
      .orderBy((x) => (this.get_env('fav_resources')?.[x.data.email] ? 0 : 1))
      .toArray();

    if (data.length) {
      callback(data);
    } else if (
      this._p_filters.filter((x) => x.name === 'locality')?.[0]?.value ===
      EMPTY_STRING
    ) {
      const busy = rcmail.set_busy(true, 'loading');
      this.http_internal_post({
        task: 'mel_cal_resources',
        action: 'load_favorites',
        on_success: (rcs) => {
          if (typeof rcs === 'string') rcs = JSON.parse(rcs);

          rcmail.set_busy(false, 'loading', busy);

          if (rcs && rcs.length) {
            this._p_resources.length = 0;
            for (const iterator of rcs) {
              this._p_resources.push({
                id: iterator.uid,
                title: iterator.name,
                parentid: 'resources',
                data: iterator,
              });
            }
            this._fetch_resources(callback);
          } else callback([{ id: 'resources', title: 'Aucune ressource' }]);
        },
      });
    } else callback([{ id: 'resources', title: 'Aucune ressource' }]);
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

    return $rtn;
  }

  /**
   * Action appelé lorsque les données d'un filtre on été chargés
   * @package
   * @param {ResourceData[]} rcs
   * @param {FilterBase} filter
   */
  _on_data_loaded(rcs, filter) {
    console.log(
      '[_on_data_changed]Génération des filtres',
      this._p_filters,
      filter,
    );

    let values;
    for (let index = 0, len = this._p_filters.length; index < len; ++index) {
      if (this._p_filters[index]._name !== filter._name) {
        this._p_filters[index]._$filter
          .html(
            $('<option value="/"></option>')
              .text(this._p_filters[index]._name)
              .css('display', 'none'),
          )
          .append($('<option value=""></option>').text(EMPTY_STRING));
        values = {};

        for (const iterator of rcs) {
          if (
            !values[iterator[this._p_filters[index]._name]] &&
            iterator[this._p_filters[index]._name]
          ) {
            values[iterator[this._p_filters[index]._name]] = true;
            this._p_filters[index]._$filter.append(
              $(
                `<option value="${iterator[this._p_filters[index]._name]}">${iterator[this._p_filters[index]._name]}</option>`,
              ),
            );
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
    }

    console.log('[_on_data_changed]Génération des resources', rcs);
    this._p_resources.length = 0;
    for (const iterator of rcs) {
      this._p_resources.push({
        id: iterator.uid,
        title: iterator.name,
        parentid: 'resources',
        data: iterator,
      });
    }

    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Action à faire lorsq'un filtre à changer de valeur
   */
  _on_data_changed() {
    console.log('[_on_data_changed]Changement de filtre');
    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Dessine le calendrier
   */
  render() {
    this._$calendar.fullCalendar('rerender');
  }
}
