import { HTMLBnumHeader } from '../../design-system/ds-module-bnum';
import { ABaseModule } from '../core/ABaseModule';

export class Global extends ABaseModule {
  #_isResize = false;

  constructor() {
    super();
  }

  _p_init() {
    this.#_addListeners().#_removeUselessRcButtons();
  }

  /**
   * Supprime les bouttons que l'on utilise plus dans roundcube.
   * @returns Chaîne
   */
  #_removeUselessRcButtons() {
    /**
     * @type {Array<string | {selector:string, removeParent: boolean}>}
     */
    const buttonsToRemove = [
      // Bouton créerun email, il pose problème en mode mobile et existe déjà de toute façon
      { selector: '#toolbar-menu a.compose', removeParent: true },
    ];

    /**
     * @type {HTMLElement}
     */
    let element;
    for (const item of buttonsToRemove) {
      element = document.querySelector(
        typeof item === 'string' ? item : item.selector,
      );

      if (!element) continue;

      if (item?.removeParent) element = element?.parentElement;

      element?.remove?.();
      element = null;
    }

    return this;
  }

  /**
   * Ajoute des écouteurs
   * @returns Chaîne
   */
  #_addListeners() {
    return this.#_onResize().#_onSwitchChange();
  }

  /**
   * Change le titre du header en fonction de la frame en cours
   * @returns
   */
  #_onSwitchChange() {
    return this.listen('switch_frame', (args) => {
      const { task } = args;
      const element = document.querySelector(
        `#taskmenu li a[data-task="${task}"]`,
      );

      if (element) {
        /**
         * @type {HTMLBnumHeader}
         */
        const header = document.querySelector(`${HTMLBnumHeader.TAG}.barup`);

        if (header) {
          const currentTask = element.innerText;

          const h1 = header.querySelector('h1');

          if (h1) h1.innerText = currentTask;
          else header.setPageTitle(currentTask);
        }
      }
    });
  }

  /**
   * Ecouteurs sur l'évènement "onresize" de "window";
   * @returns
   */
  #_onResize() {
    window.addEventListener('resize', () => {
      if (this.#_isResize) return;
      this.#_isResize = true;
      requestAnimationFrame(() => {
        this.#_isResize = false;
        this.#_resizeHeaders();
      });
    });

    return this;
  }

  #_resizeHeaders() {
    const SELECTOR =
      '#layout > main > div > .header, #layout > main > bnum-column > .header';
    $(SELECTOR).each(function () {
      var title,
        right = 0,
        left = 0,
        padding = 0,
        sizes = { left: 0, right: 0 };

      $(this)
        .children(':visible:not(.position-absolute)')
        .each(function () {
          if (!title && $(this).is('.header-title')) {
            title = $(this);
            return;
          }

          sizes[title ? 'right' : 'left'] += this.offsetWidth;
        });

      if (padding + sizes.right >= sizes.left) {
        right = 0;
        left = sizes.right + padding - sizes.left;
      } else {
        left = 0;
        right = sizes.left - (padding + sizes.right);
      }

      $(title).css({
        'margin-right': right + 'px',
        'margin-left': left + 'px',
        'padding-right': padding + 'px',
      });
    });
  }

  static _p_ignoreLifeCycles() {
    return ['main', 'after'];
  }
}
