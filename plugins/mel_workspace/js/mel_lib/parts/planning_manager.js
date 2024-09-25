import { CalendarLoader } from '../../../../mel_metapage/js/lib/calendar/calendar_loader.js';
import { Slot } from '../../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js';
import { FreeBusyLoader } from '../../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
} from '../../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { html_events } from '../../../../mel_metapage/js/lib/html/html_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import {
  CONFIG_FIRST_LETTER,
  ID_BACKGROUND_LOADER,
  ID_LOADER,
  ID_RESOURCES_WSP,
  SELECTOR_BLOCK,
  SELECTOR_BLOCK_BODY,
  SELECTOR_BTN_NAVIGATORS,
  SELECTOR_CHOOSE_DATE_BUTTON,
  SELECTOR_FULLCALENDAR_DATE,
  SELECTOR_HEADER_BTNS,
  SELECTOR_PLANNING_CURRENT_DATE,
  SELECTOR_PLANNING_ICON,
  SELECTOR_SEARCH_ICON,
  SELECTOR_SEARCH_INPUT,
  SELECTOR_SEARCH_RESET_BUTTON,
  SELECTOR_TODAY_BUTTON,
} from './planning_manager.constants.js';
import { Workspace } from '../workspace.js';
import { WspHelper } from '../helpers.js';
export { PlanningManager };

/**
 * @typedef FullCalendarEvent
 * @property {string} title
 * @property {moment} start
 * @property {moment} end
 * @property {string} color
 * @property {string} resourceId
 */

/**
 * @typedef FullCalendarResource
 * @property {string} id
 * @property {string} title
 * @property {Slot} slot
 */

/**
 * @class
 * @classdesc Gestionnaire de planning des espaces de travail
 * @extends MelObject
 */
class PlanningManager extends MelObject {
  constructor() {
    super();
  }

  /**
   * Méthode principale
   */
  main() {
    super.main();

    if (!Workspace.IsPublic()) {
      this._startup();
      this._init();

      setTimeout(this._start.bind(this), 1);
      this.addListeners();
    }
  }

  /**
   * Actions qui seront éxécuter avant l'initialisation
   * @package
   */
  _startup() {
    this._set_busy();
  }

  /**
   * Initialise les variables membres
   * @package
   */
  _init() {
    /**
     * Cache des données libre par dates
     * @type {Object<string, boolean>}
     * @member
     */
    this.freebusy = {};
    /**
     * Cache des données d'évènements par dates
     * @type {Object<string, boolean>}
     * @member
     */
    this.events = {};
    /**
     * Contient le nombre de données en cours de chargement
     *
     * Lorsque une donnée a fini de chargé, une valeur est supprimé de ce tableau
     * @type {string[]}
     * @member
     */
    this.loading = [];
    /**
     * Calendrier "Fullcalendar"
     * @type {FullCalendar.Calendar}
     * @member
     */
    this.calendar = null;
  }

  /**
   * Démarre le gestionnaire de planning
   * @package
   */
  _start() {
    this._generate_visuals();
    //Gagner de la place
    let $body = $(SELECTOR_BLOCK_BODY).html(EMPTY_STRING);
    //Calendrier
    const settings = window.cal?.settings || top.cal.settings;
    const resources = this.calendar_resources();
    this.calendar = this._generate_calendar($body, settings, resources);
    //MAJ du texte
    this.refresh_planning_date();

    //N'est plus utilisé
    change_date = () => {};
  }

  /**
   * Génère le calendrier fullcalendart
   * @property {external:jQuery} $body
   * @property {*} settings
   * @property {FullCalendarResource[]} resources
   * @package
   * @returns {FullCalendar.Calendar}
   */
  _generate_calendar($body, settings, resources) {
    let calendar = new FullCalendar.Calendar($body, {
      resources,
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
        {
          events: this._source_freebusy.bind(this),
          id: 'resources',
        },
        {
          events: this._source_events.bind(this),
          id: 'events',
        },
      ],
      eventRender: this._event_render.bind(this),
      resourceRender: this._resources_render.bind(this),
    });
    calendar.render();

