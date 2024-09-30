import { isNullOrUndefined } from '../../../mel.js';
import { BnumEvent } from '../../../mel_events.js';
import { MelObject } from '../../../mel_object.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from './js_html_base_web_elements.js';

export { InfiniteScrollContainer };

/**
 * Contient la classe qui gère le scroll infini
 * @module WebComponents/InfiniteScrollContainer
 * @local InfiniteScrollContainer
 * @local PageData
 * @local OnScrollEndedCallback
 */

/**
 * @typedef PageData
 * @property {number} _page
 */

/**
 * @callback OnScrollEndedCallback
 * @param {PageData} pageData
 * @param {number} lock
 * @return {void}
 */

/**
 * @class
 * @classdesc Gère un scroll infini. Balise bnum-infinite-scroll-container
 * @extends HtmlCustomTag
 * @frommodule WebComponents/Base
 */
class InfiniteScrollContainer extends HtmlCustomTag {
  /**
   * Gère un scroll infini.
   *
   * Si data-pagecount n'est pas défini, les données seront récupérer par le serveur. <br/>
   *
   * data-function permet de définir une fonction qui sera évaluer (optionnel.) <br/>
   *
   * webcomponent_scroll_data est l'action qui récupère les données. <br/>
   *
   * api:scrollended => Evènement lorsque le scroll de fin est atteind.
   */
  constructor() {
    super({ mode: EWebComponentMode.div });

    this._init();
  }

  /**
   * Initialise les variables
   * @private
   * @returns {InfiniteScrollContainer} Chaîne
   */
  _init() {
    /**
     * Nombre de page max.
     * @package
     * @type {?number}
     */
    this._countMax = null;
    /**
     * Espace de nom, il sera envoyer au serveur pour récupérer les données.
     * @package
     * @readonly
     * @type {?string}
     */
    this._scrollspace = null;
    /**
     * Données à envoyer au serveur
     * @private
     */
    this._page_loading = null;
    /**
     * Prochaine page à charger
     * @private
     */
    this._current_page_scroll = 2;
    /**
     * @private
     */
    this._promise = null;
    /**
     * @type {BnumEvent<OnScrollEndedCallback>}
     * @frommodule WebComponents/InfiniteScrollContainer {@linkto OnScrollEndedCallback}
     */
    this.onscrolledtoend = new BnumEvent();

    return this;
  }

  /**
   * Assigne les variables
   * @private
   * @returns {InfiniteScrollContainer} Chaîne
   */
  _setup() {
    this._page_loading = {};

    this.onscrolledtoend.push(async (args) => {
      this.dispatchEvent(new CustomEvent('api:scrollended', { detail: args }));
    });

    this.onscrolledtoend.push(async (args) => {
      if (
        this.onscrolledtoend.count() <= 2 &&
        !$._data(this, 'events')?.['api:scrollended']
      ) {
        await this._get_data_on_scroll.call(this, args);
      }
    });

    Object.defineProperty(this, '_scrollspace', {
      value: this.data('scrollspace') || this.data('linkedTo'),
      writable: false,
      configurable: false,
    });

    this.removeAttribute('data-scrollspace');

    return this;
  }

  /**
   * Setup le composant
   * @protected
   */
  _p_main() {
    super._p_main();

    this._setup();

    if (this.data('function')) {
      this.onscrolledtoend.push(eval(this.data('function')));

      this.removeAttribute('data-function');
    }

    this.$.css('overflow', 'auto');

    // Gestion du scroll infini
    this.$.scroll(this._on_scroll.bind(this));
  }

  /**
   * Action au scroll
   * @async
   * @package
   */
  async _on_scroll() {
    let nav = this.$.find('.contents');

    if (!nav.length) nav = this.$;

    if (
      this.$.scrollTop() > 1 &&
      this.$.scrollTop() >= (this.scrollTopMax * 95) / 100
    ) {
      // Affichage de la page suivante au bas de la page
      let page = this._current_page_scroll;
      if (!rcmail.busy)
        console.log(
          'Fin de la liste des mails, recherche de mails plus ancien....',
        );
      if (
        page > 0 &&
        page <= (await this._get_count_max()) &&
        !this._page_loading[page]
      ) {
        this._page_loading[page] = true;
        let lock = rcmail.set_busy(true, 'loading');
        let post_data = {};
        post_data._page = page;

        console.log('Recherche en cours....', post_data);

        this.onscrolledtoend
          .asyncCall({
            post_data,
            lock,
          })
          .then(() => {
            console.log('Recherche terminée !');
            rcmail.set_busy(false, 'loading', lock);
          });
      } else if (!rcmail.busy) console.log("Il n'y a pas de nouveaux mails");
    }
  }

  /**
   * Récupère les données lorsque le bout du scroll est atteind
   * @async
   * @param {Object<string, any>} args
   * @package
   */
  async _get_data_on_scroll(args) {
    const { post_data } = args;
    const helper = MelObject.Empty();

    post_data._for = this._scrollspace;

    await helper.http_internal_post({
      task: 'mel_metapage',
      action: 'webcomponent_scroll_data',
      params: post_data,
      on_success: (data) => {
        data = JSON.parse(data);

        let navigator = this.$.find('.contents');

        if (!navigator.length) navigator = this.$;

        navigator.append(data);

        this._current_page_scroll += 1;
      },
    });
  }

  /**
   * Récupère et met en mémoire le nombre de page maximum.
   * @returns {Promise<number>}
   * @async
   */
  async _get_count_max() {
    if (this._promise) {
      await this._promise;
      this._promise = null;
    }

    if (isNullOrUndefined(this._countMax)) {
      if (this.data('pagecount')) {
        this._countMax = this.data('pagecount');
        this.removeAttribute('data-pagecount');
      } else {
        const helper = MelObject.Empty();
        this._promise = helper.http_internal_post({
          task: 'mel_metapage',
          action: 'webcomponent_scroll_count',
          params: {
            _for: this._scrollspace,
          },
          on_success: (data) => {
            try {
              data = JSON.parse(data);
              this._countMax = data;
            } catch (error) {
              this._countMax = null;
            }
          },
        });

        await this._promise;
      }

      if (isNullOrUndefined(this._countMax))
        this._countMax = Number.POSITIVE_INFINITY;
    }

    return this._countMax;
  }
}

/**
 * Tag de la balise
 * @type {string}
 * @constant
 * @static
 */
InfiniteScrollContainer.TAG = 'bnum-infinite-scroll-container';

Object.defineProperty(InfiniteScrollContainer, 'TAG', {
  value: InfiniteScrollContainer.TAG,
  writable: false,
  configurable: false,
});

{
  const TAG = InfiniteScrollContainer.TAG;
  if (!customElements.get(TAG))
    customElements.define(TAG, InfiniteScrollContainer);
}
