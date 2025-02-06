import { JsHtml } from '../html/JsHtml/JsHtml.js';
import { DialogPage } from './modal.js';

export class DialogMultiPage extends DialogPage {
  /**
   * @type {DialogPage[]}
   * @private
   */
  #_pages = [];
  #_description;
  constructor(id, pages, description) {
    super(id, {});
    this.#_pages = pages ?? [];
    this.content = null;
    Object.defineProperty(this, 'content', {
      get: this.get.bind(this),
      set: (value) => this.start_update_content({ new_content: value }),
    });

    this.#_description = description;
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
   * @returns {import('../html/JsHtml/JsHtml.js')._JsHtml}
   */
  get() {
    //Creation des onglets
    const tabs = this.#_pages.map((x) => x.name).join(',');
    //prettier-ignore
    return JsHtml.start
    .webcomponents().tabs(tabs, this.#_description)
      .each((jshtml, page) => {
        /**
         * @type {DialogPage}
         */
        const dialogPage = page;

        return jshtml.webcomponents()
          .tab_panel(dialogPage.name)
            .add_child(dialogPage.content ?? JsHtml.start.webcomponents().placeholder().end())
          .end()
        
      }, ...this.#_pages)
    .end()
    .generate();
  }
}
