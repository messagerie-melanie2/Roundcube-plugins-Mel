<?php
class Left_Menu extends Module
{

    private $user_config;
    private $current_page;
    function init()
    {
        include_once "conf.php";
        $this->config = $config;
        $a = 0;
    }

    function set_user_config($conf)
    {
        $this->user_config = $conf;
    }

    function set_current_menu($current)
    {
        $this->current_page = $current;
    }

    function generate_html()
    {
        if ($this->user_config == null)
            $this->user_config = array("all");
        if (array_search("all", $this->user_config, true) != false)
        {
            $tmp = array();
            $it = 0;
            foreach ($this->config as $key => $value) {
                $tmp[$it++] = $key;
            }
            return $this->generate_items($tmp);
        }
        else
            return $this->generate_items($this->user_config);
    }

    function generate_items($array)
    {
        //rcmail.url("indexx", "mel_portal");
        $size = count($array);
        //$html = '<ul class=menu_left_ul>';
        for ($i=0; $i < $size; ++$i) { 
            $html = $html.html::tag("p", array("class" => "menu_left_content".(($this->current_page == $array[$i]) ? " selected" : "")), 
            html::a(array("href" => '#', "onclick" => 'lm_OnClick(this, `'.$array[$i].'`)'), $this->text($this->config[$array[$i]]->name)));
        }
        //$html = $html."</ul>";
        return html::div(array("class" => "module_parent module_menu"), $html);
    }

    function include_css(){
        $this->plugin->include_stylesheet('modules/left_menu/css/left_menu.css');
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/left_menu/js/left_menu.js');
    }
}