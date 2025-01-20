//Lance la visio sans passer par la demande de clé
(async () => {
  const { VisioHelper } = await loadJsModule('mel_visio', 'helper', '/js/');

  let config = {};

  for (const key in rcmail.env['visio.data']) {
    if (Object.prototype.hasOwnProperty.call(rcmail.env['visio.data'], key)) {
      const element = rcmail.env['visio.data'][key];
      config[`_${key}`] = element;
    }
  }

  VisioHelper.Instance.startVisioMode({
    page: rcmail.env['visio.init.page'],
    params: config,
  });

  // FramesManager.Instance.start_mode(
  //   'visio',
  //   rcmail.env['visio.init.page'],
  //   config,
  // );
})();
