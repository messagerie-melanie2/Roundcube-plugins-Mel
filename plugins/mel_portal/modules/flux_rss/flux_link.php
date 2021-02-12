<?php
class FluxLink
{
    public $title;
    public $link;
    function __construct($title, $link) {
        $this->title = $title;
        $this->link = $link;
    }
}