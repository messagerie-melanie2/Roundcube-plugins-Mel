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
        $this->workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces();
        foreach ($this->workspaces as $key => $value) {
            $this->workspaces[$key]->load();
        }
    }

    function html()
    {

    }

    function create_block($workspace)
    {
        $html = $this->rc->output->parse("mel_portal.dwp_block", false, false);
        if ($workspace->logo !== null)
            str_replace("<workspace-image/>", '<div class=dwp-circle><img src="'.$workspace->logo.'"></div>', $html);
        else
            str_replace("<workspace-image/>", "<div class=dwp-circle></div>", $html);
        if (count($workspace->hashtags) > 0)
             str_replace("<workspace-#/>", $workspace->hashtags[0], $html);
        else
            str_replace("<workspace-#/>", "", $html);

        str_replace("<workspace-title/>", $workspace->title, $html);
        str_replace("<workspace-avancement/>", "", $html);

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
                $html_tmp.= '<div class="dwp-circle dwp-user"><img src="https://ariane.din.developpement-durable.gouv.fr/avatar/'.$s->user.'" /></div>';
                ++$it;
            }
            str_replace("<workspace-users/>", $html_tmp, $html);
        }
        else
            str_replace("<workspace-users/>", "", $html);

        if ($workspace->created === $workspace->modified)
            str_replace("<workspace-misc/>", "Crée par ".$workspace->creator, $html);
        else
        {
            str_replace("<workspace-misc/>", "Crée par ".$workspace->creator."<br/>Mise à jours : ".$workspace->modified, $html);
        }

        str_replace("<workspace-task-danger/>", "", $html);
        str_replace("<workspace-task-all/>", "", $html);

        str_replace("<workspace-notifications/>", "", $html);

    }

    
}