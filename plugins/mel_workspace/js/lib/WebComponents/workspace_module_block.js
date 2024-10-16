import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';

export class WorkspaceModuleBlock extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  get headerTitle() {
    return this._p_get_data('title');
  }

  get buttonTask() {
    return this._p_get_data('button') || false;
  }

  get buttonText() {
    return this._p_get_data('button-text') || 'Voir tout';
  }

  get buttonIcon() {
    return this._p_get_data('button-icon') || 'arrow_right_alt';
  }

  _p_main() {
    super._p_main();

    this.classList.add('melv2-card');

    let childs = this.childNodes;

    let contents = document.createElement('div');
    contents.classList.add('module-block-content');

    if (childs && childs.length > 0) contents.append(...childs);

    let header = document.createElement('div');
    header.classList.add('module-block-header');

    if (
      !isNullOrUndefined(this.headerTitle) &&
      this.headerTitle !== EMPTY_STRING
    ) {
      let title = document.createElement('h3');
      title.appendChild(this.createText(this.headerTitle));

      header.appendChild(title);
      title = null;
    }

    if (this.buttonTask !== false) {
      let button = document.createElement('button');
      button.style.paddingTop = 0;
      button.style.paddingBottom = 0;
      button.classList.add(
        'mel-button',
        'no-margin-button',
        'no-button-margin',
      );

      let text = document.createElement('span');
      text.appendChild(this.createText(this.buttonText));
      text.style.verticalAlign = 'super';
      text.style.marginRight = '25px';

      let icon = document.createElement('bnum-icon');
      icon.setAttribute('data-icon', this.buttonIcon);

      button.append(text, icon);

      header.appendChild(button);

      button = null;
      text = null;
      icon = null;
    }

    this.append(header, contents);

    header = null;
    contents = null;
  }
}

//#region Tag Definition
{
  const TAG = 'bnum-workspace-module';
  if (!customElements.get(TAG))
    customElements.define(TAG, WorkspaceModuleBlock);
}
//#endregion
