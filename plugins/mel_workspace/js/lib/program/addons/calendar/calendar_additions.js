/**
 * @file Gère les actions liées aux espaces de travail dans l'agenda.
 * @module calendar_additions
 */

import { BaseStorage } from '../../../../../../mel_metapage/js/lib/classes/base_storage.js';
import { MelEnumerable } from '../../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../../WorkspaceObject.js';

/**
 * Classe permettant de gérer les ajouts spécifiques à l'agenda pour les espaces de travail.
 * @class
 * @extends WorkspaceObject
 */
class CalendarAddition extends WorkspaceObject {
  /**
   * Crée une instance de CalendarAddition.
   * @constructor
   */
  constructor() {
    super();
    /**
     * Stocke les informations sur les évènements (présence de participants et de catégories).
     * @type {BaseStorage<{hasAttendees: boolean, hasCategories: boolean}>}
     */
    this.data = new BaseStorage();
    /**
     * Indique si l'on est en mode édition.
     * @type {boolean}
     */
    this.editMode = false;
    /**
     * Indique si l'élément a été chargé.
     * @type {boolean}
     */
    this.elementLoaded = false;
  }

  /**
   * Ajoute un évènement dans le stockage si il n'existe pas déjà.
   * @param {string} eventId - L'identifiant de l'évènement.
   * @returns {CalendarAddition} L'instance courante pour chaînage.
   * @private
   */
  _add(eventId) {
    if (!this.data.has(eventId)) {
      this.data.add(eventId, {
        hasAttendees: false,
        hasCategories: false,
      });
    }

    return this;
  }

  /**
   * Récupère les données associées à un évènement.
   * @param {string} eventId - L'identifiant de l'évènement.
   * @returns {{hasAttendees: boolean, hasCategories: boolean}} Les données de l'évènement.
   */
  getData(eventId) {
    if (!this.data.has(eventId)) {
      this._add(eventId);
    }

    return this.data.get(eventId);
  }

  /**
   * Supprime les données associées à un évènement.
   * @param {string} eventId - L'identifiant de l'évènement.
   * @returns {this}
   */
  clearData(eventId) {
    if (this.data.has(eventId)) {
      this.data.remove(eventId);
    }

    return this;
  }

  /**
   * Méthode principale qui initialise les différents écouteurs d'évènements pour la gestion des espaces de travail dans l'agenda.
   * @returns {void}
   */
  main() {
    super.main();

    //Ecoute l'évènement `calendar.create.category.before` pour ajouter la bonne catégorie à l'évènement si on est dans un espace de travail
    /**
     * Écoute l'évènement de création de catégorie avant l'ajout pour forcer la catégorie de l'espace de travail.
     * @event calendar.create.category.before
     * @param {Object} data - Données de l'évènement.
     * @param {Object} data.calendarEvent - L'évènement du calendrier.
     * @returns {Object} L'objet modifié.
     */
    this.listen('calendar.create.category.before', (data) => {
      let { calendarEvent } = data;

      if (
        (top ?? parent ?? window).$('html').hasClass('mwsp') &&
        (!calendarEvent.categories || !calendarEvent.categories.length)
      ) {
        calendarEvent.categories = [`ws#${this.load('current_wsp')}`];
        calendarEvent.calendar_blocked = 'true';

        this.getData(calendarEvent.id).hasCategories = true;

        // Tenter le bon affichage de la catégorie
        setTimeout(() => {
          if ($('#event-add-member').length === 0) return;

          if ($('#event-add-member').css('display') === 'none') {
            console.log('[EVENT]La catégorie na pas été chargé correctement !');
            $('#event-category-icon').parent().parent().css('display', '');
            $('#event-add-member').css('display', '');
          }
        }, 1000);
      } else if (
        (top ?? parent ?? window).$('html').hasClass('mwsp') &&
        calendarEvent.uid
      )
        this.editMode = true;

      return { calendarEvent };
    });

    //Si on passe par le bouton "créer" de l'espace de travail
    if (this.workspace.users && this.workspace.users.any()) {
      /**
       * Écoute l'évènement de création d'invités avant l'ajout pour ajouter les utilisateurs de l'espace de travail.
       * @event calendar.create.guests.before
       * @param {Object} data - Données de l'évènement.
       * @param {Object} data.calendarEvent - L'évènement du calendrier.
       * @param {Function} data.Guest - Constructeur Guest.
       * @returns {Object} L'objet modifié.
       */
      this.listen('calendar.create.guests.before', (data) => {
        let { calendarEvent, Guest } = data;

        if (
          (top ?? parent ?? window).$('html').hasClass('mwsp') &&
          this.workspace.users
        ) {
          calendarEvent.attendees ??= [];
          calendarEvent.attendees.push(
            ...MelEnumerable.from(this.workspace.users.generator()).select(
              (x) =>
                this.#_update(
                  new Guest(x.name, x.email).toAttendee(
                    x.email === this.get_env('current_user').email
                      ? 'ORGANIZER'
                      : 'REQ-PARTICIPANT',
                  ),
                ),
            ),
          );

          if (calendarEvent.attendees.length > 1) {
            this.getData(calendarEvent.id).hasAttendees = true;
          }
        }

        return { calendarEvent };
      });
    } else {
      //Si on ne passe pas par le bouton "créer" de l'espace de travail, mais par l'agenda
      //Lorsque la vue de la création d'un évènement de l'agenda est chargé, on ajoute les utilisateurs de l'espace de travail dans la liste des participants
      /**
       * Écoute le chargement de la vue de création d'évènement pour ajouter les utilisateurs de l'espace de travail.
       * @event calendar.view.loaded
       */
      this.listen('calendar.view.loaded', () => {
        if (this.editMode) {
          this.editMode = false;
          return;
        }

        if (this.isInWorkspace()) {
          this.elementLoaded = true;
          this.rcmail().command('calendar-workspace-add-all');
          this.getData(cal.selected_event.id).hasAttendees = true;
        }
      });

      /**
       * Écoute l'évènement après l'ajout de tous les membres de l'espace de travail.
       * @event calendar-workspace-add-all-after
       */
      this.listen('calendar-workspace-add-all-after', () => {
        if (this.editMode) {
          this.editMode = false;
          return;
        }

        if (this.isInWorkspace() && this.elementLoaded) {
          this.elementLoaded = false;
          document.getElementById('edit-title').focus();
        }
      });
    }

