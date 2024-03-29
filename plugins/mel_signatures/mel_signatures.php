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
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    function init()
    {
        $this->rc = rcmail::get_instance();

        if ($this->rc->task == 'settings') {
            // Chargement de la conf
            $this->load_config();

            $this->add_texts('localization/', [
                'mobilephone', 'phonephone', 'signaturecopied', 'clictocopy', 'signaturecopiedmessage', 'usesignature_confirm',
                'savesignaturesuccess', 'savesignatureerror', 'savingsignature', 'identitiesdialogtitle', 'save', 'cancel',
            ]);
            
            $this->add_hook('settings_actions', array($this, 'settings_actions'));
            // Plugin actions
            $this->api->register_action('plugin.mel_signatures', $this->ID, array(
                $this,
                'settings'
            ));
            $this->api->register_action('plugin.save_signature', $this->ID, array(
                $this,
                'save_signature'
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
            'class'  => 'signatures identities',
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
        $fields = $this->rc->config->get('signature_field_list', []);
        $user->load($fields);
        if (isset($user->lastname)) {
            $user->name = $user->firstname . " " . $user->lastname;
        }
        foreach ($fields as $field) {
            $value = $user->$field;
            // Gestion du service
            if ($field == 'service' && !empty($value)) {
                $tmp = explode('/', $value, 3);

                $direction = $tmp[0];
                $subdirection = $tmp[1] ?: null;
                $service = $tmp[2] ?: null;

                // Gérer les directions multiples
                $this->get_direction_name($direction, $subdirection, $service, $user->dn);

                $this->rc->output->set_env('department', isset($subdirection) ? $subdirection . " | " . $direction : $direction);
                $this->rc->output->set_env('logotype', $direction);
                
                $this->rc->output->set_env($field, $service);
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
            'signaturelinks'        => array($this, 'links'),
            'signaturelogo'         => array($this, 'logo'),
            'logotype'              => array($this, 'logotype'),
            'datalistfunctions'     => array($this, 'functions'),
            'identiteslist'         => array($this, 'identities'),
        ));
        // Gestion des images

        // Marianne
        $this->rc->output->set_env('logo_source_marianne', $this->image_data($this->rc->config->get('signature_image_marianne')));
        $this->rc->output->set_env('logo_url_marianne', $this->rc->config->get('signature_image_marianne'));
        $this->rc->output->set_env('logo_url_marianne_outlook', $this->rc->config->get('signature_image_marianne_outlook'));

        // Devise
        $this->rc->output->set_env('logo_source_devise', $this->image_data($this->rc->config->get('signature_image_devise')));
        $this->rc->output->set_env('logo_url_devise', $this->rc->config->get('signature_image_devise'));
        $this->rc->output->set_env('logo_url_devise_outlook', $this->rc->config->get('signature_image_devise_outlook'));

        // Autres logos
        $other_logo = $this->rc->config->get('signature_image_other_logo', null);
        if (isset($other_logo)) {
            $other_logo_outlook = $this->rc->config->get('signature_image_other_logo_outlook', null);
            $this->rc->output->set_env('logo_source_other', $this->image_data($other_logo));
            $this->rc->output->set_env('logo_url_other', $other_logo);
            $this->rc->output->set_env('logo_url_other_outlook', isset($other_logo_outlook) ? $other_logo_outlook : $other_logo);
            $this->rc->output->set_env('logo_title_other', $this->rc->config->get('signature_other_logo_title', 'Autre logo'));
        }
        
        // Chargement du template d'affichage
        $this->rc->output->set_pagetitle($this->gettext('title'));
        $this->rc->output->send('mel_signatures.settings');
    }

    /**
     * Retrouve le nom de la direction en fonction de l'acronyme et du DN de l'utilisateur
     * 
     * @param string $direction Acronyme de la direction
     * @param string $dn DN de l'utilisateur
     * 
     * @return string Nom complet de la direction
     */
    private function get_direction_name(&$direction, &$subdirection, &$service, $dn = null) {
        // Gestion de la direction
        $pos = strpos($dn, "ou=$direction,");
        if ($pos !== false) {
            $res = $this->get_dn_label(substr($dn, $pos));
            if (isset($res)) {
                $direction = $res; 
            }
        }

        // Gestion de la sous direction
        $pos = strpos($dn, "ou=$subdirection,");
        if ($pos !== false) {
            $res = $this->get_dn_label(substr($dn, $pos));
            if (isset($res) && (strpos(strtolower($res), 'direction') === 0 || !isset($service))) {
                $subdirection = $res; 
            }
            else if (isset($service)) {
                $service = "$subdirection/$service";
                $subdirection = null;
            }
        }
    }

    /**
     * Retourne l'observation à partir d'un dn
     */
    private function get_dn_label($dn) {
        $ou = driver_mel::gi()->user();
        $ou->dn = $dn;
        if ($ou->load(['observation'])) {
            return $ou->observation;
        }
        return null;
    }

    /**
     * Return image data from image name uri
     * 
     * @param string $uri Image URI
     * 
     * @return string image data
     */
    private function image_data($uri) {
        // Format the image SRC:  data:{mime};base64,{data};
        return 'data:'.mime_content_type(__DIR__.'/'.$uri).';base64,'.base64_encode(file_get_contents(__DIR__.'/'.$uri));
    }

    /**
     * Return the default url for the user dn
     * 
     * @return string default url
     */
    private function get_default_url() {
        $dn = driver_mel::gi()->getUser()->dn;
        $links = $this->rc->config->get('signature_default_link', []);
        foreach ($links as $serviceDN => $link) {
            if (strpos($dn, $serviceDN) !== false) {
                return $link;
            }
        }
        return isset($links['default']) ? $links['default'] : null;
    }

    /**
     * Return the default logotype for the user dn
     * 
     * @return string default logotype
     */
    private function get_default_logotype() {
        $dn = driver_mel::gi()->getUser()->dn;
        $logotype = $this->rc->config->get('signature_default_logotype', []);
        foreach ($logotype as $serviceDN => $link) {
            if (strpos($dn, $serviceDN) !== false) {
                return $link;
            }
        }
        return isset($logotype['default']) ? $logotype['default'] : null;
    }

    /**
     * Return the default image for the user dn
     * 
     * @return string default image
     */
    private function get_default_image() {
        $dn = driver_mel::gi()->getUser()->dn;
        $images = $this->rc->config->get('signature_default_image', []);
        foreach ($images as $serviceDN => $link) {
            if (strpos($dn, $serviceDN) !== false) {
                return $link;
            }
        }
        return isset($images['default']) ? $images['default'] : null;
    }

    /**
     * Handler pour le choix du logo
     */
    function logo($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'input-logo';

        $content = "";
        $sources = [];
        $default_image = $this->get_default_image();
        foreach ($this->rc->config->get('signature_images', []) as $name => $logo) {
            if (is_array($logo)) {
                $logo_html = "";
                foreach ($logo as $n => $l) {
                    if ($default_image == $n) {
                        $params = ['value' => $l, 'selected' => 'selected'];
                    }
                    else {
                        $params = ['value' => $l];
                    }
                    $logo_html .= html::tag('option', $params, $n);
                }
                $content .= html::tag('optgroup', ['label' => $name], $logo_html);
            }
            else {
                if ($default_image == $name) {
                    $params = ['value' => $logo, 'selected' => 'selected'];
                }
                else {
                    $params = ['value' => $logo];
                }
                $content .= html::tag('option', $params, $name);
            }
        }
        $this->rc->output->set_env('logo_sources', $sources);
        return html::tag('select', $attrib, $content);
    }

    /**
     * Handler pour le choix du logotype
     */
    function logotype($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'input-logotype';

        $content = "";
        $sources = [];
        $default_logotype = $this->get_default_logotype();
        foreach ($this->rc->config->get('signature_logotype_images', []) as $name => $logotype) {
            if (is_array($logotype)) {
                $logo_html = "";
                foreach ($logotype as $n => $l) {
                    if ($default_logotype == $n) {
                        $params = ['value' => $l, 'selected' => 'selected'];
                    }
                    else {
                        $params = ['value' => $l];
                    }
                    $sources[$l] = $this->image_data($l);
                    $logo_html .= html::tag('option', $params, $n);
                }
                $content .= html::tag('optgroup', ['label' => $name], $logo_html);
            }
            else {
                if ($default_logotype == $name) {
                    $params = ['value' => $logotype, 'selected' => 'selected'];
                }
                else {
                    $params = ['value' => $logotype];
                }
                $sources[$logotype] = $this->image_data($logotype);
                $content .= html::tag('option', $params, $name);
            }
        }
        $this->rc->output->set_env('logotype_sources', $sources);
        return html::tag('select', $attrib, $content);
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

        $default_url = $this->get_default_url();
        $links .= html::tag('li', [], $checkbox->show("", ['value' => 'custom-link', 'id' => "checkbox-custom-link", 'onchange' => 'onInputChange();']) . html::label(['for' => "checkbox-custom-link"], $this->gettext('customlink')));
        $signature_links = $this->rc->config->get('signature_links', []);
        foreach ($signature_links as $name => $link) {
            $id = "signature_links_$i";
            $i++;
            $env_links[$link] = $name;
            $links .= html::tag('li', ['title' => $name], $checkbox->show($signature_links[$default_url], ['value' => $link, 'id' => $id, 'onchange' => 'onInputChange();']) . html::label(['for' => $id], $name));
        }
        $this->rc->output->set_env('signature_links', $env_links);
        return html::div($attrib,
            html::span(['class' => 'anchor'], $this->gettext('linksselection')) .
            html::tag('ul', ['class' => 'items'], $links)
        );
    }


    /**
     * Handler pour la liste des fonctions de l'utilisateur
     */
    function functions($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'functions-list';

        $fields = $this->rc->config->get('signature_jobtitle_field_list', []);
        $options = '';
        foreach ($fields as $field) {
            $value = $this->rc->output->get_env($field);
            if (!empty($value)) {
                if (is_array($value)) {
                    foreach ($value as $val) {
                        $options .= html::tag('option', ['value' => $val], '');
                    }
                }
                else {
                    $options .= html::tag('option', ['value' => $value], '');
                }
            }
        }
        return html::tag('datalist', $attrib, $options);
    }

    /**
     * Handler pour l'affichage des identités de l'utilisateur
     */
    function identities($attrib) {
        if (empty($attrib['id']))
            $attrib['id'] = 'identities-list';

        // $attrib['class'] = "dropdown-check-list";

        $identities = $this->rc->user->list_identities();
        $checkbox = new html_checkbox();
        $mailboxes = "";

        $mailboxes .= html::span([], $checkbox->show("all-mailboxes", ['value' => 'all-mailboxes', 'id' => "checkbox-all-mailboxes", 'onchange' => 'checkAllIdentities(this);'])) . html::label(['for' => "checkbox-all-mailboxes"], $this->gettext('allmailboxes'));
        foreach ($identities as $identity) {
            $id = "mailbox".$identity['identity_id'];
            $name = $identity['name'];
            $mailboxes .= html::span([], $checkbox->show($identity['identity_id'], ['value' => $identity['identity_id'], 'id' => $id, 'class' => 'mailbox', 'onchange' => 'checkOneIdentity(this);'])) . html::label(['for' => $id], $name);
        }
        return html::div($attrib,
            html::span(['class' => 'description'], $this->gettext('identitiesdescription')) .
            html::div(['class' => 'list'], $mailboxes)
        );
    }

    /**
     * Action de sauvegarde de la signature dans l'identité par défaut
     */
    function save_signature() {
        $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);
        $identities = rcube_utils::get_input_value('_identities', rcube_utils::INPUT_GPC);
        
        $success = false;
        $data = [];
        $data['signature'] = $this->rcmail_wash_html(rcube_utils::get_input_value('_signature', rcube_utils::INPUT_POST, true));
        $data['html_signature'] = 1;

        if (isset($identities) && is_array($identities)) {
            $success = true;
            foreach ($identities as $identity) {
                $success &= $this->rc->user->update_identity($identity, $data);
            }
            if ($success && $this->rc->config->get('htmleditor', 0) !== 1) {
                $this->rc->user->save_prefs(['htmleditor' => 1]);
            }
        }
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        $result = array('action' => 'plugin.save_signature', 'success' => $success, 'unlock' => $unlock);
        echo json_encode($result);
        exit;
    }

    /**
     * Sanity checks/cleanups on HTML body of signature
     */
    private function rcmail_wash_html($html)
    {
       // Add header with charset spec., washtml cannot work without that
       $html = '<html><head>'
           . '<meta http-equiv="Content-Type" content="text/html; charset='.RCUBE_CHARSET.'" />'
           . '</head><body>' . $html . '</body></html>';
   
       // clean HTML with washhtml by Frederic Motte
       $wash_opts = array(
           'show_washed'   => false,
           'allow_remote'  => 1,
           'charset'       => RCUBE_CHARSET,
           'html_elements' => array('body', 'link'),
           'html_attribs'  => array('rel', 'type'),
       );
   
       // initialize HTML washer
       $washer = new rcube_washtml($wash_opts);
   
       //$washer->add_callback('form', 'rcmail_washtml_callback');
       //$washer->add_callback('style', 'rcmail_washtml_callback');
   
       // Remove non-UTF8 characters (#1487813)
       $html = rcube_charset::clean($html);
   
       $html = $washer->wash($html);
   
       // remove unwanted comments and tags (produced by washtml)
       $html = preg_replace(array('/<!--[^>]+-->/', '/<\/?body>/'), '', $html);
   
       return $html;
    }
}
