import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { RenderEvent, ViewRender } from './events.js';

/**
 * @typedef ResourceConfigObject
 * @property {string} id
 * @property {string} title
 */

const LICENSE_KEY = 'GPL-My-Project-Is-Open-Source';
export class FullCalendarElement extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.onsourcerequested = new BnumEvent();
    this.oneventrender = new BnumEvent();
    this.onresourcerender = new BnumEvent();
    this.ondatechanged = new BnumEvent();
    this.onallloaded = new BnumEvent();
    this.onviewchanged = new BnumEvent();

    this._loaded = [];
    this._config = {};

    this.oneventrender.push((...args) => {
      const [obj, node] = args;
      this.dispatchEvent(new RenderEvent('event', this, obj, node));
    });

    this.onresourcerender.push((...args) => {
      const [obj, node] = args;
      this.dispatchEvent(new RenderEvent('resource', this, obj, node));
    });

    this.onviewchanged.push((view, node) => {
      this.dispatchEvent(new ViewRender(view, node, this));
    });

    this.licenseKey = LICENSE_KEY;
    this.calendar = null;
  }

  get eventsSource() {
    return this._p_get_data('sources')
      ?.split?.(',')
      ?.map?.((x) => x.trim());
  }

  /**
   * @type {?ResourceConfigObject[]}
   */
  get resourceSources() {
    let data = null;

    //Vérifie que l'on veut des ressources
    if ([true, 'true'].includes(this._p_get_data('have-resources'))) {
      data = this._p_get_data('resources');

      //Si les ressources n'ont pas déjà été mises en mémoires
      if (!data) {
        let srcs = [];
        //On cherche les ressources puis on les récupères
        let querry = this.querySelectorAll('fullcalendar-resource');

        let element;
        for (element of querry) {
          srcs.push({ id: element.srcId, title: element.srcTitle });
          element.remove();
          element = null;
        }

        //On sauvegarde
        this._p_save_into_data('resources', srcs);
        data = srcs;
      }
    }

    return data;
  }

  get defaultView() {
    return this._p_get_data('default-view');
  }

  get size() {
    return new StSize(
      this._p_get_data('size-width'),
      this._p_get_data('size-height'),
    );
  }

  get firstHour() {
    const tmp = +this._p_get_data('first-hour');

    return isNaN(tmp) ? null : tmp;
  }

  get scrollTime() {
    return (
      this._p_get_data('scroll-time') ||
      (!isNullOrUndefined(this.firstHour)
        ? `${this.firstHour < 10 ? `0${this.firstHour}` : this.firstHour}:00`
        : null)
    );
  }

  get slotDuration() {
    let type = null;
    switch (this._p_get_data('duration-type')?.toLocaleLowerCase?.()) {
      case 'minutes':
      case 'minute':
      case 'min':
      case 'm':
        type = SlotDuration.EType.minutes;
        break;

      default:
        break;
    }
    return type
      ? new SlotDuration(type, this._p_get_data('duration-time') || 60)
      : null;
  }

  get locale() {
    return this._p_get_data('locale');
  }

  get axisFormat() {
    return this._p_get_data('axis-format');
  }

  get slotLabelFormat() {
    return this._p_get_data('slot-label-format');
  }

  get startRendering() {
    return ['true', true, '1', 1].includes(this._p_get_data('start'));
  }

  get date() {
    return moment(this.calendar.getDate());
  }

  set date(val) {
    this.calendar.gotoDate(val.toDate ? val.toDate() : val);
    this.ondatechanged.call(moment(val), this);
  }

  _p_main() {
    super._p_main();

    let config = {
      schedulerLicenseKey: this.licenseKey,
      resourceRender: this.onresourcerender.call.bind(this.onresourcerender),
      eventRender: this.oneventrender.call.bind(this.oneventrender),
    };

    if (this.resourceSources) config.resources = this.resourceSources;

    if (this.defaultView) config.defaultView = this.defaultView;

    if (this.size?.heigth) config.height = this.size.heigth;

    if (this.size?.width) config.width = this.size.width;

    if (this.firstHour) config.firstHour = this.firstHour;

    if (this.scrollTime) config.scrollTime = this.scrollTime;

    if (this.slotDuration) config.slotLabelInterval = this.slotDuration.get();

    if (this.locale) config.locale = this.locale;

    if (this.axisFormat) config.axisFormat = this.axisFormat;

    if (this.slotLabelFormat) config.slotLabelFormat = this.slotLabelFormat;

    if (this.eventsSource && this.eventsSource.length > 0) {
      config.eventSources = [];
      for (const source of this.eventsSource) {
        config.eventSources.push({
          events: async function (
            id,
            getCallback,
            start,
            end,
            timezone,
            callback,
          ) {
            try {
              let events = [];

              const array = await getCallback({
                caller: this,
                id,
                start,
                end,
                timezone,
              });

              if (array) {
                let flat = MelEnumerable.from([array]).flat();

                if (flat.any()) events.push(...flat);
              }
              //              console.log(id, events);
              callback(events);

              // this._loaded.push(true);

              // if (this._loaded.length >= this.eventsSource.length) {
              //   this.onallloaded.call({
              //     caller: this,
              //   });

              //   this._loaded.length = 0;
              //}
            } catch (error) {
              debugger;
              console.error(error);
            }
          }.bind(
            this,
            source,
            this.onsourcerequested.call.bind(this.onsourcerequested),
          ),
          id: source,
        });
      }
    }

    if (Object.keys(this._config).length > 0) {
      for (const key of Object.keys(this._config)) {
        config[key] = this._config[key];
      }
    }

    let calendar = new FullCalendar.Calendar($(this), config);

    calendar.on('eventAfterAllRender', (...args) => {
      this.onallloaded.call(this, ...args);
    });

    calendar.on('viewRender', (...args) => {
      this.onviewchanged.call(...args);
    });

    if (this.startRendering) calendar.render();

    this.calendar = calendar;
  }

  addConfig(name, value) {
    this._config[name] = value;
    return this;
  }

  prev() {
    this.calendar.prev();
    this.ondatechanged.call(this.date, this);
  }

  next() {
    this.calendar.next();
    this.ondatechanged.call(this.date, this);
  }

  today() {
    this.calendar.today();
    this.ondatechanged.call(this.date, this);
  }

  render() {
    this.calendar.render();
  }

  fetch() {
    this.calendar.refetchEvents();
  }

  /**
   *
   * @param {string | string[]} sources
   * @param {Object} [param1={}]
   * @returns {FullCalendarElement}
   * @static
   */
  static CreateNode(
    sources,
    {
      resources = null,
      defaultView = null,
      height = null,
      width = null,
      firstHour = null,
      scrollTime = null,
      slotDurationType = null,
      slotDurationTime = null,
      locale = 'fr',
      axisFormat = null,
      slotLabelFormat = null,
      sourcesCallback = null,
      render = false,
    } = {},
  ) {
    /**
     * @type {FullCalendarElement}
     */
    let node = document.createElement('full-calendar');

    if (typeof sources !== 'string' && Array.isArray(sources))
      sources = sources.join(',');

    node.setAttribute('data-sources', sources);

    if (defaultView) node.setAttribute('data-default-view', defaultView);

    if (height) node.setAttribute('data-size-height', height);

    if (width) node.setAttribute('data-size-width', width);

    if (firstHour) node.setAttribute('data-first-hour', firstHour);

    if (scrollTime) node.setAttribute('data-scroll-time', scrollTime);

    if (slotDurationType)
      node.setAttribute('data-duration-type', slotDurationType);

    if (slotDurationTime)
      node.setAttribute('data-duration-time', slotDurationTime);

    if (axisFormat) node.setAttribute('data-axis-format', axisFormat);

    if (slotLabelFormat)
      node.setAttribute('data-slot-label-format', slotLabelFormat);

    if (locale) node.setAttribute('data-locale', locale);

    if (render) node.setAttribute('data-start', true);

    if (sourcesCallback) node.onsourcerequested.push(sourcesCallback);

    if (resources) {
      node.setAttribute('data-have-resources', true);

      let rcs = null;
      for (const element of resources) {
        rcs = FullCalendarResourceElement.CreateNode(element.id, element.title);
        node.appendChild(rcs);
        rcs = null;
      }
    }

    return node;
  }
}

