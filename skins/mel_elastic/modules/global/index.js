import { ABaseModule } from '../core/ABaseModule';

export class Global extends ABaseModule {
  #_isResize = false;

  constructor() {
    super();
  }

  _p_init() {
    this.#_addListeners().#_removeUselessRcButtons();
  }

  #_removeUselessRcButtons() {
    /**
     * @type {Array<string | {selector:string, removeParent: boolean}>}
     */
    const buttonsToRemove = [
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

      if (item?.removeParent) element = element.parentElement;

      element?.remove?.();
      element = null;
    }

    return this;
  }

  #_addListeners() {
    return this.#_onResize();
  }

  #_onResize() {
    $(window).on('resize', () => {
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
