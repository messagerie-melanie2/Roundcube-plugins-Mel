import BridgeEvents from '../../design-system/bridges/BridgeEvents.js';
import { ABaseModule } from '../core/ABaseModule.js';

/**
 * Module UI gérant le menu de navigation secondaire (`layout-menu`) sur les
 * écrans mobiles/tactiles : ouverture/fermeture du menu, overlay de fond et
 * délégation des clics sur les liens du menu pour le refermer automatiquement.
 *
 * @extends ABaseModule
 */
export class SecondaryNav extends ABaseModule {
  /**
   * Indique si la délégation d'évènements sur les liens du menu a déjà été
   * mise en place, pour ne l'enregistrer qu'une seule fois.
   *
   * @type {boolean}
   */
  #_menuInitialized = false;

  /**
   * Mode d'écran courant, délégué à l'objet `UI` (skin `mel_elastic`).
   *
   * @type {'large'|'normal'|'small'|'phone'}
   * @readonly
   */
  get mode() {
    return UI.get_screen_mode();
  }

  /**
   * Indique si l'appareil est en mode tactile, délégué à l'objet `UI`.
   *
   * @type {boolean}
   * @readonly
   */
  get isTouch() {
    return UI.is_touch();
  }

  /**
   * Indique si l'on est en contexte mobile : écran au format téléphone ou
   * appareil tactile.
   *
   * @type {boolean}
   * @readonly
   */
  get isMobile() {
    return this.mode === 'phone' /* PAMELLA ==> */ || this.isTouch === true;
  }

  /**
   * Élément DOM du menu de navigation secondaire (`#layout-menu`).
   *
   * @type {?HTMLElement}
   * @readonly
   */
  get layout_menu() {
    return document.getElementById('layout-menu');
  }

  constructor() {
    super();
  }

  /**
   * Initialise les écouteurs du module lors du cycle de vie `go`.
   *
   * @override
   * @protected
   */
  _p_main() {
    this.#_initListeners();
  }

  /**
   * Met en place l'ensemble des écouteurs du module.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_initListeners() {
    return this.#_onMenuClick();
  }

  /**
   * Enregistre l'ouverture du menu au clic sur le bouton `.barup`, puis
   * replace le focus sur le bouton `#menu-small` une fois le menu affiché.
   *
   * @returns {this} L'instance courante, pour chaînage.
   * @private
   */
  #_onMenuClick() {
    const barup = document.querySelector('.barup');

    if (barup) {
      barup.onMenuClick.push(() => {
        this.#_app_menu(true);
        queueMicrotask(() => {
          document.getElementById('menu-small')?.focus?.();
        });
      });
    }

    return this;
  }

  /**
   * Affiche ou masque le menu de navigation secondaire.
   *
   * En contexte mobile, l'affichage ajoute un overlay de fond cliquable pour
   * fermer le menu, et met en place (une seule fois) la délégation de clic
   * sur les liens du menu via `BridgeEvents` pour le refermer automatiquement.
   *
   * @param {boolean} show `true` pour afficher le menu, `false` pour le masquer.
   * @private
   */
  // show menu widget
  #_app_menu(show) {
    const mode = this.mode;

    if (show) {
      if (this.isMobile) {
        if (!document.getElementById('menu-overlay')) {
          const div = document.createElement('div');
          div.setAttribute('id', 'menu-overlay');
          div.classList.add('popover-overlay');
          div.addEventListener('click', () => this.#_app_menu(false));
          document.body.appendChild(div);
        }

        if (!this.#_menuInitialized) {
          this.#_menuInitialized = true;
          BridgeEvents.Instance.delegate(this.layout_menu, 'click', 'a', () => {
            if (this.isMobile) {
              this.#_app_menu(false);
            }
          });
        }

        if (mode === 'phone')
          //PAMELLA
          this.layout_menu.classList.add('popover');
      }

      this.layout_menu.classList.remove('hidden');
    } else {
      const menuOverlay = document.getElementById('menu-overlay');

      if (menuOverlay) menuOverlay.remove();

      this.layout_menu.classList.add('hidden');
      this.layout_menu.classList.remove('popover');
    }
  }
}
