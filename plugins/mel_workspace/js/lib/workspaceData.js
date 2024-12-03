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
 * @property {?ServiceChannel} channel
 * @property {?Array<string>} survey
 * @property {?string} tasks
 * @property {?ServiceTchapChannel} tchap-channel
 * @property {?Object} useful-links
 * @property {?ServiceTchapChannel} wekan
 */

export class WorkspaceData {
  constructor(item) {
    this._init()._setup(item);
  }

  _init() {
    this.uid = null;
    this.title = null;
    this.description = null;
    this.hashtag = null;
    this.logo = null;
    this.users = null;
    this.isPublic = null;
    this.modified = null;
    this.color = null;
    this.isAdmin = null;
    this.isJoin = null;
    this.isAdminAlone = null;
    /**
     * @type {WorkspaceDataService}
     */
    this.services = null;

    return this;
  }

  _setup(item) {
    for (const element of Object.keys(item)) {
      this[element] = item[element];
    }

    this.isPublic = this.isPublic === 1;
    this.modified = moment(this.modified);

    this.users = this.users || null;

    return this;
  }

  hasService(service) {
    return !!this.services[service];
  }

  /**
   * @yields {{key:string, value:boolean | Object}}
   * @param {*} param0
   */
  *iterateOverServices({ boolean = false } = {}) {
    for (const key of Object.keys(this.services)) {
      yield { key, value: boolean ? !!this.services[key] : this.services[key] };
    }
  }
}
