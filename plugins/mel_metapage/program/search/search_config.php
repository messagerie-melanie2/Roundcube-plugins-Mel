<?php
include_once "search.php";
include_once "search_calendar.php";
include_once "search_metapage.php";
class SearchConfig
{
    const TYPE_DEFAULT = "default";
    const TYPE_CALENDAR = "calendar";

    const TYPE = "type";
    const ACTION = 'action';
    const HEADERS  = "headers";

    const START_DATE = "startDate";
    const END_DATE = "endDate";

    public $config;
    private $search;
    public function __construct($config) {
        $this->_update($config);
    }  

    public function update()
    {
        $this->_update($config);
    }

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
