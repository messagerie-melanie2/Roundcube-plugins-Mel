<?php
/**
 * Plugin Mél Courrielleur
*
* Skin courrielleur pour la task settings
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

class mel_courrielleur extends rcube_plugin
{
    /**
     *
     * @var string
     */
    public $task = 'settings|jappix|owncloud|ariane';
    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    function init()
    {
        if (isset($_GET['_courrielleur'])) {
            // Ajout du css
            $this->include_stylesheet('skins/courrielleur.css');
            // Variable d'env courrielleur
            rcmail::get_instance()->output->set_env('courrielleur', true);
            // Définition des hooks
            $this->add_hook('authenticate', array(
                $this,
                'authenticate'
            ));
        }
    }
    
    /**
     * authenticate hook for courrielleur
     * Add valid request
     */
    public function authenticate($args) {
        $args['valid'] = true;
        return $args;
    }
}