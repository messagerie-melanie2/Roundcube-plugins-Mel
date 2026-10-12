<?php
declare(strict_types = 1);

abstract class bnum_plugin extends rcube_plugin {   
    protected rcmail $rc {
        get => rcmail::get_instance();
    }

    protected rcube_db $db {
        get => $this->rc->get_dbh();
    }

    protected rcube_storage $storage {
        get => $this->rc->get_storage();
    }

    protected string $current_task {
        get => $this->rc->task;
    }

    protected string $current_action {
        get => $this->rc->action;
    }

    #[\Override]
    public function __construct(rcube_plugin_api $api) {
        parent::__construct($api);
    }

    /**
     * Méthode abstraite d'initialisation.
     * Doit être implémentée par les classes dérivées.
     */
    public abstract function init(): void;

    /**
     * Enregistre un gestionnaire pour une action de requête client spécifique.
     *
     * Le callback sera exécuté lors d'une requête comme /?_task=mail&_action=plugin.myaction
     *
     * @param string $action Nom de l'action (doit être unique).
     * @param callable $callback Fonction de rappel sous forme de chaîne de caractères
     *                           ou tableau avec référence d'objet et nom de méthode.
     * @param ?string $current_task (optionnel) Tâche liée à l'action (par défaut, celle en cours).
     */
    protected function force_register_action(string $action, callable $callback, ?string $current_task = null): void
    {
        $this->api->register_action($action, $this->ID, $callback, $current_task ?? $this->current_task);
    }

    /**
     * Enregistre plusieurs actions.
     *
     * @param array<string, callable> $array Tableau associatif des actions et de leurs callbacks.
     */
    protected function register_actions(array $array) {
        foreach ($array as $key => $action) {
            $this->register_action($key, $action);
        }
    }

    /**
     * Vérifie si l'action en cours est l'action par défaut (index).
     *
     * @return bool
     */
    #[\NoDiscard('is_index_action() n\'a pas d\'effets de bords. Ne pas utiliser le résultat est un appel inutile à cette fonction')]
    protected function is_index_action(): bool {
        $current_action = $this->current_action;
        return $current_action === '' || $current_action === 'index';
    }

    /**
     * Retourne le délimiteur IMAP hiérarchique courant, avec une valeur de
     * repli si l'information n'est pas encore disponible en session (avant
     * une connexion IMAP aboutie, ou en dehors du contexte mail).
     *
     *
     * @return string Délimiteur IMAP hiérarchique (ex. '/', '.'), jamais vide.
     */
    #[\NoDiscard('get_imap_delimiter() n\'a pas d\'effets de bords. Ne pas utiliser le résultat est un appel inutile à cette fonction')]
    public static function get_imap_delimiter(): string {
        return $_SESSION['imap_delimiter'] ?? '/';
    }

    /**
     * Récupère une valeur d'entrée.
     *
     * $allow_html à false (par défaut) fait passer la valeur par strip_tags() côté
     * rcube_utils::get_input_value() : protection XSS de base sur toute donnée affichée
     * telle quelle. Ne passer true que pour un champ dont le HTML est explicitement voulu
     * (auquel cas l'échappement en sortie reste à la charge de l'appelant).
     *
     * @param $arg Nom de l'argument.
     * @param $type Type d'entrée (par défaut : rcube_utils::INPUT_GPC).
     * @param $allow_html Autorise les balises HTML dans la valeur (par défaut : false).
     */
    protected function get_input(string $arg, int $type = rcube_utils::INPUT_GPC, bool $allow_html = false): string|array|null
    {
        return rcube_utils::get_input_value($arg, $type, $allow_html);
    }

