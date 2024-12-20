import { WrapperObject } from '../BaseObjects/WrapperObject.js';
import { MelObject } from '../mel_object.js';
import { Mel_Promise } from '../mel_promise.js';

class File {}

class Folder {}

class Nextcloud extends MelObject {
  constructor() {
    super();
  }

  create(name, type, folder) {
    return new Mel_Promise((promise) => {
      promise.start_resolving();
      this.http_internal_post({
        task: 'roundrive',
        action: 'create_file',
        params: {
          _name: name,
          _type: type,
          _folder: folder,
        },
        on_success: (data) => {
          promise.resolve(data);
        },
        on_error: (...args) => {
          promise.reject(args);
        },
      });
    });
  }

  get(file, path) {
    return new Mel_Promise((promise) => {
      promise.start_resolving();
      this.http_internal_post({
        task: 'roundrive',
        action: 'file_api',
        params: {
          method: 'file_get',
          file: `${path}/${file}`,
        },
        on_success: (data) => {
          debugger;
          promise.resolve(data);
        },
        on_error: (...args) => {
          promise.reject(args);
        },
      });
    });
  }
}

export const Drive = new WrapperObject(Nextcloud);
