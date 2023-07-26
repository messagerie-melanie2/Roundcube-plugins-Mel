<?php 
include_once __DIR__.'/../ichat_content.php';

class NullChatContent implements IChatContent {
    public function __construct() {
    }

    public function has() : bool {
        return false;
    }

    public function get() : any {
        return null;
    }
}