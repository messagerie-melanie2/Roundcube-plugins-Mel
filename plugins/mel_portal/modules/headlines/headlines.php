<?php

class Headlines extends Module
{
    function init()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[Headlines->init] Initialisation....");
        $this->edit_row_size(2);
        //$this->load_config();
    }

    function generate_html()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[Headlines->generate_html] Génération du html....");
        $plugin_news = $this->rc->plugins->get_plugin("mel_news");
        $news = mel_news::load_last_dn_news(mel_news::get_user_dn());
        $html = "";

        if (isset($news[0]->id))
        {
            $html .= html::div(
                array("class" => "--row --row-dwp--under"),
                html::div(
                    array("class" => "--col-dwp--under --under-col-first --col-dwp-half --col-dwp "),
                    $news[0]->html($plugin_news->load_news_model(), $plugin_news, null, $this->text("headline"))//$this->html_square_hbf($this->text("headline"), "he1", "be1", "fe1", null, 'headlines_contents')
                    ).(isset($news[1]->id) ? html::div(
                        array("class" => "--col-dwp--under --col-dwp-half --col-dwp "),
                        $news[1]->html($plugin_news->load_news_model(), $plugin_news, "margin-top: 41px;")//$this->html_square_hbf('Flash info', "he2", "be2", "fe2", 'headlines_fi_block', 'headlines_fi_contents')
                        ) : ""));
        }
        else 
        {
            //$this->text("headline")
            $html = html::div([], 
            html::tag("h2", [], $this->text("headline")).
            $this->html_square("", null, null, 
                html::tag("div", ["style" => "margin:15px"], $this->rc->plugins->get_plugin('mel_news')->gettext("no_news", "mel_news"))
            )
            
        );
            //$html = $this->text("no_news", "mel_news");
        }


        return $html;
    }

    function include_js()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[Headlines->include_js] Inclusion du js....");
        // $this->plugin->include_script($this->folder().'/headlines/js/headlines.js');
    }

    function set_js_vars()
    {
        // mel_logs::get_instance()->log(mel_logs::DEBUG, "[Headlines->set_js_vars] Inclusion des variables....");
        // $headlines = $this->config;
        // $this->rc->output->set_env('mp_headlines', $headlines);
    }

    function include_css()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[Headlines->include_css] Inclusion du css....");
        $this->plugin->include_stylesheet('modules/headlines/css/headlines.css');
    }

}