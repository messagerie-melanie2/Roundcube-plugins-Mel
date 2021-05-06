<?php
class roundrive_collabora
{
    /**
     * @var roundrive
     */
    private $plugin;
    /**
     * @var rcmail
     */
    private $rc;
    private $ajax;
    private $base_url;
    private $mimetypes;
    private $params;
    private $filesystem;

    public function __construct($plugin, $filesystem)
    {
        //include_once "http_helper.php";

        $this->plugin  = $plugin;
        $this->rc      = $plugin->rc;
        $this->filesystem = $filesystem;
        // $this->base_url = "https://mel.din.developpement-durable.gouv.fr/mdrive/index.php/apps/richdocuments/ajax/documents/create";
        // $this->ajax = new Ajax($this->base_url, null, [
        //     "OCS-APIREQUEST: true",
        //     "Content-Type: application/x-www-form-urlencoded; charset=UTF-8"
        // ], $this->rc, $this->rc->user->get_username().":".$this->rc->get_user_password());
        // $this->mimetypes = [
        //     'odp' => 'application/vnd.oasis.opendocument.presentation',
        //     'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
        //     'odt' => 'application/vnd.oasis.opendocument.text',
        // ];
        // $this->params = [
        //     "rc_user"=> $this->rc->user->get_username(),
        //     "rc_pwd" => urlencode($this->rc->plugins->get_plugin('mel_nextcloud')->encrypt($this->rc->get_user_password()))
        // ];
        //$this->params["Authorization"] = 'Basic '. base64_encode($this->params["rc_user"].":".$this->params["rc_pwd"]);
    }

    public function create_text_document($path, $name)
    {
        return $this->create_document($path, $name, "odt");
    }

    public function create_spreadsheet_document($path, $name)
    {
        return $this->create_document($path, $name, "ods");
    }

    public function create_powerpoint_document($path, $name)
    {
        return $this->create_document($path, $name, "odp");
    }

    private function create_document($path, $name, $ext)
    {
        $dir = __DIR__;
        $doc = fopen("$dir/../files/empty.$ext", 'r');
        return $this->filesystem->putStream("$path/$name.$ext", $doc);
    }

    // private function _params($dir, $filename, $ext)
    // {
    //     return array_merge(
    //         [
    //             "mimetype" => $this->mimetypes[$ext],
    //             "dir" => $dir,
    //             "filename" => "$filename.$ext"
    //         ]
    //         , $this->params);
    // }

}