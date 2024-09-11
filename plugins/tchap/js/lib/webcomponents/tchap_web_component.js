import { HtmlCustomTag } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';

export class TchapFrameAction extends HtmlCustomTag {
  constructor() {
    super();

    this.onleaveclick = new BnumEvent();
    this.onattachclick = new BnumEvent();
    this.onfullscreenchangeclick = new BnumEvent();

    this.onleaveclick.push(() => {
      this.$.trigger('tchapclose');
    });

    this.onattachclick.push(() => {
      this.$.trigger('tchapattach');
    });

    this.onfullscreenchangeclick.push(() => {
      this.$.trigger('tchapfullscreen');
    });

    const configs = [
      TchapFrameActionConfig.Create(
        'close',
        'close',
        this.onleaveclick.call.bind(this.onleaveclick),
        ['button-leave'],
      ),
      TchapFrameActionConfig.Create(
        'view_column_2',
        'view_column_2',
        this.onattachclick.call.bind(this.onattachclick),
        ['button-anchor'],
      ),
      TchapFrameActionConfig.Create(
        'fullscreen',
        'fullscreen',
        this.onfullscreenchangeclick.call.bind(this.onfullscreenchangeclick),
        ['button-fullscreen'],
      ),
    ];

    for (const element of configs) {
      this.append(
        this._generate_button(
          element.icon,
          element.title,
          element.action,
          element.classes.join(' '),
        ).generate_dom(),
      );
    }
  }

  _generate_button(icon, title, clickaction, classes = []) {
    //prettier-ignore
    return MelHtml.start
    .button({ class:(classes + ' bckg true'), title, onclick:clickaction })
      .icon(icon).end()
    .end();
  }
}

class TchapFrameActionConfig {
  constructor(icon, title, action, classes = []) {
    this.icon = icon;
    this.title = title;
    this.action = action;
    this.classes = classes;
  }

  static Create(icon, title, action, classes = []) {
    return new TchapFrameActionConfig(icon, title, action, classes);
  }
}
