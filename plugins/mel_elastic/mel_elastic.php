<?php
include_once __DIR__.'/../bnum/bnum_plugin.php';

/**
 * Plugin Mel Elastic
 *
 * Ce plugin applique les fichiers CSS spécifiques au skin "mel_elastic" et gère les thèmes, animations, et autres fonctionnalités liées à l'interface utilisateur.
 *
 * @package Roundcube-plugins-Mel
 */
class mel_elastic extends bnum_plugin
{
    /**
     * Thème par défaut.
     *
     * @var string
     */
    public const DEFAULT_THEME = 'default';

    /**
     * Tâches associées au plugin.
     *
     * @var string
     */
    public $tasks = '.*';

    /**
     * Instance de rcmail.
     *
     * @var rcmail
     */
    private $rc;

    /**
     * Chemin du skin.
     *
     * @var string
     */
    private $skinPath;

    /**
     * Liste des dossiers contenant les fichiers CSS à charger.
     *
     * @var array
     */
    private $cssFolders = ["styles"];

    /**
     * Liste des fichiers CSS à charger.
     *
     * @var array
     */
    private $css = ["icofont.css", "jquery.datetimepicker.min.css", "mel-icons.css", "material-symbols.css", "design-system/css/global.css", "design-system/css/parts/page-columns.css"];

    /**
     * Thème actuellement chargé.
     *
     * @var string
     */
    private $loaded_theme;

    /**
     * Liste des thèmes disponibles.
     *
     * @var array
     */
    private $themes;

    /**
     * Thème par défaut (instance de DefaultTheme).
     *
     * @var DefaultTheme
     */
    private static $default_theme;

    /**
     * Initialise le plugin.
     *
     * Charge les configurations, enregistre les hooks et actions, et inclut les fichiers nécessaires.
     *
     * @return void
     */
    function init()
    {
        include_once __DIR__.'/classes/html_table_bnum.php';
        include_once __DIR__.'/program/backgrounds.php';
        $this->skinPath = self::SkinPath();
        $this->rc = rcmail::get_instance();
        if ($this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->load_config();
            $this->add_hook('ready', array($this, 'set_theme'));
            $this->add_hook('send_page', array($this, 'hook_render_page'));
            $this->register_action('update_theme', array($this, 'update_theme'));
            $this->register_action('update_theme_picture', array($this, 'update_theme_picture'));
            $this->register_action('update_custom_picture', array($this, 'update_custom_picture'));
            $this->register_action('toggle_animations', array($this, 'toggleAnimations'));
            $this->load_css();
            $this->include_script('../../skins/mel_elastic/dependencies/linq.js');
            $this->include_script('../../skins/mel_elastic/dependencies/poppers.js');
            $this->include_script('../../skins/mel_elastic/ui.js');
            $this->include_module('elastic_ui.js', '../../skins/mel_elastic', 'foot');
            // $this->include_component('ds-module-bnum.js', '../../skins/mel_elastic/design-system', 'mel_elastic');
            $this->include_script('../../skins/mel_elastic/jquery.datetimepicker.full.min.js');
            $this->rc->output->set_env('mel_themes', $this->mep_themes());
            $this->rc->output->set_env('mel_themes_pictures', Background::from_path($this->skinPath.'/images/backgrounds/backgrounds.json'));
            $this->load_folders();
            $this->add_texts('localization/', true);
            $this->rc->output->set_env("button_add", 
                '<div class="mel-add" onclick="¤¤¤">
                    <span style="position:relative">'.$this->gettext('add').'<span class="icofont-plus-circle plus"></span></span>
                </div>'
            );
            $this->rc->output->set_env('animation_enabled', $this->rc->config->get('mel_metapage_animation_state', null));     
        }


    }

    /**
     * Charge les fichiers CSS définis dans la propriété $css.
     *
     * @return void
     */
    function load_css()
    {
        $size = count($this->css);
        for ($i=0; $i < $size; ++$i) { 
            $this->include_stylesheet('/'.$this->css[$i]);
        }
    }

