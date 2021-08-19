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

    private $wekanApi;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->require_plugin('mel_helper');
        $this->setup();
    }

    /**
     * Enregistre les différentes actions, configs et boutons.
     *
     * @return void
     */
    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();

        $this->register_task("wekan");
        $this->register_action('login', array($this, 'login'));
        $this->register_action('create_board', array($this, 'action_create_board'));
        $this->register_action('check_board', array($this, 'action_check_board'));
        $this->register_action('index', array($this, 'index'));
        $this->include_script('js/wekan.js');

        $this->load_lib();
        $this->wekanApi = new mel_wekan_api($this->rc, $this);

        $this->add_button(array(
            'command' => 'wekan',
            'class'	=> 'button-mel-wekan icon-mel_trello wekan',
            'classsel' => 'button-mel-wekan button-selected icon-mel_trello wekan',
            'innerclass' => 'button-inner inner',
            'label'	=> 'mel_wekan.kanban',
            'title' => 'mel_wekan.kanban',
            'type'       => 'link'
        ), "otherappsbar");

        $this->rc->output->set_env("wekan_base_url", $this->wekan_url(false));

    }

    function index()
    {
        $this->rc->output->send('mel_wekan.wekan');
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

    public function login_user($user, $password)
    {
        if (!$this->wekanApi->is_logged($user))
            return $this->wekanApi->login([
                "username" => $user,
                "password" => $password
            ]);
        
        return true;
    }

    public function login()
    {        
        $currentUser = rcube_utils::get_input_value("currentUser", rcube_utils::INPUT_GPC) ?? false;
        $result = !$currentUser ? $this->wekanApi->login() : $this->wekanApi->login([
            "username" => driver_mel::gi()->getUser()->uid,
            "password" => $this->rc->get_user_password()
        ]);

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
        return $this->wekanApi->create_board($title, $isPublic, $color);
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
                    "httpCode" => 200,
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
        return $this->wekanApi->create_list($board, $title);
    }

    public function update_user_status($board, $user, $isAdmin)
    {
        return $this->wekanApi->update_user($board, $user, $isAdmin);
    }

    public function check_if_user_exist($board, $user)
    {
        return $this->wekanApi->check_user_exist($board, $user);
    }

    public function add_member($board, $username, $isAdmin = false)
    {
        return $this->wekanApi->add_member($board, $username, $isAdmin);
    }

    public function remove_user($board, $user)
    {
        return $this->wekanApi->delete_user($board, $user);
    }

    public function delete_board($board)
    {
        return $this->wekanApi->delete_board($board);
    }

    public function action_check_board()
    {
        $board = rcube_utils::get_input_value("_board", rcube_utils::INPUT_GPC);

        echo json_encode($this->check_board($board));
        exit;
    }

    public function check_board($board)
    {
        return $this->wekanApi->get_board($board);
    }

    public function board_exist($board)
    {
        $board = $this->check_board($board);

        return $board["httpCode"] == 200 && $board["content"] !== "{}";
    }

    public function board_archived($board)
    {
        $archived = false;
        $board = $this->check_board($board);

        if ($board["httpCode"] == 200 && $board["content"] !== "{}")
            $archived = json_decode($board["content"])->archived;

        return $archived;

    }

    public function add_tag($board, $label)
    {
        return $this->wekanApi->create_label($board, $label);
    }

    public function wekan_url($server = true)
    {
        return $server ? $this->wekanApi->get_url() : $this->rc->config->get("wekan_url");
    }
}