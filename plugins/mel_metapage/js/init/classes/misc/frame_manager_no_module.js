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
 * @callback SwitchFrameCallback
 * @param {string} task
 * @param {Object} [options={}]
 * @param {boolean} [options.changepage=true]
 * @param {?Object<string, string | number>} [options.args=null]
 * @param {string[]} [options.actions=[]]
 * @async
 * @return {Promise<void>}
 */

/**
 * @typedef FrameManagerNoModuleHelper
 * @property {FrameManager} Instance
 * @property {FrameManagerWrapperHelper} Helper
 * @property {HasCallback} Has
 * @property {LoadFrameManagerCallback} Load
 * @property {SwitchFrameCallback} SwitchFrame
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
        return !!window.mel_modules?.[MODULE];
      },
      async Load() {
        const { FramesManager } = await loadJsModule(
          'mel_metapage',
          'frame_manager',
          '/js/lib/classes/',
        );
        return FramesManager;
      },
      async SwitchFrame(
        task,
        { changepage = true, args = null, actions = [] },
      ) {
        let instance;
        if (!this.Has()) instance = (await this.Load()).Instance;
        else instance = this.Instance;

        return await instance.switch_frame(task, {
          changepage,
          args,
          actions,
        });
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
