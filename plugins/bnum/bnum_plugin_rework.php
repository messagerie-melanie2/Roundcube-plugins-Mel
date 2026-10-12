<?php
declare(strict_types = 1);

/**
 * Classe de base de tous les plugins Bnum.
 *
 * Centralise l'accès à l'API Roundcube (rcmail, base, stockage, sortie) et
 * fournit des helpers typés pour les entrées HTTP, la configuration, les
 * réponses et l'annuaire. Tout plugin Bnum en hérite au lieu de rcube_plugin.
 *
 * @property-read rcmail        $rc             Instance rcmail courante.
 * @property-read rcube_db      $db             Connexion à la base de données.
 * @property-read rcube_storage $storage        Stockage IMAP courant.
 * @property-read string        $current_task   Tâche Roundcube en cours ('' si non définie).
 * @property-read string        $current_action Action Roundcube en cours ('' pour l'index).
 */
abstract class bnum_plugin extends rcube_plugin
{
    /** Chemin par défaut des modules ESM d'un plugin. */
    public const string BASE_MODULE_PATH = '/js/lib/';

    /** Nom par défaut du module d'entrée d'un plugin. */
    public const string BASE_MODULE_NAME = 'main';

    /**
     * Suffixe marquant un script à émettre en `type="module"`.
     *
     * Le core ne sait pas produire de balise module : le hook render_page de
     * mel_metapage (mel_metapage::appendTo()) remplace ce marqueur par
     * `?v=<version>" type="module"`. Sans mel_metapage, le script n'est pas chargé.
     */
    private const string MODULE_MARKER = 'scriptType:module';

    /**
     * Modules déjà lancés via runModule() pendant la requête, tous plugins confondus.
     *
     * Partagé (static) pour qu'un module demandé par deux plugins ne soit lancé
     * qu'une fois. Les fichiers inclus par balise sont, eux, dédoublonnés par le core.
     *
     * @var array<string, true>
     */
    private static array $_started_modules = [];

    /** Instance rcmail courante (singleton du core). */
    protected rcmail $rc {
        get => rcmail::get_instance();
    }

    /** Connexion à la base de données Roundcube. */
    protected rcube_db $db {
        get => $this->rc->get_dbh();
    }

    /** Stockage IMAP ; l'initialise à la première lecture. */
    protected rcube_storage $storage {
        get => $this->rc->get_storage();
    }

    /** Tâche en cours ; chaîne vide tant que rcmail ne l'a pas définie. */
    protected string $current_task {
        get => $this->rc->task ?? '';
    }

    /** Action en cours ; chaîne vide pour l'action par défaut. */
    protected string $current_action {
        get => $this->rc->action ?? '';
    }

    /**
     * Initialise le plugin : enregistrement des hooks, actions et ressources.
     *
     * Appelée par Roundcube après le chargement du plugin.
     *
     * @return void
     */
    public abstract function init(): void;

    /**
     * Enregistre une action client en la rattachant explicitement à une tâche.
     *
     * Contrairement à register_action(), permet de cibler une tâche différente
     * de la tâche courante. Le callback est exécuté lors d'une requête du type
     * /?_task=mail&_action=plugin.mon_action.
     *
     * @param string      $action       Nom de l'action (unique).
     * @param callable    $callback     Callback exécuté pour cette action.
     * @param string|null $current_task Tâche liée à l'action (défaut : tâche courante).
     *
     * @return void
     */
    protected function force_register_action(string $action, callable $callback, ?string $current_task = null): void
    {
        $this->api->register_action($action, $this->ID, $callback, $current_task ?? $this->current_task);
    }

    /**
     * Enregistre plusieurs actions client en une fois.
     *
     * @param array<string, callable> $array Actions indexées par nom, associées à leur callback.
     *
     * @return void
     */
    protected function register_actions(array $array): void
    {
        foreach ($array as $key => $action) {
            $this->register_action($key, $action);
        }
    }

    /**
     * Indique si l'action en cours est l'action par défaut (index).
     *
     * @return bool true si l'action est vide ou vaut 'index'.
     */
    #[\NoDiscard("is_index_action() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function is_index_action(): bool
    {
        return $this->current_action === '' || $this->current_action === 'index';
    }

