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

            if ($config['DEV']) {
                $dir = str_replace(['/public/welcome', '/public/reinit'], ['', ''], dirname($_SERVER['SCRIPT_FILENAME']));
            }
            else {
                $dir = __DIR__.'/../../../';
            }

            require_once $dir . '/vendor/autoload.php';

            global $user, $hash, $step;

            $step = 1;

            // Configuration du nom de l'application pour l'ORM
            if (!defined('CONFIGURATION_APP_LIBM2')) {
                define('CONFIGURATION_APP_LIBM2', 'roundcube');
            }

            // Inclusion de l'ORM M2
            @include_once 'includes/libm2.php';

            // Gestion des logs
            $log = function ($message) {
                utils::log("Extern - $message");
            };
            if ($config['debug']) {
                LibMelanie\Log\M2Log::InitDebugLog($log);
            }
            LibMelanie\Log\M2Log::InitInfoLog($log);
            LibMelanie\Log\M2Log::InitErrorLog($log);
            
            // Récupération des paramètres de la requête
            $hash = utils::get_input_value("_h", utils::INPUT_GPC);

            $params = unserialize(base64_decode(urldecode($hash)));

            if ($params === false) {
                utils::log("Extern/Core::Process() - Invalid hash");
                return false;
            }

            // Récupération de l'utilisateur et de sa clé
            $email = $params['email'];
            $key = $params['key'];

            // Récupération de l'objet utilisateur
            $user = new LibMelanie\Api\Mel\User(\LibMelanie\Config\Ldap::$MASTER_LDAP, 'webmail.external.users');
            $user->email = $email;

            if (!$user->load(['uid', 'email', 'firstname', 'lastname'])) {
                utils::log("Extern/Core::Process() [$email] - User not found");
                return false;
            }

            if (!$user->is_external) {
                utils::log("Extern/Core::Reinit() [$email] - User is not external");
                return false;
            }

            // Récupération de l'objet de la clé
            $currentKey = $user->getDefaultPreference('external_key');

            if (empty($currentKey) || $currentKey != $key) {
                utils::log("Extern/Core::Process() [$email] - Invalid key");
                return false;
            }

            // Est-ce que la clé est toujours valide ?
            $validity = $user->getDefaultPreference('external_key_validity');

            if (empty($validity) || time() - intval($validity) > intval($config['external_key_validity'])) {
                utils::log("Extern/Core::Process() [$email] - Key expired");
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

        utils::log("Extern/Core::Process() [$email] - Processed");
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
                utils::log("Extern/Core::Post() [$user->email] - LDAP error");
                $message = "Impossible d'enregistrer vos informations, merci de réessayer plus tard.";
            }
            else {
                $step = 2;
                $user->deletePreference(LibMelanie\Api\Mel\User::PREF_SCOPE_DEFAULT, 'external_key');
                $user->deletePreference(LibMelanie\Api\Mel\User::PREF_SCOPE_DEFAULT, 'external_key_validity');
            }
        }

        return true;
    }

    /**
     * Méthode de réinitialisation d'un email
     * 
     * @return boolean
     */
    public static function Reinit() {
        try {
            // Inclusion des fichiers
            require_once __DIR__ . '/../utils.php';
            require __DIR__ . '/../../config.inc.php';

            if ($config['DEV']) {
                $dir = str_replace('/public/forgotten', '', dirname($_SERVER['SCRIPT_FILENAME']));
            }
            else {
                $dir = __DIR__.'/../../../';
            }

            require_once $dir . '/vendor/autoload.php';

            global $user, $hash, $step;

            $step = 1;

            // Configuration du nom de l'application pour l'ORM
            if (!defined('CONFIGURATION_APP_LIBM2')) {
                define('CONFIGURATION_APP_LIBM2', 'roundcube');
            }

            // Inclusion de l'ORM M2
            @include_once 'includes/libm2.php';

            // Gestion des logs
            $log = function ($message) {
                utils::log("Extern - $message");
            };
            if ($config['debug']) {
                LibMelanie\Log\M2Log::InitDebugLog($log);
            }
            LibMelanie\Log\M2Log::InitInfoLog($log);
            LibMelanie\Log\M2Log::InitErrorLog($log);
            

            // Récupération des paramètres de la requête
            $email = utils::get_input_value("_email", utils::INPUT_GPC);

            // Récupération de l'objet utilisateur
            $user = new LibMelanie\Api\Mel\User();
            $user->email = $email;

            if (!$user->load(['uid', 'email'])) {
                utils::log("Extern/Core::Reinit() [$email] - User not found");
                return false;
            }

            if (!$user->is_external) {
                utils::log("Extern/Core::Reinit() [$email] - User is not external");
                return false;
            }

            // Est-ce que la clé est toujours valide ?
            $validity = $user->getDefaultPreference('external_key_validity');

            if (!empty($validity) && time() - intval($validity) <= intval($config['external_key_validity_reinit'])) {
                utils::log("Extern/Core::Reinit() [$email] - Key still valid");
                return false;
            }

            // Générer une clé unique pour l'utilisateur
            $key = bin2hex(random_bytes(32));

            if (!$user->saveDefaultPreference('external_key', $key) || !$user->saveDefaultPreference('external_key_validity', time())) {
                utils::log("Extern/Core::Reinit() [$email] - Unable to set key");
                return false;
            }

            $hash = [
                'email' => $email,
                'key'   => $key,
            ];

            // Envoi du mail
            require_once __DIR__ . '/../../../plugins/mel_helper/lib/mel_mail.php';

            // Chargement du body
            $body = file_get_contents(__DIR__ . '/../../forgotten/mail/email_external_reinit.html');

            // Remplacement des variables
            $body = str_replace([
                '{{logobnum}}',
                '{{user.url}}',
                '{{documentation.url}}',
                '{{bnum.base_url}}',
            ],[
                MailBody::load_image(__DIR__ . '/../../../plugins/mel_workspace/skins/elastic/pictures/logobnum.png', 'png'),
                utils::url('public/reinit/?_h=' . base64_encode(serialize($hash))),
                'https://fabrique-numerique.gitbook.io/bnum/ressources/guide-des-fonctionnalites/espaces-de-travail',
                'http://mtes.fr/2',
            ], $body);

            $subject = explode('-->' ,explode('Subject : ', $body)[1])[0];

            // Envoi du mail
            \LibMelanie\Mail\Mail::Send('bnum', $email, $subject, $body);
            
        }
        catch (Exception $e) {
            if (class_exists('utils')) {
                utils::log("Extern/Core::Process() [$email] - Erreur :" . $e->getMessage());
            }
            return false;
        }

        utils::log("Extern/Core::Process() [$email] - Processed");
        return true;
    }
}