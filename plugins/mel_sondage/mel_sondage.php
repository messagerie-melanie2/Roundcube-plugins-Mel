<?php
/**
 * Plugin Mél Sondage
*
* plugin mel pour les sondages
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

class mel_sondage extends rcube_plugin
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

        $this->add_hook('logout_after', array($this, 'logout_after'));
        //$this->add_hook('refresh', array($this, 'refresh'));

        // Chargement de la conf
        $this->load_config();
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/mel_sondage.css');

        // ajout de la tache
        $this->register_task('sondage');

        if (mel::is_internal()) {
    	    $sondage_url = $rcmail->config->get('sondage_url');
    	} else {
    	    $sondage_url = $rcmail->config->get('sondage_external_url');
    	}
        
        $rcmail->output->set_env('sondage_url', $sondage_url);
        
        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($sondage_url, 'sondage');
        // Ajoute le bouton en fonction de la skin
        
        $need_button = $rcmail->config->get('skin') == 'mel_larry' ? 'taskbar_mel' : 'taskbar';

        if (class_exists("mel_metapage")) {
          $need_button = $rcmail->plugins->get_plugin('mel_metapage')->is_app_enabled('app_survey') ? $need_button : 'otherappsbar';

        if ('bnum' === $rcmail->task && ($rcmail->action === '' || $rcmail->action === 'index')) {
            $this->include_script('sondage_init.js');
        }
          
        }

        if ($need_button)
        {
            if ($rcmail->config->get('ismobile', false)) {
                $this->add_button(array(
                    'command' => 'sondage',
                    'class'	=> 'button-mel_sondage ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
                    'classsel' => 'button-mel_sondage button-selected ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
                    'innerclass' => 'button-inner',
                    'label'	=> 'mel_sondage.task',
                ), 'taskbar_mobile');
            } else {
                $this->add_button(array(
                    'command' => 'sondage',
                    'class'	=> 'button-mel_sondage icon-mel-sondage sondage',
                    'classsel' => 'button-mel_sondage button-selected icon-mel-sondage sondage',
                    'innerclass' => 'button-inner inner',
                    'label'	=> 'mel_sondage.task',
                    'title' => 'mel_sondage.sondages_title',
                    'type'       => 'link'
                ), $need_button);
            }
        }

        // Si tache = sondage, on charge l'onglet
        if ($rcmail->task == 'sondage' || ($rcmail->task == 'workspace' && $rcmail->action === 'workspace')) {
            $this->register_action('index', array($this, 'action'));
            $rcmail->output->set_env('refresh_interval', 0);
            $this->login_sondage(!($rcmail->task == 'workspace' && $rcmail->action === 'workspace'));
        } elseif ($rcmail->task == 'mail'
                    || $rcmail->task == 'addressbook'
                    || $rcmail->task == 'calendar'
                    || $rcmail->task == 'jappix') {
            // Appel le script de de gestion des liens vers le sondage
            if (!class_exists("mel_metapage")) $this->include_script('sondage_link.js');
            $rcmail->output->set_env('sondage_apppoll_url', $rcmail->url(array("_task" => "sondage", "_params" => "%%other_params%%")));
            $rcmail->output->set_env('sondage_external_url', $rcmail->config->get('sondage_external_url'));
            $rcmail->output->set_env('sondage_create_sondage_url', $rcmail->config->get('sondage_create_sondage_url'));
        }
        else{
            $rcmail->output->set_env('sondage_create_sondage_url', $rcmail->config->get('sondage_create_sondage_url'));
        }
    }

    function action()
    {
        $rcmail = rcmail::get_instance();
        // register UI objects
        $rcmail->output->add_handlers(array(
        		'mel_sondage_frame'    => array($this, 'sondage_frame'),
        ));

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC); 
        if ($startupUrl !== null && $startupUrl !== "") $rcmail->output->set_env("sondage_startup_url", $startupUrl);

        // Chargement du template d'affichage
        $rcmail->output->set_pagetitle($this->gettext('title'));
        $rcmail->output->send('mel_sondage.mel_sondage');
    }
    /**
     * Appel apres l'appel au logout
     * @param array $args
     */
    function logout_after($args) {
    	$rcmail = rcmail::get_instance();
    	if (mel::is_internal()) {
    	    $sondage_url = $rcmail->config->get('sondage_url');
    	} else {
    	    $sondage_url = $rcmail->config->get('sondage_external_url');
    	}
    	$rcmail->output->set_env('sondage_url', $sondage_url);
    	// Appel le script de deconnexion du sondage
    	$this->include_script('disconnect.js');
    }
    /**
     * Gestion de la frame
     * @param array $attrib
     * @return string
     */
    function sondage_frame($attrib)
    {
    	if (!$attrib['id'])
    		$attrib['id'] = 'rcmsondageframe';

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
    /**
     * Méthode pour se logger dans l'application de sondage
     */
    private function login_sondage($include_script = true) {
    	$rcmail = rcmail::get_instance();
    	if (mel::is_internal()) {
    	    $sondage_url = $rcmail->config->get('sondage_url');
    	} else {
    	    $sondage_url = $rcmail->config->get('sondage_external_url');
    	}
    	// Configuration de l'environnement
    	$rcmail->output->set_env('sondage_username', urlencode($rcmail->user->get_username()));
    	$rcmail->output->set_env('sondage_password', urlencode($rcmail->get_user_password()));
    	$rcmail->output->set_env('sondage_timezone', urlencode($rcmail->config->get('timezone', null)));
    	$rcmail->output->set_env('sondage_url', $sondage_url);
    	if (isset($_GET['_params'])) {
    	  $skin = $rcmail->config->get("skin");
    	  $params = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);
    	  $rcmail->output->set_env('sondage_gotourl', $sondage_url . $params . "&_skin=$skin");
    	}
    	else {
    	  $skin = $rcmail->config->get("skin");
    		$rcmail->output->set_env('sondage_gotourl', $sondage_url . "?_skin=$skin");
    	}

    	// Appel le script de connexion du sondage
    	if ($include_script) $this->include_script('sondage.js');
    }
}