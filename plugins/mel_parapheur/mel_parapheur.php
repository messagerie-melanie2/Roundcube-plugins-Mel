<?php 
/**
 * Plugin Mél Portail
 *
 * Portail web
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
class mel_parapheur extends bnum_plugin
{
    public $task = '.*';
    const JS_PATH = '/js/';
    public const TASK_NAME = 'parapheur';

    /**
     * Méthode héritée de rcube_plugin
     * pour l'initialisation du plugin
     * @see rcube_plugin::init()
     */
    function init()
    {
        $this->load_config();

        switch ($this->rc()->task) {
            case 'settings':
                $this->add_hook('mel_metapage.navigation.apps', array($this, 'gestion_apps'));
                break;
            
            default:
                # code...
                break;
        }

        if (true === $this->get_config('enabled')) {
            $this->add_texts('localization/', true);

            switch ($this->rc()->task) {
                case self::TASK_NAME:
                    $this->register_task(self::TASK_NAME);
                    $this->start_parapheur();
                    break;

                default:
                    if ($_SERVER['REQUEST_METHOD'] === 'GET'){
                        // Ajoute le bouton en fonction de la skin
                        $need_button = 'taskbar';
                        if (class_exists("mel_metapage")) {
                            $need_button = $this->rc()->plugins->get_plugin('mel_metapage')->is_app_enabled('app_parapheur', false) ? $need_button : 'otherappsbar';
                        }
                    
                        if ($need_button)
                        {
                            $this->add_button(array(
                                'command' => self::TASK_NAME,
                                'class'	=> 'parapheur',
                                'classsel' => 'parapheur selected',
                                'innerclass' => 'inner',
                                'label'	=> 'parapheur',
                                'title' => '',
                                'type'       => 'link',
                                'domain' => "mel_parapheur",
                                'href' => './?_task='.self::TASK_NAME,
                                'style' => 'order:17'
                            ), $need_button);
                        }
                    }
                    break;
            }
            
        }
    }

    function start_parapheur() {
        $this->register_action('index', array($this, 'index'));
    }

    function index() {
        $this->rc()->output->add_handlers(array(
            'parapheur-frame' => array(
                            $this,
                            'parapheur_frame'
            )
        ));

        $this->include_stylesheet($this->local_skin_path() . '/style.css');

        $this->rc()->output->set_pagetitle('Parapheur');
        $this->rc()->output->send('mel_parapheur.index');
    }

    /**
     * Gestion de la frame
     * 
     * @param array $attrib            
     * @return string
     */
    public function parapheur_frame($attrib) {
        $attrib['src'] = $this->get_config('url');

        return $this->rc()->output->frame($attrib);
    }

    public function gestion_apps($args) {
        if (!$this->is_parapheur_enabled()) {
            $args['apps'] = mel_helper::Enumerable($args['apps'])->where(function($key) {
                return $key !== 'app_parapheur';
            })->toArray();
        }

        return $args;
    }

    protected function get_config($key, $default = null) {
        return $this->rc()->config->get('parapheur', [])[$key];
    }

    public function is_parapheur_enabled() {
        return $this->get_config('enabled');
    }

    public static function is_enabled() {
        $plugins = rcmail::get_instance()->plugins;
        return $plugins->is_loaded('mel_parapheur') && $plugins->get_plugin('mel_parapheur')->is_parapheur_enabled();
    } 
}