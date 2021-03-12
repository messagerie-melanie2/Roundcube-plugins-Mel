<?php
/**
 * Plugin Mél Espace de travail
*
* Permet aux utilisateurs d'envoyer des suggestions depuis le menu parametres
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

class mel_workspace extends rcube_plugin
{
    /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;


    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->setup();
        $this->register_action('create', array($this, 'create'));

    }

    function setup()
    {
        $this->rc = rcmail::get_instance();
        //$this->load_config();
        //$this->setup_config();
        //$this->add_texts('localization/', true);
        $this->register_task("workspace");

        // Ajoute le bouton en fonction de la skin
        // $this->add_button(array(
        //     'command' => $this->taskName,
        //     'class'	=> 'button-home order1 icofont-home',
        //     'classsel' => 'button-home button-selected order1 icofont-home',
        //     'innerclass' => 'button-inner',
        //     'label'	=> 'portal',
        //     'title' => '',
        //     'type'       => 'link',
        //     'domain' => "mel_portal"
        // ), $this->sidebarName);
    }

}