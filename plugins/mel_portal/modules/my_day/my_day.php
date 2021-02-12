<?php

class My_day extends Module
{
    const CALENDAR_EVENT_URL = "a";
    const CALENDAR_REMOVE_EVENT_URL = "b";

    function init()
    {
        $this->config[$this::CALENDAR_EVENT_URL] = "?_task=calendar&_action=load_events";
        $this->config[$this::CALENDAR_REMOVE_EVENT_URL] = "?_task=calendar&_action=event";
        $this->edit_row_size(4);
    }


    function generate_html()
    {
        $agenda = array("name" => $this->text('agenda'), 
        "id" => "agenda",
        "deco" => html::tag('span', array("class" => 'icofont-calendar marginright'),
        html::tag("sup", array(),
        html::tag("span", array("id" => "agendanew", "class" => "hidden roundbadge setalign lightgreen")))
        )
        );
        $tasks = array("name" => $this->text('tasks'), 
                "id" => "tasks",
            "deco" => html::tag('span', array("class" => 'icofont-checked marginright'),
            html::tag("sup", array(),
            html::tag("span", array("id" => "tasksnew", "class" => "hidden roundbadge setalign lightgreen")))
            ));
        return $this->html_square_tab(array($agenda, $tasks), $this->text("my_day"), "myday");//,
    }

    function set_js_vars()
    {
        $this->rc->output->set_env('ev_calendar_url', $this->config[$this::CALENDAR_EVENT_URL]);
        $this->rc->output->set_env('ev_remove_calendar_url', $this->config[$this::CALENDAR_REMOVE_EVENT_URL]);
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/my_day/js/my_day.js');
    }

}