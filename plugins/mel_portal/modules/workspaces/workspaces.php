<?php

include_once "../module_action.php";

use LibMelanie\Api\Defaut\Workspaces\Share;

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
class Workspaces extends Module
{
    private $workspaces;
    function init()
    {
        // $user = driver_mel::gi()->getUser();
        // $workspace = driver_mel::gi()->workspace([$user]);
        // $workspace->uid = uniqid(md5(time()), true);
        // $workspace->title = 'Mon autre espace de travail';
        // $workspace->description = 'C\'est un autre test pour voir';
        // $workspace->creator = $user->uid;
        // $workspace->created = new DateTime('now');
        // $workspace->modified = new DateTime('now');
        // $workspace->ispublic = false;
        // $workspace->hashtags = ['Interministériel'];
        // $res = $workspace->save();
        // $workspace->load();
        // $shares = [];
        // $share = driver_mel::gi()->workspace_share([$workspace]);
        // $share->user = $user->uid;
        // $share->rights = Share::RIGHT_OWNER;
        // $shares[] = $share;
        // $workspace->shares = $shares;

        // $res = $workspace->save();
        $this->edit_row_size(3);

        // $it = 0;
        // foreach ($this->workspaces as $key => $value) {
        //      if ($it > 2)
        //          break;
        //     $this->workspaces[$key]->load();
        //     ++$it;
        // }
    }

    function generate_html()
    {
        $html = "";
        $it = 0;
        $this->workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false);
        foreach ($this->workspaces as $key => $value) {
            if ($it > 2)
                break;
            if ($value->isarchived)
                continue;
            $html .= $this->create_block($value, $it, count($this->workspaces) > 3 ? 3 : count($this->workspaces));
            ++$it;
        } 
        $title = html::div([],
            html::tag("h2", ["style" => "float:left;margin-top:15px;margin-bottom: -5px;"], $this->text("workspaces")).
            html::tag("button", ["title" => "Afficher la liste des espaces de travail", "class" => "mel-button", "style" => "float:right;", "onclick" => "mel_metapage.Functions.change_frame('wsp')"], html::tag("span", [], "Voir tout").html::tag("span", ["class" => "icon-mel-arrow-right plus"]))
        );

