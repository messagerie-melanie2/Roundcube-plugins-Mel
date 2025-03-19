var FramesHelper =
  FramesHelper ||
  (() => {
    return {
      async get() {
        if (window.mel_modules?.FrameManager)
          return window.mel_modules?.FrameManager;
        else {
          const { Mel_Promise } = await loadJsModule(
            'mel_metapage',
            'mel_promise',
          );

          const result = await Mel_Promise.wait(
            () => !!window.mel_modules?.FrameManager,
          );

          if (result.resolved) return await this.get();
          else {
            const { FramesManager } = await loadJsModule(
              'mel_metapage',
              'frame_manager',
              '/js/lib/classes/',
            );

            return FramesManager;
          }
        }
      },
      async switch_frame(
        task,
        { changepage = true, args = null, actions = [], wind = null },
      ) {
        const FramesManager = await this.get();
        return await FramesManager.Instance.switch_frame(task, {
          changepage,
          args,
          actions,
          wind,
        });
      },
    };
  })();
