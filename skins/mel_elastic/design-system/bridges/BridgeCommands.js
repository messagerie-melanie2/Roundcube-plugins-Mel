import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
import { CONFIG_FOLDER_SPACE } from './constants.js';

/**
 * Classe permettant de gérer les commandes du bridge entre le design system et Roundcube.
 * Fournit des méthodes pour mettre à jour le style des dossiers mails et enregistrer des commandes personnalisées.
 */
export default class BridgeCommands extends MelObject {
  static #_instance = null;
  /**
   * Accès à l'instance unique de BridgeCommands (singleton).
   * @returns {BridgeCommands} L'instance unique de la classe.
   */
  static get Instance() {
    return (this.#_instance ??= new BridgeCommands());
  }
  static #_ENVS = {
    TASK: 'task',
    MMP_CONFIGS: 'mel_metapage_mail_configs',
  };

  constructor() {
    super();
  }

  /**
   * Met à jour le style CSS des dossiers mails.
   * Si la clé n'est pas CONFIG_FOLDER_SPACE, exécute une commande alternative.
   * Sinon, met à jour la configuration et applique le style si la tâche courante est "mail".
   * @param {Object} args - Les arguments contenant la clé et la valeur à mettre à jour.
   */
  command_update_mail_css(args) {
    const { key, value } = args;
    if (args.key !== CONFIG_FOLDER_SPACE)
      return this.execCommand('update_mail_css_old', { props: args });

    this.get_env(BridgeCommands.#_ENVS.MMP_CONFIGS)[CONFIG_FOLDER_SPACE] =
      value[CONFIG_FOLDER_SPACE];

    if (this.get_env(BridgeCommands.#_ENVS.TASK) === 'mail') {
      this.updateFolderStyle();
    } else {
      const $frame = this.select_frame('mail')?.[0];

      if ($frame) {
        $frame.contentWindow?.rcmail?.command(key, args);
      }
    }
  }

  /**
   * Enregistre une commande Roundcube personnalisée.
   * @param {string} key - Le nom de la commande.
   * @param {Function} callback - La fonction à exécuter lors de l'appel de la commande.
   * @param {Object} [options] - Options supplémentaires.
   * @param {Object} [options.thisArgs=this] - Le contexte d'exécution du callback.
   * @param {boolean} [options.enabled=true] - Si la commande est activée ou non.
   */
  command_register(key, callback, { thisArgs = this, enabled = true } = {}) {
    this.rcmail().register_command(key, callback.bind(thisArgs), enabled);
  }
}