    /**
     * Indique si la tâche en cours est la tâche 'bnum'.
     *
     * @return bool true si la tâche courante vaut 'bnum'.
     */
    #[\NoDiscard("is_bnum_task() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function is_bnum_task(): bool
    {
        return $this->current_task === 'bnum';
    }

    /**
     * Retourne le délimiteur hiérarchique IMAP courant.
     *
     * Retombe sur '/' si l'information n'est pas encore en session (avant une
     * connexion IMAP aboutie, ou hors contexte mail).
     *
     * @return string Délimiteur IMAP (ex. '/', '.'), jamais vide.
     */
    #[\NoDiscard("get_imap_delimiter() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    public static function get_imap_delimiter(): string
    {
        return ($_SESSION['imap_delimiter'] ?? '') ?: '/';
    }

    /**
     * Récupère une valeur d'entrée HTTP brute (chaîne, tableau ou absence).
     *
     * Avec $allow_html à false (défaut), rcube_utils applique strip_tags() :
     * protection XSS de base. Ne passer true que pour un champ dont le HTML est
     * voulu ; l'échappement en sortie reste alors à la charge de l'appelant.
     *
     * @param string $arg        Nom du paramètre.
     * @param int    $type       Source : rcube_utils::INPUT_GET, INPUT_POST, INPUT_COOKIE ou INPUT_GPC (défaut).
     * @param bool   $allow_html Conserve les balises HTML.
     *
     * @return string|array<array-key, mixed>|null Valeur, ou null si absente.
     */
    #[\NoDiscard("get_input() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input(string $arg, int $type = rcube_utils::INPUT_GPC, bool $allow_html = false): string|array|null
    {
        return rcube_utils::get_input_value($arg, $type, $allow_html);
    }

    /**
     * Récupère une valeur d'entrée HTTP garantie sous forme de chaîne.
     *
     * Une valeur absente ou non scalaire (tableau) donne une chaîne vide.
     * Même filtrage HTML que {@see get_input()}.
     *
     * @param string $arg        Nom du paramètre.
     * @param int    $type       Source (défaut : rcube_utils::INPUT_GPC).
     * @param bool   $allow_html Conserve les balises HTML.
     *
     * @return string Valeur, ou '' si absente.
     */
    #[\NoDiscard("get_input_string() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input_string(string $arg, int $type = rcube_utils::INPUT_GPC, bool $allow_html = false): string
    {
        return rcube_utils::get_input_string($arg, $type, $allow_html);
    }

    /**
     * Récupère une valeur POST brute. Voir {@see get_input()}.
     *
     * @param string $arg        Nom du paramètre.
     * @param bool   $allow_html Conserve les balises HTML.
     *
     * @return string|array<array-key, mixed>|null Valeur, ou null si absente.
     */
    #[\NoDiscard("get_input_post() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input_post(string $arg, bool $allow_html = false): string|array|null
    {
        return $this->get_input($arg, rcube_utils::INPUT_POST, $allow_html);
    }

    /**
     * Récupère une valeur POST garantie sous forme de chaîne. Voir {@see get_input_string()}.
     *
     * @param string $arg        Nom du paramètre.
     * @param bool   $allow_html Conserve les balises HTML.
     *
     * @return string Valeur, ou '' si absente.
     */
    #[\NoDiscard("get_input_string_post() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input_string_post(string $arg, bool $allow_html = false): string
    {
        return $this->get_input_string($arg, rcube_utils::INPUT_POST, $allow_html);
    }

    /**
     * Récupère une entrée échappée pour un filtre de recherche LDAP (RFC 4515).
     *
     * Protège contre l'injection dans un filtre ; utiliser
     * {@see get_input_ldap_dn()} pour un DN/RDN.
     *
     * @param string $arg  Nom du paramètre.
     * @param int    $type Source (défaut : rcube_utils::INPUT_GPC).
     *
     * @return string Valeur échappée, '' si absente.
     */
    #[\NoDiscard("get_input_ldap_filter() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input_ldap_filter(string $arg, int $type = rcube_utils::INPUT_GPC): string
    {
        return rcube_ldap_generic::quote_string($this->get_input_string($arg, $type));
    }

