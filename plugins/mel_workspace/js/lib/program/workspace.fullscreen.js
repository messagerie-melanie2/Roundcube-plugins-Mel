import { Top } from '../../../../mel_metapage/js/lib/top.js';

/**
 * Gère le mode plein écran d'un espace de travail.
 *
 * Les éléments de la fenêtre principale (barre du haut, menu, frames, barre de
 * navigation de l'espace) sont modifiés à l'activation. Leur attribut `style`
 * d'origine est sauvegardé afin d'être restauré à l'identique à la désactivation.
 *
 * `disable()` est volontairement synchrone : le realm de l'iframe de l'espace
 * peut être détruit juste après la sortie, une continuation asynchrone ne
 * serait alors jamais exécutée.
 *
 * @example
 * const fullscreen = new WorkspaceFullscreen();
 * fullscreen.enable((condition) => this.wait_something(condition));
 * // ...
 * fullscreen.disable();
 */
export class WorkspaceFullscreen {
  /** @type {Map<Element, string>} Attribut `style` d'origine par élément modifié */
  #_saved_styles = new Map();
  #_active = false;

  /**
   * Indique si le plein écran est actuellement appliqué.
   * @returns {boolean}
   */
  get active() {
    return this.#_active;
  }

  /**
   * Active le plein écran. Sans effet s'il est déjà actif.
   *
   * @param {function(function(): boolean): Promise<*>} wait_for - Attend qu'une condition soit vraie (ex : `wait_something` de MelObject)
   * @returns {void}
   */
  enable(wait_for) {
    if (this.#_active) return;
    this.#_active = true;

    const navigator = Top.top();

    this.#_apply(navigator.document.querySelector('.barup'), {
      display: 'none',
    });
    this.#_apply(navigator.document.querySelector('#layout-menu'), {
      display: 'none',
    });
    this.#_apply(navigator.document.querySelector('#layout-frames'), {
      'margin-top': '0',
      height: '100%',
    });

    wait_for(() => !!this.#_get_nav(navigator)).then(() => {
      // La sortie a pu avoir lieu pendant l'attente.
      if (!this.#_active) return;

      const nav = this.#_get_nav(navigator);
      if (!nav) return;

      this.#_apply(nav, { 'margin-top': '0', 'margin-left': '0' });
      this.#_apply(nav.shadowRoot?.querySelector('div.nav.melv2-card'), {
        height: '100%',
      });
      this.#_apply(nav.shadowRoot?.querySelector('#wsp-quit-button'), {
        bottom: '10px',
      });
    });
  }

  /**
   * Désactive le plein écran et restaure les styles d'origine. Sans effet s'il n'est pas actif.
   * @returns {void}
   */
  disable() {
    if (!this.#_active) return;
    this.#_active = false;

    for (const [element, style] of this.#_saved_styles) {
      if (style) element.setAttribute('style', style);
      else element.removeAttribute('style');
    }

    this.#_saved_styles.clear();
  }

  /**
   * @param {Window} navigator
   * @returns {?HTMLElement}
   */
  #_get_nav(navigator) {
    return navigator.document.querySelector('bnum-wsp-nav');
  }

  /**
   * Applique des styles en sauvegardant l'attribut `style` d'origine (une seule fois par élément).
   *
   * @param {?HTMLElement} element
   * @param {Object<string, string>} styles - Propriétés CSS (kebab-case) et valeurs
   * @returns {void}
   */
  #_apply(element, styles) {
    if (!element) return;

    if (!this.#_saved_styles.has(element))
      this.#_saved_styles.set(element, element.getAttribute('style') ?? '');

    for (const [property, value] of Object.entries(styles))
      element.style.setProperty(property, value);
  }
}
