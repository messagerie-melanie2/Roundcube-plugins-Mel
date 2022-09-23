<?php
class mel_default_link
{
    public $pin;
    public $color;
    public $id;

    public function __construct($id)
    {
        $this->id = $id;
        $this->pin = false;
        $this->color = null;
    }

    public function setColor($color)
    {
        $this->color = $color;
        return $this;
    }

    public function setPin($pin)
    {
        $this->pin = $pin;
        return $this;
    }

    public function serialize()
    {
        return json_encode($this);
    }

    public static function load($serialized)
    {
        $serialized = json_decode($serialized);
        $link = $serialized->subId === null ? new mel_default_link($serialized->id) : new mel_default_link_sub_item($serialized->id, $serialized->subId);

        return $link->setColor($serialized->color)->setPin($serialized->pin);
    }

    public function isSubItem() {
        return false;
    }
}

class mel_default_link_sub_item extends mel_default_link
{
    public $subId;

    public function __construct($id, $subId)
    {
        parent::__construct($id);
        $this->subId = $subId;
    }

    public function isSubItem() {
        return true;
    }

    public static function create($id, $subId)
    {
        return isset($subId) ? new mel_default_link_sub_item($id, $subId) : new mel_default_link($id);
    }
}

class mel_link
{

    public $title;
    public $link;
    public $pin;
    public $createDate;
    public $from;//internet 1, intranet 2
    public $showWhen;//internet 1, intranet 2, toujours 0
    public $configKey;
    // public $subItem;
    public $subItemData;
    public $personal;
    public $hidden;
    public $color;
    public $textColor;

    protected function __construct() {
        $this->subItem = false;
        $this->subItemData = null;
        $this->personal = true;
        $this->hidden = false;
        $this->color = null;
    }

    public function subItem () {
        return $this->subItemData !== null;
    }

    public function serialize()
    {
        return json_encode($this);
    }

    public function html($rc, $exit = false, $write = false)
    {
        $html = $rc->output->parse("mel_useful_link.template", $exit, $write);
        $html = str_replace("<id/>", $this->configKey, $html);
        try {
            if (is_string($this->link)) $html = str_replace("<link/>", $this->link, $html);
            else {
                $html = str_replace("<link/>", 'ERROR', $html);
                $this->link = 'ERROR';
            }
        } catch (\Throwable $th) {
            $html = str_replace("<link/>", 'ERROR', $html);
            $this->link = 'ERROR';
        }
        $html = str_replace("<reduced_link/>", $this->get_reduced_link(), $html);
        $html = str_replace("<create_date/>", $this->createDate === null ? "" : "Ajouté le ".$this->localEn(strftime("%d %B %Y",$this->createDate)), $html);
        $html = str_replace("<title/>", $this->title, $html);
        $html = str_replace("<datas/>", $this->toHtmlAttrDatas(), $html);
        $html = str_replace("<tak/>", $this->pin ? "active" : "", $html);
        $html = str_replace("<tak-text/>", $this->pin ? "Désépingler" : "Epingler", $html);
        $html = str_replace("<hidden/>", $this->hidden ? "crossed-" : "", $html);
        $html = str_replace("<takHidden/>", $this->pin ? " style=display:none " : "", $html);
        $html = str_replace("<hiddenTitle/>", $this->hidden ? "Afficher le lien" : "Cacher le lien", $html);
        $html = str_replace("<hidden\>", $this->hidden ? " hidden-link " : "", $html);

        $style = $this->color !== null ? "border-color:".$this->color.";background-color:".$this->color.($this->hidden ? "6b;" : ";") : "";
        
        if (isset($this->textColor)) $style.= 'color:'.$this->textColor.';';
        else if (isset($this->color) && !isset($this->textColor)) $style.= 'color:#363A5b;';

        $html = str_replace("<color/>", $style, $html);

        if (false && !$this->personal)
            $html = str_replace("<personal/>", ' style="display:none;" ', $html);
        else
            $html = str_replace("<personal/>", '', $html);

        return $html;
    }

