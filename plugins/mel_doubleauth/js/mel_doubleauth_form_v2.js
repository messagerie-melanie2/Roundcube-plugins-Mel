import { BnumLog } from '../../mel_metapage/js/lib/classes/bnum_log.js';
import {
  BnumMessage,
  eMessageType,
} from '../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import {
  clear_field_state,
  on_enter,
  reject_field,
} from './lib/accessibility.js';
import { DaRecoveryFlow } from './lib/recovery_flow.js';

const ID_LOGIN_USER = 'rcmloginuser';
const ID_LOGIN_PASSWORD = 'rcmloginpwd';
const ID_ALT_CONNEXION_DIV = 'login__alt-connexion';
const ID_KEEP_LOGIN = 'rcmloginkeep';
const ID_SUBMIT_DS = 'rcmloginsubmit_ds';
const ID_SUBMIT_NATIVE = 'rcmloginsubmit';
const ID_VALIDATE = 'da__validate';
const ID_CANCEL = 'da__cancel';
const ID_CODE_INPUT = '2FA_code';
const FORM_TARGET_ACTION = './';
const TASK_AFTER_LOGIN = 'mail';
const DIVIDERS_SELECTORS = '#login__divider, .login__separator-vertical';
const CARD_SELECTOR = '#mel-login-form bnum-card';
const CARD_TITLE_ID = '#bnum-card-title';
const COLUMNS_SELECTOR = 'div .login__columns';
const COLUMNS_CLASS = 'login__columns';
const FOOTER_ALERT_SELECTOR = '.login__footer bnum-alert-info';
const ID_ADDONS = 'login__addons';
const ID_MAIN_TITLE = 'login__credentials-title';
const PLUGIN_NAME = 'mel_doubleauth';

/**
 * Transforme la page de connexion en page de saisie du code de double authentification.
 *
 * Le bouton "Valider le code" du template `da.html` déclenche le bouton de
 * connexion du design system (`#rcmloginsubmit_ds`), masqué sur cette page.
 */
class MelDoubleAuthForm extends MelObject {
  static #_initialized = false;

  #_submitting = false;

  get code_input() {
    return document.getElementById(ID_CODE_INPUT);
  }

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

