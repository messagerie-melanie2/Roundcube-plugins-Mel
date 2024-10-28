import { BaseStorage } from '../classes/base_storage.js';
import { MaterialIcon } from '../icons.js';
import { EventLocation } from '../calendar/event_location.js';
import { MelObject } from '../mel_object.js';
import { CalendarLoader } from '../calendar/calendar_loader.js';
import { DIV, P, BUTTON } from '../constants/constants_html.js';
import { EMPTY_STRING } from '../constants/constants.js';
import { FramesManager } from '../classes/frame_manager.js';

/**
 * Représente un évènement du calendrier.
 *
 * Liste des classes html pré-définie :
 * - melv2-event => Classe de l'élément
 * - melv2-event-date
 * - melv2-event-hour
 *   - melv2-event-hour-top
 *   - melv2-event-hour-bottom
 * - melv2-event-content
 *   - melv2-event-content-top
 *   - melv2-event-content-bottom
 * - melv2-event-separator
 * - melv2-event-side
 * - melv2-event-clickable
 * - melv2-event-button
 */
export class html_events extends mel_html2 {
  /**
   * Constructeur de la classe
   * @param {*} event Evènement qui sera utiliser pour génrer le html
   * @param {*} attribs Attributs de l'élément
   */
  constructor(event, attribs = {}, base_date = moment()) {
    super(CONST_HTML_DIV, { attribs });
    this._cache = new BaseStorage();
    const date =
      STRING === typeof event.start ? moment(event.start) : event.start;
    const end_date =
      STRING === typeof event.end ? moment(event.end) : event.end;
    Object.defineProperties(this, {
      event: {
        get: function () {
          return event;
        },
        configurable: true,
      },
      date: {
        get: function () {
          return moment(date);
        },
        configurable: true,
      },
      end_date: {
        get: function () {
          return end_date;
        },
        configurable: true,
      },
      base_date: {
        get: function () {
          return moment(base_date);
        },
        configurable: true,
      },
    });

    this.onaction = new MelEvent();
  }

  _before_generate() {
    this._create_content();

    if (!this.hasClass('melv2-event')) {
      this.addClass('melv2-event');
      this.onaction.add('events', () => {
        this._on_action_click();
      });
    }

    this.attribs['data-event-uid'] = this.event.uid;
  }

  _create_content() {
    const html_hour = new mel_html2(DIV, {
      attribs: { class: 'melv2-event-hour' },
      contents: this._create_range_hour(),
    });
    const html_infos = new mel_html2(DIV, {
      attribs: { class: 'melv2-event-content' },
      contents: this._create_event(),
    });
    const html_separator = new mel_html(DIV, {
      class: 'melv2-event-separator',
    });
    const html_side = new mel_html2(DIV, {
      attribs: { class: 'melv2-event-side' },
      contents: this._create_side_click(),
    });

    let html_date = new mel_html(
      DIV,
      { class: 'melv2-event-date' },
      this._date_format(),
    );

    if (this.attribs['data-ignore-date']) {
      html_date.css('display', 'none');
    }

    let html_clickable = new mel_html2(DIV, {
      attribs: { class: 'melv2-event-clickable' },
      contents: [html_date, html_hour, html_separator, html_infos],
    });
    html_clickable.onclick.push(() => {
      this.onaction.call();
    });
    html_clickable.onmouseover.push((event) => {
      $(event.currentTarget).parent().addClass('hovered');
    });
    html_clickable.onmouseout.push((event) => {
      $(event.currentTarget).parent().removeClass('hovered');
    });

    this._cache.clear();
    this.jcontents[0] = html_clickable;
    this.jcontents[1] = html_side;
    return this;
  }

  _create_range_hour() {
    const is_all_day = this.event.allDay;
    const top_content = is_all_day ? 'Journée' : this._hour_start();
    const bottom_content = is_all_day ? EMPTY_STRING : this._hour_end();
    const html_top_hour = new mel_html(
      P,
      { class: 'melv2-event-hour-top' },
      top_content,
    );
    const html_bottom_hour = new mel_html(
      P,
      { class: 'melv2-event-hour-bottom' },
      bottom_content,
    );

    return [html_top_hour, html_bottom_hour];
  }

  _create_event() {
    const top_content = this._get_title_formated();
    const bottom_content = this._get_description();
    const html_top = new mel_html(
      P,
      { class: 'melv2-event-content-top' },
      top_content,
    );
    const html_bottom = new mel_html(
      P,
      { class: 'melv2-event-content-bottom' },
      bottom_content,
    );

    return [html_top, html_bottom];
  }

