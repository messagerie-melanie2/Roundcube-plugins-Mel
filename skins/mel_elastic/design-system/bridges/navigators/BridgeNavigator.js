import { InternetNavigator } from '../../../../../plugins/mel_metapage/js/lib/helpers/InternetNavigator.js';
import { Firefox } from './Firefox.js';
import { OtherNavigators } from './Others';

var navigator = null;
if (InternetNavigator.IsFirefox()) navigator = new Firefox();
else navigator = new OtherNavigators();

export const BridgeNavigator = navigator;
