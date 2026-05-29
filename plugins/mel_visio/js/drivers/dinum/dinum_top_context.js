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
   * @param {import('../driver.js').VisioAction} visioData Configuration actuelle du bouton visio
   * @returns {import('../driver.js').VisioAction} Configuration modifiée avec la nouvelle action d'ouverture
   * @override
   */
  _p_updateCreateVisioButton(visioData) {
    visioData = super._p_updateCreateVisioButton(visioData);

    if (this.get_env('dvisio_text_key')) {
      visioData.text = this.getLocalization(this.get_env('dvisio_text_key'), {
        plugin: 'mel_visio',
      });
    }

    visioData.action = `window.open('${this.get_env('dvisio_url')}', '_blank');`;

    return visioData;
  }
}

DinumTopContext.Start();
