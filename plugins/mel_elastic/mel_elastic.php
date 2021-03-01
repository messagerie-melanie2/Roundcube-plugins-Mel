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
    private $css = ["icofont.css"];

    function init()
    {
        $this->skinPath = getcwd()."/skins/mel_elastic";
        $this->rc = rcmail::get_instance();
        if ($this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->load_css();
            //$this->include_script('../../skins/elastic/ui.js');
            $this->include_script('../../skins/mel_elastic/ui.js');
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