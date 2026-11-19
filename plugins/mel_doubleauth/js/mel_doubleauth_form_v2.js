import { BnumLog } from '../../mel_metapage/js/lib/classes/bnum_log.js';
import {
  BnumMessage,
  eMessageType,
} from '../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';

const ID_LOGIN_USER = 'rcmloginuser';
const ID_LOGIN_PASSWORD = 'rcmloginpwd';
const ID_ALT_CONNEXION_DIV = 'bnum-alt-connexion-container';
const ID_KEEP_LOGIN = 'rcmloginkeep';
const DIVIDERS_SELECTORS = '#login-divider, .login-or-vertical';
const CARD_SELECTOR = '#mel-login-form bnum-card';
const CARD_TITLE_ID = '#bnum-card-title';
const ID_MAIN_TITLE = 'login-title-h3';

class MelDoubleAuthForm extends MelObject {
  static #_initialized = false;

  get input_user() {
    return document.getElementById(ID_LOGIN_USER);
  }

  get input_password() {
    return document.getElementById(ID_LOGIN_PASSWORD);
  }

  get alt_connexion_section() {
    return document.getElementById(ID_ALT_CONNEXION_DIV);
  }

  get keep_login() {
    return document.getElementById(ID_KEEP_LOGIN);
  }

  /**
   * @type {HTMLElement[]}
   */
  get dividers() {
    return [...document.querySelectorAll(DIVIDERS_SELECTORS)];
  }

  /**
   * @type {HTMLElement | import('../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumCardElement}
   */
  get card() {
    return document.querySelector(CARD_SELECTOR);
  }

  get card_title() {
    return document.getElementById(CARD_TITLE_ID);
  }

  constructor() {
    super();

    this.#_start();
  }

  #_start() {
    if (MelDoubleAuthForm.#_initialized) return;
    MelDoubleAuthForm.#_initialized = true;

    this.#_main();
  }

  #_main() {
    const inputs = this.#_getLoginInputs();

    if (!inputs) {
      BnumLog.fatal('Impossible de trouver les inputs de connexion !');
      BnumMessage.DisplayMessage(
        // eslint-disable-next-line quotes
        "Impossible d'afficher la page de double authentification !",
        eMessageType.Error,
      );
      return;
    }

    {
      const rSection = this.#_getRSection() ?? [];

      for (const element of rSection) {
        element.remove();
      }
    }

    inputs.password.remove();
    inputs.username.remove();

    const keeplogin = this.#_getKeepLogin();

    if (keeplogin) keeplogin.remove();

    const title = 'Double authentification';

    if (this.card_title) this.card_title.textContent = title;
    else if (this.card?.updateTitle) {
      const card_title = `
        <bnum-card-title 
          data-icon="key">
            ${title}
        </bnum-card-title>
      `;

      const element = document.createElement('bnum-fragment');
      element.innerHTML = card_title;

      this.card.updateTitle(element);
    } else {
      BnumLog.fatal('Impossible de changer le titre !');
      BnumMessage.DisplayMessage(
        // eslint-disable-next-line quotes
        "Impossible d'afficher correctement la page de double authentification !",
        eMessageType.Error,
      );
      return;
    }

    const da = this.get_env('_da_page');
    const addon = document.getElementById('login-addons');
    addon.innerHTML = da;
    this.rcmail().env._da_page = null;
  }

  #_getLoginInputs() {
    const username = this.input_user;

    if (!username) {
      // eslint-disable-next-line quotes
      BnumLog.error("Impossible de trouver l'input du nom d'utilisateur !");
      return null;
    }

    const password = this.input_password;

    if (!password) {
      // eslint-disable-next-line quotes
      BnumLog.error("Impossible de trouver l'input du mot de passe !");
      return null;
    }

    return { username, password };
  }

  #_getKeepLogin() {
    const keepLogin = this.keep_login;

    if (!keepLogin) {
      BnumLog.error('Impossible de trouver le "KeepLogin" !');
      return null;
    }

    return keepLogin;
  }

  #_getRSection() {
    const alt_login = this.alt_connexion_section;

    if (!alt_login) {
      BnumLog.error('Impossible de trouver le login alternatif !');
      return null;
    }

    const dividers = this.dividers;

    return [alt_login, ...dividers];
  }

  static Start() {
    return new MelDoubleAuthForm();
  }
}

if (window.rcmail) MelObject.Empty().listen('init', MelDoubleAuthForm.Start);
