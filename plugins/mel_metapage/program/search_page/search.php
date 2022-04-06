<?php
include_once __DIR__."/../program.php";

class SearchPage extends Program
{
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_action("index", [$this, "index"]);
        
        if ($this->action === "" || $this->action === "index")
        {
        }
    }

    public function index()
    {
        $search_key_word = $this->get_input('_word');
        
        $search_config = $this->get_config('search', []);
        
        foreach ($search_config as $key => $value) {
            
        }
    }
}