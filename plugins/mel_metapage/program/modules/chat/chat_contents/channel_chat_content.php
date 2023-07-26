<?php
include_once __DIR__.'/../ichat_content.php';
include_once __DIR__.'/../chat_structure.php';
include_once 'user_chat_content.php';

class ChannelChatContent implements IChatContent {
    private $id;
    private $name;
    private $type;
    private $users;

    public function __construct(string $id, string $name, EnumChannelType $type, ArrayOfUsers $users) {
        $this->id = $id;
        $this->name = $name;
        $this->type = $type;
        $this->users = $users;
    }

    public function has() : bool {
        return $this->has_string($this->id) && 
               $this->has_string($this->name);
    }

    private function has_string(string $val) : bool {
        return isset($val) && '' !== $val;
    }

    private function has_array($val) : bool {
        return isset($val) && count($val) > 0; 
    }

    public function get() : any {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'users' => $this->users
        ];
    }

    public function get_id() : string {
        return $this->id;
    }

    public function get_name() : string {
        return $this->name;
    }

    public function get_type() : EnumChannelType {
        return $this->type;
    }

    public function get_users() : ArrayOfUsers {
        return $this->users;
    }

    public static function fromFetch($fetched) : ChatApiResult {
        return ChatApiResult::fromFetch($fetched, ['ChannelChatContent', 'fromStructure']);
    }

    public static function fromStructure($content) : IChatContent {
        $return = null;
        $content = isset($content->channel) ? $content->channel : $content->group;

        if (isset($content))
        {
            if (is_array($content->u)) {
                $users = new ArrayOfUsers();
                foreach ($content->u as $user) {
                    $users[] = new UserChatContent($user->_id, $user->username);
                }
            }
            else if(null !== $content->u) {
                 $users = new ArrayOfUsers();
                 $users[] = new UserChatContent($content->u->_id, $content->u->username);
            }
            else $users = new ArrayOfUsers();
    
            $type = null;
            switch ($content->t) {
                case 'p':
                    $type = EnumChannelType::Private();
                    break;
    
                case 'c':
                    $type = EnumChannelType::Public();
                    break;
    
                case 'd':
                    $type = EnumChannelType::Direct();
                    break;
                
                default:
                    # code...
                    break;
            }

            $return = new ChannelChatContent($content->_id, $content->name, $type, $users);
        }
        else $return  = ChatApiResult::NullContent();

        return $return;
    }
}

class EnumChannelType {
    private $value;

    private function __construct(string $enum) {
        $this->value = $enum;
    }

    public function isEqual(EnumChannelType $enum) : bool {
        return $enum->value === $this->value;
    }

    public function toString() {
        return is_string($this->value) ? $this->value : json_encode($this->value);
    }

    public static function Private() {
        return new EnumChannelType('p');
    }

    public static function Public() {
        return new EnumChannelType('c');
    }

    public static function Direct() {
        return new EnumChannelType('d');
    }
}