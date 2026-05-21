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
    private $css = ["icofont.css", "jquery.datetimepicker.min.css", "mel-icons.css", "material-symbols.css", "design-system/css/global.css", "design-system/css/parts/page-columns.css", "styles/parts/mails.css", "styles/parts/bridge.css"];

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
             $this->include_module('mel_elastic_ui.js', '../../skins/mel_elastic', 'foot');
            $this->include_component('bnum-design-system.js', '../../skins/mel_elastic', 'mel_elastic');
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

            // if ($this->get_current_task() === 'bnum')
            $this->add_handler('defaultpagetitle', [$this, 'handler_default_page_title']);

            if ($this->rc->task == 'mail' && $this->is_index_action() ) {
                $this->add_handler('mailboxlist', [$this, 'my_folder_list_handler']);
            }

            if ($this->rc->task === 'bnum') {
                $this->include_stylesheet('/design-system/css/parts/main-page.css');
            }
        }


    }

    public function my_folder_list_handler($attrib) 
    {
        $rcmail = rcmail::get_instance();
        $storage = $rcmail->get_storage();
        
        // 1. INITIALISATION DES DONNÉES (Indispensable car absent de ton code)
        $mbox_name = $storage->get_folder();
        $delimiter = $storage->get_hierarchy_delimiter();
        $a_mailboxes = [];
        
        // Récupération de la liste des dossiers abonnés
        $folder_filter = $attrib['folder_filter'] ?? null;
        $a_folders = $storage->list_folders_subscribed('', '*', $folder_filter);

        foreach ($a_folders as $folder) {
            // On utilise la méthode de Roundcube pour structurer l'arbre en tableau
            mel_helper::build_folder_tree($a_mailboxes, $folder, $delimiter);//self::build_folder_tree($a_mailboxes, $folder, $delimiter);
        }

        $hook = $rcmail->plugins->exec_hook('render_mailboxlist', [
                'list'      => $a_mailboxes,
                'delimiter' => $delimiter,
                'type'      => null,
                'attribs'   => $attrib,
        ]);

        $a_mailboxes = $hook['list'];
        $attrib      = $hook['attribs'];

        // 2. GESTION DU RENDERER VIA HOOK
        // On permet à d'autres plugins de fournir leur propre logique de rendu
        $hook_data = $rcmail->plugins->exec_hook('folder_list_render', [
            'plugin'   => $this, 
            'renderer' => null
        ]);

        $renderer = $hook_data['renderer'] ?? function($d, $mode) {
        if ($mode === 'close') return '</bnum-folder>';

            return sprintf(
                '<bnum-folder id="%s" folder-id="%s" label="%s" unread="%d" icon="%s" level="%d" %s %s %s %s %s rel="%s">',
                rcube::Q($d['html_id']),
                rcube::Q($d['id']),
                rcube::Q($d['label']),
                $d['unread'],
                rcube::Q($d['icon']),
                $d['level'],
                $d['is_selected'] ? 'is-selected="true"' : 'is-selected="false"',
                $d['is_virtual'] ? 'is-virtual="true"' : 'is-virtual="false"',
                $d['is_collapsed'] ? 'is-collapsed="true"' : 'is-collapsed="false"',
                $d['slot'] ? 'slot="'.$d['slot'].'"' : '',
                'class="'.implode(' ', $d['class']).'"',
                rcube::Q($d['id']),
            );
        };

        // 3. GÉNÉRATION DE L'ARBRE
        $js_mailboxlist = [];
        $html_tree = self::generic_tree_processor(
            $a_mailboxes, 
            $mbox_name, 
            $js_mailboxlist, 
            0, 
            $renderer
        );

        // 4. FINALISATION ROUNDCUBE
        // On informe le JS de Roundcube de l'existence de ces dossiers
        $rcmail->output->set_env('mailboxes', $js_mailboxlist);
        $keys = array_keys($js_mailboxlist);
        $rcmail->output->set_env('mailboxes_list', $keys);
        
        // On enregistre l'objet GUI pour que treelist.js puisse le trouver
        $rcmail->output->add_gui_object('mailboxlist', $attrib['id']);

        // 5. SORTIE : LE COMPOSANT RACINE <bnum-tree>
        // On fusionne les attributs passés (id, class, etc.)
        $tree_attribs = $attrib + ['id' => $attrib['id']];
        unset($tree_attribs['folder_filter']); // Nettoyage

        $rcmail->output->include_script('treelist.js');
        $rcmail->output->set_env('unreadwrap', $attrib['unreadwrap'] ?? false);
        $rcmail->output->set_env('collapsed_folders', (string) $rcmail->config->get('collapsed_folders'));

        return html::tag('bnum-tree', $tree_attribs, $html_tree);
    }

    private static function map_type_to_icon($type) {
        $map = [
            'inbox' => 'inbox',
            'sent'  => 'send',
            'drafts'=> 'drafts',
            'trash' => 'delete',
            'junk'  => 'report',
            'normal'=> 'folder'
        ];
        return $map[$type] ?? 'folder';
    }

    /**
     * Moteur de rendu générique pour l'arborescence Roundcube
     */
    protected static function generic_tree_processor(&$arrFolders, $mbox_name, &$jslist, $nestLevel, $renderer)
    {
        $rcmail  = rcmail::get_instance();
        $storage = $rcmail->get_storage();
        $msgcounts = $storage->get_cache('messagecount');
        $collapsed = (string) $rcmail->config->get('collapsed_folders');
        $realnames = (bool) $rcmail->config->get('show_real_foldernames');
        $output = '';

        foreach ($arrFolders as $folder) {
            // --- 1. PRÉPARATION DES DONNÉES (Logique métier identique partout) ---
            $id = $folder['id'];
            $folder_class = rcmail_action::folder_classname($id, $folder['class'] ?? null);

            $classes = ['mailbox', $folder_class];

            if ($id == $mbox_name) {
                $classes[] = 'selected';
            }
            if ($folder['virtual']) {
                $classes[] = 'virtual';
            }

            $data = [
                'id'           => $id,
                'html_id'      => 'rcmli' . rcube_utils::html_identifier($id, true),
                'name'         => $folder['name'],
                'unread'       => ($msgcounts && !empty($msgcounts[$id]['UNSEEN'])) ? (int)$msgcounts[$id]['UNSEEN'] : 0,
                'type'         => $folder_class ?: 'normal',
                'level'        => $nestLevel,
                'url'          => $rcmail->url(['_mbox' => $id]),
                'is_selected'  => ($id == $mbox_name),
                'is_collapsed' => (strpos($collapsed, '&'.rawurlencode($id).'&') !== false),
                'is_virtual'   => (bool)$folder['virtual'],
                'has_children' => !empty($folder['folders']),
                'icon' => self::map_type_to_icon($folder_class ?: 'normal'),
                'slot' => $nestLevel > 0 ? 'folders' : '',
                'class' => $classes,
            ];

            $data['label'] = $data['name'];

            // Remplissage obligatoire pour le JS de Roundcube
            $jslist[$id] = ['id' => $id, 'name' => $data['name'], 'virtual' => $data['is_virtual'], 'class' => $folder_class];

            // --- 2. DÉLÉGATION AU RENDERER (L'aspect visuel) ---
            // On appelle la fonction passée en paramètre
            $item_html = $renderer($data, 'open');

            // --- 3. RÉCURSION ---
            if ($data['has_children']) {
                $children_html = self::generic_tree_processor($folder['folders'], $mbox_name, $jslist, $nestLevel + 1, $renderer);
                // On injecte les enfants dans l'item produit par le renderer
                // (votre renderer doit prévoir un marqueur ou on peut les concaténer)
                $item_html .= $children_html; 
            }

            // Fermeture du tag
            $item_html .= $renderer($data, 'close');

            $output .= $item_html;
        }

        return $output;
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

    public function handler_default_page_title() {
        return $this->rc()->gettext($this->get_input('_initial_task', rcube_utils::INPUT_GET), 'mel_metapage');
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