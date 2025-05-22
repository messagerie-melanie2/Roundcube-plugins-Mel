import { FreeBusyLoader } from '../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { DATE_TIME_FORMAT } from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { FavoriteLoader } from './favorite_loader.js';
import { ResourcesBase } from './resource_base.js';
import { HTMLResourceElement } from './webcomponents/HTMLResourceElement.js';

export { ResourceBaseFunctions };

/**
 * Ajoute une location à la liste de location d'un évènement
 * @module Resources/ResourceBaseFunctions/Functions
 * @local FunctionFrom
 * @local ResourceBaseFunctions
 */

/**
 * @class
 * @classdesc Change le "this" du callback associé
 * @package
 * @template {F}
 */
class FunctionFrom {
  /**
   * Constructeur de la classe
   * @param {function} callback Fonction qui nous intéresse
   * @param {F} thisArgs Nouveau "this" de la fonction
   */
  constructor(callback, thisArgs) {
    this._callback = callback;
    this._this = thisArgs;
  }

  /**
   * Appèle la fonction
   * @param  {...any} args Arguments de la fonction
   * @returns {*}
   */
  call(...args) {
    return this._callback.call(this._this, ...args);
  }

  /**
   * Récupère la fonction avec le nouveau "this"
   * @param  {...any} args
   * @returns
   */
  get(...args) {
    return this._callback.bind(this._this, ...args);
  }
}

/**
 * @class
 * @classdesc Contient les fonctions pour les différents appèles de la classe {@link ResourcesBase}
 */
class ResourceBaseFunctions {
  /**
   * Constructeur de la classe.
   *
   * Demande un objet de type {@link ResourcesBase} qui sera le "this" des fonctions membres de l'instance.
   * @param {ResourcesBase} resourceBase
   * @frommoduleparam Resources resourceBase
   * @override
   */
  constructor(resourceBase) {
    this.main(resourceBase);
  }

  /**
   * Change le "this" des fonctions de cette instance de classe.
   * @package
   * @param {ResourcesBase} resourceBase
   * @frommoduleparam Resources resourceBase
   * @override
   */
  main(resourceBase) {
    this._resourceBase = resourceBase;

    for (const iterator of Object.getOwnPropertyNames(this.__proto__)) {
      this[iterator] = new FunctionFrom(
        this[iterator],
        this._resourceBase,
      ).get();
    }
  }

