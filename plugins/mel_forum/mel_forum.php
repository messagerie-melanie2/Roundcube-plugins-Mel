<?php
/**
 * Plugin Forum
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

class mel_forum extends rcube_plugin
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

        // Chargement de la conf
        $this->load_config();
        // Gestion des différentes langues
        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/mel_forum.css');

        // ajout de la tache
        $this->register_task('forum');
        
        if ($rcmail->task === "forum"){
            $this->register_action('index', [$this, 'action']);
            $this->register_action('test', array($this,'test'));
            $this->register_action('elements', array($this, 'elements'));
        }
    }

    function test()
        {
            $a=2;
            $b=4;
            $c=$a+$b;

            echo($c);
            exit;
        }

    function elements()
    {
        // Les données à envoyer en JSON
        $data = ['dorian', 'arnaud', 'thomas', 'julien', 'stéphanie'];

        // Ajout d'un en-tête pour spécifier que la réponse est en JSON
        header('Content-Type: application/json');

        // Envoie de la réponse JSON
        echo json_encode($data);

        // Arrêt de l'exécution du script
        exit;
    }

    
    
         
        
    function action()
    {
        $rcmail = rcmail::get_instance();

        $rcmail->output->send('mel_forum.forum');
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
        $rcmail->output->set_env('display_tchap_sidebar', $rcmail->config->get('display_tchap_sidebar', null));

    	return $rcmail->output->frame($attrib);
    }
    /**
     * Bloquer les refresh
     * @param array $args
     */
    function refresh($args) {
      return array('abort' => true);
    }
    function sidebar()
    {
        $data = $this->get_input_post('_showsidebar');
        $this->rc()->user->save_prefs(['display_tchap_sidebar' => $data]);
    }
    
}