<?php
include_once __DIR__.'/../ichat_content.php';

class ErrorChatContent implements IChatContent {
    private $error;

    public function __construct(string $error) {
        $this->error = $error;
    }

    public function has() : bool {
        return false;
    }

    public function get() : any {
        return $this->error;
    }
}