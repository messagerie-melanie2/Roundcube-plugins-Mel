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
/**
 * Représentation d'un résultat de recherche.
 */
abstract class ASearchResult
{
    /**
     * Titre du résultat
     */
    public $header;
    /**
     * "Corps" du résultat.
     */
    public $sub_header;
    /**
     * Lien affiche le résultat.
     */
    public $link;

    public function __construct($header, $sub_header, $link = null) {
        $this->header = $header;
        $this->sub_header = $sub_header;
        $this->link = $link;
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



