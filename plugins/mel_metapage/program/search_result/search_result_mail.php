<?php
include_once "search_result.php";
class SearchResultMail extends ASearchResult
{
    public function __construct($msg) {
        //$a  = rcube_mime::decode_header($msg->date, $msg->charset);
        $a1 = rcube_mime::decode_header($msg->from, $msg->charset);
        $date = new DateTime($msg->date);
        $up = '<div style="display:flex;">'.
        '<span '.$this->style_up().'>'.$date->format('H:i d/m/Y').'</span>'.$this->space().'<span  '.$this->style_up(false).'>'.$a1.'<span>'
        .'</div>';
        $down = '<div '.$this->style_down().'>'.rcube_mime::decode_header($msg->subject, $msg->charset).'</div>';
        parent::__construct( $up
        , $down,
         "?_task=mail&_mbox=INBOX&_uid=".$msg->uid."&_action=show");
    }  

    function style_up($b = true)
    {
        return 'style="font-size:smaller;flex: '.(($b) ? '0' : '1'). ' 0 auto"';
    }

    function space()
    {
        return '<space style="flex:100 0 auto"></space>';
    }

    function style_down()
    {
        return 'style="font-size:initial;width:100%;text-align:center;"';
    }

    public static function create_from_array($msgs)
    {
        $retour = new SearchResults();
        $count = count($msgs);
        for ($i=0; $i < $count; ++$i) { 
            $retour->add(new SearchResultMail($msgs[$i]));
        }
        return $retour;
    }
}