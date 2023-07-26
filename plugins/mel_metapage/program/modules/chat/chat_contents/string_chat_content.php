<?php
include_once __DIR__.'/../ichat_content.php';

class StringChatContent implements IChatContent {
    private $string_datas;

    public function __construct(string $content) {
        $this->string_datas = $content;
    }

    public function has() : bool {
        return '' !== $this->get();
    }

    public function get() : any {
        return $this->string_datas;
    }
}