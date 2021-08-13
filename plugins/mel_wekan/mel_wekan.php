<?php
class mel_wekan extends rcube_plugin
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
    }

    private $api;

    /**
     * Enregistre les différentes actions, configs et boutons.
     *
     * @return void
     */
    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->load_config();

        $this->register_task("wekan");
        $this->register_action('login', array($this, 'login'));
        $this->register_action('create_board', array($this, 'action_create_board'));
        $this->include_script('js/wekan.js');

        $this->load_lib();
        $this->api = new mel_wekan_api($this->rc, $this);

    }

    function load_lib()
    {
        mel_helper::load_helper($this->rc)->include_amel_lib();
 
        $files = scandir(__DIR__."/lib");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".php") !== false)
                include_once "lib/".$files[$i];
        }
    }

    public function login()
    {        
        $result = $this->api->login();

        echo json_encode($result);
        exit;
    }

    function action_create_board()
    {
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_GPC);
        $public = rcube_utils::get_input_value("_isPublic", rcube_utils::INPUT_GPC) ?? "private";
        $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_GPC);

        $board = $this->create_board($title, $public, $color);
        echo json_encode($board);
        exit;
    }

    public function create_board($title, $isPublic, $color = null)
    {
        return $this->api->create_board($title, $isPublic, $color);
    }

    public function create_board_with_inital_lists($title, $isPublic, $color = null, $lists = [])
    {
        $board = $this->create_board($title, $isPublic, $color);

        if ($board["httpCode"] == 200)
        {
            $content = json_decode($board["content"]);

            if ($content->_id !== null)
            {
                $board = [
                    "board_id" => $content->_id,
                    "board" => $board,
                    "lists" => []
                ];

                foreach ($lists as $key => $value) {
                    $board["lists"][] = $this->create_list($content->_id, $value);
                }

            }
        }

        return $board;
    }

    public function create_list($board, $title)
    {
        return $this->api->create_list($board, $title);
    }

    public function update_user_status($board, $user, $isAdmin)
    {
        return $this->api->update_user($board, $user, $isAdmin);
    }

    public function check_if_user_exist($board, $user)
    {
        return $this->api->check_user_exist($board, $user);
    }

    public function add_member($board, $username, $isAdmin = false)
    {
        return $this->api->add_member($board, $username, $isAdmin);
    }

    public function remove_user($board, $user)
    {
        return $this->api->delete_user($board, $user);
    }

    public function delete_board($board)
    {
        return $this->api->delete_board($board);
    }
}