import { MelEnumerable } from '../../mel_metapage/js/lib/classes/enum.js';
import { MelDialog } from '../../mel_metapage/js/lib/classes/modal';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
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

export class test_class extends MelObject {
  constructor() {
    super();
  }

  async main() {
    /**
     * @type {ResourcesConfig}
     */
    this.config = rcmail.env.cal_resources;
    this.ressources = {};
    this.page = null;

    for (const key in this.config.resources) {
      if (Object.hasOwnProperty.call(this.config.resources, key)) {
        const element = this.config.resources[key];

        this.ressources[key] = new ResourcesBase(
          element.name,
          this.config.filters[key],
        );

        this.page = await this.ressources[key].create_page();
      }
    }

    this.dialog = new MelDialog(this.page, {
      width: 800,
      height: 500,
    });
    this.dialog.show();
    setTimeout(() => {
      MelEnumerable.from(this.ressources).first().value.render();
      MelEnumerable.from(this.ressources)
        .first()
        .value._$calendar.fullCalendar('render');

      this.dialog._$dialog.find('[datepicker="true"]').each((i, e) => {
        $(e).datepicker({
          defaultDate: new Date(),
          firstday: 1,
        });
      });
    }, 100);
  }
}
