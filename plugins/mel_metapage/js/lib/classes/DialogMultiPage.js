import { JsHtml } from '../html/JsHtml/JsHtml.js';
import { DialogPage } from './modal.js';

class DialogMultiPage extends DialogPage {
  #_pages = [];
  constructor(id, pages) {
    super(id, {});
    this.#_pages = pages ?? [];
    this.content = null;
    Object.defineProperty(this, 'content', {
      get: this.get.bind(this),
      set: (value) => this.start_update_content({ new_content: value }),
    });
  }

  /**
   * Permet de modifier le contenu de la dialog
   * @param {Object} param0
   * @param {DialogPage[] | null} param0.new_content Si on recommence l'écriture de la page ou non
   * @returns {DialogPage[]}
   * @override
   */
  start_update_content({ new_content = null } = {}) {
    if (new_content) this.#_pages = new_content;

    return this.#_pages;
  }

  /**
   * Récupère sous format jQuery
   * @returns {import("../html/JsHtml/JsHtml.js").____JsHtml}
   */
  get() {
    //Creation des onglets
  }
}
