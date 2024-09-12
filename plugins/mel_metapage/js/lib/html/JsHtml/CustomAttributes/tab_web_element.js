import { Random } from '../../../classes/random.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import { MelHtml } from '../MelHtml.js';
import { HtmlCustomTag } from './js_html_base_web_elements.js';

export class TabElement extends HtmlCustomTag {
  constructor() {
    super();
    this._id = this._generate_id();
    //this.setAttribute('data-tab-namespace', this._id);
    //this.attributes.//setNamedItem('data-tab-namespace', this._id);

    let $tmp = $('<div>').addClass('pannels-contents');

    $(this).children().appendTo($tmp);
    console.trace();
    const tabs = this.dataset.navs.trim().split(',');

    for (const tab of tabs) {
      this.append(this._generate_tab(tab).generate_dom());
    }

    this.append($tmp[0]);

    $tmp = null;
  }

  _generate_tab(tab) {
    return MelHtml.start
      .raw_button({
        class: 'mel-tab mel-tabheader',
        'data-button-namespace': tab,
      })
      .attr('onclick', (e) => {
        const namespace = $(e).attr('data-button-namespace');
        this.$.find('.mel-tab-content').css('display', 'none');
        this.$.find(`[data-pannel-namespace=${namespace}]`).css(
          'display',
          EMPTY_STRING,
        );
      })
      .text(tab)
      .end();
  }

  _generate_id() {
    let id;
    do {
      id = Random.random_string(Random.range(5, 20));
    } while ($(`[data-tab-namespace=${id}]`).length > 0);

    return id;
  }
}

const TAG = 'bnum-tab';
if (!customElements.get(TAG)) customElements.define(TAG, TabElement);