    /**
     * Vérifie la cohérence des données avant l'envoi de la sauvegarde d'un évènement.
     * @event calendar.save_event.before_send
     * @param {Object} args - Arguments de l'évènement.
     * @param {Object} args.calEvent - L'évènement du calendrier.
     * @param {Object} args.data - Les données à sauvegarder.
     * @returns {Object|undefined} Les arguments éventuellement modifiés.
     */
    this.listen('calendar.save_event.before_send', (args) => {
      const { calEvent: calendarEvent } = args;
      let { data } = args;

      let hasModifications = false;

      //On vérifie si il y a des problèmes avec les participants
      if (
        this.getData(calendarEvent.id).hasAttendees &&
        (!data.attendees || data.attendees.length === 0)
      ) {
        console.log(
          "[EVENT]Les participants n'ont pas été sauvegardés correctement !",
        );
        hasModifications = true;
        data.attendees ??= [];
        let waitingAttendee = {
          name: EMPTY_STRING,
          email: EMPTY_STRING,
          role: 'REQ-PARTICIPANT',
        };

        for (const attendee of $('.mel-attendee')) {
          waitingAttendee.email = attendee.getAttribute('data-email');
          waitingAttendee.name =
            attendee.getAttribute('data-name') || EMPTY_STRING;
          waitingAttendee.role =
            attendee.getAttribute('data-hiddenrole') || 'REQ-PARTICIPANT';

          data.attendees.push(waitingAttendee);
          waitingAttendee = {};
        }
      }

      // On vérifie si il y a des problèmes avec la catégorie
      if (
        this.getData(calendarEvent.id).hasCategories &&
        (!data.categories || data.categories === EMPTY_STRING)
      ) {
        console.log("[EVENT]La catégorie n'a pas été chargé correctement !");
        hasModifications = true;
        data.categories = `ws#${this.load('current_wsp')}`;
      }

      this.clearData(calendarEvent.id);

      if (hasModifications) {
        args.data = data;
        return args;
      }
    });
  }

  /**
   * Met à jour un invité en lui ajoutant la propriété "internal" si c'est l'organisateur.
   * @param {{name: string, email: string, role: string, internal?:?boolean}} guest - L'invité à mettre à jour.
   * @returns {{name: string, email: string, role: string, internal?:?boolean}} L'invité mis à jour.
   * @private
   */
  #_update(guest) {
    if (guest.role === 'ORGANIZER') guest.internal = true;

    return guest;
  }

  /**
   * Instancie et démarre la gestion des ajouts d'agenda pour les espaces de travail.
   * @static
   * @returns {CalendarAddition} Nouvelle instance de CalendarAddition.
   */
  static Start() {
    return new CalendarAddition();
  }
}

CalendarAddition.Start();
