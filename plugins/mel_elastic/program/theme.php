<?php
/**
 * Contient les informations relatif à un thème
 */
class Theme {
    /**
     * Les extensions autorisés. Si, dans l'icône, pas d'extension est définie, on va chercher parmis ceux-là.
     */
    public const EXT = ['svg', 'png', 'jpeg', 'jpg', 'gif'];
    /**
     * Extension des fichiers de style
     */
    public const EXT_STYLE = '.css';
    /**
     * Chemin du dossier "thème"
     */
    public const THEME_PATH = '/themes';
    /**
     * Chemin du thème
     *
     * @var string
     */
    public $path; 
    /**
     * Données du thème parent 
     *
     * @var ParentTheme
     */
    public $parent; 
    /**
     * Chemin de l'icône
     *
     * @var string
     */
    public $icon; 
    /**
     * Thème actif ou non
     *
     * @var boolean
     */
    public $enabled;
    /**
     * Thème actif affiché ou non
     *
     * @var boolean
     */
    public $showed;
    /**
     * Id du thème (unique)
     *
     * @var string
     */
    public $id; 
    /**
     * Nom du dossier
     *
     * @var string
     */
    public $name; 
    /**
     * Texte qui sera affiché
     *
     * @var ThemeLocalization
     */
    private $displayed; 
    /**
     * Description qui sera affiché
     *
     * @var ThemeLocalization
     */
    private $desc;
    /**
     * Liste des fichiers css à charger
     *
     * @var string[]
     */
    public $styles; 
    /**
     * Classe qui sera mise dans la balise html
     *
     * @var string
     */
    public $class;

    /**
     * Le thème possède son propre mode sombre ou non
     *
     * @var bool
     */
    public $custom_dark_mode;

    /**
     * L'ordre du thème
     *
     * @var number
     */
    public $order;

    /**
     * Si le thème doit s'afficher temporairement ou non (si null)
     *
     * @var ThemeSaison
     */
    public $saison;

    /**
     * Undocumented variable
     *
     * @var string
     */
    public $animation_class;

    /**
     * Undocumented variable
     *
     * @var boolean
     */
    public $animation_enabled_by_default;

    /**
     * Constructeur de la classe
     *
     * @param string $path Chemin du dossier du thème
     */
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
        $this->showed = $json->showed ?? true;

        if (!isset($json->class)) $this->class = 'theme-'.$this->id;
        else $this->class = $json->class;

        $this->displayed = new ThemeLocalization($this->id, $json->display ?? $this->id, self::SkinPath().self::THEME_PATH.'/'.$this->name.'/localization');
        $this->desc = new ThemeLocalization($this->id, $json->description ?? '', self::SkinPath().self::THEME_PATH.'/'.$this->name.'/localization');
        $this->custom_dark_mode = $json->custom_dark_mode ?? false;
        $this->order = $json->order;
        $this->saison = $json->saison;
        $this->animation_class = $json->animation_class;
        $this->animation_enabled_by_default = $json->animation_enabled_by_default;

        if (isset($this->saison)) $this->saison = new ThemeSaison($this->saison);
        else $this->saison = new ThemeSaisonForced();
    }

    /**
     * Accesseur
     *
     * @param string $property Propriété appelé, uniquement "displayed" ou "desc"
     * @return any
     */
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

    /**
     * Assigne un parent à la classe
     *
     * @param ParentTheme $parent Référence du parent
     * @return Theme Chaîne
     */
    public function setParent($parent) {
        $this->parent->set($parent);
        return $this;
    }

    /**
     * Renvoie un objet qui contient les données de la classe.
     *
     * @return array
     */
    public function prepareToSave() {
        $forSave = [];
        $array = ['id', 'icon', 'displayed', 'desc', 'class', 'parent', 'custom_dark_mode', 'order', 'showed', 'saison', 'animation_class', 'animation_enabled_by_default'];

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

                case 'saison':
                    $saison = $this->saison->prepareToSave();
                    if ($saison !== null){
                        $forSave[$value] = $saison;
                    }
                    break;

                case 'animation_class':
                case 'animation_enabled_by_default':
                    if (isset($this->$value)) $forSave[$value] = $this->$value;
                    else continue;
                
                default:
                    $forSave[$value] = $this->$value;
                    break;
            }
        }

        return $forSave;
    }

    /**
     * Récupère le chemin de fichier "mel_elastic"
     *
     * @return string
     */
    public static function SkinPath()
    {
        return mel_elastic::SkinPath();
    }

    /**
     * Créer un générateur pour récupérer le chemin des fichiers de css.
     *
     * @param array|string $styles Fichier ou fichiers css ou dossiers
     * @param string $themeFolder
     * @return generator
     */
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

    /**
     * Vérifie si un fichier contient ".css"
     *
     * @param string $style 
     * @return boolean
     */
    protected static function loaded_style_is_folder($style) {
        return strpos($style, self::EXT_STYLE) !== false;
    }

    /**
     * Créer un générateur pour récupérer le chemin des fichiers de css depuis les dossiers.
     *
     * @param string $folder
     * @param string $themeFolder
     * @return generator
     */
    protected static function generate_style_folder($folder, $themeFolder) {
        $files = scandir(self::SkinPath().self::THEME_PATH."/$themeFolder/$folder");

        foreach ($files as $fof) {
            if (self::loaded_style_is_folder($fof)){
                yield self::THEME_PATH."/$themeFolder/$folder/$fof";
            }
        }
    }

}

/**
 * Données des thèmes parents
 */
class ParentTheme {
    /**
     * Id du thème parent
     *
     * @var int
     */
    public $id;
    /**
     * Données du thème parent
     *
     * @var ParentTheme
     */
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

/**
 * Gère la localisation des thèmes
 */
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

/**
 * Gère ThemeLocalization 
 */
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

class ThemeSaison {
    private $start;
    private $end;

    public function __construct($date) {  
         $date = explode('-', $date);  
        
        $this->start = $this->_date($date[0]);
        $this->end = $this->_date($date[1]);

        if ($this->end <= $this->start) {
            $this->end = $this->end->add(new DateInterval("P1Y"));
        }
    }

    public function can_be_shown() {
        $now = new DateTime();

        return $this->start <= $now && $now < $this->end;
    }

    /**
     * Renvoie un objet qui contient les données de la classe.
     *
     * @return array
     */
    public function prepareToSave() {
        $forSave = [
            'start' => $this->start->format('d/m'),
            'end' => $this->end->format('d/m')
        ];

        return $forSave;
    }

    private function _date($init_date) {
        $date = explode('/', $init_date);

        if (count($date) < 3) $date[] = date("Y");

        return DateTime::createFromFormat('d/m/Y H:i:s', implode('/', $date).' 00:00:00');
    }
}

class ThemeSaisonForced extends ThemeSaison {
    public function __construct() {  

    }


    public function can_be_shown() {
        return true;
    }

    public function prepareToSave() {
        return null;
    }
}

class DefaultTheme extends Theme {
    public $default_theme;

    public function __construct($path, $default_theme) {
        parent::__construct($path);

        $json = json_decode(file_get_contents($path.'/theme.json'));

        $this->default_theme = $json->default_theme ?? $default_theme;
    }

    public function getDefaultTheme() {
        return $this->default_theme;
    }

        /**
     * Renvoie un objet qui contient les données de la classe.
     *
     * @return array
     */
    public function prepareToSave() {
        $forSave = parent::prepareToSave();
        $forSave['default_theme'] = $this->default_theme;

        return $forSave;
    }
}