    /**
     * Récupère une valeur d'entrée.
     *
     * $allow_html à false (par défaut) fait passer la valeur par strip_tags() côté
     * rcube_utils::get_input_value() : protection XSS de base sur toute donnée affichée
     * telle quelle. Ne passer true que pour un champ dont le HTML est explicitement voulu
     * (auquel cas l'échappement en sortie reste à la charge de l'appelant).
     *
     * @param $arg Nom de l'argument.
     * @param $type Type d'entrée (par défaut : rcube_utils::INPUT_GPC).
     * @param $allow_html Autorise les balises HTML dans la valeur (par défaut : false).
     */
    protected function get_input_string(string $arg, int $type = rcube_utils::INPUT_GPC, bool $allow_html = false): string
    {
        return rcube_utils::get_input_string($arg, $type, $allow_html);
    }

    /**
     * Récupère une valeur d'entrée POST.
     *
     * @param $arg Nom de l'argument.
     * @param $allow_html Autorise les balises HTML dans la valeur (par défaut : false).
     */
    protected function get_input_post(string $arg, bool $allow_html = false): string|array|null
    {
        return $this->get_input($arg, rcube_utils::INPUT_POST, $allow_html);
    }

    /**
     * Récupère une valeur d'entrée POST.
     *
     * @param $arg Nom de l'argument.
     * @param $allow_html Autorise les balises HTML dans la valeur (par défaut : false).
     */
    protected function get_input_string_post(string $arg, bool $allow_html = false): string
    {
        return $this->get_input_string($arg, rcube_utils::INPUT_POST, $allow_html);
    }


        /**
     * Récupère une valeur d'entrée échappée pour un filtre ou un RDN LDAP
     * (ldap_escape(), cf. RFC 4515) — protection contre l'injection/manipulation LDAP.
     *
     * @param string $arg Nom de l'argument.
     * @param int $type Type d'entrée (par défaut : rcube_utils::INPUT_GPC).
     * @param bool $is_dn Échappe pour un RDN/DN plutôt qu'un filtre de recherche.
     * @return string
     */
    protected function get_input_ldap(string $arg, int $type = rcube_utils::INPUT_GPC, bool $allow_html = false, bool $is_dn = false, bool $reverse = false): string
    {
        return rcube_ldap_generic::quote_string($this->get_input_string($arg, $type, $allow_html), $is_dn, $reverse);
    }

    /**
     * Échappe une chaîne pour un affichage HTML sûr (rcube::Q(), protection XSS en sortie).
     * get_input()/get_input_post() filtrent déjà les balises à la lecture, mais Q() reste
     * la protection de référence au moment de l'affichage — à utiliser sur toute valeur
     * (issue de l'entrée utilisateur ou non) interpolée dans du HTML généré côté PHP.
     *
     * @param string $str Chaîne à échapper.
     * @param string $mode Mode rcube::Q() ('strict', 'remove', ou '').
     * @param bool $newlines Convertit les retours à la ligne en <br> si true.
     * @return string
     */
    protected function q(string $str, string $mode = 'strict', bool $newlines = true): string
    {
        return rcube::Q($str, $mode, $newlines);
    }

    /**
     * Récupère une valeur de configuration.
     *
     * @param string $key Clé de configuration.
     * @param mixed $default_value Valeur par défaut si la clé n'existe pas.
     * @return mixed
     */
    protected function get_config(string $key, mixed $default_value = null): mixed {
        $this->load_config();
        return $this->rc->config->get($key, $default_value);
    }

    /**
     * Définit une variable d'environnement pour la page.
     *
     * @param string $key Nom de la variable.
     * @param mixed $value Valeur de la variable.
     */
    protected function set_env(string $key, mixed $value): void {
        $this->rc->output->set_env($key, $value);
    }

    /**
     * Définit plusieurs variables d'environnement pour la page.
     *
     * @param array<string, mixed> $envs Tableau associatif des variables d'environnement.
     */
    protected function set_envs(array $envs): void {
        foreach ($envs as $key => $value) {
            $this->set_env($key, $value);
        }
    }

