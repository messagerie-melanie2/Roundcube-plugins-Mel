/**
 * Liste des différents type de d'onglets
 *
 * /!\ Interne à {@link IndexWorkspaceUI}
 * @enum {string}
 * @package
 */
export const EMode = {
  /**
   * Onglet qui contient les espaces de l'utilisateur
   * @type {string}
   * @constant
   * @default 'subscribed'
   */
  subscribed: 'subscribed',
  /**
   * Onglet qui contient les espaces archivés de l'utilisateur
   * @type {string}
   * @constant
   * @default 'archived'
   */
  archived: 'archived',
  /**
   * Onglet qui contient les espaces publics
   * @type {string}
   * @constant
   * @default 'publics'
   */
  publics: 'publics',
};
