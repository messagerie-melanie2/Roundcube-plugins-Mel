<?php
declare(strict_types = 1);

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

/**
 * Portail d'accueil du Bnum : affiche les modules présents dans `modules/`.
 *
 * Actions (tâche `task_name`) :
 * - index : affichage du portail
 * - actions déclarées par `#[BnumAction]` sur les modules (voir {@see mel_portal::register_module_actions()})
 *
 * Handlers de template :
 * - modules         : html des modules activés
 * - maintenancetext : texte de maintenance
 * - feedback_button : bouton de retour utilisateur
 */
class mel_portal extends bnum_plugin
{
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    /** Nom de la tâche du portail. */
    private readonly string $task_name;

    /** Nom de la barre latérale qui reçoit le bouton du portail. */
    private readonly string $sidebar_name;

    /** Nom du css du portail. */
    private readonly string $css_name;

    /** Nom du template du portail. */
    private readonly string $template_name;

    /**
     * Html des modules à afficher sur la page.
     *
     * @var array<int, string>
     */
    private array $modules_html = [];

    /**
     * Initialise le plugin ; les actions et handlers ne sont enregistrés
     * que sur la tâche du portail.
     */
    #[\Override]
    public function init(): void
    {
        $this->setup();

        if ($this->get_current_task() !== $this->task_name) {
            return;
        }

        $this->load_modules_actions();
        // Limité à la tâche du portail pour ne pas écraser les handlers homonymes d'autres plugins (ex. mel_workspace).
        $this->register_attributes();
    }

    /**
     * Action index : affiche le portail et ses modules.
     */
    #[BnumAction('index')]
    public function index(): void
    {
        $this->include_page_css();
        $this->load_script_module();
        $this->load_modules();
        $this->send_and_exit('mel_portal.' . $this->template_name);
    }

    /**
     * Handler de template, renvoie le html des modules.
     *
     * @return string
     */
    #[BnumHandler('modules')]
    public function render_modules(): string
    {
        $html = implode('', $this->modules_html);
        $this->modules_html = [];

        return html::div(['class' => 'row'], $html);
    }

    /**
     * Handler de template, renvoie le texte de maintenance.
     *
     * @return string
     */
    #[BnumHandler('maintenancetext')]
    public function render_maintenance_text(): string
    {
        $this->require_plugin('mel_helper');
        return mel_helper::get_maintenance_text($this->rc());
    }

    /**
     * Handler de template, renvoie le bouton de feedback.
     *
     * @return string
     */
    #[BnumHandler('feedback_button')]
    public function render_feedback_button(): string
    {
        return mel_metapage::GetSurveyButton();
    }

    /**
     * Lit la configuration, enregistre la tâche et ajoute le bouton du portail.
     */
    private function setup(): void
    {
        $this->task_name     = $this->get_config('task_name', 'bureau');
        $this->template_name = $this->get_config('template_name', 'mel_portal');
        $this->sidebar_name  = $this->get_config('sidebar_name', 'taskbar');
        $this->css_name      = $this->get_config('css_name', 'mel-portal.css');

        $this->add_texts('localization/', true);
        $this->register_task($this->task_name);
        $this->add_button([
            'command'    => $this->task_name,
            'class'      => 'button-home order1 icon-mel-home',
            'classsel'   => 'button-home button-selected order1 icon-mel-home',
            'innerclass' => 'button-inner',
            'label'      => 'portal',
            'title'      => '',
            'type'       => 'link',
            'domain'     => $this->ID,
        ], $this->sidebar_name);
    }

    /**
     * Enregistre les actions de chaque module, activé ou non : `enabled()` dépend
     * souvent d'autres plugins qui ne sont pas forcément chargés à l'`init`.
     */
    private function load_modules_actions(): void
    {
        foreach ($this->discover_module_names() as $name) {
            try {
                $this->register_module_actions($this->create_module($name));
            } catch (\Throwable $th) {
                $this->log_module_error($name, 'Chargement des actions', $th);
            }
        }
    }

