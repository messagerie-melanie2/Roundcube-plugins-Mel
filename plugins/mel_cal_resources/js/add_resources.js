import { EventView } from '../../mel_metapage/js/lib/calendar/event/event_view.js';
import { GuestsPart } from '../../mel_metapage/js/lib/calendar/event/parts/guestspart.js';
import { TimePartManager } from '../../mel_metapage/js/lib/calendar/event/parts/timepart.js';
import {
  BnumMessage,
  eMessageType,
} from '../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../mel_metapage/js/lib/classes/enum.js';
import { MelDialog } from '../../mel_metapage/js/lib/classes/modal.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
} from '../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { getRelativePos } from '../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../mel_metapage/js/lib/mel_promise.js';
import { FavoriteLoader } from './lib/favorite_loader.js';
import { ResourcesBase } from './lib/resource_base.js';
import { ResourceLocation } from './lib/resource_location.js';

export { ResourceDialog };

/**
 * @module Resources/Modal
 * @local ResourceConfig
 * @local ResourcesConfig
 * @local FilterConfig
 * @local GuestResource
 */

/**
 * Représentation de la configuration d'une ressource.
 * @typedef ResourceConfig
 * @property {string} name Nom de la ressource
 * @property  {boolean} is_option Si la ressource doit être affiché dans la liste des modes d'évènements ou non
 * @property {string} load_data Nom de la fonction qui permettra de récupérer les données de la ressource associée
 */

/**
 * Représentation de la configuration d'un filtre
 * @typedef FilterConfig
 * @property {string} name Nom/id du filtre
 * @property {?string} load_data Nom de la fonction qui permettra de récupérer les données du filtre côté serveur.
 * @property {?string} load_data_on_change Nom de la fonciton qui va récupérer les données de la ressource associé côté serveur lors du changement de valeur du filtre.
 * @property {number} size Taille du filtre (de 1 à 12)
 * @property {eInputType} input_type Type d'input (select ou multi-select)
 * @frommoduleproperty Resources/Filters input_type
 */

/**
 * Représente la configuration récupérer depuis le php
 * @typedef ResourcesConfig
 * @property {Object<string, ResourceConfig>} resources Liste des configurations de ressources par type de ressources
 * @property {Object<string, FilterConfig[]>} filters Liste des configurations des filtres par ressources
 * @frommoduleproperty Resources/Modal resources {@linkto ResourceConfig}
 * @frommoduleproperty Resources/Modal filters {@linkto FilterConfig}
 */

/**
 * Représentation d'un participant
 * @typedef GuestResource
 * @property {string} name Nom du participant
 * @property {string} email Email du participants
 * @property {GuestsPart.ROLES} role Role du participant
 * @property {string} resource_type Type de la ressource
 * @property {string} resource_id Id de la ressource
 * @frommoduleproperty EventView/Parts/Guests role {@membertype .}
 */

/**
 * @class
 * @classdesc Représente une dialog pour la gestion des ressources
 * @extends MelObject
 */
class ResourceDialog extends MelObject {
  /**
   * La dialog à besoin du bouton et de la location qui l'a appelé, les gestionnaire de date de l'évènement associé, le participant associé (si il éxiste) ainsi que le type de ressoure que l'on veux afficher.
   * Si aucune ressource est passé, on les affiche tous.
   * @param {external:jQuery} button Bouton qui a appelé cet objet
   * @param {ResourceLocation} location Location qui à appeller cet objet
   * @param {?string} [resource_type=null] Type de ressource. Si null, ouvre toute les ressources (in progress)
   * @param {TimePartManager} date Date de l'évènement. Permet de récupérer la date de celui-ci et de la changer lors de la sauvegarde
   * @param {GuestResource} resource Participant associé
   */
  constructor(button, date, resource, location, resource_type = null) {
    super(button, resource_type, date, resource, location);
  }

