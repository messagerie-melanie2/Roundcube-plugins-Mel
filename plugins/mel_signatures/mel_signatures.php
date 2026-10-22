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

use MelSignatures\SignatureStorageException;
use MelSignatures\SignatureText;
use MelSignatures\SignatureTitle;
use MelSignatures\SignatureTitleDn;
use MelSignatures\SignatureTitleRepository;
use MelSignatures\SignatureTitleValidator;
use MelSignatures\SignatureValidationError;

class mel_signatures extends bnum_plugin
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
     * Messages affichés après une redirection : valeur de `_msg` => [clé du texte, type de message Roundcube].
     * Seules ces clés sont acceptées, jamais un texte venant de l'URL.
     */
    private const array STATUS_MESSAGES = [
        'saved'          => ['title_msg_saved', 'confirmation'],
        'deleted'        => ['title_msg_deleted', 'confirmation'],
        'default_set'    => ['title_msg_default_set', 'confirmation'],
        'not_found'      => ['title_msg_not_found', 'error'],
        'dn_saved'       => ['title_msg_dn_saved', 'confirmation'],
        'dn_deleted'     => ['title_msg_dn_deleted', 'confirmation'],
        'save_error'     => ['title_msg_save_error', 'error'],
        'db_unavailable' => ['title_db_unavailable', 'error'],
    ];

    /**
     * Actions d'écriture de l'administration : POST et jeton CSRF obligatoires.
     */
    private const array ADMIN_WRITE_ACTIONS = [
        'plugin.mel_signatures_save_title',
        'plugin.mel_signatures_delete_title',
        'plugin.mel_signatures_set_default_title',
        'plugin.mel_signatures_add_title_dn',
        'plugin.mel_signatures_delete_title_dn',
    ];

    /**
     * Accès aux tables des libellés, créé au premier besoin (voir titles()).
     */
    private ?SignatureTitleRepository $titles = null;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    #[\Override]
    public function init(): void
    {
        // Classes de lib/
        $this->register_class_autoloader();

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

            // Administration des libellés du bloc Marque État
            $this->register_admin_actions();
        }
    }

    /**
     * Chargement automatique (PSR-4) des classes de l'espace de noms MelSignatures\,
     * rangées dans lib/ : MelSignatures\SignatureTitle → lib/SignatureTitle.php.
     */
    private function register_class_autoloader(): void
    {
        spl_autoload_register(static function (string $class): void {
            $prefix = 'MelSignatures\\';

            if (!str_starts_with($class, $prefix)) {
                return;
            }

            $file = __DIR__ . '/lib/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';

            if (is_file($file)) {
                require $file;
            }
        });
    }

    /**
     * Enregistre les pages et les actions de l'administration des libellés.
     *
     * Les actions sont enregistrées pour tout le monde : chacune vérifie elle-même
     * les droits (require_signatures_admin()), ce qui protège aussi les appels directs.
     */
    private function register_admin_actions(): void
    {
        $actions = [
            'plugin.mel_signatures_list_titles'      => $this->list_titles(...),
            'plugin.mel_signatures_edit_title'        => $this->edit_title(...),
            'plugin.mel_signatures_save_title'        => $this->save_title(...),
            'plugin.mel_signatures_delete_title'      => $this->delete_title(...),
            'plugin.mel_signatures_set_default_title' => $this->set_default_title(...),
            'plugin.mel_signatures_add_title_dn'     => $this->add_title_dn(...),
            'plugin.mel_signatures_delete_title_dn'   => $this->delete_title_dn(...),
        ];

        foreach ($actions as $action => $callback) {
            $this->api->register_action($action, $this->ID, $callback);
        }

        // Refuse toute écriture qui n'est pas un POST muni du jeton CSRF de Roundcube
        $this->protect_actions(self::ADMIN_WRITE_ACTIONS);
    }

    /**
     * Adds Signatures section in Settings
     *
     * @param array<string, mixed> $args Paramètres du hook settings_actions
     *
     * @return array<string, mixed>
     */
    public function settings_actions(array $args): array
    {
        $args['actions'][] = array(
            'action' => 'plugin.mel_signatures',
            'class'  => 'signatures identities',
            'label'  => 'task',
            'domain' => 'mel_signatures',
            'title'  => 'signaturestitle',
        );

        // Entrée « Modifier les signatures », pour les seuls administrateurs
        if ($this->is_signatures_admin()) {
            $args['actions'][] = [
                'action' => 'plugin.mel_signatures_list_titles',
                'class'  => 'signature-titles',
                'label'  => 'title_menu',
                'domain' => 'mel_signatures',
                'title'  => 'title_menu_title',
            ];
        }

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
        $uriPath = (__DIR__.'/'.$uri);
        $encodedContent = ($uriPath |> file_get_contents(...) |> base64_encode(...));
        $contentType = mime_content_type($uriPath);
        return "data:$contentType;base64,$encodedContent";
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
     * Handler pour le choix du logo (bloc Marque État)
     *
     * Lit les libellés en base si `signatures_db_enabled` vaut true et que la table
     * contient au moins un libellé ; sinon, lit la config comme avant.
     *
     * @param array<string, string> $attrib Attributs de la balise <roundcube:object name="signaturelogo" />
     */
    public function logo(array $attrib): string
    {
        if (empty($attrib['id'])) {
            $attrib['id'] = 'input-logo';
        }

        $content = $this->db_enabled() ? $this->logo_options_from_db() : null;
        $content ??= $this->logo_options_from_config();

        $this->rc->output->set_env('logo_sources', []);
        return html::tag('select', $attrib, $content);
    }

    /**
     * Options de la liste « Choix du bloc-marque état » construites depuis la base.
     *
     * @return string|null Les balises <option>, ou null si la table est absente ou vide
     */
    private function logo_options_from_db(): ?string
    {
        try {
            $titles     = $this->titles()->findAll();
            $default_id = $this->titles()->findTitleIdForUserDn((string) driver_mel::gi()->getUser()->dn);
        }
        catch (SignatureStorageException) {
            // Tables absentes ou base indisponible : l'erreur SQL est dans errors.log, on lit la config
            return null;
        }

        if ($titles === []) {
            return null;
        }

        // « Personnalisé » reste la première option : signature.js la reconnaît à sa valeur 'custom'
        $content = html::tag('option', ['value' => 'custom'], rcube::Q($this->gettext('customtitle')));

        foreach ($titles as $title) {
            $params = ['value' => SignatureText::toHtml($title->signatureText)];

            if ($title->id === $default_id) {
                $params['selected'] = 'selected';
            }

            $content .= html::tag('option', $params, rcube::Q($title->label));
        }

        return $content;
    }

    /**
     * Options de la liste « Choix du bloc-marque état » construites depuis la config
     * (comportement d'avant le ticket 0009463, conservé comme repli).
     *
     * @return string Les balises <option> et <optgroup>
     */
    private function logo_options_from_config(): string
    {
        $content = "";
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
        return $content;
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
        
        $links = '';
        $custom_links = '';
        $env_links = [];
        $checkbox = new html_checkbox();
        $i = 1;

        $default_url = $this->get_default_url();
        $links .= html::tag('li', [], $checkbox->show("", ['value' => 'custom-link', 'id' => "checkbox-custom-link", 'onchange' => 'onInputChange();']) . html::label(['for' => "checkbox-custom-link"], $this->gettext('customlink')));
        // Prise en compte des liens personnalisés. Permet d'ajouter des liens en prioritée.
        $links .= '{{custom_links}}';
        $signature_links = $this->rc->config->get('signature_links', []);
        foreach ($signature_links as $name => $link) {
            $id = "signature_links_$i";
            $i++;
            $env_links[$link] = $name;
            $links .= html::tag('li', ['title' => $name], $checkbox->show($signature_links[$default_url], ['value' => $link, 'id' => $id, 'onchange' => 'onInputChange();']) . html::label(['for' => $id], $name));
        }

        $plugin = $this->exec_hook('signature.links', ['custom_links' => '', 'links' => $links, 'env_links' => $env_links, 'signature_links' => $signature_links, 'attribs' => $attrib]);

        if ($plugin) {
            $custom_links = $plugin['custom_links'] ?? '';
            $links = $plugin['links'] ?? $links;
            $env_links = $plugin['env_links'] ?? $env_links;
            $attrib = array_merge($attrib, $plugin['attribs'] ?? []);
        }

        // Si on a des liens personnalisés, on les ajoute
        $links = str_replace('{{custom_links}}', $custom_links, $links);

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

    // -------------------------------------------------
    // Administration des libellés du bloc Marque État
    // -------------------------------------------------

    /**
     * Indique si l'utilisateur courant figure dans `signatures_admin_list`.
     */
    private function is_signatures_admin(): bool
    {
        $uid = driver_mel::gi()->getUser()->uid;

        return in_array($uid, (array) $this->rc->config->get('signatures_admin_list', []), true);
    }

    /**
     * Arrête la requête sur une page d'erreur si l'utilisateur n'est pas administrateur.
     */
    private function require_signatures_admin(): void
    {
        if (!$this->is_signatures_admin()) {
            $this->show_message_error($this->gettext('admin_access_denied'));
            $this->send_and_exit('error');
        }
    }

    /**
     * Indique si les libellés doivent être lus en base (`signatures_db_enabled`).
     */
    private function db_enabled(): bool
    {
        return (bool) $this->rc->config->get('signatures_db_enabled', false);
    }

    /**
     * Accès aux tables des libellés (créé une seule fois par requête).
     */
    private function titles(): SignatureTitleRepository
    {
        return $this->titles ??= new SignatureTitleRepository($this->db());
    }

    /**
     * Règles de saisie des libellés et des DN.
     */
    private function validator(): SignatureTitleValidator
    {
        return new SignatureTitleValidator($this->titles());
    }

    /**
     * Page « Libellés des signatures » : liste alphabétique (GET).
     */
    public function list_titles(): never
    {
        $this->require_signatures_admin();
        $this->show_status_message();
        $this->include_titles_assets();

        try {
            $titles     = $this->titles()->findAll();
            $default_id = $this->titles()->findDefaultTitleId();
        }
        catch (SignatureStorageException) {
            // Le handler affiche « Les tables de signatures sont introuvables… »
            $titles     = null;
            $default_id = null;
        }

        $this->rc->output->add_handlers([
            'signaturetitleslist' => fn (array $attrib): string => $this->titles_list_html($attrib, $titles, $default_id),
        ]);

        $this->set_page_title($this->gettext('title_list_title'));
        $this->send_and_exit('mel_signatures.signature_titles_list');
        exit;
    }

    /**
     * Page de création (sans `_id`) ou de modification d'un libellé (GET).
     */
    public function edit_title(): never
    {
        $this->require_signatures_admin();

        $title_id = (int) $this->get_input('_id', rcube_utils::INPUT_GET);
        $title    = null;

        if ($title_id > 0) {
            try {
                $title = $this->titles()->find($title_id);
            }
            catch (SignatureStorageException) {
                $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'db_unavailable']);
            }

            if ($title === null) {
                $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'not_found']);
            }
        }

        $this->show_status_message();
        $this->render_title_page($title);
    }

    /**
     * Affiche la page de modification d'un libellé (création si $title vaut null).
     * Sert aussi à réafficher le formulaire, avec la saisie de l'admin, après une erreur.
     *
     * @param string $dn_draft DN saisi à remettre dans le formulaire d'ajout après une erreur
     */
    private function render_title_page(?SignatureTitle $title, string $dn_draft = ''): never
    {
        $title_id   = $title?->id ?? 0;
        $is_default = false;
        $dns        = [];

        try {
            $is_default = $title_id > 0 && $this->titles()->findDefaultTitleId() === $title_id;
            $dns        = $title_id > 0 ? $this->titles()->findDns($title_id) : [];
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'db_unavailable']);
        }

        $this->include_titles_assets();

        $this->rc->output->add_handlers([
            'signaturetitleform' => fn (array $attrib): string => $this->title_form_html($title, $is_default, count($dns)),
            'signaturetitledns'  => fn (array $attrib): string => $this->title_dns_html($title_id, $dns, $dn_draft),
        ]);

        $this->set_page_title($title?->label ?: $this->gettext('title_new'));
        $this->send_and_exit('mel_signatures.signature_title_edit');
        exit;
    }

    /**
     * Ajoute la feuille de style (compilée depuis less/signature_titles.less) et le script
     * des pages d'administration. Boutons, recherche et badge viennent du design system Bnum.
     */
    private function include_titles_assets(): void
    {
        $this->include_stylesheet($this->local_skin_path() . '/signature_titles.css');
        $this->include_script('signature_titles.js');
    }

    /**
     * Contenu de <roundcube:object name="signaturetitleslist" /> : titre, bouton « Nouveau libellé »,
     * champ de recherche, compteur et liste alphabétique.
     *
     * @param array<string, string> $attrib     Attributs de la balise du template
     * @param list<SignatureTitle>|null $titles Libellés, ou null si les tables sont inaccessibles
     */
    private function titles_list_html(array $attrib, ?array $titles, ?int $default_id): string
    {
        $header = html::div('signature-titles-header',
            html::tag('h1', 'signature-titles-heading', rcube::Q($this->gettext('title_list_title')))
            . html::a(['href' => $this->title_edit_url(), 'class' => 'signature-titles-new'], rcube::Q($this->gettext('title_new')))
        );

        $intro = $header . html::p('text-muted', rcube::Q($this->gettext('title_list_help')));

        if ($titles === null) {
            return $intro . html::p('signature-titles-alert signature-titles-alert-error', rcube::Q($this->gettext('title_db_unavailable')));
        }

        if ($titles === []) {
            return $intro . html::p('signature-titles-alert signature-titles-alert-info', rcube::Q($this->gettext('title_no_item')));
        }

        // Recherche : composant <bnum-input-search> du design system Bnum (champ, bouton de vidage, loupe).
        // Le filtrage se fait pendant la saisie (signature_titles.js). Le texte du composant sert de libellé
        // pour les lecteurs d'écran, comme dans la recherche des mails (mail.html du skin).
        $filter = html::div(['class' => 'signature-titles-search', 'role' => 'search'],
            html::tag('bnum-input-search', [
                    'id'          => 'signature-titles-filter',
                    'placeholder' => $this->gettext('title_filter'),
                ],
                html::span('sr-only', rcube::Q($this->gettext('title_filter')))
            )
        );

        // data-template : le même texte avec « $count » non remplacé ; signature_titles.js
        // s'en sert pour mettre le compteur à jour pendant la recherche (« 120 libellé(s) »)
        $count = html::p([
                'id'            => 'signature-titles-count',
                'class'         => 'signature-titles-count',
                'data-template' => $this->gettext('title_count'),
            ],
            rcube::Q($this->gettext(['name' => 'title_count', 'vars' => ['count' => count($titles)]]))
        );

        $entries = '';

        foreach ($titles as $title) {
            $badge = $title->id === $default_id ? ' ' . $this->default_badge_html() : '';

            // Toute la ligne est le lien (badge compris) ; data-label : nom en minuscules,
            // sur lequel signature_titles.js filtre la liste
            $entries .= html::tag('li', ['data-label' => mb_strtolower($title->label)],
                html::a(['href' => $this->title_edit_url($title->id)], rcube::Q($title->label) . $badge)
            );
        }

        // Message affiché par signature_titles.js quand la recherche ne trouve rien
        $no_result = html::p([
                'id'     => 'signature-titles-no-result',
                'class'  => 'signature-titles-no-result',
                'role'   => 'status',
                'hidden' => 'hidden',
            ],
            rcube::Q($this->gettext('title_no_result'))
        );

        return $intro . $filter . $count
            . html::tag('ul', $attrib + ['class' => 'signature-titles-list'], $entries)
            . $no_result;
    }

    /**
     * Contenu de <roundcube:object name="signaturetitleform" /> : retour, titre de la page,
     * formulaire (nom + texte de signature), puis une rangée de boutons :
     * « Enregistrer le libellé », « Définir comme libellé par défaut » et « Supprimer le libellé ».
     *
     * @param SignatureTitle|null $title Libellé affiché, ou null sur la page de création
     */
    private function title_form_html(?SignatureTitle $title, bool $is_default, int $dn_count): string
    {
        $title_id = $title?->id ?? 0;

        $back = html::a(
            ['href' => $this->action_url('plugin.mel_signatures_list_titles'), 'class' => 'signature-titles-back'],
            rcube::Q($this->gettext('title_back'))
        );

        $heading = html::tag('h1', 'signature-titles-heading',
            rcube::Q($title?->label ?: $this->gettext('title_new'))
            . ($is_default ? ' ' . $this->default_badge_html() : '')
        );

        $label_input = (new html_inputfield([
            'name'      => '_label',
            'id'        => 'signature-titles-label',
            'class'     => 'form-control',
            'maxlength' => SignatureTitleValidator::MAX_LABEL_LENGTH,
            'required'  => 'required',
        ]))->show($title?->label ?? '');

        // Texte de la signature : textarea, une ligne de signature par ligne saisie.
        // html_textarea ignore « required » et « maxlength » : la balise est écrite directement.
        $text_input = html::tag('textarea', [
                'name'      => '_signature_text',
                'id'        => 'signature-titles-signature-text',
                'class'     => 'form-control',
                'rows'      => 5,
                'maxlength' => SignatureTitleValidator::MAX_SIGNATURE_TEXT_LENGTH,
                'required'  => 'required',
            ],
            rcube::Q($title?->signatureText ?? '', 'strict', false)
        );

        $form = html::tag('form', [
                'method' => 'post',
                'action' => $this->action_url('plugin.mel_signatures_save_title'),
                'id'     => 'signature-titles-form',
                'class'  => 'signature-titles-form',
            ],
            $this->hidden_fields_html(['_id' => $title_id])
            . html::div('form-group',
                html::label('signature-titles-label', rcube::Q($this->gettext('title_label_field')))
                . $label_input
            )
            . html::div('form-group',
                html::label('signature-titles-signature-text', rcube::Q($this->gettext('title_value_field')))
                . $text_input
                . html::tag('small', 'form-text text-muted', rcube::Q($this->gettext('title_value_help')))
            )
        );

        // « Enregistrer » est placé hors du formulaire, sur la même ligne que les autres boutons
        // (un formulaire ne peut pas en contenir un autre) : data-form désigne le formulaire,
        // que signature_titles.js soumet au clic (les boutons du design system ne le font pas seuls).
        $save = html::tag('bnum-primary-button', [
                'data-icon'     => 'save',
                'data-icon-pos' => 'left',
                'data-submit'   => '1',
                'data-form'     => 'signature-titles-form',
            ],
            rcube::Q($this->gettext('title_save'))
        );

        // Création : pas encore de bouton « Définir par défaut » ni « Supprimer »
        if ($title_id === 0) {
            return $back . $heading . $form . html::div('signature-titles-actions', $save);
        }

        // Libellé par défaut : ni « Définir par défaut » ni « Supprimer », une explication à la place
        if ($is_default) {
            return $back . $heading . $form
                . html::div('signature-titles-actions', $save)
                . html::p('text-muted signature-titles-default-note', rcube::Q($this->gettext('title_default_not_deletable')));
        }

        $confirm = $this->gettext(['name' => 'title_confirm_delete', 'vars' => [
            'label' => $title->label,
            'count' => $dn_count,
        ]]);

        $actions = $save
            . $this->post_button_html('plugin.mel_signatures_set_default_title', ['_id' => $title_id], $this->gettext('title_set_default'), 'bnum-secondary-button', 'check')
            . $this->post_button_html('plugin.mel_signatures_delete_title', ['_id' => $title_id], $this->gettext('title_delete'), 'bnum-danger-button', 'delete', $confirm);

        return $back . $heading . $form . html::div('signature-titles-actions', $actions);
    }

    /**
     * Contenu de <roundcube:object name="signaturetitledns" /> : DN du libellé, en lecture seule
     * avec une corbeille, puis formulaire d'ajout. Sur la page de création : un simple message.
     * Pour corriger un DN, l'admin le supprime puis le rajoute (choix du 20/10/2026).
     *
     * @param list<SignatureTitleDn> $dns      DN du libellé, ligne « default » comprise
     * @param string                 $dn_draft DN saisi à remettre dans le formulaire d'ajout
     */
    private function title_dns_html(int $title_id, array $dns, string $dn_draft): string
    {
        if ($title_id === 0) {
            return html::p('text-muted', rcube::Q($this->gettext('title_dns_after_create')));
        }

        $rows  = '';
        $count = 0;

        foreach ($dns as $dn) {
            // La ligne « default » s'affiche sans bouton : on la déplace depuis un autre libellé
            if ($dn->isDefault()) {
                $rows .= html::tag('li', 'signature-titles-dn signature-titles-dn-default',
                    $this->default_badge_html() . ' ' . rcube::Q($this->gettext('title_default_dn_help'))
                );
                continue;
            }

            $count++;

            // Corbeille seule : le texte du bouton (« Supprimer le DN ou=… ») n'est lu
            // que par les lecteurs d'écran et affiché en infobulle
            $rows .= html::tag('li', 'signature-titles-dn',
                html::span('signature-titles-dn-value', rcube::Q($dn->dn))
                . $this->post_button_html(
                    'plugin.mel_signatures_delete_title_dn',
                    ['_id' => $title_id, '_dn_id' => $dn->id],
                    $this->gettext(['name' => 'title_delete_dn', 'vars' => ['dn' => $dn->dn]]),
                    'bnum-icon-button',
                    'delete',
                    $this->gettext('title_confirm_delete_dn'),
                    icon_only: true,
                )
            );
        }

        $heading = html::tag('h2', 'signature-titles-subheading',
            rcube::Q($this->gettext(['name' => 'title_dns_heading', 'vars' => ['count' => $count]]))
        );

        $list = $rows !== ''
            ? html::tag('ul', 'signature-titles-dns', $rows)
            : html::p('text-muted', rcube::Q($this->gettext('title_no_dn')));

        return $heading . $list . $this->dn_add_form_html($title_id, $dn_draft);
    }

    /**
     * Formulaire d'ajout d'un DN : champ + bouton « Ajouter un DN ».
     */
    private function dn_add_form_html(int $title_id, string $dn_draft): string
    {
        $input = new html_inputfield([
            'name'        => '_dn',
            'class'       => 'form-control',
            'maxlength'   => SignatureTitleValidator::MAX_DN_LENGTH,
            'required'    => 'required',
            'placeholder' => $this->gettext('title_dn_placeholder'),
            'aria-label'  => $this->gettext('title_dn_field'),
        ]);

        return html::tag('form', [
                'method' => 'post',
                'action' => $this->action_url('plugin.mel_signatures_add_title_dn'),
                'class'  => 'signature-titles-dn-form',
            ],
            $this->hidden_fields_html(['_id' => $title_id])
            . $input->show($dn_draft)
            . html::tag('bnum-secondary-button',
                ['data-icon' => 'add', 'data-icon-pos' => 'left', 'data-submit' => '1'],
                rcube::Q($this->gettext('title_add_dn'))
            )
        );
    }

    /**
     * Formulaire POST réduit à un bouton du design system Bnum (définir par défaut, supprimer…).
     * Le bouton porte data-submit : signature_titles.js soumet le formulaire au clic.
     *
     * @param array<string, int> $fields    Champs cachés envoyés avec le bouton
     * @param string             $tag       Composant : bnum-secondary-button, bnum-danger-button ou bnum-icon-button
     * @param string             $icon      Icône Material Symbols (save, check, delete…)
     * @param string|null        $confirm   Question posée par signature_titles.js avant l'envoi
     * @param bool               $icon_only Bouton sans texte visible (bnum-icon-button) :
     *                                      $label devient l'infobulle et le nom lu par les lecteurs d'écran
     */
    private function post_button_html(string $action, array $fields, string $label, string $tag, string $icon, ?string $confirm = null, bool $icon_only = false): string
    {
        $button = $icon_only
            ? html::tag($tag, ['class' => 'signature-titles-dn-delete', 'title' => $label, 'aria-label' => $label, 'data-submit' => '1'], rcube::Q($icon))
            : html::tag($tag, ['data-icon' => $icon, 'data-icon-pos' => 'left', 'data-submit' => '1'], rcube::Q($label));

        return html::tag('form', [
                'method'       => 'post',
                'action'       => $this->action_url($action),
                'class'        => 'signature-titles-inline-form',
                'data-confirm' => $confirm,
            ],
            $this->hidden_fields_html($fields) . $button
        );
    }

    /**
     * Champs cachés d'un formulaire.
     *
     * @param array<string, int> $fields Nom du champ => valeur
     */
    private function hidden_fields_html(array $fields): string
    {
        $hidden = new html_hiddenfield();

        foreach ($fields as $name => $value) {
            $hidden->add(['name' => $name, 'value' => $value]);
        }

        return $hidden->show();
    }

    /**
     * Badge « Défaut » : composant <bnum-badge> du design system Bnum, variation secondaire.
     */
    private function default_badge_html(): string
    {
        return html::tag('bnum-badge', [
            'class'          => 'signature-titles-badge',
            'data-value'     => $this->gettext('title_default_badge'),
            'data-variation' => 'secondary',
        ], '');
    }

    /**
     * Crée (`_id` = 0) ou modifie un libellé (POST).
     */
    public function save_title(): never
    {
        $this->require_signatures_admin();

        $title = new SignatureTitle(
            (int) $this->get_input_post('_id'),
            trim((string) $this->get_input_post('_label')),
            SignatureText::normalize((string) $this->get_input_post('_signature_text')),
        );
        $title_id = $title->id;
        $error    = null;

        try {
            if ($title->id > 0 && $this->titles()->find($title->id) === null) {
                $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'not_found']);
            }

            $error = $this->validator()->validateTitle($title);

            if ($error === null) {
                if ($title_id === 0) {
                    $title_id = $this->titles()->create($title);
                }
                else {
                    $this->titles()->update($title);
                }
            }
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'save_error']);
        }

        if ($error !== null) {
            // Réaffiche le formulaire avec la saisie de l'admin, sans rien enregistrer
            $this->show_message_error($this->validation_error_text($error));
            $this->render_title_page($title);
        }

        $this->log_change("libellé #$title_id enregistré : « {$title->label} »");
        $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'saved']);
    }

    /**
     * Supprime un libellé et ses DN (POST). Refusé pour le libellé par défaut.
     */
    public function delete_title(): never
    {
        $this->require_signatures_admin();

        $title_id   = (int) $this->get_input_post('_id');
        $title      = null;
        $is_default = false;

        try {
            $title      = $this->titles()->find($title_id);
            $is_default = $this->titles()->findDefaultTitleId() === $title_id;

            if ($title !== null && !$is_default) {
                $this->titles()->delete($title_id);
            }
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'save_error']);
        }

        if ($title === null) {
            $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'not_found']);
        }

        if ($is_default) {
            // Sans lui, les agents dont le DN n'est pas reconnu n'auraient plus rien de proposé
            $this->show_message_error($this->gettext('title_error_default_not_deletable'));
            $this->render_title_page($title);
        }

        $this->log_change("libellé #$title_id supprimé : « {$title->label} »");
        $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'deleted']);
    }

    /**
     * Rattache la ligne « default » à ce libellé, en la créant si besoin (POST).
     */
    public function set_default_title(): never
    {
        $this->require_signatures_admin();

        $title_id = (int) $this->get_input_post('_id');
        $title    = null;

        try {
            $title = $this->titles()->find($title_id);

            if ($title !== null) {
                $this->titles()->setDefault($title_id);
            }
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'save_error']);
        }

        if ($title === null) {
            $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'not_found']);
        }

        $this->log_change("libellé #$title_id défini par défaut");
        $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'default_set']);
    }

    /**
     * Ajoute un DN à un libellé (POST). Un DN ne se modifie pas : on le supprime puis on le rajoute.
     */
    public function add_title_dn(): never
    {
        $this->require_signatures_admin();

        $title_id = (int) $this->get_input_post('_id');
        $dn       = trim((string) $this->get_input_post('_dn'));
        $title    = null;
        $error    = null;

        try {
            $title = $this->titles()->find($title_id);
            $error = $title === null ? null : $this->validator()->validateDn($dn);

            if ($title !== null && $error === null) {
                $this->titles()->addDn($title_id, $dn);
            }
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'save_error']);
        }

        if ($title === null) {
            $this->redirect_to_action('plugin.mel_signatures_list_titles', ['_msg' => 'not_found']);
        }

        if ($error !== null) {
            // Réaffiche la page avec le DN saisi dans le formulaire d'ajout
            $this->show_message_error($this->validation_error_text($error));
            $this->render_title_page($title, $dn);
        }

        $this->log_change("DN « $dn » ajouté au libellé #$title_id");
        $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'dn_saved']);
    }

    /**
     * Supprime un DN d'un libellé (POST). La ligne « default » n'est jamais supprimée.
     */
    public function delete_title_dn(): never
    {
        $this->require_signatures_admin();

        $title_id    = (int) $this->get_input_post('_id');
        $title_dn_id = (int) $this->get_input_post('_dn_id');

        try {
            $this->titles()->deleteDn($title_id, $title_dn_id);
        }
        catch (SignatureStorageException) {
            $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'save_error']);
        }

        $this->log_change("DN #$title_dn_id supprimé du libellé #$title_id");
        $this->redirect_to_action('plugin.mel_signatures_edit_title', ['_id' => $title_id, '_msg' => 'dn_deleted']);
    }

    /**
     * Affiche le message demandé par `_msg` après une redirection (liste blanche STATUS_MESSAGES).
     */
    private function show_status_message(): void
    {
        $key = (string) $this->get_input('_msg', rcube_utils::INPUT_GET);

        if (isset(self::STATUS_MESSAGES[$key])) {
            [$label, $type] = self::STATUS_MESSAGES[$key];
            $this->show_message($this->gettext($label), $type);
        }
    }

    /**
     * Texte d'une erreur de saisie, avec ses variables.
     */
    private function validation_error_text(SignatureValidationError $error): string
    {
        return $this->gettext(['name' => $error->messageKey, 'vars' => $error->vars]);
    }

    /**
     * URL d'une page ou d'une action de l'administration.
     *
     * @param array<string, int|string> $params Paramètres ajoutés à l'URL
     */
    private function action_url(string $action, array $params = []): string
    {
        return $this->rc->url(['_action' => $action] + $params);
    }

    /**
     * URL de la page de modification d'un libellé (création si $title_id = 0).
     */
    private function title_edit_url(int $title_id = 0): string
    {
        return $this->action_url('plugin.mel_signatures_edit_title', $title_id > 0 ? ['_id' => $title_id] : []);
    }

    /**
     * Redirige vers une page de l'administration et termine la requête.
     * Après un POST, la redirection évite qu'un F5 renvoie le formulaire.
     *
     * @param array<string, int|string> $params Paramètres ajoutés à l'URL
     */
    private function redirect_to_action(string $action, array $params = []): never
    {
        $this->rc->output->redirect(['_action' => $action] + $params);
        exit;
    }

    /**
     * Trace une modification dans les journaux Bnum (qui a fait quoi).
     */
    private function log_change(string $message): void
    {
        $uid = driver_mel::gi()->getUser()->uid;
        mel_logs::get_instance()->log(mel_logs::INFO, "[mel_signatures] $uid : $message");
    }
}
