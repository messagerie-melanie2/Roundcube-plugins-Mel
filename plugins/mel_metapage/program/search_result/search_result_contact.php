<?php
/**
 * Plugin Mél Métapage
 *
 * Méta Page
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
include_once "search_result.php";
/**
 * Représente un contact une fois rechercher, ainsi que les actions à effectuer.
 */
class SearchResultContact extends ASearchResult
{
    public function __construct($contact, $search, $rcmail) {
        $nom = $contact['surname'];;
        $prenom = $contact['firstname'];
        $mail = $this->mail($contact["email"], $search);
        $vcard = (new rcube_vcard($contact["vcard"]))->get_assoc();
        $tel = "";
        foreach ($vcard as $key => $value) {
            if (strpos($key, "phone") !== false)
            {
                $tel = $value[0];
                break;
            }
        }
        parent::__construct($this->up($nom, $prenom, $contact), $this->down($mail, $tel), "");
    }  

    /**
     * Récupre l'en-tête.
     */
    function up($nom, $prenom, $contact)
    {
        return '<a href="?_task=mel_metapage&_action=contact&_cid='.$contact['contact_id'].'&_source='.$contact['sourceid'].'" onclick="mm_s_CreateOrUpdateFrame(`searchmail`, `?_task=mel_metapage&_action=contact&_cid='.$contact['contact_id'].'&_source='.$contact['sourceid'].'`)">'.$prenom." ".$nom."</a>";
    }

    /**
     * Récupère le corps.
     */
    function down($mail, $tel)
    {
        $retour = "";
        if ($mail !== "")
            $retour .= '<a href="#" onclick="return rcmail.open_compose_step({to:`'.$mail.'`})">'.$mail.'</a>';
        if ($mail !== "" && $tel !== "")
            $retour .= "<br/>";
        if ($tel !== "")
            $retour .= '<a href="tel:'.$tel.'" >'.$tel.'</a>';
        return $retour;
    }

    /**
     * Récupère le mail le plus pertinant à afficher.
     */
    function mail($mails, $search)
    {
        $size = count($mails);
        if ($size > 0)
        {
            foreach ($mails as $key => $mail) {
                if (strpos(strtoupper($mail), strtoupper($search)) !== false)
                    return $mail;
            }
            return $mails[0];
        }
        else
            return "";
    }
}