import { HTMLBnumSelect } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object.js';

/**
 * Nom de l'événement déclenchant l'initialisation et la génération du sélecteur.
 * @type {string}
 */
const INIT_LISTENER_SELECT = 'mel_metapage.calendar.init.generateSelect';
const SELECT_ID = 'calendarOptionSelect';
const SELECT_CLASS = 'calendar';

export class ModuleInitSelect extends ABaseMelObject {
  constructor() {
    super();
    this.#_setup();
  }

  #_setup() {
    this.listen(INIT_LISTENER_SELECT, (a) => this.#_initSelectHandler(a));
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
      .attr('id', SELECT_ID)
      .addClass(SELECT_CLASS);

    return args;
  }
}
