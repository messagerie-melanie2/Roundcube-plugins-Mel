import { HTMLBnumSelect } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum';
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
    this.#_addListener();
  }

  /**
   * Ajoute les écouteurs d'événements internes à la classe.
   * @private
   */
  #_addListener() {
    this.listen(INIT_LISTENER_SELECT, (args) => this.#_initSelectHandler(args));
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
