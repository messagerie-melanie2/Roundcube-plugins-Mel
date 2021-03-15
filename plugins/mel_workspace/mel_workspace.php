<?php
use LibMelanie\Api\Defaut\Workspaces\Share;
/**
 * Plugin Mél Espace de travail
*
* Permet aux utilisateurs d'envoyer des suggestions depuis le menu parametres
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

class mel_workspace extends rcube_plugin
{
    /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;


    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->setup();
        $this->register_action('create', array($this, 'create'));
        $this->register_action('get_uid', array($this, 'get_uid'));
        $this->register_action('check_uid', array($this, 'check_uid'));
    }

    function setup()
    {
        $this->rc = rcmail::get_instance();
        //$this->load_config();
        //$this->setup_config();
        //$this->add_texts('localization/', true);
        $this->register_task("workspace");

        // Ajoute le bouton en fonction de la skin
        // $this->add_button(array(
        //     'command' => $this->taskName,
        //     'class'	=> 'button-home order1 icofont-home',
        //     'classsel' => 'button-home button-selected order1 icofont-home',
        //     'innerclass' => 'button-inner',
        //     'label'	=> 'portal',
        //     'title' => '',
        //     'type'       => 'link',
        //     'domain' => "mel_portal"
        // ), $this->sidebarName);
    }

    function create()
    {
        //rcube_utils::INPUT_POST custom_uid
        $datas = [
            "avatar" => rcube_utils::get_input_value("avatar", rcube_utils::INPUT_POST),
            "title" => rcube_utils::get_input_value("title", rcube_utils::INPUT_POST),
            "uid" => rcube_utils::get_input_value("custom_uid", rcube_utils::INPUT_POST),
            "desc" => rcube_utils::get_input_value("desc", rcube_utils::INPUT_POST),
            "end_date" => rcube_utils::get_input_value("end_date", rcube_utils::INPUT_POST),
            "hashtag" => rcube_utils::get_input_value("hashtag", rcube_utils::INPUT_POST),
            "visibility" => rcube_utils::get_input_value("visibility", rcube_utils::INPUT_POST),
            "users" => rcube_utils::get_input_value("users", rcube_utils::INPUT_POST),
            "services" => rcube_utils::get_input_value("services", rcube_utils::INPUT_POST),
        ];

        $retour = [
            "errored_user" => [],
            "existing_users" => []
        ];

        $user = driver_mel::gi()->getUser();
        $workspace = driver_mel::gi()->workspace([$user]);
        $workspace->uid = $datas["uid"] === null || $datas["uid"] === "" ? self::generate_uid($datas["title"]) : $datas["uid"];//uniqid(md5(time()), true);
        $workspace->title = $datas["title"];
        $workspace->logo = $datas["avatar"];
        $workspace->description = $datas["desc"];
        $workspace->creator = $user->uid;
        $workspace->created = new DateTime('now');
        $workspace->modified = new DateTime('now');
        $workspace->ispublic = (($datas["visibility"] === "private") ? false: true);
        $workspace->hashtags = [$datas["hashtag"]];
        $res = $workspace->save();
        $workspace->load();
        $shares = [];
        $share = driver_mel::gi()->workspace_share([$workspace]);
        $share->user = $user->uid;
        $share->rights = Share::RIGHT_OWNER;
        $shares[] = $share;

        $count = count($datas["users"]);
        for ($i=0; $i < $count; ++$i) { 
            $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $datas["users"][$i])->uid;
            if ($tmp_user === null)
                $retour["errored_user"][] = $datas["users"][$i];
            else {
                $retour["existing_users"][] = $tmp_user;
                $share = driver_mel::gi()->workspace_share([$workspace]);
                $share->user = $tmp_user;
                $share->rights = Share::RIGHT_WRITE;
                $shares[] = $share;                
            }
        }

        $workspace->shares = $shares;

        $res = $workspace->save();

        $retour["workspace_uid"] = $workspace->uid;
        $retour["uncreated_services"] = $datas["services"];

        echo json_encode($retour);
        exit;
    }

    function get_uid()
    {
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_POST);
        echo self::generate_uid($title);
        exit;
    }

    function check_uid()
    {
        include_once "lib/mel_utils.php";
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        if ($uid === "" || $uid === null)
        {
            echo "ui_empty";
            exit;
        }
        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $uid;
        if (mel_utils::replace_special_char($uid) === $uid && strtolower($uid) === $uid)
        {
            if ($workspace->exists())
                echo "uid_exists";
            else 
                echo "uid_ok";
        }
        else
            echo "uid_not_ok";
        exit;
    }

    public static function generate_uid($title)
    {
        $max = 35;

        include_once "lib/mel_utils.php";
        $text = mel_utils::replace_determinants(mel_utils::remove_accents(mel_utils::replace_special_char(strtolower($title))), "-");
        $text = str_replace(" ", "-", $text);
        if (count($text) > $max)
        {
            $title = "";
            for ($i=0; $i < count($text); $i++) { 
                if ($i >= $max)
                    break;
                $title.= $text[$i];
            }
            $text = $title;
        }
        $it = 0;
        do {
            $workspace = driver_mel::gi()->workspace();
            $workspace->uid = $text."-".(++$it);
        } while ($workspace->exists());
        return $text."-".$it;
    }

}