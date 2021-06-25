<?php
$dir = __DIR__;
include_once "$dir/../program.php";

abstract class Page extends Program
{

    private $sended_page;
    protected $http_action;

    public function __construct($rc, $plugin, $action, $page_to_send) {
        parent::__construct($rc, $plugin);
        $this->sended_page = $page_to_send;
        $this->http_action = $action;
    }  

    public function init()
    {
        $this->before_init();
        $this->register_action($this->http_action, [$this, "page"]);
        $this->after_init();
    }

    protected function before_init() {}
    protected function after_init() {}

    public function page()
    {
        $this->before_page();
        $this->before_send();
        $this->send_action();
    }

    protected function before_page() {}

    protected function set_handlers() {}

    protected function register_handlers($array)
    {
        $this->rc->output->add_handlers($array);
    }

    protected function before_send() {
        $this->set_handlers();
    }

    abstract protected function do_send(); 

    protected function send_action()
    {
        if ($this->do_send())
            $this->send($this->sended_page);
    }

    protected function get_sended_page()
    {
        return $this->sended_page;
    }

    

}