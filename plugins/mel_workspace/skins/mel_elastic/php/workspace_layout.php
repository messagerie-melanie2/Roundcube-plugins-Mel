<?php
class WorkspaceLayout extends AWorkspaceLayout {
    public function __construct(WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace)
    {
        return parent::__construct($layout, $plugin, $workspace);
    }

    public function render(): WorkspacePageLayout
    {
        $layout = $this->getLayout();
        $workspace = $this->getWorkspace();
        $plugin = $this->getPlugin(); 

        if (!$plugin->getUser()->is_external) {
            $layout->fourthRow()->append(4, $this->_htmlModuleBlock());//['id' => 'module-agenda', 'data-title' => 'Agenda de l\'espace', 'data-button' => 'calendar', 'data-button-text' => 'Créer', 'data-button-icon' => 'add_circle', 'data-button-ignore' => 'default-actions', 'data-button-type' => 'primary']));
            $layout->setNavBarSetting('mel_metapage.calendar', 'calendar_month', true, 1);
        }
    }

    private function _htmlButtonAction(string $icon, string $text) {}

    private function _htmlModuleBlock(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];
        $attribs = array_merge($attribs,         [
            'data-title-icon' => $icon, 
            'data-title-text' => $title,
        ]);
        return html::tag('bnum-card', $attribs, html::div(['class', 'module-block-content'], $content));
    }

    private function _htmlModuleBlockSmall(string $icon, string $title, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];
        $attribs['class'] ??= EMPTY_STRING;
        $attribs['class'] .= ' mode-small';

        return $this->_htmlModuleBlock($icon, $title, $attribs, $content);
    }
}