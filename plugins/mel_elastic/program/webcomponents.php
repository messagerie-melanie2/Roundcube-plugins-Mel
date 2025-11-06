<?php

/**
 * Classe représentant les données d'un composant Web.
 */
class WebComponentData
{
    /**
     * Tag HTML du composant.
     * 
     * @var string
     */
    public $tag;

    /**
     * Nom du fichier du composant.
     * 
     * @var string
     */
    public $name;

    /**
     * Chemin du fichier du composant.
     * 
     * @var string
     */
    public $path;

    /**
     * Nom du plugin auquel appartient le composant.
     * 
     * @var string
     */
    public $plugin;

    /**
     * Constructeur de la classe WebComponentData.
     * 
     * @param string $tag Tag HTML du composant.
     * @param string $name Nom du fichier du composant.
     * @param string $path Chemin du fichier du composant.
     * @param string $plugin Nom du plugin.
     */
    public function __construct(string $tag, string $name, string $path = (bnum_plugin::BASE_MODULE_PATH . 'html/JsHtml/CustomAttributes'), string $plugin = 'mel_elastic')
    {
        $this->name = $name;
        $this->path = $path;
        $this->plugin = $plugin;
        $this->tag = $tag;
    }

    /**
     * Crée une instance de WebComponentData.
     * 
     * @param string $tag Tag HTML du composant.
     * @param string $name Nom du fichier du composant.
     * @param string $path Chemin du fichier du composant.
     * @param string $plugin Nom du plugin.
     * 
     * @return WebComponentData
     */
    static function Create(string $tag, string $name, string $path = (bnum_plugin::BASE_MODULE_PATH . 'html/JsHtml/CustomAttributes'), string $plugin = 'mel_elastic'): WebComponentData
    {
        return new WebComponentData($tag, $name, $path, $plugin);
    }
}

/**
 * Classe WebComponnents
 * Fournit des méthodes pour inclure et gérer des composants Web spécifiques.
 */
class WebComponnents
{

    /**
     * Instance du plugin mel_metapage.
     * 
     * @var rcube_plugin
     */
    private $plugin;

    /**
     * Liste des composants Web disponibles.
     * 
     * @var array
     */
    private $webcomponents = [];

    /**
     * Instance unique de la classe WebComponnents (singleton).
     * 
     * @var WebComponnents
     */
    private static $_instance;

    /**
     * Constructeur privé pour le singleton.
     */
    private function __construct()
    {
        $this->plugin = rcmail::get_instance()->plugins->get_plugin('mel_metapage');
        $this->webcomponents = array_reduce(self::Get(), function ($carry, $element) {
            $carry[$element->tag] = $element;
            return $carry;
        }, []);
    }

    /**
     * Inclut un composant Web.
     *
     * @param string $name Nom du composant.
     * @param string $path Chemin du composant.
     * @param string $plugin Nom du plugin.
     * 
     * @return mixed
     */
    private function _include_component($name, $path = (bnum_plugin::BASE_MODULE_PATH . 'html/JsHtml/CustomAttributes'), $plugin = 'mel_metapage')
    {
        return $this->plugin->____METHODS____('include_component', $name, $path, $plugin);
    }

    /**
     * Récupère les composants personnalisés présents dans un contenu HTML.
     * 
     * @param string $html Contenu HTML à analyser.
     * 
     * @return array Liste des tags de composants trouvés.
     */
    public function getCustomComponents(string $html)
    {
        // Générer la regex à partir des clés de $this->webcomponents
        $regex = '(' . implode('|', array_keys($this->webcomponents)) . ')';

        // Trouver toutes les correspondances dans $html
        preg_match_all($regex, $html, $matches);

        // Récupérer les clés uniques trouvées
        $foundKeys = array_unique($matches[0]);

        // Retourner les clés trouvées
        return $foundKeys;
    }

