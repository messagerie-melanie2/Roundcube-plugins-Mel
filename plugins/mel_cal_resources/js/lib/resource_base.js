import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import {
  DialogPage,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import { DATE_HOUR_FORMAT } from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { template_resource } from '../../skins/mel_elastic/js_template/resource.js';
import { FilterBase } from './filter_base.js';

export { ResourcesBase };

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
     * @type {Array}
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

    this._$calendar = null;

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
  }

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

  /**
   * @private
   * @param {____JsHtml} jshtml
   * @param {FilterBase} filter
   */
  async _generate_filters(jshtml, filter) {
    return jshtml.add_child(await filter.generate());
  }

  _generate_ui($fc) {
    const settings = window.cal?.settings || top.cal.settings;

    try {
      $fc.fullCalendar({
        resources: this._fetch_resources.bind(this),
        defaultView: 'timelineDay',
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        height: 210,
        firstHour: settings.first_hour,
        scrollTime: settings.first_hour + ':00',
        slotDuration: { minutes: 60 / settings.timeslots },
        locale: 'fr',
        axisFormat: DATE_HOUR_FORMAT,
        slotLabelFormat: DATE_HOUR_FORMAT,
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

  // eslint-disable-next-line no-unused-vars
  _fetch_resources(callback) {
    const data = this._p_resources.filter(
      (x) => !MelEnumerable.from(this._p_filters).any((f) => !f.filter(x)),
    );
    callback(
      data.length ? data : [{ id: 'resources', title: 'Aucune ressource' }],
    );
  }

  _get(old) {
    let $rtn = old();

    let $fc = $rtn.find('[fullcalendar="true"]');

    if ($fc.length) this._$calendar = this._generate_ui($fc);

    return $rtn;
  }

  _on_data_loaded(rcs, filter) {
    console.log(
      '[_on_data_changed]Génération des filtres',
      this._p_filters,
      filter,
    );

    let values;
    for (let index = 0, len = this._p_filters.length; index < len; ++index) {
      if (this._p_filters[index]._name !== filter._name) {
        this._p_filters[index]._$filter.html(
          $('<option value=""></option>')
            .text(this._p_filters[index]._name)
            .css('display', 'none'),
        );
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
  _on_data_changed(value, filter) {}

  render() {
    this._$calendar.fullCalendar('rerender');
  }
}
