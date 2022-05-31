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
mel_helper::html_helper();
include_once "search_result.php";
/**
 * Représente un contact une fois rechercher, ainsi que les actions à effectuer.
 */
class SearchResultContact extends ASearchResult
{
    private $username;
    private $mail;
    private $phone;
    private $pitcure;
    private $cid;
    private $source;
    public function __construct($contact, $search, $rcmail) {
        $nom = '';
        $prenom = '';

        if ($contact['name'] === null )
        {
            $nom = $contact['surname'];
            $prenom = $contact['firstname'];
        }
        else $prenom = $contact['name'];

        $mail = $this->mail($contact["email"], $search);
        $vcard = (new rcube_vcard($contact["vcard"]))->get_assoc();
        $tel = "";

        foreach ($contact as $key => $value) {
            if (strpos($key, "phone") !== false)
            {
                $tel = $value;
                break;
            }
        }

        $this->username = $this->wash_html("$nom $prenom");
        $this->mail = $this->wash_html($mail);
        $this->phone = $this->wash_html($tel);
        $this->picture = "./?_task=addressbook&_action=photo&_email=$email&_cid=".$contact['ID']."&_source=".$contact["sourceid"].'&_error=1';
        $this->cid = $contact['ID'];
        $this->source = $contact["sourceid"];

        parent::__construct('', $this->_create_action(), ['date' => null, 'raw' => $contact, 'picture', $this->pitcure]);
    }  

    protected function wash_html($text)
    {
        return str_replace('<', '&lt;', $text);
    }

    protected function _html()
    {
        $firstcol = $this->username;
        $secondcol = (!empty($this->mail) ? $this->mail : $this->phone);
        $thirdcol = ($this->phone === $secondcol ? '' : $this->phone);
        return html::div(["style" => "display:inline-block;margin-right:15px;"], html::div(["class" => "dwp-round", 'style' => 'background-color:white;'], '<img src="'.$this->picture.'" onerror="this.onerror = null; this.src = \'skins/elastic/images/contactpic.svg\';"/>')).
        html::div(['style' => 'display:inline-block;width:90%'], 
            html_helper::row([], html_helper::col(4, ['class' => 'col-item'], $firstcol).
            html_helper::col(6, ['class' => 'col-item'], $secondcol).
            html_helper::col(2, ['class' => 'col-item', 'style' => 'text-align:right'], $thirdcol)
            )
        );
    }

    private function _create_action()
    {
        $text = '';
        $onclick = 'rcmail.command(`mel.show_contact`, '.json_encode(['_task' => 'mel_metapage', 
        '_action' => 'contact',
        '_source' => $this->source,
        '_cid' => $this->cid]).')';

        if (isset($this->plugin)) $text = $this->plugin->gettext('seecontacts', 'mel_metapage');
        else $text = 'Voir dans les contacts';

        return $this->create_action($text, $onclick);
    }

    /**
     * Récupre l'en-tête.
     */
    function up($nom, $prenom, $contact)
    {
        $id = $contact['contact_id'] === null ? $contact['ID'] : $contact['contact_id'];

        $args = [
            "_task" => "mel_metapage",
            "_action" => "contact",
            "_cid" => $id,
            "_source" => $contact['sourceid']
        ];

        $function = "mm_s_CreateOrUpdateFrame('contacts', ".str_replace('"', "'", json_encode($args)).")";
        //$old = "mm_s_CreateOrUpdateFrame(`searchmail`, `?_task=mel_metapage&'.mel_metapage::FROM_KEY.'='.mel_metapage::FROM_VALUE.'&_action=contact&_cid='.$id.'&_source='.$contact['sourceid'].'`)";

        return '<a href="#" title="Ouvrir les informations du contact : \'\''.$prenom.' '.$nom.'\'\'" onclick="'.$function.'">'.$prenom." ".$nom."</a>";
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
        if (is_array($mails))
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
        else if ($mails !== "" && $mails !== null)
            return $mails;
        else
            return "";
    }
}