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
 * Représente un mail une fois rechercher, ainsi que les actions à effectuer.
 */
class SearchResultMail extends ASearchResult
{
    /**
     * Action à faire.
     */
    public $onclick;

    public function __construct($msg) {
        //$a  = rcube_mime::decode_header($msg->date, $msg->charset);
        $a1 = rcube_mime::decode_header($msg->from, $msg->charset);
        $date = new DateTime($msg->date);
        $up = '<div style="display:flex;">'.
        '<span '.$this->style_up().'>'.$date->format('H:i d/m/Y').'</span>'.$this->space().'<span  '.$this->style_up(false).'>'.$a1.'<span>'
        .'</div>';
        $down = '<div '.$this->style_down().'>'.rcube_mime::decode_header($msg->subject, $msg->charset).'</div>';
        parent::__construct( $up
        , $down,
         "#");
         $this->onclick = "mm_s_CreateOrUpdateFrame('mail', '?_task=mail&_mbox=INBOX&_uid=".$msg->uid."&_action=show')";
    }  

    /**
     * Style du titre.
     */
    function style_up($b = true)
    {
        return 'style="font-size:smaller;flex: '.(($b) ? '0' : '1'). ' 0 auto"';
    }

    /**
     * Correspond à un espace.
     */
    function space()
    {
        return '<space style="flex:100 0 auto"></space>';
    }

    /**
     * Style du corps.
     */
    function style_down()
    {
        return 'style="font-size:initial;width:100%;text-align:center;"';
    }

    /**
     * Renvoie une liste de SearchResultMail via une liste de mails.
     */
    public static function create_from_array($msgs)
    {
        $retour = new SearchResults();
        $count = count($msgs);
        for ($i=0; $i < $count; ++$i) { 
            $retour->add(new SearchResultMail($msgs[$i]));
        }
        return $retour;
    }
}