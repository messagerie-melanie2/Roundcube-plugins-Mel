<?php
include_once "page.php";
abstract class ParsedPage extends Page
{
    private $exit;
    private $write;

    public function __construct($rc, $plugin, $action, $page_to_send = null) {
        parent::__construct($rc, $plugin, $action, $page_to_send === null ? $action : $page_to_send);
        $exit = false;
        $write = false;
    }  

    protected function do_send()
    {
        return false;
    }

    public function call()
    {
        $this->before_call();
        $this->add_script("if (rcmail.env.mel_metapage_call_parsed === undefined) rcmail.env.mel_metapage_call_parsed = {}; ");
        $this->add_script("rcmail.env.mel_metapage_call_parsed['".$this->http_action."'] = async () => mel_metapage.Functions.get(mel_metapage.Functions.url('custom_page', '".$this->http_action."'), {}, (datas) => {return datas})");
        $this->after_call();
    }

    protected function add_script($script)
    {
        try {
            $this->rc->output->add_script($script , "docready");//code...
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    protected function before_call() {}
    protected function after_call() {}

    protected function send_action()
    {
        parent::send_action();
        echo $this->get_parsed_page();
        exit; 
    }

    protected function get_parsed_page()
    {
        return $this->parse($this->get_sended_page(), "mel_metapage", $this->exit, $this->write);
    }

    public function set_exit()
    {
        $this->exit = true;
    }

    public function set_write()
    {
        $this->write = true;
    }

}