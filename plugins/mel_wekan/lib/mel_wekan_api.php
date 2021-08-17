<?php
/**
 * Classe facilitantles appels à wekan
 */
class mel_wekan_api extends amel_lib
{

    public const USER_AGENT = "";

    public const FETCH_HEADER = [
        "Content-Type: application/json; charset=utf-8",
        "Accept: */*"
    ];

    const KEY_CACHE_HELPER = "mel_helper";
    const KEY_CACHE_FETCH = "mel_fetch";

    public const KEY_SESSION_AUTH = "wekan_auth_datas";

    const KEY_PARAM_ID = ":user-id:";

    const CALL_LOGIN = "/users/login";
    const CALL_NEW_BOARD = "/api/boards";
    const CALL_ADD_LABEL = "/api/boards/{board}/labels";
    const CALL_ADD_LIST = "/api/boards/{board}/lists";
    const CALL_ADD_USER = "/api/boards/{board}/members/{user}/add";
    const CALL_GET_USERS = "/api/users";
    const CALL_SET_MEMBER_PERMISSION = "/api/boards/{board}/members/{member}";
    const CALL_GET_BOARD = "/api/boards/{board}";
    const CALL_DELETE_MEMBER = "/api/boards/{board}/members/{user}/remove";
    const CALL_DELETE_BOARD = "/api/boards";

    private $cache;
    private $url;

    public function __construct($rc, $plugin)
    {
        parent::__construct($rc, $plugin);
        $this->url = $this->get_config("wekan_url");
        $this->cache = [];
    }

    function set_helper_to_cache()
    {
        if ($this->cache[self::KEY_CACHE_HELPER] === null)
            $this->cache[self::KEY_CACHE_HELPER] = $this->get_helper();
    }

    function set_fetch_to_cache()
    {
        if ($this->cache[self::KEY_CACHE_FETCH] === null)
        {
            $config = $this->get_config("wekan_ssl_options");
            $this->cache[self::KEY_CACHE_FETCH] = $this->helper()->fetch(self::USER_AGENT, $config["verify_peer"], $config["verify_host"]);
        }
    }

    function helper()
    {
        $this->set_helper_to_cache();
        return $this->cache[self::KEY_CACHE_HELPER];
    }

    function fetch()
    {
        $this->set_fetch_to_cache();
        return $this->cache[self::KEY_CACHE_FETCH];
    }

    function post($url, $params = null, $json = null, $headers = null)
    {
        return $this->fetch()->_post_url($this->url.$url, $params, $json, $headers);
    }

    function put($url, $item, $contentType)
    {
        return $this->fetch()->_put_url($this->url.$url, $item, $contentType, $this->rc->config->get('curl_cainfo', null), $this->rc->config->get('curl_http_proxy', null));
    }

    function get($url, $params = null, $headers = null)
    {
        return $this->fetch()->_get_url($this->url.$url, $params, $headers);
    }

    public function login()
    {
        $fakeUser = $this->get_config("wekan_admin_user");
        $get = $this->post(self::CALL_LOGIN, ["username" => $fakeUser["username"], "password" => $fakeUser["password"]], null, self::FETCH_HEADER);

        if ($get["httpCode"] == 200)
        {
            $content = json_decode($get["content"]);
            $_SESSION[self::KEY_SESSION_AUTH] = [
                "id" => $content->id,
                "token" => $content->token,
                "expires" => $content->tokenExpires,
            ];
        }
        else {
            $_SESSION[self::KEY_SESSION_AUTH] = null;
        }

        return $get;
        //$_SESSION[self::KEY_SESSION_AUTH];
    }

    function is_logged()
    {
        try {
            return $_SESSION[self::KEY_SESSION_AUTH] !== null &&  strToTime($_SESSION[self::KEY_SESSION_AUTH]["expires"]) >= strToTime(date('m/d/Y h:i:s a', time()));
        } catch (\Throwable $th) {
            return false;
        }
    }

