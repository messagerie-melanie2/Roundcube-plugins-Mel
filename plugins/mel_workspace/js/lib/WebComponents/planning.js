// import { publish } from 'tui-jsdoc-template';
import { CalendarLoader } from '../../../../mel_metapage/js/lib/calendar/calendar_loader.js';
import { Slot } from '../../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js';
import { FreeBusyLoader } from '../../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import { MelCurrentUser } from '../../../../mel_metapage/js/lib/classes/user.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
  DATE_SERVER_FORMAT,
} from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BootstrapLoader } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/bootstrap-loader.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { SearchBar } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/searchbar.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
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
    this.#resourceSource = new (
      this.workspace.isPublic ? PublicResourceLoader : ResourcesSourceLoader
    )('planning-resources', this.slotDurationTime, this);

    this._nextLoad = false;
  }

  get loaders() {
    return {
      e: this.#eventsSource,
      r: this.#resourceSource,
    };
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

  get header() {
    return document.querySelector(`#header-planning-${this.internalId}`);
  }

  _p_main() {
    super._p_main();

    let header = document.createElement('div');
    header.classList.add('planning-element', 'planning-header');
    header.setAttribute('id', `header-planning-${this.internalId}`);
    header.style.display = 'flex';

    this.appendChild(header);
    header = null;

    this._generate_date()._generate_search()._generate_calendar();
  }

  _generate_date() {
    let container = document.createElement('div');
    container.setAttribute('id', 'planning-date-container');

    let icon = BnumHtmlIcon.CalendarMonth;
    icon.style.marginRight = '5px';
    let text = document.createElement('span');
    text.setAttribute('id', 'planning-date');

    container.append(icon, text);
    this.header.appendChild(container);

    container = null;
    icon = null;
    text = null;

    return this;
  }

  _generate_search() {
    let src = SearchBar.CreateNode({
      iconPos: 'left',
      label: 'Recherche du planning',
    });

    if (!this.workspace.isPublic)
      src.addEventListener(
        'api:search.input.input',
        this._on_search.bind(this),
      );

    src.addEventListener('api:search.input.change', this._on_search.bind(this));

    this.header.appendChild(src);

    return this;
  }

  _on_search(e) {
    const value = e.detail.caller.value;

    if (!this.workspace.isPublic) {
      if (value) {
        this.fullcalendar.option('filterResourcesWithEvents', true);
      } else {
        this.fullcalendar.option('filterResourcesWithEvents', false);
      }
    }

    this.refresh({ background: !this.workspace.isPublic });
  }

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

    if (this.workspace.isPublic)
      calendar.addConfig('filterResourcesWithEvents', true);

    calendar.setAttribute('id', `${this.internalId}-calendar`);

    calendar.onallloaded.push(() => {
      this._unload();

      if (!this._nextLoad) {
        this._nextLoad = true;
        setTimeout(() => {
          this.refresh({ background: true });
        }, 100);
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

  _load() {
    this.appendChild(
      MelObject.Empty()
        .generate_loader(`loader-${this.internalId}`, true)
        .generate()[0],
    );
    this.style.backgroundColor = 'black';
    this.style.opacity = '0.6';
  }

  _unload() {
    $(`#loader-${this.internalId}`).remove();
    this.style.backgroundColor = null;
    this.style.opacity = null;
  }

  render() {
    this._load();
    this.fullcalendar.render();
  }

  refresh({ background = false } = {}) {
    if (!background) this._load();

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
    element.render();
  }
});

class IDataSource {
  constructor() {}

  add(date, data) {
    return this;
  }

  has({ date = null } = {}) {}

  *get(date) {}

  toArray(date) {
    return [...this.get(date)];
  }

  serialize() {
    return EMPTY_STRING;
  }

  unserialize(data) {
    return this;
  }
}

class DataSource extends IDataSource {
  #data = {};
  constructor() {
    super();
  }

  add(date, data) {
    super.add(date, data);
    date = moment(date).format('DD/MM/YYYY');
    this.#data[date] = data;

    return this;
  }

  *get(date) {
    super.get(date);
    if (this.has({ date }) && this.#data[date].length > 0) {
      yield* this.#data[date];
    }
  }

  // toArray(date) {
  //   return [...this.get(date)];
  // }

  has({ date = null } = {}) {
    super.has({ date });
    if (date) {
      if (typeof date !== 'string') date = date.format('DD/MM/YYYY');

      return this.has() && this.#data[date];
    }
    return Object.keys(this.#data).length > 0;
  }

  serialize() {
    super.serialize();
    return JSON.stringify(this.#data);
  }

  unserialize(data) {
    super.unserialize(data);
    data = JSON.parse(data);

    this.#data = data;

    return this;
  }

  get obj() {
    return this.#data;
  }
}

class PublicDataSource extends IDataSource {
  #data = {};
  constructor() {
    super();
  }

  add(date, data) {
    super.add(date, data);
    date = moment(date).format('DD/MM/YYYY');
    if (!this.#data[date]) this.#data[date] = {};

    for (const rcs of MelEnumerable.from(data).groupBy(
      (x) => x.resourceId,
      (x) => x,
    )) {
      console.log('public', rcs);
      if (!this.#data[date][rcs.key])
        this.#data[date][rcs.key] = rcs.iterable.toArray();
    }

    return this;
  }

  *get(date) {
    super.get(date);
    if (this.has({ date })) {
      for (const user of Object.keys(this.#data[date])) {
        if (this.has({ date, user })) {
          yield* this.#data[date][user];
        }
      }
    }
  }

  has({ date = null, user = null } = {}) {
    super.has({ date });
    if (user) {
      return this.has({ date }) && this.#data[date]?.[user];
    } else if (date) {
      if (typeof date !== 'string') date = date.format('DD/MM/YYYY');

      return this.has() && this.#data[date];
    } else return Object.keys(this.#data).length > 0;
  }

  serialize() {
    super.serialize();
    return JSON.stringify(this.#data);
  }

  unserialize(data) {
    super.unserialize(data);
    data = JSON.parse(data);

    this.#data = data;

    return this;
  }
}

class SourceLoader extends WorkspaceObject {
  #key = null;
  #url = null;
  #type = null;
  #loadCallback = null;
  #nextGet = false;
  #data = null;

  get data() {
    return this.#data.obj;
  }

  get dataSource() {
    return this.#data;
  }

  constructor(
    key,
    url,
    type,
    loadCallback,
    { dataSourceType = DataSource } = {},
  ) {
    super();

    this.#data = new dataSourceType();

    this.#key = key;
    this.#url = url;
    this.#type = type;
    this.#loadCallback = loadCallback;

    this.onfirstdataloaded = new BnumEvent();
    this.ondataloaded = new BnumEvent();

    //const start = moment().startOf('day');
    // this.#data.add(
    //   moment(),
    //   this._p_try_load(start, moment(start).add(1, 'd')),
    //   { unload: false },
    // );
  }

  key(start, end) {
    if (!start.format) start = moment(start);
    if (!end.format) end = moment(end);

    return `${this.#key}-${start.format()}-${end.format()}`;
  }

  get nextGetFinished() {
    return this.#nextGet;
  }

  async get(start, end, { force = false, ignore = false } = {}) {
    if (ignore) return;
    // debugger;

    const key = start.format('DD/MM/YYYY');
    /**
     * @type {?DataSource}
     */
    let data = force ? null : this.#data;
    console.log('src', data, data?.has?.());

    if (!data || !data?.has?.(key)) {
      data = force ? null : this._load(); //this._p_try_load(start, end);

      if (!data || !data?.has?.(key)) {
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

        this.#data.add(start, data);
        this._save(data);
        // if (this.#data[key]) this.#data[key] = {};
        // this.#data[key] = data;
      } else data = data.toArray(key);
    } else data = data.toArray(key); //.toArray(key); //MelEnumerable.from(data.get.bind(data, key));

    return data;
  }

  _save() {
    //this.save('planning-' + this.#key, this.#data.serialize());
    let saved = this.load(this.#key, {});
    saved[this.workspace.uid] = this.#data.serialize();
    this.save(this.#key, saved);
    return this;
  }

  _load() {
    let data = this.load(this.#key, {});

    if (data[this.workspace.uid]) {
      this.#data.unserialize(data[this.workspace.uid]);

      delete data[this.workspace.uid];

      this.save(this.#key, data);
    }

    return this.#data;
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

  _p_try_load(start, end, { unload = true } = {}) {
    const key = this.key(start, end);
    let data = this.load(key, null);

    if (unload) this.unload(key);

    return data;
  }

  async #_loadNextDay(start, end) {
    start = moment(start).add(1, 'd');

    if (!this._p_try_load(start, end, { unload: false }))
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
          internalId: x.id,
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
      });
    //.toArray();

    if (this.workspace.isPublic) {
      events = events.aggregate([
        {
          title: 'tmp',
          start: moment(start).startOf('day'),
          end,
          resourceId: ID_RESOURCES_WSP,
          color: 'transparent',
          textColor: 'transparent',
          hide: true,
        },
      ]);
    }

    console.log('event', events);
    return events.toArray();
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

    if (eventObj.hide === true) {
      $el.css('display', 'none');
    }
  }
}

class ResourcesSourceLoader extends SourceLoader {
  #timeslot = null;
  /**
   * @type {Planning}
   */
  #planning = null;
  constructor(key, timeslot, planning, { dataSourceType = DataSource } = {}) {
    super(key, null, null, null, { dataSourceType });

    this.#timeslot = timeslot;
    this.#planning = planning;
    this._p_setLoadCallback(this._sourceLoad.bind(this));
  }

  get searchValue() {
    return this.#planning.querySelector(SearchBar.TAG)?.value || false;
  }

  async get(start, end, { force = false } = {}) {
    await super.get(null, null, { ignore: true });
    const search = this.searchValue?.toUpperCase?.();
    let result = null;

    if (search && !force) {
      result = await super.get(start, end, {
        force: this.workspace.isPublic,
      });

      result = MelEnumerable.from(result)
        .where((x) =>
          this.workspace.users
            .get(x.resourceId)
            .name.toUpperCase()
            .includes(search),
        )
        .aggregate(
          MelEnumerable.from(this.workspace.users)
            .where((x) => x.name.toUpperCase().includes(search))
            .select((x) => {
              return {
                title: 'tmp',
                start: moment(start).startOf('day'),
                end: moment(start).startOf('day').add('1', 'm'),
                resourceId: x.email,
                color: 'transparent',
              };
            }),
        );
    } else result = (await super.get(start, end, { force })) || [];

    return result.toArray ? result.toArray() : result;
  }

  async _sourceLoad(date) {
    console.log('loading....', date);
    let resources = [];

    resources.push({
      id: ID_RESOURCES_WSP,
      title: this.workspace.title,
    });

    for await (const iterator of FreeBusyLoader.Instance.generate_and_save(
      MelEnumerable.from(
        this.workspace.isPublic
          ? this.searchValue
            ? MelEnumerable.from(this.workspace.users).where((x) =>
                x.name.toUpperCase().includes(this.searchValue.toUpperCase()),
              )
            : [this.workspace.users.get(MelCurrentUser.main_email)]
          : this.workspace.users,
      )
        .where((x) => !x?.external)
        .where((x) =>
          this.workspace.isPublic ? !this._p_has(date, x.email) : true,
        )
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

  _p_has(date, user) {
    return true;
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
            dates: {
              start: slot.start.format(DATE_SERVER_FORMAT),
              end: slot.end.format(DATE_SERVER_FORMAT),
            },
            color: Slot.COLORS[slot.state],
            resourceId: iterator.id,
            internalId:
              slot.start.format('YYYY-MM-DDTHH:mm:ss') +
              slot.end.format('YYYY-MM-DDTHH:mm:ss') +
              iterator.id,
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
      console.log('label', labelTds);
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

class PublicResourceLoader extends ResourcesSourceLoader {
  constructor(key, timeslot, planning) {
    super(key, timeslot, planning, { dataSourceType: PublicDataSource });
  }

  async get(...args) {
    let results = await super.get(...args);

    if (this.searchValue) {
      results = MelEnumerable.from(
        this.dataSource.get(args[0].format('DD/MM/YYYY')),
      )
        .where((x) =>
          this.workspace.users
            .get(x.resourceId)
            .name.toUpperCase()
            .includes(this.searchValue.toUpperCase()),
        )
        .toArray();
    }

    return results;
  }

  _p_has(date, user) {
    if (typeof date !== 'string') date = date.format('DD/MM/YYYY');

    return super._p_has(date, user) && this.dataSource.has({ date, user });
  }
}
