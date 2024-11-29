import { WorkspaceObject } from './WorkspaceObject.js';

/**
 * Classe des avatars qui doivent avoir une couleur de texte changée
 * @type {string}
 * @default 'avatar_member'
 * @constant
 */
const CLASS_AVATAR = 'avatar_member';
/**
 * Couleur hexadécimale de la couleur noire
 * @type {string}
 * @default '#000000'
 * @constant
 */
const COLOR_BLACK = '#000000';
/**
 * Couleur hexadécimale de la couleur blanche
 * @type {string}
 * @default '#FFFFFF'
 * @constant
 */
const COLOR_WHITE = '#FFFFFF';
/**
 * Style de l'avatar quand la couleur à besoin d'être changée.<br/>
 *
 * `%0` doit être remplacé par une couleur.
 * @type {string}
 * @default '.no-picture{--mel-button-text-color:%0;}'
 * @constant
 */
const STYLE_AVATAR = '.no-picture{--mel-button-text-color:%0;}';

/**
 * @class
 * @classdesc Contient le fonctionnement de la page des utilisateurs
 * @extends WorkspaceObject
 */
export class PageUser extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._update_avatar_color();
  }

  /**
   * Change la couleur de texte des avatars pour l'accessibilité.<br/>
   *
   * L'asynchrone est permis car la page n'est pas forcément affichée tout de suite.
   * @async
   * @private
   * @returns {Promise<void>}
   */
  async _update_avatar_color() {
    const color = this.workspace.color;

    const avatars = document.querySelectorAll(`.${CLASS_AVATAR}`);

    if (avatars.length) {
      let rgb_1;
      let rgb_2;
      let true_color;
      for (let index = 0, len = avatars.length; index < len; ++index) {
        const element = avatars[index];

        rgb_1 = mel_metapage.Functions.colors.kMel_extractRGB(color);
        rgb_2 = mel_metapage.Functions.colors.kMel_extractRGB(COLOR_BLACK);

        if (mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(rgb_1, rgb_2))
          true_color = COLOR_BLACK;
        else true_color = COLOR_WHITE;

        if (element.shadowRoot)
          element.shadowRoot.appendChild(this._create_style(true_color));
        else element.style.color = true_color;
      }
    }
  }

  /**
   * Créer uune node style avec la nouvelle couleur du texte de l'avatar en cas de non-chargement de l'avatar.
   * @param {string} color Hexadécimale
   * @returns {HTMLStyleElement}
   * @private
   */
  _create_style(color) {
    let style = document.createElement('style');

    style.appendChild(
      document.createTextNode(STYLE_AVATAR.replaceAll('%0', color)),
    );

    return style;
  }

  /**
   * Démarre le fonctionne de la page des utilisateurs
   * @static
   * @returns {PageUser}
   */
  static Start() {
    return new PageUser();
  }
}

PageUser.Start();
