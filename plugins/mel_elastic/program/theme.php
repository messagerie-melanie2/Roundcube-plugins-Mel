<?php
class Theme {
    public const EXT = ['svg', 'png', 'jpeg', 'jpg', 'gif'];
    public const EXT_STYLE = '.css';
    public const THEME_PATH = '/themes';
    public $path; //ok
    public $parent; //ok
    public $icon; //ok
    public $enabled; //ok
    public $id; //ok
    public $name; //ok
    private $displayed; //ok
    private $desc; //ok
    public $styles; //ok
    public $class;// ok


    public function __construct($path)
    {
        $this->path = $path;
        $json = json_decode(file_get_contents($path.'/theme.json'));

        $this->id = $json->id;
        $this->parent = new ParentTheme($json->parent);
        $this->icon = isset($json->icon) ? $path.'/'.$json->icon : $path.'/icon.svg';

        if (strpos($this->icon, '.') === false) {
            foreach (self::EXT as $value) {
                if (file_exists($this->icon)) {
                    $this->icon = $this->icon.".$value";
                    break;
                }
            }
        }

        $this->icon = "./skins".explode('skins', $this->icon)[1];

        if ($path[strlen($path) - 1] === '/') $path = substr($path, 0, -1);

        $this->name = explode('/', $path);
        $this->name = $this->name[count($this->name) - 1];
        $this->styles = self::generate_style_path($json->style, $this->name);
        $this->enabled = $json->enabled ?? true;

        if (!isset($json->class)) $this->class = 'theme-'.$this->id;
        else $this->class = $json->class;

        $this->displayed = new ThemeLocalization($this->id, $json->display ?? $this->id, self::SkinPath().self::THEME_PATH.'/'.$this->name.'/localization');
        $this->desc = new ThemeLocalization($this->id, $json->description ?? '', self::SkinPath().self::THEME_PATH.'/'.$this->name.'/localization');
    }

    public function __get($property) {
        switch ($property) {
            case 'displayed':
                return $this->displayed->__toString();
            case 'desc':
                return $this->desc->__toString();
            default:
                return null;
        }    
    }

    public function setParent($parent) {
        $this->parent->set($parent);
        return $this;
    }

    public function prepareToSave() {
        $forSave = [];
        $array = ['id', 'icon', 'displayed', 'desc', 'class', 'parent'];

        foreach ($array as $value) {
            switch ($value) {
                case 'displayed':
                    $forSave[$value] = $this->displayed->__toString();
                    break;

                case 'desc':
                    $forSave[$value] = $this->desc->__toString();
                    break;

                case 'parent':
                    if ($this->parent->exist()) {
                        $forSave[$value] = $this->parent->id;
                    }
                    break;
                
                default:
                    $forSave[$value] = $this->$value;
                    break;
            }
        }

        return $forSave;
    }

    public static function SkinPath()
    {
        return mel_elastic::SkinPath();
    }

    protected static function generate_style_path($styles, $themeFolder) {
        if (is_array($styles)) {
            foreach ($style as $styles) {
                //Si c'est un fichier
                if (self::loaded_style_is_folder($style)) {
                    yield self::THEME_PATH."/$themeFolder/$style";
                }
                else {
                    //Si c'est un dossier
                    yield from self::generate_style_folder($style, $themeFolder);
                }
            }
        }
        else {
            if (self::loaded_style_is_folder($styles)) {
                yield self::THEME_PATH."/$themeFolder/$styles";
            }
            else yield from self::generate_style_folder($styles, $themeFolder);
        }
    }

    protected static function loaded_style_is_folder($style) {
        return strpos($style, self::EXT_STYLE) !== false;
    }

    protected static function generate_style_folder($folder, $themeFolder) {
        $files = scandir(self::SkinPath().self::THEME_PATH."/$themeFolder/$folder");

        foreach ($files as $fof) {
            if (self::loaded_style_is_folder($fof)){
                yield self::THEME_PATH."/$themeFolder/$folder/$fof";
            }
        }
    }

}

class ParentTheme {
    public $id;
    private $theme;

    public function __construct($id)
    {
        $this->id = $id;
    }

    public function set($theme) {
        if ($theme->id === $this->id) $this->theme = $theme;
        else throw new Exception("Id not math", 1);

        return $this;
    }

    public function get() {
        return $theme;
    }

    public function isLoaded() {
        return isset($this->theme);
    }

    public function exist() {
        return isset($this->id);
    }
}

class ThemeLocalization  {
    private $theme;
    private $key;
    private $path;
    private $local;
    public function __construct($theme, $key, $path, $local = 'fr_FR') {  
        $this->theme = $theme;
        $this->key = $key;
        $this->path = $path;
        $this->local = $local;
    }

    public function setLocal($local) {
        $this->local = $local;
        return $this;
    }

    public function __toString() {
        return SingletonThemeLocalization::Instance()->get($this->theme, $this->key, $this->local, $this->path);
    }
} 

class SingletonThemeLocalization {

    private static $_instance = null;

    private $localizations;

    private function __construct() {  
        $this->localizations = [];
    }

    private function load($theme, $path, $local) {
        if (!isset($this->localizations[$theme])) {
            $this->localizations[$theme] = [];

            if (!isset($this->localizations[$theme][$local])) {
                $this->localizations[$theme][$local] = json_decode(file_get_contents($path."/$local.json")) ?? [];
            }
        }

        return $this->localizations[$theme][$local];
    }

    public function get($theme, $key, $local = 'fr_FR', $path = '') {
        return $this->load($theme, $path, $local)->$key ?? $key;
    }

    public function set($theme, $key, $value, $local = 'fr_FR', $path = '') {
        $this->load($theme, $path, $local);
        $this->localizations[$theme][$local]->$key = $value;
        return $this;
    }

    public static function Instance() {
        if (self::$_instance === null) self::$_instance = new SingletonThemeLocalization();

        return self::$_instance;
    }

}