    public function toHtmlAttrDatas()
    {

        $isSubItem = $this->subItem();

        $html = 'data-title="'.$this->title.
        '" data-link="'.$this->link.
        '" data-from="'.$this->from.
        '" data-showWhen="'.$this->showWhen.
        '" data-id="'.$this->configKey.
        '" data-isHidden="'.$this->hidden.
        '" data-color="'.$this->color.
        '" data-textcolor="'.$this->textColor.
        '" data-subItem="'.($isSubItem ? "true" : "false").
        '" data-personal="'.($this->personal ? 'true' : 'false').'"';

        if ($isSubItem)
            $html .= ' data-subparent="'.$this->subItemData["parent"].
            '" data-subid="'.$this->subItemData["id"].'"';

        return $html;
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

        return ($rl === null || $rl === "") ? $this->link : $rl;
    }


    public static function create($id, $title, $link, $pin, $createDate, $from = 0, $showWhen = 0, $subItemData = null, $isPersonal = true, $color = null, $multiLink = false, $textColor = null)
    {
        $mel_link = ($multiLink ? mel_multi_link::empty() : new mel_link());
        $mel_link->title = $title;
        $mel_link->pin = $pin;
        $mel_link->createDate = $createDate;
        $mel_link->from = $from;
        $mel_link->showWhen = $showWhen;
        $mel_link->configKey = $id;
        $mel_link->subItemData = $subItemData;
        $mel_link->personal = $isPersonal;
        $mel_link->color = $color;
        $mel_link->textColor = $textColor;   

        if ($multiLink) $mel_link->links = $link;
        else $mel_link->link = $link;

        return $mel_link;
    }

    public static function fromOldPortail($key, $item, $subItemData = null)
    {
        $isMultiLink = $item["links"] != null || $item["buttons"] !== null;
        $link = self::create($key, 
        $item["name"], 
        $item["url"] === null ? $item["href"] : $item["url"], 
        false, 
        null, 
        $item["provenance"], 
        strpos($key, "intranet") !== false ? "intranet" : (strpos($key, "internet") !== false ? "internet" : "always"),
        $subItemData,
        $item["personal"],
        $item["color"] === null || $item["color"] === "default" ? null : $item["color"], $isMultiLink);

        if ($isMultiLink) {
            $link->links = [];

            $datas = $item['links'] ?? $item["buttons"];
            foreach ($datas as $key => $value) {
                $link->addLink($value['url'], $key);
            }
        }

        return $link;
    }

    public static function fromConfig($item)
    {
        if (is_string($item))
            $item = json_decode($item);

        $link;
        $itemLink;
        try {
            $itemLink = $item["links"] ?? $item["link"];
            $link = self::create("unknown", $item["title"], $itemLink, $item["pin"], $item["createDate"], $item["from"], 0, null, true, null, isset($item["links"]));

            if ($item["configKey"] !== null)
                $link->configKey = $item["configKey"];

            if ($item["subItemData"] !== null)
                $link->subItemData = $item["subItemData"];

             if ($item["color"] !== null)
                 $link->color = $item["color"];

            if ($item["textColor"] !== null)
                 $link->textColor = $item["textColor"];
                
        } catch (\Throwable $th) {
            $itemLink = $item->links ?? $item->link;
            $link = self::create("unknown", $item->title, $itemLink, $item->pin, $item->createDate, $item->from, $item->showWhen, null, true, null, isset($item->links));

            if ($item->configKey !== null)
                $link->configKey = $item->configKey;

             if ($item->subItemData !== null)
                 $link->subItemData = $item->subItemData;

             if ($item->color !== null)
                 $link->color = $item->color;

            if ($item->textColor !== null)
                 $link->textColor = $item->textColor;
        }

        return $link;
    }

