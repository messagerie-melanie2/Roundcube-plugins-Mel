(() => {
class Wekan {
  get #_melMetapage() {
    const mel_metapage = window.mel_metapage || {};

    if (!mel_metapage) 
      console.error('### [Wekan/constructor] Impossible de trouver mel_metapage !', mel_metapage);

    return mel_metapage;
  }

  constructor() {
    const rcmail = window.rcmail || null;

    if (!rcmail) {
      console.error('### [Wekan/constructor] Impossible de trouver rcmail !', rcmail);
      return;
    }

    const origin = this.#_getOrigine();
    this.tokenName = `Meteor.loginToken:${origin}:/${rcmail.env.wekan_storage_end}`;
    this.tokenId = `Meteor.userId:${origin}:/${rcmail.env.wekan_storage_end}`;
  }

  #_getOrigine() {
    let origin = window.location.origin + window.location.pathname;

    if (origin.at(-1) !== '/') origin += '/';

    return origin;
  }

  login() {
    return this.#_melMetapage.Functions.post(
      this.url('login'),
      {
        currentUser: true,
      },
      (datas) => {
        try {
          datas = JSON.parse(datas);
          datas = JSON.parse(datas.content);
          const token = this.tokenName;

          localStorage.setItem(token, datas.authToken);
        } catch (error) {
          return error;
        }
      },
    ).then(
      (e) =>
        JSON.parse(e).httpCode === 200 &&
        localStorage.getItem(this.tokenName) !== null,
    );
  }

  isLogged() {
    return localStorage.getItem(this.tokenName) !== null;
  }

  create_board(title, isPublic, color = null) {
    return this.#_melMetapage.Functions.post(
      this.url('create_board'),
      {
        _title: title,
        _isPublic: isPublic,
        _color: color,
      },
      (_) => {
        return _;
      },
    );
  }

  update_user_status() {
    return this.#_melMetapage.Functions.post(
      this.url('update_user_status'),
      (_) => {
        return _;
      },
    );
  }

  check_board() {
    return this.#_melMetapage.Functions.post(
      this.url('check_board'),
      {
        _board: 'pSSkHJ6wb64ZS2gxE',
      },
      (_) => {
        return _;
      },
    );
  }

  url(task) {
    return this.#_melMetapage.Functions.url('wekan', task);
  }
}


window.wekan = new Wekan();

const $ = window.$ || null;

if (!$) {
  console.error('### [Wekan] Impossible de trouver la classe Jquery !', $);
  return;
}

$(document).ready(async () => {
  const rcmail = window.rcmail || null;
  const wekan = window.wekan || null;

  if (!rcmail) {
    console.error('### [Wekan] Impossible de trouver rcmail !', rcmail);
    return;
  }

  if (!wekan) {
    console.error('### [Wekan] Impossible de trouver la classe Wekan !', wekan);
    return;
  }

  if (
    rcmail.env.task === 'wekan' &&
    (rcmail.env.action === '' || rcmail.env.action === 'index')
  ) {
    $('#wekan-iframe')[0].src =
      rcmail.env.wekan_startup_url !== null &&
      rcmail.env.wekan_startup_url !== undefined
        ? rcmail.env.wekan_startup_url
        : rcmail.env.wekan_base_url;

    if (!wekan.isLogged()) {
      if (await wekan.login()) {
        window.addEventListener('storage', (e) => {
          if (e.key === wekan.tokenId) {
            if (
              rcmail.env.wekan_startup_url !== null &&
              rcmail.env.wekan_startup_url !== undefined
            )
              $('#wekan-iframe')[0].src = rcmail.env.wekan_startup_url;
            else $('#wekan-iframe')[0].contentWindow.location.reload();
          }
        });

        if (
          rcmail.env.wekan_startup_url !== null &&
          rcmail.env.wekan_startup_url !== undefined
        )
          $('#wekan-iframe')[0].src = rcmail.env.wekan_startup_url;
      } else
        rcmail.display_message(
          'Impossible de se connecter au kanban !',
          'error',
        );
    }
  }
});
})();