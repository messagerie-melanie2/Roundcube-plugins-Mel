<?php

// Require composer autoload for direct installs
@include __DIR__ . '/vendor/autoload.php';

use Jumbojett\OpenIDConnectClient;

    /**
     * TokenTypeEnum
     *
     * Types of tokens that 'Cerbère Token Helper' can handle/deal with
     * @see CerbereTokenHelper
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
     * Cerbère Token Helper
     *
     * Types of modifications that 'Cerbère Token Helper' can do to the tokens
     * @see CerbereTokenHelper
     *
     * @author Tom-Brian GARCIA
     * @category "Enum" PHP class
     */
    abstract class ModificationTypeEnum
    {
        const MODIFY_CONTENT_JSON   = "MODIFY_CONTENT_JSON";
        const APPEND_CONTENT_JSON   = "APPEND_CONTENT_JSON";
        const APPEND_CONTENT        = "APPEND_CONTENT";

        // public static $values = array(
        //     MODIFY_CONTENT_JSON => 1, 
        //     APPEND_CONTENT_JSON => 2, 
        //     APPEND_CONTENT      => 3
        // );

        // public static function getReadableName($value)
        // {
        //     switch($value)
        //     {
        //         case ModificationTypeEnum::$values[ModificationTypeEnum::MODIFY_CONTENT_JSON]:
        //             return MODIFY_CONTENT_JSON;
        //             //break;
                    
        //         case ModificationTypeEnum::$values[ModificationTypeEnum::APPEND_CONTENT_JSON]:
        //             return APPEND_CONTENT_JSON;
        //             //break;
                    
        //         case ModificationTypeEnum::$values[ModificationTypeEnum::APPEND_CONTENT]:
        //             return APPEND_CONTENT;
        //             //break;
                    
        //         default:
        //             return null;
        //             //break;

        //     }
        // }
    }

    /**
     * Cerbère Token Helper
     *
     * Class wrapping 'Jumbojett\OpenIDConnectClient' to provide easy usage of OIDC with Cerbère
     *
     * @author Tom-Brian GARCIA
     * @category Helper PHP class for RoundCube WebMail plugin
     */
    class CerbereTokenHelper
    {
        private $oidc;
        private $userInfo;

        function __construct(string $url, string $clientID, string $clientSecret, array $scopes, bool $hostVerification, bool $peerVerification)
        {
            // Initialize OIDC object
            $this->oidc = new OpenIDConnectClient($url, $clientID, $clientSecret);

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
        
            // Authenticate to get the tokens and get user information
            $this->oidc->authenticate();
            $this->userInfo = $this->oidc->requestUserInfo();
        }

        /**
         * 
         */
        function getToken(/*int*/ $tokenType)
        {/*
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

        /**
         * @param token : ID Token to modify
         * @param values : Array of values to add/remove to/from the ID Token
         * @param modificationType : 
         * @param revert : Wether the function should remove values from the ID Token ('true') or add them ('false')
         * @param debug : Enabled debugging, basically outputs of each step with echo/var_dump
         */
        function modifyTokenID(string $token, /*array*/ $values, /*int*/ $modificationType, bool $revert, bool $debug)
        {
            if($debug)
            {
                echo "========== Token modification ==========<br />";
                echo "Revert : ", $revert, "<br />";
                echo "Type : ", /*ModificationTypeEnum::getReadableName(*/$modificationType/*)*/, "<br />";
                echo "========== ========== ==========<br />";
                echo "ID Token (original) : ", $token, "<br />";
                echo "ID Token (values) : ", $values, "<br />";
                echo "========== ========== ==========<br />";
            }

            switch($modificationType)
            {
                //case ModificationTypeEnum::values[ModificationTypeEnum::MODIFY_CONTENT_JSON]:
                case ModificationTypeEnum::MODIFY_CONTENT_JSON:

                    // Explode Token - Base64(JOSE header).Base64(Payload).Base64(Signature)
                    list($header, $payload, $signature) = explode(".", $token, 3);
                    if($debug)
                    {
                        echo "ID Token (header) : ", $header, "<br />";
                        echo "ID Token (payload) : ", $payload, "<br />";
                        echo "ID Token (signature) : ", $signature, "<br />";
                    }

                    // Decode the payload (from Base64)
                    $payloadAsJsonString = base64_decode($payload);
                    if($debug) { echo "ID Token (payload) : ", $payloadAsJsonString, "<br />"; }

                    // Convert it from JSON to an array
                    $payloadAsPhpArray = json_decode($payloadAsJsonString, true); // true to turn the JSON into an array, not an object

                    // If the conversion has been successful, modify the token
                    if($payloadAsPhpArray != null)
                    {
                        if($debug) { echo "Token before modification : <br/>", "<pre>", var_dump($payloadAsPhpArray), "</pre>", "<br/>"; }

                        if(!$revert)
                        {
                            // Adding fields to token
                            foreach ($values as $key => $value)
                            {
                                $payloadAsPhpArray[$key] = $value;
                            }
                        }
                        else
                        {
                            // Adding fields to token
                            foreach ($values as $key => $value)
                            {
                                unset($payloadAsPhpArray[$key]);
                            }
                        }
                        
                        
                        if($debug) { echo "Token after modification : <br/>", "<pre>", var_dump($payloadAsPhpArray), "</pre>", "<br/>"; }
                    }
                    else { throw new JsonException("Bad JSON provided"); }

                    // Convert the array into a JSON string
                    $payloadAsJsonString = json_encode($payloadAsPhpArray);
                    if($debug) { echo "ID Token (payload) : ", $payloadAsJsonString, "<br />"; }

                    // Encode the payload (to Base64)
                    $payload = base64_encode($payloadAsJsonString);
                    if($debug) { echo "ID Token (payload) : ", $payloadAsJsonString, "<br />"; }

                    // Rebuild the token
                    $token = implode (".", [$header, $payload, $signature]);
                    if($debug) { echo "ID Token : ", $token, "<br />"; }

                    break;
                    
                //case ModificationTypeEnum::$values[ModificationTypeEnum::APPEND_CONTENT_JSON]:
                case ModificationTypeEnum::APPEND_CONTENT_JSON:
                //case ModificationTypeEnum::$values[ModificationTypeEnum::APPEND_CONTENT]:
                case ModificationTypeEnum::APPEND_CONTENT:

                    // Remove values from the token (APPEND)
                    if($revert)
                    {
                        // TODO
                        echo "TODO";
                    }
                    // Add values to the token (APPEND)
                    else
                    {
                        // Convert the values to a JSON array
                        //if($modificationType == ModificationTypeEnum::$values[ModificationTypeEnum::APPEND_CONTENT_JSON])
                        if($modificationType == ModificationTypeEnum::APPEND_CONTENT_JSON)
                        {
                            $values = json_encode($values);
                            if($debug) { echo "ID Token (values as JSON) : ", $values, "<br />"; }
                        }
        
                        // Encode the values in Base64
                        $values = base64_encode($values);
                        if($debug) { echo "ID Token (values as Base64) : ", $values, "<br />"; }
                        
                        // Append the values to the token, separated with a dot (.)
                        $token = $token . "." . $values;
                        if($debug) { echo "ID Token (appended) : ", $token, "<br />"; }
                    }

                    break;
                    
                default:
                    throw new InvalidArgumentException("The given modificationType does not match any value of ModificationTypeEnum.");
                    break;
            }

            return $token;
        }

        // /**
        //  * Format code for debugging purposes
        //  */
        // protected function formatCode($data)
        // {
        //     return '<pre style="word-wrap: break-word;white-space:  break-spaces;width: 75%;">' . $data . '</pre>';
        // }

    }

