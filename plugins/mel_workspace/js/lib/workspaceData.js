export { WorkspaceData };

/**
 * Contient les structure de données qui représente un espace
 * @module Workspace/Structures/Data
 * @local WorkspaceDataService
 * @local ServiceChannel
 * @local ServiceTchapChannel
 * @local WorkspaceData
 */

/**
 * @typedef ServiceChannel
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef ServiceTchapChannel
 * @property {string} id
 */

/**
 * @typedef WorkspaceDataService
 * @property {?boolean} annuaire
 * @property {?boolean} calendar
 * @property {ServiceChannel | null} channel
 * @property {?Array<string>} survey
 * @property {?string} tasks
 * @property {ServiceTchapChannel | null} tchap-channel
 * @property {?Object} useful-links
 * @property {ServiceTchapChannel | null} wekan
 */

/**
 * @class
 * @classdesc Contient les données d'un espace
 */
class WorkspaceData {
  /**
   * Initialise la classe
   * @param {Object<string, *>} item Données de l'espace
   */
  constructor(item) {
    this._init()._setup(item);
  }

  /**
   * @private
   * @returns {WorkspaceData}
   */
  _init() {
    /**
     * Id de l'espace
     * @type {string}
     */
    this.uid = null;
    /**
     * Titre de l'espace
     * @type {string}
     */
    this.title = null;
    /**
     * Description de l'espace
     * @type {string}
     */
    this.description = null;
    /**
     * Thématique de l'espace
     * @type {string}
     */
    this.hashtag = null;
    /**
     * Logo de l'espace
     * @type {?string}
     */
    this.logo = null;
    /**
     * Utilisateurs de l'espace
     * @type {Array<Object<string, any>>}
     */
    this.users = null;
    /**
     * Espace public ou non
     * @type {boolean}
     */
    this.isPublic = null;
    /**
     * Date de modification de l'espace
     * @type {external:moment}
     */
    this.modified = null;
    /**
     * Couleur de l'espace
     * @type {string}
     */
    this.color = null;
    /**
     * Si l'utilisateur est admin ou non
     * @type {boolean}
     */
    this.isAdmin = null;
    /**
     * Si l'utilisateur fait parti de l'espace
     * @type {boolean}
     */
    this.isJoin = null;
    /**
     * Si l'utilisateur est le seul admin de l'espace
     * @type {boolean}
     */
    this.isAdminAlone = null;
    /**
     * @type {WorkspaceDataService}
     */
    this.services = null;

    return this;
  }

  /**
   * @private
   * @param {Object} item
   * @returns {WorkspaceData}
   */
  _setup(item) {
    for (const element of Object.keys(item)) {
      this[element] = item[element];
    }

    this.isPublic = this.isPublic === 1;
    this.modified = moment(this.modified);

    this.users = this.users || null;

    return this;
  }

  /**
   * Vérifie si un service existe
   * @param {string} service
   * @returns {boolean}
   */
  hasService(service) {
    return !!this.services[service];
  }

  /**
   * @yields {{key:string, value:boolean | Object}}
   * @param {Object} [options={}]
   * @param {boolean} [options.boolean=false] Si on veut le service, ou que des boolean
   */
  *iterateOverServices({ boolean = false } = {}) {
    for (const key of Object.keys(this.services)) {
      yield { key, value: boolean ? !!this.services[key] : this.services[key] };
    }
  }
}
