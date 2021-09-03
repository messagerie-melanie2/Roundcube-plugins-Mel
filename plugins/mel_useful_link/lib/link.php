<?php
class mel_link
{

    public $title;
    public $link;
    public $pin;
    public $createDate;
    public $from;//internet 1, intranet 2
    public $showWhen;//internet 1, intranet 2, toujours 0
    public $configKey;

    private function __construct() {

    }

    public function serialize()
    {
        return json_encode($this);
    }

    public function html($rc, $exit = false, $write = false)
    {
        $html = $rc->output->parse("mel_useful_link.template", $exit, $write);
        $html = str_replace("<id/>", $this->configKey, $html);
        $html = str_replace("<link/>", $this->link, $html);
        $html = str_replace("<reduced_link/>", $this->get_reduced_link(), $html);
        $html = str_replace("<create_date/>", $this->createDate === null ? "" : "Ajouté le ".$this->localEn(strftime("%d %B %Y",$this->createDate)), $html);
        $html = str_replace("<title/>", $this->title, $html);
        $html = str_replace("<datas/>", $this->toHtmlAttrDatas(), $html);
        $html = str_replace("<tak/>", $this->pin ? "active" : "", $html);
        $html = str_replace("<tak-text/>", $this->pin ? "Désépingler" : "Epingler", $html);

        return $html;
    }

    function toHtmlAttrDatas()
    {
        return 'data-title="'.$this->title.'" data-link="'.$this->link.'" data-from="'.$this->from.'" data-showWhen="'.$this->showWhen.'" data-id="'.$this->configKey.'"';
    }

    public function get_reduced_link()
    {
        $rl = $this->link;
        if (strpos($rl, "?_task=") !== false)
            $rl = "BNUM";
        else if ($rl[0] === "/")
            $rl = "Amélie";
        else 
            $rl = parse_url($rl)['host'];

        return $rl;
    }

    public static function create($id, $title, $link, $pin, $createDate, $from = 0, $showWhen = 0)
    {
        $mel_link = new mel_link();
        $mel_link->title = $title;
        $mel_link->link = $link;
        $mel_link->pin = $pin;
        $mel_link->createDate = $createDate;
        $mel_link->from = $from;
        $mel_link->showWhen = $showWhen;
        $mel_link->configKey = $id;

        return $mel_link;
    }

    public static function fromOldPortail($key, $item)
    {
        return self::create($key, $item["name"], $item["url"], false, null, $item["provenance"], strpos($key, "intranet") !== false ? "intranet" : (strpos($key, "internet") !== false ? "internet" : "always"));
    }

    public static function fromConfig($item)
    {
        if (is_string($item))
            $item = json_decode($item);

        $link;
        
        try {
            $link = self::create("unknown", $item["title"], $item["link"], $item["pin"], $item["createDate"], $item["from"]);

            if ($item["configKey"] !== null)
                $link->configKey = $item["configKey"];
        } catch (\Throwable $th) {
            $link = self::create("unknown", $item->title, $item->link, $item->pin, $item->createDate, $item->from);

            if ($item->configKey !== null)
                $link->configKey = $item->configKey;
        }

        return $link;
    }

    function localEn($txt)
    {
        if (strpos($txt, "January") !== false)
            return str_replace("January", "janvier", $txt);
        else if (strpos($txt, "February") !== false)
            return str_replace("February", "février", $txt);
        else if (strpos($txt, "March") !== false)
            return str_replace("March", "mars", $txt);
        else if (strpos($txt, "April") !== false)
            return str_replace("April", "avril", $txt);
        else if (strpos($txt, "May") !== false)
            return str_replace("May", "mai", $txt);
        else if (strpos($txt, "June") !== false)
            return str_replace("June", "juin", $txt);
        else if (strpos($txt, "July") !== false)
            return str_replace("July", "juillet", $txt);
        else if (strpos($txt, "August") !== false)
            return str_replace("August", "août", $txt);
        else if (strpos($txt, "September") !== false)
            return str_replace("September", "septembre", $txt);
        else if (strpos($txt, "October") !== false)
            return str_replace("October", "octobre", $txt);
        else if (strpos($txt, "November") !== false)
            return str_replace("November", "novembre", $txt);
        else if (strpos($txt, "December") !== false)
            return str_replace("December", "decembre", $txt);
        else 
            return $txt;
    }
}