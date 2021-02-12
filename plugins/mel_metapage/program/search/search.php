<?php
abstract class ASearch
{
    const REPLACED_SEARCH = "¤¤¤";
    public $task;
    public $action;
    public $search;
    // public $scop;
    // public $header;
    // public $misc;

    public function __construct($task, $action, $search = ASearch::REPLACED_SEARCH) {
        $this->task = $task;
        $this->action = $action;
        $this->search = $search;
    }  

    public abstract function url();/*
    {
        return "?_task=".$this->task."&_action=".$this->action."&_q=".$this->search."&_headers=".$this->header;
    }*/
}