<?php
/**
 * Plugin Mel Elastic
 *
 * Apply plugins css for mel_elastic skin
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_elastic extends rcube_plugin
{
    public $tasks = '.*';
    private $rc;
    /**
     * Chemin du skin
     */
    private $skinPath;
    /**
     * Liste des dossiers où il faut charger tout les fichiers css.
     */
    private $cssFolders = ["styles"];
    /**
     * Liste des fichiers css à charger.
     */
    private $css = ["icofont.css", "jquery.datetimepicker.min.css", "mel-icons.css"];

    function init()
    {
        $this->skinPath = getcwd()."/skins/mel_elastic";
        $this->rc = rcmail::get_instance();
        if ($this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->add_hook('preferences_list', array($this, 'prefs_list'));
            $this->add_hook('preferences_save',     array($this, 'prefs_save'));
            $this->load_css();
            //$this->include_script('../../skins/elastic/ui.js');
            $this->include_script('../../skins/mel_elastic/ui.js');
            $this->include_script('../../skins/mel_elastic/jquery.datetimepicker.full.min.js');
            $this->load_folders();
            $this->add_texts('localization/', true);
            //$this->add_hook('messages_list', [$this, 'mail_messages_list']);
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

        $this->load_css_font();
    }

    function load_css_font()
    {
        //$this->rc->config->get('custom-font-size', "sm")
        $this->include_stylesheet("/fonts/fontsize_".$this->rc->config->get('custom-font-size', "sm").".css");
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

    public function mail_messages_list($p)
    {

        $count = count($p["messages"]);
        for ($i=0; $i < $count; ++$i) { 
            $tmp = $p["messages"][$i]->from;
            $p["messages"][$i]->from = $p["messages"][$i]->subject;
            $p["messages"][$i]->subject = $tmp;
        }

        return $p;
    }

    public function prefs_list($args) {

        if ($args['section'] == 'general') {
          // Load localization and configuration
          $this->add_texts('localization/');
    
          $text_size = "mel-text-size";
    
          // Check that configuration is not disabled
          $config = $this->rc->config->get('custom-font-size', 'lg');
    
          $options = [
                $text_size => [
                    $this->gettext("smaller", "mel_elastic"),
                    $this->gettext("normal", "mel_elastic")
                ],
            ];
    
            // $args['blocks']['main']['options'][$text_size] = null;
        $attrib = [];
    
        $attrib['name'] = $text_size;
        $attrib['id'] = $text_size;
    
        $input = new html_select($attrib);   
        $input->add($options[$text_size], ["sm", "lg"]);
        
    
        unset($attrib['name']);
        unset($attrib['id']);
        $attrib["for"] = $text_size;
    
        $args['blocks']['main']['options'][$text_size] = array(
            'title' => html::label($attrib, rcube::Q($this->gettext($text_size, "mel_elastic"))),
            'content' => $input->show($config),
          );
          
        }
    
        return $args;
      }


      public function prefs_save($args) {
        if ($args['section'] == 'general') {
    
            $this->add_texts('localization/');
    
            $text_size = "mel-text-size";
    
            // Check that configuration is not disabled
            $config = $this->rc->config->get('custom-font-size', 'lg');
    
            $config = rcube_utils::get_input_value($text_size, rcube_utils::INPUT_POST);
          
    
          $args['prefs']["custom-font-size"] = $config;
          
        //   $this->rc->output->set_env("custom-font-size", $config);
        }
    
        return $args;
      }
}