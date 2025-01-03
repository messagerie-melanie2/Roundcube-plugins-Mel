import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';

export { MelVideo, MelVideoManager, generate_canvas };

/**
 * @typedef Size
 * @property {number} height
 * @property {number} width
 */

/**
 * @callback OnClickCallback
 * @param {Event} clickedEvent
 * @param {MediaDeviceInfo} device
 * @param {Size} size
 * @return {void}
 */

/**
 * @callback OnBeforeCallback
 * @param {MelVideo} caller
 * @return {Promise<void>}
 * @async
 */

/**
 * @class
 * @classdesc Représentation et affichage d'une caméra
 */
class MelVideo {
  /**
   * Initialise et assigne les variables membres
   * @param {MediaDeviceInfo} device Element qui sera affiché et gérer
   * @param {external:jQuery} $main Element parent
   * @param {number} [width=300] Largeur
   * @param {number} [height=200] Hauteur
   */
  constructor(device, $main, width = 300, height = 200) {
    /**
     * Informations du device qui doit être affiché
     * @type {MediaDeviceInfo}
     */
    this.device = device;
    /**
     * Element html qui affiche la vidéo
     * @type {HTMLVideoElement}
     */
    this.video = null;
    /**
     * Element parent
     * @type {external:jQuery}
     */
    this.$parent = $main;
    /**
     * Si la vidéo à démaré ou non
     * @type {boolean}
     */
    this.started = false;
    /**
     * Liste des devices
     * @type {MediaDeviceInfo[]}
     * @package
     */
    this._all_devices = null;
    /**
     * Taille de l'élément
     * @type {Size}
     * @readonly
     */
    this.size = {
      width,
      height,
    };

    /**
     * Est appelé lorsque l'on clicuqe sur la vidéo
     * @type {BnumEvent<OnClickCallback>}
     * @event
     */
    this.onclick = new BnumEvent();
    /**
     * Liste de callback appelé avant la création de l'élément
     * @type {BnumEvent<OnBeforeCallback>}
     * @event
     */
    this.onbeforecreate = new BnumEvent();
    this.oncreate = new BnumEvent();
    this.ondispose = new BnumEvent();
  }

  /**
   *
   * @param {*} devices
   * @fires MelVideo.onbeforecreate | MelVideo.onclick
   * @returns {Promise<MelVideo>}
   * @async
   */
  async create(devices = null) {
    if (!this.video) {
      if (!this._all_devices)
        this._all_devices =
          devices || (await navigator.mediaDevices.enumerateDevices());

      await this.onbeforecreate.asyncCall(this);

      for (const d of this._all_devices) {
        if (d.kind === this.device.kind && d.label === this.device.label) {
          this.video = $('<video autoplay></video>')
            .click((event) => {
              this.onclick.call(event, d, this.size);
            })
            .css('width', `${this.size.width}px`)
            .css('height', `${this.size.height}px`)
            .appendTo(this.$parent)[0];
          this.video.srcObject = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: d.deviceId,
            },
          });

          await this.oncreate.asyncCall(this.video, d);

          this.started = true;
          break;
        }
      }
    }

    return this;
  }

  updateSize(w, h) {
    $(this.video).css('width', `${w}px`).css('height', `${h}px`);
    this.size.width = w;
    this.size.height = h;

    return this;
  }

  updateSizePerfect(w, h) {
    $(this.video).css('width', w).css('height', h);

    return this;
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;

      if (this.video) {
        const tracks = this.video.srcObject.getTracks();

        for (const iterator of tracks) {
          iterator.stop();
        }

        $(this.video).remove();
      }

      this.video = null;
      this.device = null;
      this.$parent = null;
      this.started = false;
      this._all_devices = null;
      this.size = null;
      this.onclick = null;
      this.onbeforecreate = null;
      this.oncreate = null;
      this.ondispose = null;
    }
  }
}

class MelVideoManager {
  constructor() {
    this._devices = null;
    this._videos = {};
    this._size = 0;
  }

  /**
   *
   * @param {*} $main
   * @param {MediaDeviceInfo} device
   */
  async addVideo($main, device, create = true, devices = null) {
    if (!this._devices)
      this._devices =
        devices || (await navigator.mediaDevices.enumerateDevices());

    this._videos[device.deviceId] = new MelVideo(device, $main);

    if (create) await this._videos[device.deviceId].create(this._devices);

    ++this._size;

    return this;
  }

  async create() {
    await Promise.allSettled(
      Enumerable.from(this._videos)
        .select((x) => x.value.create(this._devices))
        .toArray(),
    );
    return this;
  }

  updateSize(w, h) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].updateSize(w, h);
      }
    }

    return this;
  }

  updateSizePerfect(w, h) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].updateSizePerfect(w, h);
      }
    }

    return this;
  }

  oncreate(callback) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].oncreate.push(callback);
      }
    }

    return this;
  }

  click(callback) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].onclick.push(callback);
      }
    }
  }

  count() {
    return this._size;
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;

      this._devices = null;

      for (const key in this._videos) {
        if (Object.hasOwnProperty.call(this._videos, key)) {
          this._videos[key].dispose();
        }
      }

      this._videos = null;
    }
  }
}

/**
 *
 * @param {*} $main
 * @param {MediaDeviceInfo[]} devices
 */
async function generate_canvas($main, devices) {
  for (const d of devices) {
    if (d.kind === 'videoinput') {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: d.deviceId,
          },
        })
        .then((stream) => {
          $('<video autoplay></video>')
            .css('width', '300px')
            .css('height', '200px')
            .appendTo($main)[0].srcObject = stream;
        });
    }
  }
}