  get credentials_title() {
    return document.getElementById(ID_MAIN_TITLE);
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
      this.#_showFatalError(
        'Impossible de trouver les inputs de connexion !',
        this.#_text('da_page_unavailable'),
      );
      return;
    }

    this.#_removeLoginFields(inputs);

    if (!this.#_updateCardTitle()) {
      this.#_showFatalError(
        'Impossible de changer le titre !',
        this.#_text('da_page_degraded'),
      );
      return;
    }

    if (!this.#_moveAddonsIntoForm()) {
      this.#_showFatalError(
        'Impossible de rattacher la saisie du code au formulaire !',
        this.#_text('da_page_unavailable'),
      );
      return;
    }

    this.#_injectDaPage();
    this.#_updateCredentialsTitle();
    this.#_hideLoginLeftovers();
    this.#_redirectFormToTask();
    this.#_forwardReturnUrl();
    this.#_bindCodeInput();
    this.#_bindValidateButton();
    this.#_bindCancelButton();
    new DaRecoveryFlow();
    this.#_focusCodeInput();
  }

  /**
   * Dans le template de login, `#login__addons` est situé avant le `<form>` :
   * sans ce déplacement, le champ du code ne serait pas envoyé avec le formulaire.
   *
   * @returns {boolean} `false` si le formulaire ou le conteneur est introuvable
   */
  #_moveAddonsIntoForm() {
    const form = this.#_getForm();
    const addons = document.getElementById(ID_ADDONS);

    if (!form || !addons) return false;

    form.prepend(addons);
    return true;
  }

  /**
   * @returns {?HTMLFormElement} Formulaire de connexion (retrouvé via son bouton de soumission natif)
   */
  #_getForm() {
    return document.getElementById(ID_SUBMIT_NATIVE)?.form ?? null;
  }

  /**
   * Le code est vérifié par le hook `check_2FAlogin` : le formulaire doit donc
   * viser la tâche finale et non plus l'action de login.
   *
   * @returns {void}
   */
  #_redirectFormToTask() {
    this.#_getForm()?.setAttribute('action', FORM_TARGET_ACTION);

    this.#_setHiddenInput('_task', TASK_AFTER_LOGIN);
    this.#_setHiddenInput('_action', '');
  }

  /**
   * @returns {void}
   */
  #_forwardReturnUrl() {
    const url = this.get_env('_url');

    if (url) this.#_setHiddenInput('_url', url);
  }

  /**
   * @param {string} name Nom de l'input caché
   * @param {string} value Valeur à affecter
   * @returns {void}
   */
  #_setHiddenInput(name, value) {
    const input = document.querySelector(`input[name="${name}"]`);

    if (!input) {
      BnumLog.error(`Impossible de trouver l'input caché "${name}" !`);
      return;
    }

    input.setAttribute('value', value);
    input.value = value;
  }

  /**
   * Retour à l'identification : recharge la page de connexion.
   *
   * @returns {void}
   */
  #_bindCancelButton() {
    document.getElementById(ID_CANCEL)?.addEventListener('click', () => {
      const url = this.url('login', {});
      window.location.href = url;
    });
  }

  #_focusCodeInput() {
    this.code_input?.focus();
  }

  /**
   * Retire de la page les champs et sections propres à la connexion classique.
   *
   * @param {{username: HTMLElement, password: HTMLElement}} inputs Champs de connexion
   * @returns {void}
   */
  #_removeLoginFields({ username, password }) {
    for (const element of this.#_getRSection() ?? []) element.remove();

    password.remove();
    username.remove();
    this.#_getKeepLogin()?.remove();
  }

  /**
   * Change le titre de la carte de connexion.
   *
   * @returns {boolean} `false` si aucun moyen de changer le titre n'a été trouvé
   */
  #_updateCardTitle() {
    if (this.card_title) {
      this.card_title.textContent = this.#_text('da_card_title');
      return true;
    }

    if (!this.card?.updateTitle) return false;

    const element = document.createElement('bnum-fragment');
    element.innerHTML = `
      <bnum-card-title data-icon="key">
        ${this.#_text('da_card_title')}
      </bnum-card-title>
    `;

    this.card.updateTitle(element);
    return true;
  }

  /**
   * Injecte le template de saisie du code (`da.html`) transmis par le serveur.
   *
   * @returns {void}
   */
  #_injectDaPage() {
    document.getElementById(ID_ADDONS).innerHTML =
      this.get_env('_da_page') + this.get_env('_da_recovery_page');
    this.rcmail().env._da_page = null;
    this.rcmail().env._da_recovery_page = null;
  }

  #_updateCredentialsTitle() {
    const title = this.credentials_title;

    if (title) title.textContent = this.#_text('da_credentials_title');
  }

  /**
   * Masque ce qui n'a plus de sens sur la page de double authentification.
   *
   * @returns {void}
   */
  #_hideLoginLeftovers() {
    document.querySelector(COLUMNS_SELECTOR)?.classList?.remove(COLUMNS_CLASS);

    this.#_hide(document.getElementById(ID_SUBMIT_DS));
    this.#_hide(document.querySelector(FOOTER_ALERT_SELECTOR));
  }

  /**
   * @param {?HTMLElement} element Élément à masquer
   * @returns {void}
   */
  #_hide(element) {
    if (element) element.style.display = 'none';
  }

  /**
   * Relie le bouton "Valider le code" à la soumission du formulaire.
   *
   * @returns {void}
   */
  #_bindValidateButton() {
    const validate = document.getElementById(ID_VALIDATE);

    if (!validate) {
      BnumLog.error('Impossible de trouver le bouton de validation !');
      return;
    }

    validate.addEventListener('click', () => this.#_validateAndSubmit());
  }

  /**
   * Comportement d'un formulaire classique : Entrée dans le champ soumet,
   * et l'erreur disparaît dès que l'utilisateur corrige sa saisie.
   *
   * @returns {void}
   */
  #_bindCodeInput() {
    const input = this.code_input;

    if (!input) {
      BnumLog.error('Impossible de trouver le champ du code !');
      return;
    }

    on_enter(input, () => this.#_validateAndSubmit());
    input.addEventListener('input', () => clear_field_state(input));
  }

  /**
   * Refuse un code vide (champ en erreur, annoncé, focus conservé) puis soumet le formulaire.
   * Le verrou évite les soumissions multiples (Entrée répétée, double clic).
   *
   * @returns {void}
   */
  #_validateAndSubmit() {
    if (this.#_submitting) return;

    if (!this.code_input.value.trim()) {
      reject_field(this.code_input, this.#_text('da_empty_code'));
      return;
    }

    this.#_submitting = this.#_submit();
  }

  /**
   * Déclenche le bouton de connexion du design system (masqué).
   *
   * @returns {boolean} `false` si le bouton est introuvable
   */
  #_submit() {
    const submit = document.getElementById(ID_SUBMIT_DS);

    if (!submit) {
      BnumLog.error('Impossible de trouver le bouton de connexion !');
      return false;
    }

    submit.click();
    return true;
  }

  /**
   * @param {string} key Clé du libellé dans `localization/fr_FR.inc`
   * @returns {string} Texte localisé
   */
  #_text(key) {
    return this.getLocalization(key, { plugin: PLUGIN_NAME });
  }

  /**
   * @param {string} log Message technique journalisé
   * @param {string} message Message affiché à l'utilisateur
   * @returns {void}
   */
  #_showFatalError(log, message) {
    BnumLog.fatal(log);
    BnumMessage.DisplayMessage(message, eMessageType.Error);
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

    return [alt_login, ...this.dividers];
  }

  static Start() {
    return new MelDoubleAuthForm();
  }
}

if (window.rcmail) MelObject.Empty().listen('init', MelDoubleAuthForm.Start);
