<?php
include_once 'lib/mail.php';
class Mails extends Module
{
    public const NUMBER_LASTS_MAILS = 3;

    function init() {
        $this->edit_row_size(4);
        $this->edit_order(0);
        $this->set_name('Courriers récents');
        $this->set_icon('mail');
    }

    function generate_html() {
        return html::p([], 'Chargement des mails...');
    }

    private function _get_lasts_email($how_many) {
        $this->rc->get_storage()->set_pagesize($how_many);
        $msgs = $this->rc->get_storage()->list_messages('INBOX', null, 'ARRIVAL');
        $msgs = mel_helper::Enumerable($msgs)->select(function ($k, $v) {return new Mail($v);})->toArray();

        return $msgs;
    }

    public function get_lasts_mails() {
        $mails = $this->_get_lasts_email(self::NUMBER_LASTS_MAILS);
        echo json_encode($mails);
        exit;
    }

    public function register_actions() {
        $this->register_action('mails_get', $this, 'get_lasts_mails');
        return null;
    }
}