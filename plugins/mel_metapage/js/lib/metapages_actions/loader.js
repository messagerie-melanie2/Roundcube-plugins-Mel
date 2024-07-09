import { EMPTY_STRING } from '../constants/constants.js';
import { MelObject } from '../mel_object.js';

export { DataLoader };

class WorkerData {
  constructor(
    url,
    storage_key,
    { data = {}, type = 'POST', add_date = false },
  ) {
    this._init()._setup(url, storage_key, data, type, add_date);
  }

  _init() {
    this.url = EMPTY_STRING;
    this.data = {};
    this.type = EMPTY_STRING;
    this.storage_key = EMPTY_STRING;
    this.add_date = false;

    return this;
  }

  _setup(url, storage_key, data, type, add_date) {
    this.url = url;
    this.data = data;
    this.type = type;
    this.storage_key = storage_key;
    this.add_date = add_date;
  }
}

class _DataLoader extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._worker = null;
    this._actions = {};

    if (window.Worker) {
      this._worker = new Worker('data_worker.js');
    }

    const rcmail_refresh = rcmail.refresh;

    rcmail.refresh = (...args) => {
      this.refresh();
      rcmail_refresh.call(rcmail, ...args);
    };
  }

  refresh() {
    const has_worker = !!window.Worker;
    let element;
    for (const key of Object.keys(this._actions)) {
      element = this._actions[key];

      if (has_worker) this._worker.postMessage(element.data);
      else element.callback();
    }
  }

  has_worker() {
    return !!this._worker;
  }

  add_loader(key, worker_data, callback_if_worker_not_enabled) {
    this._actions[key] = {
      data: worker_data,
      callback: callback_if_worker_not_enabled,
    };

    return this;
  }
}

_DataLoader.WorkerData = WorkerData;
_DataLoader._instance = null;

class DataLoader extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    if (!_DataLoader._instance) _DataLoader._instance = new _DataLoader();

    Object.defineProperty(this, 'Instance', {
      get() {
        if (!_DataLoader._instance) _DataLoader._instance = new _DataLoader();
        return _DataLoader._instance;
      },
    });
  }

  static Get() {
    return new DataLoader();
  }
}
