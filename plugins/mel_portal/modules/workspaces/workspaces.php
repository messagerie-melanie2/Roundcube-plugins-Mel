<?php

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
        $this->edit_row_size(12);
        $this->workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces();
        $it = 0;
        foreach ($this->workspaces as $key => $value) {
             if ($it > 2)
                 break;
            $this->workspaces[$key]->load();
            ++$it;
        }
    }

    function generate_html()
    {
        $html = "";
        $it = 0;
        foreach ($this->workspaces as $key => $value) {
            if ($it > 2)
                break;
            $html .= $this->create_block($value);
            ++$it;
        } 
        return html::div(["class" => 'row'], $html);
    }

    function create_block($workspace)
    {
        $html = $this->rc->output->parse("mel_portal.dwp_block", false, false);
        $is_epingle = self::is_epingle($workspace);
        $html = str_replace("<workspace-id/>", "wsp-".$workspace->uid, $html);
        $html = str_replace("<workspace-public/>", $workspace->ispublic, $html);
        if ($is_epingle)
            $html = str_replace("<workspace-epingle/>", "active", $html);
        else
            $html = str_replace("<workspace-epingle/>", "", $html);
        if ($workspace->logo !== null && $workspace->logo !== "false")
            $html = str_replace("<workspace-image/>", '<div class=dwp-round><img src="'.$workspace->logo.'"></div>', $html);
        else
            $html = str_replace("<workspace-image/>", "<div class=dwp-round><span>".substr($workspace->title, 0, 3)."</span></div>", $html);
        if (count($workspace->hashtags) > 0 && $workspace->hashtags[0] !== "")
            $html = str_replace("<workspace-#/>", "#".$workspace->hashtags[0], $html);
        else
            $html = str_replace("<workspace-#/>", "", $html);

        $html = str_replace("<workspace-title/>", $workspace->title, $html);
        $html = str_replace("<workspace-avancement/>", "<br/><br/><br/>", $html);

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
                $html_tmp.= '<div data-user="'.$s->user.'" class="dwp-circle dwp-user"><img src="'.$this->rc->config->get('rocket_chat_url').'avatar/'.$s->user.'" /></div>';
                ++$it;
            }
            $html = str_replace("<workspace-users/>", $html_tmp, $html);
        }
        else
            $html = str_replace("<workspace-users/>", "", $html);

        if ($workspace->created === $workspace->modified)
            $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator, $html);
        else
        {
            $html = str_replace("<workspace-misc/>", "Crée par ".$workspace->creator."<br/>Mise à jours : ".$workspace->modified, $html);
        }

        $html = str_replace("<workspace-task-danger/>", "<br/>", $html);
        $html = str_replace("<workspace-task-all/>", "<br/>", $html);

        $html = str_replace("<workspace-notifications/>", "", $html);
        return html::div(["class" => "col-md-4"], $html);
    }

    function include_css(){
        $this->plugin->include_stylesheet('modules/workspaces/css/workspaces.css');
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/workspaces/js/init.js');
        //$this->plugin->include_script($this->folder().'/flux_rss/js/main.js');
    }

    public static function is_epingle($loaded_workspace)
    {
        $settings = json_decode($loaded_workspace->settings);
        if ($settings === null)
            return false;
        if ($settings->epingle === true)
            return true;
        return false;
    }

    
}