  /**
   * Initialise et assignes les variables de la classe
   * @private
   * @param  {...any} args
   * @override
   */
  main(...args) {
    super.main(...args);

    const [button, resource_type, date, resource, location] = args;

    /**
     * Bouton qui a appelé cet objet
     * @private
     * @type {external:jQuery}
     */
    this._caller_button = button;
    /**
     * Ressource que doit afficher la modal.
     *
     * Si null, doit toute les afficher.
     * @type {?string}
     * @private
     */
    this._resource_type = resource_type;
    /**
     * Gère le temps de l'évènement
     * @private
     * @type {TimePartManager}
     */
    this._date = date;
    /**
     * Participant associé à la location
     * @private
     * @type {GuestResource}
     */
    this._resource = resource;
    /**
     * Si la dialog est initialisée ou non
     * @private
     * @type {boolean}
     */
    this._initialized = false;
    /**
     * Action à faire lors de l'affichage de la dialog
     * @type {BnumEvent<Function>}
     * @private
     */
    this._event_on_show = new BnumEvent();
    /**
     * Ressource sélectionnée
     * @type {import('./lib/resource_base.js').ResourceData}
     * @private
     */
    this._selected_resource = null;
    /**
     * Mode d'évènement associé
     * @type {ResourceLocation}
     * @private
     */
    this._location = location;

    /**
     * Date de départ
     * @type {external:moment}
     */
    this.start = null;
    /**
     * Date de fin
     * @type {external:moment}
     */
    this.end = null;
    /**
     * Journée entière ou non
     * @type {boolean}
     */
    this.all_day = null;

    //this.selected_resource = null;
  }

  /**
   *
   * @returns
   */
  async _init() {
    let page;
    let resources = [];

    if (this._resource_type) {
      resources.push(
        new ResourcesBase(
          rcmail.gettext(this._resource_type, 'mel_cal_resources'),
          rcmail.env.cal_resources.filters[this._resource_type],
        ),
      );

      resources[resources.length - 1].all_day = this._date.is_all_day;
      resources[resources.length - 1].start = this._date.date_start;
      resources[resources.length - 1].end = this._date.date_end;
      resources[resources.length - 1].event_on_save.push(
        this._on_save.bind(this),
      );
      resources[resources.length - 1].location_id = this._location.id;

      if (this._resource && window.selected_resources[this._location.id]) {
        resources[resources.length - 1].selected_resource =
          window.selected_resources[this._location.id];
        resources[resources.length - 1].try_add_resource(
          window.selected_resources[this._location.id],
          false,
        );
      }

      page = await resources[resources.length - 1].create_page();
    } else {
      throw 'not implemented';
    }

    this.dialog = new MelDialog(page, {
      width: 800,
      height: 500,
      close: () => {
        $('#eventedit').css('opacity', EMPTY_STRING);
        if (!EventView.INSTANCE.is_jquery_dialog()) {
          EventView.INSTANCE.get_dialog()
            .modal.css('width', EMPTY_STRING)
            .find('.modal-dialog')
            .css('max-width', EMPTY_STRING);
        }
      },
    });

    this.resources = resources;
  }

  /**
   * Met à jour le combot date + horaire
   * @private
   * @param {string} type start/e,d
   * @param {external:moment} moment Date
   * @returns {ResourceDialog} Chaînage
   */
  _set_date(type, moment) {
    this.dialog._$dialog
      .find(`.input-date-${type}`)
      .val(moment.format(DATE_FORMAT));

    this.dialog._$dialog
      .find(`.input-time-${type}`)
      .val(moment.format(DATE_HOUR_FORMAT));

    return this;
  }

