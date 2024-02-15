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

    private $notes;
    private $notes_enabled;

    function init()
    {
        $this->config[$this::CALENDAR_EVENT_URL] = "?_task=calendar&_action=load_events";
        $this->config[$this::CALENDAR_REMOVE_EVENT_URL] = "?_task=calendar&_action=event";
        $this->edit_row_size(4);
        $this->edit_order(1);
        $this->set_name('Prochains évènements');
        $this->set_icon('today');
    }

    public function enabled() {
        return class_exists('calendar');
    }

    /**
     * Génère le html de ce module.
     */
    function generate_html()
    {
    //     $notes_is_enabled = $this->notes_is_enabled();
    //     $array = [];
        
    //     //tab agenda
    //     $agenda = array("name" => $this->text('agenda'), 
    //     "id" => "agenda",
    //     "tab-id" => "tab-for-agenda-content",
    //     "deco" => html::tag('span', array("class" => 'icon-mel-calendar marginright'),
    //     html::tag("sup", array(),
    //     html::tag("span", array("id" => "agendanew", "class" => "hidden roundbadge setalign lightgreen")))
    // ),
    //     );

    //     $array[] = $agenda;
    //     $tasks = array("name" => $this->text('tasks'), 
    //             "id" => "tasks",
    //             "tab-id" => "tab-for-tasks-contents",
    //         "deco" => html::tag('span', array("class" => 'icon-mel-task marginright'),
    //         html::tag("sup", array(),
    //         html::tag("span", array("id" => "tasksnew", "class" => "hidden roundbadge setalign lightgreen")))
    //         ));
    //     $array[] = $tasks;

    //     if ($notes_is_enabled) {
    //         $notes = [
    //             "name" => $this->text('notes'), 
    //             'id' => 'notes',
    //             'tab-id' => 'tab-for-notes-contents',
    //             'deco' => html::tag('span', array("class" => 'icon-mel-notes marginright'))
    //         ];

    //         $array[] = $notes;
    //     }

        return '';//$this->html_square_tab($array, $this->text($notes_is_enabled ? "my_day_and_notes" : "my_day"), "myday");
    }

    /**
     * Envoie les données utile en js pour faire fonctionner le module.
     */
    function set_js_vars()
    {
        $this->rc->output->set_env('ev_calendar_url', $this->config[$this::CALENDAR_EVENT_URL]);
        $this->rc->output->set_env('ev_remove_calendar_url', $this->config[$this::CALENDAR_REMOVE_EVENT_URL]);
        //$this->rc->output->set_env('notes_enabled', $this->notes_is_enabled());
    }

    /**
     * Chargement du js.
     */
    function include_js()
    {
        //$this->plugin->include_script($this->folder().'/my_day/js/my_day.js');
    }

    function get_notes()
    {
        if (!isset($this->notes)) $this->notes = $this->rc->config->get('user_notes', []);

        return $this->notes;
    }

    function notes_is_enabled()
    {
        if (!isset($this->notes_enabled)) $this->notes_enabled = $this->rc->config->get('notes-in-my-day-enabled', true);

        return false;//$this->notes_enabled;
    }

    function have_notes()
    {
        return $this->notes_is_enabled() && count($this->get_notes()) > 0;
    }

}