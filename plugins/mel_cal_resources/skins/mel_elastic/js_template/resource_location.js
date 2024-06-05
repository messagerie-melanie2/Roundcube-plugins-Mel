import { EventView } from '../../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { ResourceDialog } from '../../../js/add_resources.js';

export { ResourceDialogPage };

  
class ResourceDialogPage {
  constructor(resaData, resource, resource_only = null) {
    this.dialog = new ResourceDialog(function () {
      return this._$page.find('button');
    }.bind(resource), EventView.INSTANCE.parts.date, resaData, resource, resource_only);

    this.onclickafter = new BnumEvent();

    this._jshtml = MelHtml.start
        .div({
          class: 'location-mode d-flex',
            'data-locationmode': resource.option_value(),
        })
      .button({
        type: 'button',
        onclick:async () => {
            await (await this.dialog.try_init()).show();
            this.onclickafter.call();
        }
      }).addClass(resaData || false ? 'disabled' : EMPTY_STRING).attr(resaData || false ? 'disabled' : 'waitingclick', resaData || false ? 'disabled' : 'true').icon(resaData || false ? '' : 'ads_click').addClass(resaData || false ? 'clock-loader' : EMPTY_STRING).css('margin-right', '5px').css('color', 'var(--mel-button-text-color)').addClass('animate').end().span().css('vertical-align', 'super').text(resaData || false ? resaData.name : 'Reserver une ressource').end().end();
  }

  get() {
    return this._jshtml;
  }


}
  
