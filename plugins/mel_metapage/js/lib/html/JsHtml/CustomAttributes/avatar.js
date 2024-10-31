import { Cookie } from '../../../classes/cookies.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import { BnumEvent, MelConditionnalEvent } from '../../../mel_events.js';
import { MelObject } from '../../../mel_object.js';
import { HtmlCustomTag } from './classes.js';

export { AvatarElement };

//#region JsDoc
/**
 * Contient la classe lié aux éléments custom "bnum-avatar" ainsi que toutes les classes et fonctions utile.
 *
 * Le chargement de se module implique le chargement des images après le chargement de la page.
 * @module WebComponents/Avatar
 * @tutorial webcomponent-avatar
 * @local OnImageLoadCallback
 * @local OnImageNotLoadCallback
 * @local AvatarElement
 * @local onLoaded
 * @local AvatarEvent
 * @local AvatarLoadEvent
 * @local AvatarNotLoadEvent
 */

/**
 * @callback OnImageLoadCallback
 * @param {HTMLImageElement} img Node de l'image chargée
 * @param {AvatarElement} avatarElement Node qui contient l'image
 * @returns {void}
 */

/**
 * @callback OnImageNotLoadCallback
 * @param {AvatarElement} avatarElement Element qui contient l'image qui n'a pas été chargé
 * @returns {null | undefined | {stop:boolean}}
 */
//#endregion

//#region Constantes
/**
 * Style dans le shadow dom de l'image
 * @type {string}
 * @constant
 * @package
 */
const STYLE_BASE = `
      img {
        filter: blur(0.2em);
        transition: filter 0.5s;
        object-fit: cover;
        border: var(--avatar-border);
        border-radius: 100%;
        width:100%;
        height:100%;
        box-sizing: var(--avatar-box-sizing);
      }
      `;
/**
 * Style dans le shadow dom de l'image lorsqu'elle est chargée
 * @type {string}
 * @constant
 * @package
 */
const STYLE_LOADED = `
      img {
        filter: blur(0)!important;
        --avatar-border: var(--avatar-border-loaded)!important;
        --avatar-box-sizing: var(--avatar-box-sizing-loaded)!important;
      }
      `;
/**
 * Style du host
 * @type {string}
 * @constant
 * @package
 */
const STYLE_HOST = `
        :host {
          width:%0%;
          height:%0%;
        }
      `;
/**
 * Style dans le shadow dom lorsque l'image n'est pas chargé
 * @type {string}
 * @constant
 * @package
 */
const STYLE_ERROR = `
      .absolute-center {
          margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translateY(-50%) translateX(-50%);
    transform: translateY(-50%) translateX(-50%);
    font-size: xx-large;
    color: var(--mel-button-text-color);
    }

    .no-picture {
    position:relative;
    display: block;
width: 100%;
height: 100%;
    }`;
/**
 * Nom de l'évènement lorsque l'image est chargée
 * @type {string}
 * @constant
 * @package
 * @default 'api:imgload'
 */
const EVENT_IMAGE_LOAD = 'api:imgload';
/**
 * Nom de l'évènement lorsque l'image n'est pas chargée
 * @type {string}
 * @constant
 * @package
 * @default 'api:imgloaderror'
 */
const EVENT_IMAGE_NOT_LOAD = 'api:imgloaderror';
/**
 * Nom du cookie qui indique que l'avatar n'a pas pu être chargé.
 * @default 'bnum_avatar_v2'
 * @type {string}
 * @constant
 * @package
 */
const COOKIE_NAME = 'bnum_avatar_v2';
/**
 * Nombre de jour à ajouter à aujourd'hui pour créer la date d'éxpiration du cookie.
 * @default 2
 * @type {number}
 * @constant
 * @package
 */
const COOKIE_EXPIRATION = 2;
//#endregion

//#region Classes d'évènements
/**
 * @class
 * @classdesc Evènement de base pour l'avatar.
 * @abstract
 * @extends CustomEvent
 * @package
 */
