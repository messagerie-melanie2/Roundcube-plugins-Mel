import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioData } from './classes/structures/data.js';
import { ePage } from './enums.js';

export { VisioPageManager };

class VisioPageManager {
	constructor() {
		throw 'static class';
	}

	/**
	 *
	 * @param {ePage} page
	 * @param {VisioData} data
	 */
	static ChangePage(page, data = new VisioData({})) {
		var url;

		switch (page) {
			case ePage.home:
				if (!data.need_config) data.need_config = true;
				break;

			case ePage.visio:
				if (data.need_config) data.need_config = null;
				break;

			default:
				throw 'Symbol inconnu';
		}

		url = MelObject.Empty().url('webconf', { params: data.to_ajax_params() });

		window.location.href = url;
	}
}
