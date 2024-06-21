<?php
/**
 * Classe de traitement pour l'initilisation des comptes externes
 */
class Core {

    /**
     * Méthode de traitement
     * 
     * @return boolean
     */
    public static function Process() {
        try {
            // Inclusion des fichiers
            require_once __DIR__ . '/../utils.php';
            require __DIR__ . '/../../config.inc.php';

            global $user, $hash, $step;

            $step = 1;

            // Configuration du nom de l'application pour l'ORM
            if (!defined('CONFIGURATION_APP_LIBM2')) {
                define('CONFIGURATION_APP_LIBM2', 'roundcube');
            }

            // Inclusion de l'ORM M2
            @include_once 'includes/libm2.php';

            // Récupération des paramètres de la requête
            $hash = utils::get_input_value("_h", utils::INPUT_GPC);

            $params = unserialize(base64_decode(urldecode($hash)));

            if ($params === false) {
                return false;
            }

            // Récupération de l'utilisateur et de sa clé
            $email = $params['email'];
            $key = $params['key'];

            // Récupération de l'objet utilisateur
            $user = new LibMelanie\Api\Mel\User(null, 'webmail.external.users');
            $user->email = $email;

            if (!$user->load(['uid', 'email', 'firstname', 'lastname'])) {
                return false;
            }

            // Récupération de l'objet de la clé
            $currentKey = $user->getDefaultPreference('external_key');

            if (empty($currentKey) || $currentKey != $key) {
                return false;
            }

            // Est-ce que la clé est toujours valide ?
            $validity = $user->getDefaultPreference('external_key_validity');

            if (empty($validity) || time() - intval($validity) > intval($config['external_key_validity'])) {
                return false;
            }

            // Est-ce qu'on est dans un post ?
            if (isset($_POST['_email']) && $_POST['_email'] = $user->email) {
                return self::Post($user);
            }
        }
        catch (Exception $e) {
            return false;
        }
        
        return true;
    }

    /**
     * Méthode de traitement pour la méthode POST
     * 
     * @param LibMelanie\Api\Mel\User $user
     */
    public static function Post($user) {
        global $message, $step;

        $is_reinit = strpos($_SERVER['SCRIPT_URL'], 'reinit') !== false;

        // Récupération des paramètres
        $firstname = utils::get_input_value("_firstname", utils::INPUT_POST);
        $lastname = utils::get_input_value("_lastname", utils::INPUT_POST);
        $password = utils::get_input_value("_password", utils::INPUT_POST);

        // Vérification des paramètres
        if (empty($firstname) || empty($lastname) || empty($password)) {
            $message = "Merci de renseigner tous les champs";
        }

        // Inclusion des fichiers
        require_once __DIR__ . '/../password.php';

        if (Password::Validate($password, $user)) {
            // Mise à jour de l'utilisateur
            if (!$is_reinit) {
                $user->firstname = $firstname;
                $user->lastname = $lastname;
            }
            $user->password = Password::SSHA1PasswordGenerator($password);

            $ret = $user->save();

            // Erreur d'enregistrement ldap
            if (is_null($ret)) {
                $message = "Impossible d'enregistrer vos informations, merci de réessayer plus tard.";
            }
            else {
                $step = 2;
            }
        }

        return true;
    }
}