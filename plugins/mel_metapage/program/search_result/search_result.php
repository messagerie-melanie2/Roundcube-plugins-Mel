<?php
abstract class ASearchResult
{
    public $header;
    public $sub_header;
    public $link;

    public function __construct($header, $sub_header, $link = null) {
        $this->header = $header;
        $this->sub_header = $sub_header;
        $this->link = $link;
    }  
    
}

class SearchResults
{
    private $results;

    public function __construct($array = []) {
        $this->results = $array;
    }  

    public function add($item)
    {
        $this->results[$this->count()] = $item;
    }

    public function count()
    {
        return count($this->results);
    }

    public function get($i)
    {
        return $this->results[$i];
    }

    public function edit($i, $item)
    {
        $this->results[$i] = $item;
    }

    public function get_array($label)
    {
        return ["label" => $label, "datas" => $this->results];
    }
}



