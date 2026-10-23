<?php

declare(strict_types=1);

/**
 * Résultat d'une requête HTTP effectuée par {@see mel_fetch}.
 *
 * Une requête qui n'a pas pu aboutir (erreur réseau, TLS, initialisation, source illisible)
 * a un code HTTP à 0 et un message dans `$error`.
 * Une requête qui a abouti a `$error` à null, quel que soit son code HTTP :
 * un 404 ou un 500 reste une réponse valide du point de vue du transport.
 */
final readonly class FetchReturn
{
    /**
     * @param string|null $content Corps de la réponse, null en cas d'échec.
     * @param int $http_code Code HTTP de la réponse, 0 en cas d'échec.
     * @param string|null $error Message d'erreur, null si la requête a abouti.
     */
    public function __construct(
        public ?string $content,
        public int $http_code,
        public ?string $error = null,
    ) {}

    /**
     * Construit un résultat d'échec.
     *
     * @param string $error Message d'erreur.
     * @return self Résultat sans contenu, avec un code HTTP à 0.
     */
    public static function failure(string $error): self
    {
        return new self(null, 0, $error);
    }

    /**
     * Indique si la requête a abouti avec un code HTTP 2xx.
     *
     * @return bool
     */
    public function is_success(): bool
    {
        return $this->error === null
            && $this->http_code >= 200
            && $this->http_code < 300;
    }

    /**
     * Convertit le résultat au format tableau de l'ancienne API.
     *
     * `content` vaut `false` en cas d'échec, comme le renvoyait `curl_exec()`.
     *
     * @return array{content: string|false, httpCode: int, error: string|null}
     */
    public function to_array(): array
    {
        return [
            'content' => $this->content ?? false,
            'httpCode' => $this->http_code,
            'error' => $this->error,
        ];
    }
}

/**
 * Client HTTP basé sur cURL.
 *
 * Toutes les requêtes partagent des options de sécurité non surchargeables :
 * vérification TLS, protocoles limités à HTTP(S) y compris lors des redirections,
 * nombre de redirections borné et retour du contenu sous forme de chaîne.
 *
 * Les méthodes préfixées par « _ » constituent l'ancienne API, conservée pour
 * compatibilité : elles délèguent aux nouvelles méthodes et renvoient un tableau.
 */
class mel_fetch
{
    /** Délai maximal d'établissement de la connexion, en secondes. */
    private const int CONNECT_TIMEOUT = 10;

    /** Délai maximal de réponse pour une requête classique, en secondes. */
    private const int RESPONSE_TIMEOUT = 30;

    /** Délai maximal de réponse pour un envoi de fichier, en secondes. */
    private const int UPLOAD_TIMEOUT = 1200;

    /** Nombre maximal de redirections suivies. */
    private const int MAX_REDIRECTS = 5;

    /** Protocoles autorisés, pour la requête comme pour ses redirections. */
    private const int ALLOWED_PROTOCOLS = CURLPROTO_HTTP | CURLPROTO_HTTPS;

    /**
     * Options appliquées en dernier à chaque requête, non surchargeables par l'appelant.
     *
     * @var array<int, mixed>
     */
    private readonly array $_locked_options;

