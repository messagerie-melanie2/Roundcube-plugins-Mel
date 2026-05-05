import BridgeEvents from '../../design-system/bridges/BridgeEvents.js';
import { ABaseModule } from '../core/ABaseModule.js';

export class SecondaryNav extends ABaseModule {
  #_menuInitialized = false;

  get mode() {
    return UI.get_screen_mode();
  }

  get isTouch() {
    return UI.is_touch();
  }

  get isMobile() {
    return this.mode === 'phone' /* PAMELLA ==> */ || this.isTouch === true;
  }

  get layout_menu() {
    return document.getElementById('layout-menu');
  }

  constructor() {
    super();
  }

  _p_main() {
    this.#_initListeners();
  }

  #_initListeners() {
    return this.#_onMenuClick();
  }

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
