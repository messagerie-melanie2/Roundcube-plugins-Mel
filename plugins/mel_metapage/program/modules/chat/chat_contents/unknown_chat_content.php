<?php
include_once __DIR__.'/../ichat_content.php';

class UnknownChatContent implements IChatContent {
    private $content;

    public function __construct(any $content) {
        $this->content = $content;
    }

    public function has() : bool {
        return  $this->get() !== null;
    }

    public function get() : any {
        return $this->content;
    }
}