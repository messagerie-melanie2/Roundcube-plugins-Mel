<?php

/**
 * Taille de la vignette d'un flux.
 */
class FluxSize  {    
    /**
     * taille de 1*1
     */
    const one_by_one = 1;
    /**
     * Taille de 2*1
     */
    const two_by_one = 2;

    /**
     * Taille du flux.
     */
    public $size;

    function __construct($size = FluxSize::one_by_one) {
        $this->size = $size;
    }
}

/**
 * Configuration d'un widget flux.
 */
class FluxConfig
{
    public $title;
    public $tabs;
    public $showTabs;
    function __construct($tabs, $title = "", $showTabs = false) {
        if ($tabs == null)
            $this->tabs = array();
        else
            $this->tabs = $tabs;
        $this->title = $title;
        $this->showTabs = $showTabs;
    }
}

/**
 * Tab qui contient un ou plusieurs flux.
 */
class FluxTab
{
    public $name;
    public $items;
    function __construct($name, $items) {
        if ($items == null)
            $this->items = array();
        else
            $this->items = $items;
        $this->name = $name;
    }

    public function add($fluxItem)
    {
        $this->items[$this->count()] = $fluxItem;
    }

    public function count()
    {
        return count($this->items);
    }
}

/**
 * Contient les informations d'un flux
 */
class FluxItem 
{
    public $url;
    public $size;
    public $color;
    function __construct($url, $size, $color = FluxColor::LIGHT) {
        $this->url = $url;
        if ($size == null || get_class($size) == false || get_class($size) != "FluxSize")
            $this->size = new FluxSize(FluxSize::one_by_one);
        else
            $this->size = $size;
        $this->color = $color;
    }
}

/**
 * Classe statique, couleur d'un flux.
 */
class FluxColor
{
    const LIGHT = "LIGHT";
    const DARK = "DARK";

}

