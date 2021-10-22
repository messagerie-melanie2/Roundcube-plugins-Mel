<?php
include_once "xTuple.php";
class arrayTuple extends xTuple
{

    public function __construct() {
        parent::__construct(2);
    }

    // public function add($item)
    // {
    //     if ($this->it === -1)
    //     {
    //         $this->array[] = [$item];
    //         $this->it = 0;
    //     }
    //     else {
    //         if (count($this->array[$this->it]) < 2)
    //             $this->array[$this->it][] = $item;
    //         else 
    //             $this->array[++$this->it] = [$item];
    //     }
    // }

    // public function get($i)
    // {
    //     return $this->array[$i];
    // }

    // public function get_md()
    // {
    //     return "6";
    // }


}