<?php
use MelVisio\Driver;

/**
 * Driver pour la plateforme de visioconférence "La Suite Numérique" (visio.numerique.gouv.fr).
 *
 * Étend le comportement de base du plugin mel_visio pour intégrer
 * le service de visio de l'État français. Ce driver est final et
 * ne peut pas être étendu.
 *
 * @see Driver
 * @final
 */
final class dnum extends Driver
{
    /**
     * URL de la plateforme de visioconférence.
     * @var string
     */
    private const URL = 'https://visio.numerique.gouv.fr';

    /**
     * @param \mel_visio $plugin Instance du plugin parent, injectée à la création du driver.
     */
    public function __construct(\mel_visio $plugin) {
        parent::__construct($plugin);
    }

    /**
     * Initialisation du driver.
     *
     * Si l'on est dans un contexte de chargement initial de la page principale (requête GET,
     * tâche 'bnum', action 'index'), charge le module JS dédié au contexte haut
     * et expose l'URL de la plateforme à l'interface cliente.
     *
     * @see _is_index()
     */
    protected function _p_init(): void
    {
        parent::_p_init();

        $is_top_context = $_SERVER['REQUEST_METHOD'] === 'GET' 
            && $this->rc()->task === 'bnum' 
            && $this->_is_index();

        if ($is_top_context) {
            $this->_p_plugin()->load_script_module_driver('dnum_top_context');
            $this->rc()->output->set_env('dvisio_url', self::URL);
        }
    }

    /**
     * Vérifie si l'action courante est l'action par défaut (page d'accueil).
     *
     * Retourne vrai si l'action roundcube est vide ou vaut explicitement 'index'.
     *
     * @return bool true si on est sur la page d'accueil, false sinon
     */
    private function _is_index(): bool {
        return $this->rc()->action === EMPTY_STRING || $this->rc()->action === 'index';
    }
}