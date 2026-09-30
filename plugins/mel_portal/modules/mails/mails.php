<?php
declare(strict_types = 1);

include_once __DIR__ . '/lib/mail.php';

/**
 * Module « Courriers récents » : derniers messages de la boîte de réception.
 */
class Mails extends Module
{
    public const NUMBER_LASTS_MAILS = 3;

    #[\Override]
    public function init(): void
    {
        $this->edit_row_size(4);
        $this->edit_order(0);
        $this->set_use_custom_style(true);
    }

    /**
     * Action AJAX : renvoie les derniers messages de INBOX en JSON.
     *
     * @return array<int, Mail>
     */
    #[BnumAction('mails_get', csrf: true, json: true)]
    public function get_lasts_mails(): array
    {
        $storage = $this->rc->get_storage();
        $storage->set_pagesize(self::NUMBER_LASTS_MAILS);

        return array_map(Mail::from_header(...), $storage->list_messages('INBOX', null, 'ARRIVAL'));
    }

    #[\Override]
    protected function generate_html(): string
    {
        return html::tag('bnum-card-email', ['loading' => 'true', 'data-url' => $this->rc->url(['_task' => 'mail'])]);
    }
}
