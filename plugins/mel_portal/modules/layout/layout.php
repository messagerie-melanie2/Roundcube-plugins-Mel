<?php
class Layout extends Module
{
    function init() {
        $this->edit_row_size(0);
        $this->set_use_custom_style(true);
    }

    function generate_html() {
        return '';
    }
} 