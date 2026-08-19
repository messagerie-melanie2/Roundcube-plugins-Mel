<?php
/**
 * Client de l'API de visioconférence "La Suite Numérique".
 *
 * Gère l'authentification OAuth2 (grant_type client_credentials, délégué
 * par email utilisateur via le paramètre scope) et expose un point d'entrée
 * générique {@see call()} pour consommer l'API, ainsi que des méthodes
 * dédiées aux endpoints "Rooms" ({@see list_rooms()}, {@see retrieve_room()},
 * {@see create_room()}) — l'authentification et le rafraîchissement du
 * token sont gérés une seule fois, dans {@see call()}.
 */
class visio_api extends amel_lib
{
    /** Clé de session utilisée pour mettre les tokens en cache par utilisateur */
    private const SESSION_KEY = 'visio_auth_tokens';

    /** Endpoint de génération de token (spec OAuth2 client_credentials) */
    private const CALL_TOKEN = '/application/token/';

    /** @var string */
    private $url;

    /** @var string */
    private $client_id;

    /** @var string */
    private $client_secret;

    public function __construct($rc, $plugin)
    {
        parent::__construct($rc, $plugin);
        $this->url = rtrim((string) $this->get_config('visio_gouv_url'), '/');
        $this->client_id = (string) $this->get_config('client_id');
        $this->client_secret = (string) $this->get_config('client_secret');
    }

    /**
     * Effectue un appel authentifié à l'API, en récupérant/rafraîchissant
     * automatiquement le token de l'utilisateur délégué si besoin.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     * @param string $endpoint   Chemin de l'endpoint, ex. '/rooms/'
     * @param string $method     Méthode HTTP ('GET', 'POST', 'PUT', 'DELETE')
     * @param array<string, mixed>|null $body Corps de la requête pour POST/PUT/DELETE
     *
     * @return array{httpCode: int, content: array<string, mixed>|null} Réponse décodée
     */
    public function call(string $user_email, string $endpoint, string $method = 'GET', ?array $body = null): array
    {
        $token = $this->get_token($user_email);

        if ($token === null) {
            return ['httpCode' => 401, 'content' => null];
        }

        $headers = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];
        $url = $this->url . $endpoint;

        $response = strtoupper($method) === 'GET'
            ? $this->fetch()->_get_url($url, null, $headers, [CURLOPT_PROXY => 'http://pfrie-std.proxy.e2.rie.gouv.fr:8080'])
            : $this->fetch()->_custom_url($url, strtoupper($method), $body, null, $headers, [CURLOPT_PROXY => 'http://pfrie-std.proxy.e2.rie.gouv.fr:8080']);

        return [
            'httpCode' => $response['httpCode'],
            'content' => json_decode((string) $response['content'], true),
        ];
    }

    /**
     * Liste les salles accessibles à l'utilisateur délégué.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     *
     * @return array{httpCode: int, content: array<string, mixed>|null} Réponse décodée
     */
    public function list_rooms(string $user_email): array
    {
        return $this->call($user_email, '/rooms');
    }

    /**
     * Récupère le détail d'une salle.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     * @param string $id         Identifiant UUID de la salle
     *
     * @return array{httpCode: int, content: array<string, mixed>|null} Réponse décodée
     */
    public function retrieve_room(string $user_email, string $id): array
    {
        return $this->call($user_email, '/rooms/' . rawurlencode($id));
    }

    /**
     * Crée une nouvelle salle.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     * @param array<string, mixed>|null $body Paramètres optionnels de création (access_level, configuration)
     *
     * @return array{httpCode: int, content: array<string, mixed>|null} Réponse décodée
     */
    public function create_room(string $user_email, ?array $body = null): array
    {
        return $this->call($user_email, '/rooms/', 'POST', $body);
    }

    /**
     * Récupère un token valide pour l'utilisateur donné, depuis le cache
     * de session s'il est encore valable, sinon en en demandant un nouveau.
     *
     * @param string $user_email Email de l'utilisateur délégué (scope du token)
     * @return string|null Token d'accès, ou null si son obtention a échoué
     */
    private function get_token(string $user_email): ?string
    {
        $cached = $_SESSION[self::SESSION_KEY][$user_email] ?? null;

        if ($cached !== null && $cached['expires'] > time()) {
            return $cached['token'];
        }

        return $this->request_new_token($user_email);
    }

    /**
     * Demande un nouveau token via le flow OAuth2 client_credentials et le
     * met en cache en session pour l'utilisateur concerné.
     *
     * @param string $user_email Email de l'utilisateur délégué (scope du token)
     * @return string|null Token d'accès, ou null en cas d'échec (voir logs)
     */
    private function request_new_token(string $user_email): ?string
    {
        $response = $this->fetch()->_custom_url($this->url . self::CALL_TOKEN, 'POST', [
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
            'grant_type' => 'client_credentials',
            'scope' => $user_email,
        ], null, ['Content-Type: application/json'], [CURLOPT_PROXY => 'http://pfrie-std.proxy.e2.rie.gouv.fr:8080']);

        $content = json_decode((string) $response['content'], true);

        if ($response['httpCode'] !== 200 || !isset($content['access_token'])) {
            mel_logs::gi()->log(mel_logs::ERROR, '[visio_api] Échec récupération token (HTTP ' . $response['httpCode'] . ') : ' . ($content['error'] ?? 'erreur inconnue'));
            return null;
        }

        $_SESSION[self::SESSION_KEY][$user_email] = [
            'token' => $content['access_token'],
            'expires' => time() + (int) $content['expires_in'],
        ];

        return $content['access_token'];
    }

    /**
     * Récupère le client HTTP bas niveau (mel_fetch) via le plugin mel_helper.
     *
     * @return mel_fetch
     */
    private function fetch()
    {
        return $this->get_helper()->fetch('', true, true);
    }
}
