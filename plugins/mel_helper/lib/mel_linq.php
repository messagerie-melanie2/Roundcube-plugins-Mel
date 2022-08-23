<?php

interface IKeyValue {
    function get_key();
    function get_value();
}

class Mel_KeyValue implements IKeyValue
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
    function aggregate($iterable) : IMel_Enumerable;
    function add($item, $key = null) : IMel_Enumerable;
    function remove($item) : IMel_Enumerable;
    function removeAtKey($key) : IMel_Enumerable;
    function removeTwins($callback) : IMel_Enumerable;
    function any($selector = null) : bool;
    function all($selector) : bool;
    function contains($item) : bool;
    function first($selector = null);
    function firstOrDefault($default = null, $selector = null);
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

    public function groupBy($key_selector, $value_selector = null) : IMel_Enumerable
    {
        return new Mel_GroupBy($this, $key_selector, $value_selector);
    }

    public function aggregate($iterable) : IMel_Enumerable
    {
        return new Mel_Aggregate($this, $iterable);
    }

    public function add($item, $key = null) : IMel_Enumerable {
        return $this->aggregate((isset($key) ? [$key => $item] : [$item]));
    }

    public function remove($item) : IMel_Enumerable {
        return $this->where(function ($k, $v) use($item) {
            return $v !== $item;
        });
    }

    public function removeAtKey($key) : IMel_Enumerable {
        return $this->where(function ($k, $v) use($key) {
            return $k !== $key;
        });
    }

    public function removeTwins($selector) : IMel_Enumerable
    {
        return new MelTwins($this, $selector);
    }

    public function contains($item) : bool {
        return $this->any(function ($k, $v) use($item) {
            return $v === $item;
        });
    }

    public function toArray() : array
    {
        $array = [];
        foreach ($this as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue')) $array[$value->get_key()] = $value->get_value();
            else {
                if ($key === count($array)) $array[] = $value;
                else $array[$key] = $value;
            }
        }

        return $array;
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

    public function all($selector) : bool {
        return !$this->any(function ($k, $v) use($selector) {
            return !$selector($k, $v);
        });
    }

    public function empty() : IMel_Enumerable {
        return new Mel_Enumerable([]);
    }

    public function first($selector = null) {
        foreach ((isset($selector) ? $this->where($selector) : $this) as $value) {
            return $value;
        }

        throw new Exception("Error Processing Request", 1);
    }

    public function firstOrDefault($default = null, $selector = null)
    {
        try {
            return $this->first($selector);
        } catch (\Throwable $th) {
            return $default;
        }
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
                yield new Mel_KeyValue($key, $value);
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

            yield new Mel_KeyValue($key, $arr);
            $arr = null;
        }
    }
}

class Mel_Aggregate extends Mel_Enumerable
{
    protected $aggregate;
    public function __construct($iterable, $aggregable_iterable) {
        parent::__construct($iterable);
        $this->aggregate = $aggregable_iterable;
    }

    public function getIterator() : Traversable {
        $it = 0;
        foreach ($this->array_like as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue'))  yield $value;
            else {
                $it = $key;
                yield $key => $value;
            }
        }

        if ($this->is_assoc($this->aggregate))
        {
            foreach ($this->aggregate as $key => $value) {
                yield new Mel_KeyValue($key, $value);
            }
        }
        else {
            foreach ($this->aggregate as $key => $value) {
                yield (++$it) => $value;
            }
        }

    }
}

class MelTwins extends Mel_Where
{
    public function __construct($iterable, $callback) {
        parent::__construct($iterable, $callback);
    }

    public function getIterator() : Traversable {
        //$iterable = isset($this->selector) ? Mel_Enumerable::from($this->array_like)->select($this->selector) : $this->array_like;
        $is_key = false;
        $arr = [];
        foreach ($this->array_like as $key => $value) {
            if ($this->isKeyValuePair($value))
            {
                $is_key = true;
            } else $is_key = false;

            $tmpvalue = $is_key ? $value->get_value() : $value;

            if (count($arr) > 0)
            {
                if (isset($this->selector))
                {
                    if (!Mel_Enumerable::from($arr)->select($this->selector)->any(function ($k, $v) use($tmpvalue){
                        return $v === call_user_func($this->selector, $k, $tmpvalue);
                    })){
                        $arr[] = $tmpvalue;
                        yield $is_key ? $value : $key => $value;
                    }
                }
                else if (!in_array($tmpvalue, $arr)) yield $is_key ? $value : $key => $value;
            }
            else {
                $arr[] = $tmpvalue;
                yield $is_key ? $value : $key => $value;
            }
        }

        unset($arr);
    }

    protected function isKeyValuePair($value) : bool
    {
        return is_subclass_of($value, 'IKeyValue');
    } 

    protected function get_true_value($value)
    {
        return ($this->isKeyValuePair($value) ? $value->get_value() : $value);
    }
}