import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';

var VisioWebconfLinkClass = null;
if (typeof WebconfLink !== 'undefined') {
  class VisioWebconfLink extends WebconfLink {
    #_url;
    #_roomName;
    #_phone;

    get url() {
      return this.#_url;
    }

    get roomName() {
      return this.#_roomName;
    }

    get phone() {
      return this.#_phone;
    }

    constructor(url) {
      super(url);

      const { url: visioUrl, roomName, phone } = this.#_getRoomData(url);

      this.#_url = visioUrl;
      this.#_roomName = roomName;
      this.#_phone = phone || false;
    }

    havePhoneData() {
      return this.phone;
    }

    /**
     *
     * @param {string} url
     * @returns {{url:string, full:string, roomName: string, phone?:{number:string, pin:string}}}
     */
    #_getRoomData(url) {
      const splitter = url.includes(' (') ? ' (' : '(';
      const [visioUrl, phoneData] = url.split(splitter);
      const roomName = visioUrl.replaceAll('//', EMPTY_STRING).split('/')[1];

      const returnData = { url: visioUrl, full: url, roomName };

      if (phoneData) {
        const [number, pin] = phoneData
          .trim()
          .replaceAll(')', EMPTY_STRING)
          .replaceAll('#', EMPTY_STRING)
          .split('|');

        returnData.phone = { number, pin };
      }

      return returnData;
    }

    /**
     *
     * @param {string?} url
     * @returns {bool} Si c'est l'url de Visio ou non
     */
    static IsVisioUrl(url) {
      if (!url) return false;

      const baseUrl = this.VisioUrl;

      if (!baseUrl) return false;

      return url.includes(baseUrl);
    }

    /**
     * @type {?string}
     */
    static get VisioUrl() {
      return MelObject.Empty().get_env('visio_gouv_base_url');
    }
  }

  VisioWebconfLinkClass = VisioWebconfLink;
}

export const VisioWebconfLink = VisioWebconfLinkClass;
