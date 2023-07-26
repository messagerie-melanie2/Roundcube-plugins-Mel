<?php
include_once __DIR__.'/../ichat_content.php';
include_once __DIR__.'/../chat_structure.php';

class ArrayChatContent extends \ArrayObject implements IChatContent {
    public function offsetSet($key, $val) {
        if ($val instanceof IChatContent) {
            return parent::offsetSet($key, $val);
        }
        throw new \InvalidArgumentException('Value must be a IChatContent');
    }

    public function has() : bool {
        return count($this);
    }

    public function get() : any {
        return [...$this->yield_get()];
    }

    public function yield_get() {
        foreach ($this as $value) {
            yield $value->get();
        }
    }
}