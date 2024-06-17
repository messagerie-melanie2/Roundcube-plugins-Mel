import { EventView } from '../../mel_metapage/js/lib/calendar/event/event_view.js';
import { GuestsPart } from '../../mel_metapage/js/lib/calendar/event/parts/guestspart.js';
import { TimePartManager } from '../../mel_metapage/js/lib/calendar/event/parts/timepart.js';
import {
  BnumMessage,
  eMessageType,
} from '../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../mel_metapage/js/lib/classes/enum.js';
import { MelDialog } from '../../mel_metapage/js/lib/classes/modal.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
} from '../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { getRelativePos } from '../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../mel_metapage/js/lib/mel_promise.js';
import { FavoriteLoader } from './lib/favorite_loader.js';
import { ResourcesBase } from './lib/resource_base.js';
import { ResourceLocation } from './lib/resource_location.js';

export { ResourceDialog };

/**
 * @typedef ResourceConfig
 * @property {string} name
 * @property  {bool} is_option
 */

/**
 * @typedef FilterConfig
 * @property {string} name
 * @property {?string} load_data
 * @property {?string} load_data_on_change
 * @property {number} size
 * @property {string} input_type
 */

/**
 * @typedef ResourcesConfig
 * @property {Object<string, ResourceConfig>} resources
 * @property {Object<string, FilterConfig[]>} filters
 */

/**
 * @typedef GuestResource
 * @property {string} name
 * @property {string} email
 * @property {GuestsPart.ROLES} role
 * @property {string} resource_type
 * @property {string} resource_id
 */

/**
 * @class
 * @classdesc Représente une dialog pour la gestion des ressources
 * @extends MelObject
 */
class ResourceDialog extends MelObject {
  /**
   *
   * @param {?string} [resource_type=null]
   * @param {TimePartManager} date
   * @param {GuestResource} resource
   */
  constructor(button, date, resource, location, resource_type = null) {
    super(button, resource_type, date, resource, location);
  }

  main(...args) {
    super.main(...args);

    const [button, resource_type, date, resource, location] = args;

    this._caller_button = button;
    this._resource_type = resource_type;
    /**
     * @private
     * @type {TimePartManager}
     */
    this._date = date;
    this._resource = resource;
    this._initialized = false;
    this._event_on_show = new BnumEvent();
    this._selected_resource = null;
    this._location = location;

    this.start = null;
    this.end = null;
    this.all_day = null;
    this.selected_resource = null;
  }

  async _init() {
    let page;
    let resources = [];

    if (this._resource_type) {
      resources.push(
        new ResourcesBase(
          rcmail.gettext(this._resource_type, 'mel_cal_resources'),
          rcmail.env.cal_resources.filters[this._resource_type],
        ),
      );

      resources[resources.length - 1].all_day = this._date.is_all_day;
      resources[resources.length - 1].start = this._date.date_start;
      resources[resources.length - 1].end = this._date.date_end;
      resources[resources.length - 1].event_on_save.push(
        this._on_save.bind(this),
      );

      if (this._resource && window.selected_resources[this._location.id]) {
        resources[resources.length - 1].selected_resource =
          window.selected_resources[this._location.id];
        resources[resources.length - 1].try_add_resource(
          window.selected_resources[this._location.id],
          false,
        );
      }
      page = await resources[resources.length - 1].create_page();
    } else {
      return this.main('flex-office', this._date, this._resource);
    }

    this.dialog = new MelDialog(page, {
      width: 800,
      height: 500,
      close: () => {
        $('#eventedit').css('opacity', EMPTY_STRING);
        if (!EventView.INSTANCE.is_jquery_dialog()) {
          EventView.INSTANCE.get_dialog()
            .modal.css('width', EMPTY_STRING)
            .find('.modal-dialog')
            .css('max-width', EMPTY_STRING);
        }
      },
    });

    this.resources = resources;
  }

