export class ABaseModulesJsHtml {
  #_jshtml;
  constructor(jshtml) {
    this.#_jshtml = jshtml;
  }

  /**
   * @returns {____JsHtml}
   * @protected
   */
  _p_get() {
    return this.#_jshtml;
  }
}
