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
 * Représente l'action d'une recherche.
 */
abstract class ASearch
{
    /**
     * Texte à remplacer.
     */
    const REPLACED_SEARCH = "¤¤¤";
    /**
     * Tâche de la recherche.
     */
    public $task;
    /**
     * Action de la recherche.
     */
    public $action;
    public $search;

    public function __construct($task, $action, $search = ASearch::REPLACED_SEARCH) {
        $this->task = $task;
        $this->action = $action;
        $this->search = $search;
    }  

    /**
     * url de la recherche.
     */
    public abstract function url();
}