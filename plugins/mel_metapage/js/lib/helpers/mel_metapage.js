import { BnumLog } from '../classes/bnum_log';

/**
 * Classe utilitaire d'accès au singleton global `mel_metapage`.
 *
 * Cette classe ne peut pas être instanciée. Elle sert de point d'accès
 * centralisé à l'objet `window.mel_metapage` et journalise une erreur
 * si cet objet est introuvable.
 *
 * @static
 */
export class MelMetapage {
  /**
   * Retourne l'instance globale de `mel_metapage` exposée sur `window`.
   *
   * Si `window.mel_metapage` est indéfini ou absent, une erreur est
   * journalisée et `undefined` est retourné.
   *
   * @readonly
   * @static
   * @example
   * const metapage = MelMetapage.Instance;
   * metapage.some_method();
   */
  static get Instance() {
    if (!window.mel_metapage)
      BnumLog.error(
        'MelMetapage/Instance',
        'Impossible de trouver mel_metapage !',
        window.mel_metapage,
        window,
      );
    return window.mel_metapage;
  }

  /**
   * @throws {Error} Toujours — cette classe ne peut pas être instanciée.
   */
  constructor() {
    throw new Error('Vous ne pouvez pas instancier cette classe !');
  }
}
