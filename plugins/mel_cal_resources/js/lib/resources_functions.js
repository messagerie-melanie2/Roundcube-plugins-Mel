import { FreeBusyLoader } from '../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { DATE_TIME_FORMAT } from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { FavoriteLoader } from './favorite_loader.js';
import { ResourcesBase } from './resource_base.js';

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
      },
      on_success: (data) => {
        if (!this.get_env('fav_resources'))
          this.rcmail().env.fav_resources = [];

        this.rcmail().env.fav_resources[id] = favorite;
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
    this.start = start;
    this.end = end;

    $(`#radio-${resource.data.uid}-${this.location_id}`).click();

    this._$calendar.fullCalendar('refetchEvents');
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

    const id = e
      .attr('id')
      .replace('radio-', EMPTY_STRING)
      .replace(`-${this.location_id}`, EMPTY_STRING);

    this.selected_resource = MelEnumerable.from(this._p_resources)
      .where((x) => x.data.uid === id)
      .firstOrDefault()?.data;

    for (let i = 0; i < this._p_resources.length; ++i) {
      if (this._p_resources[i].data.uid === id)
        this._p_resources[i].data.selected = true;
      else this._p_resources[i].data.selected = false;
    }

    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Action lorsqu'un label de ressource est cliqué
   * @param {Event} e
   * @this ResourcesBase
   * @see {@link ResourceBaseFunctions.resource_render}
   * @frommodulethis Resources
   * @deprecated
   */
  on_resource_label_clicked(e) {
    // for (let i = 0; i < this._p_resources.length; ++i) {
    //   this._p_resources[i].data.selected = false;
    // }
    // e = $(e.currentTarget);
    // if (!e.attr('for'))
    //   e = $(`label[for="${e.attr('id').replace('radio', EMPTY_STRING)}"`);
    // const id = e.data('id');
    // const index = MelEnumerable.from(this._p_resources)
    //   .select((x, i) => ({ x, i }))
    //   .where((x) => x.x.id === id)
    //   .first().i;
    // this._p_resources[index].data.selected = true;
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
        .css('display', 'flex')
        .prepend(
          $(
            `<input type="radio" class="resource-radio" data-email="${resourceObj.data.email}" id="radio-${resourceObj.data.uid}-${this.location_id}" value="${resourceObj.data.email}" name="resa" ${resourceObj.data.selected ? 'checked' : EMPTY_STRING} />`,
          ).click(this._functions.on_resource_selected),
        )
        .append(
          MelHtml.start
            .div({ class: 'star-button-parent' })
            .button({
              class: 'star-button',
              id: `button-${resourceObj.data.uid}-${this.location_id}`,
              onclick: this._functions.on_star_clicked,
              'data-favorite':
                this.get_env('fav_resources')[resourceObj.data.email] ?? false,
              'data-email': resourceObj.data.email,
            })
            .icon('star')
            .end()
            .end()
            .end()
            .generate(),
        );

      labelTds = labelTds.find('.fc-cell-text');
      let parent = labelTds.parent();
      let text = labelTds.text();
      labelTds.remove();
      parent
        .html(
          $(
            `<label for="radio-${resourceObj.data.uid}-${this.location_id}"></label>`,
          )
            .data('id', resourceObj.data.uid)
            .text(text)
            .css('margin', '0 0 0 5px')
            .css('padding', 0)
            .click(this._functions.on_resource_label_clicked),
        )
        .css({
          height: '100%',
          display: 'flex',
          'align-items': 'center',
          padding: 0,
        });
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

    callback(
      MelEnumerable.from(this._p_events)
        .aggregate({
          title: 'Moi',
          start: this.start,
          end: this.end,
          allDay: this.all_day,
          resourceId: this.selected_resource?.email,
          color: 'green',
        })
        .toArray(),
    );
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

    this.refresh_calendar_date();
  }

  /**
   * Lorsque la date de départ est changée.
   * @this ResourcesBase
   * @frommodulethis Resources
   * @param {Event} e Reçu lors du changement de date
   */
  on_date_start_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-date-start');
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
 * @class
 * @classdesc Mise en forme des évènemant fullcalendar
 */
class ResourceEvent {
  /**
   * Constructeur de la classe
   * @param {Slot} slot Slot qui contient les données
   * @param {string} email Email qui correspond à l'id
   */
  constructor(slot, email) {
    /**
     * Titre de l'évènement
     * @type {string}
     * @default 'Occupé'
     */
    this.title = rcmail.gettext('mel_cal_resources.busy');
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
  }
}
