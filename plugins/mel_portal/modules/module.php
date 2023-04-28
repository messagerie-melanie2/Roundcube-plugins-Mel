<?php
include_once 'module_action.php';
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
    public const DEFAULT_ORDER = 9999;
    public const NO_NAME = null;
    public const NO_ICON = null;
    public const HTML_CARD_CLASS = 'melv2-card';
    public const HTML_CARD_CONTENTS_CLASS = 'melv2-card-contents';
    public const HTML_CARD_PRE_CONTENTS_CLASS = 'melv2-card-pre';
    public const HTML_CARD_TITLE_CLASS = 'melv2-card-title';
    public const HTML_CARD_ICON_CLASS = 'melv2-card-icon';
    public const HTML_CARD_ICON_DATAS = 'data-melv2-icon';


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
     * Configuration du module.
     */
    protected $config;
    /**
     * Identification si il y a plusieurs modules identiques.
     */
    protected $identifier;

    /**
     * Taille du module.
     */
    private $row_size;

    private $_order;
    private $actions;
    private $have_custom_style;
    private $name;
    private $icon;
    private $custom_attribs;
    /**
     * Constructeur avec identifiant du module
     */
    public function __construct($id, $plugin, $identifier = "") {
        $this->rc = rcmail::get_instance();
        $this->plugin = $plugin;
        $this->id = $id;
        $this->config = array();
        $this->identifier = $identifier;
        $this->actions = [];
    }

    /**
     * Dossier module
     */
    public function folder()
    {
        return "modules/";
    }

    /**
     * Chemin du fichier "module_action.php"
     */
    public function module_action_path()
    {
        return getcwd()."/plugins/mel_portal/".$this->folder()."module_action.php";
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

    public function row_size()
    {
        return $this->row_size;
    }

    public function edit_row_size($size)
    {
        $this->row_size = $size;
    }

    public function edit_order($order) {
        $this->_order = $order;
    }

    public function order() {
        return $this->_order ?? self::DEFAULT_ORDER;
    }

    public function use_custom_style(){
        return $this->have_custom_style ?? false;
    }
    public function set_use_custom_style($use)
    {
        $this->have_custom_style = $use;
    }
    public function set_name($new_name){
        $this->name = $new_name;
    }
    public function set_icon($new_icon) {
        $this->icon = $new_icon;
    }

    /**
     * Génération du html pour l'item
     */
    public function item_html()
    {
        $html = $this->generate_html();
        if (!$this->use_custom_style())
        {
            $have_name = $this->name !== self::NO_NAME;
            $have_icon = $this->icon !== self::NO_ICON;
            $have_pre_content = $have_icon || $have_name;

            if ($have_pre_content) {
                unset($have_pre_content);
                $div_contents = [];
                
                if ($have_icon) {
                    unset($have_icon);
                    $div_contents[] = html::span(['class' => self::HTML_CARD_ICON_CLASS, self::HTML_CARD_ICON_DATAS => $this->icon], '');
                }

                if ($have_name){
                    unset($have_name);
                    $div_contents[] = '<h2>'.html::a(['class' => self::HTML_CARD_TITLE_CLASS], $this->name).'</h2>';
                }

                $html = html::div(['class' => self::HTML_CARD_PRE_CONTENTS_CLASS], implode('', $div_contents)).html::div(['class' => self::HTML_CARD_CONTENTS_CLASS], $html);
            }

            $html = $this->html_square(['class' => self::HTML_CARD_CLASS], $html);
        }

        return $html;
    }

    /**
     * Ajoute les éléments nécessaire au module pour fonctionner.
     */
    public function include_module()
    {
        $this->include_js();
        $this->include_css();
        $this->set_js_vars();
    }

    /**
     * Récupère la configuration d'un module.
     */
    public function set_config($config, $includes)
    {
        try {
            try {
                if ($includes !== null && is_array($includes))
                {
                    foreach ($includes as $key => $value) {
                        include_once $value;
                    }       
                } 
            } catch (\Throwable $th) {
                //throw $th;
            }
            $this->config = unserialize($config);
            $this->after_set_config();
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    /**
     * Actions à faire après avoir récupérer une configuration.
     */
    protected function after_set_config()
    {

    }

    /**
     * Récupère un texte.
     */
    public function text($text)
    {
        return $this->plugin->gettext($text);
    }

    /**
     * Récupère la config du module.
     */
    protected function load_config()
    {
        include_once $this->id.'/conf.php';
        $this->config = $config;
    }

    /**
     * Charge les actions d'un module.
     */
    public function load_actions()
    {
        $actions = $this->register_actions() ?? [];
        $actions = array_merge($actions, $this->action ?? []);

        if ($actions != null)
        {
            $size = count($actions);
            if ($size > 0)
            {
                for ($i=0; $i < $size; ++$i) { 
                    $this->plugin->register_action($actions[$i]->action_name, array($actions[$i]->action_item->object, $actions[$i]->action_item->function_name));
                }
            }
        }
    }

    /**
     * Ajoute le plugin au menu.
     */
    public function add_to_menu()
    {
        
    }

    protected function generate_html(){}
    protected function set_js_vars(){} 
    protected function include_js(){}
    protected function include_css(){}
    protected function register_actions(){}

    protected function register_action($action_name, $object, $func_name) {
        $this->action[] = new Module_Action($action_name, $object, $func_name);
    }

    /**
     * Carré en html
     */
    protected function html_square($attribs = [], $contents = '')
    {
        //if ($this->custom_attribs !== null) $attribs = array_merge($attribs, $this->custom_attribs);
        $config = $this->custom_attribs ?? [];//['class' => 'melv2-card'];

        if (isset($attribs['class'])){
            $config['class'] = ' '.$attribs['class'];
            unset($attribs['class']);
        }

        if (count($attribs) > 0) $config = array_merge($config, $attribs);

        return html::div(
            $config,
            $contents);
    }

    /**
     * Block html séparé en header/body/footer
     */
    function html_square_hbf($title, $classHeader = "", $classBody = "", $classFooter = "", $idSquare = null, $idContent = null, $contents = null, $classContent = '')
    {
        return $this->html_square($title, $idSquare, $idContent, 
        html::div(array("class" => "square-contents"),
        html::div(array("class" => $classHeader." square-header"), (($contents === null) ? null : $contents["header"])).
        html::div(array("class" => $classBody." square-body"), (($contents === null) ? null : $contents["body"])).
        html::div(array("class" => $classFooter." square-footer"), (($contents === null) ? null : $contents["footer"])))
        ,$classContent);
    }

    /**
     * Onglet html
     */
    function html_tab($tabName, $id, $selected=false, $misc = "")
    {
        return html::tag("button",
            array("class" => "tablinks sub-title".(($selected == true) ? " selected" : ""), 'onclick' => 'selectTab(`'.$id.'`, this)'),
            $misc.$tabName
        );
    }

    /**
     * Données d'un onglet html.
     */
    function html_tab_content($id, $hidden = false)
    {
        return html::div(
            array("class" => "tabcontent".(($hidden) ? " hidden" : ""), "id" => $id)
        );
    }

    /**
     * Bloack html avec des onglets.
     */
    function html_square_tab($array, $title="", $id="")
    {
        $dir = __DIR__;
        include_once "$dir/../program/html_helper/HTMLTab.php";

        $tabs = new HTMLDivTab(null, [
            aHTMLElement::ARG_CLASSES => ["tabs"],
        ]);

        if ($title !== "")
            $tabs->arias[] = "aria-label=\"$title\"";

        $tabs->base->classes = ["tabs-contents"];
        $count = count($array);

        for ($i=0; $i < $count; ++$i) { 

            $tab = new HTMLTab(($array[$i]["tab-id"] === "" ? null : $array[$i]["tab-id"]), null, [
                aHTMLElement::ARG_CLASSES => ["tablinks sub-title".($i === 0 ? " selected" : "")],
                aHTMLElement::ARG_ATTRIBUTES => ['onclick="selectTab(`'.$array[$i]["id"].'`, this)"'],
            ]);

            if ($i !== 0)
                $tab->attributes[] = "tabindex=-1";

            $tab->html(($array[$i]["deco"] === null ? "" : $array[$i]["deco"])." <span class=tab-title>".($array[$i]["name"] === null ? "" : $array[$i]["name"]).'</span>');
            $tab->content->id = $array[$i]["id"];
            $tab->content->classes = ["tabcontent"];

            if ($array[$i]["content-attributes"] != null)
                $tab->content->attributes = $array[$i]["content-attributes"];

            $tabs->addTab($tab);
            unset($tab);

        }

        $parent = new HTMLBaseElement($id === "" ? null : $id, [
            aHTMLElement::ARG_CLASSES => ["square_tab"]
        ]);
        if ($title !== "" && $title !== null)
            $parent->append("<h2>$title</h2>");
        $parent->append($tabs);

        return $parent->toHtml();
    }


}