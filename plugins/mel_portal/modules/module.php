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
    /**
     * Constructeur avec identifiant du module
     */
    public function __construct($id, $plugin, $identifier = "") {
        $this->rc = rcmail::get_instance();
        $this->plugin = $plugin;
        $this->id = $id;
        $this->config = array();
        $this->identifier = $identifier;
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

    /**
     * Génération du html pour l'item
     */
    public function item_html()
    {
        return $this->generate_html();
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
        foreach ($includes as $key => $value) {
            include_once $value;
        }        
        $this->config = unserialize($config);
        $this->after_set_config();
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
        $actions = $this->register_actions();
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

    /**
     * Carré en html
     */
    function html_square($title = "",$idSquare = null, $idContent = null, $content = "", $classContent='')
    {
        $arraySquare = array("class" => 'square_div');
        if ($idSquare != null)
            $arraySquare["id"] = $idSquare;
        $arrayContent = array("class" => "contents ".$classContent);
        if ($idContent != null)
            $arrayContent["id"] = $idContent;
        return html::div(
            $arraySquare,
            (($title == "") ? "" : html::p(array(), $title)).html::div($arrayContent, $content));
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
            array("class" => "tablinks".(($selected == true) ? " selected" : ""), 'onclick' => 'selectTab(`'.$id.'`, this)'),
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
        $count = count($array);
        $html_tabs = "";
        $html_contents = "";
        for ($i=0; $i < $count; ++$i) { 
            $html_tabs = $html_tabs.$this->html_tab($array[$i]["name"], $array[$i]["id"], $i==0, $array[$i]["deco"]);
            $html_contents = $html_contents.$this->html_tab_content($array[$i]["id"], $i!=0);
        }
        return html::div(
            array("class" => "square_tab", "id" => $id),
            html::p(array(), $title).html::div(
                array("class" => "tabs"),
                $html_tabs
            ).html::div(
                array("class" => "tabs-contents"),
                html::div(array("class" => "middlew"), $html_contents)
            )
        );
    }


}