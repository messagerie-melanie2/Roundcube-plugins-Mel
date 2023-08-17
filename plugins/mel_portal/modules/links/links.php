<?php
class Links extends Module
{
    public const NUMBER_LASTS_MAILS = 3;

    function init() {
        $this->edit_row_size(12);
        $this->edit_order(5);
        $this->set_name('Applications');
        // $this->set_icon('mail');
    }

    function generate_html() {
        $datas = $this->plugin->api->exec_hook('mel.portal.links.html', [
            'html' => ''
        ]);

        return $datas['html'] ?? '';
    }
}