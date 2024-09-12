//Lance la visio sans passer par la demande de clé
(async () => {
  const { FramesManager } = await loadJsModule(
    'mel_metapage',
    'frame_manager',
    '/js/lib/classes/',
  );

  let config = {};

  for (const key in rcmail.env['visio.data']) {
    if (Object.prototype.hasOwnProperty.call(rcmail.env['visio.data'], key)) {
      const element = rcmail.env['visio.data'][key];
      config[`_${key}`] = element;
    }
  }

  FramesManager.Instance.start_mode(
    'visio',
    rcmail.env['visio.init.page'],
    config,
  );
})();
