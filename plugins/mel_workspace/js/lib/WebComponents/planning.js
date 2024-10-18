import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import { DATE_HOUR_FORMAT } from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import {
  CONFIG_FIRST_LETTER,
  ID_RESOURCES_WSP,
} from '../Parts/planning_manager.constants.js';
import { WorkspaceObject } from '../WorkspaceObject.js';
import { FullCalendarElement } from './fullcalendar.js';

export class Planning extends HtmlCustomDataTag {
  #id = null;
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.#id = this.generateId('planning');
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

  _p_main() {
    super._p_main();

    this._generate_calendar();
  }

  _generate_date() {}

  _generate_search() {}

  _generate_navigation() {}

  _generate_calendar() {
    const settings = window.cal?.settings || top.cal.settings;
    const sources = ['resources', 'events'];
    let calendar = FullCalendarElement.CreateNode(sources, {
      defaultView: 'timelineDay',
      height: 400,
      firstHour: settings.firstHour,
      slotDurationType: 'm',
      soltDurationTime: 60 / settings.timeslots,
      axisFormat: DATE_HOUR_FORMAT,
      slotLabelFormat: DATE_HOUR_FORMAT,
      resources: this._generate_resources(),
    });

    calendar.setAttribute('id', `${this.internalId}-calendar`);

    this.appendChild(calendar);
  }

  _generate_resources() {
    return MelEnumerable.from([
      {
        id: ID_RESOURCES_WSP,
        title: this.workspace.title || 'test',
      },
    ])
      .aggregate(
        MelEnumerable.from(rcmail.env.wsp_shares)
          .where(
            (x) =>
              rcmail.env.current_workspace_users?.[x]?.is_external === false,
          )
          .select((x) => {
            return {
              id: x,
              title: rcmail.env.current_workspace_users?.[x]?.name || x,
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
