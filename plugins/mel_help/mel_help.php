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

class mel_help extends rcube_plugin {
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
    function init() {
        $this->rc = rcmail::get_instance();

        // Ajout du css
        $skin_path = $this->local_skin_path();
        if ($this->rc->output->get_env('ismobile') && strpos($skin_path, '_mobile') === false) {
            $skin_path .= '_mobile';
        }
        $this->include_stylesheet($skin_path . '/styles.css');

        // ajout de la tache
        $this->register_task('help');

        // Ajoute le bouton en fonction de la skin
        if (!$this->rc->config->get('ismobile', false)) {
            $taskbar = $this->rc->config->get('skin') == 'mel_larry' ? 'taskbar_mel' : 'taskbar';
            $this->add_button(array(
                'command' => 'help_open_dialog',
                'class'	=> 'button-mel_help',
                'classsel' => 'button-mel_help button-selected',
                'innerclass' => 'button-inner',
                'label'	=> 'mel.help',
                'title'	=> 'mel.help_title',
            ), $taskbar);
        }

        // Include general js
        $this->include_script('help.js');

        // Si tache = help, on charge l'onglet
        if ($this->rc->task == 'help') {
            // Chargement de la conf
            $this->load_config();
            $this->add_texts('localization/', false);
            $this->add_texts('localization/', ['help search no result', 'help search open']);
            $this->include_stylesheet($skin_path . '/mel_help.css');
            // Index
            $this->register_action('index', array($this, 'action'));
            // Include js
            $this->include_script('mel_help.js');
        }
    }

    function action() {
        // register UI objects
        $this->rc->output->add_handlers(array(
            'help_pages'        => array($this, 'help_pages'),
            'no_result_help'    => array($this, 'no_result_help'),
            'help_news'         => array($this, 'help_news'),
        ));

        // Récupération du json
        $help_array = json_decode(file_get_contents(__DIR__.'/public/help.json'), true);

        // Génération de l'index
        $index = [];
        foreach ($help_array as $k => $s) {
            foreach ($s['keywords'] as $word) {
                if (isset($index[$word])) {
                    if (!in_array($k, $index[$word])) {
                        $index[$word][] = $k;
                    }
                }
                else {
                    $index[$word] = [$k];
                }
            }
            unset($help_array[$k]['keywords']);
        }
        // Positionnement des variables d'env
        $this->rc->output->set_env('help_array', json_encode($help_array));
        $this->rc->output->set_env('help_index', json_encode($index));

        // Chargement du template d'affichage
        $this->rc->output->set_pagetitle($this->gettext('title'));
        $this->rc->output->send('mel_help.mel_help');
    }

    /**
     * Gestion des pages d'aide
     * @param array $attrib
     * @return string
     */
    function help_pages($attrib) {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmhelppages';
        
        // Get the current help page with current task and action parameters
        $current_task = rcube_utils::get_input_value('_current_task', rcube_utils::INPUT_GET);
        $current_action = rcube_utils::get_input_value('_current_action', rcube_utils::INPUT_GET);
        $current_help_page = null;

        if (isset($current_task) && !empty($current_task)) {
            $current_help_pages = $this->rc->config->get('task_help_page', []);
            if (isset($current_action) && !empty($current_action) && isset($current_help_pages[$current_task.'/'.$current_action])) {
                $current_help_page = $current_help_pages[$current_task.'/'.$current_action];
            }
            else if (isset($current_help_pages[$current_task])) {
                $current_help_page = $current_help_pages[$current_task];
            }
        }

        $html = '';
        $help_page = $this->rc->config->get('help_page', null);
        if (isset($help_page)) {
            $html .= html::span(['class' => 'helppage general'], html::a(['href' => $help_page, 'target' => '_blank', 'title' => $this->gettext('help page title')], $this->gettext('help page')));
        }
        
        if (isset($current_help_page)) {
            $html .= html::span(['class' => 'helppage current'], html::a(['href' => $current_help_page, 'target' => '_blank', 'title' => $this->gettext('help current page title')], $this->gettext('help current page')));
        }

        $suggestion_url = $this->rc->config->get('help_suggestion_url', null);
        if (isset($suggestion_url)) {
            $html .= html::span(['class' => 'helppage suggestion'], html::a(['href' => $suggestion_url, 'target' => '_blank', 'title' => $this->gettext('make a suggestion title')], $this->gettext('make a suggestion')));
        }

        return html::div($attrib, $html);
    }