  _create_side_click() {
    let htmls = [];
    const event = this.event;

    if (!this._cache.has('location'))
      this._cache.add('location', new EventLocation(event));

    /**
     * @type {EventLocation}
     */
    const locations = this._cache.get('location');
    if (locations.has()) {
      let html;
      let icon;
      for (const location of locations) {
        if (location.after_html_generation) {
          icon = location.icon;
          html = new mel_html2(BUTTON, {
            attribs: {
              class: `melv2-event-button ${mel_button.html_base_class_full}`,
            },
            contents: [new MaterialIcon(icon, null).get()],
          });
          html.onclick.push(location.side_action.bind(location));
          html = location.after_html_generation(html);
          htmls.push(html);
          html = null;
        }
      }
    }

    return htmls;
  }

  _get_title_formated() {
    const event = this.event;
    let title = mel_metapage.Functions.updateRichText(event.title);

    if (event.free_busy === 'free') title = `(libre)${title}`;
    else if (event.free_busy === 'telework') title = `(télétravail)${title}`;

    if (event.attendees !== undefined && event.attendees.length > 0) {
      const item = Enumerable.from(event.attendees)
        .where((x) => x.email === rcmail.env.mel_metapage_user_emails[0])
        .firstOrDefault(null);
      if (item !== null) {
        try {
          switch (item.status) {
            case 'NEEDS-ACTION':
              title += ' (En attente)';
              break;

            case 'ACCEPTED':
              title += ' (Accepté)';
              break;

            case 'TENTATIVE':
              title += ' (Peut-être)';
              break;

            case 'CANCELLED':
              title += ' (Annulé)';
              break;

            default:
              break;
          }
        } catch (error) {}
      }
    }

    return title;
  }

  _get_description() {
    let desc = EMPTY_STRING;
    const event = this.event;

    if (!this._cache.has('location'))
      this._cache.add('location', new EventLocation(event));

    /**
     * @type {EventLocation}
     */
    const location = this._cache.get('location');

    if (location.has()) {
      if (location.has_locations()) {
        desc = location.locations[0].location;

        if (location.locations.length > 1) desc += '...';
      } else {
        desc = [];
        if (location.has_audio()) desc.push(location.audio.desc);

        if (location.has_visio())
          desc.push(location.visio._get_description(location.locations.length));

        desc = desc.join(' & ');
      }
    }

    return desc;
  }

  _create_visio() {}

  _date_is({ day_to_add = 0 }) {
    return (
      this.date.startOf('day').format() ===
      moment().add(day_to_add, 'd').startOf('day').format()
    );
  }
  _is_today() {
    return CalendarLoader.Instance.is_date_okay(
      this.date,
      this.end_date,
      this.base_date,
    );
  }
  _is_tomorrow() {
    return this._date_is({ day_to_add: 1 });
  }

  _hour_function({ date, add_today = true }) {
    let hour = EMPTY_STRING;

    const now = this.base_date;
    const is_date_not_today =
      moment(date).startOf('day').format() !== now.startOf('day').format();

    const is_today = this._is_today();
    if (is_today && is_date_not_today) hour = date.format('DD/MM');
    else hour = date.format('HH:mm');

    return hour;
  }

  _hour_start() {
    return this._hour_function({
      date: this.date,
    });
  }

  _hour_end() {
    return this._hour_function({
      date: this.end_date,
      add_today: false,
    });
  }

  _date_format() {
    if (this._is_today()) return "Aujourd'hui";
    else if (this._is_tomorrow()) return 'Demain';
    else return this.date.format('DD/MM/YYYY');
  }

  /**
   * Ajoute un élément enfant
   * @param {mel_html} mel_html Elément à ajouter
   * @returns Chaînage
   */
  addContent(mel_html) {
    if (this.count() < 2) {
      this.jcontents[0] = null;
      this.jcontents[1] = null;
    }

    super.addContent(mel_html);
    return this;
  }

  async _on_action_click() {
    const date = this.date.toDate().getTime() / 1000.0;
    await html_events._action_click(this.event.calendar, date, this.event);
  }

  static async _action_click(source, date, event) {
    const FRAME = 'calendar';
    //const page_manager = MelObject.Empty();

    let args = {
      source,
      date,
    };
    // await page_manager.change_frame(FRAME, config);
    await FramesManager.Instance.switch_frame(FRAME, {
      args,
    });

    FramesManager.Instance.get_frame()[0].contentWindow.ui_cal.event_show_dialog(
      event,
    );
  }

  static $_toString($element) {
    return $element[0].outerHTML;
  }
}
