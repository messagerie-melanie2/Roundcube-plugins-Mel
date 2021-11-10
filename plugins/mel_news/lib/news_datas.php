<?php
class news_datas
{
    public $id;
    public $title;
    public $date;
    public $text;
    public $service;
    public $type;
    public $category;

    public function __construct() {
    }

    public function html()
    {
        return "";
    }
}