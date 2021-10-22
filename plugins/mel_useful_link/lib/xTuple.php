<?php
try {
    include_once "tuple.php";
class xTuple extends tuple
{
    /**
     * Taille de la tuple
     *
     * @var int
     */
    private $x;

    public function __construct($tupleSize) {
        parent::__construct();
        $this->x = $tupleSize;
    }

    public function add($item)
    {
        if ($this->it === -1)
        {
            $this->array[] = [$item];
            $this->it = 0;
        }
        else {
            if (count($this->array[$this->it]) < $this->x)
                $this->array[$this->it][] = $item;
            else 
                $this->array[++$this->it] = [$item];
        }
    }

    public function get($i)
    {
        return $this->array[$i];
    }

    public function get_md()
    {
        return 12/$this->x;
    }
}
} catch (\Throwable $th) {
    throw $th;
}