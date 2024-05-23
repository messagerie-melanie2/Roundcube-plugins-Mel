import { MelEnumerable } from '../../mel_metapage/js/lib/classes/enum.js';
import { MelDialog } from '../../mel_metapage/js/lib/classes/modal';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../mel_metapage/js/lib/mel_promise.js';
import { ResourcesBase } from './lib/resource_base.js';

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
export class ResourceDialog extends MelObject {
  /**
   *
   * @param {?string} [resource_type=null]
   * @param {TimePartManager} date
   * @param {GuestResource} resource
   */
  constructor(date, resource, resource_type = null) {
    super(resource_type, date, resource);
  }

  main(...args) {
    super.main(...args);

    const [resource_type, date, resource] = args;

    this._resource_type = resource_type;
    this._date = date;
    this._resource = resource;
    this._initialized = false;
  }

  async _init() {
    let page;
    let resources = [];

    if (this._resource_type) {
      resources.push(
        new ResourcesBase(
          'index',
          rcmail.env.cal_resources.filters[this._resource_type],
        ),
      );
      page = await resources[resources.length - 1].create_page();
    } else {
      return this.main('flex-office', this._date, this._resource);
    }

    this.dialog = new MelDialog(page, {
      width: 800,
      height: 500,
    });

    this.resources = resources;
  }

  async try_init() {
    if (!this._initialized) {
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
    return new Mel_Promise((current_promise) => {
      current_promise.start_resolving();

      this.dialog.show();
      setTimeout(() => {
        MelEnumerable.from(this.resources).first().render();
        MelEnumerable.from(this.resources)
          .first()
          ._$calendar.fullCalendar('render');

        this.dialog._$dialog
          .find('[datepicker="true"]')
          .each((i, e) => {
            $(e).datepicker({
              defaultDate: new Date(),
              firstday: 1,
            });
          })
          .attr('datepicker', 'initialized');

        current_promise.resolve(true);
      }, 100);
    });
  }

  destroy() {
    this.dialog.destroy();
  }
}