  async try_init() {
    if (!this._initialized) {
      $('#eventedit').css('opacity', 0);
      this.get_skin()
        .create_loader('rtc-show-event', true, true)
        .appendTo($('#eventedit').parent());
      await this._init();
      this._initialized = true;
    }

    return this;
  }

  /**
   * Affiche la dialog
   * @returns {Mel_Promise}
   */
  show() {
    if (!EventView.INSTANCE.is_jquery_dialog()) {
      EventView.INSTANCE.get_dialog()
        .modal.css('width', '100%')
        .find('.modal-dialog')
        .css('max-width', 'unset');

      this.dialog.options.width = '100%';
    }

    this._selected_resource = this.get_selected_resource();
    return new Mel_Promise((current_promise) => {
      current_promise.start_resolving();

      this.dialog.show();

      if (!this._selected_resource)
        this._selected_resource = this.get_selected_resource();

      FavoriteLoader.StartLoading(this.get_current_page_resource()._name);

      if (
        window.selected_resources &&
        window.selected_resources[this._location.id] &&
        this._selected_resource !== window.selected_resources[this._location.id]
      ) {
        $(`#radio-${window.selected_resources[this._location.id].uid}`).click();
      }

      setTimeout(() => {
        let resource = MelEnumerable.from(this.resources).first();
        resource.render();
        resource._$calendar.fullCalendar('render');

        this.dialog._$dialog
          .find('[datepicker="true"]')
          .each((i, e) => {
            $(e).datepicker({
              defaultDate: new Date(),
              firstday: 1,
            });
          })
          .attr('datepicker', 'initialized');

        this.dialog._$dialog.find('[multiple="true"]').each((i, e) => {
          $(e).find('option[value="/"]').remove();
          $(e).find('option[value=""]').remove();
          $(e)
            .multiselect({
              nonSelectedText: $(e).attr('data-fname'),
              inheritClass: true,
              buttonWidth: '100%',
            })
            .attr('multiple', 'initialized')
            .multiselect('rebuild');
        });

        this.set_date(
          this._date.date_start,
          this._date.date_end,
          this._date.is_all_day,
        );

        this._event_on_show.call();
        this._event_on_show.clear();

        $('#rtc-show-event').remove();
        if ($('#eventedit').css('opacity') === '0') {
          $('#eventedit').css('opacity', 0.5);
        }
        if (!this._scrolled) {
          const element = resource._$calendar.find(
            `.fc-widget-header[data-date="${this._date.date_start.startOf('day').add(cal.settings.first_hour, 'h').format('YYYY-MM-DD HH:mm').replace(' ', 'T')}:00"]`,
          )[0];
          const element_pos = getRelativePos(element);
          resource._$calendar
            .find('.fc-body .fc-time-area .fc-scroller')
            .first()[0].scrollLeft = element_pos.left;

          this._scrolled = true;
        }

        current_promise.resolve(true);
      }, 100);
    });
  }

  set_date(start, end, all_day) {
    if (this.dialog._$dialog) {
      this._set_date('start', start)._set_date('end', end);
      $('#rc-allday').prop('checked', all_day);
      if (this.get_current_page_resource()._$calendar)
        this.get_current_page_resource()._$calendar.fullCalendar(
          'refetchEvents',
        );

      if (all_day) {
        this.dialog._$dialog.find('.input-time-start').hide();
        this.dialog._$dialog.find('.input-time-end').hide();
      } else {
        this.dialog._$dialog.find('.input-time-start').show();
        this.dialog._$dialog.find('.input-time-end').show();
      }
    } else
      this._event_on_show.push(this.set_date.bind(this), start, end, all_day);

    return this;
  }

  set_selected_resource(rc) {
    this.get_current_page_resource().selected_resource = rc;
    return this;
  }

  add_resource(rc) {
    this.get_current_page_resource().try_add_resource(rc);
    return this;
  }

  add_resources(rcs) {
    for (const rc of rcs) {
      this.get_current_page_resource().try_add_resource(rc);
    }

    return this;
  }

