import { BnumLog } from '../../../mel_metapage/js/lib/classes/bnum_log.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import {
  announce,
  clear_field_state,
  on_enter,
  reject_field,
} from './accessibility.js';

const ID_LOST_CODE = 'da__lost-code';
const ID_RECOVERY = 'da__recovery';
const ID_GUARD_STEP = 'da__recovery-guard';
const ID_CODE_STEP = 'da__recovery-code';
const ID_ADDRESS = 'da__recovery-address';
const ID_TOKEN = 'da__recovery-token';
const ID_BACK = 'da__recovery-back';
const ID_SEND = 'da__recovery-send';
const ID_RESEND = 'da__recovery-resend';
const ID_CONNECT = 'da__recovery-connect';
const MAIN_VIEW_SELECTOR = '.da__code, .da__divider, .da__help';
const CHAR_AT = '@';
const CHAR_MASK = '*';
const MAX_VISIBLE_CHARS = 3;
const MSG_INVALID_ADDRESS =
  // eslint-disable-next-line quotes
  "Votre adresse de récupération n'est pas valide ! Connectez-vous en intranet pour vous connecter et changer votre adresse de récupération.";
const MSG_SENT = 'Message envoyé !';
const MSG_EMPTY_TOKEN = 'Saisissez le code reçu par mail.';
const KEY_ESCAPE = 'Escape';
// eslint-disable-next-line quotes
const MSG_SEND_ERROR = "Impossible d'envoyer le code de validation !";

/**
 * Masque la partie locale d'une adresse mail (ex : `jean.dupont@mail.fr` => `jea*******@mail.fr`).
 *
 * @param {string} email Adresse à masquer
 * @returns {string} Adresse masquée, chaîne vide si l'adresse est invalide
 *
 * @example
 * mask_email('jean.dupont@mail.fr'); // 'jea*******@mail.fr'
 */
export function mask_email(email) {
  const [local, domain] = (email ?? '').split(CHAR_AT);

  if (!local || !domain) return '';

  const visible_count =
    local.length > MAX_VISIBLE_CHARS
      ? MAX_VISIBLE_CHARS
      : Math.min(local.length, 2);

  return `${local.slice(0, visible_count)}${CHAR_MASK.repeat(local.length - visible_count)}${CHAR_AT}${domain}`;
}

/**
 * Gère le parcours « code perdu » de la page de double authentification :
 * vérification de l'adresse de récupération, envoi d'un code par mail,
 * puis connexion avec le code reçu.
 */
export class DaRecoveryFlow extends MelObject {
  #_busy = false;

  constructor() {
    super();

    this.#_bindEvents();
  }

  #_bindEvents() {
    this.#_onClick(ID_LOST_CODE, () => this.#_open());
    this.#_onClick(ID_BACK, () => this.#_close());
    this.#_onClick(ID_SEND, () => this.#_sendCode());
    this.#_onClick(ID_RESEND, () => this.#_sendCode());
    this.#_onClick(ID_CONNECT, () => this.#_connect());
    this.#_bindKeyboard();
  }

  /**
   * Entrée dans le champ du code reçu valide la saisie, Échap revient à la saisie du code.
   *
   * @returns {void}
   */
  #_bindKeyboard() {
    const token = document.getElementById(ID_TOKEN);
    const recovery = document.getElementById(ID_RECOVERY);

    if (token) {
      on_enter(token, () => this.#_connect());
      token.addEventListener('input', () => clear_field_state(token));
    }

    recovery?.addEventListener('keydown', (e) => {
      if (e.key === KEY_ESCAPE) this.#_close();
    });
  }

  /**
   * @param {string} id Identifiant de l'élément
   * @param {() => (void | Promise<void>)} callback Action au clic
   * @returns {void}
   */
  #_onClick(id, callback) {
    const element = document.getElementById(id);

    if (!element) {
      BnumLog.error(`Impossible de trouver l'élément "${id}" !`);
      return;
    }

    element.addEventListener('click', callback);
  }

  async #_open() {
    const result = await this.#_runBusy(() =>
      BnumConnector.connect(BnumConnector.connectors.settings_da_get_email_valid, {}),
    );

    if (result === null) return;

    if (!result.datas) {
      this.#_notify(MSG_INVALID_ADDRESS, eMessageType.Error);
      return;
    }

    document.getElementById(ID_ADDRESS).textContent = mask_email(
      this.get_env('double_authentification_adresse_recuperation'),
    );

    this.#_showRecovery(true);
    this.#_showStep(ID_GUARD_STEP, ID_SEND);
  }

  #_close() {
    this.#_showRecovery(false);
    document.getElementById(ID_LOST_CODE)?.focus();
  }

  async #_sendCode() {
    const result = await this.#_runBusy(() =>
      BnumConnector.force_connect(
        BnumConnector.connectors.settings_da_send_otp_token,
        { params: { _from_login: true } },
      ),
    );

    if (result === null) return;

    if (result.has_error || result.datas === -1) {
      this.#_notify(MSG_SEND_ERROR, eMessageType.Error);
      return;
    }

    this.#_notify(MSG_SENT, eMessageType.Confirmation);
    this.#_showStep(ID_CODE_STEP, ID_TOKEN);
  }

  #_connect() {
    if (this.#_busy) return;

    const field = document.getElementById(ID_TOKEN);
    const token = field?.value.trim() ?? '';

    if (!token) {
      reject_field(field, MSG_EMPTY_TOKEN);
      return;
    }

    this.#_setBusy(true);

    // Navigation de la fenêtre principale : la page peut être chargée dans une iframe.
    (top ?? parent ?? window).location.href = this.url('login', {
      action: 'plugin.da.try_connect',
      params: { _token: token },
    });
  }

  /**
   * @param {boolean} show `true` pour afficher le parcours de récupération, `false` pour revenir à la saisie du code
   * @returns {void}
   */
  #_showRecovery(show) {
    for (const element of document.querySelectorAll(MAIN_VIEW_SELECTOR)) {
      element.hidden = show;
    }

    document.getElementById(ID_RECOVERY).hidden = !show;
  }

  /**
   * @param {string} id_step Identifiant de l'étape à afficher
   * @param {string} id_focus Identifiant de l'élément qui reçoit le focus (navigation clavier)
   * @returns {void}
   */
  #_showStep(id_step, id_focus) {
    for (const id of [ID_GUARD_STEP, ID_CODE_STEP]) {
      document.getElementById(id).hidden = id !== id_step;
    }

    document.getElementById(id_focus)?.focus();
  }

  /**
   * Affiche un message à l'écran et l'annonce aux technologies d'assistance.
   *
   * @param {string} message Message à afficher
   * @param {string} type Type de message (eMessageType)
   * @returns {void}
   */
  #_notify(message, type) {
    BnumMessage.DisplayMessage(message, type);
    announce(message);
  }

  /**
   * Exécute une action asynchrone en bloquant les appels concurrents et en affichant l'indicateur de chargement.
   *
   * @template T
   * @param {() => Promise<T>} action Action à exécuter
   * @returns {Promise<T | null>} Résultat, ou `null` si une action était déjà en cours
   */
  async #_runBusy(action) {
    if (this.#_busy) return null;

    this.#_setBusy(true);
    const busy_id = this.rcmail().set_busy(true, 'loading');

    try {
      return await action();
    } finally {
      this.rcmail().set_busy(false, 'loading', busy_id);
      this.#_setBusy(false);
    }
  }

  /**
   * @param {boolean} busy `true` pendant une opération en cours
   * @returns {void}
   */
  #_setBusy(busy) {
    this.#_busy = busy;
  }
}
