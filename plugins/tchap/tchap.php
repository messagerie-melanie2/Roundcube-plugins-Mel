<?php

/**
 * Plugin Tchap
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

class tchap extends bnum_plugin
{
    public const KEY_FOR_WORKSPACE = 'tchap-channel'; 

    /**
     *
     * @var string
     */
    public $task = '.*';

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    function init()
    {
        if ($this->get_current_task() === 'bnum' && $this->get_input('_initial_task', rcube_utils::INPUT_GET) === 'chat') {
            $this->rc()->output->redirect([
                '_task' => 'tchap',
            ]);
        }

        $rcmail = rcmail::get_instance();

        // Chargement de la conf
        $this->load_config();
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/tchap.css');

        // ajout de la tache
        $this->register_task('tchap');

        if ($rcmail->task === "tchap") {
            $this->register_action('index', [
                $this,
                'action'
            ]);
            $this->register_action('sidebar', [
                $this,
                'sidebar'
            ]);
            $this->register_action('avatar_url', [
                $this,
                'avatar_url'
            ]);
        } else if ($this->is_bnum_task() && $this->is_index_action()) {
            $this->load_script_module('bnum.js', '/');
        }

        $tchap_url = $rcmail->config->get('tchap_url');

        $rcmail->output->set_env('tchap_url', $tchap_url);

        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($tchap_url, 'tchap');
        // Ajoute le bouton en fonction de la skin
        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
            $need_button = $rcmail->plugins->get_plugin('mel_metapage')->is_app_enabled('app_tchap', true) ? $need_button : 'otherappsbar';
        }

        if ($need_button) {
            $this->add_button(array(
                'command' => 'tchap',
                'class'    => 'button-tchap icon-tchap tchap',
                'classsel' => 'button-tchap button-selected icon-tchap tchap',
                'innerclass' => 'button-inner inner',
                'label'    => 'tchap.task',
                'title' => 'tchap.tchap_title',
                'type' => 'link',
            ), $need_button);
        }

        $this->add_hook('workspace.services.set', [$this, 'workspace_set_tchap']);
        $this->add_hook('wsp.show', [$this, 'on_show_workspace']);
        $this->add_hook('workspace.users.services.delete', [$this, 'workspace_users_services_delete']);
    }

    function action()
    {
        $rcmail = rcmail::get_instance();
        // register UI objects
        $rcmail->output->add_handlers(array(
            'tchap_frame'    => array($this, 'tchap_frame'),
        ));

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);
        if ($startupUrl !== null && $startupUrl !== "") $rcmail->output->set_env("tchap_startup_url", $startupUrl);

        // Chargement du template d'affichage
        $rcmail->output->set_pagetitle($this->gettext('title'));
        // Chargement du Javascript
        $this->load_script_module('tchap.js', '/');

        $rcmail->output->send('tchap.tchap');
    }
    /**
     * Gestion de la frame
     * @param array $attrib
     * @return string
     */
    function tchap_frame($attrib)
    {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmtchapframe';

        $rcmail = rcmail::get_instance();

        $attrib['name'] = $attrib['id'];

        $rcmail->output->set_env('contentframe', $attrib['name']);
        $rcmail->output->set_env('blankpage', $attrib['src'] ?
            $rcmail->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
        $rcmail->output->set_env('display_tchap_sidebar', $rcmail->config->get('display_tchap_sidebar', null));

        return $rcmail->output->frame($attrib);
    }

    public function avatar_url()
    {
        $user = driver_mel::gi()->getUser();
        $name = explode(' ', $user->name);
        $fname = $name[1] === null ? '' : "$name[1].";
        $url = self::get_avatar_url("$fname$name[0]");

        echo json_encode($url);
        exit;
    }

    #region workspaces
    public function workspace_set_tchap($args) {
        if (class_exists('mel_workspace')) {
            $workspace = $args['workspace'];
            $services = $args['services'];
            $default_values= $args['default_values'];

            $users = mel_helper::Enumerable($workspace->users())->select(function ($k, $v) {
                return $v->user;
            })->toArray();

            if ($workspace->objects()->get(self::KEY_FOR_WORKSPACE) && array_search(self::KEY_FOR_WORKSPACE, $services) !== false) {
                $default_values_key = "tchap-channel";
                if (!isset($default_values)) $default_values = [$default_values_key => ['mode' => 'default']];
                else if (!isset($default_values[$default_values_key])) $default_values[$default_values_key] = ['mode' => 'default'];
    
                $uid = null;
                $value = null;
                $config = [];
                switch ($default_values[$default_values_key]['mode']) {
                    case 'default':
                        $uid = $workspace->uid();
                    case 'custom_name':
                        if (!isset($uid)) $uid = $default_values[$default_values_key]['value'];
                        $value = self::create_tchap_room($uid, $users);
                        
                        break;
    
                    case 'already_exist':
                        $value = $default_values[$default_values_key]['value']['id'];
    
                        $config['edited'] = true;
                        break;
                    default:
                        unset($default_values[$default_values_key]);
                        $args['default_values'] = $default_values;
                        return $this->workspace_set_tchap($args);
                }
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[mel_workspace->create_tchap_channel]Valeur : ".json_encode($value));
    
                if (is_string($value))
                {
                    $config['id'] = $value;
                }
                else {
                    $value = $value["content"]["channel"];
                    $config['id'] = $value["_id"];
                }
    
                //$this->save_object($workspace, self::TCHAP_CHANNEL, $config);
                $workspace->objects()->set(self::KEY_FOR_WORKSPACE, $config);

                $args['workspace'] = $workspace;

                unset($services[self::KEY_FOR_WORKSPACE]);

                $args['services'] = $services;
            }
        }

        return $args;
    }

    public function workspace_users_services_delete($args) {
        if ($args['workspace']->hasService(self::KEY_FOR_WORKSPACE)) {
            self::kick_member($args['workspace']->objects()->get(self::KEY_FOR_WORKSPACE)->id, $args['user']);
        }

        return $args;
    }

    public function on_show_workspace($args) {
        if ($args['workspace']->objects()->get(self::KEY_FOR_WORKSPACE) !== null) {
            $this->include_module('workspace.js', 'js/lib/workspace');
            $args['layout']->setNavBarSetting('tchap', ':nav:', false, 7);
        }

        return $args;
    }
    #endregion

    /**
     * Bloquer les refresh
     * @param array $args
     */
    function refresh($args)
    {
        return array('abort' => true);
    }
    function sidebar()
    {
        $data = $this->get_input_post('_showsidebar');
        $this->rc()->user->save_prefs(['display_tchap_sidebar' => $data]);
    }

    /**
     * Créer un salon tchap via appel à l'api
     * @param string $room_name
     * @param array $users
     * @param bool $is_private
     */
    public static function create_tchap_room($room_name, $users)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $mail_user = [];
        foreach ($users as $user) {
            $mail_user[] = strtolower(driver_mel::gi()->getUser($user)->email);
        }
        $config = ['token' => $token, 'room_name' => $room_name, 'is_private' => true, 'users_list' => $mail_user];
        $content = self::call_tchap_api($rcmail->config->get('migrate_channel_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->create_tchap_room]Valeur retour de l'api : " . json_encode($content));
            return (json_decode($content['content'])->room_id);
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->create_tchap_room]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * Invite un utilisateur dans un salon tchap via l'api
     * @param $room_id
     * @param array $users
     */
    public static function invite_tchap_user($room_id, $users)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $mail_user = [];
        foreach ($users as $user) {
            $email = strtolower(driver_mel::gi()->getUser($user)->email);

            if (isset($email) && is_string($email) && strpos($email, '@') !== false) {
                $mail_user[] = $email;
            }
        }
        $config = ['token' => $token, 'room_id' => $room_id, 'users_list' => $mail_user];
        $content = self::call_tchap_api($rcmail->config->get('invite_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->invite_tchap_user]Valeur retour de l'api : " . json_encode($content));
            return true;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->invite_tchap_user]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * kick tout les users non admin (plus proche de la supression possible dans tchap)
     * @param $room_id
     */
    public static function delete_tchap_room($room_id)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'room_id' => $room_id];
        $url = $rcmail->config->get('tchap_bot_url') . $rcmail->config->get('delete_room_endpoint');
        $content = self::call_tchap_api($rcmail->config->get('delete_room_endpoint'), $config, 'DELETE');
        if ($content["httpdCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->delete_tchap_room]Valeur retour de l'api : " . json_encode($content));
            return true;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->delete_tchap_room]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * vérfie si un utilisateur est membre d'un canal
     * @param $room_id
     * @param $user_id
     * @return boolean
     */
    public static function is_member($room_id, $user_id)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $user_id = strtolower(driver_mel::gi()->getUser($user_id)->email);
        $config = ['token' => $token, 'room_id' => $room_id, 'user_id' => $user_id];
        $content = self::call_tchap_api($rcmail->config->get('ismember_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->is_member]Valeur retour de l'api : " . json_encode($content));
            return true;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->is_member]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * vérifie si un canal existe
     * @param $room_id
     */
    public static function check_if_room_exist($room_id)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'room_id' => $room_id];
        $content = self::call_tchap_api($rcmail->config->get('get_room_name_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->check_if_room_exist]Valeur retour de l'api : " . json_encode($content));
            return true;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->check_if_room_exist]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * vérifie si un canal existe
     * @param $room_id
     */
    public static function get_room_name($room_id)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'room_id' => $room_id];
        $content = self::call_tchap_api($rcmail->config->get('get_room_name_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->get_room_name]Valeur retour de l'api : " . json_encode($content));
            return json_decode($content['content'])->room_name;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->get_room_name]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * kick un utilisateur d'un salon
     * @param $room_id
     * @param $user_id 
     */
    public static function kick_member($room_id, $user_id)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $user_id = strtolower(driver_mel::gi()->getUser($user_id)->email);
        $user_uid = self::get_user_tchap_id($user_id);
        $config = ['token' => $token, 'room_id' => $room_id, 'user_id' => $user_uid];
        $content = self::call_tchap_api($rcmail->config->get('kick_user_endpoint'), $config, 'DELETE');
        if ($content["httpdCode"] === 200) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->kick_member]Valeur retour de l'api : " . json_encode($content));
            return true;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->kick_member]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * @param $user_mail mail de lutilisateur à chercher
     */
    private static function get_user_tchap_id($user_mail)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'user_mail' => $user_mail];
        $content = self::call_tchap_api($rcmail->config->get('get_user_uid'), $config, 'POST');

        if ($content["httpCode"] === 200) {
            $content = json_decode($content['content']);
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->get_user_tchap_id]Valeur retour de l'api : " . json_encode($content));
            return $content->user_id;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->get_user_tchap_id]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    private static function search_user($user)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'term' => $user];
        $content = self::call_tchap_api($rcmail->config->get('get_user'), $config, 'POST');

        if ($content["httpCode"] === 200) {
            $content = json_decode($content['content']);
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[tchap->search_user]Valeur retour de l'api : " . json_encode($content));
            return $content;
        } else {
            mel_logs::get_instance()->log(mel_logs::ERROR, "[tchap->search_user]Valeur retour de l'api : " . json_encode($content));
            return false;
        }
    }

    /**
     * retourne le token à utiliser pour l'api tchap
     */
    private static function get_tchap_token()
    {
        $rcmail = rcmail::get_instance();
        return hash('sha512', date('d/m/Y') . '-' . $rcmail->config->get('tchap_bot_token'));
    }

    public static function get_avatar_url($user_id)
    {
        $user = self::search_user($user_id);

        if ($user) return $user->avatar_url;
        else return $user;
    }


    /**
     * @param $endpoint
     * @param $config
     * @param $type POST ou DELETE
     */
    private static function call_tchap_api($endpoint, $config, $type)
    {
        if (class_exists('mel_helper')) {
            $rcmail = rcmail::get_instance();
            $url = strpos($endpoint, 'https') !== false ? $endpoint : $rcmail->config->get('tchap_bot_url') . $endpoint;
            $headers = [0 => 'Content-Type: application/json'];
            if ($rcmail->config->get('http_proxy') !== '') {
                $headers[CURLOPT_PROXY] = $rcmail->config->get('http_proxy');
            }
            switch ($type) {
                case 'DELETE':
                    $content = mel_helper::load_helper($rcmail)->fetch("", false, 0)->_custom_url($url, 'DELETE', $config, null, $headers);
                    break;
                case 'PUT':
                    $content = mel_helper::load_helper($rcmail)->fetch("", false, 0)->_custom_url($url, 'PUT', $config, null, $headers);
                    break;

                case 'GET':
                    $content = mel_helper::load_helper($rcmail)->fetch('', false, 0)->_get_url($url, $config, null, $headers);
                    break;
                case 'POST';
                default:
                    $content = mel_helper::load_helper($rcmail)->fetch("", false, 0)->_post_url($url, $config, null, $headers);
                    break;
            }
            return $content;
        } else {
            return false;
        }
    }
}
