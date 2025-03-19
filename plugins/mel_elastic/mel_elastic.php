<?php
/**
 * Plugin Mel Elastic
 *
 * Apply plugins css for mel_elastic skin
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_elastic extends rcube_plugin
{
    public const DEFAULT_THEME = 'default';

    public $tasks = '.*';
    private $rc;
    /**
     * Chemin du skin
     */
    private $skinPath;
    /**
     * Liste des dossiers où il faut charger tout les fichiers css.
     */
    private $cssFolders = ["styles"];
    /**
     * Liste des fichiers css à charger.
     */
    private $css = ["icofont.css", "jquery.datetimepicker.min.css", "mel-icons.css", "material-symbols.css"];

    private $loaded_theme;
    private $themes;
    private static $default_theme;

    function init()
    {
        include_once __DIR__.'/classes/html_table_bnum.php';
        include_once __DIR__.'/program/backgrounds.php';
        $this->skinPath = self::SkinPath();
        $this->rc = rcmail::get_instance();
        if ($this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->load_config();
            // $this->add_hook('preferences_list', array($this, 'prefs_list'));
            // $this->add_hook('preferences_save',     array($this, 'prefs_save'));
            $this->add_hook('ready', array($this, 'set_theme'));
            $this->register_action('update_theme', array($this, 'update_theme'));
            $this->register_action('update_theme_picture', array($this, 'update_theme_picture'));
            $this->register_action('update_custom_picture', array($this, 'update_custom_picture'));
            $this->register_action('toggle_animations', array($this, 'toggleAnimations'));
            $this->load_css();
            //$this->include_script('../../skins/elastic/ui.js');
            $this->include_script('../../skins/mel_elastic/dependencies/linq.js');
            $this->include_script('../../skins/mel_elastic/dependencies/poppers.js');
            // $this->include_script('js/lib/html.js');
            $this->include_script('../../skins/mel_elastic/ui.js');
            $this->include_script('../../skins/mel_elastic/jquery.datetimepicker.full.min.js');
            $this->rc->output->set_env('mel_themes', $this->mep_themes());
            $this->rc->output->set_env('mel_themes_pictures', Background::from_path($this->skinPath.'/images/backgrounds/backgrounds.json'));
            $this->load_folders();
            $this->add_texts('localization/', true);
            //$this->add_hook('messages_list', [$this, 'mail_messages_list']);
            $this->rc->output->set_env("button_add", 
                '<div class="mel-add" onclick="¤¤¤">
                    <span style="position:relative">'.$this->gettext('add').'<span class="icofont-plus-circle plus"></span></span>
                </div>'
            );
            $this->rc->output->set_env('animation_enabled', $this->rc->config->get('mel_metapage_animation_state', null));     
        }


    }



    function load_css()
    {
        $size = count($this->css);
        for ($i=0; $i < $size; ++$i) { 
            $this->include_stylesheet('/'.$this->css[$i]);
        }

        //$this->load_css_font();
    }

    function load_css_font()
    {
        //$this->rc->config->get('custom-font-size', "sm")
        // $this->include_stylesheet("/fonts/fontsize.css");
        // $this->rc->output->set_env('font-size', $this->rc->config->get('custom-font-size', "lg"));
    }

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

    private function unload_current_theme()
    {
        unset($this->loaded_theme);
        return $this;
    }


    public function get_current_theme()
    {
        if (!isset($this->loaded_theme))
        {
            $this->load_config();
            $this->loaded_theme = $this->rc->config->get('mel_elastic.current', self::DEFAULT_THEME);
        }

        return $this->loaded_theme;
    }

    public function is_default_theme()
    {
        return $this->get_current_theme() === self::DEFAULT_THEME;
    }

    public function set_theme($useless)
    {
        $themes = $this->load_themes();
        if (!$this->is_default_theme())
        {
            $theme = $this->get_current_theme();
            if ($themes[$theme] !== null) $this->rc->output->set_env('current_theme', $this->get_current_theme());
        }

        $picture = $this->rc->config->get('mel_elastic.picture.current', null);
        if (isset($picture)) $this->rc->output->set_env('theme_selected_picture', $picture);

        foreach ($themes as $key => $value) {
            foreach ($value->styles as $file) {
                $this->include_stylesheet($file);
            }
        }

        return $useless;
    }

    public function update_theme()
    {
        $theme = rcube_utils::get_input_value('_t', rcube_utils::INPUT_POST);
        $this->rc->user->save_prefs(array('mel_elastic.current' => $theme));
        $this->unload_current_theme();
        echo 'ok';
        exit;
    }

    public function update_theme_picture(){
        $picid = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
        $this->rc->user->save_prefs(array('mel_elastic.picture.current' => $picid));
        echo 'ok';
        exit;
    }

    public function update_custom_picture(){
        $datas = rcube_utils::get_input_value('_datas', rcube_utils::INPUT_POST);
        $pref = rcube_utils::get_input_value('_prefid', rcube_utils::INPUT_POST);
        $this->rc->user->save_prefs(array($pref => $datas));
        echo 'ok';
        exit;
    }

    public function toggleAnimations() {
        $config = !$this->rc->config->get('mel_metapage_animation_state', $this->mep_themes()[$this->get_current_theme()]["animation_enabled_by_default"]);
        $this->rc->user->save_prefs(array('mel_metapage_animation_state' => $config));
    
        echo json_encode($config);
        exit;
    }

    public static function SkinPath() {
        return getcwd()."/skins/mel_elastic";
    }

    public static function get_default_theme(){
        if (!isset(self::$default_theme)) {
            $theme = new DefaultTheme($theme_folder.self::DEFAULT_THEME, self::DEFAULT_THEME);
            self::$default_theme = $theme->getDefaultTheme();
        }

        return self::$default_theme;
    }

    /**
     * Indique au plugin que le footer doit être caché
     * 
     * Envoie une variable d'environement `ui_ignore_footer=true` au javascript qui sera utilisé par `MEL_ELASTIC_UI`
     */
    public static function IgnoreFooter() {
        rcmail::get_instance()->output->set_env('ui_ignore_footer', true);
    }
}