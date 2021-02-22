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
include_once "search.php";
/**
 * Représente une recherche effectué par le plugin "mel_metapage".
 */
class SearchMetapage extends ASearch
{
    /**
     * Champs où le texte sera recherché.
     */
    public $headers;
    public function __construct($action, $search = ASearch::REPLACED_SEARCH, $tmp = "") {
        parent::__construct("mel_metapage", $action, $search);
        $this->headers = $tmp;
    }  

    public function url()
    {
        return "?_task=".$this->task."&_action=".$this->action."&_q=".$this->search.(($this->headers === "") ? "" : "&_headers=".$this->headers);
    }
}
