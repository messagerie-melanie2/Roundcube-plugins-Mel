<?php
/**
* Class for php modules
*
* Portail web
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
class Module implements iModule {
    /**
     * @var rcmail The one and only instance
     */
    protected $rc;

    /**
     * @var rcube_plugin mel_portail plugin
     */
    protected $plugin;
    
    /**
     * Identifiant du module
     * 
     * @var string
     */
    protected $id;

    /**
     * List of logos
     * 
     * @var array
     */
    protected $logos;

    /**
     * Est-ce que le module doit utiliser un logo ?
     */
    public $no_logo = false;

    /**
     * Mapping entre les champs items et ceux du form
     */
    protected $mappingFields = [];

    /**
     * Liste des champs qui ne seront pas en lecture/seule
     */
    protected $writableFields = [];

    /**
     * Liste des champs obligatoires
     */
    protected $requiredFields = [];
    
    /**
     * Constructeur avec identifiant du module
     */
    public function __construct($id, $plugin) {
        $this->rc = rcmail::get_instance();
        $this->plugin = $plugin;
        $this->id = $id;
    }

    /**
    * Est-ce que le module doit être affiché ou non ?
    * 
    * @return boolean
    */
    public function show() {
        return true;
    }

    /**
     * Initialisation du module
     */
    public function init() {}

    /**
     * Call setting_row from prop
     */
    protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
        if ($readonly) {
            $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
        }
        else if ($prop == 'type') {
            $select = new html_select(['id' => '_item'.$submodule.'_type', 'name' => 'item'.$submodule.'_type']);
            $types = $this->rc->config->get('portail_edit_types', ['website']);
            foreach ($types as $type) {
                $select->add($this->plugin->gettext($type), $type);
            }
            $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: 'website'), '', $submodule);
        }
        else if ($prop == 'color') {
            $select = new html_select(['id' => '_item'.$submodule.'_color', 'name' => 'item'.$submodule.'_color']);
            $colors = $this->rc->config->get('portail_edit_colors', ['default', 'blue', 'grey', 'yellow', 'orange', 'red', 'turquoise', 'green']);
            foreach ($colors as $color) {
                $select->add($this->plugin->gettext($color), $color);
            }
            $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: 'default'), '', $submodule);
        }
        else if ($prop == 'logo') {
            $select = new html_select(['id' => '_item'.$submodule.'_logo', 'name' => 'item'.$submodule.'_logo']);
            $select->add($this->plugin->gettext('no icon'), '');
            $select->add($this->plugin->gettext('custom logo'), 'custom');
            $files = scandir(__DIR__ . '/icons/list/');
            foreach ($files as $file) {
                if (strpos($file, '.') !== 0) {
                    $tmp = explode(' - ', $file, 2);
                    $name = str_replace('.png', '', $tmp[1]);
                    $select->add($name, '/plugins/mel_portail/modules/icons/list/' . $file);
                    $this->logos['/plugins/mel_portail/modules/icons/list/' . $file] = $name;
                }
            }
            if (isset($item[$prop]) && !empty($item[$prop])) {
                if (strpos($item[$prop], '/plugins/mel_portail/modules/icons/list/') === 0) {
                    $select_value = $item[$prop];
                    $custom_value = '';
                }
                else {
                    $select_value = 'custom';
                    $custom_value = $item[$prop];
                }
            }
            else {
                $select_value = '';
                $custom_value = '';
            }
            $input = new html_inputfield(['id' => '_item'.$submodule.'_custom_logo', 'class' => 'custom', 'name' => 'item'.$submodule.'_custom_logo']);
            $this->setting_row($table, $prop, $item, $select->show($select_value), '', $submodule);
            $this->setting_row($table, 'logo_custom', $item, $input->show($custom_value), '', $submodule);
        }
        else if ($prop == 'provenance') {
            $select = new html_select(['id' => '_item'.$submodule.'_provenance', 'name' => 'item'.$submodule.'_provenance']);
            $select->add($this->plugin->gettext("from all"), '');
            foreach (['internet', 'intranet'] as $type) {
                $select->add($this->plugin->gettext("from " . $type), $type);
            }
            $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: 'from all'), '', $submodule);
        }
        else if ($prop == 'flip') {
            $select = new html_select(['id' => '_item'.$submodule.'_flip', 'name' => 'item'.$submodule.'_flip']);
            foreach (['false', 'true'] as $type) {
                $select->add($this->plugin->gettext($type), $type);
            }
            $this->setting_row($table, $prop, $item, $select->show($item[$prop] ? 'true' : 'false'), '', $submodule);
        }
        else if ($prop == 'width') {
            $select = new html_select(['id' => '_item'.$submodule.'_width', 'name' => 'item'.$submodule.'_width']);
            foreach (['normal', 'large'] as $type) {
                $select->add($this->plugin->gettext($type), $type);
            }
            $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: 'normal'), '', $submodule);
        }
        else if ($prop == 'logobg') {
            $this->setting_row($table, $prop, $item, null, 'inputcolor', $submodule);
        }
        else if ($prop == 'description') {
            $this->setting_row($table, $prop, $item, null, 'textarea', $submodule);
        }
        else {
            $this->setting_row($table, $prop, $item, null, 'input', $submodule);
        }
    }

    /**
     * Add prop to table row
     */
    protected function setting_row(&$table, $prop, $item, $html = null, $inputtype = 'input', $submodule = '') {
        if ($inputtype == 'readonly' && !in_array($prop, $this->writableFields) && !isset($item[$prop])) {
            return;
        }
        
        if (in_array($prop, $this->requiredFields)) {
            $star = html::span(['class' => 'star', 'title' => $this->plugin->gettext('required_field')], '*');
            $class = $prop . ' required';
        }
        else {
            $star = ''; $class = $prop;
        }
        $table->add_row(['title' => $this->plugin->gettext('item_title_' . $prop), 'class' => $class]);
        $table->add('title', html::label(['for' => '_item'.$submodule.'_' . $prop], $this->plugin->gettext('item_' . $prop)) . $star);
        if (!isset($html)) {
            switch ($inputtype) {
                case 'checkbox':
                    $checkbox = new html_checkbox(['id' => '_item'.$submodule.'_' . $prop, 'name' => 'item'.$submodule.'_' . $prop, 'value' => 'true']);
                    $html = $checkbox->show($item[$prop] ? 'true' : '');
                    break;
                case 'input':
                    $params = ['id' => '_item'.$submodule.'_' . $prop, 'name' => 'item'.$submodule.'_' . $prop, 'placeholder' => $this->plugin->gettext('item_' . $prop)];
                    $input = new html_inputfield($params);
                    $html = $input->show($item[$prop] ?: '');
                    break;
                case 'inputcolor':
                    $this->plugin->require_plugin('jqueryui');
                    jqueryui::miniColors();
                    $params = ['id' => '_item'.$submodule.'_' . $prop, 'name' => 'item'.$submodule.'_' . $prop, 'class' => 'colors'];
                    $input = new html_inputfield($params);
                    $html = $input->show($item[$prop] ?: '');
                    break;
                case 'textarea':
                    $params = ['id' => '_item'.$submodule.'_' . $prop, 'name' => 'item'.$submodule.'_' . $prop, 'placeholder' => $this->plugin->gettext('item_' . $prop)];
                    $input = new html_textarea($params);
                    $html = $input->show($item[$prop] ?: '');
                    break;
                case 'readonly':
                    $html = html::span('readonly', $item[$prop] ?: '');
                    break;
            }
            
        }
        $table->add(null, $html);
    }

    /**
     * Generation HTML table to show settings
     */
    protected function settings_table($props, $item, $submodule = null, $readonly = false) {
        $table = new html_table(['class' => 'propform']);
        foreach ($props as $prop) {
            $this->setting_prop($table, $prop, $item, $submodule, $readonly);
        }
        return $table->show();
    }

    /**
     * Item types list for nice view
     */
    protected function newTypesList() {
        $types = $this->rc->config->get('portail_edit_types', ['website']);
        $div = '';
        foreach ($types as $type) {
            $div .= html::span(['class' => $type], $this->plugin->gettext($type));
        }
        return html::div(['class' => 'item_types'], $div);
    }

    /**
     * Item logo list for nice view
     */
    protected function newLogosList() {
        $div = '';
        $div .= html::span(['class' => 'custom_logo', 'title' => $this->plugin->gettext('custom logo', 'mel_portail')], html::img(['class' => 'custom_logo', 'src' => '', 'alt' => $this->plugin->gettext('custom logo', 'mel_portail')]));
        $div .= html::span(['class' => 'default', 'title' => $this->plugin->gettext('default logo', 'mel_portail')], html::img(['class' => 'default', 'src' => '', 'alt' => $this->plugin->gettext('default logo', 'mel_portail')]));
        foreach ($this->logos as $url => $name) {
            $div .= html::span(['class' => $name, 'title' => $name], html::img(['class' => 'custom', 'src' => $url, 'alt' => $name]));
        }
        return html::div(['class' => 'item_logos'], $div);
    }

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        unset($attrib['form']);
        // Est-ce que c'est un enregistrement
        if (isset($_POST['_id'])) {
            if ($this->save_settings($item)) {
                $this->rc->output->show_message('successfullysaved', 'confirmation');
                if ($_POST['_id'] == 'new') {
                    $this->rc->output->add_script("window.parent.rcmail.mel_portail_reload_page('create');");
                }
                else {
                    $this->rc->output->add_script("window.parent.rcmail.mel_portail_reload_page('modify');");
                }
            }
            else {
                $this->rc->output->show_message('errorsaving', 'error');
            }
        }
        $is_new = $this->rc->output->get_env('personal_item_is_new');

        $form_start = $this->rc->output->request_form(array(
            'name' => "form",
            'id'   => 'item_edit_form',
            'class' => $is_new ? 'new propform' : 'modify propform',
            'method' => "post",
            'task' => $this->rc->task,
            'action' => 'plugin.mel_resources_portail',
            'noclose' => true) + $attrib, '');
        $form_end = '</form>';
        $this->rc->output->add_gui_object('editform', 'item_edit_form');
        $item = $this->rc->output->get_env('personal_item');
    
        $out = $form_start;
        $hidden = new html_hiddenfield();
        $hidden->add(['name' => '_id', 'value' => $this->rc->output->get_env('personal_item_id')]);
        $hidden->add(['name' => '_order', 'value' => $item['order']]);
        $hidden->add(['name' => '_personal', 'value' => $item['personal']]);
        $out .= $hidden->show();
        
        // Choix du type de vignette
        $out .= html::tag('fieldset', ['id' => 'itemtype', 'class' => $is_new ? 'new' : 'modify'], 
          html::tag('legend', null, $this->plugin->gettext('itemtype') . ($is_new ? '' : ' : ' . $this->plugin->gettext($item['type']))) .
          $this->settings_table(['type'], $item) . 
          ($is_new ? $this->newTypesList() : '')
        );

        if ($is_new) {
            $out .= html::tag('fieldset', ['id' => 'itemlogo'], 
                html::tag('legend', null, $this->plugin->gettext('itemlogo')) .
                $this->settings_table(['logo', 'logobg'], $item, null, !$item['personal']) .
                $this->newLogosList()
            );
        }
        else {
            // Logo de la vignette
            $table_logo = new html_table(['id' => 'table_logo']);
            $table_logo->add_row();
            $table_logo->add(null, html::tag('fieldset', ['id' => 'itemicon'], 
            html::tag('legend', 'voice', $this->plugin->gettext('itemicon')) .
            html::div(['id' => 'itemimg'], 
                html::img(['src' => $item['logo'] ?: '/plugins/mel_portail/modules/' . ($item['type'] ?: 'website')  . '/logo.png', 'alt' => $this->plugin->gettext('itemiconalt')])
            )
            ));

            // Choix du logo
            $table_logo->add(null, html::tag('fieldset', ['id' => 'itemlogo'], 
                html::tag('legend', null, $this->plugin->gettext('itemlogo')) .
                $this->settings_table(['logo', 'logobg'], $item, null, !$item['personal'])
            ));
            $out .= $table_logo->show();
        }
        

        // Gérer les configurations particulières en fonction des types
        $types = $is_new ? $this->rc->config->get('portail_edit_types', ['website']) : [$item['type']];
        $templates = $this->rc->config->get('portail_templates_list', []);
        $nologo = [];
        foreach ($types as $type) {
            if (isset($templates[$type]['php'])) {
                include_once $type . '/' . $templates[$type]['php'];
                $classname = ucfirst($type);
                $object = new $classname($id, $this->plugin);
                $out .= html::tag('fieldset', ['id' => 'item'.$type, 'class' => 'more ' . $type], 
                    html::tag('legend', null, $this->plugin->gettext('item'.$type)) .
                    $object->settings_handler([])
                );
                // Ajoute le fieldset supplémentaire
                $out .= $object->setting_fieldset($item);
                // Gestion du nologo
                if ($object->no_logo) {
                    $nologo[] = $type;
                }
            }
        }
        $this->rc->output->set_env('nologo', $nologo);
        return $out . $form_end;
    }

    /**
     * Ajoute un fieldset supplémentaire si on souhaite plus d'options de paramètrage dans le module
     */
    public function setting_fieldset($item) {
        return "";
    }

    /**
     * Création/modification d'une vignette du type choisi
     */
    public function save_settings(&$item) {
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
        $item = [];
        if (isset($id)) {
            $id = driver_mel::gi()->rcToMceId($id);
            $type = rcube_utils::get_input_value('item_type', rcube_utils::INPUT_GPC);
            if ($id == 'new') {
                $id = $this->generate_id($type);
                $item['order'] = 0;
                $item['personal'] = true;
            }
            else {
                $order = rcube_utils::get_input_value('_order', rcube_utils::INPUT_POST);
                if (isset($order) && strlen($order)) {
                    $item['order'] = $order;
                }
                $personal = rcube_utils::get_input_value('_personal', rcube_utils::INPUT_POST);
                if (isset($personal) && strlen($personal)) {
                    $item['personal'] = $personal;
                }
            }
            $templates = $this->rc->config->get('portail_templates_list', []);
            if (isset($templates[$type]['php'])) {
                include_once $type . '/' . $templates[$type]['php'];
                $classname = ucfirst($type);
                $object = new $classname($id, $this->plugin);
                // Gestion du nologo
                if (!$object->no_logo) {
                    $logo = rcube_utils::get_input_value('item_logo', rcube_utils::INPUT_GPC);
                    if (isset($logo) && !empty($logo)) {
                        if ($logo == 'custom') {
                            $custom_logo = rcube_utils::get_input_value('item_custom_logo', rcube_utils::INPUT_GPC);
                            if (isset($custom_logo) && !empty($custom_logo)) {
                                $item['logo'] = $custom_logo;
                            }
                        }
                        else {
                            $item['logo'] = $logo;
                        }
                        $logobg = rcube_utils::get_input_value('item_logobg', rcube_utils::INPUT_GPC);
                        if (isset($logobg) && !empty($logobg)) {
                            $item['logobg'] = $logobg;
                        }
                        else {
                            // Default logo background
                            // $item['logobg'] = '#4d648d';
                            $item['logobg'] = 'transparent';
                        }
                    }
                }
                $object->item_from_form($item);
            }
            else {
                $this->item_from_form($item);
            }
            if (isset($item) && !empty($item)) {
                if (!isset($item['type'])) {
                    $item['type'] = $type;
                }
                else {
                    $types = $this->rc->config->get('portail_edit_types', ['website']);
                    if (!in_array($item['type'], $types)) {
                        return false;
                    }
                }
                if (isset($item['id'])) {
                    $id = $item['id'];
                    unset($item['id']);
                }
                $items = $this->rc->config->get('portail_personal_items', []);
                $items[$id] = $item;
                // Reinit les var d'env
                $this->rc->output->set_env("personal_item_is_new", false);
                $this->rc->output->set_env("personal_item_id", $id);
                $this->rc->output->set_env("personal_item", $item);
                return $this->rc->user->save_prefs(['portail_personal_items' => $items]);
            }
            else {
                return false;
            }
        }
    }

    /**
     * Corrige l'url si le protocole n'est pas précisé
     * 
     * @param string $url
     * 
     * @return string $url corrigée
     */
    public function fix_url($url) {
        if ($url != '#' && strpos($url, '/') !== 0 && strpos($url, '://') === false) {
            $url = 'http://' . $url;
        }
        return $url;
    }

    /**
     * Création de l'item à partir des données de formulaire
     */
    public function item_from_form(&$item) {
        $this->mapFields($item);
    }

    /**
     * Génére un id d'item
     */
    private function generate_id($type) {
        return uniqid($type);
    }

    /**
     * Génère l'item a partir des champs mappés
     */
    protected function mapFields(&$item) {
        foreach ($this->mappingFields as $field => $map) {
            $value = rcube_utils::get_input_value($map, rcube_utils::INPUT_POST);
            if ($field == 'flip') {
                $item[$field] = (isset($value) && !empty($value) && $value == 'true');
            }
            else if ($field == 'newtab') {
                $item[$field] = (!isset($value) || empty($value) || $value == 'true');
            }
            else if ($field == 'url') {
                $item[$field] = $this->fix_url($value);
            }
            else if (isset($value) && !empty($value)) {
                $item[$field] = $value;
            }
        }
    }

    /**
     * Génère un item html en fonction des propriétés
     * 
     * @param array $attrib
     * @param array $item
     * @param string $user_dn
     * @return string HTML
     */
    public function item_html($attrib, &$item, $user_dn) {
        $content = "";
        $attrib['class'] = $item['type'] . " item";
        // Gestion du bouton flip
        if ($item['flip']) {
            $flip = html::div('flip', html::tag('button', [], 'Flip'));
        }
        else {
            $flip = "";
        }
        // Récupération du header
        $header = $this->getHeader($attrib, $item, $flip);

        // Largeur
        if (isset($item['width']) 
                && $item['width'] == 'large') {
            $attrib['class'] .= ' large'; 
        }

        // Unchangeable
        if (isset($item['unchangeable']) 
                && $item['unchangeable']) {
            $attrib['class'] .= ' unchangeable'; 
        }

        // Color
        if (isset($item['color'])) {
            $attrib['class'] .= ' ' . $item['color']; 
        }

        // Gestion des boutons
        $buttons = "";
        $buttons_back = "";
        if (isset($item['buttons'])) {
            list($buttons, $buttons_back) = $this->getButtons($attrib, $item);
        }
        else if (isset($item['links'])) {
            $buttons = $this->getLinks($attrib, $item, $user_dn);
        }
        else if ($item['type'] == 'website' || $item['type'] == 'communication') {
            $attrib['class'] .= " full";
        }
        // Multi news ?
        if (isset($item['multiNews']) && $item['multiNews']) {
            $attrib['class'] .= " multinews";
        }
        // Générer le contenu html
        if ($item['flip']) {
            // Contenu
            $content_back = $this->getTips($item);
            // Front + back
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                        html::tag('article', 'back', html::tag('header', [], $flip) . $content_back . $buttons_back);
        }
        else {
            // Front
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                        html::tag('article', 'back blank', '');
        }
        return html::tag('article', $attrib, $this->getManagingDiv($item) . $content);
    }

    /**
     * Merge le global item avec le personal item
     */
    public function mergeItem($globalItem, $personalItem) {
        return $globalItem;
    }

    /**
     * Est-ce que l'item doit être en readonly
     */
    public function isReadonly($item) {
        return !$item['personal'];
    }

    /**
     * Filter if the user dn match the item dn
     * 
     * @param string $user_dn
     * @param string|array $item_dn
     * 
     * @return boolean true si le dn match, false sinon
     */
    public static function filter_dn($user_dn, $item_dn) {
        if (is_array($item_dn)) {
        $res = false;
        $res_neg = null;
        $res_eq = null;
        // C'est un tableau, appel récursif
        foreach ($item_dn as $dn) {
            $_res = self::filter_dn($user_dn, $dn);
            if (strpos($dn, '=') === 0) {
                if (is_null($res_eq)) {
                    $res_eq = $_res;
                }
                else {
                    $res_eq = $res_eq || $_res;
                }
            }
            else if (strpos($dn, '!') === 0) {
                if (is_null($res_neg)) {
                    $res_neg = $_res;
                }
                else {
                    $res_neg = $res_neg && $_res;
                }
            }
            else {
                $res = $res || $_res;
            }
        }
        // Validation des resultats
        if (!is_null($res_eq)) {
            if (!is_null($res_neg) && $res_neg === false) {
                $res = $res_neg;
            }
            else {
                $res = $res_eq;
            }
        }
        else if (!is_null($res_neg)) {
            $res = $res_neg;
        }
        }
        else {
            if (strpos($item_dn, '!') === 0) {
                // DN doit être différent
                $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
                $res = strpos($user_dn, $_item_dn) === false;
            }
            else if (strpos($item_dn, '=') === 0) {
                // DN exactement égal
                $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
                if (strpos($_item_dn, 'ou') === 0) {
                    $_user_dn = explode(',', $user_dn, 2);
                    $res = $_user_dn[1] == $_item_dn;
                }
                else {
                    $res = $user_dn == $_item_dn;
                }
            }
            else {
                // DN contient
                $res = strpos($user_dn, $item_dn) !== false;
            }
        }
        return $res;
    }

    /**
     * Return the style for logo
     * 
     * @param string $logobg Background color code
     * 
     * @return string CSS for logo
     */
    protected function getLogoStyle($logobg) {
        if (isset($logobg)) {
            if ($logobg == 'transparent') {
                return 'background-color: '.$logobg.';
                    border-radius: 5px;
                    border: 1px solid rgba(255,255,255,.35);';
            }
            else if ($logobg == 'custom') {
                return 'background-color: transparent;';
            }
            else {
                return 'background-color: '.$logobg.';
                    border-radius: 5px;
                    -webkit-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                    -moz-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                    box-shadow: 0 3px 0 0	rgba(43,43,43,.35);';
            }
        }
        else {
            return null;
        }
    }

    /**
     * Return the item header
     * 
     * @param array in/out $attrib
     * @param array $item
     * @param string $flip html
     * 
     * @return string HTML for header
     */
    protected function getHeader(&$attrib, $item, $flip) {
        $logo_style = null;
        $custom_logo = strpos($item['logo'], '/plugins/mel_portail/modules/') !== 0;
        if (isset($item['logobg'])) {
            $logo_style = $this->getLogoStyle($custom_logo && $item['logobg'] == 'transparent' ? 'custom' : $item['logobg']);
        }
        if (isset($item['url'])) {
            $description = $item['description'];
            // Gestion des astuces
            if (isset($item['tips']) 
                    && is_array($item['tips'])) {
                $description = $item['tips'][array_rand($item['tips'])] . $description;
            }
            if (empty($description)) {
                $attrib['class'] .= " nodescription";
            }
            // Header html du front
            $header = html::tag('header', [],
                $flip .
                html::a(['href' => $item['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $item['onclick'] ?: null],
                    html::img(['class' => 'icon', 'style' => $logo_style, 'alt' => $item['name'] . ' logo', 'src' => isset($item['logo']) ? $item['logo'] : '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png']) .
                    html::tag('h1', 'title', $item['name']) .
                        ($item['type'] == 'communication' ? "" : html::tag('p', 'description', $description))
                )
            );
        }
        else {
            // Header html du front
            $header = html::tag('header', [],
                $flip .
                html::tag('h1', 'title', $item['name'])
            );
        }
        return $header;
    }

    /**
     * Return the item managing div
     * 
     * @param array $item
     * 
     * @return string HTML for managing div
     */
    protected function getManagingDiv($item) {
        if (!isset($item['manage']) || $item['manage'] === true) {
            $html = html::div(['class' => 'managing'], 
                html::a(['class' => 'button', 'title' => $this->plugin->gettext('Clic to hide this item'), 'href' => '#', 'onclick' => 'rcmail.hideItem(event, \''.$item['id'].'\')'], $this->plugin->gettext('Hide this item')) .
                html::a(['class' => 'button', 'title' => $this->plugin->gettext('Clic to edit this item'), 'href' => '#', 'onclick' => 'rcmail.editItem(event, \''.$item['id'].'\')'], $this->plugin->gettext('Edit this item'))
            );
        }
        else {
            $html = '';
        }
        return $html;
    }

    /**
     * Return the item tips
     * 
     * @param array $item
     * 
     * @return string HTML for tips list in back content
     */
    protected function getTips($item) {
        // Contenu
        $content_back = "";
        if (isset($item['tips']) 
                && is_array($item['tips'])) {
            $list_back = "";
            foreach ($item['tips'] as $tips) {
                $list_back .= html::tag('li', null, html::a(null, html::tag('h1', null, $tips)));
            }
            $content_back = html::tag('ul', 'news', $list_back);
        }
        return $content_back;
    }

    /**
     * Return the item buttons
     * 
     * @param array in/out $attrib
     * @param array $item
     * 
     * @return array $buttons, $buttons_back
     */
    protected function getButtons(&$attrib, $item) {
        $buttons = "";
        $buttons_back = "";
        $buttons_list = "";
        $buttons_back_list = "";
        foreach ($item['buttons'] as $text => $button) {
            if (isset($button['back']) && $button['back']) {
                $buttons_back_list .= html::a(['class' => 'button', 'title' => $button['title'] ?: null, 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
            }
            else {
                $buttons_list .= html::a(['class' => 'button', 'title' => $button['title'] ?: null, 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
            }
            
        }
        $buttons = html::div('buttons', $buttons_list);
        if (strlen($buttons_back_list)) {
            $buttons_back = html::div('buttons', $buttons_back_list);
        }
        if ($item['type'] == 'fluxrss') {
            $attrib['class'] .= ' nonewsfront';
        }
        return array($buttons, $buttons_back);
    }

    /**
     * Return the item links
     * 
     * @param array in/out $attrib
     * @param array $item
     * 
     * @return string HTML for links
     */
    protected function getLinks(&$attrib, $item, $user_dn) {
        $attrib['class'] .= " links";
        $links_list = "";
        foreach ($item['links'] as $text => $link) {
            if (isset($link['hide']) && $link['hide']) {
                continue;
            }
            if (isset($link['dn'])) {
                $res = self::filter_dn($user_dn, $link['dn']);
                if ($res !== true) {
                    continue;
                }
            }
            // Gestion de la class
            $class = 'link';
            // Gestion du logo
            if (isset($link['logo'])) {
                $logo_link = $link['logo'];
            }
            else if (isset($item['logo'])) {
                $logo_link = $item['logo'];
            }
            else {
                $logo_link = '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png';
            }
            $custom_logo = strpos($logo_link, '/plugins/mel_portail/modules/') !== 0;
            // Gestion de la couleur du logo
            if (isset($link['logobg'])) {
                $logo_style_link = $this->getLogoStyle($custom_logo && $link['logobg'] == 'transparent' ? 'custom' : $link['logobg']);
            }
            else if (isset($item['logobg'])) {
                $logo_style_link = $this->getLogoStyle($custom_logo && $item['logobg'] == 'transparent' ? 'custom' : $item['logobg']);
            }
            else if (isset($item['links_logobg'])) {
                $logo_style_link = $this->getLogoStyle($custom_logo && $item['links_logobg'] == 'transparent' ? 'custom' : $item['links_logobg']);
            }
            // Gestion du button
            if (isset($link['button'])) {
                $class .= ' link_buttons';
                $button = $link['button'];
                if (!isset($button['onclick']) && isset($button['href'])) {
                    $button['onclick'] = "rcmail.portail_open_url('".$item['id']."', '".$button['href']."', event)";
                }
                $button_link = html::tag('span', ['class' => 'button_link', 'title' => $button['title'] ?: null, 'onclick' => $button['onclick'] ?: null], $button['text']);
            }
            else {
                $button_link = '';
            }
            $links_list .= html::a(['class' => $class, 'title' => $link['title'] ?: null, 'href' => $link['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $link['onclick'] ?: null],
                html::img(['class' => 'icon', 'style' => $logo_style_link, 'alt' => $item['name'] . ' logo', 'src' => $logo_link]) .
                html::tag('h3', 'title', $text) .
                $button_link
            );
        }
        return html::div('links', $links_list);
    }
}
