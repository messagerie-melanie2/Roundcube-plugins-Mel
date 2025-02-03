import { Random } from '../lib/classes/random';
import { BnumHtmlIcon } from '../lib/html/JsHtml/CustomAttributes/js_html_base_web_elements';
import { JsHtml } from '../lib/html/JsHtml/JsHtml';

const mode = 1;
//prettier-ignore
const html = JsHtml.start
  .p().observe({ key: 'p' })
    .if(mode === 0)
      .text('BONJOUR')
    .elseif(mode === 1)
      .text('BONSOIR')
    .elseif(mode === 2)
      .text('BONNE NUIT !')
    .else()
      .text('Qué ?')
    .endif()
    .if(() => Random.range(0, 2) === 0)
      .span().text('STARTINNNNNNNNG').end()
    .endif()
    .customElement({
      tag: 'test',
      onconnected: function () {
        let shadow = this._p_start_construct();
        this._it = 0;
        let div = document.createElement('div');
        div.setAttribute('id', 'yolostrat');
        shadow.appendChild(div);
        div = null;
        const interval = setInterval(() => {
          shadow.querySelector('#yolostrat').innerHTML =
            '<p>' + ++this._it + '</p>';

          if (this._it >= 25) clearInterval(interval);
        }, 500);
      },
      hasShadowDom: true,
    })
    .end()
    .customElement('test')
    .end()
    .each((jhsmlt, it) => {
      it = 0;
      while (true && it++ <= 3) {
        jhsmlt.customElement('test').end();
      }

      return jhsmlt;
    }, 0)
  .end();

html.generate().prependTo($('body'));