    /**
     * Initialise les modules activés, triés par ordre, et prépare leur html.
     */
    private function load_modules(): void
    {
        $modules = [];

        foreach ($this->discover_module_names() as $name) {
            try {
                $module = $this->create_module($name);

                if (!$module->enabled()) {
                    continue;
                }

                $module->init();
                $modules[$name] = $module;
            } catch (\Throwable $th) {
                $this->log_module_error($name, 'Initialisation', $th);
            }
        }

        uasort($modules, fn(Module $a, Module $b) => $a->order() <=> $b->order());

        foreach ($modules as $name => $module) {
            try {
                $module->include_module();
                $this->add_module(get_class($module), $module->item_html(), $module->row_size());
            } catch (\Throwable $th) {
                $this->log_module_error($name, 'Affichage', $th);
            }
        }
    }

    /**
     * Enregistre les actions déclarées par `#[BnumAction]` sur les méthodes
     * publiques d'un module.
     *
     * @param Module $module Module à inspecter
     */
    private function register_module_actions(Module $module): void
    {
        foreach ((new ReflectionObject($module))->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            foreach ($method->getAttributes(BnumAction::class) as $attribute) {
                $action = $attribute->newInstance();
                $callback = fn() => $this->run_module_action($module, $method->getName(), $action);

                if ($action->task === null) {
                    $this->register_action($action->name, $callback);
                    continue;
                }

                $this->force_register_action($action->name, $callback, $action->task);
            }
        }
    }

    /**
     * Exécute l'action d'un module et envoie son résultat, en JSON si demandé.
     *
     * @param Module     $module Module porteur de l'action
     * @param string     $method Méthode du module
     * @param BnumAction $action Déclaration de l'action
     */
    private function run_module_action(Module $module, string $method, BnumAction $action): void
    {
        if ($action->csrf) {
            $this->assert_post_csrf();
        }

        $result = $module->$method();

        if ($action->json) {
            $this->sendEncodedExit($result);
        }

        $this->sendExit($result);
    }

    /**
     * Liste les dossiers de modules présents dans `modules/`.
     *
     * @return array<int, string> Noms des modules
     */
    private function discover_module_names(): array
    {
        return array_filter(
            scandir(__DIR__ . '/modules') ?: [],
            fn(string $entry) => $entry !== '.' && $entry !== '..' && !str_contains($entry, '.php')
        );
    }

    /**
     * Instancie un module à partir du nom de son dossier.
     *
     * @param string $name Nom du dossier du module
     *
     * @return Module
     */
    private function create_module(string $name): Module
    {
        include_once __DIR__ . '/modules/module.php';
        include_once __DIR__ . "/modules/$name/$name.php";

        $classname = ucfirst($name);
        return new $classname($name, $this);
    }

    /**
     * Journalise l'échec d'un module sans interrompre le chargement des autres.
     *
     * @param string     $name  Nom du module
     * @param string     $step  Étape en échec
     * @param \Throwable $error Erreur levée
     */
    private function log_module_error(string $name, string $step, \Throwable $error): void
    {
        mel_logs::gi()->log(mel_logs::ERROR, "[mel_portal] $step du module '$name' impossible : " . $error->getMessage());

        if (mel_logs::is(mel_logs::DEBUG)) {
            mel_logs::gi()->log(mel_logs::DEBUG, "[mel_portal] " . $error->getTraceAsString());
        }
    }

    /**
     * Inclut le css du portail.
     */
    private function include_page_css(): void
    {
        $this->include_stylesheet($this->local_skin_path() . '/' . $this->css_name);

        if ($this->get_config('skin') !== 'mel_elastic') {
            $this->include_stylesheet($this->local_skin_path() . '/icofont.min.css');
        }
    }

    /**
     * Ajoute le html d'un module à la page.
     *
     * @param string   $name Nom de la classe du module
     * @param string   $html Html du module
     * @param int|null $size Largeur de colonne bootstrap
     */
    private function add_module(string $name, string $html, ?int $size): void
    {
        $this->modules_html[] = html::div(['class' => "col-md-$size"],
            html::div(['class' => "module_$name module_parent"], $html)
        );
    }
}
