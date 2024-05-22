import { MelHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { test_class } from '../../../js/add_resources.js';

export { page };

function page(resaData, resource, resource_only = null) {
  debugger;
    return MelHtml.start
        .div({
          class: 'location-mode d-flex',
            'data-locationmode': resource.option_value(),
            onclick: () => new test_class()
        })
        .button({ type: 'button', }).text(resaData || false ? resaData.name : 'Reserver une ressource').end();
}