class StSize {
  #width;
  #height;
  constructor(w, h) {
    this.#width = w;
    this.#height = h;
  }

  get width() {
    return +this.#width || null;
  }

  get heigth() {
    return +this.#height || null;
  }
}

class SlotDuration {
  #type;
  #time;
  constructor(type, time) {
    this.#type = type;
    this.#time = time;
  }

  get() {
    let type = null;
    switch (this.#type) {
      case SlotDuration.EType.minutes:
        type = 'minutes';
        break;

      default:
        throw new Error('Type non défini');
    }

    let config = {};
    config[type] = +this.#time;

    return config;
  }
}

SlotDuration.EType = {
  minutes: Symbol(),
};

{
  const TAG = 'full-calendar';
  if (!customElements.get(TAG)) customElements.define(TAG, FullCalendarElement);
}

export class FullCalendarResourceElement extends HtmlCustomDataTag {
  constructor() {
    super();
  }

  get srcId() {
    return this._p_get_data('src-id');
  }

  get srcTitle() {
    return this._p_get_data('src-title');
  }

  /**
   *
   * @param {*} id
   * @param {*} title
   * @returns {FullCalendarResourceElement}
   */
  static CreateNode(id, title) {
    let node = document.createElement('fullcalendar-resource');

    node.setAttribute('data-src-id', id);
    node.setAttribute('data-src-title', title);

    return node;
  }
}

{
  const TAG = 'fullcalendar-resource';
  if (!customElements.get(TAG))
    customElements.define(TAG, FullCalendarResourceElement);
}