    /**
     * Gestion des actualitées
     * @param array $attrib
     * @return string
     */
    function help_news($attrib) {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmhelpnews';

        $attrib['class'] = 'help_news';

        // Récupération du json
        $help_news = json_decode(file_get_contents(__DIR__.'/public/news.json'), true);

        $html = html::span(['class' => 'label'], $this->gettext('news'));
        $list_news = '';

        // Parcourir les news pour les passer en html
        foreach ($help_news as $news) {
            $title = html::span(['class' => 'title'], $news['title']);
            $description = html::span(['class' => 'description'], $news['description']);
            $buttons = '';
            if (isset($news['buttons']) && is_array($news['buttons'])) {
                $_b = '';
                foreach ($news['buttons'] as $button) {
                    $_b .= html::a(['class' => 'button', 'target' => '_blank', 'href' => $button['href'], 'title' => $button['tooltip']], $button['name']);
                }
                $buttons .= html::div(['class' => 'buttons'], $_b);
            }
            $list_news .= html::tag('li', ['class' => 'news'], $title . $description . $buttons);
        }
        $html .= html::tag('ul', ['class' => 'news'], $list_news);
        return html::div($attrib, $html);
    }


    /**
     * Affichage des contacts de support
     * @param array $attrib
     * @return string
     */
    function no_result_help($attrib) {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmhelpsupport';

        $mailtosupport = $this->_search_operators_mel_by_dn($this->rc->get_user_name());

        $html = html::span(['class' => 'label'], $this->gettext('help no result'));
        $html .= html::div(['class' => 'helplinks'], 
            html::span(['class' => 'helplink'], html::a(['href' => 'mailto:'.$mailtosupport, 'onclick' => "event.preventDefault(); event.stopPropagation(); return rcmail.command('compose','".$mailtosupport."',this);", 'target' => '_blank', 'class' => 'button'], $this->gettext('help no result support'))) .
            html::span(['class' => 'helplink'], html::a(['href' => $this->rc->config->get('help_channel_support', ''), 'target' => '_blank', 'class' => 'button'], $this->gettext('help no result channel')))
        );

        return html::div($attrib, $html);
    }

    /**
     * Rechercher les opérateurs Mél d'un utilisateur
     * Voir Mantis #4387 (https://mantis.pneam.cp2i.e2.rie.gouv.fr/mantis/view.php?id=4387)
     * @param string $uid Uid de l'utilisateur
     */
    private function _search_operators_mel_by_dn($uid) {
        if (isset($_SESSION['support_email'])) {
            return $_SESSION['support_email'];
        }
        // Récupération du DN en fonction de l'UID
        $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($uid);
        $base_dn = $user_infos['dn'];
        // Initialisation du filtre LDAP
        $filter = "(&(objectClass=groupOfNames)(mineqRDN=ACL.Opérateurs Mélanie2))";
        $mail = null;
        // Récupération de l'instance depuis l'ORM
        $ldap = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$SEARCH_LDAP);
        if ($ldap->anonymous()) {
            do {
                // Search LDAP
                $result = $ldap->ldap_list($base_dn, $filter, ['mail', 'mailpr']);
                // Form DN
                $base_dn = substr($base_dn, strpos($base_dn, ',') + 1);
            } while ((!isset($result) || $ldap->count_entries($result) === 0) && $base_dn != 'dc=equipement,dc=gouv,dc=fr');
            if (isset($result) && $ldap->count_entries($result) > 0) {
                $infos = $ldap->get_entries($result);
                $mail = $infos[0]['mailPR'][0] ?: $infos[0]['mail'][0];
            }
        }
        $_SESSION['support_email'] = $mail;
        return $mail;
    }
}