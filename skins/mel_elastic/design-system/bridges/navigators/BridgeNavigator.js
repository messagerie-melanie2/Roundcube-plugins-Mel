/**
 * Bridge de sélection de la stratégie de temporisation de drag&drop sur
 * l'arborescence des dossiers.
 *
 * Choisit, une seule fois au chargement du module, l'implémentation de
 * {@link ANavigators} adaptée au navigateur courant ({@link Firefox} ou
 * {@link OtherNavigators}) car `setTimeout`/`requestAnimationFrame` ne se
 * comportent pas de la même façon pendant un drag HTML5 natif selon le
 * moteur du navigateur.
 */
import { InternetNavigator } from '../../../../../plugins/mel_metapage/js/lib/helpers/InternetNavigator.js';
import { Firefox } from './Firefox.js';
import { OtherNavigators } from './Others';

/** @type {import('./ANavigators.js').ANavigators} */
var navigator = null;
if (InternetNavigator.IsFirefox()) navigator = new Firefox();
else navigator = new OtherNavigators();

/**
 * Instance unique (singleton) de la stratégie de temporisation de drag
 * active pour le navigateur courant. Utilisée par `BridgeEvents` pour
 * ouvrir automatiquement un dossier replié survolé pendant le drag d'un
 * mail.
 *
 * @type {import('./ANavigators.js').ANavigators}
 * @see ANavigators
 */
export const BridgeNavigator = navigator;
