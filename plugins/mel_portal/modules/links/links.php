<?php
declare(strict_types = 1);

/**
 * Module « Applications » : html fourni par le hook `mel.portal.links.html`.
 */
class Links extends Module
{
    public function init(): void
    {
        $this->edit_row_size(12);
        $this->edit_order(5);
        $this->set_name('Applications');
    }

    protected function generate_html(): string
    {
        $datas = $this->plugin->api->exec_hook('mel.portal.links.html', [
            'html' => '',
        ]);

        return (string) ($datas['html'] ?? '');
    }
}
