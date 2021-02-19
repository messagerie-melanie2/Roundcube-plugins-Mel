<?php


/**
 * Taille de la vignette d'un flux.
 */
class FCParser  {    

    const TITLE = "title";
    const TABS = "tabs";
    const LABEL = "label";
    const FLUX = "flux";
    const FILE = "file";
    const SIZE = "size";
    const COLOR = "color";
    const SHOW_TABS = "show_tabs";

    private $flux_config;

    function __construct($config, $isObject = false) {
        if ($isObject)
            $this->flux_config = $config;
        else {
            $size = count($config);
            for ($i=0; $i < $size; ++$i) { 
                $this->flux_config[] = $this->create($config[$i]);
            }
        }
    }

    public function set($flux_config)
    {
        $this->flux_config = $flux_config;
    }

    public function toArray()
    {
        $retour = [];
        $config_size = count($this->flux_config);
        for ($i=0; $i < $config_size; ++$i) { 
            $retour[$i] = [];
            $retour[$i][FCParser::TITLE] = $this->flux_config[$i]->title;
            $retour[$i][FCParser::SHOW_TABS] = $this->flux_config[$i]->showTabs;
            $retour[$i][FCParser::TABS] = [];
            $tab_size = count($this->flux_config[$i]->tabs);
            for ($it=0; $it < $tab_size; ++$it) { 
                $retour[$i][FCParser::TABS][$it][FCParser::LABEL] = $this->flux_config[$i]->tabs[$it]->name;
                $retour[$i][FCParser::TABS][$it][FCParser::FLUX] = [];
                $item_size = $this->flux_config[$i]->tabs[$it]->count();
                for ($it2=0; $it2 < $item_size; ++$it2) { 
                    $retour[$i][FCParser::TABS][$it][FCParser::FLUX][$it2][FCParser::FILE] = $this->flux_config[$i]->tabs[$it]->items[$it2]->url;
                    $retour[$i][FCParser::TABS][$it][FCParser::FLUX][$it2][FCParser::SIZE] = FSizeParser::from($this->flux_config[$i]->tabs[$it]->items[$it2]->size);
                    $retour[$i][FCParser::TABS][$it][FCParser::FLUX][$it2][FCParser::COLOR] = FColorParser::from($this->flux_config[$i]->tabs[$it]->items[$it2]->color);
                }
            }
        }
        return $retour;
    }

    private function create($config)
    {
        $fc = new FluxConfig([], $config[FCParser::TITLE], $config[FCParser::SHOW_TABS]);
        $tabsize = count($config[FCParser::TABS]);
        $fluxsize;
        for ($i=0; $i < $tabsize; ++$i) { 
            $flux_size = count($config[FCParser::TABS][$i][FCParser::FLUX]);
            $fc->tabs[$i] = new FluxTab($config[FCParser::TABS][$i][FCParser::LABEL], null);
            for ($it=0; $it < $flux_size; ++$it) { 
                $item = $config[FCParser::TABS][$i][FCParser::FLUX][$it];
                $fc->tabs[$i]->add(new FluxItem($item[FCParser::FILE], FSizeParser::get($item[FCParser::SIZE]), FColorParser::get($item[FCParser::COLOR])));
            }
        }
        return $fc;
    }

    public function get()
    {
        return $this->flux_config;
    }
}

class FSizeParser {

    const ONE_BY_ONE = "1x1";
    const TWO_BY_ONE = "2x1";

    public $flux_size;

    function __construct($size) {
        if ($size === FSizeParser::ONE_BY_ONE)
            $this->flux_size = new FluxSize();
        else if ($size === FSizeParser::TWO_BY_ONE)
            $this->flux_size = new FluxSize(FluxSize::two_by_one);
    }

    public static function get($size)
    {
        return (new FSizeParser($size))->flux_size;
    }

    public static function from($size)
    {
        if ($size->size == FluxSize::one_by_one)
            return FSizeParser::ONE_BY_ONE;
        else if ($size->size == FluxSize::two_by_one)
            return FSizeParser::TWO_BY_ONE;
    }
}

class FColorParser {

    const LIGHT = "light";
    const DARK = "dark";

    public $color;

    function __construct($color) {
        if ($color === null || $color === FColorParser::LIGHT)
            $this->color = FluxColor::LIGHT;
        else if ($color === FColorParser::DARK)
            $this->color = FluxColor::DARK;
    }

    public static function get($color)
    {
        return (new FColorParser($color))->color;
    }

    public static function from($color)
    {
        if ($color === FluxColor::LIGHT)
            return FColorParser::LIGHT;
        else if ($color === FluxColor::DARK)
            return FColorParser::DARK;
    }
}