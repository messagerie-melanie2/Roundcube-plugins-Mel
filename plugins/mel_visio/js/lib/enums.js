export { eLocks, ePage };

/**
 * Enumerations utilisés par la visio
 * @module Visio/Enums
 */

/**
 * Liste des locks disponibles
 * @enum {number}
 */
const eLocks = {
  /**
   * Lock la clé de la visio
   */
  room: 0,
  /**
   * Lock l'espace lié
   */
  mode: 1,
  /**
   * Lock le mot de passe
   */
  password: 2,
};

/**
 * Liste des pages disponibles
 * @enum {string}
 */
const ePage = {
  /**
   * Page de génération de la visio
   */
  home: 'home',
  /**
   * Page de la visio
   */
  visio: 'visio',
};