    function call($partUrl, $body ,$try = 0)
    {
        $return = null;

        if ($body !== null && count($body) > 0 && $try <= 0)
        {
            if (in_array(self::KEY_PARAM_ID, $body, true))
                $body[array_search(self::KEY_PARAM_ID, $body)] = $_SESSION[self::KEY_SESSION_AUTH]["id"];
        }

        if ($this->is_logged())   
            $return = $this->post($partUrl, $body, null, array_merge(self::FETCH_HEADER, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"]]));
        else {
            if ($try < 10)
            {
                $this->login();
                $return = $this->call($partUrl, $body, ++$try);
            }
        }

        return $return;
    }

    /**
     * Créer un tableau
     *
     * @param string $title - Titre du tableau
     * @param bool $isPublic - Si le tableau est public ou privé
     * @param string|null $color - Couleur du tableau parmis belize, nephritis, pomegranate, pumpkin, wisteria, midnight
     * @return array
     */
    public function create_board($title, $isPublic, $color = null)
    {
        $body = [
            "title" => $title,
            "owner" => self::KEY_PARAM_ID,
            "isAdmin" => true,
            "permission" => $isPublic ? "public" : "private"
        ];

        if ($color !== null)
            $body["color"] = $color;

        return $this->call(self::CALL_NEW_BOARD, $body);
    }

    function create_label($board, $labelName)
    {
       // return $this->insert(str_replace("{board}", $board, self::CALL_ADD_LABEL), ["label" => $labelName]);
       return $this->fetch()->_custom_url($this->url.str_replace("{board}", $board, self::CALL_ADD_LABEL), "PUT", ["label" => $labelName], null, array_merge(self::FETCH_HEADER, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"]]));
    }

    /**
     * Créer une liste pour un tableau donné
     *
     * @param string $board - Id du tableau
     * @param string $name - Nom de liste
     * @return array
     */
    public function create_list($board, $name)
    {
        return $this->call(str_replace("{board}", $board, self::CALL_ADD_LIST), ["title" => $name]);
    }

    /**
     * Ajout un membre à un tableau
     *
     * @param string $board - Id du tableau
     * @param string $username - Nom de l'utilisateur
     * @param boolean $isAdmin - Est admin du tabeau (faux par défaut)
     * @return array
     */
    public function add_member($board, $username, $isAdmin = false)
    {
        $username = $this->get_user($username);

        if (gettype($username) !== "string")
            return $username;

        $key = str_replace("{board}", $board, self::CALL_ADD_USER);
        $key = str_replace("{user}", $username, $key);
        return $this->call($key, [
            "action" => "add",
            "isAdmin" => $isAdmin,
            "isNoComments" => false,
            "isCommentOnly" => false
        ]);
    }

    /**
     * Récupère l'id d'un utilisateur
     *
     * @param string $username - Nom de l'utilisateur
     * @return string|array - Retourne l'id si iml n'y a pas eu d'erreurs, sinon, retourne l'erreur.
     */
    public function get_user($username)
    {
        if (!$this->is_logged())  
            $this->login();

        //Add to cache, avoid to do multiple get
        if ($cache["users"] !== null && $cache["users"][$username] !== null)
            $users = $cache["users"][$username];
        else {
            $users = $this->get(self::CALL_GET_USERS."/$username", null, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"]]);

            if ($users["httpCode"] == 200)
            {
                $content = json_decode($users["content"]);

                if ($cache["users"] === null)
                    $cache["users"] = [];

                $cache["users"][$username] = $content->_id;

                $users = $content->_id;
            }
        }

        return $users;
    }

    /**
     * Met à jour les privilèges d'un utilisateur
     *
     * @param string $board - Id du tableau
     * @param string $username - Nom de l'utilisateur
     * @param bool $isAdmin - Est administrateur ?
     * @return array
     */
    public function update_user($board, $username, $isAdmin)
    {
        $username = $this->get_user($username);

        if (gettype($username) !== "string")
            return $username;

        $key = str_replace("{board}", $board, self::CALL_SET_MEMBER_PERMISSION);
        $key = str_replace("{member}", $username, $key);

        return $this->call($key, [
            "isAdmin" => $isAdmin,
            "isNoComments"=> false,
            "isCommentOnly"=>false
        ]);
    }

    /**
     * Vérifie si un utilisateur existe dans un tableau.
     *
     * @param [type] $board - Id du tableau
     * @param [type] $username - Nom de l'utilisateur
     * @return bool
     */
    public function check_user_exist($board, $username)
    {
        $username = $this->get_user($username);

        if (gettype($username) !== "string")
            return $username;

        $key = str_replace("{board}", $board, self::CALL_GET_BOARD);      

        $board = $this->get($key, null, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"]]);

        if ($board["httpCode"] == 200)
        {
            $content = json_decode($board["content"]);

            foreach ($content->members as $key => $value) {
                if ($value->userId === $username)
                    return true;
            }

            return false;
        }
        else
            return false;
    }

    /**
     * Supprime l'utilisateur d'un tableau
     *
     * @param string $board - Id du tableau
     * @param string $username - Nom de l'utilisateur
     * @return array
     */
    public function delete_user($board, $username)
    {
        $username = $this->get_user($username);

        if (gettype($username) !== "string")
            return $username;

        $key = str_replace("{board}", $board, self::CALL_DELETE_MEMBER);
        $key = str_replace("{user}", $username, $key);

        return $this->call($key, [
            "action" => "remove",
        ]);
    }

    /**
     * Supprime un tableau
     *
     * @param string $board - Id du tableau
     * @return array
     */
    public function delete_board($board)
    {
        if (!$this->is_logged())  
            $this->login();

        return $this->fetch()->_custom_url($this->url.self::CALL_DELETE_BOARD."/$board", "DELETE", null, null, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"]]);
    }

    public function get_board($board)
    {
        if (!$this->is_logged())  
            $this->login();

        return $this->get(self::CALL_NEW_BOARD."/$board", null, ['Authorization: Bearer '.$_SESSION[self::KEY_SESSION_AUTH]["token"], "Accept: */*"]);
    }

    public function get_url()
    {
        return $this->url;
    }



}