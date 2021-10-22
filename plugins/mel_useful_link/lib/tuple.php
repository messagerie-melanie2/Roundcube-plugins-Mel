<?php
abstract class tuple
{
    protected $array;
    protected $it;

    public function __construct() {
        $this->array = [];
        $this->it = -1;
    }

    public abstract function add($item);

    public abstract function get($i);

    public abstract function get_md();

    public function toArray()
    {
        return $this->array;
    }

    public function length()
    {
        return count($this->array);
    }

    public function current()
    {
        return $this->it;
    }
}