    /**
     * Envoie le template spécifié à l'utilisateur.
     *
     * @param string $templ Nom du template à envoyer.
     * @return bool
     */
    protected function send(?string $templ = null): bool {
        return $this->rc->output->send($templ, false);
    }

    /**
     * Envoie le template spécifié à l'utilisateur et termine l'exécution.
     *
     * @param string $templ Nom du template à envoyer.
     */
    protected function send_and_exit(?string $templ = null): never {
        $this->rc->output->send($templ, true);
        exit;
    }

    /**
     * Exécute une commande Roundcube côté client.
     *
     * @param string $cmd Nom de la commande.
     * @param array ...$args Arguments de la commande.
     */
    protected function send_command(string $cmd, array ...$args): void {
        $this->rc->output->command($cmd, ...$args);
    }

        /**
     * Exécute plusieurs commandes Roundcube côté client.
     *
     * @param array<string, mixed> $commands Tableau associatif des commandes et de leurs arguments.
     */
    protected function send_commands(array $commands): void {
        foreach ($commands as $cmd => $args) {
            if (is_array($args)) {
                $this->send_command($cmd, ...$args);
            } else {
                $this->send_command($cmd, $args);
            }
        }
    }

    /**
     * Définit le titre de la page.
     *
     * @param string $title Titre à afficher.
     */
    protected function set_page_title(string $title): void {
        $this->rc()->output->set_pagetitle($title);
    }

    /**
     * Affiche un message à l'utilisateur.
     *
     * @param string $message Message à afficher.
     * @param string $type Type du message ('notice', 'confirm', 'error').
     * @param mixed $vars Variables supplémentaires pour le message.
     * @param bool $override Indique si le message doit écraser les précédents.
     * @param int $timeout Durée d'affichage du message (en ms).
     */
    protected function show_message(string $message, string $type = 'notice', mixed $vars = null, bool $override = true, int $timeout = 0) {
        $this->rc->output->show_message(
            $message,
            $type,
            $vars,
            $override,
            $timeout
        );
    }

    /**
     * Affiche un message de type 'notice'.
     *
     * @param string $message Message à afficher.
     * @param mixed $vars Variables supplémentaires pour le message.
     * @param bool $override Indique si le message doit écraser les précédents.
     * @param int $timeout Durée d'affichage du message (en ms).
     */
    protected function show_message_notice($message, $vars = null, $override = true, $timeout = 0): void {
        $this->show_message($message, 'notice', $vars, $override, $timeout);
    }

    /**
     * Affiche un message de type 'confirm'.
     *
     * @param string $message Message à afficher.
     * @param mixed $vars Variables supplémentaires pour le message.
     * @param bool $override Indique si le message doit écraser les précédents.
     * @param int $timeout Durée d'affichage du message (en ms).
     */
    protected function show_message_confirm(string $message, mixed $vars = null, bool $override = true, int $timeout = 0): void {
        $this->show_message($message, 'confirm', $vars, $override, $timeout);
    }

    /**
     * Affiche un message de type 'error'.
     *
     * @param string $message Message à afficher.
     * @param mixed $vars Variables supplémentaires pour le message.
     * @param bool $override Indique si le message doit écraser les précédents.
     * @param int $timeout Durée d'affichage du message (en ms).
     */
    protected function show_message_error(string $message, mixed $vars = null, bool $override = true, int $timeout = 0): void {
        $this->show_message($message, 'error', $vars, $override, $timeout);
    }

    /**
     * Inclut une feuille de style CSS.
     *
     * @param string $path Chemin de la feuille de style.
     * @param bool $local Indique si le chemin est local.
     */
    protected function include_css(string $path, bool $local = false): void
    {
        if ($local)
            $this->include_stylesheet(__DIR__."/css/$path");
        else
            $this->include_stylesheet($this->local_skin_path()."/$path");
    }