    return calendar;
  }

  /**
   * Génère le visuel du block qui contient le planning.
   *
   * Ajoute des fonctionnalités aux boutons, ajoute un bouton "aujourd'hui" et de selection de date.
   *
   * Met en place le css.
   * @package
   */
  _generate_visuals() {
    //Changement de fonctionnalités des boutons
    $(SELECTOR_BTN_NAVIGATORS).each((i, e) => {
      e = $(e);
      e.css('float', EMPTY_STRING).parent().css('justify-content', 'center');
      switch (i) {
        case 0:
          e.off('click').on('click', this._prev.bind(this));
          break;

        case 1:
          e.off('click').on('click', this._next.bind(this));
          break;

        default:
          break;
      }
    });

    //Changement de textes + passages
    $(SELECTOR_PLANNING_CURRENT_DATE).parent().css('display', 'flex');
    $(SELECTOR_PLANNING_ICON).parent().css('display', 'flex');
    $(SELECTOR_SEARCH_RESET_BUTTON).click(
      this._event_on_remove_search_click.bind(this),
    );
    $(SELECTOR_SEARCH_INPUT)
      .on('input', this._on_search.bind(this))
      .on('change', this._on_search.bind(this));

    this._set_today_button();
  }

  /**
   * Génère les actions du bouton bouton de date "aujourd'hui" et de selection de date
   * @package
   */
  _set_today_button() {
    $(SELECTOR_CHOOSE_DATE_BUTTON).click(this._show_calendar.bind(this));
    $(SELECTOR_TODAY_BUTTON).click(this._today.bind(this));
  }

  /**
   * Désactive les boutons et affiche une icône de chargement
   * @returns {boolean}
   * @package
   */
  _set_busy() {
    if (this.loading) this.loading.push(true);

    //Désactive les boutons
    $(SELECTOR_HEADER_BTNS).addClass('disabled').attr('disabled');

    //Génère un loader
    if ($(`#${ID_LOADER}`).length === 0)
      this.get_skin()
        .create_loader(ID_LOADER, true, true)
        .appendTo($(SELECTOR_BLOCK));

    //Génère un fond noir
    if (!$(`#${ID_BACKGROUND_LOADER}`).length) {
      MelHtml.start
        .div({ id: ID_BACKGROUND_LOADER })
        .css({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          'background-color': '#00000082',
          'z-index': 1,
        })
        .end()
        .generate()
        .appendTo($(SELECTOR_BLOCK));
    }

    return false;
  }

  /**
   * Active les boutons et supprime une icône de chargement
   * @param {boolean} go Si on avait chargée des données ou non
   * @package
   */
  _unset_busy(go) {
    if (!go) this.loading.pop();

    //Si tous les appels ont été terminés
    if (this.loading.length === 0) {
      //On active les boutons
      $(SELECTOR_HEADER_BTNS).removeClass('disabled').removeAttr('disabled');

      //On supprime les loaders
      $(`#${ID_LOADER}`).remove();
      $(`#${ID_BACKGROUND_LOADER}`).remove();
    }
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

  //                  PUBLICS              //

  /**
   * Met à jours le texte de la date du planning
   * @returns {string}
   */
  refresh_planning_date() {
    const text = $(SELECTOR_FULLCALENDAR_DATE).text();
    $(SELECTOR_PLANNING_CURRENT_DATE).text(text);
    return text;
  }

  /**
   * Retourne les resources de l'agenda
   * @returns {FullCalendarResource[]}
   */
  calendar_resources() {
    return MelEnumerable.from([
      {
        id: ID_RESOURCES_WSP,
        title: WspHelper.GetWorkspaceTitle(),
      },
    ])
      .aggregate(
        MelEnumerable.from(rcmail.env.wsp_shares).select((x) => {
          return {
            id: x,
            title: rcmail.env.current_workspace_users?.[x]?.name || x,
          };
        }),
      )
      .orderBy(this._resources_order.bind(this))
      .toArray();
  }

  /**
   * Récupère les status des membres de l'espace pour une date donnée. Si la date correspond à la date du jours, les données seront dans un premier temp, charger depuis le stockage local.
   *
   * Sauvegarde les ressources pour fullcalendar dans la propriété `last_resources`
   * @param {external:moment} date
   * @returns {Promise<FullCalendarEvent[]>}
   * @async
   */
  async generateEvents(date = moment()) {
    let resources;

    if (date.format(DATE_FORMAT) === moment().format(DATE_FORMAT))
      resources = await this.loadResources();
    else resources = await this.generateResources(date);

    let events = [];
    for (const iterator of resources) {
      if (!iterator.slot) continue;
      for (const slot of iterator.slot) {
        if (![Slot.STATES.free, Slot.STATES.unknown].includes(slot.state)) {
          events.push({
            title: Slot.TEXTES[slot.state],
            start: slot.start,
            end: slot.end,
            color: Slot.COLORS[slot.state],
            resourceId: iterator.id,
          });
        }
      }
    }

    return events;
  }

  /**
   * Récupère les données de disponibilités.
   *
   * Si la date correspond à la date du jours, les données seront dans un premier temp, charger depuis le stockage local, si ils existent.
   * @returns {Promise<FullCalendarResource[]>}
   * @async
   */
  async loadResources() {
    let resources = FreeBusyLoader.Instance.load_from_memory(
      rcmail.env.wsp_shares,
      FreeBusyLoader.Instance.interval,
      moment(),
    );

    if (!resources || Object.keys(resources).length === 0) {
      resources = await this.generateResources();
    } else {
      //Mise en forme des ressources
      resources = MelEnumerable.from(resources)
        .select((x) => x.value)
        .select((x) => {
          return {
            id: x.email,
            title:
              rcmail.env.current_workspace_users?.[x.email]?.name || x.email,
            slot: x,
          };
        });

      resources = MelEnumerable.from([
        {
          id: ID_RESOURCES_WSP,
          title: WspHelper.GetWorkspaceTitle(),
        },
      ])
        .aggregate(resources)
        .toArray();

      FreeBusyLoader.Instance.clear_in_memory();
    }

    return MelEnumerable.from(resources)
      .orderBy(this._resources_order.bind(this))
      .toArray();
  }

  /**
   * Récupère les données de disponibilités pour une date donnée
   * @param {external:moment} date
   * @returns {Promise<FullCalendarResource[]>}
   * @async
   */
  async generateResources(date = moment()) {
    let resources = [];

    resources.push({
      id: ID_RESOURCES_WSP,
      title: WspHelper.GetWorkspaceTitle(),
    });

    for await (const iterator of FreeBusyLoader.Instance.generate_and_save(
      MelEnumerable.from(rcmail.env.wsp_shares).where(
        (x) => !this.get_env('current_workspace_users')?.[x]?.is_external,
      ),
      {
        interval: FreeBusyLoader.Instance.interval,
        start: moment(date).startOf('day'),
        end: moment(date).endOf('day'),
        save: moment().format(DATE_FORMAT) === date.format(DATE_FORMAT),
      },
    )) {
      resources.push({
        id: iterator.email,
        title:
          this.get_env('current_workspace_users')?.[iterator.email]?.name ||
          iterator.email,
        slot: iterator,
      });
    }

    return resources;
  }

  /**
   * Récupère une clé unique. Elle permettra de retrouver/supprimer la listener qui y est lié.
   * @returns {!string}
   */
  get_callback_key() {
    return `planning-${parent.workspace_frame_manager?.getActiveFrame?.()?.get?.()?.attr?.('id') || 0}`;
  }

  /**
   * Récupère la valeur de la recherche
   * @returns {?string}
   */
  get_search_value() {
    return $(SELECTOR_SEARCH_INPUT).val() || null;
  }

  /**
   * Ajoute les écouteurs d'événements
   */
  addListeners() {
    MelObject.Empty().add_event_listener(
      mel_metapage.EventListeners.calendar_updated.after,
      this._refresh_callback.bind(this),
      {
        callback_key: this.get_callback_key(),
      },
    );

    const is_top = true;
    if (this.rcmail(is_top).add_event_listener_ex) {
      this.rcmail(is_top).add_event_listener_ex(
        'frame_opened',
        'planning',
        (args) => {
          if (args.eClass === 'workspace') {
            const func = () => {
              $(window).resize();
              let frame = this.select_frame('workspace');
              $(frame[0].contentWindow).resize();
  
              let wsp = frame[0].contentWindow.find('.side-workspaces');
  
              if (wsp.length > 0) {
                for (const element of wsp.find('iframe')) {
                  $(element.contentWindow).resize();
                }
              }

              frame = null;
              wsp = null;
            }

            func();
            setTimeout(() => {
              func();
            }, 100);
          }
        },
      );
    }
  }

  //           BINDS         //

  /**
   * Actualise le rendu du calendrier
   * @returns {number} Numéro du timeout
   * @package
   */
  _rerender() {
    return setTimeout(() => {
      this._rerender_action();
      setTimeout(this._rerender_action.bind(this), 500);
    }, 100);
  }

  /**
   * Actualise le rendu du calendrier
   *
   * Est appelé par {@link _rerender}
   * @package
   */
  _rerender_action() {
    if (this.calendar) {
      // this.calendar.rerenderEvents();
      // this.calendar.render();
      $(window).resize();
    }
  }

  /**
   * Passe au jour précédent
   * @package
   */
  _prev() {
    this.calendar.prev();
    this.refresh_planning_date();
  }

  /**
   * Passe au jour suivant
   * @package
   */
  _next() {
    this.calendar.next();
    this.refresh_planning_date();
  }

  /**
   * Passe au jour actuel
   * @package
   */
  _today() {
    this.calendar.today();
    this.refresh_planning_date();
  }

  /**
   * Affiche la fenêtre de sélection de date.
   * @package
   */
  _show_calendar() {
    let tmp = $('<input>')
      .css({ position: 'absolute', opacity: 0, top: 0 })
      .appendTo('body')
      .datepicker();

    tmp.on('change', this._accept_calendar.bind(this, tmp)).click();
  }

  /**
   * Action à faire lorsque l'on a séléctionner une date.
   * @param {external:jQuery} tmp Input de qui provient la fenêtre de sélection de date.
   * @see {@link _show_calendar}
   * @package
   */
  _accept_calendar(tmp) {
    this.calendar.gotoDate(moment(tmp.val(), DATE_FORMAT));
    tmp.remove();
    tmp = null;
    this.refresh_planning_date();
  }

  /**
   * Action faite lors de la recherche.
   *
   * Si une valeur est présente, on filtre les ressources, sinon on les affiches tous.
   * @package
   */
  _on_search() {
    const value = this.get_search_value();

    if (value) {
      //On affiche les ressources qui ont des évènements et on cache les autres.
      this.calendar.option('filterResourcesWithEvents', true);
      $(SELECTOR_SEARCH_ICON).css('display', 'none');
      $(SELECTOR_SEARCH_RESET_BUTTON).css('display', EMPTY_STRING);
    } else {
      //On affiche toute les ressources.
      this.calendar.option('filterResourcesWithEvents', false);
      $(SELECTOR_SEARCH_ICON).css('display', EMPTY_STRING);
      $(SELECTOR_SEARCH_RESET_BUTTON).css('display', 'none');
    }

    this.calendar.refetchEvents();
  }

  /**
   * Met à jours les évènements du planning
   * @package
   * @returns {void}
   */
  _refresh_callback() {
    if (!this.calendar) return;

    this.freebusy = {};
    this.events = {};
    this.calendar.refetchEvents();
  }

  /**
   * Récupère les données des évènements du calendrier lié à l'espace de travail en cours.
   *
   * Les données sont mises en cache pour chaque jours.
   * @param {external:moment} start
   * @param {external:moment} end
   * @param {string} timezone
   * @param {function} callback
   * @return {Promise<void>}
   * @async
   * @package
   */
  async _source_events(start, end, timezone, callback) {
    var go = true;
    let events = this.events[start.format(DATE_FORMAT)];

    if (!events) {
      go = this._set_busy();

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
            x.categories[0] ===
              `${WspHelper.GetWspPrefix()}${rcmail.env.current_workspace_uid}`,
        )
        .select((x) => {
          return {
            initial_data: x,
            title: x.title,
            start: x.allDay ? moment(x.start).startOf('day') : x.start,
            end: x.end,
            resourceId: ID_RESOURCES_WSP,
            color: rcmail.env.current_settings.color,
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

      this.events[start.format(DATE_FORMAT)] = events;
    }

    callback(events);

    this._unset_busy(go);
  }

  /**
   * Récupère les données des status des participants lié à l'espace de travail en cours.
   *
   * Les données sont mises en cache pour chaque jours.
   * @param {external:moment} start
   * @param {external:moment} end
   * @param {string} timezone
   * @param {function} callback
   * @return {Promise<void>}
   * @async
   * @package
   */
  async _source_freebusy(start, end, timezone, callback) {
    var go = true;
    var data = this.freebusy[start.format(DATE_FORMAT)];

    const value = this.get_search_value()?.toUpperCase?.();

    if (!data) {
      go = this._set_busy();

      data = await this.generateEvents(start);
      this.freebusy[start.format(DATE_FORMAT)] = data;
    }

    if (value) {
      const resources = this.calendar_resources();
      data = MelEnumerable.from(data)
        .where((x) =>
          rcmail.env.current_workspace_users[x.resourceId].name
            .toUpperCase()
            .includes(value),
        )
        .aggregate(
          MelEnumerable.from(resources)
            .where(
              (x) =>
                x.id === ID_RESOURCES_WSP ||
                rcmail.env.current_workspace_users[x.id].name
                  .toUpperCase()
                  .includes(value),
            )
            .select((x) => {
              return {
                title: 'tmp',
                start: moment(start).startOf('day'),
                end: moment(start).startOf('day').add('1', 'm'),
                resourceId: x.id,
                color: 'transparent',
              };
            }),
        )
        .toArray();
    }

    callback(data);

    this._unset_busy(go);
  }

  /**
   * Gère le rendu des évènement
   * @param {*} eventObj Objet évènement
   * @param {external:jQuery} $el Element du dom (jQuery)
   * @package
   */
  _event_render(eventObj, $el) {
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

  /**
   * Gère le rendu des ressources
   * @param {*} resourceObj Objet resource
   * @param {external:jQuery} labelTds Element du dom (jQuery)
   * @package
   */
  _resources_render(resourceObj, labelTds) {
    if (resourceObj.id !== ID_RESOURCES_WSP) {
      labelTds
        .attr(
          'title',
          this.get_env('current_workspace_users')?.[resourceObj.id]?.fullname ||
            resourceObj.title,
        )
        .tooltip();
    }
  }

  /**
   * Lorsque l'on clique sur un évènement => ouvre un évènement dans l'agenda
   * @param {*} eventObj Objet évènement
   * @package
   */
  _event_on_click(eventObj) {
    const start = eventObj.initial_data.start.toDate
      ? eventObj.initial_data.start
      : moment(eventObj.initial_data.start);
    const date = start.toDate().getTime() / 1000.0;
    html_events._action_click(
      eventObj.initial_data.calendar,
      date,
      eventObj.initial_data,
    );
  }

  /**
   * Lorsque l'on clique sur un le bouton reset de la recherche => réinitialise la recherche
   * @package
   */
  _event_on_remove_search_click() {
    $(SELECTOR_SEARCH_INPUT).val(EMPTY_STRING).change();
  }

  //                 STATICS           //

  /**
   * Lance un planning
   * @static
   * @returns {PlanningManager}
   */
  static Start() {
    return new PlanningManager();
  }

  static AddCommands() {
    // This is a placeholder for the add commands method
  }
}