class AvatarEvent extends CustomEvent {
  /**
   * Le principe est que cette classe ainsi que les classes filles auront une valeur de retour en mémoire.
   *
   * Cette valeur de retour pourra ensuite être utiliser par les `BnumEvent` ou d'autres fonctions.
   * @param {string} type Type d'évènement
   * @param {Object<string, *>} config Configuration de l'évènement
   */
  constructor(type, config = {}) {
    super(type, config);

    /**
     * Données de retour.
     * @private
     * @type {?any}
     */
    this._return_data = null;
  }

  /**
   * Permet de données une valeur qui sera mise en mémoire pour plus tard.
   * @param {*} value Valeur à mettre en mémoire.
   */
  setReturnData(value) {
    this._return_data = value;
  }

  /**
   * Récupère la valeur mise en mémoire.
   * @returns {?*}
   */
  getReturnData() {
    return this._return_data;
  }
}

/**
 * @class
 * @classdesc Evènement de type `api:imgload`.
 * @extends AvatarEvent
 * @package
 */
class AvatarLoadEvent extends AvatarEvent {
  /**
   * Evènement reçu lorsque l'on fait un listener sur `api:imgload`.
   * @param {HTMLImageElement} imageNode Image qui a été changée
   * @param {AvatarElement} avatarNode Node parente
   */
  constructor(imageNode, avatarNode) {
    super(EVENT_IMAGE_LOAD);

    /**
     * @private
     */
    this._imageNode = imageNode;
    /**
     * @private
     */
    this._avatarNode = avatarNode;
  }

  /**
   * Récupère l'image
   * @returns {HTMLImageElement}
   */
  image() {
    return this._imageNode;
  }

  /**
   * Récupère l'avatar
   * @returns {AvatarElement}
   */
  avatar() {
    return this._avatarNode;
  }
}

/**
 * @class
 * @classdesc Evènement de type `api:imgloaderror`.
 * @extends AvatarEvent
 * @package
 */
class AvatarNotLoadEvent extends AvatarEvent {
  /**
   * Evènement reçu lorsque l'on fait un listener sur `api:imgloaderror`.
   * @param {AvatarElement} avatarNode Node parente
   */
  constructor(avatarNode) {
    super(EVENT_IMAGE_NOT_LOAD);

    /**
     * @private
     */
    this._avatarNode = avatarNode;
  }

  /**
   * Récupère l'avatar
   * @returns {AvatarElement}
   */
  avatar() {
    return this._avatarNode;
  }

  /**
   * Empêche la fonction _on_error de s'éxécuter normalement.
   * @returns {void}
   */
  stop() {
    return this.setReturnData({ stop: true });
  }
}
//#endregion

//#region Element Html
/**
 * @class
 * @classdesc Gestion de la balise bnum-avatar.
 * @extends HtmlCustomTag
 * @tutorial webcomponent-avatar
 * @frommodule WebComponents/Base
 */
class AvatarElement extends HtmlCustomTag {
  /**
   * Contient ou non, un timeout lié au chargement des avatars.
   *
   * Les avatars se chargent au bout de 5 secondes.
   * @type {null | undefined |number }
   * @private
   */
  #timeout;

