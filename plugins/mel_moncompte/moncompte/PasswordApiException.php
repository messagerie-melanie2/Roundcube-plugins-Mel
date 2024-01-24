<?php
/**
 * Exception de PasswordApiService
 * @author houeljm
 *
 */
final class PasswordApiException extends \Exception
{

    /**
     * 
     * @param integer $httpCode code retoour htpp de la requête curl
     * @param object $result Résultat de la requête curl
     */
    public function __construct($httpCode, $result)
    {
        $message = '';
        
        if ($httpCode < 500)
            $message = $result->msg;
        parent::__construct($message, $httpCode);
    }
}

