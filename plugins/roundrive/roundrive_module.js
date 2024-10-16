export class Roundrive {
  #folder = null;
  #folders = [];
  #files = [];

  constructor(folder) {
    this._init()._setup(folder);
  }

  _init() {
    this.#folder = null;

    return this;
  }

  _setup(folder) {
    this.#folder = folder;
  }

  /**
   * @type {AsyncGenerator<RoundriveFolder | RoundriveFile}
   */
  async *gload() {
    const busy = rcmail.set_busy(true, 'loading');

    let data = null;
    await rcmail
      .http_get(
        'roundrive/folder_list_all_items',
        {
          _folder: this.#folder,
        },
        busy,
      )
      .done((e) => {
        data = e;
      })
      .fail((...args) => {
        let error = new Error('Error on loading data');
        error.args = args;

        throw error;
      });

    if (data) {
      let element;
      for (element of data) {
        if (element.type === 'dir') element = new RoundriveFolder(element);
        else element = new RoundriveFile(element);

        yield element;

        if (element.data.type === Roundrive.EItemType.directory)
          this.#folders.push(element);
        else this.#files.push(element);
      }

      element = null;
    }
  }

  async load() {
    await rcmail
      .http_get('roundrive/folder_list_all_items', {
        _folder: this.#folder,
      })
      .done((e) => {
        for (const element of e) {
          if (element.type === 'dir')
            this.#folders.push(new RoundriveFolder(element));
          else this.#files.push(new RoundriveFile(element));
        }
      })
      .fail((...args) => {
        let error = new Error('Error on loading data');
        error.args = args;

        throw error;
      });
  }

  get files() {
    return this.#files;
  }

  get folders() {
    return this.#folders;
  }

  get mainFolder() {
    return this.#folder;
  }

  /**
   * @yield {RoundriveFolder | RoundriveFile}
   */
  *[Symbol.iterator]() {
    yield* this.folders;
    yield* this.files;
  }
}

/**
 * @enum
 */
Roundrive.EItemType = {
  directory: Symbol(),
  file: Symbol(),
};

class DirData {
  #data = null;
  #itemName = null;
  constructor(data) {
    this.#data = data;
    this.#itemName = new EncodedItemName(data);
  }

  /**
   * @protected
   */
  get _p_data() {
    return this.#data;
  }

  /**
   * @type {EncodedItemName}
   */
  get name() {
    return this.#itemName;
  }

  /**
   * @type {string}
   */
  get etag() {
    return this.#data.etag;
  }

  /**
   * @type {external:moment}
   */
  get modifiedAt() {
    return moment(this.#data.modifiedAt);
  }

  /**
   * @type {Roundrive.EItemType}
   */
  get type() {
    return this.#data.type === 'dir'
      ? Roundrive.EItemType.directory
      : Roundrive.EItemType.file;
  }

  /**
   *
   * @param {*} data
   * @returns {DirData | FileData}
   */
  static From(data) {
    return data.type === 'dir' ? new DirData(data) : new FileData(data);
  }
}

class FileData extends DirData {
  constructor(data) {
    super(data);
  }

  /**
   * @type {string}
   */
  get mimetype() {
    return this._p_data.mimetype;
  }

  /**
   * @type {string}
   */
  get size() {
    return this._p_data.size;
  }

  /**
   * @type {string}
   */
  get extension() {
    return this._p_data.extension;
  }
}

class ItemName {
  #base = null;
  #ext = null;
  #path = null;
  constructor(data) {
    this.#base = data.filename;
    this.#ext = data.extension;
    this.#path = data.path;
  }

  /**
   * @type {string}
   */
  get filename() {
    return this.#base;
  }

  /**
   * @type {string}
   */
  get fullname() {
    if (this.#ext) return `${this.filename}.${this.#ext}`;
    else return this.filename;
  }

  /**
   * @type {string}
   */
  get path() {
    return this.#path;
  }
}

class EncodedItemName extends ItemName {
  #decoded = null;
  #ext = null;
  constructor(data) {
    super(data);

    this.#ext = data.extension;
  }

  /**
   * @type {DecodedItemName}
   */
  get decoded() {
    if (!this.#decoded) {
      const tmp = {
        filename: decodeURIComponent(this.filename),
        extension: !this.#ext ? null : decodeURIComponent(this.#ext),
        path: decodeURIComponent(this.path),
      };

      this.#decoded = new DecodedItemName(tmp);
    }

    return this.#decoded;
  }
}

class DecodedItemName extends ItemName {
  constructor(data) {
    super(data);
  }
}

export class RoundriveFolder extends Roundrive {
  #data = null;
  constructor(data) {
    super(data.path);
    this.#data = DirData.From(data);
  }

  /**
   * @type {DirData}
   */
  get data() {
    return this.#data;
  }
}

export class RoundriveFile {
  #data = null;
  constructor(data) {
    this.#data = DirData.From(data);
  }

  /**@type {FileData} */
  get data() {
    return this.#data;
  }
}