    /**
     * Récupère une entrée échappée pour un DN/RDN LDAP (RFC 4514).
     *
     * @param string $arg  Nom du paramètre.
     * @param int    $type Source (défaut : rcube_utils::INPUT_GPC).
     *
     * @return string Valeur échappée, '' si absente.
     */
    #[\NoDiscard("get_input_ldap_dn() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function get_input_ldap_dn(string $arg, int $type = rcube_utils::INPUT_GPC): string
    {
        return rcube_ldap_generic::quote_string($this->get_input_string($arg, $type), true);
    }

    /**
     * Échappe une chaîne pour un affichage HTML sûr (rcube::Q()).
     *
     * Protection XSS de référence en sortie : à appliquer à toute valeur
     * interpolée dans du HTML généré côté PHP, même si elle a été filtrée à
     * la lecture par {@see get_input()}.
     *
     * @param string $str      Chaîne à échapper.
     * @param string $mode     Mode rcube::Q() : 'strict' (défaut), 'remove' ou ''.
     * @param bool   $newlines Convertit les retours à la ligne en <br>.
     *
     * @return string Chaîne échappée.
     */
    #[\NoDiscard("q() n'a pas d'effet de bord : ignorer son résultat laisse la valeur non échappée")]
    protected function q(string $str, string $mode = 'strict', bool $newlines = true): string
    {
        return rcube::Q($str, $mode, $newlines);
    }

    /**
     * Récupère une valeur de configuration, après chargement de la config du plugin.
     *
     * Le chargement n'a lieu qu'une fois : rcube_plugin::load_config() le mémorise.
     *
     * @param string $key           Clé de configuration.
     * @param mixed  $default_value Valeur retournée si la clé est absente.
     *
     * @return mixed Valeur configurée, ou $default_value.
     */
    #[\NoDiscard("get_config() n'a pas d'effet de bord observable : ignorer son résultat rend l'appel inutile")]
    protected function get_config(string $key, mixed $default_value = null): mixed
    {
        $this->load_config();
        return $this->rc->config->get($key, $default_value);
    }

    /**
     * Définit une variable rcmail.env côté client.
     *
     * Le nom ne doit pas contenir de tiret (tokenisé comme opérateur par le
     * parseur de templates) : utiliser des underscores.
     *
     * @param string $key   Nom de la variable.
     * @param mixed  $value Valeur, sérialisée en JSON.
     *
     * @return void
     */
    protected function set_env(string $key, mixed $value): void
    {
        $this->rc->output->set_env($key, $value);
    }

    /**
     * Définit plusieurs variables rcmail.env. Voir {@see set_env()}.
     *
     * @param array<string, mixed> $envs Variables indexées par nom.
     *
     * @return void
     */
    protected function set_envs(array $envs): void
    {
        foreach ($envs as $key => $value) {
            $this->set_env($key, $value);
        }
    }

    /**
     * Envoie un template sans interrompre l'exécution.
     *
     * @param string|null $templ Nom du template (null : sortie déjà préparée).
     *
     * @return void
     */
    protected function send(?string $templ = null): void
    {
        $this->rc->output->send($templ, false);
    }

    /**
     * Envoie un template puis termine la requête.
     *
     * Point de sortie centralisé : à préférer à exit/die dans les plugins.
     *
     * @param string|null $templ Nom du template (null : sortie déjà préparée).
     *
     * @return never
     */
    protected function send_and_exit(?string $templ = null): never
    {
        $this->rc->output->send($templ, true);
        exit;
    }

    /**
     * Demande l'exécution d'une commande rcmail côté client.
     *
     * @param string $cmd     Nom de la commande.
     * @param mixed  ...$args Arguments transmis à la commande.
     *
     * @return void
     */
    protected function send_command(string $cmd, mixed ...$args): void
    {
        $this->rc->output->command($cmd, ...$args);
    }

