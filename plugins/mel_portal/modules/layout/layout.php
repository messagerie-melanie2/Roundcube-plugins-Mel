<?php
declare(strict_types = 1);

/**
 * Module de mise en page : n'affiche rien.
 */
class Layout extends Module
{
    #[\Override]
    public function init(): void
    {
        $this->edit_row_size(0);
        $this->set_use_custom_style(true);
    }

    #[\Override]
    protected function generate_html(): string
    {
        return '';
    }
}
