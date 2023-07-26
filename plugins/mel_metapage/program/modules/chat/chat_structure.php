<?php 
include_once 'ichat_content.php';
include_once 'chat_contents/null_chat_content.php';
include_once 'chat_contents/unknown_chat_content.php';
include_once 'chat_contents/string_chat_content.php';
include_once 'chat_contents/array_chat_contents.php';
include_once 'chat_contents/error_chat_content.php';

/**
 * Contient les données de chat récupérer via une api
 */
class ChatApiResult {
    /**
     * Code http retournée par l'appel à l'api
     * @var [int]
     */
    protected $httpCode;
    /**
     * Données retournées par l'appel à l'api
     *
     * @var [IChatContent]
     */
    protected $contents;

    public function __construct(int $httpCode, IChatContent $contents) {
        $this->httpCode = $httpCode;
        $this->contents = $contents;
    }

    /**
     * Récupère le code http
     *
     * @return int
     */
    public function get_code() : int {
        return $this->httpCode;
    }

    /**
     * Récupère les données
     *
     * @return IChatContent
     */
    public function get_contents() : IChatContent {
        return $this->contents;
    }

    /**
     * Vérifie si le code http est le code qui signifie "Ok, tout c'est bien passé"
     *
     * @param integer $comparator Code qui signifie que ça c'est bien passé (200 par défaut).
     * @return boolean
     */
    public function codeValid(int $comparator = 200) : bool {
        return $comparator === $this->get_code();
    }

    /**
     * Vérifie qu'il y a bien des données
     *
     * @return boolean
     */
    public function hasContents() : bool {
        return $this->get_contents() !== null && $this->get_contents()->has();
    }

    /**
     * Vérifie que le code est bon et qu'il y a bien des données
     *
     * @param integer $comparator Code qui signifie que ça c'est bien passé (200 par défaut).
     * @return boolean
     */
    public function isValid(int $comparator = 200) : bool {
        return $this->codeValid($comparator) && $this->hasContents();
    }

    /**
     * Récupère les données depuis un fetch et les mets en forme
     *
     * @param [any] $fetched Données brutes
     * @param [callback] $callback_content Fonction qui permet de mettre en forme les données
     * @return ChatApiResult
     */
    public static function fromFetch($fetched, $callback_content = null) : ChatApiResult {
        $return = ChatApiResult::EmptyResult();
        if (is_array($fetched) && isset($fetched[0])) {
            $return = new ArrayOfChatApiResult();
            for ($i=0, $len=count($fetched); $i < $len; $i++) { 
                $return[] = ChatApiResult::fromFetch($fetched[$i], $callback_content);
            }

            $return = (new ChatApiResultArray($return))->toChatApiResult();
        }
        else {
            $code = $fetched['httpCode'];
            $content = $fetched['content'];
    
            if (is_string($content)) $content = json_decode($content);
    
            if (isset($content->error)) $content = new ErrorChatContent($content->error);
            else if (isset($callback_content)) $content = call_user_func($callback_content, $content) ?? ChatApiResult::NullContent();
            else if (null === $content) $content = ChatApiResult::NullContent();
            else if ('' === $content) $content = new StringChatContent();
            else $content = new UnknownChatContent($content);
            
            $return = new ChatApiResult($code, $content);
        }

        return $return;
    }

    public static function NullContent() : NullChatContent {
        return new NullChatContent();
    }

    public static function EmptyResult() : ChatApiResult {
        return new ChatApiResult(0, ChatApiResult::NullContent());
    }
}

class ChatApiResultArray extends ChatApiResult {
    public function __construct(ArrayOfChatApiResult $contents) {
        $array = $contents->toPHPArray();
        unset($contents);
        $this->httpCode = array_map(function ($item) {
            return $item->get_code();
        }, $array) ?? [];
        $this->contents = new ArrayChatContent(array_map(function ($item) {
            return $item->get_contents();
        }, $array) ?? []);
    }

    /**
     * Récupère le code http
     *
     * @return array
     */
    public function get_code(int $comparator = 200) : int {
        $code = $this->has_all_get_ok_code($comparator);

        if (true === $code) $code = $comparator;

        return $code;
    }

    public function get_codes() : array {
        return $this->httpCode;
    }

    protected function has_all_get_ok_code(int $comparator = 200) {
        foreach ($this->get_codes() as $value) {
            if ($comparator !== $value) return $value;
        }

        return true;
    }

    public function toChatApiResult(int $comparator = 200) : ChatApiResult {
        switch (count($this->get_contents())) {
            case 0:
                return new ChatApiResult($this->get_code($comparator) ?? 0, ChatApiResult::NullContent());

            case 1:
                return new ChatApiResult($this->get_code($comparator) ?? 0, $this->get_contents()[0]);
            
            default:
                return $this;
        }
    }

    public function is_chat_api_array_result($item) {
        return $item instanceof ChatApiResultArray;
    }
}

class ArrayOfChatApiResult extends \ArrayObject {
    public function offsetSet($key, $val) {
        if ($val instanceof ChatApiResult) {
            return parent::offsetSet($key, $val);
        }
        throw new \InvalidArgumentException('Value must be a ChatApiResult');
    }

    public function toPHPArray() {
        return [...$this];
    }
}