    /**
     * Ajoute plusieurs hooks à la liste des hooks du plugin.
     *
     * @param array<string, callable> $hooks Tableau associatif où la clé est le nom du hook et la valeur est le callback à exécuter.
     */
    protected function add_hooks(array $hooks): void {
        foreach ($hooks as $hook => $callback) {
            $this->add_hook($hook, $callback);
        }
    }

    /**
     * Exécute un hook.
     *
     * @param string $hook Nom du hook.
     * @param array $args Arguments du hook.
     */
    protected function exec_hook(string $hook, array $args = []): array {
        return $this->rc->plugins->exec_hook($hook, $args);
    }

    /**
     * Ajoute plusieurs gestionnaires d'événements.
     *
     * @param array $handlers Tableau associatif où la clé est le nom du gestionnaire et la valeur est la fonction de rappel.
     */
    protected function add_handlers(array $handlers): void {
        $this->rc->output->add_handlers($handlers);
    }

    /**
     * Ajoute un gestionnaire d'événements.
     *
     * @param string $name Nom de l'événement.
     * @param callable $callback Fonction de rappel.
     */
    protected function add_handler(string $name, callable $callback): void
    {
        $this->add_handlers([
            $name    => $callback,
        ]);
    }

    /**
     * Redirige vers une tâche et une action spécifiques.
     *
     * @param string $task Tâche cible.
     * @param string|null $action Action cible.
     * @param array|null $params Paramètres supplémentaires pour la redirection.
     */
    protected function redirect(string $task, ?string $action = null, ?array $params = null): mixed {
        $args = [
            '_task' => $task
        ];

        if (isset($action)) $args['_action'] = $action;

        if (isset($params) && count($params) > 0) {
            foreach ($params as $key => $value) {
                $args[$key] = $value;
            }
        }
 
        return $this->rc->output->redirect($args);
    }

    /**
     * Vérifie si la tâche en cours est 'bnum'.
     *
     * @return bool
     */
    protected function is_bnum_task() {
        return $this->current_task === 'bnum';
    }

    /**
     * Récupère un utilisateur.
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string|null $uid Identifiant de l'utilisateur.
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    protected function get_user(?string $uid = null): ?\LibMelanie\Api\Defaut\User {
        return driver_mel::gi()->getUser($uid);
    }

    /**
     * Récupère un utilisateur à partir de son email.
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $email Identifiant de l'utilisateur.
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    protected function get_user_from_email(string $email): ?\LibMelanie\Api\Defaut\User {
        return driver_mel::gi()->getUser(null, true, false, null, $email);
    }

    /**
     * Récupère un utilisateur à partir de son dn
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $dn dn de l'utilisateur.
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    protected function get_user_from_dn(string $dn): ?\LibMelanie\Api\Defaut\User {
        return driver_mel::gi()->getUser(null, true, false, $dn);
    }

    /**
     * Récupère un groupe à partir de son DN.
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $dn Identifiant de l'utilisateur.
     *
     * @return \LibMelanie\Api\Defaut\Group|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    protected function get_group(string $dn): ?\LibMelanie\Api\Defaut\Group {
        return driver_mel::gi()->getGroup($dn);
    }

    /**
     * Indique au footer que le footer doit être caché.
     */
    protected function ignore_footer() {
        mel_elastic::IgnoreFooter();
    }

    /**
     * Envoie une réponse et termine l'exécution.
     *
     * @param mixed $item Contenu de la réponse.
     * @param array $headers En-têtes HTTP à inclure dans la réponse.
     */
    protected function sendExit(mixed $item, array $headers = []): never {
        if (count($headers) > 0) {
            foreach ($headers as $header) {
                header($header);
            }
        }

        echo $item;
        exit;
    }

    /**
     * Envoie une réponse JSON et termine l'exécution.
     *
     * @param mixed $item Données à encoder en JSON.
     * @param array $headers En-têtes HTTP à inclure dans la réponse.
     */
    protected function sendEncodedExit(mixed $item, array $headers = ['Content-Type: application/json']): never {
        $this->sendExit(json_encode($item), $headers);
    }
}