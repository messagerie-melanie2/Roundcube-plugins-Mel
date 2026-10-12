import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';

/**
 * Évènement Roundcube déclenché par le bouton « Visio » du menu « Créer ».
 * @type {string}
 */
const START_EVENT = 'visio.index.start';

/**
 * Code exécuté au clic sur le bouton « Visio » du menu « Créer ».
 * mel_metapage l'injecte dans un `onclick` inline : une méthode privée n'y est
 * pas accessible, d'où le passage par l'évènement {@link START_EVENT}.
 * Ferme la popup « Créer », comme l'action d'origine.
 * @type {string}
 */
const START_ACTION = `(window?.create_popUp?.close?.(), rcmail.triggerEvent('${START_EVENT}'))`;

/**
 * Protocoles autorisés pour l'url de la plateforme visio.
 * @type {string[]}
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Point d'entrée du plugin visio sur la page d'accueil de la tâche bnum.
 *
 * Remplace l'action « Visio » du menu « Créer » de mel_metapage : le libellé
 * est traduit par le plugin et le clic ouvre la plateforme visio
 * (`rcmail.env.visio_gouv_base_url`) dans un nouvel onglet.
 *
 * @extends {ABaseMelObject}
 */
export class VisioIndex extends ABaseMelObject {
  /**
   * Instancie le point d'entrée et s'abonne aux évènements Roundcube.
   */
  constructor() {
    super();

    this.#_registerListeners();
  }

  /**
   * Abonne l'instance à la construction du menu « Créer »
   * (`mel_metapage.create.actions`) et au clic sur son bouton « Visio »
   * ({@link START_EVENT}).
   *
   * @private
   */
  #_registerListeners() {
    this.listen('mel_metapage.create.actions', (args) => {
      const { actions } = args;

      if (!actions.visio) return args;

      actions.visio.text = this.getLocalization('a_visio', { plugin: 'visio' });
      actions.visio.action = START_ACTION;

      args.actions = actions;
      return args;
    }).listen(START_EVENT, () => this.#_startVisio());
  }

  /**
   * Ouvre la plateforme visio (`visio_gouv_base_url`) dans un nouvel onglet.
   * Ne fait rien si l'url est absente ou n'utilise pas un protocole autorisé.
   *
   * @private
   */
  #_startVisio() {
    const base_url = this.get_env('visio_gouv_base_url');

    if (!this.#_isAllowedUrl(base_url)) return;

    window.open(base_url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Indique si une url peut être ouverte : absolue et en http(s).
   *
   * @param {?string} url - Url à vérifier
   * @returns {boolean} `true` si l'url est absolue et utilise un protocole autorisé
   * @private
   */
  #_isAllowedUrl(url) {
    try {
      return ALLOWED_PROTOCOLS.includes(new URL(url).protocol);
    } catch {
      // Url absente, relative ou malformée : refusée.
      return false;
    }
  }
}

new VisioIndex();
