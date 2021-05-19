<?php
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
class My_day extends Module
{
    /**
     * Clé de la configuration pour le lien lié au chargement des évènements.
     */
    const CALENDAR_EVENT_URL = "a";
        /**
     * Clé de la configuration pour le lien lié à la suppression des évènements.
     */
    const CALENDAR_REMOVE_EVENT_URL = "b";

    function init()
    {
        $this->config[$this::CALENDAR_EVENT_URL] = "?_task=calendar&_action=load_events";
        $this->config[$this::CALENDAR_REMOVE_EVENT_URL] = "?_task=calendar&_action=event";
        $this->edit_row_size(1);
    }

    /**
     * Génère le html de ce module.
     */
    function generate_html()
    {
        //tab agenda
        $agenda = array("name" => $this->text('agenda'), 
        "id" => "agenda",
        "tab-id" => "tab-for-agenda-content",
        "deco" => html::tag('span', array("class" => 'icon-mel-calendar marginright'),
        html::tag("sup", array(),
        html::tag("span", array("id" => "agendanew", "class" => "hidden roundbadge setalign lightgreen")))
    ),
        );
        $tasks = array("name" => $this->text('tasks'), 
                "id" => "tasks",
                "tab-id" => "tab-for-tasks-contents",
            "deco" => html::tag('span', array("class" => 'icon-mel-task marginright'),
            html::tag("sup", array(),
            html::tag("span", array("id" => "tasksnew", "class" => "hidden roundbadge setalign lightgreen")))
            ));

        return $this->html_square_tab(array($agenda, $tasks), $this->text("my_day"), "myday");
    }

    /**
     * Envoie les données utile en js pour faire fonctionner le module.
     */
    function set_js_vars()
    {
        $this->rc->output->set_env('ev_calendar_url', $this->config[$this::CALENDAR_EVENT_URL]);
        $this->rc->output->set_env('ev_remove_calendar_url', $this->config[$this::CALENDAR_REMOVE_EVENT_URL]);
    }

    /**
     * Chargement du js.
     */
    function include_js()
    {
        $this->plugin->include_script($this->folder().'/my_day/js/my_day.js');
    }

}