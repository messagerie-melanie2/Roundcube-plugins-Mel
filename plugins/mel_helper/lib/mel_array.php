<?php
include_once 'mel_linq.php';
class MelArray implements ArrayAccess, Iterator
{
    private $container = [];
    private $size = 0;

    public function __construct($array = []) {
        $this->container = $array;
        $this->size = count($array);
        $this->rewind();
    }

    public function offsetSet($offset, $value) {
        if (is_null($offset)) {
            $this->container[] = $value;
        } else {
            $this->container[$offset] = $value;
        }
    }

    public function offsetExists($offset) {
        return isset($this->container[$offset]);
    }

    public function offsetUnset($offset) {
        unset($this->container[$offset]);
    }

    public function offsetGet($offset) {
        return isset($this->container[$offset]) ? $this->container[$offset] : null;
    }

    public function rewind() {
        return reset($this->container); //$this->position = 0;
    }

    public function current() {
        return current($this->container);//$this->container[$this->position];
    }

    public function key() {
        return key($this->container);
    }

    public function next() {
        return next($this->container);
    }

    public function valid() {
        return $this->key() !== null;
    }

    public function add($item)
    {
        $this->container[] = $item;
        ++$this->size;
        return $this;
    }

    public function remove($i)
    {
        if (isset($this->container[$i])) 
        {
            unset($this->container[$i]);
            --$this->size;
            return true;
        }
        else return false;
    }

    public function count()
    {
        return $this->size;
    }

    public function action()
    {
        return Mel_Enumerator::from($this->action);
    }

    public function toArray()
    {
        return $this->container;
    }

    public function sort($asc = true)
    {
        if ($asc) asort($this->container);
        else arsort($this->container);

        return $this;
    }

    public function orderBy($callback)
    {
        return $this->customOrder($callback);
    }

    public function orderByDesc($callback)
    {
        return $this->customOrder($callback, false);
    }

    private function customOrder($callback, $asc = true)
    {
        uasort($this->container, function($a, $b) use($callback, $asc) {
            $a = $callback($a);
            $b = $callback($b);
            
            if ($a === $b) return 0;

            if ($asc) return $a < $b ? -1 : 1;
            else return $a < $b ? 1 : -1;
        });
        return $this;
    }

    public function IsEmpty()
    {
        return $this->count() === 0;
    }
}