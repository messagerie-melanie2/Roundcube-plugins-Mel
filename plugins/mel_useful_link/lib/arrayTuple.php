<?php
class arrayTuple
{

    private $array;
    private $it;

    public function __construct() {
        $this->array = [];
        $this->it = -1;
    }

    public function add($item)
    {
        if ($this->it === -1)
        {
            $this->array[] = [$item];
            $this->it = 0;
        }
        else {
            if (count($this->array[$this->it]) < 2)
                $this->array[$this->it][] = $item;
            else 
                $this->array[++$this->it] = [$item];
        }
    }

    public function get($i)
    {
        return $this->array[$i];
    }

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