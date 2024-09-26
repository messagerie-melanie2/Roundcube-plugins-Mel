import { isNullOrUndefined } from '../../../mel.js';
import { BnumEvent } from '../../../mel_events.js';
import { MelObject } from '../../../mel_object.js';
import { HtmlCustomTag } from './js_html_base_web_elements.js';

export class InfiniteScrollContainer extends HtmlCustomTag {
  constructor() {
    super();

    this._init();
  }

  _init() {
    this._countMax = null;
    this._scrollspace = null;
    this._page_loading = null;
    this._current_page_scroll = 1;
    this._promise = null;
    this.onscrolledtoend = new BnumEvent();

    return this;
  }

  _setup() {
    let promise = this._get_count_max();

    this._page_loading = {};

    this.onscrolledtoend.push(async (args) => {
      this.dispatchEvent(new CustomEvent('api:scrollended', { detail: args }));
    });

    this.onscrolledtoend.push(async (args) => {
      if (
        this.onscrolledtoend.count() <= 2 &&
        !$._data(this, 'events')?.['api:scrollended']
      ) {
        await this._get_data_on_scroll.bind(this, args);
      }
    });

    Object.defineProperty(this, '_scrollspace', {
      value: this.data('scrollspace') || this.data('linkedTo'),
      writable: false,
      configurable: false,
    });

    this.removeAttribute('data-scrollspace');

    this._promise = promise;

    return this;
  }

  _p_main() {
    super._p_main();

    this._setup();

    if (this.data('function')) {
      this.onscrolledtoend.push(eval(this.data('function')));

      this.removeAttribute('data-function');
    }

    let navigator = this.$.find('.contents');

    if (!navigator.length) navigator = this.$;

    navigator.css('overflow', 'auto');

    // Gestion du scroll infini
    navigator.scroll(this._on_scroll.bind(this));

    console.log(navigator);

    navigator = null;
  }

  async _on_scroll() {
    let navigator = this.$.find('.contents');

    if (!navigator.length) navigator = this.$;

    if (
      navigator.scrollTop() > 1 &&
      (navigator.scrollTop() + navigator.height()) / navigator.height() >= 0.95 &&
      this._current_page_scroll > 1
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
        //post_data._mbox = rcmail.env.mailbox;
        post_data._page = page;

        console.log('Recherche en cours....', post_data);

        this.onscrolledtoend
          .asyncCall({
            post_data,
            lock,
          })
          .always(() => {
            console.log('Recherche terminée !');
            rcmail.set_busy(false, 'loading', lock);
          });
      } else if (!rcmail.busy) console.log("Il n'y a pas de nouveaux mails");
    }
  }

  async _get_data_on_scroll(args) {
    const { post_data } = args;
    const helper = MelObject.Empty();

    post_data._for = this._scrollspace;

    await helper.http_internal_post({
      task: 'mel_metapage',
      action: 'webcomponent_scroll_data',
      params: post_data,
      on_success: (data) => {
        let navigator = this.$.find('.contents');

        if (!navigator.length) navigator = this.$;

        navigator.append(data);
      },
    });
  }

  async _get_count_max() {
    if (this._promise) {
      this._countMax = await this._promise();
      this._promise = null;
    }

    if (isNullOrUndefined(this._countMax)) {
      if (this.data('pagecount')) {
        this._countMax = this.data('pagecount');
        this.removeAttribute('data-pagecount');
      } else {
        const helper = MelObject.Empty();
        await helper.http_internal_post({
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
      }

      if (isNullOrUndefined(this._countMax))
        this._countMax = Number.POSITIVE_INFINITY;
    }

    return this._countMax;
  }
}

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
