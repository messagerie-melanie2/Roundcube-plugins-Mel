<?php 
/**
 * Plugin Mél Portail
 *
 * Portail web
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_parapheur extends bnum_plugin
{
    public $task = '.*';
    const JS_PATH = '/js/';
    public const TASK_NAME = 'parapheur';

    /**
     * Méthode héritée de rcube_plugin
     * pour l'initialisation du plugin
     * @see rcube_plugin::init()
     */
    function init()
    {
        if (!mel::is_internal()) return;

        $this->load_config();

        switch ($this->rc()->task) {
            case 'settings':
                $this->add_hook('mel_metapage.navigation.apps', array($this, 'gestion_apps'));
                break;
            
            case 'mail':
                $this->add_hook('message_compose', [$this, 'message_compose']);    
                break;
            default:
                # code...
                break;
        }

        if (true === $this->get_config('enabled')) {
            $this->add_texts('localization/', true);

            switch ($this->rc()->task) {
                case self::TASK_NAME:
                    $this->register_task(self::TASK_NAME);
                    $this->start_parapheur();
                    break;

                case 'mail':
                    $this->add_button(array(
                        'command' => 'toParapheur',
                        'class'	=> 'to-parapheur forward inline active',
                        'classAct' => 'to-parapheur forward inline  active',
                        'label'	=> 'to-parapheur',
                        'title' => 'to-parapheur',
                        'type'       => 'link-menuitem',
                        'domain' => "mel_parapheur",
                    ), 'forwardmenu');

                    switch ($this->rc()->action) {
                        case '':
                        case 'index':
                            $this->load_script_module('mails_actions.js', self::JS_PATH);
                            break;
                        
                        default:
                            break;
                    }

                    
                    break;

                default:
                    if ($_SERVER['REQUEST_METHOD'] === 'GET'){
                        // Ajoute le bouton en fonction de la skin
                        $need_button = 'taskbar';
                        if (class_exists("mel_metapage")) {
                            $need_button = $this->rc()->plugins->get_plugin('mel_metapage')->is_app_enabled('app_parapheur', false) ? $need_button : 'otherappsbar';
                        }
                    
                        if ($need_button)
                        {
                            $this->add_button(array(
                                'command' => self::TASK_NAME,
                                'class'	=> 'parapheur',
                                'classsel' => 'parapheur selected',
                                'innerclass' => 'inner',
                                'label'	=> 'parapheur',
                                'title' => '',
                                'type'       => 'link',
                                'domain' => "mel_parapheur",
                                'href' => './?_task='.self::TASK_NAME,
                                'style' => 'order:17'
                            ), $need_button);
                        }
                    }
                    break;
            }
            
        }
    }

/**
 * La fonction "start_parapheur" enregistre deux actions, "index" et "to_parapheur", avec leurs
 * fonctions de rappel correspondantes.
 */
    function start_parapheur() {
        $this->register_action('index', array($this, 'index'));
        $this->register_action('to_parapheur', array($this, 'send_to_parapheur'));
    }

/**
 * La fonction index configure des gestionnaires, inclut une feuille de style, définit le titre de la
 * page et envoie la sortie de la page Parapheur.
 */
    function index() {
        $this->rc()->output->add_handlers(array(
            'parapheur-frame' => array(
                            $this,
                            'parapheur_frame'
            )
        ));

        $this->include_stylesheet($this->local_skin_path() . '/style.css');

        $this->rc()->output->set_pagetitle('Parapheur');
        $this->rc()->output->send('mel_parapheur.index');
    }

