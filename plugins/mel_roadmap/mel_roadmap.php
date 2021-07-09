<?php
/**
 * Plugin Mél Roadmap
 *
 * plugin Mél pour l'acces aux fichiers partagés
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

class mel_roadmap extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = 'settings';

  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $rcmail = rcmail::get_instance();
    if ($rcmail->task == 'settings' && !$rcmail->config->get('ismobile', false)) {
      // Chargement de la conf
      $this->load_config();
      // MANTIS 0006196: Ne pas afficher la feuille de route MélWeb Wekan pour les agents du MAA
      $filtered_dn = $rcmail->config->get('roadmap_filtered_dn', []);
      if (count($filtered_dn)) {
        $user = driver_mel::gi()->getUser();
        foreach ($filtered_dn as $dn) {
          if (strpos($user->dn, $dn) !== false) {
            return;
          }
        }
      }
      $this->add_texts('localization/', false);
      $this->add_hook('settings_actions', array($this, 'settings_actions'));
      $this->api->register_action('plugin.mel_roadmap', $this->ID, array(
          $this,
          'settings'
      ));
    }
  }

  /**
   * Adds Filters section in Settings
   */
  function settings_actions($args)
  {
    $args['actions'][] = array(
        'action' => 'plugin.mel_roadmap',
        'class'  => 'roadmap',
        'label'  => 'roadmap',
        'domain' => 'mel_roadmap',
        'title'  => 'roadmaptitle',
    );
    return $args;
  }

  function settings() {
    $rcmail = rcmail::get_instance();
    // Chargement de la conf
    $this->load_config();
    // Ajout du css
    $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
    // register UI objects
    $rcmail->output->add_handlers(array(
            'mel_roadmap_frame' => array(
                    $this,
                    'roadmap_frame'
            )
    ));
    // Appel le script d'affichage de la roadmap
    $this->include_script('roadmap.js');
    // Chargement du template d'affichage
    $rcmail->output->set_pagetitle($this->gettext('roadmap'));
    $rcmail->output->set_env('roadmap_url', $rcmail->config->get('roadmap_url'));
    $rcmail->output->send('mel_roadmap.settings');
  }

  /**
   * Gestion de la frame
   *
   * @param array $attrib
   * @return string
   */
  function roadmap_frame($attrib) {
    if (! $attrib['id'])
      $attrib['id'] = 'rcmroadmapframe';

    $rcmail = rcmail::get_instance();

    $attrib['name'] = $attrib['id'];

    $rcmail->output->set_env('contentframe', $attrib['name']);
    $rcmail->output->set_env('blankpage', $attrib['src'] ? $rcmail->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

    return $rcmail->output->frame($attrib);
  }
}