<?php
declare(strict_types=1);

/**
 * Méthodes HTTP acceptées par l'API de visioconférence.
 */
enum VisioHttpMethod: string
{
    case Get = 'GET';
    case Post = 'POST';
    case Put = 'PUT';
    case Delete = 'DELETE';
}

/**
 * Réponse décodée d'un appel à l'API de visioconférence.
 *
 * Sérialisée en JSON sous la forme `{httpCode, content}` attendue par le
 * client JS du plugin (connectors.js).
 */
final readonly class VisioApiResponse implements JsonSerializable
{
    /** Code HTTP à partir duquel une réponse est considérée en échec */
    private const int FIRST_ERROR_CODE = 400;

    /**
     * @param int                       $http_code Code HTTP de la réponse
     * @param array<string, mixed>|null $content   Corps JSON décodé, null s'il est absent ou invalide
     */
    public function __construct(
        public int $http_code,
        public ?array $content = null,
    ) {}

    /**
     * Construit une réponse à partir de la réponse brute de mel_fetch.
     *
     * @param array{httpCode: int, content: string|false|null} $raw Réponse brute
     */
    public static function from_raw(array $raw): self
    {
        $content = json_decode((string) ($raw['content'] ?? ''), true);

        return new self((int) $raw['httpCode'], is_array($content) ? $content : null);
    }

    /**
     * Réponse renvoyée quand aucun token n'a pu être obtenu.
     */
    public static function unauthorized(): self
    {
        return new self(401);
    }

    /**
     * Indique si l'appel a échoué (code HTTP 4xx ou 5xx).
     */
    public function is_failure(): bool
    {
        return $this->http_code >= self::FIRST_ERROR_CODE;
    }

    /**
     * @return array{httpCode: int, content: array<string, mixed>|null}
     */
    #[\Override]
    public function jsonSerialize(): array
    {
        return ['httpCode' => $this->http_code, 'content' => $this->content];
    }
}

/**
 * Client de l'API de visioconférence "La Suite Numérique".
 *
 * Gère l'authentification OAuth2 (grant_type client_credentials, délégué
 * par email utilisateur via le paramètre scope) et expose un point d'entrée
 * générique {@see call()} pour consommer l'API, ainsi que des méthodes
 * dédiées aux endpoints "Rooms" ({@see list_rooms()}, {@see retrieve_room()},
 * {@see create_room()}). L'authentification et le rafraîchissement du
 * token sont gérés une seule fois, dans {@see call()}.
 */
final class visio_api extends amel_lib
{
    /** Clé de session utilisée pour mettre les tokens en cache par utilisateur */
    private const string SESSION_KEY = 'visio_auth_tokens';

    /** Endpoint de génération de token (spec OAuth2 client_credentials) */
    private const string CALL_TOKEN = '/application/token/';

    /**
     * Marge (en secondes) avant expiration à partir de laquelle un token en
     * cache est renouvelé, pour ne pas l'utiliser alors qu'il expire pendant l'appel.
     */
    private const int TOKEN_EXPIRY_MARGIN = 30;

    /** Url de base de l'API, sans slash final */
    private readonly string $url;

    /** Identifiant de l'application */
    private readonly string $client_id;

    /** Secret de l'application */
    private readonly string $client_secret;

    /**
     * @param rcmail      $rc     Instance rcmail courante
     * @param bnum_plugin $plugin Plugin propriétaire de ce client API
     */
    public function __construct(rcmail $rc, bnum_plugin $plugin)
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
     * @param string                    $user_email Email de l'utilisateur pour qui l'application agit
     * @param string                    $endpoint   Chemin de l'endpoint, ex. '/rooms/'
     * @param VisioHttpMethod           $method     Méthode HTTP
     * @param array<string, mixed>|null $body       Corps de la requête (hors GET)
     *
     * @return VisioApiResponse Réponse décodée (401 si aucun token n'a pu être obtenu)
     */
    #[\NoDiscard("call() ne lève pas d'exception en cas d'échec : la réponse doit être lue pour connaître le résultat de l'appel")]
    public function call(
        string $user_email,
        string $endpoint,
        VisioHttpMethod $method = VisioHttpMethod::Get,
        ?array $body = null,
    ): VisioApiResponse {
        $token = $this->get_token($user_email);

        if ($token === null) {
            return VisioApiResponse::unauthorized();
        }

        $headers = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];
        $url = $this->url . $endpoint;

        return match ($method) {
            VisioHttpMethod::Get => $this->fetch()->_get_url($url, null, $headers, $this->get_proxy()),
            default => $this->fetch()->_custom_url($url, $method->value, $body, null, $headers, $this->get_proxy()),
        } |> VisioApiResponse::from_raw(...);
    }

