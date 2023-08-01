<?php
include_once 'enums.php';
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

class CompleteUserChatContent extends UserChatContent {
    private $username;
    private $fname;
    private $status;

    public function __construct(string $id, string $name, string $username, string $fname, EnumStatusType $status) {
        parent::__construct($id, $name);
        $this->username = $username;
        $this->fname = $fname;
        $this->status = $status;
    }

    public function get() : any {
        $get = parent::get();
        $get = [...$get, 
                 'username' => $this->username,
                 'fname' => $this->fname,
                 'status' => $this->status->toString()
               ];

        return $get;
    }

    public function get_fname() : string {
        return $this->fname;
    }

    public function get_status() : EnumStatusType {
        return $this->status;
    }

    public function get_username() : string {
        return $this->username;
    }

    public static function FromArray($array) : CompleteUserChatContent {
        $status = null;

        switch ($array['status']) {
            case 'online':
                $status = EnumStatusType::Online();
                break;

            case 'busy':
                $status = EnumStatusType::Busy();
                break;

            case 'Away':
                $status = EnumStatusType::Away();
                break;
            
            default:
                $status = EnumStatusType::Offline();
                break;
        }

        return new CompleteUserChatContent($array['id'], $array['name'], $array['username'], $array['fname'], $status);
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