    /**
     * Générateur pour récupérer les composants qui n'existent pas encore dans le contenu HTML.
     * 
     * @param array $keys Liste des tags de composants à vérifier.
     * @param string $html Contenu HTML à analyser.
     * 
     * @return Generator Générateur des composants manquants.
     */
    public function GetAlreadyExistsComponentsGenerator(array $keys, string $html): Generator
    {
        if ($keys) {
            // Regex pour trouver les balises <script> avec des modules déjà inclus
            $regex = '#<script\s+src=(["\'])[\w\d\/\.\?=]+\1\s+type=\1module\1\s*>#';

            // Trouver toutes les correspondances dans le contenu HTML
            preg_match_all($regex, $html, $matches);

            // Si des correspondances sont trouvées, les convertir en une chaîne pour la comparaison
            if (isset($matches) && count($matches) > 0) $matches = $matches[0];

            if (isset($matches) && count($matches) > 0) {
                $matches = implode('|', $matches);

                // Filtrer les composants Web définis dans $keys
                // Utilisation de mel_helper::Enumerable pour manipuler les collections
                $regex = mel_helper::Enumerable($this->webcomponents)->where(function ($key, $value) use ($keys) {
                    return in_array($key, $keys);
                })->select(function ($key, $value) {
                    return $value->name;
                })->removeTwins(function ($_, $name) {
                    return $name;
                })->join('|');

                // Échapper les points dans les noms pour éviter des erreurs dans la regex
                $regex = "#" . str_replace('.', '\.', $regex) . "#";

                // Générer les composants manquants
                yield from mel_helper::Enumerable($keys)->where(function ($_, $keyTag) use ($regex, $matches) {
                    return !preg_match($regex, $matches, $_);
                })->select(function ($_, $keyTag) {
                    return $this->webcomponents[$keyTag];
                })->removeTwins(function ($_, $webcomponent) {
                    return $webcomponent->name;
                });
            }
        }
    }

    /**
     * Tente d'inclure les composants manquants dans le contenu HTML.
     * 
     * @param array $keys Liste des tags de composants à inclure.
     * @param string $html Contenu HTML à modifier.
     * 
     * @return string Contenu HTML modifié avec les inclusions nécessaires.
     */
    public function tryIncludes(array $keys, string $html): string
    {
        $scripts = [];
        foreach ($this->GetAlreadyExistsComponentsGenerator($keys, $html) as $component) {
            // Ajouter un script pour chaque composant manquant
            if (!in_array($component->name, $scripts)) $scripts[] = "<script src=\"plugins/$component->plugin$component->path/$component->name\" type=\"module\"></script>";
        }

        // Remplacer le placeholder dans le HTML par les scripts générés
        return str_replace('<<elastic:modules/>>', implode('', $scripts), $html);
    }

    /**
     * Inclut le composant de base.
     * 
     * @deprecated version 25.4
     */
    public function Base()
    {
        $this->_include_component('js_html_base_web_elements.js');
    }

    /**
     * Inclut le composant de tabulation.
     * 
     * @deprecated version 25.4
     */
    public function Tabs()
    {
        $this->_include_component('tab_web_element.js');
    }

    /**
     * Inclut le composant de bouton pressé.
     * 
     * @deprecated version 25.4
     */
    public function PressedButton()
    {
        $this->_include_component('pressed_button_web_element.js');
    }

    /**
     * Inclut le conteneur de défilement infini.
     * 
     * @deprecated version 25.4
     */
    public function InfiniteScrollContainer()
    {
        $this->_include_component('infinite_scroll_container.js');
    }

    /**
     * Inclut le composant d'avatar.
     * 
     * @deprecated version 25.4
     */
    public function Avatar()
    {
        $this->_include_component('avatar.js');
    }

    /**
     * Inclut la barre de recherche.
     * 
     * @deprecated version 25.4
     */
    public function SearchBar()
    {
        $this->_include_component('searchbar.js');
    }

