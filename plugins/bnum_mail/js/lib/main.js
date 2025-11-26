import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

class BnumMail extends MelObject {
  constructor() {
    super();
  }

  /**
   * Récupère les UIDs des messages sélectionnés ou de l'email ouvert.
   * @returns {Array<string>} Tableau des UIDs des messages sélectionnés ou de l'email ouvert.
   * @readonly
   */
  get uids() {
    const rcmail = this.rcmail();
    return rcmail.message_list && rcmail.message_list.get_selection().length > 0
      ? rcmail.message_list.get_selection()
      : [rcmail.env.uid];
  }

  main() {
    super.main();

    this.rcmail().register_command('plugin.archive_save_attachments', () => {
      this.http_internal_post({
        task: 'mailext',
        action: 'archive_save_attachments',
        params: {
          _uids: this.uids,
          _mbox: this.get_env('mailbox'),
          _dest: '/',
        },
      });
    });

    this.rcmail().addEventListener('init', () => {
      this.rcmail().message_list.addEventListener('select', () => {
        this.update_archive_button_state();
      });
    });

    // Optionnel : Lancer la vérification au chargement initial
    this.update_archive_button_state();
  }

  _isAttachments(uid) {
    const msg = this.rcmail().env.messages[uid];

    if (msg) {
      return (
        msg.flags.attachmentClass ||
        msg.flags.hasattachment ||
        msg.ctype === 'multipart/report' ||
        msg.ctype === 'multipart/encrypted' ||
        (!msg.flags.hasnoattachment &&
          /application\/|multipart\/(m|signed)/.test(msg.ctype))
      );
    }

    return false;
  }

  update_archive_button_state() {
    const rcmail = this.rcmail();
    var uids = this.uids;
    var enable = true;

    uids = uids.filter((uid) => uid !== null && uid !== undefined);

    if (uids.length > 0) {
      for (let i = 0; i < uids.length; i++) {
        // Récupérer la propriété 'attachments' pour l'UID
        // Cette propriété est un booléen (true si le mail a des pièces jointes)
        if (!this._isAttachments(uids[i])) {
          //debugger;
          enable = false;
          break; // S'il y en a au moins un avec PJ, on active et on sort de la boucle
        }
      }
    }

    // Dans la vue simple (messagemenu), si la sélection est vide mais un mail est ouvert,
    // on vérifie les variables d'environnement (si elles sont définies)
    else if (rcmail.env.uid) {
      // Cette variable n'est pas toujours fiable, mais elle sert de fallback dans certains skins.
      if (rcmail.env.attachments_count && rcmail.env.attachments_count > 0) {
        enable = true;
      } else {
        //debugger;
        enable = false;
      }
    } else {
      //debugger;
      enable = false;
    }
    console.log('Archive button enabled:', enable);
    // Active ou désactive la commande/le bouton
    rcmail.enable_command('plugin.archive_save_attachments', enable);
  }
}

new BnumMail();