  /**
   * Lors de la sauvegarde
   * @private
   */
  _on_save() {
    if (this._selected_resource) {
      //On supprime l'ancien participant
      $(
        `.mel-attendee[data-email="${this._selected_resource.email}"] .close-button`,
      ).click();
    }

    const current_resource = this.get_selected_resource();
    if (
      current_resource &&
      !$(`.mel-attendee[data-email="${current_resource.email}"]`).length
    ) {
      if (!window.selected_resources) window.selected_resources = {};
      //On utilisera ça lorsque l'on reviendra sur la modale
      window.selected_resources[this._location.id] = current_resource;

      //On change le bouton de text, couleur et on lui donne les info de la ressource sélectionné
      if (typeof this._caller_button === 'function')
        this._caller_button = this._caller_button();

      this._caller_button
        .html(
          $('<span>')
            .css('vertical-align', 'super')
            .text(ResourceDialog.GetRessourceLocationFormat(current_resource)),
        )
        .prepend(
          MelHtml.start
            .icon('ads_click')
            .css('color', 'var(--mel-button-text-color)')
            .css('margin-right', '5px')
            .end()
            .generate(),
        )
        .attr('resource', current_resource.email);

      //On créé un participant
      EventView.INSTANCE.parts.guests._$fakeField
        .val(
          `role=${GuestsPart.ROLES.resource}:${current_resource.fullname}<${current_resource.email}>`,
        )
        .change();

      ResourceLocation.SetAttendeeMechanics(current_resource.email);
    } else if (!current_resource) {
      BnumMessage.DisplayMessage(
        'Veuillez séléctionner une ressource !',
        eMessageType.Error,
      );
    }

    //Met à jour la date de l'évènement
    GuestsPart.can = false;
    const cr = this.get_current_page_resource();
    this._date._$start_date.val(cr.start.format(DATE_FORMAT)).change();
    TimePartManager.UpdateOption(
      this._date.start._$fakeField.attr('id'),
      cr.start.format(DATE_HOUR_FORMAT),
    );
    this._date.start._$fakeField
      .val(cr.start.format(DATE_HOUR_FORMAT))
      .change();
    this._date._$end_date.val(cr.end.format(DATE_FORMAT)).change();
    TimePartManager.UpdateOption(
      this._date.end._$fakeField.attr('id'),
      cr.end.format(DATE_HOUR_FORMAT),
    );
    GuestsPart.can = true;
    this._date.end._$fakeField.val(cr.end.format(DATE_HOUR_FORMAT)).change();

    if (this._date.is_all_day !== $('#rc-allday').prop('checked')) {
      this._date.$allDay.click();
    }

    //Change le titre de l'évènement si besoin
    if (!(EventView.INSTANCE.inputs.text_title.val() || false)) {
      EventView.INSTANCE.inputs.text_title.val(
        this.gettext('automatic-resa-title', 'mel_cal_resources').replaceAll(
          '%0',
          current_resource.fullname,
        ),
      );
    }

    //Change la location
    this._location.location =
      ResourceDialog.GetRessourceLocationFormat(current_resource);
    this._location.onchange.call();

    //Changer le status si besoin
    if (!(EventView.INSTANCE.parts.status._$field.val() || false))
      EventView.INSTANCE.parts.status._$field.val('FREE').change();

    //Changer la réccurence
    EventView.INSTANCE.parts.recurrence._$fakeField
      .val(EMPTY_STRING)
      .addClass('disabled')
      .attr('disabled', 'disabled')
      .change();

    if (!EventView.INSTANCE.is_jquery_dialog()) {
      //On remet la modale globale comme avant
      EventView.INSTANCE.get_dialog()
        .modal.css('width', EMPTY_STRING)
        .find('.modal-dialog')
        .css('max-width', EMPTY_STRING);
    }

    this.dialog.hide();
  }

  /**
   * Initialise les données de la modale si elle n'est pas initialisée.
   * @async
   * @returns {Promise<ResourceDialog>} Chaînage
   */
  async try_init() {
    if (!this._initialized) {
      $('#eventedit').css('opacity', 0);
      this.get_skin()
        .create_loader('rtc-show-event', true, true)
        .appendTo($('#eventedit').parent());
      await this._init();
      this._initialized = true;
    }

    return this;
  }

  /**
   * Affiche la dialog
   * @async
   * @returns {Mel_Promise}
   */
  show() {
    if (!EventView.INSTANCE.is_jquery_dialog()) {
      //Si on une modale globale, on change l'affichage de celle-ci pour que se soit + lisible
      EventView.INSTANCE.get_dialog()
        .modal.css('width', '100%')
        .find('.modal-dialog')
        .css('max-width', 'unset');

      this.dialog.options.width = '100%';
    }

    this._selected_resource = this.get_selected_resource();
    return new Mel_Promise((current_promise) => {
      current_promise.start_resolving();

      this.dialog.show();

      if (!this._selected_resource)
        this._selected_resource = this.get_selected_resource();

      FavoriteLoader.StartLoading(this.get_current_page_resource()._name);

      if (
        window.selected_resources &&
        window.selected_resources[this._location.id] &&
        this._selected_resource !== window.selected_resources[this._location.id]
      ) {
        $(`#radio-${window.selected_resources[this._location.id].uid}`).click();
      }

      //Attendre que tout soit bien afficher
      setTimeout(() => {
        //On affiche correctement le calendrier
        let resource = MelEnumerable.from(this.resources).first();
        resource.render();
        resource._$calendar.fullCalendar('render');

        //On initialise les datepickers qui ont besoin d'être init
        this.dialog._$dialog
          .find('[datepicker="true"]')
          .each((i, e) => {
            $(e).datepicker({
              defaultDate: new Date(),
              firstday: 1,
            });
          })
          .attr('datepicker', 'initialized');

        //On vire les valeurs inutiles des multi-selects
        this.dialog._$dialog.find('[multiple="true"]').each((i, e) => {
          $(e).find('option[value="/"]').remove();
          $(e).find('option[value=""]').remove();
          $(e)
            .multiselect({
              nonSelectedText: $(e).attr('data-fname'),
              inheritClass: true,
              buttonWidth: '100%',
            })
            .attr('multiple', 'initialized')
            .multiselect('rebuild');
        });

        //On met la bonne date pour qu'elle soit cohérente avec l'évènement
        this.set_date(
          this._date.date_start,
          this._date.date_end,
          this._date.is_all_day,
        );

        this._event_on_show.call();
        this._event_on_show.clear();

        $('#rtc-show-event').remove();

        if ($('#eventedit').css('opacity') === '0') {
          $('#eventedit').css('opacity', 0.5);
        }

        if (!this._scrolled) {
          //On scroll à la bonne heure
          const element = resource._$calendar.find(
            `.fc-widget-header[data-date="${this._date.date_start.startOf('day').add(cal.settings.first_hour, 'h').format('YYYY-MM-DD HH:mm').replace(' ', 'T')}:00"]`,
          )[0];
          const element_pos = getRelativePos(element);
          resource._$calendar
            .find('.fc-body .fc-time-area .fc-scroller')
            .first()[0].scrollLeft = element_pos.left;

          this._scrolled = true;
        }

        current_promise.resolve(true);
      }, 100);
    });
  }