  /**
   * La balise bnum-avatar permet de charger l'avatar de l'utilisateur en cours ou d'un utilisateur du bnum.
   *
   * Le chargement des avatars se fait après le chargement de la page. On peut néanmoins le forcer avec le data `data-forceload`.
   *
   * Les évènements sont api:imgload et api:imgloaderror.
   *
   * Liste des data :
   *
   * data-email => email de l'utilisateur dont on souhaite l'avatar. Si indéfini, se sera l'utilisateur en cours. (Optionnel)
   *
   * data-force-size => taille de l'objet, en pourcentage. (Optionnel)
   *
   * data-f100 => Equivalent de `data-force-size=100`
   *
   * data-forceload => Force le chargement de l'image
   *
   */
  constructor() {
    super();

    /**
     * Email qui permettra de retrouver l'avatar de l'utilisateur
     * @package
     * @type {string}
     */
    this._email = null;
    this._id = null;
    /**
     * Taille (de 0 à 100) de la balise.
     *
     * Si null, ça sera le css qui s'en chargera.
     * @package
     * @type {string | number | null}
     */
    this._force = null;
    this.#timeout = null;
    /**
     * Action à faire lorsque l'image est chargée.
     * @type {BnumEvent<OnImageLoadCallback>}
     * @frommodule WebComponents/Avatar {@linkto OnImageLoadCallback}
     */
    this.onimgload = new BnumEvent();
    /**
     * Action à faire lorsque l'image n'a pas réussie à être chargée.
     * @type {BnumEvent<OnImageNotLoadCallback>}
     * @frommodule WebComponents/Avatar {@linkto OnImageNotLoadCallback}
     */
    this.onimgloaderror = new BnumEvent();

    //Ajoute les évènements liés aux listeners javascript/jquery.
    this.onimgload.push((...args) => {
      const [imageNode, avatarElement] = args;
      this.dispatchEvent(new AvatarLoadEvent(imageNode, avatarElement));
    });

    this.onimgloaderror.push((...args) => {
      const [avatarElement] = args;
      let customEvent = new AvatarNotLoadEvent(avatarElement);
      this.dispatchEvent(customEvent);

      return customEvent.getReturnData();
    });
  }

