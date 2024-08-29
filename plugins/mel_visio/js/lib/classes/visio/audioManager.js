import { audiourltotest, visualValueCount } from '../../consts.js';

export {
  MelAudioStruct,
  AudioVisualizer,
  MelAudioManager,
  MelAudioTester,
  MelAudioTesterManager,
};

/**
 * Gère la visualisation de l'audio
 */
class AudioVisualizer {
  /**
   * Constructeur de la classe
   * @param {MediaDeviceInfo} device Micro que l'on souhaite écouter
   * @param {MelAudioStruct} audioStruct Données audios
   * @param {AudioContext} audioContext
   * @param {Function} processFrame Action à faire lors d'une frame
   * @param {Function} processError Action à faire lors d'une erreur
   */
  constructor(device, audioStruct, audioContext, processFrame, processError) {
    /**
     * @type {AudioContext}
     */
    this.audioContext = audioContext;
    /**
     * Action à faire lors d'une frame
     * @type {Function}
     */
    this.processFrame = processFrame;
    /**
     * Micro que l'on souhaite écouter
     * @type {MediaDeviceInfo}
     */
    this.linkedDevice = device;
    this.connectStream = this.connectStream.bind(this);

    /**
     * Données de l'audio
     * @type {MelAudioStruct}
     */
    this.audioDatas = audioStruct;
  }

  /**
   * Démarrer la visualisation
   * @param {Array<MediaDeviceInfo> | null} devices
   * @returns {AudioVisualizer} Chaîne
   */
  async start(devices = null) {
    if (!devices) devices = await navigator.mediaDevices.enumerateDevices();

    let id = null;
    for (const iterator of devices) {
      if (
        iterator.kind === this.linkedDevice.kind &&
        iterator.label === this.linkedDevice.label
      ) {
        id = iterator.deviceId;
        break;
      }
    }

    if (id) {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            deviceId: id,
          },
          video: false,
        })
        .then(this.connectStream)
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error('###[start]Device not exist', this.linkedDevice, devices);
    }

    return this;
  }

  connectStream(stream) {
    this.analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.fftSize = 32;

    this.initRenderLoop(this.analyser);
  }

  initRenderLoop() {
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const processFrame = this.processFrame || (() => {});

    const renderFrame = () => {
      this.analyser.getByteFrequencyData(frequencyData);
      processFrame(frequencyData, this.audioDatas.elements);

      requestAnimationFrame(renderFrame);
    };
    requestAnimationFrame(renderFrame);
  }

  /**
   * Libère les variables
   */
  dispose() {
    if (!this.disposed) {
      this.disposed = true;

      this.audioContext.close();
      this.audioContext = null;
      this.audioDatas.dispose();
      this.audioDatas = null;
      this.processFrame = null;
      this.analyser = null;
    }
  }
}

/**
 * Données de l'audio
 */
class MelAudioStruct {
  /**
   * Constructeur de la classe
   * @param {MediaDeviceInfo} device Micro que l'on souhaite écouter
   * @param {external:jQuery} $main DIV parente
   */
  constructor(device, $main) {
    this._init()._setup(device, $main);
  }

  /**
   * Initialise les variables
   * @private
   * @returns {MelAudioStruct} Chaîne
   */
  _init() {
    /**
     * Micro que l'on souhaite écouter
     * @type {MediaDeviceInfo}
     */
    this.device = null;
    /**
     * DIV parente
     * @type {external:jQuery}
     */
    this.$main = null;
    /**
     * @type {Array<external:jQuery>} Les "barres" de visualisations
     */
    this.elements = [];
    /**
     * @type {AudioVisualizer}
     */
    this.visualizer = null;

    return this;
  }

  /**
   * Assigne les variables de la classe
   * @private
   * @param {MediaDeviceInfo} device Micro que l'on souhaite écouter
   * @param {external:jQuery} $main DIV parente
   * @returns {MelAudioStruct} Chaîne
   */
  _setup(device, $main) {
    this.device = device;
    this.$main = $main;

    return this;
  }

  /**
   * Génère les "barres" de visualisations
   * @returns {MelAudioStruct} Chaîne
   */
  generateElements() {
    for (let i = 0; i < visualValueCount; ++i) {
      const elm = document.createElement('div');
      this.$main.append(elm);
    }

    this.elements = this.$main.children();

    return this;
  }

  /**
   * Libère la classe
   */
  dispose() {
    if (!this.disposed) {
      this.disposed = true;

      this.device = null;
      this.$main.parent().remove();
      this.$main = null;
      this.elements = null;
      this.visualizer.dispose();
      this.visualizer = null;
    }
  }
}

/**
 * Gère les visualisations audio
 */
class MelAudioManager {
  constructor() {
    this._init();
  }

