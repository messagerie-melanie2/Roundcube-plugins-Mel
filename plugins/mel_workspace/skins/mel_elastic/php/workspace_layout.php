<?php
declare(strict_types=1);
include_once __DIR__ . '/mel_elastic_workspace_layout.php';

/**
 * Factory du layout par défaut de la page d'accueil d'un espace de travail,
 * skin mel_elastic.
 *
 * Suit le pattern closure factory de `mel_workspace` : ce fichier de skin
 * retourne une fonction qui instancie le layout via injection de dépendances,
 * plutôt qu'un `include` qui exposerait le scope de l'appelant. C'est le
 * layout de référence de `mel_workspace` — d'autres plugins (ex. `mel_useful_link`)
 * fournissent leur propre `workspace_layout.php` pour ajouter des blocs
 * complémentaires sans modifier celui-ci.
 *
 * @param WorkspacePageLayout $layout    Layout de page du workspace à peupler
 * @param mel_workspace       $plugin    Instance du plugin `mel_workspace`
 * @param Workspace           $workspace Espace de travail courant
 *
 * @return AWorkspaceLayout Layout anonyme prêt à être rendu
 */
return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
return new class($layout, $plugin, $workspace) extends AMelElasticWorkspaceLayout {

    /**
     * Peuple le layout par défaut de l'espace de travail : bloc agenda
     * (utilisateurs internes uniquement), bloc planning des membres et
     * entrées de la barre de navigation propres au workspace.
     *
     * - Le bloc agenda (`bnum-card-agenda`) n'est ajouté que si l'utilisateur
     *   n'est pas externe ; son module JS dédié est chargé à la volée.
     * - L'entrée de navigation « tasks » n'est ajoutée que si l'espace de
     *   travail expose un service de tâches ({@see mel_workspace::KEY_TASK}).
     * - L'entrée de navigation des paramètres varie selon que l'utilisateur
     *   courant est administrateur de l'espace ou simple membre.
     *
     * @return WorkspacePageLayout Layout de page mis à jour
     */
    public function render(): WorkspacePageLayout
    {
        $NO_BUTTON = EMPTY_STRING;
        $layout = $this->getLayout();
        $workspace = $this->getWorkspace();
        $plugin = $this->getPlugin();

        if (!$plugin->getUser()->is_external) {
            $layout->fourthRow()->append(4, $this->melHtmlModuleBlock('calendar_month', 'Agenda de l\'espace', $NO_BUTTON, ['id' => 'module-agenda', 'tag' => 'bnum-card-agenda', 'loading' => 'loading', 'class' => 'workspace-card-module']));
            $layout->setNavBarSetting('mel_metapage.calendar', 'calendar_month', true, 1);
            $plugin->include_workspace_skin_module('agenda.js');
        }

            $layout->setNavBarSetting('home', 'home', false, 0);
            $layout->setNavBarSetting('mel_workspace.planning', 'calendar_view_week', true, 1);

            $layout->fourthRow()->append(8, $this->melHtmlModuleBlock('event', 'Planning des membres', $NO_BUTTON, ['id' => 'module-planning']));

            if ($workspace->objects()->has(mel_workspace::KEY_TASK)) $layout->setNavBarSetting('tasks', 'check_box', false, 6);

            if ($workspace->isAdmin()) $layout->setNavBarSetting('workspace_params', 'settings', false, 999);
            else $layout->setNavBarSetting('workspace_user', 'group', false, 999);

        return $layout;
    }
};
};