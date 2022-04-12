<?php
/**
 * Plugin Mél Métapage
 *
 * Méta Page
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

class SearchAction {

    public $text;
    public $onclick;

    public function __construct()
    {
        $this->text = '';
        $this->onclick = '';
    }

    public function init($text, $onclick)
    {
        $this->text = $text;
        $this->onclick = $onclick;
        return $this;
    }

    public function html($class = '')
    {
        if ($this->text === '') return '';
        
        return "<button onclick='".$this->onclick."' class=\"$class mel-button btn btn-secondary\">".(strpos($this->text, 'span') ? $this->text : '<span>'.$this->text.'</span><span class="plus icon-mel-arrow-right"></span>')."</button>";
    }
}

/**
 * Représentation d'un résultat de recherche.
 */
abstract class ASearchResult
{
    // /**
    //  * Titre du résultat
    //  */
    // public $header;
    // /**
    //  * "Corps" du résultat.
    //  */
    // public $sub_header;
    // /**
    //  * Lien affiche le résultat.
    //  */
    // public $link;

    // public function __construct($header, $sub_header, $link = null) {
    //     $this->header = $header;
    //     $this->sub_header = $sub_header;
    //     $this->link = $link;
    // }  
    public $icon;
    public $html;
    public $datas;
    public $action;
    protected $plugin;

    public function __construct($icon = null, $action = null, $datas = []) {
        $this->icon = $icon;
        $this->datas = $datas;
        $this->action = $action ?? new SearchAction();
        $this->html = $this->html();
    }  

    public function html($classes = '')
    {
        return html::div(['class' => 'mel-block-list '.$classes], 
            html::div(['style' => 'display:inline-block;vertical-align:top'], html::tag('span', ['class' => 'icon '.$this->icon ?? 'no-icon'])).$this->_html()
            .(!isset($this->action) ? '' : $this->_html_action())
        );
    }

    protected abstract function _html();

    protected function create_action($text, $onclick)
    {
        return (new SearchAction())->init($text, $onclick);
    }

    protected function _html_action()
    {
        return html::div(['style' => 'display: block;text-align: center;margin-top: 15px;'], $this->action->html());
    }

    public function set_plugin($plugin)
    {
        $this->plugin = $plugin;
        return $this;
    }

    public function set_data($key, $item)
    {
        if (!isset($this->datas)) $this->datas = [];
        $this->datas[$key] = $item;
        return $this;
    }
}

/**
 * Listes des résultats de recherche.
 */
class SearchResults
{
    /**
     * Résultats
     */
    private $results;

    public function __construct($array = []) {
        $this->results = $array;
    }  

    /**
     * Ajoute un résultat.
     */
    public function add($item)
    {
        $this->results[$this->count()] = $item;
    }

    /**
     * Nombre de résultats.
     */
    public function count()
    {
        return count($this->results);
    }

    /**
     * Récupère un résultat
     */
    public function get($i)
    {
        return $this->results[$i];
    }

    /**
     * Modifie un résultat
     */
    public function edit($i, $item)
    {
        $this->results[$i] = $item;
    }

    /**
     * Formatte en données lisible en js.
     */
    public function get_array($label)
    {
        return ["label" => $label, "datas" => $this->results];
    }
}