    public static function updateDefaultConfig(&$noPersonalLink, $config)
    {
        $configKey = $noPersonalLink->subItem() ? $noPersonalLink->configKey.'|'.$noPersonalLink->subItemData["id"] : $noPersonalLink->configKey;
        if ($config[$configKey] !== null)
        {
            $no_personal = mel_default_link::load($config[$configKey]);
            $noPersonalLink->pin = $no_personal->pin;
            $noPersonalLink->color = $no_personal->color;
        }
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

class mel_multi_link extends mel_link{
    
    public $links;
    protected function __construct()
    {
        parent::__construct();
        $this->links = [];
    }

    public function addLink($link, $title)
    {
        $this->links[$link] = $title;
    }

    private function separate()
    {
        return '<separate style="margin: 0;border-color:#0000004d;"></separate>';
    }

    private function external()
    {
        return '<span style="margin-left:5px;align-self: end;margin-bottom: 10px;" class="icon-mel-external"></span>';
    }

    private function copy($link)
    {
        return '<a href="#" role="button" onclick="mel_metapage.Functions.copy(`'.$link.'`)" class="multilink-sub-copy" title="Copier le lien dans le presse-papier"><span class="icon-mel-copy"></span></a>';
    }

    private function get_reduced_link_from($link)
    {
        $rl = $link;
        if (strpos($rl, "?_task=") !== false)
            $rl = "BNUM";
        else if ($rl[0] === "/")
            $rl = "Amélie";
        else 
            $rl = parse_url($rl)['host'] ?? parse_url($rl)['path'];

        if (strpos($rl, 'www.') !== false) $rl = str_replace('www.', '', $rl);

        return ($rl === null || $rl === "") ? $link : $rl;
    }

    private function create_links()
    {
        $separate = $this->separate();
        $html = '';
        $rl = null;
        foreach ($this->links as $key => $value) {
            $html .= $separate;
            $rl = $this->get_reduced_link_from($key);
            if ($rl === 'BNUM') {
                $html = html::tag('a', [
                    'href' => '#',
                    'title' => "Ouvrir dans le bnum"
                ], $value);
            }
            else $html .= html::div(['style' => 'display:flex'], html::div(['class' => 'multilink-sub', 'onclick' => "mel_metapage.Functions.copy('$key')"], $this->copy($key)).html::div(['style' => 'padding:5px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;'], $value.' via '.html::tag('a', [
                'href' => $key,
                'title' => "Ouvrir dans un nouvel onglet"
            ], $rl)).$this->external());
        }
        $html .= $separate;

        return $html;
    }

    public function html($rc, $exit = false, $write = false)
    {
        $html = $rc->output->parse("mel_useful_link.template-multi-links", $exit, $write);
        $html = str_replace("<id/>", $this->configKey, $html);
        $html = str_replace("<link/>", $this->link, $html);
        $html = str_replace("<links/>", $this->create_links(), $html);
        $html = str_replace("<reduced_link/>", '', $html);
        $html = str_replace("<create_date/>", $this->createDate === null ? "" : "Ajouté le ".$this->localEn(strftime("%d %B %Y",$this->createDate)), $html);
        $html = str_replace("<title/>", $this->title, $html);
        $html = str_replace("<datas/>", $this->toHtmlAttrDatas(), $html);
        $html = str_replace("<tak/>", $this->pin ? "active" : "", $html);
        $html = str_replace("<tak-text/>", $this->pin ? "Désépingler" : "Epingler", $html);
        $html = str_replace("<hidden/>", $this->hidden ? "crossed-" : "", $html);
        $html = str_replace("<takHidden/>", $this->pin ? " style=display:none " : "", $html);
        $html = str_replace("<hiddenTitle/>", $this->hidden ? "Afficher le lien" : "Cacher le lien", $html);
        $html = str_replace("<hidden\>", $this->hidden ? " hidden-link " : "", $html);

        $style = $this->color !== null ? "border-color:".$this->color.";background-color:".$this->color.($this->hidden ? "6b;" : ";") : "";
        
        if (isset($this->textColor)) $style.= 'color:'.$this->textColor.';';
        else if (isset($this->color) && !isset($this->textColor)) $style.= 'color:#363A5b;';

        $html = str_replace("<color/>", $style, $html);

        if (false && !$this->personal)
            $html = str_replace("<personal/>", ' style="display:none;" ', $html);
        else
            $html = str_replace("<personal/>", '', $html);

        return $html;
    }

    function toHtmlAttrDatas()
    {
        $html = parent::toHtmlAttrDatas();
        $html .= '" data-links="'.str_replace('"', '¤', json_encode($this->links)).'"';

        return $html;
    }

    public static function empty() {
        return new mel_multi_link();
    }
}