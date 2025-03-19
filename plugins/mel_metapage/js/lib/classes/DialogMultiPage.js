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
  #_observed;
  constructor(
    id,
    pages,
    description,
    { pluginLocalisation = 'mel_metapage', title = 'MultiPage' } = {},
  ) {
    super(id, { title });
    this.#_pages = pages ?? [];
    this.content = null;
    this.#_description = description;
    this.#_pluginLocalisation = pluginLocalisation;
  }

  /**
   * @type {Object<string, boolean | HTMLElement>}
   * @readonly
   */
  get observed() {
    return this.#_observed;
  }

  /**
   * Permet de modifier le contenu de la dialog
   * @param {Object} param0
   * @param {boolean} param0.force_restart Si on recommence l'écriture de la page ou non
   * @returns {import('../html/JsHtml/JsHtml.js')._JsHtml}
   * @override
   */
  start_update_content({ force_restart = false }) {
    if (force_restart) this.content = JsHtml.start;

    return this.content;
  }

  /**
   * Récupère sous format jQuery
   * @returns {external:jQuery}
   */
  get() {
    //Creation des onglets
    const tabs = this.#_pages.map((x) => x.name).join(',');
    //prettier-ignore
    const html = this.content ?? JsHtml.start
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
    .end();

    const generated = html.generate_with_observer();

    for (const page of this.#_pages) {
      generated.observed[page.name].append(page.get());
    }

    this.#_observed = generated.observed;

    return generated.generated;
  }
}
