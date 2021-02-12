<?php
include_once "search.php";
class SearchMetapage extends ASearch
{
    public $headers;
    public function __construct($action, $search = ASearch::REPLACED_SEARCH, $tmp = "") {
        parent::__construct("mel_metapage", $action, $search);
        $this->headers = $tmp;
    }  
    //?_task=mail&_action=search&_interval=&_q=Ariane&_headers=subject%2Cfrom&_layout=widescreen&_filter=ALL&_scope=base&_mbox=INBOX&_remote=1&_unlock=loading1611133745730&_=1611133742204

    public function url()
    {
        return "?_task=".$this->task."&_action=".$this->action."&_q=".$this->search.(($this->headers === "") ? "" : "&_headers=".$this->headers);
    }
}
