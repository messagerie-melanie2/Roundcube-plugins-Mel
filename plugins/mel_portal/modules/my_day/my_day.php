<?php
declare(strict_types = 1);

/**
 * Module "Ma journée" pour le portail Mél
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
 * Module « Prochains évènements » : agenda du jour (plugin calendar).
 */
class My_day extends Module
{
    /** Url de chargement des évènements. */
    public const CALENDAR_EVENT_URL = '?_task=calendar&_action=load_events';

    /** Url de suppression d'un évènement. */
    public const CALENDAR_REMOVE_EVENT_URL = '?_task=calendar&_action=event';

    #[\Override]
    public function init(): void
    {
        $this->edit_row_size(4);
        $this->edit_order(1);
        $this->set_use_custom_style(true);
    }

    #[\Override]
    public function enabled(): bool
    {
        return class_exists('calendar');
    }

    #[\Override]
    protected function generate_html(): string
    {
        return html::tag('bnum-card-agenda', ['loading' => 'true', 'data-max' => 3, 'data-url' => $this->rc->url(['_task' => 'calendar'])]);
    }

    #[\Override]
    protected function set_js_vars(): void
    {
        $this->rc->output->set_env('ev_calendar_url', self::CALENDAR_EVENT_URL);
        $this->rc->output->set_env('ev_remove_calendar_url', self::CALENDAR_REMOVE_EVENT_URL);
    }
}
