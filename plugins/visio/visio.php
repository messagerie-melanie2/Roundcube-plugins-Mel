<?php
/**
 * Plugin Visio — intégration de l'API de visioconférence "La Suite Numérique".
 *
 * Expose un client API (@see visio_api) authentifié en OAuth2
 * (client_credentials avec délégation par email utilisateur), ainsi que
 * 3 actions Roundcube consommées par le client JS du plugin :
 * - list_rooms    : liste les salles accessibles à l'utilisateur courant
 * - retrieve_room : détail d'une salle (paramètre GET `id`)
 * - create_room   : création d'une salle (POST, paramètres optionnels
 *                    `access_level` et `configuration`)
 *
 * Hooks utilisés : aucun.
 */
class visio extends bnum_plugin
{
    /** @var string Tâches Roundcube sur lesquelles le plugin est actif */
    public $task = '?(?!login|logout|bnum).*';

    /** @var visio_api|null */
    private $api_client;

    /**
     * Initialise le plugin : configuration, langue, librairie du client API.
     */
    public function init(): void
    {
        $this->require_plugin('mel_helper');
        $this->add_texts('localization/', true);
        $this->load_config();
        $this->load_lib();

        $this->register_task('visio');
        $this->register_actions([
            'list_rooms' => [$this, 'action_list_rooms'],
            'retrieve_room' => [$this, 'action_retrieve_room'],
            'create_room' => [$this, 'action_create_room'],
        ]);

        try {
            $this->set_env('visio_gouv_base_url', $this->get_config('visio_gouv_base_url'));
            $this->include_module('visio.js');
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    /**
     * Liste les salles accessibles à l'utilisateur courant.
     */
    public function action_list_rooms(): void
    {
        $this->respond($this->api()->list_rooms($this->get_user()->email));
    }

    /**
     * Récupère le détail d'une salle.
     */
    public function action_retrieve_room(): void
    {
        $id = (string) $this->get_input('id');
        $this->respond($this->api()->retrieve_room($this->get_user()->email, $id));
    }

    /**
     * Crée une nouvelle salle.
     */
    public function action_create_room(): void
    {
        $this->rc()->check_request();

        $body = [];
        $access_level = (string) $this->get_input_post('access_level');
        if ($access_level !== '') {
            $body['access_level'] = $access_level;
        }

        $configuration = (string) $this->get_input_post('configuration');
        if ($configuration !== '') {
            $body['configuration'] = json_decode($configuration, true);
        }

        $this->respond($this->api()->create_room($this->get_user()->email, $body === [] ? null : $body));
    }

    /**
     * Journalise les échecs puis répond au client en JSON.
     *
     * @param array{httpCode: int, content: array<string, mixed>|null} $response Réponse du client API
     */
    private function respond(array $response): void
    {
        if ($response['httpCode'] >= 400) {
            mel_logs::gi()->log(mel_logs::ERROR, "[visio] Échec appel API (HTTP {$response['httpCode']})");
        }

        $this->sendEncodedExit($response);
    }

    /**
     * Charge les fichiers librairies du plugin (lib/), ainsi que amel_lib
     * dont dépend visio_api.
     */
    private function load_lib(): void
    {
        mel_helper::load_helper($this->rc())->include_amel_lib();

        foreach (scandir(__DIR__ . '/lib') as $file) {
            if (strpos($file, '.php') !== false) {
                include_once __DIR__ . '/lib/' . $file;
            }
        }
    }

    /**
     * Récupère le client API du plugin (instancié une seule fois).
     *
     * @return visio_api Client API authentifié pour la plateforme de visioconférence
     */
    public function api(): visio_api
    {
        return $this->api_client ??= new visio_api($this->rc(), $this);
    }
}
