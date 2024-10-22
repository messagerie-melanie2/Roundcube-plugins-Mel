import { CalendarLoader } from '../../../../mel_metapage/js/lib/calendar/calendar_loader.js';
import { Slot } from '../../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js';
import { FreeBusyLoader } from '../../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
} from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { Mel_Promise } from '../../../../mel_metapage/js/lib/mel_promise.js';
import {
  CONFIG_FIRST_LETTER,
  ID_RESOURCES_WSP,
} from '../Parts/planning_manager.constants.js';
import { WorkspaceObject } from '../WorkspaceObject.js';
import { RenderEvent, ViewRender } from './events.js';
import { FullCalendarElement } from './fullcalendar.js';
import { WorkspaceModuleBlock } from './workspace_module_block.js';

export class Planning extends HtmlCustomDataTag {
  /**
   * @type {string}
   */
  #id = null;
  /**
   * @type {EventSourceLoader}
   */
  #eventsSource = null;
  /**
   * @type {ResourcesSourceLoader}
   */
  #resourceSource = null;
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.#id = this.generateId('planning');
    this.#eventsSource = new EventSourceLoader('planning-events');
    this.#resourceSource = new ResourcesSourceLoader('planning-resources');
  }

  get internalId() {
    return this.#id;
  }

  get workspace() {
    return WorkspaceObject.GetWorkspaceData();
  }

  /**
   * @type {FullCalendarElement}
   */
  get calendarNode() {
    return this.querySelector(`#${this.internalId}-calendar`);
  }

  get fullcalendar() {
    return this.calendarNode.calendar;
  }

  get headerDate() {
    return this.querySelector('#planning-date');
  }

  get calSettings() {
    return window.cal?.settings || top.cal.settings;
  }

  get slotDurationTime() {
    return 60 / this.calSettings.timeslots;
  }

  /**
   * @type {WorkspaceModuleBlock}
   */
  get parentContainer() {
    return document.querySelector('#module-agenda');
  }

  _p_main() {
    super._p_main();

    this._generate_date()._generate_calendar();
  }

  _generate_date() {
    let container = document.createElement('div');
    container.setAttribute('id', 'planning-date-container');

    let icon = BnumHtmlIcon.CalendarMonth;
    icon.style.marginRight = '5px';
    let text = document.createElement('span');
    text.setAttribute('id', 'planning-date');

    container.append(icon, text);
    this.appendChild(container);

    container = null;
    icon = null;
    text = null;

    return this;
  }

  _generate_search() {}

  _generate_navigation() {}

  _generate_calendar() {
    const settings = this.calSettings;
    const sources = ['resources', 'events'];
    let calendar = FullCalendarElement.CreateNode(sources, {
      defaultView: 'timelineDay',
      height: 400,
      firstHour: settings.first_hour,
      slotDurationType: 'm',
      slotDurationTime: 60 / settings.timeslots,
      axisFormat: DATE_HOUR_FORMAT,
      slotLabelFormat: DATE_HOUR_FORMAT,
      resources: this._generate_resources(),
      sourcesCallback: this._resource_loading_callback.bind(this),
    });

    calendar.setAttribute('id', `${this.internalId}-calendar`);

    calendar.onallloaded.push(() => {
      if (!this._generate_calendar.ok) {
        setTimeout(async () => {
          if (!this.#eventsSource.nextGetFinished)
            await Mel_Promise.wait(() => this.#eventsSource.nextGetFinished);
          if (!this.#resourceSource.nextGetFinished)
            await Mel_Promise.wait(() => this.#resourceSource.nextGetFinished);

          this._generate_calendar.ok = true;

          this.refresh();
        }, 1000);
      }
    });

    calendar.addEventListener('api:fc.render.event', (e) => {
      this.#eventsSource.render(e);
    });

    calendar.addEventListener('api:fc.render.resource', (e) => {
      this.#resourceSource.render(e);
    });

    /**
     *
     * @param {ViewRender} e
     */
    const ef = (e) => {
      console.log('¤event', e);
      $('.fc-header-toolbar').css('display', 'none');
      $(this.headerDate).text(e.viewTitle);
      console.log('¤event', $(this.headerDate));
    };

    calendar.addEventListener(ViewRender.EventType, ef.bind(this));

    this.appendChild(calendar);

    return this;
  }

  async _resource_loading_callback(args) {
    const { id, start, end } = args;
    let data = [];

    switch (id) {
      case 'resources':
        data = await this.#resourceSource.get(start, end);
        break;

      case 'events':
        data = await this.#eventsSource.get(start, end);
        break;

      default:
        break;
    }

    return data;
  }

  _generate_resources() {
    // debugger;
    return MelEnumerable.from([
      {
        id: ID_RESOURCES_WSP,
        title: this.workspace.title || 'test',
      },
    ])
      .aggregate(
        MelEnumerable.from(this.workspace.users)
          .where(
            (x) => x?.external === false, //rcmail.env.current_workspace_users?.[x]?.is_external === false,
          )
          .select((x) => {
            return {
              id: x.email,
              title: x?.name || x.email,
            };
          }),
      )
      .orderBy(this._resources_order.bind(this));
  }

  /**
   * Callback qui gère l'ordre des ressources de fullcalendar
   * @param {FullCalendarResource} x Resource en cours
   * @returns {boolean}
   * @package
   */
  _resources_order(x) {
    return x.id === ID_RESOURCES_WSP ? CONFIG_FIRST_LETTER : x.title;
  }

  refresh() {
    this.calendarNode.fetch();
  }

  static CreateNode() {
    return document.createElement('bnum-planning');
  }
}

{
  const TAG = 'bnum-planning';
  if (!customElements.get(TAG)) customElements.define(TAG, Planning);
}

window.addEventListener('load', () => {
  for (const element of document.querySelectorAll('bnum-planning')) {
    element.calendarNode.render();
  }
});

class SourceLoader extends WorkspaceObject {
  #key = null;
  #url = null;
  #type = null;
  #loadCallback = null;
  #firstLoad = true;
  #nextGet = false;

  constructor(key, url, type, loadCallback) {
    super();

    this.#key = key;
    this.#url = url;
    this.#type = type;
    this.#loadCallback = loadCallback;

    this.onfirstdataloaded = new BnumEvent();
    this.ondataloaded = new BnumEvent();
  }

  key(start, end) {
    if (!start.format) start = moment(start);
    if (!end.format) end = moment(end);

    return `${this.#key}-${this.workspace.uid}-${start.format()}-${end.format()}`;
  }

  get nextGetFinished() {
    return this.#nextGet;
  }

  async get(start, end, { force = false } = {}) {
    let data = null;
    this.#nextGet = false;
    try {
      const firstLoad = this.#firstLoad;

      if (this.#firstLoad) this.#firstLoad = false;

      if (!force) {
        data = this.#_try_load(start, end);

        if (data) {
          this.get(start, end, { force: true }).then(() => {
            if (firstLoad) this.onfirstdataloaded.call(start, end, this);
            this.#nextGet = true;
          });
          return MelEnumerable.from(data)
            .select((x) => {
              x.start = moment(x.start);
              x.end = moment(x.end);
              return x;
            })
            .toArray();
        }
      }

      if (this.#loadCallback) {
        data = await this.#loadCallback(start, end, this, force);
      } else {
        await this.http_call({
          url: this.#url,
          on_success: (result) => {
            try {
              result = JSON.parse(result);
            } catch (error) {}

            result = this.ondataloaded.call(result, this) || result;

            data = result;
          },
          params: {
            _start: start,
            _end: end,
          },
          type: this.#type,
        });
      }

      this.save(this.key(start, end), data);

      this.#_loadNextDay(start, end);
    } catch (error) {
      debugger;
    }

    return data;
  }

  /**
   * @protected
   * @param {Function} callback
   * @returns {SourceLoader}
   */
  _p_setLoadCallback(callback) {
    this.#loadCallback = callback;
    return this;
  }

  #_try_load(start, end, { unload = true } = {}) {
    const key = this.key(start, end);
    let data = this.load(key, null);

    if (unload) this.unload(key);

    return data;
  }

  async #_loadNextDay(start, end) {
    start = moment(start).add(1, 'd');

    if (!this.#_try_load(start, end, { unload: false }))
      await this.get(start, end, { force: true });
  }

  /**
   *
   * @param {RenderEvent} e
   */
  render(e) {}
}

class EventSourceLoader extends SourceLoader {
  constructor(key) {
    super(key, null, null, null);
    this._p_setLoadCallback(this._eventLoad.bind(this));
  }

  async _eventLoad(start, end) {
    const DEFAULT_COLOR = '#FF0000';
    rcmail.env.current_settings ??= { color: DEFAULT_COLOR };
    rcmail.env.current_settings.color ??= DEFAULT_COLOR;

    let events;
    if (start.format(DATE_FORMAT) === moment().format(DATE_FORMAT)) {
      events = CalendarLoader.Instance.load_all_events();
    } else {
      events = await mel_metapage.Functions.update_calendar(start, end);

      events = JSON.parse(events);
    }

    events = MelEnumerable.from(events || [])
      .where(
        (x) =>
          !!x.categories &&
          x.categories.length > 0 &&
          x.categories[0] === `${'ws#'}${this.workspace.uid}`,
      )
      .select((x) => {
        return {
          initial_data: x,
          title: x.title,
          start: x.allDay ? moment(x.start).startOf('day') : x.start,
          end: x.end,
          resourceId: ID_RESOURCES_WSP,
          color: rcmail.env.current_settings?.color ?? 'red',
          textColor: mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(
            mel_metapage.Functions.colors.kMel_extractRGB(
              rcmail.env.current_settings.color,
            ),
            mel_metapage.Functions.colors.kMel_extractRGB('#FFFFFF'),
          )
            ? 'white'
            : 'black',
        };
      })
      .toArray();

    return events;
  }

  /**
   *
   * @param {RenderEvent} e
   */
  render(e) {
    let $el = e.itemNode;
    let eventObj = e.itemData;

    if (eventObj.initial_data) {
      $el
        .click(this._event_on_click.bind(this, eventObj))
        .css('cursor', 'pointer')
        .attr('title', eventObj.initial_data.title);
      if (WebconfLink.create(eventObj.initial_data)?.key) {
        $el
          .tooltip()
          .find('.fc-content')
          .prepend(
            MelHtml.start
              .icon('videocam')
              .css({
                display: 'inline-block',
                'vertical-align': 'middle',
                'font-size': '18px',
              })
              .end()
              .generate(),
          );
      }
    } else {
      $el.attr('title', eventObj.title).tooltip();
    }
  }
}

class ResourcesSourceLoader extends SourceLoader {
  #timeslot = null;
  constructor(key, timeslot) {
    super(key, null, null, null);

    this.#timeslot = timeslot;
    this._p_setLoadCallback(this._sourceLoad.bind(this));
  }

  async _sourceLoad(date) {
    let resources = [];

    resources.push({
      id: ID_RESOURCES_WSP,
      title: this.workspace.title,
    });

    for await (const iterator of FreeBusyLoader.Instance.generate_and_save(
      MelEnumerable.from(this.workspace.users)
        .where((x) => !x?.external)
        .select((x) => x.email),
      {
        interval: this.#timeslot,
        start: moment(date).startOf('day'),
        end: moment(date).endOf('day'),
        save: false,
      },
    )) {
      resources.push({
        id: iterator.email,
        title: this.workspace.users.get(iterator.email)?.name || iterator.email,
        slot: iterator,
      });
    }

    try {
      resources = MelEnumerable.from(
        this.#_generate_events.bind(this, resources),
      );
    } catch (error) {
      debugger;
    }
    return resources.toArray();
  }

  *#_generate_events(resources) {
    for (const iterator of resources) {
      if (!iterator.slot) continue;
      for (const slot of iterator.slot) {
        if (![Slot.STATES.free, Slot.STATES.unknown].includes(slot.state)) {
          yield {
            title: Slot.TEXTES[slot.state],
            start: slot.start,
            end: slot.end,
            color: Slot.COLORS[slot.state],
            resourceId: iterator.id,
          };
        }
      }
    }
  }

  /**
   *
   * @param {RenderEvent} e
   */
  render(e) {
    let labelTds = e.itemNode;
    let resourceObj = e.itemData;
    if (resourceObj.id !== ID_RESOURCES_WSP) {
      labelTds
        .attr(
          'title',
          this.workspace.users.get(resourceObj.id)?.fullname ||
            resourceObj.title,
        )
        .tooltip();
    }
  }
}