    /**
     * @param string $_user_agent User-Agent envoyé avec chaque requête.
     * @param bool $ssl_verify_peer Vérifie le certificat du serveur.
     * @param bool $ssl_verify_host Vérifie que le certificat correspond à l'hôte contacté.
     */
    public function __construct(
        private readonly string $_user_agent,
        bool $ssl_verify_peer = true,
        bool $ssl_verify_host = true,
    ) {
        if (!$ssl_verify_peer || !$ssl_verify_host) {
            mel_logs::gi()->log(mel_logs::WARN, '[mel_fetch] Vérification TLS désactivée');
        }

        $this->_locked_options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => $ssl_verify_peer,
            CURLOPT_SSL_VERIFYHOST => $ssl_verify_host ? 2 : 0,
            CURLOPT_MAXREDIRS => self::MAX_REDIRECTS,
            CURLOPT_PROTOCOLS => self::ALLOWED_PROTOCOLS,
            CURLOPT_REDIR_PROTOCOLS => self::ALLOWED_PROTOCOLS,
        ];
    }

    // =========================================================================
    // API
    // =========================================================================

    /**
     * Exécute une requête HTTP GET.
     *
     * Les redirections sont suivies, dans la limite de {@see self::MAX_REDIRECTS}.
     *
     * @param string $url URL cible.
     * @param array<string, mixed>|null $params Paramètres ajoutés à la query string.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @param array<int, mixed>|null $additional_options Options cURL supplémentaires.
     *        Les options de sécurité ne sont pas surchargeables.
     * @return FetchReturn Réponse, ou échec avec message d'erreur.
     */
    #[\NoDiscard("Ne pas utiliser le résultat de get_url() n'a pas de sens !")]
    public function get_url(
        string $url,
        ?array $params = null,
        ?array $headers = null,
        ?array $additional_options = null,
    ): FetchReturn {
        if (!empty($params)) {
            $url = $this->_append_query($url, $params);
        }

        $options = array_replace(
            $this->_base_options(self::RESPONSE_TIMEOUT),
            [CURLOPT_FOLLOWLOCATION => true],
            $headers !== null ? [CURLOPT_HTTPHEADER => $headers] : [],
            $additional_options ?? [],
        );

        return $this->_execute(__FUNCTION__, $url, $options);
    }

    /**
     * Exécute une requête HTTP POST.
     *
     * Raccourci de {@see self::request_url()} avec la méthode POST.
     *
     * @param string $url URL cible.
     * @param array<string, mixed>|null $params Données encodées en JSON pour former le corps.
     * @param string|null $json Corps brut, utilisé si `$params` est null.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @param array<int, mixed>|null $additional_options Options cURL supplémentaires.
     *        Les options de sécurité ne sont pas surchargeables.
     * @return FetchReturn Réponse, ou échec avec message d'erreur.
     */
    #[\NoDiscard("Ne pas utiliser le résultat de post_url() n'a pas de sens !")]
    public function post_url(
        string $url,
        ?array $params = null,
        ?string $json = null,
        ?array $headers = null,
        ?array $additional_options = null,
    ): FetchReturn {
        return $this->request_url('POST', $url, $params, $json, $headers, $additional_options);
    }

    /**
     * Exécute une requête HTTP avec corps (POST, PUT, PATCH, DELETE…).
     *
     * Le corps est construit à partir de `$params`, encodé en JSON, ou à défaut de `$json`,
     * transmis tel quel. Sans l'un ni l'autre, le corps est vide.
     *
     * Aucun en-tête Content-Type n'est ajouté automatiquement : sans en-tête explicite,
     * cURL envoie « application/x-www-form-urlencoded ». Pour du JSON, passer
     * « Content-Type: application/json » dans `$headers`.
     *
     * Les redirections ne sont pas suivies, sauf via `$additional_options`.
     *
     * @param string $method Méthode HTTP, insensible à la casse.
     * @param string $url URL cible.
     * @param array<string, mixed>|null $params Données encodées en JSON pour former le corps.
     * @param string|null $json Corps brut, utilisé si `$params` est null.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @param array<int, mixed>|null $additional_options Options cURL supplémentaires.
     *        Les options de sécurité ne sont pas surchargeables.
     * @return FetchReturn Réponse, ou échec avec message d'erreur.
     */
    #[\NoDiscard("Ne pas utiliser le résultat de request_url() n'a pas de sens !")]
    public function request_url(
        string $method,
        string $url,
        ?array $params = null,
        ?string $json = null,
        ?array $headers = null,
        ?array $additional_options = null,
    ): FetchReturn {
        try {
            $body = $this->_build_body($params, $json);
        } catch (\JsonException $e) {
            return $this->_fail(__FUNCTION__, 'Encodage JSON impossible : ' . $e->getMessage(), $url);
        }

        $method = strtoupper($method);

        $options = array_replace(
            $this->_base_options(self::RESPONSE_TIMEOUT),
            [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $body,
                CURLOPT_HTTPHEADER => $headers ?? [],
            ],
            $method !== 'POST' ? [CURLOPT_CUSTOMREQUEST => $method] : [],
            $additional_options ?? [],
        );

        return $this->_execute(__FUNCTION__, $url, $options);
    }

    /**
     * Envoie un fichier en HTTP PUT.
     *
     * La source peut être un chemin de fichier, ouvert puis refermé par la méthode,
     * ou un flux déjà ouvert, qui reste à la charge de l'appelant.
     *
     * @param string $url URL cible.
     * @param resource|string $source Chemin du fichier ou flux ouvert en lecture.
     * @param string[] $headers En-têtes au format « Nom: valeur ».
     * @param string|null $ca_file Fichier de certificats d'autorité à utiliser.
     * @param string|null $proxy Proxy HTTP à utiliser.
     * @return FetchReturn Réponse, ou échec avec message d'erreur.
     */
    #[\NoDiscard("Ne pas utiliser le résultat de put_url() n'a pas de sens !")]
    public function put_url(
        string $url,
        mixed $source,
        array $headers = [],
        ?string $ca_file = null,
        ?string $proxy = null,
    ): FetchReturn {
        $owns_handle = is_string($source);
        $handle = $owns_handle ? $this->_open_for_read($source) : $source;

        if (!is_resource($handle)) {
            return $this->_fail(__FUNCTION__, 'Source à envoyer illisible', $url);
        }

        try {
            $stat = fstat($handle);

            if ($stat === false) {
                return $this->_fail(__FUNCTION__, 'Taille de la source indéterminable', $url);
            }

            $options = array_replace(
                $this->_base_options(self::UPLOAD_TIMEOUT),
                [
                    CURLOPT_UPLOAD => true,
                    CURLOPT_INFILE => $handle,
                    CURLOPT_INFILESIZE => $stat['size'],
                    CURLOPT_HTTPHEADER => $headers,
                ],
                $ca_file !== null ? [CURLOPT_CAINFO => $ca_file] : [],
                $proxy !== null ? [CURLOPT_PROXY => $proxy] : [],
            );

            return $this->_execute(__FUNCTION__, $url, $options);
        } finally {
            if ($owns_handle) {
                fclose($handle);
            }
        }
    }

    // =========================================================================
    // Ancienne API (compatibilité)
    // =========================================================================

    /**
     * Récupère le contenu d'une page web.
     *
     * @param string $url URL cible.
     * @param array<string, mixed>|null $params Paramètres ajoutés à la query string.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @param array<int, mixed>|null $additionnal_options Options cURL supplémentaires.
     * @return array{content: string|false, httpCode: int, error: string|null}
     * @deprecated Utilisez plutôt get_url()
     */
    #[\Deprecated('Utilisez plutôt get_url()', since: '26.7')]
    #[\NoDiscard("Ne pas utiliser le résultat de _get_url() n'a pas de sens !")]
    public function _get_url(
        string $url,
        ?array $params = null,
        ?array $headers = null,
        ?array $additionnal_options = null,
    ): array {
        return $this->get_url($url, $params, $headers, $additionnal_options)->to_array();
    }

    /**
     * Poste des données vers une page web.
     *
     * @param string $url URL cible.
     * @param array<string, mixed>|null $params Données encodées en JSON pour former le corps.
     * @param string|null $json Corps brut, utilisé si `$params` est null.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @return array{content: string|false, httpCode: int, error: string|null}
     * @deprecated Utilisez plutôt post_url()
     */
    #[\Deprecated('Utilisez plutôt post_url()', since: '26.7')]
    #[\NoDiscard("Ne pas utiliser le résultat de _post_url() n'a pas de sens !")]
    public function _post_url(
        string $url,
        ?array $params = null,
        ?string $json = null,
        ?array $headers = null,
    ): array {
        return $this->post_url($url, $params, $json, $headers)->to_array();
    }

    /**
     * Exécute une requête HTTP avec une méthode personnalisée.
     *
     * @param string $url URL cible.
     * @param string $type Méthode HTTP.
     * @param array<string, mixed>|null $params Données encodées en JSON pour former le corps.
     * @param string|null $json Corps brut, utilisé si `$params` est null.
     * @param string[]|null $headers En-têtes au format « Nom: valeur ».
     * @param array<int, mixed>|null $otherOptions Options cURL supplémentaires.
     * @return array{content: string|false, httpCode: int, error: string|null}
     * @deprecated Utilisez plutôt request_url()
     */
    #[\Deprecated('Utilisez plutôt request_url()', since: '26.7')]
    #[\NoDiscard("Ne pas utiliser le résultat de _custom_url() n'a pas de sens !")]
    public function _custom_url(
        string $url,
        string $type,
        ?array $params = null,
        ?string $json = null,
        ?array $headers = null,
        ?array $otherOptions = null,
    ): array {
        return $this->request_url($type, $url, $params, $json, $headers, $otherOptions)->to_array();
    }

    /**
     * Envoie un fichier en HTTP PUT.
     *
     * @param string $url URL cible.
     * @param resource|string $path Chemin du fichier ou flux ouvert en lecture.
     * @param string[] $header En-têtes au format « Nom: valeur ».
     * @param string|null $curl_cafile Fichier de certificats d'autorité à utiliser.
     * @param string|null $curl_proxy Proxy HTTP à utiliser.
     * @return array{content: string|false, httpCode: int, error: string|null, url: string}
     * @deprecated Utilisez plutôt put_url()
     */
    #[\Deprecated('Utilisez plutôt put_url()', since: '26.7')]
    #[\NoDiscard("Ne pas utiliser le résultat de _put_url() n'a pas de sens !")]
    public function _put_url(
        string $url,
        mixed $path,
        array $header = [],
        ?string $curl_cafile = null,
        ?string $curl_proxy = null,
    ): array {
        return [
            ...$this->put_url($url, $path, $header, $curl_cafile, $curl_proxy)->to_array(),
            'url' => $url,
        ];
    }

    // =========================================================================
    // Interne
    // =========================================================================

    /**
     * Options communes à toutes les requêtes, surchargeables.
     *
     * @param int $timeout Délai maximal de réponse, en secondes.
     * @return array<int, mixed>
     */
    private function _base_options(int $timeout): array
    {
        return [
            CURLOPT_HEADER => false,
            CURLOPT_USERAGENT => $this->_user_agent,
            CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
            CURLOPT_TIMEOUT => $timeout,
        ];
    }

    /**
     * Exécute la requête cURL avec les options données, complétées par les options verrouillées.
     *
     * @param string $caller Nom de la méthode appelante, pour les logs.
     * @param string $url URL cible.
     * @param array<int, mixed> $options Options cURL de la requête.
     * @return FetchReturn Réponse, ou échec avec message d'erreur.
     */
    private function _execute(string $caller, string $url, array $options): FetchReturn
    {
        $ch = curl_init($url);

        if ($ch === false) {
            return $this->_fail($caller, 'Initialisation cURL impossible', $url);
        }

        if (!curl_setopt_array($ch, array_replace($options, $this->_locked_options))) {
            return $this->_fail($caller, 'Option cURL refusée : ' . curl_error($ch), $url);
        }

        $content = curl_exec($ch);

        if ($content === false) {
            return sprintf('[%d] %s', curl_errno($ch), curl_error($ch))
                |> (fn(string $message): FetchReturn => $this->_fail($caller, $message, $url));
        }

        return new FetchReturn($content, curl_getinfo($ch, CURLINFO_RESPONSE_CODE));
    }

    /**
     * Construit le corps d'une requête.
     *
     * @param array<string, mixed>|null $params Données à encoder en JSON, prioritaires.
     * @param string|null $json Corps brut, utilisé si `$params` est null.
     * @return string Corps de la requête, vide si aucune donnée n'est fournie.
     * @throws \JsonException Si `$params` ne peut pas être encodé.
     */
    private function _build_body(?array $params, ?string $json): string
    {
        return match (true) {
            $params !== null => json_encode($params, JSON_THROW_ON_ERROR),
            $json !== null => $json,
            default => '',
        };
    }

    /**
     * Ajoute les paramètres à la query string.
     *
     * Le fragment éventuel est retiré : il n'est jamais transmis au serveur.
     *
     * @param string $url URL d'origine.
     * @param array<string, mixed> $params Paramètres à ajouter.
     * @return string URL complétée.
     */
    private function _append_query(string $url, array $params): string
    {
        $base = explode('#', $url, 2)[0];

        return $base . (str_contains($base, '?') ? '&' : '?') . http_build_query($params);
    }

    /**
     * Ouvre un fichier en lecture binaire.
     *
     * @param string $path Chemin du fichier.
     * @return resource|false Flux ouvert, ou false si le fichier est absent ou illisible.
     */
    private function _open_for_read(string $path): mixed
    {
        return is_file($path) && is_readable($path) ? fopen($path, 'rb') : false;
    }

    /**
     * Logge un échec et renvoie le résultat d'erreur correspondant.
     *
     * Seul l'hôte est logué : le chemin et la query string peuvent contenir des secrets.
     *
     * @param string $caller Nom de la méthode appelante.
     * @param string $message Description de l'échec.
     * @param string $url URL ciblée.
     * @return FetchReturn Résultat d'échec.
     */
    private function _fail(string $caller, string $message, string $url): FetchReturn
    {
        $host = parse_url($url, PHP_URL_HOST) ?: '?';
        mel_logs::gi()->log(mel_logs::ERROR, "[mel_fetch] $caller() échec vers '$host' : $message");

        return FetchReturn::failure($message);
    }
}