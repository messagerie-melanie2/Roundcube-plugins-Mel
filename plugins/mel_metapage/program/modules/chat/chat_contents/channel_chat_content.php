<?php
include_once 'user_chat_content.php';
include_once 'enums.php';
include_once __DIR__.'/../ichat_content.php';
include_once __DIR__.'/../chat_structure.php';

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
        $content = isset($content->channel) ? $content->channel : (isset($content->group) ? $content->group : $content);

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

class ChannelsChatContent extends \ArrayObject implements IChatContent {
    private $cache;

    public function offsetSet($key, $val) {
        if ($val instanceof ChannelChatContent) {
            return parent::offsetSet($key, $val);
        }
        throw new \InvalidArgumentException('Value must be a ChannelChatContent');
    }

    public function has() : bool {
        return count($this);
    }

    public function get() : any {
        return [
            'groups' => $this->get_from_cache(EnumChannelType::Private()->toString()),
            'channels' => $this->get_from_cache(EnumChannelType::Public()->toString()),
        ];
    }

    protected function _get(array $channels) : array {

    }

    public function yield_get() {
        foreach ($this as $value) {
            yield $value->get();
        }
    }

    private function &get_cache() : array {
        if (!isset($this->cache)) $this->cache = [];
        
        return $this->cache;
    }

    protected function update_cache($key, $value) : ChannelsChatContent{
        $this->get_cache()[$key] = $value;
        return $this;
    }

    protected function clear_cache($key, $value) : ChannelsChatContent{
        $this->cache = [];
        return $this;
    }

    protected function get_from_cache($key) {
        return $this->get_cache()[$key];
    }

    public function get_type(EnumChannelType $type) {
        $groups = $this->get_from_cache($type->toString());
        if (!isset($groups)) {
            $groups = array_filter([...$this], function ($item) use($type) {
                return $item->get_type() === $type;
            });
            $this->update_cache($type->toString(), $groups);
        }

        return $groups;
    }

    private function _add_to_type(array $items, EnumChannelType $type) {
        $values = $this->get_from_cache($type->toString());

        if (!isset($values)) $values = $items ?? [];
        else $values = array_merge($values, ($items ?? []));

        $this->update_cache($type->toString(), $values);
    }

    public function add_to_type(ChannelChatContent $item, EnumChannelType $type) : ChannelsChatContent {
        $this[] = $item;
        $this->_add_to_type([$item], $type);
        return $this;
    }

    public function adds_to_type(array $items, EnumChannelType $type)  : ChannelsChatContent {
        foreach ($items as $item) {
            $this[] = $item;
        }

        $this->_add_to_type($items, $type);
        return $this;
    }

    public function destroy() {
        $this->cache = null;
        
        for ($i=count($this) - 1; $i > 0; --$i) { 
            $this->offsetUnset($i);
        }
    }

    public static function fromFetch($fetched) : ChatApiResult {
        if (is_string($fetched)) $fetched = json_decode($fetched);

        $httpCode = 0;
        $contents = null;

        if (isset($fetched->httpCode)) $httpCode = $fetched->httpCode;
        else if (200 === $fetched->channel->httpCode && 200 === $fetched->group->httpCode) $httpCode = 200;
        else $httpCode = 200 === $fetched->channel->httpCode ? $fetched->group->httpCode : $fetched->channel->httpCode;

        if (isset($fetched->content)) {
            if (is_string($fetched->content)) $fetched->content = json_decode($fetched->content);
            $contents = new ChannelsChatContent(array_map(function ($item) {
                return ChannelChatContent::fromStructure($item);
            }, $fetched->content->channels ?? $fetched->content->groups));
        }
        else {
            if (is_string($fetched->channel->content)) $fetched->channel->content = json_decode($fetched->channel->content);
            if (is_string($fetched->group->content)) $fetched->group->content = json_decode($fetched->group->content);

            $contents = new ChannelsChatContent();
            $contents->adds_to_type(
                array_map(function ($item) {
                    return ChannelChatContent::fromStructure($item);
                },  $fetched->channel->content->channels),
                EnumChannelType::Public()
            );
            $contents->adds_to_type(
                array_map(function ($item) {
                    return ChannelChatContent::fromStructure($item);
                },  $fetched->group->content->groups),
                EnumChannelType::Private()
            );
        }

        return new ChatApiResult($httpCode, $contents);
    }
}