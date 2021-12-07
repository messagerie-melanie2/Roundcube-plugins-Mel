<?php
class mel_rcmail_action extends rcmail_action
{
    public static function create_folder_tree(&$arrFolders, $folder, $delm = '/', $path = '')
    {
        return rcmail_action::build_folder_tree($arrFolders, $folder, $delm, $path);
    }

    public function run($args = []){
        
    }
}