  _init() {
    /**
     * @type {Object<string, MelAudioStruct>}
     */
    this.visualElements = {};
    this.started = false;
    this.devices = null;

    return this;
  }

  async start($main, alreadyExistingDevices = null) {
    const devices =
      alreadyExistingDevices ||
      (await navigator.mediaDevices.enumerateDevices());
    this.devices = devices;

    for (const dvc of devices) {
      if (dvc.kind === 'audioinput') {
        this.visualElements[dvc.deviceId] = new MelAudioStruct(
          dvc,
          $(
            '<div class="rotovisua"><div class="text"></div><div class="visu"></div></div>',
          )
            .data('deviceid', dvc.deviceId)
            .appendTo($main)
            .find('.visu'),
        ).generateElements();
        this.visualElements[dvc.deviceId].visualizer = new AudioVisualizer(
          dvc,
          this.visualElements[dvc.deviceId],
          new AudioContext(),
          MelAudioManager.processFrame,
          MelAudioManager.processError,
        );
        this.visualElements[dvc.deviceId].$main
          .parent()
          .find('.text')
          .html(dvc.label);
      }
    }

    this.started = true;
    return this;
  }

  /**
   *
   * @param {*} dvc
   * @param {*} $button
   * @returns {Promise<MelAudioStruct>}
   */
  async addElement(dvc, $button) {
    if (!this.devices) {
      console.log('Génération des devices !');
      this.devices = await navigator.mediaDevices.enumerateDevices();
    }

    if (dvc.kind === 'audioinput') {
      this.visualElements[dvc.deviceId] = new MelAudioStruct(
        dvc,
        $(
          '<div class="rotovisua"><div class="button"></div><div class="visu"></div></div>',
        )
          .data('deviceid', dvc.deviceId)
          .find('.visu'),
      ).generateElements();
      this.visualElements[dvc.deviceId].visualizer = await new AudioVisualizer(
        dvc,
        this.visualElements[dvc.deviceId],
        new AudioContext(),
        MelAudioManager.processFrame,
        MelAudioManager.processError,
      ).start(this.devices);
      this.visualElements[dvc.deviceId].$main
        .parent()
        .find('.button')
        .html($button);
    }

    return this.visualElements[dvc.deviceId];
  }

  addButton($button, id) {
    this.visualElements[id].$main.find('.text').html($button);
    return this;
  }

  static processFrame(data, visualElements) {
    const dataMap = {
      0: 15,
      1: 10,
      2: 8,
      3: 9,
      4: 6,
      5: 5,
      6: 2,
      7: 1,
      8: 0,
      9: 4,
      10: 3,
      11: 7,
      12: 11,
      13: 12,
      14: 13,
      15: 14,
    };
    const values = Object.values(data);
    for (let i = 0; i < visualValueCount; ++i) {
      const value = values[dataMap[i]] / 255;
      const elmStyles = visualElements[i].style;
      elmStyles.transform = `scaleY( ${value} )`;
      elmStyles.opacity = Math.max(0.25, value);
    }
  }

  static processError(visualMainElement) {
    visualMainElement.classList.add('error');
    visualMainElement.innerText =
      'Please allow access to your microphone in order to see this demo.\nNothing bad is going to happen... hopefully :P';
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this.started = false;

      for (const key in this.visualElements) {
        if (Object.hasOwnProperty.call(this.visualElements, key)) {
          this.visualElements[key].dispose();
        }
      }

      this.visualElements = null;
      this.devices = null;
    }
  }
}

class MelAudioTester {
  constructor(devices = null) {
    this._devices = devices;
    this._audio = null;
  }

  async test(device) {
    if (!this._devices) {
      this._devices = await navigator.mediaDevices.enumerateDevices();
    }

    if (this._audio) {
      this._audio.pause();
      $(this._audio).remove();
      this._audio = null;
    }

    let id = null;
    for (const iterator of this._devices) {
      if (iterator.kind === device.kind && iterator.label === device.label) {
        id = iterator.deviceId;
        break;
      }
    }
    if (id) {
      const audio = document.createElement('audio');
      audio.src = audiourltotest;
      await audio.setSinkId(id);
      await audio.play();

      this._audio = audio;
    } else {
      console.error('###[test]Impossible de trouver le haut-parleur');
    }

    return this;
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this._devices = null;
      this._audio.pause();
      $(this._audio).remove();
      this._audio = null;
    }
  }
}

class MelAudioTesterManager {
  constructor() {
    this.audios = {};
  }

  addAudio(key, audio) {
    if (this.audios[key]) return this;

    this.audios[key] = audio;

    return this;
  }

  dispose() {
    if (!this.disposed) {
      this.disposed = true;

      for (const key in this.audios) {
        if (Object.hasOwnProperty.call(this.audios, key)) {
          this.audios[key]?.dispose?.();
        }
      }

      this.audios = null;
    }
  }
}
