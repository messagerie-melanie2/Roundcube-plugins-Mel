(() => {
  function webconf_is_active() {
    return (
      window.webconf_master_bar !== undefined ||
      parent.webconf_master_bar !== undefined
    );
  }

  async function go_to_webconf(
    key = null,
    wsp = null,
    ariane = null,
    show_config_popup = false,
    locks = null,
    pass = null,
    extra = null,
  ) {
    rcmail.triggerEvent('visio.start', {
      room: key,
      workspace: wsp,
      locks,
      pass,
      extra,
    });
    // let config = {};

    // if (key) config._key = key;
    // if (wsp) config._wsp = wsp;
    // if (locks) config._locks = locks;
    // if (pass) config._pass = pass;
    // if (extra) config._need_config = extra === 'need_config';

    // window.mel_modules['FrameManager'].Instance.start_mode(
    //   'visio',
    //   null,
    //   config,
    // );
    return;

    if (!webconf_is_active()) {
      try {
        top.m_mp_close_ariane();
      } catch (error) {
        console.warn('Impossible de fermer le tchat !');
      }

      if ((parent !== window ? parent : window).$('.webconf-frame').length > 0)
        (parent !== window ? parent : window).$('.webconf-frame').remove();

      let config = null;
      if (
        key !== null ||
        wsp !== null ||
        ariane !== null ||
        show_config_popup
      ) {
        config = {};
        if (key !== null) config['_key'] = key;

        if (wsp !== null) {
          if (wsp.includes(' (')) wsp = wsp.split(' (')[0];
          config['_wsp'] = wsp;
        } else if (ariane !== null) config['_ariane'] = ariane;

        if (show_config_popup) config['_need_config'] = 1;

        if (locks) {
          config['_locks'] = locks;
        }

        if (pass) {
          config['_pass'] = pass;
        }

        config[rcmail.env.mel_metapage_const.key] =
          rcmail.env.mel_metapage_const.value;
      }

      mel_metapage.Functions.call(
        'ArianeButton.default().hide_button()',
        false,
      );

      mel_metapage.Functions.call(() => {
        if (window.create_popUp !== undefined) window.create_popUp.close();
      }, false);

      if (extra && Object.keys(extra).length > 0) {
        for (const iterator of Object.keys(extra)) {
          config[`_${iterator}`] = extra[iterator];
        }
      }

      await mel_metapage.Functions.change_frame('webconf', true, true, config);
    } else {
      rcmail.display_message(
        rcmail.gettext('webconf_already_running', 'mel_metapage'),
        'warning',
      );
    }
  }

  async function go_to_webconf_ex({
    key = null,
    wsp = null,
    ariane = null,
    show_config_popup = false,
    locks = null,
    pass = null,
    extra = null,
  }) {
    await go_to_webconf(
      key,
      wsp,
      ariane,
      show_config_popup,
      locks,
      pass,
      extra,
    );
  }

  async function notify(key, uid) {
    let $config = {
      _link: mel_metapage.Functions.url('webconf', '', {
        _key: key,
        _wsp: uid,
      }).replace(
        `&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`,
        '',
      ),
      _uid: uid,
    };

    return mel_metapage.Functions.post(
      mel_metapage.Functions.url('webconf', 'notify'),
      $config,
    );
  }

  async function voxify_url() {
    if (voxify_url.waiting) {
      let it = 0;
      await new Promise((ok, nok) => {
        const interval = setInterval(() => {
          console.debug('Waiting voxify url...');
          if (!voxify_url.waiting) {
            clearInterval(interval);
            console.debug('Voxify url ok !');
            ok();
          }

          if (++it > 50) {
            voxify_url.waiting = false;
            console.debug('Voxify url not ok !');
            nok();
          }
        }, 100);
      });
    }

    let navigator = top ?? parent ?? window;

    if (!navigator.voxify_url) {
      voxify_url.waiting = true;
      console.info('Starting get voxify url !');
      await mel_metapage.Functions.get(
        mel_metapage.Functions.url('mel_settings', 'get'),
        {
          _option: 'voxify_url',
          _default_value: 'https://webconf.numerique.gouv.fr/voxapi',
        },
        (datas) => {
          console.info('Voxify url ok !');
          datas = JSON.parse(datas);
          navigator.voxify_url = datas;
        },
      );
      console.info('Finishing get voxify url !');
      voxify_url.waiting = false;
    }

    return navigator.voxify_url;
  }

  async function getWebconfPhoneNumber(webconf) {
    const url = `${await voxify_url()}/api/v1/conn/jitsi/phoneNumbers?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
    let phoneNumber = null;
    window.disable_x_roundcube = true;
    await mel_metapage.Functions.get(url, {}, (datas) => {
      const indicator = rcmail.env['mel_metapage.webconf_voxify_indicatif'];
      if (
        !!datas &&
        datas.numbersEnabled &&
        !!datas.numbers[indicator] &&
        datas.numbers[indicator].length > 0
      )
        phoneNumber = datas.numbers[indicator][0];
    });
    window.disable_x_roundcube = false;

    return phoneNumber;
  }

  async function getWebconfPhonePin(webconf) {
    const url = `${await voxify_url()}/api/v1/conn/jitsi/conference/code?conference=${webconf}@conference.webconf.numerique.gouv.fr`;
    let phoneNumber = null;
    window.disable_x_roundcube = true;
    await mel_metapage.Functions.get(url, {}, (datas) => {
      if (!!datas && !!datas.id) phoneNumber = datas.id;
    });
    window.disable_x_roundcube = false;

    return phoneNumber;
  }

  window.webconf_helper = {
    go: go_to_webconf,
    go_ex: go_to_webconf_ex,
    already: webconf_is_active,
    notify: notify,
    phone: {
      get: getWebconfPhoneNumber,
      pin: getWebconfPhonePin,
      async getAll(webconf) {
        const datas = await Promise.allSettled([
          this.get(webconf),
          this.pin(webconf),
        ]);
        window.disable_x_roundcube = false;
        return {
          number: datas[0].value,
          pin: datas[1].value,
        };
      },
    },
  };
})();
