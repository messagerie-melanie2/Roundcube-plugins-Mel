<?php
/**
 * Plugin Tchap
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

class tchap extends bnum_plugin
{
    /**
     *
     * @var string
     */
    public $task = '.*';

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    function init()
    {
        $rcmail = rcmail::get_instance();

        //$this->add_hook('refresh', array($this, 'refresh'));

        // Chargement de la conf
        $this->load_config();
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/tchap.css');

        // ajout de la tache
        $this->register_task('tchap');

        if ($rcmail->task == "tchap"){
            $this->register_action('index', array(
                $this,
                'action'
            ));
        }

        
        $tchap_url = $rcmail->config->get('tchap_url');
    	
        $rcmail->output->set_env('tchap_url', $tchap_url);
        
        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($tchap_url, 'tchap');
        // Ajoute le bouton en fonction de la skin
        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
          $need_button = $rcmail->plugins->get_plugin('mel_metapage')->is_app_enabled('app_tchap', true) ? $need_button : 'otherappsbar';
        }

        if ($need_button)
        {
            $this->add_button(array(
                'command' => 'tchap',
                'class'	=> 'button-tchap icon-tchap tchap',
                'classsel' => 'button-tchap button-selected icon-tchap tchap',
                'innerclass' => 'button-inner inner',
                'label'	=> 'tchap.task',
                'title' => 'tchap.tchap_title',
                'type' => 'link',
            ), $need_button);
        }
    }

    function action()
    {
        $rcmail = rcmail::get_instance();
        // register UI objects
        $rcmail->output->add_handlers(array(
        		'tchap_frame'    => array($this, 'tchap_frame'),
        ));

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC); 
        if ($startupUrl !== null && $startupUrl !== "") $rcmail->output->set_env("tchap_startup_url", $startupUrl);

        // Chargement du template d'affichage
        $rcmail->output->set_pagetitle($this->gettext('title'));
        // Chargement du Javascript
        $this->load_script_module('tchap.js', '/');

        $rcmail->output->send('tchap.tchap');
    }
    /**
     * Gestion de la frame
     * @param array $attrib
     * @return string
     */
    function tchap_frame($attrib)
    {
    	if (!$attrib['id'])
    		$attrib['id'] = 'rcmtchapframe';

    	$rcmail = rcmail::get_instance();

    	$attrib['name'] = $attrib['id'];

    	$rcmail->output->set_env('contentframe', $attrib['name']);
    	$rcmail->output->set_env('blankpage', $attrib['src'] ?
        $rcmail->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

    	return $rcmail->output->frame($attrib);
    }
    /**
     * Bloquer les refresh
     * @param array $args
     */
    function refresh($args) {
      return array('abort' => true);
    }
}