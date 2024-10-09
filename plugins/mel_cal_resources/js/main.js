import { FavoriteLoader } from './lib/favorite_loader.js';
import './lib/resource_location.js';

if (rcmail && rcmail.env.task === 'calendar') {
  rcmail.addEventListener('mel_metapage_refresh', () => {
    FavoriteLoader.Clear();
  });
}
