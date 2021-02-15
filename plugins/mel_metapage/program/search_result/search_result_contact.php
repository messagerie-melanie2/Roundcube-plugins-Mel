<?php
include_once "search_result.php";
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

    function up($nom, $prenom, $contact)
    {
        return '<a href="?_task=mel_metapage&_action=contact&_cid='.$contact['contact_id'].'&_source='.$contact['sourceid'].'" onclick="mm_s_CreateOrUpdateFrame(`searchmail`, `?_task=mel_metapage&_action=contact&_cid='.$contact['contact_id'].'&_source='.$contact['sourceid'].'`)">'.$prenom." ".$nom."</a>";
    }

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

    //http://localhost/?_task=addressbook&_framed=1&_cid=4&_action=show&_source=0

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