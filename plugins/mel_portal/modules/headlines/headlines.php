<?php

class Headlines extends Module
{
    function init()
    {
        $this->edit_row_size(8);
    }

    function generate_html()
    {
        return html::div(
            array("class" => "row"),
            html::div(
                array("class" => "col-md-8"),
                $this->html_square_hbf("A la une", "he1", "be1", "fe1", null, 'headlines_contents')
                ).html::div(
                    array("class" => "col-md-4"),
                    $this->html_square_hbf('Flash info', "he2", "be2", "fe2", 'headlines_fi_block', 'headlines_fi_contents')
                    ));
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/headlines/js/headlines.js');
    }

    function set_js_vars()
    {
        $headlines = array( "news" => array(), "fi" => array() );
        $headlines["news"][0] = array("header" => "Info service",
        "body" => "Publication du référentiel des outils et services",
        "footer" => "#Numerique");
        $headlines["fi"]["header"] = "Flash info";
        $headlines["fi"]["body"] = "<h3>Avis de travaux</h3><br/>Jeudi 19 novembre 2020 de 21h à 1h.<br/>Vérification des groupes électrogènes pouvant conduire à des coupures électriques.";
        $this->rc->output->set_env('mp_headlines', $headlines);
    }

    function include_css()
    {
        $this->plugin->include_stylesheet('modules/headlines/css/headlines.css');
    }

}