/**
 * La fonction `send_to_parapheur()` envoie un message à une adresse email spécifiée en utilisant la
 * classe `rcmail_sendmail` en PHP.
 */
    function send_to_parapheur() {
        $rcmail = $this->rc();
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $rcmail->get_storage()->set_folder($folder);

        $SENDMAIL  = new rcmail_sendmail([], [
            'sendmail'      => true,
            'saveonly'      => false,
            'savedraft'     => false,
            'error_handler' => function() use ($rcmail) {
                call_user_func_array([$rcmail->output, 'show_message'], func_get_args());
                $rcmail->output->send('iframe');
            }
        ]);

        $message = new rcube_message($uid, $folder);

        $message->headers->from = driver_mel::get_instance()->getUser()->email;
        $message->headers->to = $this->get_config('mail');
        $message->headers->cc = null;
        $message->headers->bcc = null;

        $SENDMAIL = new rcmail_sendmail(
            ['mode' => rcmail_sendmail::MODE_FORWARD],
            [
                'sendmail'      => true,
                'error_handler' => function() use ($rcmail) {
                    call_user_func_array([$rcmail->output, 'show_message'], func_get_args());
                    $rcmail->output->send('iframe');
                }
            ]
        );

        $SENDMAIL->options['from'] = $message->headers->from;
        $SENDMAIL->options['mailto'] = $message->headers->to;

        // Handle the form input
        $input_headers = $message->headers;

        // Set Resent-* headers, these will be added on top of the bounced message
        $headers = [];
        foreach (['from', 'to', 'cc', 'bcc', 'date', 'messageID'] as $name) {
            if (!empty($input_headers->$name)) {
                $headers['Resent-' . $name] = $input_headers->$name;
            }
        }

            // Create the bounce message
        $BOUNCE = new rcmail_resend_mail([
                'bounce_message' => $message,
                'bounce_headers' => $headers,
        ]);

        // Send the bounce message
        $result = $SENDMAIL->deliver_message($BOUNCE);

        echo json_encode($result);
        exit;

    }

    /**
     * Gestion de la frame
     * 
     * @param array $attrib            
     * @return string
     */
    public function parapheur_frame($attrib) {
        $attrib['src'] = $this->get_config('url');

        return $this->rc()->output->frame($attrib);
    }

/**
 * La fonction "gestion_apps" supprime la clé "app_parapheur" du tableau "apps" si la fonction
 * "is_parapheur_enabled" renvoie false.
 * 
 * @param any $args Le paramètre `$args` est un tableau qui contient diverses données ou variables. Il est
 * passé en argument à la fonction `gestion_apps`.
 * 
 * @return any le tableau  modifié.
 */
    public function gestion_apps($args) {
        if (!$this->is_parapheur_enabled()) {
            $args['apps'] = mel_helper::Enumerable($args['apps'])->where(function($key) {
                return $key !== 'app_parapheur';
            })->toArray();
        }

        return $args;
    }

    public function message_compose($args) {
        if ($args['param']['option'] === 'parapheur') {
            $args['param']['to'] = $this->get_config('mail');
        }
        return $args;
    }

/**
 * La fonction `get_config` récupère une valeur du tableau de configuration 'parapheur' en utilisant la
 * clé fournie, avec une valeur par défaut facultative si la clé n'est pas trouvée.
 * 
 * @param string $key Le paramètre key est utilisé pour spécifier la clé de la valeur de configuration que vous
 * souhaitez récupérer. Il s'agit d'une chaîne qui représente la valeur de configuration spécifique qui
 * vous intéresse.
 * @param any | null $default Le paramètre par défaut est un paramètre facultatif qui spécifie la valeur par défaut
 * à renvoyer si la clé spécifiée est introuvable dans le tableau de configuration. Si la clé n'est pas
 * trouvée et qu'aucune valeur par défaut n'est fournie, la fonction renverra null.
 * 
 * @return [any] la valeur de la clé 'parapheur' du tableau de configuration. Si la clé n'est pas trouvée,
 * elle renverra la valeur par défaut fournie, qui est nulle si elle n'est pas spécifiée.
 */
    protected function get_config($key, $default = null) {
        return $this->rc()->config->get('parapheur', [])[$key];
    }

/**
 * La fonction vérifie si la valeur de configuration « activé » est définie sur vrai.
 * 
 * @return bool la valeur du paramètre de configuration 'enabled'.
 */
    public function is_parapheur_enabled() {
        return $this->get_config('enabled');
    }

/**
 * La fonction vérifie si le plugin "mel_parapheur" est chargé et si la fonction "is_parapheur_enabled"
 * du plugin est vraie.
 * 
 * @return bool une valeur booléenne.
 */
    public static function is_enabled() {
        $plugins = rcmail::get_instance()->plugins;
        return $plugins->is_loaded('mel_parapheur') && $plugins->get_plugin('mel_parapheur')->is_parapheur_enabled();
    } 
}