    /**
     * Liste les salles accessibles à l'utilisateur délégué.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     */
    #[\NoDiscard("list_rooms() n'a aucun effet de bord : ignorer la réponse rend l'appel inutile")]
    public function list_rooms(string $user_email): VisioApiResponse
    {
        return $this->call($user_email, '/rooms');
    }

    /**
     * Récupère le détail d'une salle.
     *
     * @param string $user_email Email de l'utilisateur pour qui l'application agit
     * @param string $id         Identifiant UUID de la salle
     */
    #[\NoDiscard("retrieve_room() n'a aucun effet de bord : ignorer la réponse rend l'appel inutile")]
    public function retrieve_room(string $user_email, string $id): VisioApiResponse
    {
        return $this->call($user_email, '/rooms/' . rawurlencode($id));
    }

    /**
     * Crée une nouvelle salle.
     *
     * @param string                    $user_email Email de l'utilisateur pour qui l'application agit
     * @param array<string, mixed>|null $body       Paramètres optionnels de création (access_level, configuration)
     */
    #[\NoDiscard("create_room() peut échouer sans exception : la réponse doit être lue pour savoir si la salle existe")]
    public function create_room(string $user_email, ?array $body = null): VisioApiResponse
    {
        return $this->call($user_email, '/rooms/', VisioHttpMethod::Post, $body);
    }

    /**
     * Récupère un token valide pour l'utilisateur donné, depuis le cache
     * de session s'il est encore valable, sinon en en demandant un nouveau.
     *
     * Le cache reste un simple tableau : la session est démarrée avant le
     * chargement des plugins, un objet y serait désérialisé en
     * __PHP_Incomplete_Class.
     *
     * @param string $user_email Email de l'utilisateur délégué (scope du token)
     *
     * @return string|null Token d'accès, ou null si son obtention a échoué
     */
    private function get_token(string $user_email): ?string
    {
        $cached = $_SESSION[self::SESSION_KEY][$user_email] ?? null;

        if ($cached !== null && $cached['expires'] - self::TOKEN_EXPIRY_MARGIN > time()) {
            return $cached['token'];
        }

        return $this->request_new_token($user_email);
    }

    /**
     * Demande un nouveau token via le flow OAuth2 client_credentials et le
     * met en cache en session pour l'utilisateur concerné.
     *
     * @param string $user_email Email de l'utilisateur délégué (scope du token)
     *
     * @return string|null Token d'accès, ou null en cas d'échec (voir logs)
     */
    private function request_new_token(string $user_email): ?string
    {
        $response = $this->fetch()->_custom_url($this->url . self::CALL_TOKEN, VisioHttpMethod::Post->value, [
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
            'grant_type' => 'client_credentials',
            'scope' => $user_email,
        ], null, ['Content-Type: application/json'], $this->get_proxy())
            |> VisioApiResponse::from_raw(...);

        $token = $response->content['access_token'] ?? null;

        if ($response->http_code !== 200 || !is_string($token)) {
            mel_logs::gi()->log(mel_logs::ERROR, "[visio_api] Échec récupération token (HTTP {$response->http_code}) : " . ($response->content['error'] ?? 'erreur inconnue'));
            return null;
        }

        $_SESSION[self::SESSION_KEY][$user_email] = [
            'token' => $token,
            'expires' => time() + (int) ($response->content['expires_in'] ?? 0),
        ];

        return $token;
    }

    /**
     * Construit les options cURL de proxy à partir de la configuration.
     *
     * @return array<int, mixed> Options cURL additionnelles (vide si aucun proxy configuré)
     */
    private function get_proxy(): array
    {
        $proxy = $this->get_config('visio_gouv_proxy');

        return $proxy ? [CURLOPT_PROXY => $proxy] : [];
    }

    /**
     * Récupère le client HTTP bas niveau (mel_fetch) via le plugin mel_helper.
     */
    private function fetch(): mel_fetch
    {
        return $this->get_helper()->fetch('', true, true);
    }
}
