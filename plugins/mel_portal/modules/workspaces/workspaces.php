<?php
declare(strict_types = 1);

/**
 * Module "Espaces de travail" pour le portail Mél
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
 * Module « Espaces de travail » : espaces favoris de l'utilisateur (plugin mel_workspace).
 */
class Workspaces extends Module
{
    /** Nombre d'espaces favoris affichés. */
    private const MAX_WORKSPACES = 5;

    #[\Override]
    public function init(): void
    {
        $this->edit_row_size(12);
        $this->edit_order(6);
        $this->set_use_custom_style(true);
        mel_metapage::IncludeAvatar();
    }

    #[\Override]
    public function enabled(): bool
    {
        return class_exists('mel_workspace');
    }

    /**
     * Action AJAX : renvoie le html du module.
     *
     * @return string
     */
    #[BnumAction('get_html_workspaces', csrf: true)]
    public function get_workspaces(): string
    {
        return $this->generate_html();
    }

    #[\Override]
    protected function generate_html(): string
    {
        $workspaces = mel_workspace::LoadFavoriteWorkspaces(self::MAX_WORKSPACES, null, true);

        $title = html::div(
            ['style' => 'display: flex;align-items: center;justify-content: space-between;border-bottom: solid thin var(--bnum-color-border);padding-bottom: 5px;margin-bottom: 15px;margin-left: 14px;'],
            html::tag('h2', ['style' => 'float:left;margin-top:15px;margin-bottom: -5px;', 'class' => 'melv2-card-title-container-modified'], html::a(['class' => 'melv2-card-title'], $this->text('workspaces')))
            . html::tag('bnum-secondary-button', ['id' => 'wsp-see-all', 'title' => $this->text('see_all_workspaces_title'), 'data-icon' => 'arrow_forward', 'class' => '', 'style' => 'float:right;'], $this->text('see_all'))
        );

        return $title . html::div(['class' => '--row workspace-list'], mel_workspace::IncludeWorkspacesBlocks($workspaces));
    }

    #[\Override]
    protected function include_css(): void
    {
        $this->plugin->include_stylesheet('modules/workspaces/css/workspaces.css');
    }

    #[\Override]
    protected function include_js(): void
    {
        $this->plugin->include_script('modules/workspaces/js/init.js');
    }
}
