<?php

// Require composer autoload for direct installs
@include __DIR__ . '/vendor/autoload.php';

use Jumbojett\OpenIDConnectClient;

    /**
     * Roundcube OIDC
     *
     * Login to roundcube with OpenID Connect provider
     *
     * @license	MIT License: <http://opensource.org/licenses/MIT>
     * @author Varun Patil
     * @category  Plugin for RoundCube WebMail
     */
    class roundcube_oidc extends rcube_plugin
    {
        public $task = 'login|logout';
        private $map;

        function init() {
            $this->load_config('config.inc.php.dist');
            $this->load_config('config.inc.php');
            $this->add_hook('template_object_loginform', array($this, 'loginform'));
        }

        function altReturn($ERROR) {
            // Get mail object
            $RCMAIL = rcmail::get_instance();

            // Check if overridden login page
            $altLogin = $RCMAIL->config->get('oidc_login_page');

            // Include and exit
            if (isset($altLogin) && !empty($altLogin)) {
                include $altLogin;
                exit;
            }
        }

        public function loginform($content) {
            // Add the login link
            $content['content'] .= "<p> <a href='?oidc=1'> Login with OIDC </a> </p>";

            // Check if we are starting or resuming oidc auth
            if (!isset($_GET['code']) && !isset($_GET['oidc'])) {
                $this->altReturn(null);
                return $content;
            }

            // Define error for alt login
            $ERROR = '';

            // Get mail object
            $RCMAIL = rcmail::get_instance();

            // Get master password and default imap server
            $password = $RCMAIL->config->get('oidc_imap_master_password');
            $imap_server = $RCMAIL->config->get('default_host');

            // Build provider
            $oidc = new OpenIDConnectClient(
                $RCMAIL->config->get('oidc_url'),
                $RCMAIL->config->get('oidc_client'),
                $RCMAIL->config->get('oidc_secret')
            );
            $oidc->addScope($RCMAIL->config->get('oidc_scope'));

            // Get user information
            try {
                $oidc->authenticate();
                $user = json_decode(json_encode($oidc->requestUserInfo()), true);
            } catch (\Exception $e) {
                $ERROR = 'OIDC Authentication Failed <br/>' . $e->getMessage();
                $content['content'] .= "<p class='alert-danger'> $ERROR </p>";
                $this->altReturn($ERROR);
                return $content;
            }

            // Parse fields
            $uid = $user[$RCMAIL->config->get('oidc_field_uid')];
            $password = get($user[$RCMAIL->config->get('oidc_field_password')], $password);
            $imap_server = get($user[$RCMAIL->config->get('oidc_field_server')], $imap_server);

            // Check if master user is present
            $master = $RCMAIL->config->get('oidc_config_master_user');
            if ($master != '') {
                $uid .= $RCMAIL->config->get('oidc_master_user_separator') . $master;
            }

            // Trigger auth hook
            $auth = $RCMAIL->plugins->exec_hook('authenticate', array(
                'user' => $uid,
                'pass' => $password,
                'cookiecheck' => true,
                'valid'       => true,
            ));

            // Login to IMAP
            if ($RCMAIL->login($auth['user'], $password, $imap_server, $auth['cookiecheck'])) {
                $RCMAIL->session->remove('temp');
                $RCMAIL->session->regenerate_id(false);
                $RCMAIL->session->set_auth_cookie();
                $RCMAIL->log_login();
                $query = array();
                $redir = $RCMAIL->plugins->exec_hook('login_after', $query + array('_task' => 'mail'));
                unset($redir['abort'], $redir['_err']);
                $query = array('_action' => '');
                $OUTPUT = new rcmail_html_page();
                $redir = $RCMAIL->plugins->exec_hook('login_after', $query + array('_task' => 'mail'));
                $RCMAIL->session->set_auth_cookie();

                // Update user profile
                $iid = $RCMAIL->user->get_identity()['identity_id'];
                $claim_name = $user['name'];
                if (isset($iid) && isset($claim_name)) {
                    $RCMAIL->user->update_identity($iid, array('name' => $claim_name));
                }

                $OUTPUT->redirect($redir, 0, true);
            } else {
                $ERROR = 'IMAP authentication failed!';
                $content['content'] .= "<p class='alert-danger'> $ERROR </p>";
            }

            $this->altReturn($ERROR);
            return $content;
        }

    }

    function get(&$var, $default=null) {
        return isset($var) ? $var : $default;
    }

