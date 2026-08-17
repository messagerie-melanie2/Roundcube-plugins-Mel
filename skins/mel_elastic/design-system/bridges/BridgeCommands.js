import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
import { CONFIG_FOLDER_SPACE } from './constants.js';

/**
 * Classe permettant de gérer les commandes du bridge entre le design system et Roundcube.
 * Fournit des méthodes pour mettre à jour le style des dossiers mails et enregistrer des commandes personnalisées.
 */
export default class BridgeCommands extends MelObject {
  /** @type {BridgeCommands | null} Instance unique du singleton. */
  static #_instance = null;
  /**
   * Accès à l'instance unique de BridgeCommands (singleton).
   * @returns {BridgeCommands} L'instance unique de la classe.
   */
  static get Instance() {
    return (this.#_instance ??= new BridgeCommands());
  }

  /**
   * Clés des variables d'environnement Roundcube utilisées par BridgeCommands.
   * @type {{ TASK: string, MMP_CONFIGS: string }}
   * @private
   */
  static #_ENVS = {
    TASK: 'task',
    MMP_CONFIGS: 'mel_metapage_mail_configs',
  };

  /**
   * Constructeur privé — utiliser {@link BridgeCommands.Instance} pour accéder au singleton.
   */
  constructor() {
    super();
  }

  /**
   * Met à jour le style CSS des dossiers mails.
   * Si la clé n'est pas CONFIG_FOLDER_SPACE, exécute une commande alternative.
   * Sinon, met à jour la configuration et applique le style si la tâche courante est "mail".
   * @param {Object} args - Les arguments contenant la clé et la valeur à mettre à jour.
   * @param {Function} updateFolderStyleFunc - La fonction à appeler pour mettre à jour le style des dossiers.
   */
  command_update_mail_css(updateFolderStyleFunc, args) {
    const command = 'update_mail_css';
    const old_command = `${command}_old`;
    const { key, value } = args;
    if (key !== CONFIG_FOLDER_SPACE)
      return this.execCommand(old_command, { props: args });

    this.get_env(BridgeCommands.#_ENVS.MMP_CONFIGS)[CONFIG_FOLDER_SPACE] =
      value[CONFIG_FOLDER_SPACE];

    if (this.get_env(BridgeCommands.#_ENVS.TASK) === 'mail') {
      updateFolderStyleFunc();
    } else {
      const $frame = this.select_frame('mail')?.[0];

      if ($frame) {
        $frame.contentWindow?.rcmail?.command(command, args);
      }
    }
  }

  /**
   * Enregistre une commande Roundcube personnalisée.
   * @param {string} key - Le nom de la commande.
   * @param {Function} callback - La fonction à exécuter lors de l'appel de la commande.
   * @param {Object} [options] - Options supplémentaires.
   * @param {Object} [options.thisArgs=this] - Le contexte d'exécution du callback.
   * @param {Array} [options.args=[]] - Les arguments à passer au callback.
   * @param {boolean} [options.enabled=true] - Si la commande est activée ou non.
   */
  command_register(
    key,
    callback,
    { thisArgs = this, args = [], enabled = true } = {},
  ) {
    this.rcmail().register_command(
      key,
      callback.bind(thisArgs, ...args),
      enabled,
    );
  }
}
