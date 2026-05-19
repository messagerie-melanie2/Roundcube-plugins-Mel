import { ADriver } from '../driver.js';

/**
 * Driver spécifique à la plateforme "La Suite Numérique" (visio.numerique.gouv.fr),
 * actif uniquement dans le contexte de la page principale (top context).
 *
 * Modifie le bouton de création de visioconférence pour qu'il ouvre
 * la plateforme dinum dans un nouvel onglet, à partir de l'URL
 * exposée côté serveur via la variable d'environnement `dvisio_url`.
 *
 * Instancié et initialisé automatiquement au chargement du module
 * via {@link ADriver.Start}.
 *
 * @extends ADriver
 */
class DinumTopContext extends ADriver {
  constructor() {
    super();
  }

  /**
   * Modifie le bouton de création de visioconférence pour ouvrir
   * la plateforme dinum dans un nouvel onglet.
   *
   * Récupère l'URL depuis la variable d'environnement roundcube `dvisio_url`,
   * injectée par le driver PHP {@link dinum} lors de l'initialisation serveur.
   *
   * @param {VisioAction} visioData Configuration actuelle du bouton visio
   * @returns {VisioAction} Configuration modifiée avec la nouvelle action d'ouverture
   * @override
   */
  _p_updateCreateVisioButton(visioData) {
    visioData = super._p_updateCreateVisioButton(visioData);
    visioData.action = `window.open('${this.get_env('dvisio_url')}', '_blank');`;

    return visioData;
  }
}

DinumTopContext.Start();
