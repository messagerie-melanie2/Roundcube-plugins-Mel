<?php
class tree_dn_item
{
    private $parent;
    private $item;
    private $child;

    public function __construct($item) {
        $this->item = $item;
    }

    public function setParent($parent)
    {
        $this->parent = $parent;
        return $this;
    }

    public function setChild($child)
    {
        $this->child = $child;
        return $this;
    }

    public function haveParent()
    {
        return $this->parent !== null;
    }

    public function haveChildren()
    {
        return $this->child !== null;
    }

}

class tree_dn{
    private $tree;
    private $count;

    public function __construct($array_dn) {
        $this->tree = [];
        $this->count = 0;
        $size = count($array_dn);

        for ($i=0; $i < $size; ++$i) { 
            if ($array_dn[$i]["type"] !== "ou")
                continue;
                
            $this->addToTree(new tree_dn_item($array_dn[$i]));
        }
    }

    public function addToTree($item)
    {
        if ($this->count === 0)
            $this->tree[] = $item;
        else {
            $lastSize = $this->count - 1;
            $this->tree[$lastSize]->setParent($item);
            $item->setChild($this->tree[$lastSize]);
            $this->tree[] = $item;
        }

        ++$this->count;
    }

    public function size()
    {
        return $this->count;
    }

    public function getMaxParent()
    {
        return $this->tree[$this->count - 1];
    }

    public function getMinChildren()
    {
        return $this->tree[0];
    }
}