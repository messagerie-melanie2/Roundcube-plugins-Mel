<?php
declare(strict_types=1);

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
 * Hooks utilisés :
 * - calendar_appointment_feature : injection du champ « Visio » dans la
 *   prise de rendez-vous de l'agenda
 */
final class visio extends bnum_plugin
{
    /** @var string Tâches Roundcube sur lesquelles le plugin est actif */
    public $task = '?(?!login|logout|bnum).*';

    /** Client API, instancié à la demande (@see api()) */
    private ?visio_api $api_client = null;

    /**
     * Initialise le plugin : configuration, langue, librairie du client API,
     * actions, hook et module JS.
     */
    #[\Override]
    public function init(): void
    {
        $this->require_plugin('mel_helper');
        $this->add_texts('localization/', true);
        $this->load_config();
        $this->load_lib();

        $this->register_task('visio');
        $this->register_actions([
            'list_rooms' => $this->action_list_rooms(...),
            'retrieve_room' => $this->action_retrieve_room(...),
            'create_room' => $this->action_create_room(...),
        ]);

        $this->add_hook('calendar_appointment_feature', $this->hook_calendar_appointment_feature(...));

        $this->load_client();
    }

    /**
     * Récupère le client API du plugin (instancié une seule fois).
     *
     * @return visio_api Client API authentifié pour la plateforme de visioconférence
     */
    #[\NoDiscard("api() n'a aucun effet de bord : le client renvoyé doit être utilisé")]
    public function api(): visio_api
    {
        return $this->api_client ??= new visio_api($this->rc(), $this);
    }

    /**
     * Liste les salles accessibles à l'utilisateur courant.
     */
    private function action_list_rooms(): void
    {
        $this->respond($this->api()->list_rooms($this->current_user_email()));
    }

    /**
     * Récupère le détail d'une salle.
     */
    private function action_retrieve_room(): void
    {
        $id = (string) $this->get_input('id', rcube_utils::INPUT_GET);

        $this->respond($this->api()->retrieve_room($this->current_user_email(), $id));
    }

    /**
     * Crée une nouvelle salle.
     */
    private function action_create_room(): void
    {
        $this->rc()->check_request();

        $this->respond($this->api()->create_room($this->current_user_email(), $this->build_room_body()));
    }

    /**
     * Ajoute le champ « Visio » (gabarit visio_appointment) à la prise de
     * rendez-vous de l'agenda.
     *
     * @param array<string, mixed> $args Arguments du hook
     *
     * @return array<string, mixed> Arguments du hook, `html` renseigné
     */
    private function hook_calendar_appointment_feature(array $args): array
    {
        $args['html'] = $this->rc()->output->parse('visio.visio_appointment', false, false);

        return $args;
    }

    /**
     * Expose l'url de base de la visio au client JS et charge le module JS
     * du plugin.
     */
    private function load_client(): void
    {
        try {
            $this->set_env('visio_gouv_base_url', $this->get_config('visio_gouv_base_url'));
            $this->include_module('visio.js');
        } catch (\Throwable $e) {
            mel_logs::gi()->log(mel_logs::ERROR, "[visio] Échec du chargement du module JS : {$e->getMessage()}");
        }
    }

    /**
     * Construit le corps de la requête de création de salle à partir des
     * paramètres POST optionnels `access_level` et `configuration` (JSON).
     *
     * @return array<string, mixed>|null Corps de la requête, ou null si aucun paramètre
     */
    private function build_room_body(): ?array
    {
        $body = array_filter(
            [
                'access_level' => (string) $this->get_input_post('access_level'),
                'configuration' => $this->decode_configuration((string) $this->get_input_post('configuration')),
            ],
            static fn(string|array|null $value): bool => $value !== null && $value !== '',
        );

        return $body ?: null;
    }

    /**
     * Décode la configuration de salle transmise en JSON par le client.
     *
     * @param string $json Configuration encodée en JSON (vide si absente)
     *
     * @return array<string, mixed>|null Configuration décodée, ou null si absente ou invalide
     */
    private function decode_configuration(string $json): ?array
    {
        if ($json === '') {
            return null;
        }

        $configuration = json_decode($json, true);

        if (!is_array($configuration)) {
            mel_logs::gi()->log(mel_logs::WARN, '[visio] Configuration de salle invalide ignorée');
            return null;
        }

        return $configuration;
    }

    /**
     * Email de l'utilisateur courant, pour qui l'application agit auprès de l'API.
     *
     * @return string Email de l'utilisateur connecté (vide si inconnu)
     */
    private function current_user_email(): string
    {
        return (string) ($this->get_user()?->email ?? '');
    }

    /**
     * Journalise les échecs puis répond au client en JSON.
     *
     * @param VisioApiResponse $response Réponse du client API
     */
    private function respond(VisioApiResponse $response): void
    {
        if ($response->is_failure()) {
            mel_logs::gi()->log(mel_logs::ERROR, "[visio] Échec appel API (HTTP {$response->http_code})");
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

        foreach (glob(__DIR__ . '/lib/*.php') ?: [] as $file) {
            include_once $file;
        }
    }
}
