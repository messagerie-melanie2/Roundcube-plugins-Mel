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
}