  _set_date(type, moment) {
    this.dialog._$dialog
      .find(`.input-date-${type}`)
      .val(moment.format(DATE_FORMAT));

    this.dialog._$dialog
      .find(`.input-time-${type}`)
      .val(moment.format(DATE_HOUR_FORMAT));

    return this;
  }

  /**
   *
   * @returns {?ResourcesBase}
   */
  get_current_page_resource() {
    return MelEnumerable.from(this.resources)
      .where((x) => x._name === this.dialog.page_manager._current_page)
      .firstOrDefault();
  }

  /**
   *
   * @returns {?import('./lib/resource_base.js').ResourceData}
   */
  get_selected_resource() {
    return MelEnumerable.from(this.resources)
      .where((x) => x._name === this.dialog.page_manager._current_page)
      .firstOrDefault()?.selected_resource;
  }

  _on_save() {
    if (this._selected_resource) {
      $(
        `.mel-attendee[data-email="${this._selected_resource.email}"] .close-button`,
      ).click();
    }

    /**
     * @type {?import('./lib/resource_base.js').ResourceData}
     */
    const current_resource = this.get_selected_resource();
    if (
      current_resource &&
      !$(`.mel-attendee[data-email="${current_resource.email}"]`).length
    ) {
      if (!window.selected_resources) window.selected_resources = {};
      window.selected_resources[this._location.id] = current_resource;
      if (typeof this._caller_button === 'function')
        this._caller_button = this._caller_button();

      this._caller_button.html(
        $('<span>')
          .css('vertical-align', 'super')
          .text(
            `${current_resource.name} - ${current_resource.street} ${current_resource.postalcode} ${current_resource.locality}`,
          ),
      );
      this._caller_button
        .prepend(
          MelHtml.start
            .icon('ads_click')
            .css('color', 'var(--mel-button-text-color)')
            .css('margin-right', '5px')
            .end()
            .generate(),
        )
        .attr('resource', current_resource.email);

      EventView.INSTANCE.parts.guests._$fakeField
        .val(
          `role=${GuestsPart.ROLES.resource}:${current_resource.fullname}<${current_resource.email}>`,
        )
        .change();

      ResourceLocation.SetAttendeeMechanics(current_resource.email);
    } else if (!current_resource) {
      BnumMessage.DisplayMessage(
        'Veuillez séléctionner une ressource !',
        eMessageType.Error,
      );
    }

    GuestsPart.can = false;
    const cr = this.get_current_page_resource();
    this._date._$start_date.val(cr.start.format(DATE_FORMAT)).change();
    TimePartManager.UpdateOption(
      this._date.start._$fakeField.attr('id'),
      cr.start.format(DATE_HOUR_FORMAT),
    );
    this._date.start._$fakeField
      .val(cr.start.format(DATE_HOUR_FORMAT))
      .change();
    this._date._$end_date.val(cr.end.format(DATE_FORMAT)).change();
    TimePartManager.UpdateOption(
      this._date.end._$fakeField.attr('id'),
      cr.end.format(DATE_HOUR_FORMAT),
    );
    GuestsPart.can = true;
    this._date.end._$fakeField.val(cr.end.format(DATE_HOUR_FORMAT)).change();

    // console.log(this._date.is_all_day, $('#rc-allday').prop('checked'));
    if (this._date.is_all_day !== $('#rc-allday').prop('checked')) {
      this._date.$allDay.click();
    }

    this._location.location = `${current_resource.name} - ${current_resource.street} ${current_resource.postalcode} ${current_resource.locality}`;
    this._location.onchange.call();
    if (!EventView.INSTANCE.is_jquery_dialog()) {
      EventView.INSTANCE.get_dialog()
        .modal.css('width', EMPTY_STRING)
        .find('.modal-dialog')
        .css('max-width', EMPTY_STRING);
    }
    this.dialog.hide();
  }

  destroy() {
    this.dialog.destroy();
  }
}
