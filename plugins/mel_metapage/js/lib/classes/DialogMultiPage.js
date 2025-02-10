import { JsHtml } from '../html/JsHtml/JsHtml.js';
import { DialogPage } from './modal.js';

export class DialogMultiPage extends DialogPage {
  /**
   * @type {DialogPage[]}
   * @private
   */
  #_pages = [];
  #_description;
  #_pluginLocalisation;
  constructor(
    id,
    pages,
    description,
    { pluginLocalisation = 'mel_metapage', title = 'MultiPage' } = {},
  ) {
    super(id, { title });
    this.#_pages = pages ?? [];
    this.content = null;
    Object.defineProperty(this, 'content', {
      get: this.get.bind(this),
      set: (value) => this.start_update_content({ new_content: value }),
    });

    this.#_description = description;
    this.#_pluginLocalisation = pluginLocalisation;
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
   * @returns {external:jQuery}
   */
  get() {
    debugger;
    //Creation des onglets
    const tabs = this.#_pages.map((x) => x.name).join(',');
    //prettier-ignore
    const generated = JsHtml.start
    .webcomponents().tabs(tabs, this.#_description, {pluginText: this.#_pluginLocalisation})
      .each((jshtml, page) => {
        /**
         * @type {DialogPage}
         */
        const dialogPage = page;

        return jshtml.webcomponents()
          .tab_panel(dialogPage.name).observe({ key:dialogPage.name })
          .end()
        
      }, ...this.#_pages)
    .end()
    .generate_with_observer();

    for (const page of this.#_pages) {
      generated.observed[page.name].append(page.get());
    }

    return generated.generated;
  }
}
