import { EventView } from '../../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { ResourceDialog } from '../../../js/add_resources.js';

export { page };

function page(resaData, resource, resource_only = null) {
  page.dialog = new ResourceDialog(EventView.INSTANCE.parts.date, resaData, resource_only);
    return MelHtml.start
        .div({
          class: 'location-mode d-flex',
            'data-locationmode': resource.option_value(),
          async onclick() {
            await (await page.dialog.try_init()).show();
            page.onclickafter.call();
          }
        })
        .button({ type: 'button', }).text(resaData || false ? resaData.name : 'Reserver une ressource').end();
}

page.onclickafter = new BnumEvent();