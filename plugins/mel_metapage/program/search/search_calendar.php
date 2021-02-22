<?php
include_once "search.php";
/**
 * Représenta la recherche dans un calendrier.
 */
class SearchCalendar extends ASearch
{
    const NOW = "now";

    /**
     * Date de départ de la recherche.
     */
    public $startDate;
    /**
     * Date de fin de la recherche.
     */
    public $endDate;

    public function __construct($startDate, $endDate,$search = ASearch::REPLACED_SEARCH) {
        parent::__construct("calendar", "load_events", $search);
        $this->startDate = $this->set_date($startDate);
        $this->endDate = $this->set_date($endDate);
    }  

    /**
     * Change le texte "now(+/-[day])" en date.
     */
    function set_date($date)
    {
        if (strpos($date, SearchCalendar::NOW) !== false)
        {
            if (strpos($date, '-'))
            {
                $tmp = new DateTime();
                $interval = new DateInterval("P".explode("-", $date)[1]."D");
                $interval->invert = 1;
                $tmp->add($interval);;
                return $tmp;
            }
            else if (strpos($date, '+'))
            {
                $tmp = new DateTime();
                $tmp->add(new DateInterval("P".explode("+", $date)[1]."D"));;
                return $tmp;               
            }
            else
                return new DateTime();
        }
        else 
            return new DateTime($date);
    }

    public function url()
    {
        return "?_task=".$this->task."&_action=".$this->action."&q=".$this->search
        ."&start=".$this->startDate->format('Y-m-d')."&end=".$this->endDate->format('Y-m-d');
    }
}
