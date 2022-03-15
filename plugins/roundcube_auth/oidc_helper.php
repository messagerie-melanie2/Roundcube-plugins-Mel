<?php

// Require composer autoload for direct installs
@include __DIR__ . '/vendor/autoload.php';

use Jumbojett\OpenIDConnectClient;

    /**
     * TokenTypeEnum
     *
     * Types of tokens that 'Cerbère Token Helper' can handle/deal with
     * @see OIDC_Helper
     *
     * @author Tom-Brian GARCIA
     * @category "Enum" PHP class
     */
    abstract class TokenTypeEnum
    {
        const ID_TOKEN = "ID_TOKEN";
        const ACCESS_TOKEN = "ACCESS_TOKEN";
        const REFRESH_TOKEN = "REFRESH_TOKEN";

        // public static $values = array(
        //     ID_TOKEN        => 1, 
        //     ACCESS_TOKEN    => 2, 
        //     REFRESH_TOKEN   => 3
        // );
    }

    /**
     * OIDC Helper
     *
     * Class wrapping 'Jumbojett\OpenIDConnectClient' to provide easy usage of OIDC
     *
     * @author Tom-Brian GARCIA
     * @category Helper PHP class for RoundCube WebMail plugin
     */
    class OIDC_Helper
    {
        private $oidc;
        private $userInfo;

        function __construct(
            string $url, string $clientID, string $clientSecret, 
            array $scopes, bool $hostVerification, bool $peerVerification, 
            string $proxyURL = '')
        {
            // Initialize OIDC object
            $this->oidc = new OpenIDConnectClient($url, $clientID, $clientSecret);
            if($proxyURL != '')
            {
                $this->oidc->setHttpProxy($proxyURL);
            }

            // Add scopes
            //
            // 'openid' => Returns the sub claim, which uniquely identifies the user. In an ID Token, iss, aud, exp, iat, and at_hash claims will also be present. REQUIRED but already added by the lib
            // 'profile' => Returns claims that represent basic profile information, including name, family_name, given_name, middle_name, nickname, picture, and updated_at.
            // 'email' => Returns the email claim, which contains the user's email address, and email_verified, which is a boolean indicating whether the email address was verified by the user.
            // ...
            //
            foreach($scopes as $scope)
            {
                $this->oidc->addScope($scope);
            }

            // Will trigger Host and/or Peer verification(s)
            $this->oidc->setVerifyHost($hostVerification);
            $this->oidc->setVerifyPeer($peerVerification);
        
            //$this->doAuth()
        }

        function doAuth()
        {
            // Authenticate to get the tokens and user information
            $this->oidc->authenticate();
            $this->userInfo = $this->oidc->requestUserInfo();
        }

        /**
         * 
         */
        function getToken(/*int*/ $tokenType)
        {
            /*
            $data = $oidc->introspectToken($this->oidc->getAccessToken());
            var_dump(">>>>>>>>>>>>>>>>" . $data);

            if (!$data->active)
            {
                var_dump(">>>>>>>>>>>>>>>>" . "the token is no longer usable");
                // Authenticate to get the tokens and get user information
                //$this->oidc->authenticate();
                //$this->userInfo = $this->oidc->requestUserInfo();
            }
            */

            switch($tokenType)
            {
                //case TokenTypeEnum::$values[TokenTypeEnum::ID_TOKEN]:
                case TokenTypeEnum::ID_TOKEN:
                    return $this->oidc->getIdToken();
                    break;
                    
                //case TokenTypeEnum::$values[TokenTypeEnum::ACCESS_TOKEN]:
                case TokenTypeEnum::ACCESS_TOKEN:
                    return $this->oidc->getAccessToken();
                    break;
                    
                //case TokenTypeEnum::$values[TokenTypeEnum::REFRESH_TOKEN]:
                case TokenTypeEnum::REFRESH_TOKEN:
                    return $this->oidc->getRefreshToken();
                    break;
                    
                default:
                    throw new InvalidArgumentException("The given tokenType does not match any value of TokenTypeEnum.");
                    break;
            }

            

        }

        /**
         * 
         */
        function getUserInfo()
        {
            return $this->userInfo;
            //return $this->$oidc->requestUserInfo();
        }

        /**
         * 
         */
        function getOIDC()
        {
            return $this->oidc;
        }

        /**
         * 
         */
        function signout(string $logoutURL)
        {
            $this->oidc->signOut($oidc->getIdToken(), $logoutURL);
        }

    }

