import ABaseMelObject from '../../../mel_metapage/js/lib/base_mel_object.js';

/**
 * @typedef {Object} RcubeSpyUrlArgs
 * @property {jQuery} $target - L'élément cible de l'événement.
 * @property {Event} e - L'événement intercepté.
 * @property {boolean} [break] - Indique si l'exécution doit être interrompue.
 * @package
 */

/**
 * Classe représentant l'affichage d'un contact.
 * @class
 * @extends ABaseMelObject
 */
export default class ContactShow extends ABaseMelObject {
  /**
   * Constructeur de la classe ContactShow.
   */
  constructor() {
    super();
  }

  /**
   * Méthode principale de la classe.
   * Initialise un écouteur pour intercepter les URL contenant "addressbook" et "show".
   *
   * @returns {ContactShow} L'instance actuelle de la classe.
   */
  main() {
    return this.listen(
      'rcube_spy_url',
      this.#_actionRcubeSpyUrlCallback.bind(this),
    );
  }

  /**
   * Action a exécuter lorsque le trigger `rcube_spy_url` est appelé.
   * @param {RcubeSpyUrlArgs} args
   * @returns {RcubeSpyUrlArgs}
   * @private
   */
  #_actionRcubeSpyUrlCallback(args) {
    const { $target, e } = args;
    const url = $target.attr('href');

    // Prendre en compte seulement les urls vers l'annuaire
    if (url && url.includes('addressbook') && url.includes('show')) {
      e.preventDefault();
      this.switch_url(url);
      args.break = true;
    }

    return args;
  }

  /**
   * Méthode statique pour démarrer l'affichage d'un contact.
   *
   * @returns {ContactShow} Une nouvelle instance de ContactShow initialisée.
   */
  static Start() {
    return new ContactShow().main();
  }
}

// Démarrage automatique de l'affichage d'un contact.
ContactShow.Start();
