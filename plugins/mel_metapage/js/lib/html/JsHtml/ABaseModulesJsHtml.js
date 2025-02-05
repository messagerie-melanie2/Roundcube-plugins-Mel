/**
 * @template {import("./JsHtml")._JsHtml} T
 */
export class ABaseModulesJsHtml {
  #_jshtml;
  constructor(jshtml) {
    this.#_jshtml = jshtml;
  }

  /**
   * @returns {T}
   * @protected
   */
  _p_get() {
    return this.#_jshtml;
  }
}
