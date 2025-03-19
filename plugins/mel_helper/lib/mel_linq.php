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
    function fusion($key, $value, $copy = false) : IMel_Enumerable;
    function remove($item) : IMel_Enumerable;
    function removeAtKey($key) : IMel_Enumerable;
    function removeTwins($callback) : IMel_Enumerable;
    function orderBy($callback, $descending = false) : IMel_Enumerable;
    function max($selector = null);
    function min($selector = null);
    function any($selector = null) : bool;
    function all($selector) : bool;
    function contains($item) : bool;
    function first($selector = null);
    function firstOrDefault($default = null, $selector = null);
    function toArray() : array;
    function toDictionnary($key_selector, $value_selector) : array;
    function take($number, $where = null, $selector = null) : IMel_Enumerable; 
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

    function fusion($key, $value, $copy = false) : IMel_Enumerable{
        return new MelFusion($this, $key, $value, $copy);
    }

    public function orderBy($selector, $descending = false) : IMel_Enumerable
    {
        return !$descending ? new MelOrder($this, $selector) : new MelOrderByDescending($this, $selector);
    }

    public function contains($item) : bool {
        return $this->any(function ($k, $v) use($item) {
            return $v === $item;
        });
    }

    public function take($number, $where = null, $selector = null) : IMel_Enumerable 
    {
        return new Mel_Take($this, $number, $where, $selector);
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

    public function max($selector = null)
    {
        $iterable = isset($selector) ? $this->select($selector) : $this;

        $last = null;
        foreach ($iterable as $value) {
            if ($last === null) {
                $last = $value;
            }
            else {
                if ($last < $value) $last = $value;
            }
        }

        return $last;
    }

    public function min($selector = null)
    {
        $iterable = isset($selector) ? $this->select($selector) : $this;

        $min = null;
        foreach ($iterable as $value) {
            if (!isset($min)) $min = $value;
            else if ($min > $value) $min = $value;
        }

        return $min;
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
            if (is_string($this->array_like)) $this->array_like = str_split($this->array_like);
            foreach ($this->array_like as $key => $value) {
                yield $key => $value;//new Mel_KeyValue($key, $value);
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
            else if (call_user_func($this->selector, $key, $value)) yield $key => $value;
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

class Mel_Take extends Mel_Where{
    private $selectSelector;
    private $max;

    public function __construct($iterable, $max, $where = null, $selector = null)
    {
        parent::__construct($iterable, $where);
        $this->selectSelector = $selector;
        $this->max = $max ?? 1;

        if ($this->max < 1) $this->max = 1;
    }

    public function getIterator() : Traversable {
        $it = 0;
        foreach ($this->array_like as $key => $value) {     
            $yKey = null;
            $yValue = null;

            if ($this->selector) {  
                if (is_subclass_of($value, 'IKeyValue')) 
                {
                    if (call_user_func($this->selector, $value->get_key(), $value->get_value())) {
                        $yKey = $value->get_key();
                        $yValue = $value->get_value();
                    }
                }
                else if (call_user_func($this->selector, $key, $value)) {
                    $yKey = $key;
                    $yValue = $value;
                };
            }

            if ($this->selectSelector) {
                $yValue = call_user_func($this->selectSelector, $yKey, $yValue);

                if(is_subclass_of($yValue, 'IKeyValue')) {
                    $yKey = $yValue->get_key();
                    $yValue = $yValue->get_value();
                }
            }

            yield ($yKey ?? $key) => ($yValue ?? $value);

            if (++$it >= $this->max) break;
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

class MelOrder extends Mel_Enumerable {
    protected $selector;
    public function __construct($iterable, $selector) {
        parent::__construct($iterable);
        $this->selector = $selector;
    }

    
    public function getIterator() : Traversable {
        foreach ($this->tri_fusion($this->array_like) as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue')) yield $value->get_key() => $value->get_value();
            else yield $key => $value;
        }
    }

    function tri_fusion($T)
    {
        if (!is_array($T)) $T = $T->toArray();
        usort($T, function($a, $b) {
            $a = call_user_func($this->selector, 0, $a);
            $b = call_user_func($this->selector, 0, $b);

            if ($a == $b) return 0;
            
            return $this->_p_test($a, $b);
        });
        return $T;
        // yield from 
        // $T_len = $T->count();
        // if ($T_len === 1) yield from $T;
        // else if ($T_len > 1) {
        //     $T_len = $T_len/2;
        //     $array = Mel_Enumerable::from($T)->select(function ($k, $v) {return $v;});
        //     $array = $this->_fusion($array->where(function($k, $v) use($T_len) {return $k < $T_len;})->toArray(), $array->where(function($k, $v) use($T_len) {return $k >= $T_len;})->toArray());
        //     yield from $array;
        // }
    }

    protected function _p_test($a, $b) {
        return $a > $b ? 1 : -1;
    }

    function test_fusion($a, $b) {
        //if (is_string($a) && is_string($b)) return strcmp($a, $b) < 0;

        return $a <= $b;
    }

    function _fusion($A, $B)
    {
        $A = array_values($A);
        $B = array_values($B);

        if (count($A) === 0) return $B;
        if (count($B) === 0) return $A;

        if ($this->test_fusion(call_user_func($this->selector, 0, $A[0]), call_user_func($this->selector, 0, $B[0]))) return array_merge([$A[0]], $this->_fusion(array_slice($A, 1, count($A)), $B));
        else return array_merge([$B[0]], $this->_fusion($A, array_slice($B, 1, count($B))));
    }
}

class MelOrderByDescending extends MelOrder{
    public function __construct($iterable, $selector) {
        parent::__construct($iterable, $selector);
    }

    function test_fusion($a, $b) {
        return !parent::test_fusion($a, $b);
    }

    protected function _p_test($a, $b) {
        return -parent::_p_test($a, $b);
    }
}

class MelFusion extends Mel_Enumerable{
    private $key;
    private $value;
    private $copy;
    public function __construct($iterable, $key, $value, $copy = false) {
        parent::__construct($iterable);
        $this->key = $key;
        $this->value = $value;
        $this->copy = $copy;
    }

    public function getIterator() : Traversable {
        foreach ($this->array_like as $key => $value) {
            if (is_subclass_of($value, 'IKeyValue'))  {
                $key = $value->get_key();
                $value = $value->get_value();
            }

            if ($this->copy) $value = unserialize(serialize($value));

            if (is_array($value)) $value[$this->key] = is_callable($this->value) ? call_user_func($this->value, $key, $value) : $this->value;
            else {
                $tmpKey = $this->key;
                $value->$tmpKey = is_callable($this->value) ? call_user_func($this->value, $key, $value) : $this->value;
            }

            yield $key => $value;
        }

    }
    
}