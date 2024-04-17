<?php
require_once 'PasswordApiException.php';
/**
 * Service contenant les appels aux fonctions du web service
 * Les fonctions sont appelées via des requêtes curl 
 * @author houeljm
 *
 */
final class PasswordApiService
{
    /**
     * Header préfixe pour l'accès à certaine fonction du web service
     * @var string
     */
    private const HEADER_BASIC_PREFIX = 'Authorization: Basic ';
    
    /**
     * Header préfixe pour l'accès à certaine fonction du web service
     * @var string
     */
    private const HEADER_BEARER_PREFIX = 'Authorization: Bearer ';
    
    /**
     * Options de base pour les requêtes curl
     * @var array
     */
    private const CURL_BASE_OPTIONS = array(CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    );

    /**
     * Tableau de paramètres du web service
     * @var array
     */
    private $apiConfig = null;
    
    /**
     * 
     * @var string
     */
    private $token = null;
    private $canChange = false;
    
    /**
     * Instance du service
     * @var PasswordApiService
     */
    static private $instance;
    
    /**
     * Singleton
     * @param array $apiConfig Tableau contenant les paramètres d'accès au fonction du web service
     * @return PasswordApiService Instance unique de la classe
     */
    static function getInstance($apiConfig)
    {
        if (!self::$instance || !is_a(self::$instance, 'PasswordApiService')) {
            self::$instance = new PasswordApiService($apiConfig);
        }
        
        return self::$instance;
    }
    
    
    /**
     * Initialisation des paramètres d'accès au web service
     * @param array $apiConfig
     */
    private function __construct($apiConfig)
    {
        $this->apiConfig = $apiConfig;
    }
    
    public function getToken()
    {
        return $this->token;
    }

    public function isCanChange()
    {
        return $this->canChange;
    }
    
    public function setCanChange($canChange)
    {
        $this->canChange = $canChange;
    }
    
    /**
     * Tente d'authetifier l'utilisateur avec son identifiant et mot de passe
     * Récupère le token suite à l'authentification réussie
     * @param string $email email ou uid de l'utilisateur
     * @param string $password mot de passe de l'utilisateur
     * @throws PasswordApiException Exception si code retour de la requête curl différent de 200
     * @return string token
     */
    public function authUser($email, $password)
    {
        $this->token = null;
        $header = array(self::HEADER_BASIC_PREFIX . base64_encode($email . ':' . $password));
        $options = array(CURLOPT_POST => true);
        $result = $this->apiExec($this->apiConfig['auth_user_endpoint'], $header, $options);
        $this->token = $result->token;
        return $this->token;
    }

    /**
     * Permet de savoir si l'utilisateur est autorisé à changer son mot de passe
     * @throws PasswordApiException Exception si code retour de la requête curl différent de 200
     * @return boolean true si le mot de passe peut ête changé, false sinon
     */
    public function canChange()
    {
        $header = array(self::HEADER_BEARER_PREFIX . $this->token);
        $result = $this->apiExec($this->apiConfig['pwd_user_canchange_endpoint'], $header);
        $this->canChange = $result->canChangePassword;
        return $this->canChange;
    }
    
    /**
     * Révoque le token
     * @throws PasswordApiException Exception si code retour de la requête curl différent de 200
     */
    public function tokenRevoke()
    {
        $header = array(self::HEADER_BEARER_PREFIX . $this->token);
        $options = array(CURLOPT_POST => true);
        $this->apiExec($this->apiConfig['token_revoke_endpoint'], $header, $options);
        $this->token = null;
    }
    
    /**
     *
     * @param string $path endpoint de la fonction du service web à appeler
     * @param array $header Header de la requête curl
     * @param array $options Options de la requete curl
     * @throws PasswordApiException Exception si code retour de la requête curl différent de 200
     * @return Object Résultat de la requête curl
     */
    private function apiExec($path, $header = null, $options = null)
    {
        $ch = curl_init();
        
        $allOptions = array(CURLOPT_URL => $this->apiConfig['api_uri'] . $path);
        $allOptions += self::CURL_BASE_OPTIONS;
        if ($header !== null)
        {
            $allOptions += [CURLOPT_HTTPHEADER => $header];
        }
        if ($options !== null)
        {
            $allOptions += $options;
        }
        curl_setopt_array($ch, $allOptions);
        
        $result = json_decode(curl_exec($ch));
        
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        curl_close($ch);
        
        if ($httpCode != 200)
        {
            throw new PasswordApiException($httpCode, $result);
        }
        
        $result = $result;
        
        
        return $result;
    }
}