    /**
     * Charge les fichiers CSS présents dans les dossiers définis dans $cssFolders.
     *
     * @return void
     */
    function load_folders()
    {
        foreach ($this->cssFolders as $id => $folder) {
            $tmp = scandir($this->skinPath."/".$folder);
            if ($tmp !== false)
            {
                $size = count($tmp);
                for ($i=0; $i < $size; $i++) { 
                    if (strpos($tmp[$i],".css") !== false)
                        $this->include_stylesheet('/'.$folder."/".$tmp[$i]);
                }
            }
        }
    }

    /**
     * Modifie la liste des messages pour inverser les champs "from" et "subject".
     *
     * @param array $p Liste des messages.
     * @return array Liste des messages modifiée.
     */
    public function mail_messages_list($p)
    {

        $count = count($p["messages"]);
        for ($i=0; $i < $count; ++$i) { 
            $tmp = $p["messages"][$i]->from;
            $p["messages"][$i]->from = $p["messages"][$i]->subject;
            $p["messages"][$i]->subject = $tmp;
        }

        return $p;
    }

    /**
     * Charge les thèmes disponibles depuis le dossier des thèmes.
     *
     * @return array Liste des thèmes disponibles.
     */
    private function load_themes()
    {
        if (!isset($this->themes))
        {
            include_once __DIR__.'/program/theme.php';
            $theme_folder = $this->skinPath.'/themes/';
            $themes = [self::DEFAULT_THEME => new DefaultTheme($theme_folder.self::DEFAULT_THEME, self::DEFAULT_THEME)];
            $folders = scandir($theme_folder);
            
            $currentTheme = null;
            foreach ($folders as $id => $folder) {
                if ($folder !== '.' && $folder !== '..' && is_dir($theme_folder.$folder) && $folder !== self::DEFAULT_THEME)
                {
                    $currentTheme = new Theme($theme_folder.$folder);

                    if (!$currentTheme->enabled) continue;

                    $themes[$currentTheme->id] = $currentTheme;
                }
            }
            $this->themes = $themes;
        }


        return $this->themes;
    }

    /**
     * Prépare les thèmes pour l'environnement utilisateur.
     *
     * @return array Liste des thèmes prêts à être utilisés.
     */
    private function mep_themes() {
        $themes = $this->load_themes();
        $mep = [];

        foreach ($themes as $key => $value) {
            if ($value->saison->can_be_shown()) {
                $mep[$key] = $value->prepareToSave();
            }
        }

        return $mep;
    }

    /**
     * Décharge le thème actuellement chargé.
     *
     * @return $this
     */
    private function unload_current_theme()
    {
        unset($this->loaded_theme);
        return $this;
    }

    /**
     * Récupère le thème actuellement sélectionné.
     *
     * @return string Identifiant du thème actuel.
     */
    public function get_current_theme()
    {
        if (!isset($this->loaded_theme))
        {
            $this->load_config();
            $this->loaded_theme = $this->rc->config->get('mel_elastic.current', self::DEFAULT_THEME);
        }

        return $this->loaded_theme;
    }

    /**
     * Vérifie si le thème actuel est le thème par défaut.
     *
     * @return bool True si le thème actuel est le thème par défaut, sinon false.
     */
    public function is_default_theme()
    {
        return $this->get_current_theme() === self::DEFAULT_THEME;
    }

    /**
     * Définit le thème à utiliser et charge les styles associés.
     *
     * @param mixed $useless Paramètre inutilisé.
     * @return mixed Paramètre inutilisé.
     */
    public function set_theme($useless)
    {
        // Charge tous les thèmes disponibles
        $themes = $this->load_themes();

        // Si le thème actuel n'est pas le thème par défaut
        if (!$this->is_default_theme())
        {
            $theme = $this->get_current_theme();
            // Vérifie si le thème existe dans la liste des thèmes chargés
            if ($themes[$theme] !== null) {
                // Définit le thème actuel dans l'environnement utilisateur
                $this->rc->output->set_env('current_theme', $this->get_current_theme());
            }
        }

        // Récupère l'image de fond associée au thème actuel
        $picture = $this->rc->config->get('mel_elastic.picture.current', null);
        if (isset($picture)) {
            // Définit l'image de fond sélectionnée dans l'environnement utilisateur
            $this->rc->output->set_env('theme_selected_picture', $picture);
        }

        // Parcourt tous les thèmes pour inclure leurs fichiers CSS
        foreach ($themes as $key => $value) {
            foreach ($value->styles as $file) {
                // Inclut chaque fichier CSS associé au thème
                $this->include_stylesheet($file);
            }
        }

        return $useless;
    }

