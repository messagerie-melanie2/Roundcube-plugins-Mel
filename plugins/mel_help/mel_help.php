<?php

/**
 * Plugin Mél Help
 *
 * plugin Mél pour afficher la page d'aide aux utilisateurs
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

class mel_help extends rcube_plugin
{
  /**
   *
   * @var string
   */
  public $task = '?(?!login).*';
  /**
   * @var  rcmail The one and only instance
   */
  public $rc;

  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  function init()
  {
    $this->rc = rcmail::get_instance();

    // Ajout du css
    $skin_path = $this->local_skin_path();
    if ($this->rc->output->get_env('ismobile') && strpos($skin_path, '_mobile') === false) {
      $skin_path .= '_mobile';
    }

    // ajout de la tache
    $this->register_task('help');

    // // Ajoute le bouton en fonction de la skin
    // if ($this->rc->config->get('ismobile', false)) {
    //     $this->add_button(array(
    //         'command' => 'help',
    //         'class'	=> 'button-mel_help ui-link ui-btn ui-corner-all ui-icon-info ui-btn-icon-left',
    //         'classsel' => 'button-mel_help button-selected ui-link ui-btn ui-corner-all ui-icon-info ui-btn-icon-left',
    //         'innerclass' => 'button-inner',
    //         'label'	=> 'mel.help',
    //     ), 'taskbar_mobile');
    //   } else {
    //     $this->include_stylesheet($skin_path . '/styles.css');
    //     $taskbar = $this->rc->config->get('skin') == 'mel_larry' ? 'taskbar_mel' : 'taskbar';
    //     $this->add_button(array(
    //         'command' => 'help_open_dialog',
    //         'class'	=> 'button-mel_help',
    //         'classsel' => 'button-mel_help button-selected',
    //         'innerclass' => 'button-inner',
    //         'label'	=> 'mel.help',
    //         'title'	=> 'mel.help_title',
    //     ), $taskbar);
    // }

    // Include general js
    $this->include_script('help.js');

    // Help action
    $help_action = rcube_utils::get_input_value('_help_action', rcube_utils::INPUT_GET);
    if (isset($help_action)) {
      $this->rc->output->set_env('help_action', $help_action);
    }


    // Chargement de la conf
    $this->load_config();
    $this->add_texts('localization/', false);
    $this->add_texts('localization/', ['help search no result','video search no result','help no result', 'help search open', 'help action open']);
    $this->include_stylesheet($skin_path . '/mel_help.css');
    // Index
    $this->register_action('index', array($this, 'action'));
    // Include js
    $this->include_script('mel_help.js');
    $this->rc->output->set_env('help_page', $this->rc->config->get('help_page', null));
    $this->rc->output->set_env('help_suggestion_url', $this->rc->config->get('help_suggestion_url', null));
    $this->rc->output->set_env('help_channel_support', $this->rc->config->get('help_channel_support', null));
    $this->rc->output->set_env('help_video', $this->rc->config->get('help_video', null));

  }

  function action()
  {
    // register UI objects
    $this->rc->output->add_handlers(array(
      'help_pages'        => array($this, 'help_pages'),
      'no_result_help'    => array($this, 'no_result_help'),
      'help_news'         => array($this, 'help_news'),
    ));

    // Récupération du json
    $help_array = json_decode(file_get_contents(__DIR__ . '/public/help.json'), true);

    // Génération de l'index
    $index = [];
    foreach ($help_array as $k => $s) {
      foreach ($s['keywords'] as $word) {
        if (isset($index[$word])) {
          if (!in_array($k, $index[$word])) {
            $index[$word][] = $k;
          }
        } else {
          $index[$word] = [$k];
        }
      }
      unset($help_array[$k]['keywords']);
    }
    // Positionnement des variables d'env
    $this->rc->output->set_env('help_array', json_encode($help_array));
    $this->rc->output->set_env('help_index', json_encode($index));

    self::video_json();

    // Chargement du template d'affichage
    $this->rc->output->set_pagetitle($this->gettext('title'));
    $this->rc->output->send('mel_help.mel_help');
  }

  function video_json()
  {
    // Récupération du json
    $video_array = json_decode(file_get_contents(__DIR__ . '/public/video.json'), true);

    // Génération de l'index
    $index = [];
    foreach ($video_array as $k => $s) {
      foreach ($s['keywords'] as $word) {
        if (isset($index[$word])) {
          if (!in_array($k, $index[$word])) {
            $index[$word][] = $k;
          }
        } else {
          $index[$word] = [$k];
        }
      }
      unset($video_array[$k]['keywords']);
    }
    // Positionnement des variables d'env
    $this->rc->output->set_env('video_array', json_encode($video_array));
    $this->rc->output->set_env('video_index', json_encode($index));
  }

  /**
   * Gestion des pages d'aide
   * @param array $attrib
   * @return string
   */
  function help_pages($attrib)
  {
    if (!$attrib['id'])
      $attrib['id'] = 'rcmhelppages';

    // Get the current help page with current task and action parameters
    $current_task = rcube_utils::get_input_value('_current_task', rcube_utils::INPUT_GET);
    $current_action = rcube_utils::get_input_value('_current_action', rcube_utils::INPUT_GET);
    $current_help_page = null;

    if (isset($current_task) && !empty($current_task)) {
      $this->require_plugin('mel_onboarding');
      $current_help_pages = $this->rc->config->get('help_page_onboarding', []);
      if (isset($current_action) && !empty($current_action) && isset($current_help_pages[$current_task . '/' . $current_action])) {
        $current_help_page = $current_help_pages[$current_task . '/' . $current_action];
      } else if (isset($current_help_pages[$current_task])) {
        $current_help_page = $current_help_pages[$current_task];
      }
    }

    $html = '';
    $help_page = $this->rc->config->get('help_page', null);
    if (isset($help_page)) {
      $html .= html::span(['class' => 'helppage general'], html::a(['href' => $help_page, 'target' => '_blank', 'title' => $this->gettext('help page title')], $this->gettext('help page')));
    }

    if (isset($current_help_page)) {
      $html .= html::span(['class' => 'helppage current'], html::a(['href' => '#', 'onclick' => "rcmail.current_page_onboarding('$current_task')", 'title' => $this->gettext('help current page title')], $this->gettext('help current page')));
    }

    $suggestion_url = $this->rc->config->get('help_suggestion_url', null);
    if (isset($suggestion_url) && !$this->rc->config->get('ismobile', false)) {
      $html .= html::span(['class' => 'helppage suggestion'], html::a(['href' => $suggestion_url, 'target' => '_blank', 'title' => $this->gettext('make a suggestion title')], $this->gettext('make a suggestion')));
    }

    return html::div($attrib, $html);
  }

  /**
   * Gestion des actualitées
   * @param array $attrib
   * @return string
   */
  function help_news($attrib)
  {
    if (!$attrib['id'])
      $attrib['id'] = 'rcmhelpnews';

    $attrib['class'] = 'help_news';

    // Récupération du json
    $help_news = json_decode(file_get_contents(__DIR__ . '/public/news.json'), true);

    $html = html::span(['class' => 'label'], $this->gettext('news'));
    $list_news = '';

    // Parcourir les news pour les passer en html
    foreach ($help_news as $news) {
      $title = html::span(['class' => 'title'], $news['title']);
      $description = html::span(['class' => 'description'], $news['description']);
      $date = html::span(['class' => 'date'], $news['date']);
      $buttons = '';
      if (isset($news['buttons']) && is_array($news['buttons'])) {
        $_b = '';
        foreach ($news['buttons'] as $button) {
          if (!$this->rc->config->get('ismobile', false) || $button['class'] != "action") {
            $_b .= html::a(['class' => 'button ' . $button['class'], 'target' => '_blank', 'href' => $button['href'], 'title' => $button['tooltip']], $button['name']);
          }
        }
        $buttons .= html::div(['class' => 'buttons'], $_b);
      }
      $list_news .= html::tag('li', ['class' => 'news'], $date . $title . $description . $buttons);
    }
    $html .= html::tag('ul', ['class' => 'news'], $list_news);
    return html::div($attrib, $html);
  }


  /**
   * Affichage des contacts de support
   * @param array $attrib
   * @return string
   */
  function no_result_help($attrib)
  {
    if (!$attrib['id'])
      $attrib['id'] = 'rcmhelpsupport';

    $html = html::span(['class' => 'label'], $this->gettext('help no result'));
    $html .= html::div(
      ['class' => 'helplinks'],
      html::span(['class' => 'helplink'], html::a(['href' => $this->rc->config->get('help_channel_support', ''), 'target' => '_blank', 'class' => 'button', 'title' => $this->gettext('help no result channel title')], $this->gettext('help no result channel')))
    );

    return html::div($attrib, $html);
  }
}