    /**
     * Demande l'exécution de plusieurs commandes client.
     *
     * Une valeur tableau est dépliée en arguments ; une valeur scalaire est
     * passée comme argument unique.
     *
     * @param array<string, mixed> $commands Arguments indexés par nom de commande.
     *
     * @return void
     */
    protected function send_commands(array $commands): void
    {
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
     * @param string $title Titre affiché.
     *
     * @return void
     */
    protected function set_page_title(string $title): void
    {
        $this->rc->output->set_pagetitle($title);
    }

    /**
     * Affiche un message à l'utilisateur.
     *
     * @param string     $message  Message ou clé de localisation.
     * @param string     $type     'notice' (défaut), 'confirm', 'error' ou 'warning'.
     * @param array<string, mixed>|null $vars Variables de substitution du message.
     * @param bool       $override Remplace le message affiché.
     * @param int        $timeout  Durée d'affichage en secondes (0 : défaut Roundcube).
     *
     * @return void
     */
    protected function show_message(string $message, string $type = 'notice', ?array $vars = null, bool $override = true, int $timeout = 0): void
    {
        $this->rc->output->show_message($message, $type, $vars, $override, $timeout);
    }

    /**
     * Affiche un message d'information. Voir {@see show_message()}.
     *
     * @param string                    $message  Message ou clé de localisation.
     * @param array<string, mixed>|null $vars     Variables de substitution.
     * @param bool                      $override Remplace le message affiché.
     * @param int                       $timeout  Durée d'affichage en secondes.
     *
     * @return void
     */
    protected function show_message_notice(string $message, ?array $vars = null, bool $override = true, int $timeout = 0): void
    {
        $this->show_message($message, 'notice', $vars, $override, $timeout);
    }

    /**
     * Affiche un message de confirmation. Voir {@see show_message()}.
     *
     * @param string                    $message  Message ou clé de localisation.
     * @param array<string, mixed>|null $vars     Variables de substitution.
     * @param bool                      $override Remplace le message affiché.
     * @param int                       $timeout  Durée d'affichage en secondes.
     *
     * @return void
     */
    protected function show_message_confirm(string $message, ?array $vars = null, bool $override = true, int $timeout = 0): void
    {
        $this->show_message($message, 'confirm', $vars, $override, $timeout);
    }

    /**
     * Affiche un message d'erreur. Voir {@see show_message()}.
     *
     * @param string                    $message  Message ou clé de localisation.
     * @param array<string, mixed>|null $vars     Variables de substitution.
     * @param bool                      $override Remplace le message affiché.
     * @param int                       $timeout  Durée d'affichage en secondes.
     *
     * @return void
     */
    protected function show_message_error(string $message, ?array $vars = null, bool $override = true, int $timeout = 0): void
    {
        $this->show_message($message, 'error', $vars, $override, $timeout);
    }

    /**
     * Inclut une feuille de style de la skin courante du plugin.
     *
     * @param string $path Chemin relatif au dossier de skin du plugin.
     *
     * @return void
     */
    protected function include_css(string $path): void
    {
        $this->include_stylesheet($this->local_skin_path() . "/$path");
    }

    /**
     * Indique si la sortie courante est une page HTML.
     *
     * Les inclusions de scripts n'ont de sens qu'en HTML : en réponse AJAX
     * (rcmail_output_json) ou en CLI, il n'y a ni balise ni script à émettre.
     *
     * @return bool true si la sortie accepte des scripts.
     */
    #[\NoDiscard("is_html_output() n'a pas d'effet de bord : ignorer son résultat rend l'appel inutile")]
    protected function is_html_output(): bool
    {
        return $this->rc->output instanceof rcmail_output_html;
    }

    /**
     * Ajoute un script JavaScript à la page (sans effet hors sortie HTML).
     *
     * À réserver à de courts appels d'amorçage : toute logique doit vivre dans
     * un module ESM du plugin. Les valeurs PHP interpolées doivent être
     * encodées avec json_encode() ou rcube::JQ().
     *
     * @param string $script Code JavaScript.
     * @param string $where  Position : 'head' (défaut), 'head_top', 'foot' ou 'docready'.
     *
     * @return void
     */
    protected function add_script(string $script, string $where = 'head'): void
    {
        $output = $this->rc->output;

        if ($output instanceof rcmail_output_html) {
            $output->add_script($script, $where);
        }
    }

    /**
     * Charge le chargeur de modules de mel_metapage (runModule, loadJsModule…).
     *
     * Appelé automatiquement par les méthodes qui en ont besoin ; le core
     * dédoublonne l'inclusion.
     *
     * Attention : nécessite le plugin `mel_metapage`.
     *
     * @return void
     */
    protected function setup_module(): void
    {
        $this->include_script_from_plugin('mel_metapage', 'js/always_load/load_module.js', 'head');
    }

    /**
     * Lance le module ESM d'entrée du plugin courant via runModule().
     *
     * @param string $name           Nom du module, sans extension (défaut : 'main').
     * @param string $path           Dossier du module dans le plugin (défaut : '/js/lib/').
     * @param bool   $save_in_memory Conserve le module pour loadAction() côté client.
     *
     * @return void
     */
    protected function load_script_module(string $name = self::BASE_MODULE_NAME, string $path = self::BASE_MODULE_PATH, bool $save_in_memory = false): void
    {
        $this->load_script_module_from_plugin($this->ID, $name, $path, $save_in_memory);
    }

    /**
     * Lance un module ESM d'un plugin via runModule(), une seule fois par requête.
     *
     * @param string $plugin         Plugin propriétaire du module.
     * @param string $name           Nom du module, sans extension.
     * @param string $path           Dossier du module dans le plugin.
     * @param bool   $save_in_memory Conserve le module pour loadAction() côté client.
     * @param string $where          Position du script d'amorçage (défaut : 'docready').
     *
     * @return void
     */
    protected function load_script_module_from_plugin(string $plugin, string $name = self::BASE_MODULE_NAME, string $path = self::BASE_MODULE_PATH, bool $save_in_memory = false, string $where = 'docready'): void
    {
        $key = "$plugin|$path|$name";

        if (!$this->is_html_output() || isset(self::$_started_modules[$key])) {
            return;
        }

        self::$_started_modules[$key] = true;
        $this->setup_module();

        $args = implode(', ', array_map(
            static fn (string|bool $arg): string => json_encode($arg, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            [$plugin, $name, $path, $save_in_memory]
        ));

        $this->add_script("runModule($args);", $where);
    }

    /**
     * Inclut un fichier JavaScript d'un plugin par balise <script>.
     *
     * Sans effet hors sortie HTML ; le core ignore un fichier déjà inclus à la
     * même position.
     *
     * @param string $plugin Plugin propriétaire du fichier.
     * @param string $fn     Chemin du fichier relatif au dossier du plugin.
     * @param string $pos    Position : 'head', 'head_bottom' (défaut) ou 'foot'.
     *
     * @return void
     */
    public function include_script_from_plugin(string $plugin, string $fn, string $pos = 'head_bottom'): void
    {
        $output = $this->rc->output;

        if ($output instanceof rcmail_output_html) {
            $output->include_script($this->api->url . $plugin . '/' . ltrim($fn, '/'), $pos, false);
        }
    }

    /**
     * Inclut un module ESM d'un plugin par balise <script type="module">.
     *
     * Attention : le type module est posé par mel_metapage (voir {@see MODULE_MARKER}).
     *
     * @param string $plugin Plugin propriétaire du module.
     * @param string $path   Dossier du module, relatif au plugin.
     * @param string $name   Nom du fichier du module.
     * @param string $pos    Position : 'head' (défaut), 'head_bottom' ou 'foot'.
     *
     * @return void
     */
    private function include_module_from_plugin(string $plugin, string $path, string $name, string $pos = 'head'): void
    {
        $path = trim($path, '/');
        $this->include_script_from_plugin($plugin, "$path/$name/" . self::MODULE_MARKER, $pos);
    }

    /**
     * Inclut un module ESM du plugin courant par balise.
     *
     * @param string $name     Nom du fichier du module.
     * @param string $path     Dossier relatif au plugin (défaut : 'js/lib').
     * @param string $position Position : 'head' (défaut), 'head_bottom' ou 'foot'.
     *
     * @return void
     */
    public function include_module(string $name, string $path = 'js/lib', string $position = 'head'): void
    {
        $this->include_module_from_plugin($this->ID, $path, $name, $position);
    }

    /**
     * Inclut un module de js/lib/program du plugin courant.
     *
     * @param string      $name Nom du fichier du module.
     * @param string|null $path Sous-dossier éventuel de js/lib/program.
     *
     * @return void
     */
    public function include_module_program(string $name, ?string $path = null): void
    {
        $this->include_module($name, self::sub_path('js/lib/program', $path));
    }

    /**
     * Inclut un module d'action (js/lib/program/actions) du plugin courant.
     *
     * @param string      $name Nom du fichier du module.
     * @param string|null $path Sous-dossier éventuel (action en plusieurs fichiers).
     *
     * @return void
     */
    public function include_module_action(string $name, ?string $path = null): void
    {
        $this->include_module($name, self::sub_path('js/lib/program/actions', $path));
    }

    /**
     * Inclut un module d'addon (js/lib/program/addons) du plugin courant.
     *
     * @param string      $name Nom du fichier du module.
     * @param string|null $path Sous-dossier éventuel.
     *
     * @return void
     */
    public function include_module_addon(string $name, ?string $path = null): void
    {
        $this->include_module($name, self::sub_path('js/lib/program/addons', $path));
    }

    /**
     * Inclut le gestionnaire de frames de scripts de mel_metapage.
     *
     * Attention : nécessite le plugin `mel_metapage`.
     *
     * @return void
     */
    protected function include_script_frame_manager(): void
    {
        $this->setup_module();
        $this->include_script_from_plugin('mel_metapage', 'js/scripting_frame_manager.js');
    }

    /**
     * Neutralise un comportement natif côté client en interceptant son événement rcmail.
     *
     * L'écouteur ajouté retourne {break: true}, ce qui interrompt le traitement
     * par défaut de l'événement.
     *
     * @param string $key Nom de l'événement rcmail.
     *
     * @return void
     */
    protected function break_initial_fonctionality(string $key): void
    {
        $event = json_encode($key, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $this->add_script("rcmail.addEventListener($event, () => ({break: true}));");
    }

    /**
     * Concatène un dossier de base et un sous-dossier optionnel.
     *
     * @param string      $base Dossier de base.
     * @param string|null $sub  Sous-dossier, ou null.
     *
     * @return string Chemin résultant, sans slash final.
     */
    private static function sub_path(string $base, ?string $sub): string
    {
        return $sub === null ? $base : $base . '/' . trim($sub, '/');
    }

    /**
     * Enregistre plusieurs hooks en une fois.
     *
     * Un même hook ne doit être enregistré qu'une fois par plugin, et chaque
     * handler doit retourner $args.
     *
     * @param array<string, callable> $hooks Callbacks indexés par nom de hook.
     *
     * @return void
     */
    protected function add_hooks(array $hooks): void
    {
        foreach ($hooks as $hook => $callback) {
            $this->add_hook($hook, $callback);
        }
    }

    /**
     * Déclenche un hook et retourne les arguments modifiés par les plugins.
     *
     * @param string               $hook Nom du hook.
     * @param array<string, mixed> $args Arguments transmis aux handlers.
     *
     * @return array<string, mixed> Arguments après passage dans tous les handlers.
     */
    protected function exec_hook(string $hook, array $args = []): array
    {
        return $this->rc->plugins->exec_hook($hook, $args);
    }

    /**
     * Enregistre plusieurs handlers d'objets de template (<roundcube:object name="…">).
     *
     * @param array<string, callable> $handlers Callbacks indexés par nom d'objet.
     *
     * @return void
     */
    protected function add_handlers(array $handlers): void
    {
        $this->rc->output->add_handlers($handlers);
    }

    /**
     * Enregistre un handler d'objet de template. Voir {@see add_handlers()}.
     *
     * @param string   $name     Nom de l'objet de template.
     * @param callable $callback Callback produisant le HTML de l'objet.
     *
     * @return void
     */
    protected function add_handler(string $name, callable $callback): void
    {
        $this->add_handlers([$name => $callback]);
    }

    /**
     * Redirige vers une tâche/action.
     *
     * En sortie HTML ou JSON, la redirection termine la requête ; le retour
     * n'est possible qu'en sortie CLI.
     *
     * @param string                    $task   Tâche cible.
     * @param string|null               $action Action cible.
     * @param array<string, mixed>|null $params Paramètres d'URL supplémentaires (prioritaires).
     *
     * @return void
     */
    protected function redirect(string $task, ?string $action = null, ?array $params = null): void
    {
        $args = ['_task' => $task];

        if ($action !== null) {
            $args['_action'] = $action;
        }

        $this->rc->output->redirect(array_merge($args, $params ?? []));
    }

    /**
     * Récupère un utilisateur.
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string|null $uid Identifiant (null : utilisateur connecté).
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    #[\NoDiscard("get_user() sert à lire un utilisateur : ignorer son résultat rend l'appel inutile")]
    protected function get_user(?string $uid = null): ?\LibMelanie\Api\Defaut\User
    {
        return driver_mel::gi()->getUser($uid);
    }

    /**
     * Récupère un utilisateur à partir de son adresse e-mail (sans cache).
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $email Adresse e-mail.
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    #[\NoDiscard("get_user_from_email() sert à lire un utilisateur : ignorer son résultat rend l'appel inutile")]
    protected function get_user_from_email(string $email): ?\LibMelanie\Api\Defaut\User
    {
        return driver_mel::gi()->getUser(null, true, false, null, $email);
    }

    /**
     * Récupère un utilisateur à partir de son DN (sans cache).
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $dn DN LDAP de l'utilisateur.
     *
     * @return \LibMelanie\Api\Defaut\User|null Utilisateur, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    #[\NoDiscard("get_user_from_dn() sert à lire un utilisateur : ignorer son résultat rend l'appel inutile")]
    protected function get_user_from_dn(string $dn): ?\LibMelanie\Api\Defaut\User
    {
        return driver_mel::gi()->getUser(null, true, false, $dn);
    }

    /**
     * Récupère un groupe à partir de son DN.
     *
     * Attention : nécessite le plugin `mel` (classe `driver_mel`). Sans lui,
     * l'appel provoque une erreur fatale « Class not found ».
     *
     * @param string $dn DN LDAP du groupe.
     *
     * @return \LibMelanie\Api\Defaut\Group|null Groupe, ou null s'il est introuvable.
     *
     * @throws \Error Si la classe `driver_mel` n'est pas chargée.
     */
    #[\NoDiscard("get_group() sert à lire un groupe : ignorer son résultat rend l'appel inutile")]
    protected function get_group(string $dn): ?\LibMelanie\Api\Defaut\Group
    {
        return driver_mel::gi()->getGroup($dn);
    }

    /**
     * Masque le footer de la page courante.
     *
     * Attention : nécessite le plugin `mel_elastic`. Sans lui, l'appel
     * provoque une erreur fatale « Class not found ».
     *
     * @return void
     *
     * @throws \Error Si la classe `mel_elastic` n'est pas chargée.
     */
    protected function ignore_footer(): void
    {
        mel_elastic::IgnoreFooter();
    }

    /**
     * Envoie une réponse brute puis termine la requête.
     *
     * Point de sortie centralisé : à préférer à exit/die dans les plugins.
     * $item doit être affichable par echo (chaîne, nombre, Stringable) ;
     * un tableau produit « Array » et un avertissement.
     *
     * @param mixed         $item    Contenu de la réponse.
     * @param list<string>  $headers En-têtes HTTP complets (ex. 'Content-Type: text/plain').
     *
     * @return never
     */
    protected function sendExit(mixed $item, array $headers = []): never
    {
        foreach ($headers as $header) {
            header($header);
        }

        echo $item;
        exit;
    }

    /**
     * Envoie une réponse JSON puis termine la requête.
     *
     * @param mixed        $item    Données à encoder.
     * @param list<string> $headers En-têtes HTTP (défaut : Content-Type JSON).
     *
     * @return never
     *
     * @throws \JsonException Si les données ne sont pas encodables.
     */
    protected function sendEncodedExit(mixed $item, array $headers = ['Content-Type: application/json']): never
    {
        $this->sendExit(json_encode($item, JSON_THROW_ON_ERROR), $headers);
    }
}