  /**
   * Met à jour les champs dates
   * @param {external:moment} start Date de départ
   * @param {external:moment} end Date de fin
   * @param {boolean} all_day Journée entière ou non
   * @returns {ResourceDialog} Chaînage
   */
  set_date(start, end, all_day) {
    if (this.dialog._$dialog) {
      this._set_date('start', start)._set_date('end', end);
      $('#rc-allday').prop('checked', all_day);
      if (this.get_current_page_resource()._$calendar)
        this.get_current_page_resource()._$calendar.fullCalendar(
          'refetchEvents',
        );

      if (all_day) {
        this.dialog._$dialog.find('.input-time-start').hide();
        this.dialog._$dialog.find('.input-time-end').hide();
      } else {
        this.dialog._$dialog.find('.input-time-start').show();
        this.dialog._$dialog.find('.input-time-end').show();
      }

      this.get_current_page_resource()._$calendar.fullCalendar(
        'gotoDate',
        start,
      );
      this.get_current_page_resource()._$calendar.fullCalendar('refetchEvents');

      this.get_current_page_resource().refresh_calendar_date();
    } else
      this._event_on_show.push(this.set_date.bind(this), start, end, all_day);

    return this;
  }

  /**
   * Sélectionne une ressource
   * @param {import('./lib/resource_base.js').ResourceData} rc
   * @returns {ResourceDialog} Chaînage
   */
  set_selected_resource(rc) {
    this.get_current_page_resource().selected_resource = rc;
    return this;
  }

  /**
   * Ajoute une ressource
   * @param {import('./lib/resource_base.js').ResourceData} rc
   * @returns {ResourceDialog} Chaînage
   */
  add_resource(rc) {
    this.get_current_page_resource().try_add_resource(rc);
    return this;
  }

  /**
   * Ajoute plusieurs ressources
   * @param {import('./lib/resource_base.js').ResourceData[]} rcs
   * @returns {ResourceDialog} Chaînage
   */
  add_resources(rcs) {
    for (const rc of rcs) {
      this.get_current_page_resource().try_add_resource(rc);
    }

    return this;
  }

  /**
   * Récupère la ressource courrante
   * @returns {?ResourcesBase}
   * @frommodulereturn Resources
   */
  get_current_page_resource() {
    return MelEnumerable.from(this.resources)
      .where((x) => x._name === this.dialog.page_manager._current_page)
      .firstOrDefault();
  }

  /**
   * Récupère les données de la ressource courrante
   * @returns {?import('./lib/resource_base.js').ResourceData}
   */
  get_selected_resource() {
    return MelEnumerable.from(this.resources)
      .where((x) => x._name === this.dialog.page_manager._current_page)
      .firstOrDefault()?.selected_resource;
  }

  /**
   * Supprime la dialog du dom
   */
  destroy() {
    this.dialog.destroy();
  }

  /**
   * @static
   * @param {import('./lib/resource_base.js').ResourceData} current_resource
   * @returns
   */
  static GetRessourceLocationFormat(current_resource) {
    return `${current_resource.name} - ${current_resource.street} ${current_resource.postalcode} ${current_resource.locality}`;
  }
}
