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
 * Représente un mail une fois rechercher, ainsi que les actions à effectuer.
 */
class SearchResultMail extends ASearchResult
{

    private $msg;
    public function __construct($msg, $plugin = null) {
        $this->msg = $msg;

        if (isset($plugin)) $this->set_plugin($plugin);

        parent::__construct('icon-mel-mail', $this->_create_action());
    }

    protected function _html()
    {
        $msg = $this->msg;
        $this->datas['date'] = $msg->date;

        $folderName = $this->get_folder_name($msg->folder);

        // if ($folderName === 'INBOX') $folderName = driver_mel::gi()->getUser()->fullname;
        // else {
        //     $folderName = driver_mel::gi()->getUser(explode('/', $msg->folder)[1])->fullname;
            
        //     if (strpos($folderName, ' (') !== false) $folderName = explode(' (', $folderName)[0];
        //     else if (strpos($folderName, ' -') !== false) $folderName = explode(' -', $folderName)[0];
        // }
        
        return html::div(['style' => 'display:inline-block;width:98%'], 
            html_helper::row([], html_helper::col(4, ['class' => 'col-item'], $folderName).
            html_helper::col(6, ['class' => 'col-item'], rcube_mime::decode_header($msg->subject, $msg->charset)).
            html_helper::col(2, ['class' => 'col-item', 'style' => 'text-align:right'], (new DateTime($this->datas['date']))->format('d/m/Y H:i'))
            )
        );
    }

    private function get_folder_name($name)
    {
        if ($name === 'INBOX') return driver_mel::gi()->getUser()->fullname;
        else if (strpos($name, 'INBOX') !== false)
        {
            $username = 'Courrier entrant';
            return str_replace('INBOX', $username, $name);
        }
        else if (strpos($name, 'Boite partag&AOk-e') !== false) return driver_mel::gi()->getUser(explode('/', $name)[1])->fullname;
        else {
            $username = driver_mel::gi()->getUser()->fullname;
            if (strlen($username) > 20) $username = substr($username, 0, 20).'...';
            return "$username/$name";
        }

       // return $name;
    }

    private function _create_action()
    {
        $text = '';
        $onclick = 'rcmail.command(`mel.showMail`, '.json_encode(["_uid" => $this->msg->uid, "_mbox" => $this->msg->folder]).')';

        if (false && isset($this->plugin)) $text = $this->plugin->gettext('seemail', 'mel_metapage');
        else $text = 'Voir le courrier sur mail';

        return $this->create_action($text, $onclick);
    }

    /**
     * Renvoie une liste de SearchResultMail via une liste de mails.
     */
    public static function create_from_array($msgs, $plugin)
    {
        $retour = new SearchResults();
        $count = count($msgs);
        for ($i=0; $i < $count; ++$i) { 
            $retour->add(new SearchResultMail($msgs[$i], $plugin));
        }
        return $retour;
    }
}