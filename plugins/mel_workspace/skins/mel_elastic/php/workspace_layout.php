<?php
declare(strict_types=1);
include_once __DIR__ . '/mel_elastic_workspace_layout.php';

return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
return new class($layout, $plugin, $workspace) extends AMelElasticWorkspaceLayout {

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