  /**
   * Action lorsque l'on clique sur le bouton étoile d'une ressource, ce qui permet de la mettre en favoris ou non.
   * @param {Event} e Evènement envoyer par le click
   * @this ResourcesBase
   * @see {@link ResourceBaseFunctions.resource_render}
   * @frommodulethis Resources
   */
  on_star_clicked(e) {
    BnumMessage.SetBusyLoading();

    const rcs = this._name.toUpperCase();
    const id = $(e.currentTarget).data('email');
    const favorite = !JSON.parse(
      $(e.currentTarget).attr('data-favorite') ?? 'false',
    );

    $(e.currentTarget)
      .attr('data-favorite', favorite)
      .addClass('disabled')
      .attr('disabled', 'disabled');

    this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'set_favorite',
      params: {
        _favorite: favorite,
        _uid: id,
        _resource: this._name,
      },
      on_success: (data) => {
        this.rcmail().env.fav_resources ??= [];
        this.rcmail().env.fav_resources[rcs] ??= [];
        this.rcmail().env.fav_resources[rcs][id] = favorite;

        this._on_data_changed();

        data = JSON.parse(data);

        if (data) {
          const current_favorite = this._p_resources.find(
            (x) => x.data.email === id,
          )?.data;

          if (current_favorite)
            FavoriteLoader.Add(this._name, current_favorite);
        } else FavoriteLoader.Remove(this._name, id);

        return data;
      },
    }).always(BnumMessage.StopBusyLoading.bind(BnumMessage));
  }

  /**
   * Action lorsqu'une date est sélectionné au clique
   * @this ResourcesBase
   * @param {external:moment} start Date de début
   * @param {external:moment} end Date de fin
   * @param {*} jsEvent /
   * @param {*} view /
   * @param {import('./resource_base.js').ResourceObject} resource Ressource sélectionnée
   * @see {@link ResourcesBase._generate_ui}
   * @frommodulethis Resources
   */
  on_selected_date(start, end, jsEvent, view, resource) {
    start = moment(start.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm');
    end = moment(end.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm');

    this.start = start;
    this.end = end;

    $(`#radio-${resource.data.uid}-${this.location_id}`).click();

    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Recherche des évènements entre deux dates pour une ressource donnée
   * @param {external:moment} sd Date de départ
   * @param {external:moment} ed Date de fin
   * @param {{id:string}} rcs Ressource
   * @param {Object} [param3={}]
   * @param {boolean} [param3.includesNonPlainDate=false] Si on doit inclure les évènement qui commence ou finissent entre les dates
   * @param {boolean} [param3.ignoreMe=true] Si on doit ignorer les évènements de l'utilisateur
   * @returns {MelEnumerable} Liste des évènements
   * @this ResourcesBase
   */
  search(
    start,
    end,
    rcs,
    { includesNonPlainDate = false, ignoreMe = true } = {},
  ) {
    //Les dates sont formater puis convertit en string pour éviter les problèmes lié au timezone
    const sd = moment(start.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm');
    const ed = moment(end.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm');
    return MelEnumerable.from(this._p_events)
      .select((x) => {
        return {
          start: moment(x.start.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm'),
          end: moment(x.end.format('DD/MM/YYYY HH:mm'), 'DD/MM/YYYY HH:mm'),
          resourceId: x.resourceId,
          creatorId: x.creatorId,
        };
      })
      .where((value) => {
        /**
         * Vérifie si l'évènement est entre les dates de début et de fin
         * @type {boolean}
         */
        const eventBetweenStartAndEnd =
          value.start.isBetween(sd, ed) && value.end.isBetween(sd, ed);
        /**
         * Vérifie si l'évènement commence ou fini entre les dates de début et de fin
         * @type {boolean}
         */
        const eventStartOrEndBetween =
          includesNonPlainDate &&
          (value.start.isBetween(sd, ed) || value.end.isBetween(sd, ed));
        /**
         * Vérifie si les date choisie se trouvent à l'intérieur de l'évènement
         * @type {boolean}
         */
        const eventStartAndEndBetween =
          sd.isBetween(value.start, value.end, undefined, '[]') &&
          ed.isBetween(value.start, value.end, undefined, '[]');
        const eventValid =
          eventBetweenStartAndEnd ||
          eventStartOrEndBetween ||
          eventStartAndEndBetween;
        const isGoodResource = value.resourceId === rcs.id;
        return eventValid && isGoodResource;
      })
      .where((x) => (ignoreMe ? x.creatorId !== rcmail.env.username : true));
  }

  /**
   * Action lorsqu'une ressource est sélectionné
   * @param {Event} e
   * @this ResourcesBase
   * @see {@link ResourceBaseFunctions.resource_render}
   * @frommodulethis Resources
   */
  on_resource_selected(e) {
    e = $(e.currentTarget);

    //Id de la ressource se trouve entre `radio-` et `-${this.location_id}`
    const id = e
      .attr('id')
      .replace('radio-', EMPTY_STRING)
      .replace(`-${this.location_id}`, EMPTY_STRING);

    this.selected_resource = MelEnumerable.from(this._p_resources)
      .where((x) => x.data.uid === id)
      .firstOrDefault()?.data;

    //On selectionne la bon ne ressource et on décoche les autres
    for (let i = 0; i < this._p_resources.length; ++i) {
      if (this._p_resources[i].data.uid === id)
        this._p_resources[i].data.selected = true;
      else this._p_resources[i].data.selected = false;
    }

    //On vérifie si la ressource est déjà prise, et on empêche la sélection si c'est le cas
    const start = moment(this.start);
    const end = moment(this.end);
    if (
      this._functions
        .search(
          start,
          end,
          { id: this.selected_resource.email },
          { ignoreMe: true },
        )
        .any()
    ) {
      BnumMessage.DisplayMessage(
        'La ressource est déjà prise à cette date.',
        'error',
      );
      this.selected_resource = null;
      e[0].checked = false;
    } else {
      let searched = this._functions
        .search(
          start,
          end,
          { id: this.selected_resource.email },
          {
            includesNonPlainDate: true,
            ignoreMe: true,
          },
        )
        .toArray();

      if (searched.length > 0) {
        if (start < searched[0].start) this.end = searched[0].start;
        else if (searched[0].end < end) this.start = searched[0].end;
      }
    }

    //Met les dates aux heures de travail
    const settings = window.cal?.settings || top.cal.settings;

    if (+this.start.format('HH') < settings.work_start) {
      $('.input-time-start')
        .val(
          `${settings.work_start < 9 ? `0${settings.work_start}` : settings.work_start}:00`,
        )
        .change();
    }

    if (+this.end.format('HH') > settings.work_end) {
      if (+this.start.format('HH') >= settings.work_end) {
        const start = settings.work_end - 1;
        $('.input-time-start')
          .val(`${start < 9 ? `0${start}` : start}:00`)
          .change();
      }

      $('.input-time-end')
        .val(
          `${settings.work_end < 9 ? `0${settings.work_end}` : settings.work_end}:00`,
        )
        .change();
    }

    this._$calendar.fullCalendar('refetchEvents');

    this._set_validity();
  }

  /**
   * Génère le radio pour séléctionner la ressource.
   * @param {import('./resource_base.js').ResourceData} data Donnée de la ressource
   * @returns {HTMLResourceElement}
   * @this ResourcesBase
   */
  resource_render_element(data) {
    let node = HTMLResourceElement.CreateNode({
      selected: data.selected,
      rcsId: data.uid,
      locationId: this.location_id,
      email: data.email,
      favorite:
        this.get_env('fav_resources')[this._name.toUpperCase()]?.[data.email] ??
        false,
      value: data.email,
    });

    node.onradioclicked.push(this._functions.on_resource_selected);
    node.onfavoriteclicked.push(this._functions.on_star_clicked);

    return node;
  }

  /**
   * Action à faire lors du rendu de la ressource
   * @param {import('./resource_base.js').ResourceObject} resourceObj Ressourceà rendre
   * @param {external:jQuery} labelTds Div qui contient l'affichage
   * @this ResourcesBase
   * @see {@link ResourcesBase._generate_ui}
   * @frommodulethis Resources
   */
  resource_render(resourceObj, labelTds) {
    if (resourceObj.id !== 'resources') {
      labelTds
        .find('.fc-cell-content')
        .addClass('cfc-resource')
        .append(this._functions.resource_render_element(resourceObj.data));
    }
  }

  /**
   * Charge les évènements et es affiches dans `fullcalendar`
   * @this ResourcesBase
   * @param {external:moment} start Date de départ
   * @param {external:moment} end Date de fin
   * @param {number} timezone /
   * @param {Function} callback A appeller et à donner la liste des évènements en argument.
   * @frommodulethis Resources
   */
  event_loader(start, end, timezone, callback) {
    this._functions.event_loader_async(start, end, timezone, callback);
  }

  /**
   * Charge les évènements et es affiches dans `fullcalendar`.
   *
   * Ajoute les évènements au fur et à mesure. Cela ne permet de charger les évènements que lors de certaines actions et de ne pas
   * recharger ceux que l'on connaît déjà.
   * @async
   * @this ResourcesBase
   * @param {external:moment} start Date de départ
   * @param {external:moment} end Date de fin
   * @param {number} timezone /
   * @param {Function} callback A appeller et à donner la liste des évènements en argument.
   * @returns {Promise}
   * @frommodulethis Resources
   */
  async event_loader_async(start, end, timezone, callback) {
    const key = `${start.format()}-${end.format()}`;

    let emails = this._p_resources
      .map((x) => x.data.email)
      .filter((x) => !this._cache[key]?.includes?.(x));

    if (emails.length > 0) {
      if (!this._cache[key]) this._cache[key] = [];

      this._cache[key].push(...emails);

      let rcs = FreeBusyLoader.Instance.generate(emails, {
        start,
        end,
        interval: FreeBusyLoader.Instance.interval,
      });

      for await (const slots of rcs) {
        for (const slot of slots) {
          if (!slot.isFree) {
            this._p_events.push(new ResourceEvent(slot, slots.email));
          }
        }
      }
    }

    let rcs = MelEnumerable.from(this._p_events)
      .aggregate({
        title: 'Moi',
        start: this.start,
        end: this.end,
        allDay: this.all_day,
        resourceId: this.selected_resource?.email,
        color: 'green',
      })
      .toArray();

    callback(rcs);

    if (!this.itemloaded && this._p_events.length) {
      this.itemloaded = true;

      setTimeout(() => {
        this._$calendar.fullCalendar('refetchEvents');
      }, 100);
    }
  }

  /**
   * Lorsque une date a changée, met à jours les autres inputs identiques et gère les comportements de dates.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {external:jQuery} $e Elément qui à changer
   * @param {string} html_class Classe de l'élément qui a changé
   */
  on_date_changed($e, html_class) {
    const val = $e.val();
    $(html_class).each((i, e) => {
      $(e).val(val);
    });

    const start = `${$('.input-date-start').val()} ${$('.input-time-start').val()}`;
    const end = `${$('.input-date-end').val()} ${$('.input-time-end').val()}`;
    this.start = moment(start, DATE_TIME_FORMAT);
    this.end = moment(end, DATE_TIME_FORMAT);

    if (this.end <= this.start) {
      this.end = moment(this.start).add(1, 'h');
    }

    this._$calendar.fullCalendar('gotoDate', this.start);
    this._$calendar.fullCalendar('refetchEvents');

    this._set_validity();

    this.refresh_calendar_date();
  }

  /**
   * Lorsque la date de départ est changée.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {Event} e Reçu lors du changement de date
   */
  on_date_start_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-date-start', e);
  }

  /**
   * Lorsque la date de fin est changée.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {Event} e Reçu lors du changement de date
   */
  on_date_end_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-date-end');
  }

  /**
   * Lorsque l'heure de départ est changée.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {Event} e Reçu lors du changement d'horaire
   */
  on_time_start_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-time-start');
  }

  /**
   * Lorsque l'heure de fin est changée.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {Event} e Reçu lors du changement d'horaire
   */
  on_time_end_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-time-end');
  }
}

/**
 * @typedef {ResourceEvent} _ResourceEvent
 */

/**
 * @class
 * @classdesc Mise en forme des évènemant fullcalendar
 */
class ResourceEvent {
  /**
   * Constructeur de la classe
   * @param {import('../../../mel_metapage/js/lib/calendar/event/parts/guestspart.free_busy.js').Slot} slot Slot qui contient les données
   * @param {string} email Email qui correspond à l'id
   */
  constructor(slot, email) {
    /**
     * Titre de l'évènement, occupé si on ne connaît pas l'organisateur
     * @type {string}
     * @default 'Occupé'
     */
    this.title =
      (slot.creator.id === MelObject.Empty().get_env('username')
        ? MelObject.Empty().gettext('me', 'mel_cal_resources')
        : slot.creator.name) ||
      MelObject.Empty().gettext('busy', 'mel_cal_resources');
    this.creatorId = slot.creator.id;
    /**
     * Date de début de l'évènement
     * @type {external:moment}
     */
    this.start = slot.start;
    /**
     * Date de fin de l'évènement
     * @type {external:moment}
     */
    this.end = slot.end;
    /**
     * Resource parente
     * @type {string}
     */
    this.resourceId = email;

    //Diff' entre les autres utilisateurs et l'utilisateur en cours.
    if (slot.creator.id === MelObject.Empty().get_env('username')) {
      this.borderColor = 'rouge';
      this.backgroundColor = 'green';
    }
  }
}
