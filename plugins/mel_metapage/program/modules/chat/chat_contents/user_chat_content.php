<?php
include_once __DIR__.'/../ichat_content.php';

class UserChatContent implements IChatContent {
    private $id;
    private $name;


    public function __construct(string $id, string $name) {
        $this->id = $id;
        $this->name = $name;
    }

    public function has() : bool {
        return isset($this->id) && '' !== $this->id && isset($this->name) && '' !== $this->name;
    }

    public function get() : any {
        return ['id' => $id, 'name' => $name];
    }

    public function get_id() : string {
        return $this->id;
    }

    public function get_name() : string {
        return $this->name;
    }
}

class ArrayOfUsers extends \ArrayObject implements IChatContent {
    public function offsetSet($key, $val) {
        if ($val instanceof UserChatContent) {
            return parent::offsetSet($key, $val);
        }
        throw new \InvalidArgumentException('Value must be a UserChatContent');
    }

    public function has() : bool {
        return count($this);
    }

    public function get() : any {
        $return = [];

        foreach ($this as $value) {
            $return[] = $value->get();
        }

        return $return;
    }
}