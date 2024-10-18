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
        $rcmail = rcmail::get_instance();

        //$this->add_hook('refresh', array($this, 'refresh'));

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
            $mail_user[] = driver_mel::gi()->getUser($user)->email;
        }
        $config = ['token' => $token, 'room_name' => $room_name, 'is_private' => true, 'users_list' => $mail_user];
        $content = self::call_tchap_api($rcmail->config->get('migrate_channel_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            return (json_decode($content['content'])->room_id);
        } else {
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
            $mail_user[] = driver_mel::gi()->getUser($user)->email;
        }
        $config = ['token' => $token, 'room_id' => $room_id, 'users_list' => $mail_user];
        $content = self::call_tchap_api($rcmail->config->get('invite_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            return true;
        } else {
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
            return true;
        } else {
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
        $user_id = driver_mel::gi()->getUser($user_id)->email;
        $config = ['token' => $token, 'room_id' => $room_id, 'user_id' => $user_id];
        $content = self::call_tchap_api($rcmail->config->get('ismember_endpoint'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            return true;
        } else {
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
            return true;
        } else {
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
            return json_decode($content['content'])->room_name;
        } else {
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
        $user_id = driver_mel::gi()->getUser($user_id)->email;
        $user_uid = self::get_user_tchap_id($user_id);
        $config = ['token' => $token, 'room_id' => $room_id, 'user_id' => $user_uid];
        $content = self::call_tchap_api($rcmail->config->get('kick_user_endpoint'), $config, 'DELETE');
        if ($content["httpdCode"] === 200) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param $user_mail mail de l'utilisateur à chercher
     */
    private static function get_user_tchap_id($user_mail)
    {
        $rcmail = rcmail::get_instance();
        $token = self::get_tchap_token();
        $config = ['token' => $token, 'user_mail' => $user_mail];
        $content = self::call_tchap_api($rcmail->config->get('get_user_uid'), $config, 'POST');
        if ($content["httpCode"] === 200) {
            $content = json_decode($content['content']);
            $user_uid = $content->user_id;
            return $user_uid;
        } else {
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

    /**
     * @param $endpoint
     * @param $config
     * @param $type POST ou DELETE
     */
    private static function call_tchap_api($endpoint, $config, $type)
    {
        if (class_exists('mel_helper')) {
            $rcmail = rcmail::get_instance();
            $url = $rcmail->config->get('tchap_bot_url') . $endpoint;
            $headers = [0 => 'Content-Type: application/json'];
            if ($rcmail->config->get('http_proxy') !== '') {
                $headers[CURLOPT_PROXY] = $rcmail->config->get('http_proxy');
            }
            switch ($type) {
                case 'DELETE':
                    $content = mel_helper::load_helper($rcmail)->fetch("", false, 0)->_custom_url($url, 'DELETE', $config, null, $headers);
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
