import {
  ButtonVariation,
  HTMLBnumSecondaryButton,
  HTMLBnumSelect,
} from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';

/**
 * @typedef {Object} InitSelectArgs
 * @property {any} select - L'élément ou l'instance du sélecteur HTML (généré dynamiquement).
 * @property {GroupOptionsObject} optgroups - Les groupes d'options à insérer dans le sélecteur.
 */

/**
 * @typedef {Object} GroupOptionsObject
 * @property {string} selectGroupDay - Options pour l'affichage par jour.
 * @property {string} selectGroupWeek - Options pour l'affichage par semaine.
 * @property {string} selectGroupMonth - Options pour l'affichage par mois.
 * @property {string} selectGroupList - Options pour l'affichage sous forme de liste.
 */

/**
 * Nom de l'événement déclenchant l'initialisation et la génération du sélecteur.
 * @type {string}
 */
const INIT_LISTENER_SELECT = 'mel_metapage.calendar.init.generateSelect';

/**
 * Classe responsable de l'initialisation du module de sélection du calendrier.
 * @extends ABaseMelObject
 */
export class ModuleInit extends ABaseMelObject {
  /**
   * Crée une instance de ModuleInit et configure les écouteurs d'événements.
   */
  constructor() {
    super();
    this.#_init().#_addListener();
  }

  async onDocumentReady() {
    await this.wait_something(() =>
      document.querySelector('#calendar > .fc-toolbar > .fc-right'),
    );
    this.#_initRightButtons();
  }

  #_init() {
    return this.#_initAgendaCheckBoxColor().#_initNewEventButton();
  }

  #_initAgendaCheckBoxColor() {
    if (!CSS.supports('x: attr(x type(*))')) {
      /**
       * @type {NodeListOf<HTMLElement>}
       */
      const calendars = document.querySelectorAll(
        '#calendarslist [data-color]',
      );

      for (const calendar of calendars) {
        calendar.style.setProperty(
          '--agenda-color',
          calendar.getAttribute('data-color'),
        );
      }
    }

    return this;
  }

  #_initNewEventButton() {
    const element = document.getElementById('create-event-button');

    if (element) {
      element.addEventListener(
        'click',
        this.execCommand.bind(this, 'addevent'),
      );

      this.listen('enable-command', function (args) {
        const { command, status } = args;

        if (command === 'addevent') {
          const nodeElement = document.getElementById('create-event-button');

          if (nodeElement) {
            switch (status) {
              case true:
                nodeElement.removeAttribute('disabled');
                break;

              default:
                nodeElement.setAttribute('disabled', 'disabled');
                break;
            }
          }
        }
      });
    }

    return this;
  }

  #_initRightButtons() {
    const group = document.createElement('div');
    group.setAttributeNS('bnum-agenda', 'id', 'ba-group');
    group.classList.add('group-button');

    const prev = this.#_createRButton('.fc-prev-button', {
      icon: 'chevron_left',
    });
    const today = this.#_createRButton('.fc-today-button', {
      text:
        document.querySelector('.fc-today-button')?.textContent ??
        this.getLocalization('today', { plugin: 'calendar' }),
    });
    const next = this.#_createRButton('.fc-next-button', {
      icon: 'chevron_right',
    });

    group.append(prev, today, next);

    const r = document.querySelector('#calendar > .fc-toolbar > .fc-right');

    if (!r) throw new Error('Impossible de trouver le header !');

    r.appendChild(group);

    return this;
  }

  /**
   *
   * @param {string} originalSelector
   * @param {Object} [options={}]
   * @param {?string} [options.text=null]
   * @param {?string} [options.icon=null]
   * @return {HTMLBnumSecondaryButton}
   */
  #_createRButton(originalSelector, { text = null, icon = null } = {}) {
    if (!text && !icon)
      throw new Error('Un text ou une icône doivent être défini !');
    if (text && icon)
      throw new Error(
        'Un text ou une icône doivent être défini, pas les deux en même temps !',
      );

    const node = text
      ? HTMLBnumSecondaryButton.Create({ text, rounded: false })
      : HTMLBnumSecondaryButton.CreateOnlyIcon(icon, {
          variation: ButtonVariation.SECONDARY,
          rounded: true,
        });

    node.addClass('navigation-button').addEventListener(
      'click',
      function (selector) {
        const elementToClick = document.querySelector(selector);

        if (elementToClick) elementToClick.click();
        else throw new Error(`Ìmpossible de clicker sur ${selector}`);
      }.bind(this, originalSelector),
    );

    return node;
  }

  /**
   * Ajoute les écouteurs d'événements internes à la classe.
   * @private
   */
  #_addListener() {
    this.listen(INIT_LISTENER_SELECT, (args) => this.#_initSelectHandler(args));
    return this;
  }

  /**
   * Gestionnaire d'événement pour initialiser le composant de sélection HTML.
   * Construit le sélecteur graphique à partir des groupes d'options fournis.
   *
   * @private
   * @param {InitSelectArgs} args - Les arguments passés par l'événement.
   * @returns {InitSelectArgs} Les arguments modifiés contenant le sélecteur généré.
   */
  #_initSelectHandler(args) {
    const { optgroups } = args;

    // Génération du sélecteur HTMLBnumSelect avec les options extraites
    args.select = HTMLBnumSelect.Create({ options: Object.values(optgroups) })
      .attr('id', 'calendarOptionSelect')
      .addClass('calendar');

    return args;
  }
}
