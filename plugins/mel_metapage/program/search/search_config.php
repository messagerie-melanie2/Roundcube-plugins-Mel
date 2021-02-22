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
include_once "search_calendar.php";
include_once "search_metapage.php";
/**
 * Change un tableau de config en objet config.
 */
class SearchConfig
{
    const TYPE_DEFAULT = "default";
    const TYPE_CALENDAR = "calendar";

    const TYPE = "type";
    const ACTION = 'action';
    const HEADERS  = "headers";

    const START_DATE = "startDate";
    const END_DATE = "endDate";

    /**
     * Config tableau
     */
    public $config;
    private $search;
    public function __construct($config) {
        $this->_update($config);
    }  

    /**
     * Met à jours la config.
     */
    public function update()
    {
        $this->_update($config);
    }

    /**
     * Récupère la config sous forme d'objet.
     */
    public function get()
    {
        return $this->search;
    }

    private function _update($config)
    {
        $this->config = $config;
        if ($config[SearchConfig::TYPE] === SearchConfig::TYPE_DEFAULT)
        {
            $header = (($config[SearchConfig::HEADERS] === null) ? "" : $config[SearchConfig::HEADERS]);
            $this->search = new SearchMetapage($config[SearchConfig::ACTION], ASearch::REPLACED_SEARCH, $header);
        }
        else if ($config[SearchConfig::TYPE] === SearchConfig::TYPE_CALENDAR)
            $this->search = new SearchCalendar($config[SearchConfig::START_DATE], $config[SearchConfig::END_DATE]);
    }


}
