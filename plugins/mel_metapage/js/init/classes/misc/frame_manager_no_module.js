/**
 * @callback HasCallback
 * @return {boolean}
 */

/**
 * @callback LoadFrameManagerCallback
 * @async
 * @return {Promise<FrameManagerWrapper>}
 */

/**
 * @typedef FrameManagerNoModuleHelper
 * @property {FrameManager} Instance
 * @property {FrameManagerWrapperHelper} Helper
 * @property {HasCallback} Has
 * @property {LoadFrameManagerCallback} Load
 */

/**
 * @type {FrameManagerNoModuleHelper}
 */
var PageManager =
  PageManager ||
  (() => {
    const MODULE = 'FrameManager';
    let manager = {
      Instance: null,
      Helper: null,
      Has() {
        return !!window.mel_modules[MODULE];
      },
      async Load() {
        await loadJsModule('mel_metapage', 'frame_manager', '/js/lib/classes/');
        return window.mel_modules[MODULE];
      },
    };

    Object.defineProperties(manager, {
      Instance: {
        get() {
          return window.mel_modules[MODULE].Instance;
        },
      },
      Helper: {
        get() {
          return window.mel_modules[MODULE].Helper;
        },
      },
    });

    return manager;
  })();
