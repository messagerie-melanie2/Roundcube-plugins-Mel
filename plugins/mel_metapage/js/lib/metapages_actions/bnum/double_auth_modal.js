import { BnumConnector } from '../../helpers/bnum_connections/bnum_connections.js';
import { MelHtml } from '../../html/JsHtml/MelHtml.js';
import { MelObject } from '../../mel_object.js';
import { Mel_Promise } from '../../mel_promise.js';
import { module_bnum } from './module_bnum.js';

export { double_auth_modal };

// ═══════════════════════════════════════════════════════════════════════════════
// Alias MelHtml
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bouton de retour/fermeture réutilisable dans les modales du flux de double
 * authentification. Délègue la navigation à `double_auth_modal.Instance`.
 *
 * Correction : l'implémentation originale utilisait une fonction libre `close_modal`
 * qui appelait `this.rcmail()` hors contexte de classe (bug). La logique est
 * désormais encapsulée dans `_closeAndNavigate`.
 */
MelHtml.create_alias('close_button', {
  after_callback(html) {
    html.addClass('done-button');
    html.attribs.id = 'modal-custom-button';

    if (
      html.attribs['data-is-start'] === true &&
      html.attribs.action === 'intro_modal'
    ) {
      html.attribs.action = null;
    }

    // `this` dans un handler onclick est l'élément DOM : pas besoin de querySelector.
    html.attribs.onclick = function () {
      double_auth_modal.Instance?._closeAndNavigate(this, html.attribs.action);
    };
  },
  tag: 'button',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Utilitaires statiques (SRP – responsabilités extraites de la classe)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Utilitaire d'encodage Base32 (RFC 4648).
 * Extrait de `double_auth_modal` pour respecter le principe de responsabilité unique.
 * @namespace
 */
const Base32 = {
  /** @type {string} Alphabet Base32 standard. */
  ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',

  /**
   * Encode une chaîne brute en Base32.
   * @param {string} input - Chaîne d'entrée à encoder.
   * @returns {string} Représentation Base32 de l'entrée.
   */
  encode(input) {
    const alpha = this.ALPHABET;
    let s = input;
    const leftover = s.length % 5;
    let quanta = Math.floor(s.length / 5);

    if (leftover !== 0) {
      s += '\x00'.repeat(5 - leftover);
      quanta++;
    }

    const parts = [];
    for (let i = 0; i < quanta; i++) {
      // Raccourci local pour éviter la répétition de `s.charCodeAt(i * 5 + n)`
      const c = (n) => s.charCodeAt(i * 5 + n);
      parts.push(
        alpha.charAt(c(0) >> 3),
        alpha.charAt(((c(0) & 0x07) << 2) | (c(1) >> 6)),
        alpha.charAt((c(1) & 0x3f) >> 1),
        alpha.charAt(((c(1) & 0x01) << 4) | (c(2) >> 4)),
        alpha.charAt(((c(2) & 0x0f) << 1) | (c(3) >> 7)),
        alpha.charAt((c(3) & 0x7f) >> 2),
        alpha.charAt(((c(3) & 0x03) << 3) | (c(4) >> 5)),
        alpha.charAt(c(4) & 0x1f),
      );
    }

    // Nombre de caractères `=` de rembourrage indexé par `leftover` (0–4)
    const padding = [0, 6, 4, 3, 1][leftover] ?? 0;
    if (padding > 0) {
      parts.splice(
        parts.length - padding,
        padding,
        ...Array(padding).fill('='),
      );
    }

    return parts.join('');
  },
};

/**
 * Utilitaire de validation de données de formulaire.
 * Extrait de `double_auth_modal` pour respecter le principe de responsabilité unique.
 * @namespace
 */
const Validator = {
  /** @type {RegExp} Expression régulière de validation d'adresse e-mail. */
  EMAIL_PATTERN: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,5})+$/,

  /**
   * Vérifie qu'une adresse e-mail est syntaxiquement valide.
   * @param {string} email - Adresse e-mail à valider.
   * @returns {boolean} `true` si l'adresse respecte le format attendu.
   */
  isValidEmail(email) {
    return this.EMAIL_PATTERN.test(email);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Classe principale
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Orchestre le flux multi-étapes de la modale de double authentification.
 *
 * **Flux nominal :**
 * 1. Introduction        → `intro_modal`
 * 2. E-mail secondaire   → `secondary_mail_modal`
 * 3. Vérif. e-mail       → `verification_mail_modal`
 * 4. Téléchargement app  → `application_modal`
 * 5. Clé TOTP (scan)     → `add_key_modal`
 * 6. Vérif. TOTP         → `verification_application_modal`
 * 7. Confirmation        → `closing_modal`
 *
 *
 * /!\ Attention ! Ne respecte pas la convention PascalCase !
 * @extends module_bnum
 * @todo Respecter la syntaxe Pascal Case (pas urgent, à voir ce que ça implique)
 */
class double_auth_modal extends module_bnum {
  constructor() {
    super();
  }

  // ─── Cycle de vie ──────────────────────────────────────────────────────────

  /**
   * Initialise la modale, enregistre l'instance globale et intercepte
   * `BnumConnector.connect` pour la gestion des boutons.
   * @override
   */
  main() {
    super.main();
    /** @type {number} Nombre total d'étapes de progression. */
    this.nb_max_states = 4;
    double_auth_modal.Instance = this;
    this._patchBnumConnector();
  }

  /**
   * Démarre le flux si la double authentification est forcée par l'environnement.
   * @returns {double_auth_modal} L'instance courante (chaînage fluent).
   */
  exec() {
    if (rcmail.env.double_authentification_forcee) {
      this.intro_modal();
    }
    return this;
  }

  // ─── Étape 0 : Introduction ────────────────────────────────────────────────

  /**
   * Affiche la modale d'introduction.
   * Les dimensions et le texte s'adaptent à la date butoir éventuelle
   * via `_resolveIntroDeadline`.
   */
  intro_modal() {
    rcmail.env.internet_access_enable = true;

    if (!rcmail.env.internet_access_enable) {
      $('.2fa_error_message').text(
        rcmail.gettext('mel_metapage.no_internet_access'),
      );
      return;
    }

    const { width, height, text } = this._resolveIntroDeadline();

    const html = MelHtml.start
      .div({
        id: 'introduction',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n3',
      })
      .row()
      .col_9()
      .row()
      .span({ class: 'subtitle' })
      .text(rcmail.gettext('mel_metapage.informations'))
      .end()
      .end()
      .row()
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row()
      .p({ class: 'content' })
      .text(text)
      .end()
      .end()
      .end()
      .col_3({ class: 'd-flex align-items-center' })
      .p()
      .img({
        src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/double_authentication.webp`,
        width: '150px',
      })
      .end()
      .end()
      .end()
      .row()
      .div({ class: 'custom-tooltipbuttons' })
      .close_button({ action: 'secondary_mail_modal' })
      .text(rcmail.gettext('mel_metapage.show_me'))
      .end()
      .button({
        class: 'done-button ml-3',
        onclick: () => this._pushLaterNotificationAndClose(),
      })
      .text(rcmail.gettext('mel_metapage.later'))
      .end('button')
      .end('div')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width,
      resizable: false,
      height,
    });
    this._deferFocus('.ui-dialog .done-button');
  }

  // ─── Étape 1 : E-mail secondaire ──────────────────────────────────────────

  /**
   * Affiche la modale de saisie de l'adresse e-mail de récupération.
   * @param {boolean} [isStart=false] - `true` lors du premier affichage (désactive le retour vers l'intro).
   */
  secondary_mail_modal(isStart = false) {
    window.double_fact_saved = false;

    const html = MelHtml.start
      .div({
        id: 'secondary-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'mb-2' })
      .p()
      .text(rcmail.gettext('mel_metapage.secondary_email_text'))
      .end()
      .p({ class: 'd-inline-flex align-items-center' })
      .icon('info', { class: 'mr-2' })
      .end()
      .text(rcmail.gettext('mel_metapage.different_email'))
      .end()
      .end()
      .row({ class: 'mb-4' })
      .input({
        type: 'email',
        id: 'email',
        class: 'form control',
        placeholder: 'Adresse e-mail...',
      })
      .span({ id: 'email-error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'intro_modal', 'data-is-start': isStart })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        class: 'next-button',
        onclick: () => this._onSendEmailCode(),
      })
      .text(rcmail.gettext('mel_metapage.send_code'))
      .end()
      .end()
      .end('div')
      .generate();

    this._openModal(html, {
      width: 600,
      height: 245,
      progressStep: 1,
      bindTitlebarClose: true,
      titlebarCloseEvent: 'da.modal.close',
    });
    this._deferFocus('.ui-dialog input');
  }

  // ─── Étape 2 : Vérification de l'e-mail ───────────────────────────────────

  /**
   * Affiche la modale de saisie du code de vérification envoyé par e-mail.
   */
  verification_mail_modal() {
    const html = MelHtml.start
      .div({
        id: 'verification-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.verification_email_text'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .input({
        type: 'text',
        id: 'code',
        class: 'form control code-input text-center',
        placeholder: '0 0 0 0 0 0',
      })
      .end()
      .row({ class: 'justify-content-center' })
      .span({ id: 'error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'secondary_mail_modal' })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        class: 'next-button',
        onclick: () => this._onVerifyEmailCode(),
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end()
      .end()
      .end('div')
      .generate();

    this._openModal(html, {
      width: 600,
      height: 200,
      progressStep: 2,
      bindTitlebarClose: true,
      titlebarCloseEvent: 'da.modal.close',
    });
    this._deferFocus('.ui-dialog input');
  }

  // ─── Étape 3a : Téléchargement de l'application ────────────────────────────

  /**
   * Affiche la modale de téléchargement des applications d'authentification.
   */
  application_modal() {
    rcmail.env.continueWithUser = false;
    const skinBase = `plugins/mel_metapage/skins/${rcmail.env.skin}/images`;

    const html = MelHtml.start
      .div({
        id: 'application-modal',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.download_application'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p({ class: 'text-center' })
      .text(rcmail.gettext('mel_metapage.application_text'))
      .end()
      .end()
      .row({ class: 'my-2' })
      .col_6({ class: 'col-6 d-flex justify-content-center' })
      .div({ class: 'qrcode_frame text-center' })
      .p({ class: 'download_app' })
      .text(rcmail.gettext('mel_metapage.download_app'))
      .end()
      .p()
      .text('Google Authenticator')
      .end()
      .p()
      .img({ src: `${skinBase}/logo_store.png` })
      .end()
      .img({ src: `${skinBase}/authenticator_link.svg` })
      .end()
      .end()
      .col_6({ class: 'col-6 d-flex justify-content-center' })
      .div({ class: 'qrcode_frame text-center' })
      .p({ class: 'download_app' })
      .text(rcmail.gettext('mel_metapage.download_app'))
      .end()
      .p()
      .text('FreeOTP Authenticator')
      .end()
      .p()
      .img({ src: `${skinBase}/logo_store.png` })
      .end()
      .img({ src: `${skinBase}/freeotp_link.svg` })
      .end()
      .end()
      .end()
      .p({
        class:
          'justify-content-center text-danger d-flex align-items-center my-3',
      })
      .icon('info', { class: 'mr-2' })
      .end()
      .text(
        "Si l'une des applications est déjà installée, passez à l'étape suivante.",
      )
      .end()
      .p({ class: 'text-center mt-4' })
      .text(rcmail.gettext('mel_metapage.code_step_after'))
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'verification_mail_modal' })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        class: 'next-button',
        onclick: () => {
          rcmail.env.continueWithUser = true;
          this._closeCurrentDialog();
          this.add_key_modal();
        },
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    this._openModal(html, {
      width: 600,
      height: 530,
      progressStep: 3,
      onClose: this._createCloseCallback(),
    });
  }

  // ─── Étape 3b : Ajout de la clé TOTP ──────────────────────────────────────

  /**
   * Affiche la modale de scan ou de saisie manuelle de la clé TOTP.
   * Récupère ou réutilise la clé secrète via `_initAddKeyDialog`.
   */
  add_key_modal() {
    rcmail.env.continueWithUser = false;

    const html = MelHtml.start
      .div({
        id: 'application-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p({ class: 'text-center' })
      .text(rcmail.gettext('mel_metapage.scan_authentication_code'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .div({ id: 'qr-code' })
      .end()
      .end()
      .row({ class: 'mt-4 justify-content-center' })
      .p({ class: 'text-center' })
      .text(rcmail.gettext('mel_metapage.add_key'))
      .end()
      .end()
      .row({
        class: 'input-group input-group-code justify-content-center mb-4',
      })
      .input({
        type: 'text',
        class: 'form-control secret-code-input',
        id: 'code_to_copy',
        readonly: 'readonly',
      })
      .div({
        class: 'input-group-append',
        id: 'copy_to_clipboard',
        onclick: () => this._onCopyToClipboard(),
      })
      .span({
        id: 'copy-icon',
        class: 'material-symbols-outlined mt-1 ml-1 mr-2',
      })
      .text('content_copy')
      .end()
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'application_modal' })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        class: 'next-button',
        onclick: () => {
          rcmail.env.continueWithUser = true;
          this._closeCurrentDialog();
          this.verification_application_modal();
        },
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    this._initAddKeyDialog(html);
    this._registerBeforeUnload();
    this._deferFocus('.ui-dialog input');
  }

  // ─── Étape 4 : Vérification TOTP ──────────────────────────────────────────

  /**
   * Affiche la modale de vérification du code TOTP généré par l'application mobile.
   *
   * Correction : la version originale dupliquait `id="modal-custom-button"` sur deux
   * boutons, rendant le sélecteur ambigu. Les IDs sont désormais distincts.
   */
  verification_application_modal() {
    rcmail.env.continueWithUser = false;

    const html = MelHtml.start
      .div({
        id: 'verification-application',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.verification_application_text'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .input({
        type: 'text',
        id: 'code_to_check',
        class: 'form control code-input text-center',
        placeholder: '0 0 0 0 0 0',
      })
      .end()
      .row({ class: 'justify-content-center' })
      .span({ id: 'error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between mt-4' })
      .button({
        class: 'done-button',
        onclick: () => {
          rcmail.env.continueWithUser = true;
          this._closeCurrentDialog();
          this.add_key_modal();
        },
      })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        class: 'next-button',
        onclick: () => this._onVerifyTotpCode(),
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    this._openModal(html, {
      width: 600,
      height: 200,
      progressStep: 4,
      onClose: this._createCloseCallback(),
    });
    this._deferFocus('.ui-dialog input');
  }

  // ─── Étape 5 : Confirmation ────────────────────────────────────────────────

  /**
   * Affiche la modale de confirmation de l'activation de la double authentification.
   */
  closing_modal() {
    const html = MelHtml.start
      .div({
        id: 'closing',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row({ class: 'justify-content-center' })
      .div({ class: 'check_logo' })
      .span({ class: 'material-symbols-outlined' })
      .text('done')
      .end()
      .end()
      .end()
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.double_authentication_validation'))
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-center' })
      .button({
        class: 'next-button',
        onclick: () => {
          rcmail.triggerEvent('da.da_changed.after', { modal: this });
          this._closeCurrentDialog();
        },
      })
      .text(rcmail.gettext('mel_metapage.close_double_auth'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 500,
      resizable: false,
      height: 280,
    });
    $('.ui-dialog button.ui-dialog-titlebar-close').click(() => {
      this.rcmail().triggerEvent('da.da_changed.after', { modal: this });
    });
    this._deferFocus('.ui-dialog .next-button');
  }

  // ─── Contrôle des boutons ──────────────────────────────────────────────────

  /**
   * Désactive tous les boutons et champs de la boîte de dialogue ouverte.
   * Appelé automatiquement pendant les appels réseau via `_patchBnumConnector`.
   * @returns {double_auth_modal} L'instance courante (chaînage fluent).
   */
  disable_buttons() {
    $('.ui-dialog button, .ui-dialog input')
      .addClass('disabled')
      .attr('disabled', 'disabled');
    return this;
  }

  /**
   * Réactive tous les boutons et champs de la boîte de dialogue ouverte.
   * @returns {double_auth_modal} L'instance courante (chaînage fluent).
   */
  enable_buttons() {
    // Correction : `removeAttr` n'accepte qu'un seul argument.
    $('.ui-dialog button, .ui-dialog input')
      .removeClass('disabled')
      .removeAttr('disabled');
    return this;
  }

  // ─── Fermeture / navigation ────────────────────────────────────────────────

  /**
   * Ferme la boîte de dialogue contenant l'élément fourni.
   * @param {Element} element - Tout élément descendant de `.ui-dialog-content`.
   */
  closeDialog(element) {
    $(element).closest('.ui-dialog-content').dialog('close');
  }

  /**
   * Ferme la première boîte de dialogue jQuery UI visible.
   * Évite le couplage sur un identifiant DOM spécifique (LoD).
   */
  _closeCurrentDialog() {
    $('.ui-dialog-content:visible').first().dialog('close');
  }

  /**
   * Ferme la boîte de dialogue parente de `element` puis navigue vers l'étape désignée.
   * Si `action` est `null`, déclenche l'événement `da.modal.close`.
   *
   * @param {Element} element - Élément fils de la boîte à fermer (ex. : le bouton cliqué).
   * @param {string|null} action - Nom de la méthode de navigation à invoquer.
   */
  _closeAndNavigate(element, action) {
    this.closeDialog(element);
    if (action) {
      this[action]();
    } else {
      this.rcmail().triggerEvent('da.modal.close', this);
    }
  }

  // ─── Handlers d'actions ────────────────────────────────────────────────────

  /**
   * Pousse une notification "plus tard" dans le centre de notifications
   * et ferme la modale d'introduction.
   */
  _pushLaterNotificationAndClose() {
    top.rcmail.triggerEvent('plugin.push_notification', {
      uid: `double-auth-${Math.random()}`,
      title: rcmail.gettext('mel_metapage.double_authentication_notification'),
      content: rcmail.gettext(
        'mel_metapage.double_authentication_notification',
      ),
      category: 'double_auth',
      action: [
        {
          title: 'Cliquez ici pour ouvrir les options',
          text: 'Options',
          command: 'open_double_auth',
        },
      ],
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000),
      isread: false,
      local: true,
    });

    this._closeCurrentDialog();
  }

  /**
   * Valide l'adresse e-mail saisie et envoie le code de vérification via le connecteur.
   * Navigue vers `verification_mail_modal` en cas de succès.
   */
  async _onSendEmailCode() {
    const email = $('#email').val();

    if (!Validator.isValidEmail(email)) {
      this.displayTextError(
        '#email-error',
        rcmail.gettext('mel_metapage.email_format_error'),
      );
      return;
    }

    try {
      const data = await BnumConnector.connect(
        BnumConnector.connectors.settings_da_set_email_recup,
        { params: { _val: email, _send_mail: true } },
      );

      if (BnumConnector.is_on_progress(data)) {
        throw new Error("Le connecteur n'est pas encore implémenté !");
      }

      if (data.has_error) {
        console.error('[DA] Erreur envoi e-mail :', data);
        this.displayTextError(
          '#email-error',
          rcmail.gettext('mel_metapage.send_email_error'),
          100000,
        );
        return;
      }

      this._closeCurrentDialog();
      this.verification_mail_modal();
    } catch (error) {
      console.error('[DA] _onSendEmailCode :', error);
    }
  }

  /**
   * Vérifie le code de confirmation reçu par e-mail via le connecteur.
   * Délègue l'interprétation du code de retour à `_handleEmailCodeResult`.
   */
  async _onVerifyEmailCode() {
    try {
      const data = await BnumConnector.connect(
        BnumConnector.connectors.settings_da_set_token_otp,
        { params: { _token: $('#code').val().toString() } },
      );

      if (BnumConnector.is_on_progress(data)) {
        throw new Error("Le connecteur n'est pas encore implémenté !");
      }

      if (data.has_error) {
        console.error('[DA] Erreur vérification code e-mail :', data);
        return;
      }

      this._handleEmailCodeResult(data.datas);
    } catch (error) {
      console.error('[DA] _onVerifyEmailCode :', error);
    }
  }

  /**
   * Interprète le code de retour de la vérification par e-mail.
   * Utilise une table de correspondance plutôt qu'un `switch` pour rester ouvert à l'extension.
   * @param {number} result - Code de retour : `-1` expiré, `0` invalide, `1` succès.
   */
  _handleEmailCodeResult(result) {
    const errorKeys = {
      [-1]: 'mel_metapage.code_expired',
      [0]: 'mel_metapage.wrong_code',
    };

    if (result in errorKeys) {
      this.displayTextError('#error', rcmail.gettext(errorKeys[result]));
      return;
    }

    if (result === 1) {
      this._closeCurrentDialog();
      const plugin = rcmail.triggerEvent('da.mail_changed.after', {
        break: false,
        modal: this,
      });
      if (!(plugin?.break ?? false)) {
        this.application_modal();
      }
      return;
    }

    this.displayTextError('#error', rcmail.gettext('mel_metapage.error'));
  }

  /**
   * Copie la clé secrète dans le presse-papier et met à jour l'icône de retour visuel.
   */
  _onCopyToClipboard() {
    const value = $('#code_to_copy').val();
    navigator.clipboard
      .writeText(value)
      .then(() => {
        $('#copy-icon').text('done').fadeIn();
        setTimeout(() => $('#copy-icon').text('content_copy').fadeIn(), 3000);
      })
      .catch((err) =>
        console.error('[DA] Copie presse-papier impossible :', err),
      );
  }

  /**
   * Vérifie le code TOTP saisi en interrogeant le serveur.
   * Lance `_saveTotpConfiguration` si le code est valide.
   */
  _onVerifyTotpCode() {
    const code = $('#code_to_check').val();

    if (!code.length) {
      this.displayTextError(
        '#error',
        rcmail.gettext('mel_metapage.enter_code'),
      );
      return;
    }

    $.post(
      `./?_action=plugin.mel_doubleauth-checkcode&code=${code}`,
      (response) => {
        if (response === rcmail.gettext('code_ok', 'mel_doubleauth')) {
          rcmail.env.continueWithUser = true;
          this._saveTotpConfiguration();
        } else {
          this.displayTextError(
            '#error',
            rcmail.gettext('mel_metapage.wrong_code'),
          );
        }
      },
    );
  }

  /**
   * Sauvegarde l'activation de la 2FA avec les codes de récupération générés aléatoirement.
   * Navigue vers `closing_modal` en cas de succès.
   */
  _saveTotpConfiguration() {
    new Mel_Promise(async () => {
      const busy = rcmail.set_busy(true, 'loading');
      const $buttons = $('#verification-application button');

      $buttons.addClass('disabled').attr('disabled', 'disabled');

      const max =
        (
          await BnumConnector.connect(
            BnumConnector.connectors.settings_da_get_recovery_code_max,
            {},
          )
        )?.datas ?? 4;

      const recoveryCodes = Array.from({ length: max }, () =>
        this._generateNumericCode(6),
      );

      await MelObject.Empty().http_internal_post({
        task: 'settings',
        action: 'plugin.mel_doubleauth-save',
        params: { p2FA_activate: 1, '2FA_recovery_codes': recoveryCodes },
        on_success: () => {
          rcmail.set_busy(false, 'loading', busy);
          window.double_fact_saved = true;
          console.log('(!!!i) [AFTER SAVE]', window.double_fact_saved);
          this._closeCurrentDialog();
          this.closing_modal();
        },
        on_error: (...args) =>
          console.error('[DA] Erreur sauvegarde TOTP :', ...args),
      });

      if (rcmail.busy) rcmail.set_busy(false, 'loading', busy);
      if ($buttons.length)
        $buttons.removeClass('disabled').removeAttr('disabled');
    });
  }

  // ─── Utilitaires privés ────────────────────────────────────────────────────

  /**
   * Ouvre une boîte de dialogue jQuery UI avec les paramètres standard.
   * Centralise le trio répétitif : `show_popup_dialog` + `createProgressPoint`
   * + liaison du bouton de fermeture de la barre de titre.
   *
   * @param {string} html - Contenu HTML de la boîte.
   * @param {object} options - Paramètres d'affichage.
   * @param {number} options.width - Largeur en pixels.
   * @param {number} options.height - Hauteur en pixels.
   * @param {number} [options.progressStep] - Étape à activer dans l'indicateur de progression.
   * @param {boolean} [options.bindTitlebarClose=false] - Lier le bouton ✕ à un événement rcmail.
   * @param {string} [options.titlebarCloseEvent] - Nom de l'événement rcmail déclenché à la fermeture.
   * @param {Function} [options.onClose] - Callback jQuery UI `close(event, ui)`.
   */
  _openModal(
    html,
    {
      width,
      height,
      progressStep,
      bindTitlebarClose = false,
      titlebarCloseEvent,
      onClose,
    } = {},
  ) {
    rcmail.show_popup_dialog(html, '', null, {
      width,
      resizable: false,
      height,
      ...(onClose && { close: onClose }),
    });

    if (progressStep !== undefined) {
      this.createProgressPoint(progressStep);
    }

    if (bindTitlebarClose && titlebarCloseEvent) {
      $('.ui-dialog button.ui-dialog-titlebar-close').click(() => {
        this.rcmail().triggerEvent(titlebarCloseEvent, this);
      });
    }
  }

  /**
   * Décale le focus vers le premier élément correspondant au sélecteur CSS.
   * Le délai de 10 ms laisse jQuery UI terminer son rendu avant de déplacer le focus.
   * @param {string} selector - Sélecteur CSS de l'élément cible.
   */
  _deferFocus(selector) {
    setTimeout(() => $(selector).first().focus(), 10);
  }

  /**
   * Fabrique un callback de fermeture compatible avec l'option `close` de jQuery UI.
   * Le callback supprime l'élément du DOM puis appelle `checkBeforeClose`.
   *
   * Note : jQuery UI passe l'élément `.ui-dialog-content` comme `this` dans le callback,
   * d'où l'usage d'une `function` classique plutôt qu'une arrow function.
   *
   * @returns {Function} Callback à passer à l'option `close` de jQuery UI.
   */
  _createCloseCallback() {
    const self = this;
    return function () {
      $(this).remove();
      self.checkBeforeClose();
    };
  }

  /**
   * Calcule les dimensions de la boîte et le texte d'introduction
   * en fonction de la date butoir de la double authentification forcée.
   * @returns {{ width: number, height: number, text: string }} Paramètres résolus.
   */
  _resolveIntroDeadline() {
    const deadlineDate = rcmail.env.double_authentification_date_butoir?.date;

    if (!deadlineDate) {
      return {
        width: 650,
        height: 210,
        text: rcmail.gettext('mel_metapage.introduction_text_without_date'),
      };
    }

    const deadline = moment(deadlineDate);
    const now = moment();

    if (deadline.isBefore(now)) {
      return {
        width: 700,
        height: 230,
        text: rcmail.gettext('mel_metapage.introduction_deadline_passed_text'),
      };
    }

    return {
      width: 650,
      height: 210,
      text: rcmail
        .gettext('mel_metapage.introduction_text')
        .replace('%%date%%', deadline.diff(now, 'days')),
    };
  }

  /**
   * Ouvre la boîte de dialogue `add_key_modal` en récupérant ou réutilisant la clé secrète.
   * Si aucune clé n'est en mémoire, effectue une requête serveur pour en créer une nouvelle.
   * @param {string} html - Contenu HTML déjà généré pour la modale.
   */
  _initAddKeyDialog(html) {
    const openDialog = () => {
      rcmail.show_popup_dialog(html, '', null, {
        width: 600,
        resizable: false,
        height: 420,
        close: this._createCloseCallback(),
      });
      this.createProgressPoint(3);
      this.createQrCode('qr-code', rcmail.env.userSecret);
      $('#code_to_copy').val(rcmail.env.userSecret);
    };

    // Chemin heureux en premier : évite l'imbrication inutile.
    if (rcmail.env.userSecret) {
      openDialog();
      return;
    }

    mel_metapage.Functions.post(
      mel_metapage.Functions.url(
        'mel_metapage',
        'plugin.mel_doubleauth-adduser',
      ),
      {},
      (rawData) => {
        const datas = JSON.parse(rawData);
        if (datas.code) {
          rcmail.env.userSecret = Base32.encode(datas.code);
          openDialog();
        } else {
          rcmail.display_message(
            rcmail.gettext('mel_metapage.doubleauth-error'),
            'error',
          );
        }
      },
      () =>
        rcmail.display_message(
          rcmail.gettext('mel_metapage.doubleauth-error'),
          'error',
        ),
    );
  }

  /**
   * Enregistre un gestionnaire `beforeunload` unique (idempotent).
   * Si la double authentification n'est pas finalisée lors de la fermeture
   * de l'onglet, supprime l'utilisateur TOTP côté serveur via `sendBeacon`.
   */
  _registerBeforeUnload() {
    if (window._bnum_da_on_quit) return;

    $(window).on('beforeunload', () => {
      console.log('(!!!i) [BEFORE UNLOAD]', window.double_fact_saved);
      if (window.double_fact_saved === false) {
        console.log('(!!!i) [BEFORE UNLOAD/false]', window.double_fact_saved);
        navigator.sendBeacon(rcmail.url('plugin.mel_doubleauth-removeuser'));
      }
    });

    window._bnum_da_on_quit = true;
  }

  /**
   * Génère un code numérique aléatoire de la longueur spécifiée.
   * @param {number} length - Nombre de chiffres souhaités.
   * @returns {string} Code numérique sous forme de chaîne de caractères.
   */
  _generateNumericCode(length) {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join(
      '',
    );
  }

  /**
   * Intercepte `BnumConnector.connect` pour désactiver les boutons de la boîte
   * de dialogue pendant les appels réseau, puis les réactiver à la réponse.
   *
   * Utilise `double_auth_modal.Instance` (référence statique) pour ne pas
   * maintenir une référence forte vers `this` dans la closure.
   * La méthode est idempotente grâce au marqueur `_da_patched`.
   */
  _patchBnumConnector() {
    if (BnumConnector._da_patched) return;

    const originalConnect = BnumConnector.connect;
    BnumConnector.connect = async (...args) => {
      double_auth_modal.Instance?.disable_buttons?.();
      const data = await originalConnect.call(BnumConnector, ...args);
      double_auth_modal.Instance?.enable_buttons?.();
      return data;
    };

    BnumConnector._da_patched = true;
  }

  // ─── API publique ──────────────────────────────────────────────────────────

  /**
   * Vérifie si le flux n'a pas été finalisé avant la fermeture de la boîte de dialogue.
   * Si une clé secrète existe et que l'utilisateur n'a pas complété le flux,
   * supprime le compte TOTP côté serveur et efface la clé locale.
   */
  checkBeforeClose() {
    if (rcmail.env.userSecret && !rcmail.env.continueWithUser) {
      alert(rcmail.gettext('mel_metapage.doubleauth_not_activated'));
      rcmail.env.userSecret = null;
      rcmail.http_request('plugin.mel_doubleauth-removeuser');
    }
  }

  /**
   * Affiche un message d'erreur temporaire dans l'élément désigné,
   * puis le masque après le délai spécifié.
   * @param {string} selector - Sélecteur CSS du conteneur d'erreur.
   * @param {string} message - Texte du message d'erreur.
   * @param {number} [duration=2000] - Durée d'affichage en millisecondes.
   */
  displayTextError(selector, message, duration = 2000) {
    $(selector).text(message).fadeIn();
    setTimeout(() => $(selector).fadeOut(), duration);
  }

  /**
   * Génère et insère un QR code TOTP dans l'élément DOM identifié.
   * L'URL codée suit le format standard `otpauth://totp/`.
   * @param {string} id - Identifiant DOM de l'élément cible (sans `#`).
   * @param {string} secret - Clé secrète encodée en Base32.
   */
  createQrCode(id, secret) {
    const otpUrl = `otpauth://totp/Bnum:${rcmail.env.username}?secret=${secret}&issuer=Bnum`;
    new QRCode(document.getElementById(id), {
      text: otpUrl,
      width: 150,
      height: 150,
      colorDark: '#000',
      colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.L,
    });
    $(`#${id}`).prop('title', '');
  }

  /**
   * Met à jour l'indicateur de progression affiché dans le titre de la boîte de dialogue.
   * @param {number} numActivePoints - Nombre de points à activer (entre 0 et `nb_max_states`).
   */
  createProgressPoint(numActivePoints) {
    if (numActivePoints < 0 || numActivePoints > this.nb_max_states) {
      console.error(
        '[DA] createProgressPoint : valeur hors limites (attendu 0–4).',
      );
      return;
    }

    const container = document.createElement('div');
    container.className = 'double-auth-modal-progress';

    for (let i = 0; i < this.nb_max_states; i++) {
      const point = document.createElement('div');
      point.className = `progress-point${i < numActivePoints ? ' active' : ''}`;
      container.appendChild(point);
    }

    $('.ui-dialog-title').html(container);
  }
}
