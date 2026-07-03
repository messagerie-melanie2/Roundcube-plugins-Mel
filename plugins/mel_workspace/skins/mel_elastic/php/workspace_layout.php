<?php
return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
return new class($layout, $plugin, $workspace) extends AWorkspaceLayout {

    public function render(): WorkspacePageLayout
    {
        $NO_BUTTON = EMPTY_STRING;
        $layout = $this->getLayout();
        $workspace = $this->getWorkspace();
        $plugin = $this->getPlugin(); 

        if (!$plugin->getUser()->is_external) {
            $layout->fourthRow()->append(4, $this->_htmlModuleBlock('calendar_month', 'Agenda de l\'espace', $NO_BUTTON, ['id' => 'module-agenda', 'tag' => 'bnum-card-agenda']));//['id' => 'module-agenda', 'data-title' => 'Agenda de l\'espace', 'data-button' => 'calendar', 'data-button-text' => 'Créer', 'data-button-icon' => 'add_circle', 'data-button-ignore' => 'default-actions', 'data-button-type' => 'primary']));
            $layout->setNavBarSetting('mel_metapage.calendar', 'calendar_month', true, 1);
            $plugin->include_workspace_skin_module('agenda.js');
        }

            $layout->setNavBarSetting('home', 'home', false, 0);
            $layout->setNavBarSetting('mel_workspace.planning', 'calendar_view_week', true, 1);

            $layout->fourthRow()->append(8, $this->_htmlModuleBlock('event', 'Planning des membres', $NO_BUTTON, ['id' => 'module-planning']));//$this->workspacePageLayout->htmlModuleBlock(['id' => 'module-planning', 'data-title' => 'Planning des membres']));

            if ($workspace->objects()->has(mel_workspace::KEY_TASK)) $layout->setNavBarSetting('tasks', 'check_box', false, 6);

            if ($workspace->isAdmin()) $layout->setNavBarSetting('workspace_params', 'settings', false, 999);
            else $layout->setNavBarSetting('workspace_user', 'group', false, 999);
            
        return $layout;
    }

    private function _htmlButtonAction(string $id, string $icon, string $text, string $variation = 'secondary') {
        return html::tag('bnum-button', ['id' => $id, 'data-icon' => $icon, 'data-variation' => $variation], $text);
    }

    private function _htmlModuleBlock(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];
        $attribs = array_merge($attribs,         [
            'data-title-icon' => $icon, 
            'data-title-text' => $title,
        ]);

        $slot =  '<div slot="title" class="bds-flex">'. //html::div(['slot' => 'title', 'class' => 'bds-flex'],
            html::div(['class' => 'bds-flex'],
                html::tag('bnum-card-title', ['data-icon' => $icon], $title)
                ).
            html::div(['class' => 'action'], $button)
        .'</div>';

        $tag = $attribs['tag'] ? $attribs['tag'] : 'bnum-card';

        return html::tag($tag, $attribs, $slot.html::div(['class' => 'module-block-content'], $content));
    }

    private function _htmlModuleBlockSmall(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];
        $attribs['class'] ??= EMPTY_STRING;
        $attribs['class'] .= ' mode-small';

        return $this->_htmlModuleBlock($icon, $title, $button, $attribs, $content);
    }
};
};