    /**
     * @deprecated 25.2
     * Inclut le bouton Mel.
     */
    public function MelButton()
    {
        $this->_include_component('HTMLMelButton.js');
    }

    /**
     * Inclut le bouton Bnum.
     * 
     * @deprecated version 25.4
     */
    public function BnumButton()
    {
        $this->_include_component('HTMLBnumButton.js', 'js/lib/html/JsHtml/CustomAttributes/button');
    }

    /**
     * Méthode générique pour inclure des composants.
     *
     * @param string $what Type de composant à inclure.
     * @param mixed ...$args Arguments nécessaires pour inclure le composant.
     * 
     * @return mixed
     */
    public function ____METHODS____($what, ...$args)
    {
        switch ($what) {
            case '_include_component':
                $name = $args[0];
                $path = $args[1] ?? bnum_plugin::BASE_MODULE_PATH . 'html/JsHtml/CustomAttributes/';
                $plugin = $args[2] ?? 'mel_metapage';
                return $this->_include_component($name, $path, $plugin);

            default:
                break;
        }
    }

    /**
     * Récupère la liste des composants Web disponibles.
     * 
     * @return array Liste des composants Web.
     */
    public static function Get(): array
    {
        // Configuration des composants Web
        $components = [
            ['bnum-icon', 'js_html_base_web_elements.js'],
            ['bnum-shadow-icon', 'js_html_base_web_elements.js'],
            ['bnum-screen-reader', 'js_html_base_web_elements.js'],
            ['bnum-voice', 'js_html_base_web_elements.js'],
            ['bnum-separate', 'js_html_base_web_elements.js'],
            ['bnum-flex-container', 'js_html_base_web_elements.js'],
            ['bnum-centered-flex-container', 'js_html_base_web_elements.js'],
            ['bnum-placeholder', 'js_html_base_web_elements.js'],
            ['bnum-button', 'HTMLBnumButton.js', '/js/lib/html/JsHtml/CustomAttributes/button'],
            ['primary-button', 'HTMLBnumButton.js', '/js/lib/html/JsHtml/CustomAttributes/button'],
            ['secondary-button', 'HTMLBnumButton.js', '/js/lib/html/JsHtml/CustomAttributes/button'],
            ['error-button', 'HTMLBnumButton.js', '/js/lib/html/JsHtml/CustomAttributes/button'],
            ['bnum-tabs', 'tab_web_element.js'],
            ['bnum-tab-container', 'tab_web_element.js'],
            ['bnum-tab-receiver', 'tab_web_element.js'],
            ['bnum-pressed-button', 'pressed_button_web_element.js'],
            ['bnum-favorite-button', 'pressed_button_web_element.js'],
            ['bnum-infinite-scroll-container', 'infinite_scroll_container.js'],
            ['bnum-avatar', 'avatar.js'],
            ['bnum-searchbar', 'searchbar.js'],
            ['bnum-helper', 'HTMLBnumHelperElement.js', '/js/lib/webcomponents', 'mel_elastic'],
            ['bnum-img', 'HTMLColorModePicture.js', '/js/lib/webcomponents', 'mel_elastic']
        ];

        // Génération des instances de WebComponentData
        return array_map(function ($component) {
            return WebComponentData::Create(
                $component[0], // Tag HTML
                $component[1], // Nom du fichier
                $component[2] ?? (bnum_plugin::BASE_MODULE_PATH . 'html/JsHtml/CustomAttributes'), // Chemin (par défaut)
                $component[3] ?? 'mel_metapage' // Plugin (par défaut)
            );
        }, $components);
    }

    /**
     * Retourne l'instance unique de la classe WebComponnents.
     *
     * @return WebComponnents Instance unique.
     */
    public static function Instance()
    {
        if (!isset(self::$_instance)) self::$_instance = new WebComponnents();

        return self::$_instance;
    }
}
