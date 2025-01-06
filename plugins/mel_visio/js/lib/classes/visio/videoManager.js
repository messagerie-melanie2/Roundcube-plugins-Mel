import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';

export { MelVideo, MelVideoManager, generate_canvas };

/**
 * Contient les classes utiles à la visualisation des vidéos
 * @module Visio/Video
 * @local Size
 * @local OnClickCallback
 * @local OnBeforeCallback
 * @local OnCreateCallback
 * @local OnDisposeCallback
 * @local MelVideo
 * @local MelVideoManager
 * @local generate_canvas
 */

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
 * @callback OnCreateCallback
 * @param {HTMLVideoElement} video
 * @param {MediaDeviceInfo} media
 * @return {Promise<void>}
 * @async
 */

/**
 * @callback OnDisposeCallback
 * @param {MelVideo} caller
 * @return {void}
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
     * @frommodule Visio/Video {@linkto OnClickCallback}
     */
    this.onclick = new BnumEvent();
    /**
     * Liste de callback appelé avant la création de l'élément
     * @type {BnumEvent<OnBeforeCallback>}
     * @event
     * @frommodule Visio/Video {@linkto OnBeforeCallback}
     */
    this.onbeforecreate = new BnumEvent();
    /**
     * Liste de callback appelé après la création de l'élément
     * @type {BnumEvent<OnCreateCallback>}
     * @event
     * @frommodule Visio/Video {@linkto OnCreateCallback}
     */
    this.oncreate = new BnumEvent();
    /**
     * Liste de callback appelé lorsque l'on libère les élément
     * @type {BnumEvent<OnDisposeCallback>}
     * @event
     * @frommodule Visio/Video {@linkto OnDisposeCallback}
     */
    this.ondispose = new BnumEvent();
  }

  /**
   * Créer un élément vidéo qui affiche un retour caméra lié au device associé
   * @param {?MediaDeviceInfo[]} [devices=null]
   * @fires MelVideo.onbeforecreate | MelVideo.onclick
   * @returns {Promise<MelVideo>}
   * @async
   * @frommodulereturn Visio/Video {@linkto MelVideo}
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

  /**
   * Met à jour la taille de la vidéo
   * @param {number} w longueur
   * @param {number} h hauteur
   * @returns {MelVideo} Chaînage
   */
  updateSize(w, h) {
    $(this.video).css('width', `${w}px`).css('height', `${h}px`);
    this.size.width = w;
    this.size.height = h;

    return this;
  }

  /**
   * Met à jour la taille de la vidéo sans la mettre en mémoire
   * @param {number} w longueur
   * @param {number} h hauteur
   * @returns {MelVideo} Chaînage
   */
  updateSizePerfect(w, h) {
    $(this.video).css('width', w).css('height', h);

    return this;
  }

  /**
   * Libère les données en mémoire
   * @fires MelVideo.ondispose
   */
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

      this.ondispose.call(this);

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

/**
 * @class
 * @classdesc Gère les différentes vidéos
 */
class MelVideoManager {
  /**
   * Initialise et assigne les variables membres
   */
  constructor() {
    /**
     * Liste des devices
     * @package
     * @type {?MediaDeviceInfo[]}
     */
    this._devices = null;
    /**
     * Liste des vidéos
     * @type {Object<string, MelVideo>}
     * @package
     * @frommodule Visio/Video {@linkto MelVideo}
     */
    this._videos = {};
    /**
     * Nombre de vidéos
     * @type {number}
     * @private
     */
    this._size = 0;
  }

  /**
   * Ajoute un device et l'affiche
   * @param {external:jQuery} $main DIV Parente
   * @param {MediaDeviceInfo} device Caméra à afficher
   * @param {boolean} [create=true] Si on affiche le retour vidéo ou non
   * @param {?MediaDeviceInfo[]} [devices=null] Device déjà chargés
   * @return {Promise<MelVideoManager>}
   * @async
   * @frommodulereturn Visio/Video {@linkto MelVideoManager}
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

  /**
   * Affiche les différentes caméras
   * @return {Promise<MelVideoManager>}
   * @async
   * @frommodulereturn Visio/Video {@linkto MelVideoManager}
   */
  async create() {
    await Promise.allSettled(
      MelEnumerable.from(this._videos)
        .select((x) => x.value.create(this._devices))
        .toArray(),
    );
    return this;
  }

  /**
   * Met à jour la taille des images
   * @param {number} w Longueur
   * @param {number} h Hauteur
   * @returns {MelVideoManager}
   */
  updateSize(w, h) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].updateSize(w, h);
      }
    }

    return this;
  }

  /**
   * Met à jour la taille des images sans les sauvegarder en mémoire
   * @param {number} w Longueur
   * @param {number} h Hauteur
   * @returns {MelVideoManager}
   */
  updateSizePerfect(w, h) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].updateSizePerfect(w, h);
      }
    }

    return this;
  }

  /**
   * Ajoute un callback lors de la création à toute les vidéos
   * @param {OnCreateCallback} callback
   */
  oncreate(callback) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].oncreate.push(callback);
      }
    }

    return this;
  }

  /**
   * Ajoute un callback lors du click à toute les vidéos
   * @param {OnClickCallback} callback
   */
  click(callback) {
    for (const key in this._videos) {
      if (Object.hasOwnProperty.call(this._videos, key)) {
        this._videos[key].onclick.push(callback);
      }
    }
  }

  /**
   * Nombre de vidéos
   * @returns {number}
   */
  count() {
    return this._size;
  }

  /**
   * Libère les données en mémoire
   */
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
 * Génère le canvas qui affiche les vidéos
 * @param {external:jQuery} $main DIV Parente
 * @param {MediaDeviceInfo[]} devices Devices
 * @return {Promise<void>}
 * @async
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
