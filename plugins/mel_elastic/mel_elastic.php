<?php
class mel_elastic extends rcube_plugin
{
    public $tasks = '.*';
    private $rc;
    private $skinPath;
    private $cssFolders = ["styles"];
    private $css = ["icofont.css"];

    function init()
    {
        $this->skinPath = getcwd()."/skins/mel_elastic";
        $this->rc = rcmail::get_instance();
        if ($this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->load_css();
            $this->load_folders();
            $this->add_texts('localization/', true);
            $this->rc->output->set_env("button_add", 
            '<div class="mel-add" onclick="¤¤¤">
                <span style="position:relative">'.$this->gettext('add').'<span class="icofont-plus-circle plus"></span></span>
            </div>'
        );
        }
    }

    function load_css()
    {
        $size = count($this->css);
        for ($i=0; $i < $size; ++$i) { 
            $this->include_stylesheet('/'.$this->css[$i]);
        }
    }

    function load_folders()
    {
        foreach ($this->cssFolders as $id => $folder) {
            $tmp = scandir($this->skinPath."/".$folder);
            if ($tmp !== false)
            {
                $size = count($tmp);
                for ($i=0; $i < $size; $i++) { 
                    if (strpos($tmp[$i],".css") !== false)
                        $this->include_stylesheet('/'.$folder."/".$tmp[$i]);
                }
            }
        }
    }
}