  /**
   * Est appelé par le navigateur.
   */
  connectedCallback() {
    //Init
    Object.defineProperty(this, '_email', {
      value: this.dataset.email || rcmail?.env?.current_user?.email || '?',
    });

    Object.defineProperty(this, '_id', {
      value: this.dataset.id,
    });

    this.removeAttribute('data-email');
    this.removeAttribute('data-id');

    if (this.dataset.f100) {
      this.setAttribute('data-force-size', '100');
      this.removeAttribute('data-f100');
    }

    if (AvatarElement.IsLoaded) {
      this.setAttribute('data-forceload', true);
    }

    if (!this.dataset.forceload) this.setAttribute('data-needcreation', true);

    //Setup
    this.style.display = 'block';

    let shadow = this.attachShadow({ mode: 'open' });

    let img = document.createElement('img');
    img.src = 'skins/elastic/images/contactpic.svg';

    let style = document.createElement('style');

    let style_ex = EMPTY_STRING;

    if (this.dataset.forceSize) {
      this._force = this.dataset.forceSize;
      style_ex = this._get_style_force();
      this.removeAttribute('data-force-size');
    }

    style.append(document.createTextNode(STYLE_BASE + style_ex));

    shadow.append(style, img);

    //end
    img = null;
    style = null;
    if (this._is_mine() && this._cookie_exist()) {
      this.removeAttribute('data-forceload');
      this._on_error();
      console.info("[avatar]Des cookies d'avatar non chargés ont été trouvé !");
    } else if (this.dataset.forceload) {
      setTimeout(() => {
        this.removeAttribute('data-needcreation');
        this.removeAttribute('data-forceload');
        this.update_img();
      }, 10);
    } else {
      this.#timeout = setTimeout(() => {
        this.removeAttribute('data-needcreation');
        this.update_img();
      }, 5 * 1000);
    }
  }

  /**
   * Change la source de l'image par le bonne source et gère en cas d'erreur ou non.
   */
  update_img() {
    const params = {};

    if (this._email) params._email = this._email;

    if (this._id) params._id = this._id;

    let img = this.shadowRoot.querySelector('img');
    img.onload = this._on_load.bind(this);
    img.onerror = this._on_error.bind(this);
    img.src = MelObject.Empty().url('mel_metapage', {
      action: 'avatar',
      params,
    });

    img = null;
  }

  /**
   * Vérifie si le cookie de l'avatar de l'utilisateur principal existe.
   * @private
   * @returns {boolean}
   */
  _cookie_exist() {
    return !!Cookie.get_cookie(COOKIE_NAME)?.value;
  }

  /**
   * Vérifie si l'adresse email est celle de l'utilisateur principal.
   * @private
   * @returns {boolean}
   */
  _is_mine() {
    return this._email === (rcmail?.env?.current_user?.email ?? '??');
  }

  /**
   * Injecte le cookie.
   * @private
   * @returns {Cookie}
   */
  _set_cookie() {
    return Cookie.set_cookie(
      COOKIE_NAME,
      this._email,
      moment().add(COOKIE_EXPIRATION, 'd').toDate(),
    );
  }

  /**
   * Récupère le block de style lié au forcage de la taille
   * @package
   * @returns {string}
   */
  _get_style_force() {
    return STYLE_HOST.replaceAll('%0', this._force);
  }

  /**
   * Appelé lorsque l'image est chargée.
   * @package
   * @returns {AvatarElement} Chaîne
   */
  _on_load() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }

    this.removeAttribute('data-needcreation');

    let style = document.createElement('style');
    style.append(document.createTextNode(STYLE_LOADED));

    this.shadowRoot.append(style);
    style = null;

    let img = this.shadowRoot.querySelector('img');
    img.onload = null;
    img.onerror = null;

    this.onimgload.call(img, this);

    return this;
  }

  /**
   * Est appelé lorsque l'image ne se charge pas
   * @returns {AvatarElement} Chaîne
   * @package
   */
  _on_error() {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
      this.#timeout = null;
    }

    if (!this._cookie_exist() && this._is_mine()) {
      this._set_cookie();
      console.info(
        "[avatar]Les données de cookies ont été sauvegardé car une image l'utilisateur n'a pas défini d'avatar !",
      );
    }

    this.removeAttribute('data-needcreation');

    let error_data = this.onimgloaderror.call(this);

    if (Array.isArray(error_data)) {
      for (const element of error_data) {
        if (element.stop === true) return this;
      }
    } else if (error_data && error_data.stop === true) return this;

    const txt = this._email;
    this.shadowRoot.querySelector('img').remove();
    this.shadowRoot.querySelector('style').remove();

    let element = document.createElement('span');
    element.classList.add('no-picture');

    let span = document.createElement('span');
    span.appendChild(
      document.createTextNode(txt.substring(0, 1).toUpperCase()),
    );
    span.classList.add('absolute-center');

    element.appendChild(span);

    let style = document.createElement('style');

    style.append(
      document.createTextNode(
        STYLE_ERROR + (this._force ? this._get_style_force() : EMPTY_STRING),
      ),
    );

    this.shadowRoot.append(style, element);

    element = null;
    span = null;
    style = null;

    return this;
  }

  /**
   *
   * @param {*} param0
   * @returns {AvatarElement}
   */
  static Create({ id = null, email = null, force = null } = {}) {
    let node = document.createElement('bnum-avatar');

    if (email) node.setAttribute('data-email', email);

    if (id) node.setAttribute('data-id', id);

    if (force) node.setAttribute('data-forceload', true);

    return node;
  }
}

/**
 * Si la page a été chargé et les avatars aussi.
 * @static
 * @readonly
 * @type {boolean}
 */
AvatarElement.IsLoaded;

Object.defineProperty(AvatarElement, 'IsLoaded', {
  get() {
    return !!window.avatarPageLoaded;
  },
});
//#endregion
//#region Definition
{
  const TAG = 'bnum-avatar';

  if (!customElements.get(TAG)) customElements.define(TAG, AvatarElement);
}
//#endregion
window.addEventListener('load', function () {
  onLoaded();
});
//#region Chargement
/**
 * Charge tout les avatars qui ont besoin d'être chargés.
 * @package
 */
function onLoaded() {
  let imagesToLoad = document.querySelectorAll(
    'bnum-avatar[data-needcreation]',
  );

  for (const image of imagesToLoad) {
    image.update_img();
  }

  window.avatarPageLoaded = true;
}
//#endregion
