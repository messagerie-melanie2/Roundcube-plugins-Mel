<?php

interface IKeyValue {
    function get_key();
    function get_value();
}

class KeyValue implements IKeyValue
{
    public const NO_KEY = '¤¤¤¤¤¤Mel_NO_KEY_z4ef654ezf6ze7f86ezf5zeez¤¤¤¤¤$*ù';

    private $key;
    private $value;

    public function __construct($key, $value) {
        $this->key = $key;
        $this->value = $value;
    }

    public function get_key() {
        return $this->key;
    }

    public function get_value() {
        return $this->value;
    }
}

interface IMel_Enumerable extends IteratorAggregate, Countable  
{
    function where($selector) : IMel_Enumerable;
    function select($selector) : IMel_Enumerable;
    function groupBy($key_selector, $value_selector = null) : IMel_Enumerable;
    function any($selector = null) : bool;
    function toArray() : array;
    function toDictionnary($key_selector, $value_selector) : array;
}

abstract class AMel_Enumerable implements IMel_Enumerable
{
    protected $array_like;
    public function __construct($array_like_or_iterable) {
        $this->array_like = $array_like_or_iterable;
    }

    public abstract function update();

    protected function is_assoc($array)
    {
        if ([] === $array) return false;
        return array_keys($array) !== range(0, count($array) - 1);
    }
}

class Mel_Enumerable extends AMel_Enumerable implements IMel_Enumerable
{
    private $count;
    protected function __construct($a) {
        parent::__construct($a);

        if (is_array($a)) $this->count = count($a);
    }

    public function where($selector) : IMel_Enumerable {
        return new Mel_Where($this, $selector);
    }

    public function select($selector) : IMel_Enumerable {
        return new Mel_Select($this, $selector);
    }

    public function groupBy($key_selector, $value_selector = null) : IMel_Enumerable {
        return new Mel_GroupBy($this, $key_selector, $value_selector);
    }

    public function any($selector = null) : bool
    {
        foreach ($this as $key => $value) {
            if (!isset($selector)) return true;
            else {
                if (is_subclass_of($value, 'IKeyValue')) 
                {
                    $key = $value->get_key();
                    $value = $value->get_value();
                }

                if (call_user_func($selector, $key, $value)) return true;
            }
        }

        return false;
    }

    public function count() : int
    {
        if (!isset($this->count))  {
            $this->count = 0;

            foreach ($this as $key => $value) {
                ++$this->count;
            }
        }

        return $this->count;
    }

    public function toArray() : array
    {
        $array = [];
        foreach ($this as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue')) $array[$value->get_key()] = $value->get_value();
            else $array[$key] = $value;
        }

        return $array;
    }

    public function toDictionnary($key_selector, $value_selector) : array {
        $array = [];
        foreach ($this as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue')) 
            {
                $key = $value->get_key();
                $value = $value->get_value();
            }
            
            $array[call_user_func($key_selector, $key, $value)] = call_user_func($value_selector, $key, $value);
        }

        return $array;
    }

    public function getIterator() : Traversable {

        if ($this->is_assoc($this->array_like))
        {
            foreach ($this->array_like as $key => $value) {
                yield new KeyValue($key, $value);
            }
        }
        else {
            foreach ($this->array_like as $key => $value) {
                yield $key => $value;
            }
        }

    }

    public function update()
    {
        $array = [];

        foreach ($this as $key => $value) {
            $array[$key] = $value;
        }

        $this->array_like = $array;

        return $this;
    }

    static function from($iterable) : IMel_Enumerable {
        return new Mel_Enumerable($iterable);
    }
}

class Mel_Where extends Mel_Enumerable {
    protected $selector;

    public function __construct($a, $selector) {
        parent::__construct($a);
        $this->selector = $selector;
    }

    public function getIterator() : Traversable {
        foreach ($this->array_like as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue')) 
            {
                if (call_user_func($this->selector, $value->get_key(), $value->get_value())) yield $value;
            }
            else if (call_user_func($this->selector, $key, $value)) yield $value;
        }
    }
}

class Mel_Select extends Mel_Where{
    public function __construct($iterable, $selector)
    {
        parent::__construct($iterable, $selector);
    }

    public function getIterator() : Traversable {
        foreach ($this->array_like as $key => $value) {      
            yield call_user_func($this->selector, $key, $value);
        }
    }
}

class Mel_GroupBy extends Mel_Where
{
    protected $value_selector;
    public function __construct($iterable, $key_selector, $value_selector = null)
    {
        parent::__construct($iterable, $key_selector);
        $this->value_selector = $value_selector;
    }

    public function getIterator() : Traversable {
        foreach ($this->array_like as $key => $value) {  
            $arr = [];    
            $key = call_user_func($this->selector, $key, $value);

            foreach ($this->array_like as $skey => $svalue) {
                if (call_user_func($this->selector, $skey, $svalue) === $key) $arr[] = (isset($this->value_selector) ? call_user_func($this->value_selector, $skey, $svalue) : $svalue);
            }

            yield new KeyValue($key, $arr);
            $arr = null;
        }
    }
}