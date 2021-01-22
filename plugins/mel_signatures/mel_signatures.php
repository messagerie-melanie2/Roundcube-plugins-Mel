<?php
/**
 * Plugin Mél Signatures
*
* Permet de générer des signatures officielles
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

class mel_signatures extends rcube_plugin
{
    /**
     *
     * @var string
     */
    public $task = 'settings';
    /**
     *
     * @var rcmail
     */
    private $rc;
    /**
     * Directions list
     */
    private $directions = ['SG' => 'Secrétariat Général'];

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    function init()
    {
        $this->rc = rcmail::get_instance();

        if ($this->rc->task == 'settings') {
            // Chargement de la conf
            $this->load_config();

            $this->add_texts('localization/', ['mobilephone', 'phonephone', 'signaturecopied', 'clictocopy']);
            
            $this->add_hook('settings_actions', array($this, 'settings_actions'));
            $this->api->register_action('plugin.mel_signatures', $this->ID, array(
              $this,
              'settings'
            ));
        }
    }

    /**
     * Adds Signatures section in Settings
     */
    function settings_actions($args)
    {
        $args['actions'][] = array(
            'action' => 'plugin.mel_signatures',
            'class'  => 'signatures',
            'label'  => 'task',
            'domain' => 'mel_signatures',
            'title'  => 'signaturestitle',
        );
        return $args;
    }

    /**
     * Show settings template
     */
    function settings() {
        // Chargement des informations de l'utilisateur
        $user = driver_mel::gi()->getUser();
        $fields = ['name', 'lastname', 'firstname', 'service', 'observation', 'street', 'postalcode', 'locality', 'phonenumber', 'mobilephone', 'roomnumber', ];
        $user->load($fields);
        if (isset($user->lastname)) {
            $user->name = $user->firstname . " " . $user->lastname;
        }
        foreach ($fields as $field) {
            $value = $user->$field;
            // Gestion du service
            if ($field == 'service' && !empty($value)) {
                $tmp = explode('/', $value, 2);
                $this->rc->output->set_env('department', $this->directions[$tmp[0]] ?: $tmp[0]);
                $this->rc->output->set_env($field, $tmp[1]);
            }
            else if ($field == 'roomnumber' && !empty($value) && strpos($value, $this->gettext('roomnumber')) === false) {
                $this->rc->output->set_env('roomnumber', $this->gettext('roomnumber') . $value);
            }
            else {
                $this->rc->output->set_env($field, $value);
            }
        }
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/signatures.css');
        // Ajout du JS
        $this->include_script('signature.js');
        $this->rc->output->add_handlers(array(
            'signaturelinks'  => array($this, 'links'),
            'signaturelogo'   => array($this, 'logo'),
        ));
        // Chargement du template d'affichage
        $this->rc->output->set_pagetitle($this->gettext('title'));
        $this->rc->output->send('mel_signatures.settings');
    }

    /**
     * Handler pour le choix du logo
     */
    function logo($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'input-logo';

        $select = new html_select($attrib);
        $sources = [];
        foreach ($this->rc->config->get('signature_images', []) as $name => $link) {
            $select->add($name, $link);
            // Format the image SRC:  data:{mime};base64,{data};
            $sources[$link] = 'data: '.mime_content_type(__DIR__.'/'.$link).';base64,'.base64_encode(file_get_contents(__DIR__.'/'.$link));
        }
        $this->rc->output->set_env('logo_sources', $sources);
        return $select->show();
    }

    /**
     * Handler pour la liste des liens
     */
    function links($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'input-links';

        $attrib['class'] = "dropdown-check-list";
        
        $links = "";
        $env_links = [];
        $checkbox = new html_checkbox();
        $i = 1;

        $links .= html::tag('li', [], $checkbox->show("", ['value' => 'custom-link', 'id' => "checkbox-custom-link", 'onchange' => 'onInputChange();']) . html::label(['for' => "checkbox-custom-link"], $this->gettext('customlink')));
        foreach ($this->rc->config->get('signature_links', []) as $name => $link) {
            $id = "signature_links_$i";
            $i++;
            $env_links[$link] = $name;
            $links .= html::tag('li', [], $checkbox->show("https://www.ecologie.gouv.fr", ['value' => $link, 'id' => $id, 'onchange' => 'onInputChange();']) . html::label(['for' => $id], $name));
        }
        $this->rc->output->set_env('signature_links', $env_links);
        return html::div($attrib,
            html::span(['class' => 'anchor'], $this->gettext('linksselection')) .
            html::tag('ul', ['class' => 'items'], $links)
        );
    }
}