    /**
     * Hook pour modifier le contenu de la page avant son envoi.
     * 
     * C'est ici que l'on va ajouter les composants web.
     *
     * @param array $args Arguments contenant le contenu de la page.
     * @return array Arguments modifiés.
     */
    public function hook_render_page($args) {
        // Exécute un hook personnalisé avant l'envoi de la page
        $hook = $this->exec_hook('before_send_page', ['content' => $args['content'], 'plugin' => $this]);

        // Si le hook a modifié le contenu, on met à jour la page
        if ($hook !== null) {
            $args['content'] = $hook['content'] ?? $args['content'];
        }

        // Inclut le fichier contenant la gestion des composants web
        include_once __DIR__.'/program/webcomponents.php';

        // Récupère les composants personnalisés à partir du contenu de la page
        $webcomponents = WebComponnents::Instance()->getCustomComponents($args['content']);

        // Ajoute les composants au contenu de la page
        if ($webcomponents) {
            $args['content'] = WebComponnents::Instance()->tryIncludes($webcomponents, $args['content']);
        } else {
            // Si aucun composant n'est trouvé, remplace le placeholder par une chaîne vide
            $args['content'] = str_replace('<<elastic:modules/>>', '', $args['content']);
        }

        return $args;
    }

    /**
     * Met à jour le thème sélectionné par l'utilisateur.
     *
     * @return void
     */
    public function update_theme()
    {
        // Récupère l'identifiant du thème depuis les données POST
        $theme = rcube_utils::get_input_value('_t', rcube_utils::INPUT_POST);

        // Sauvegarde le thème sélectionné dans les préférences utilisateur
        $this->rc->user->save_prefs(array('mel_elastic.current' => $theme));

        // Décharge le thème actuel pour forcer son rechargement
        $this->unload_current_theme();

        // Retourne une réponse simple pour indiquer le succès
        echo 'ok';
        exit;
    }

    /**
     * Met à jour l'image de fond du thème sélectionné.
     *
     * @return void
     */
    public function update_theme_picture(){
        $picid = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $this->rc->user->save_prefs(array('mel_elastic.picture.current' => $picid));
        echo 'ok';
        exit;
    }

    /**
     * Met à jour une image personnalisée pour le thème.
     *
     * @return void
     */
    public function update_custom_picture(){
        $datas = rcube_utils::get_input_value('_datas', rcube_utils::INPUT_POST);
        $pref = rcube_utils::get_input_value('_prefid', rcube_utils::INPUT_POST);
        $this->rc->user->save_prefs(array($pref => $datas));
        echo 'ok';
        exit;
    }

    /**
     * Active ou désactive les animations dans l'interface utilisateur.
     *
     * @return void
     */
    public function toggleAnimations() {
        $config = !$this->rc->config->get('mel_metapage_animation_state', $this->mep_themes()[$this->get_current_theme()]["animation_enabled_by_default"]);
        $this->rc->user->save_prefs(array('mel_metapage_animation_state' => $config));
    
        echo json_encode($config);
        exit;
    }

    /**
     * Récupère le chemin du skin "mel_elastic".
     *
     * @return string Chemin du skin.
     */
    public static function SkinPath() {
        return getcwd()."/skins/mel_elastic";
    }

    /**
     * Récupère le thème par défaut.
     *
     * @return DefaultTheme Instance du thème par défaut.
     */
    public static function get_default_theme(){
        if (!isset(self::$default_theme)) {
            $theme = new DefaultTheme($theme_folder.self::DEFAULT_THEME, self::DEFAULT_THEME);
            self::$default_theme = $theme->getDefaultTheme();
        }

        return self::$default_theme;
    }

    /**
     * Indique que le footer doit être caché.
     *
     * Envoie une variable d'environnement `ui_ignore_footer=true` au JavaScript.
     *
     * @return void
     */
    public static function IgnoreFooter() {
        rcmail::get_instance()->output->set_env('ui_ignore_footer', true);
    }
}