        return $title.html::div(["class" => '--row'], $html);
    }

    function create_block($workspace, $_it, $count)
    {
        $username = driver_mel::gi()->getUser($workspace->creator)->name;

        $ws = $this->rc->plugins->get_plugin('mel_workspace');
        $html = $this->rc->output->parse("mel_portal.dwp_block", false, false);
        $is_epingle = mel_workspace::is_epingle($workspace->uid, $this->rc);
        $html = str_replace("<workspace-id/>", "wsp-".$workspace->uid, $html);
        $html = str_replace("<workspace-public/>", $workspace->ispublic, $html);
        if ($is_epingle)
        {
            $html = str_replace("<workspace-epingle/>", "active", $html);
            $html = str_replace("<workspace-epingle-title/>", $this->text('untak'), $html);
        }
        else
        {
            $html = str_replace("<workspace-epingle/>", "", $html);
            $html = str_replace("<workspace-epingle-title/>", $this->text('tak'), $html);
        }
        if ($workspace->logo !== null && $workspace->logo !== "false")
            $html = str_replace("<workspace-image/>", '<div class=dwp-round style=background-color:'.$ws->get_setting($workspace, "color").'><img alt="" src="'.$workspace->logo.'"></div>', $html);
        else
            $html = str_replace("<workspace-image/>", "<div class=dwp-round style=background-color:".$ws->get_setting($workspace, "color")."><span>".substr($workspace->title, 0, 3)."</span></div>", $html);
        if (count($workspace->hashtags) > 0 && $workspace->hashtags[0] !== "")
            $html = str_replace("<workspace-#/>", "#".$workspace->hashtags[0], $html);
        else
            $html = str_replace("<workspace-#/>", "", $html);

        $html = str_replace("<workspace-title/>", $workspace->title, $html);
        //$html = str_replace("<workspace-avancement/>", "<br/><br/><br/>", $html);

        if ($workspace->shares !== null)
        {
            //"https://ariane.din.developpement-durable.gouv.fr/avatar/$uid"
            $it = 0;
            $html_tmp = "";
            foreach ($workspace->shares as $s)
            {
                if ($it == 2)
                {
                    $html_tmp.='<div class="dwp-circle dwp-user"><span>+'.(count($workspace->shares)-2).'</span></div>';
                    break;
                }
                $html_tmp.= '<div data-user="'.$s->user.'" class="dwp-circle dwp-user"><img alt="" src="'.$this->rc->config->get('rocket_chat_url').'avatar/'.$s->user.'" /></div>';
                ++$it;
            }
            $html = str_replace("<workspace-users/>", $html_tmp, $html);
        }
        else
            $html = str_replace("<workspace-users/>", "", $html);

        if ($workspace->created === $workspace->modified)
            $html = str_replace("<workspace-misc/>", "Crée par ".$username, $html);
        else
        {
            $html = str_replace("<workspace-misc/>", "Crée par ".$username."<br/>Mise à jour : ".date("d/m/Y", strtotime($workspace->modified)), $html);
        }

        $html = str_replace("<workspace-task-danger/>", "<br/>", $html);

        $nb_tasks = 0;
        $html = $ws->get_tasks($workspace, $html, "<workspace-avancement/>", $nb_tasks);
        if ($nb_tasks > 0)
            $html = str_replace("<workspace-task-all/>", html::p(["class" => "wsp-task-all-number-div-parent"], "<span class=wsp-task-all-number>$nb_tasks</span><br/>tâches au total"), $html);
        else 
            $html = str_replace("<workspace-task-all/>", html::p(["style" => "color:transparent", "class" => "wsp-task-all-number-div-parent"], "<span class=wsp-task-all-number>0</span><br/>tâches au total"), $html);


        $services = $ws->get_worskpace_services($workspace);
        $tmp_html = "";
        foreach ($services as $key => $value) {
            if ($value)
            {
                switch ($key) {



                    case mel_workspace::TASKS:
                        break;

                    case mel_workspace::WEKAN:
                        break;

                    case mel_workspace::LINKS:
                        break;

                    case mel_workspace::CHANNEL:
                        $tmp_html .= '<div class="wsp-notif-block"><span class=ariane><span style="display:none" class="ariane-notif roundbadge lightgreen">0</span><span class="icon-mel-message ariane-icon"><span></span></div>';  
                        break;              
                    default:
                        $tmp_html .= '<button onclick="wsp_action_notif(this, `fromphp_'.$key.'`)" class="mel-hover btn-mel-invisible btn-text btn btn-secondary wsp-notif-block  mel-portail-displayed-wsp-notif" style=display:none;><span class='.$key.'><span class="'.$key.'-notif wsp-notif roundbadge lightgreen">0</span><span class="replacedClass"><span></span></button>';
                    break;
                }
            }
        }
        $html = str_replace("<workspace-notifications/>", $tmp_html, $html);
        return html::div(["class" => "--col ".($_it > 0 ? ($_it === 1 && $count === 2 ? "--col-l" : ($_it != $count-1 ? "--col-m" : "")) : "")], $html);
    }

    function include_css(){
        $this->plugin->include_stylesheet('modules/workspaces/css/workspaces.css');
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/workspaces/js/init.js');
        //$this->plugin->include_script($this->folder().'/flux_rss/js/main.js');
    }

    public function register_actions()
    {
        return [
            new Module_Action("get_html_workspaces", $this, "get_workspaces")
        ];
    }

    public function get_workspaces()
    {
        echo $this->generate_html();
        exit;
    }

    // public static function is_epingle($loaded_workspace)
    // {
    //     $settings = json_decode($loaded_workspace->settings);
    //     if ($settings === null)
    //         return false;
    //     if ($settings->epingle === true)
    //         return true;
    //     return false;
    // }

    
}