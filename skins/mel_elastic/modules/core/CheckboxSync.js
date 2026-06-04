/**
 * Syncs visual web component checkboxes with hidden native inputs.
 * Uses MutationObserver to catch programmatic changes (no dispatchEvent needed).
 */
export class CheckboxSync {
  #observers = new Map();

  /**
   * @param {string} inputSelector   - CSS selector for hidden native inputs
   * @param {string} wcSelector      - CSS selector for web component checkboxes
   * @param {string} wcCheckedAttr   - Attribute/property name on the WC that reflects checked state
   */
  constructor(inputSelector, wcSelector, wcCheckedAttr = 'checked') {
    this.inputSelector = inputSelector;
    this.wcSelector = wcSelector;
    this.wcCheckedAttr = wcCheckedAttr;
  }

  init() {
    const inputs = document.querySelectorAll(this.inputSelector);
    const wcs = document.querySelectorAll(this.wcSelector);

    if (inputs.length !== wcs.length) {
      console.warn(
        `[CheckboxSync] Mismatch: ${inputs.length} inputs vs ${wcs.length} web components.`,
      );
    }

    inputs.forEach((input, index) => {
      const wc = wcs[index];
      if (!wc) return;

      // Initial sync
      this.#syncToWC(input, wc);

      // Observe attribute mutations on the native input
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'checked') {
            this.#syncToWC(input, wc);
          }
        }
      });

      observer.observe(input, {
        attributes: true,
        attributeFilter: ['checked'],
      });

      // Also catch direct property assignments (input.checked = true)
      // MutationObserver does NOT fire for .checked property — need a getter/setter trap
      this.#trapCheckedProperty(input, wc);

      this.#observers.set(input, observer);
    });
  }

  /**
   * Traps direct `.checked = value` assignments via property descriptor override.
   * Native MutationObserver misses property mutations on HTMLInputElement.checked.
   */
  #trapCheckedProperty(input, wc) {
    const proto = Object.getPrototypeOf(input); // HTMLInputElement.prototype
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'checked');

    if (!descriptor) return;

    Object.defineProperty(input, 'checked', {
      get: () => descriptor.get.call(input),
      set: (value) => {
        descriptor.set.call(input, value);
        this.#syncToWC(input, wc);
      },
      configurable: true,
    });
  }

  #syncToWC(input, wc) {
    // Prefer property assignment (reactive WCs); fall back to attribute
    if (this.wcCheckedAttr in wc) {
      wc[this.wcCheckedAttr] = input.checked;
    } else {
      input.checked
        ? wc.setAttribute(this.wcCheckedAttr, '')
        : wc.removeAttribute(this.wcCheckedAttr);
    }
  }

  /** Cleanup: disconnect all observers and restore property descriptors */
  destroy() {
    this.#observers.forEach((observer, input) => {
      observer.disconnect();

      // Restore native descriptor
      const proto = Object.getPrototypeOf(input);
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'checked');
      if (descriptor) {
        Object.defineProperty(input, 'checked', descriptor); // remove instance override
        delete input.checked; // let it fall through to prototype again
      }
    });
    this.#observers.clear();
  }
}
