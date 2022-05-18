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
            'class'	=> 'button-mel-wekan icon-mel-trello wekan',
            'classsel' => 'button-mel-wekan button-selected icon-mel-trello wekan',
            'innerclass' => 'button-inner inner',
            'label'	=> 'mel_wekan.kanban',
            'title' => 'mel_wekan.kanban',
            'type'       => 'link'
        ), "taskbar");

        $this->rc->output->set_env("wekan_base_url", $this->wekan_url(false));
        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($this->wekan_url(false), 'kanban');

    }

    function index()
    {

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC); 
        if ($startupUrl !== null && $startupUrl !== "") $this->rc->output->set_env("wekan_startup_url", $startupUrl);

        $this->rc->output->set_env("wekan_storage_end", $this->rc->config->get("wekan_storage_end"));

        $this->rc->output->set_pagetitle("Kanban");
        $this->rc->output->send('mel_wekan.wekan');
    }

    /**
     * Charge les différents fichiers librairies de wekan (/lib)
     *
     * @return void
     */
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

    /**
     * Log un utilisateur et récupère ses tokens d'identifications.
     *
     * @return void
     */
    public function login()
    {        
        $currentUser = rcube_utils::get_input_value("currentUser", rcube_utils::INPUT_GPC) ?? false;
        $result = !$currentUser ? $this->wekanApi->login() : $this->wekanApi->create_token(driver_mel::gi()->getUser()->uid);

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

    /**
     * Créer un tableau.
     *
     * @param string $title - Nom du tableau.
     * @param boolean $isPublic - Si le tableau est visible par tous ou non.
     * @param string|null $color - Couleur du tableau.
     * @return array
     */
    public function create_board($title, $isPublic, $color = null)
    {
        return $this->wekanApi->create_board($title, $isPublic, $color);
    }

    /**
     * Créer un tableau avec des colonnes déjà prédéfini.
     *
     * @param string $title - Nom du tableau.
     * @param boolean $isPublic - Si le tableau est visible par tous ou non.
     * @param string|null $color - Couleur du tableau.
     * @param array $lists - Nom des colonnes
     * @return array
     */
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

    /**
     * Créer une colonne pour un tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $title - Nom de la colonne.
     * @return void
     */
    public function create_list($board, $title)
    {
        return $this->wekanApi->create_list($board, $title);
    }

    /**
     * Met à jours le privilège de l'utilisateur.
     *
     * @param string $board - Id du tableau.
     * @param string $user - Nom de l'utilisateur.
     * @param boolean $isAdmin - Devient admin ou non.
     * @return array
     */
    public function update_user_status($board, $user, $isAdmin)
    {
        return $this->wekanApi->update_user($board, $user, $isAdmin);
    }

    /**
     * Vérifie si l'utilisateur éxiste dans un tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $user - Nom de l'utilisateur.
     * @return boolean
     */
    public function check_if_user_exist($board, $user)
    {
        return $this->wekanApi->check_user_exist($board, $user);
    }

    /**
     * Ajoute un utilisateur au tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $username - Nom de l'utilisateur à ajouter.
     * @param boolean $isAdmin - Doit être administrateur du tableau ?
     * @return array
     */
    public function add_member($board, $username, $isAdmin = false)
    {
        return $this->wekanApi->add_member($board, $username, $isAdmin);
    }

    /**
     * Supprime un utilisateur du tableau.
     *
     * @param string $board - Id du tableau
     * @param string $user - Nom de l'utilisateur
     * @return array
     */
    public function remove_user($board, $user)
    {
        return $this->wekanApi->delete_user($board, $user);
    }

    /**
     * Supprime un tableau.
     *
     * @param string $board - Id du tableau.
     * @return array
     */
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

    /**
     * Récupère les données d'un tableau.
     *
     * @param string $board - Id du tableau.
     * @return array
     */
    public function check_board($board)
    {
        return $this->wekanApi->get_board($board);
    }

    /**
     * Vérifie si un tableau éxiste.
     *
     * @param string $board - Id du tableau.
     * @return bool
     */
    public function board_exist($board)
    {
        $board_exist = false;
        $board = $this->check_board($board);

        if($board["httpCode"] !== null && $board["httpCode"] == 200 && $board["content"] !== "{}" && !empty($board["content"])
        || $board["httpCode"] !== null && $board["httpCode"] != 200) 
        {
            $board_exist = true;
        }
        else {
            mel_logs::get_instance()->log(mel_logs::WARN, "/!\\[mel_wekan->board_exist]Recréation d'un board ! ".json_encode($board));
        }

        return $board_exist;
    }

    /**
     * Vérifie si un tableau est archivé.
     *
     * @param string $board - Id du tableau.
     * @return boolean
     */
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

    /**
     * Récupère l'url de wekan.
     *
     * @param boolean $server - Si vrai, l'url interne, sinon, l'url public.
     * @return string
     */
    public function wekan_url($server = true)
    {
        return $server ? $this->wekanApi->get_url() : $this->rc->config->get("wekan_url");
    }
}