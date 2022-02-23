<?php
class news_date{

    public $published;
    public $modified;

    public function __construct($date, $editedDate)
    {
        $this->published = $date;
        $this->modified = $editedDate;
    }

    public function toTime()
    {
        return strtotime($this->getType() ? $this->modified  : $this->published);
    }

    public function get_raw()
    {
        return $this->getType() ? $this->modified : $this->published;
    }

    public function date($format = "d/m/Y")
    {
        if ($this->getType())
            return date($format, strtotime($this->modified));
        else
            return date($format, strtotime($this->published));
    }

    public function getType()
    {
        //MODIFIED
        if ($this->$modified !== null && $this->published !== $this->modified)
            return true;
        else //PUBLISHED
            return false;
    }

    public function getFullDate($plugin = null, $format = "l d M Y")
    {
        return $plugin !== null ? ($this->getType() ? $plugin->gettext("modified", "mel_news") : $plugin->gettext("created", "mel_news"))." ".$this->date($format) : $this->date($format);
    }
}

abstract class anews_datas {
    public $id;
    public $title;
    public $service;
    public $creator;

    public function __construct($news)
    {
        $this->id = $news->uid;
        $this->title = $news->title;
        $this->service = $news->service_name;
        $this->creator = $news->creator_id;
    }

    public abstract function html($model, $plugin, $optional_style = null, $title = null);
    public abstract function is();

    protected function tradDate($date, $plugin = null)
    {
        if ($plugin !== null)
        {
            $exploded = explode(" ", $date);
            $date = "";

            foreach ($exploded as $value) {
                $date .= str_replace("[", "", str_replace("]", "", $this->tryTradDate($value, $plugin)))." ";
            }
        }

        return $date;
    }

    protected function tryTradDate($value, $plugin = null)
    {
        if ($plugin !== null)
        {
            $lowered = strtolower($value);
            $tmp = $plugin->gettext("long$lowered");

            if (strpos($tmp, '[') === false)
                return $tmp;
            else 
            {
                $tmp = $plugin->gettext($lowered);

                if (strpos($tmp, '[') === false)
                    return $tmp;
            }
        }

        return $value;
    }
    
    public static function isRss($news)
    {
        return $news->description === null;
    }

    public function isCustomNews()
    {
        return $this->url !== null;
    }
}

class news_datas extends anews_datas
{
    public const IS = "news";

    public $date;
    public $text;
    private $_isPublisher;
    private $_service;

    public function __construct($news) {
        parent::__construct($news);
        $this->text = $news->description;
        $this->date = new news_date($news->created, $news->modified);
        $this->_isPublisher = $news->publisher;
        $this->_service = $news->service;
    }

    public function getService()
    {
        return $this->_service;
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        $button_edit = '<button style="margin:0;opacity:0;pointer-events:none;" title="Button inutile" onclick="" class="mel-button roundbadge large r-news"><span class=" icon-mel-pencil"><span class="sr-only">Modifier</span></span></button>';

        if ($this->_isPublisher === true)
            $button_edit = '<button style="margin:0" title="Editer" onclick="rcmail.command(\'news.published.edit\', this)" class="mel-button roundbadge large r-news"><span class=" icon-mel-pencil"><span class="sr-only">Modifier</span></span></button>';
        //$button_copy = '<button style="margin-top:0;margin-right:5px;" title="Copier" onclick="rcmail.command(\'news.copy\', `'.($this->source === "twitter" ? 'https://twitter.com/'.$this->url : $this->datas->link).'`)" class="mel-button roundbadge large r-news"><span class=" icon-mel-copy"><span class="sr-only">Copier le lien</span></span></button>';

        if ($this->service === "organisation") $this->service = $plugin->rc->config->get('ldap_organisation_name', $this->service);
        //else if ($this->service === explode('=', explode(",", $this->_service, 2)[0])[1]) $this->service = mel_helper::get_service_name($this->_service);

        //<headlines_other_classes/>
        $model = str_replace("<type/>", "news", $model);
        $model = str_replace("<uid/>", $this->id, $model);
        $model = str_replace("<site/>", "", $model);
        $model = str_replace("<raw_date/>", $this->date->get_raw(), $model);
        $model = str_replace("<datalink/>", "", $model);
        $model = str_replace("<datacopy/>", "", $model);
        $model = str_replace("<dataformat/>", "small", $model);
        $model = str_replace("<datatype/>", $this->_service, $model);
        $model = str_replace("<title/>", $this->title, $model);
        $model = str_replace("<headlines_other_classes/>", "", $model);
        $model = str_replace("<text/>", $this->text, $model);
        $model = str_replace("<date/>", $this->tradDate($this->date->getFullDate($plugin), $plugin), $model);
        $model = str_replace("<service/>", ($plugin !== null ? $plugin->gettext("information", "mel_news")." " : "").$this->service, $model);
        $model = str_replace("<optional_style/>", ($optional_style === null ? "" : "style=\"$optional_style\""), $model);
        $model = str_replace("<div_title/>", ($title === null ? "" : "<h2>$title</h2>"), $model);
        $model = str_replace("<additionnal_contents/>", '<div style="position: absolute;bottom: 30px;" class="headlines-source"><p>Source : '.'Bnum'."</p><p class='p-buttons'>$button_edit</p></div>", $model);
 
        return $model;
    }

    public function is()
    {
        return self::IS;
    }

    public static function generatorFromArray($array, $directHtml = false, $model = "", $plugin = null)
    {
        $count = count($array);

        for ($i=0; $i < $count; ++$i) { 
            yield ($directHtml ? (new news_datas($array[$i]))->html($model, $plugin) : new news_datas($array[$i]));
        }
    }

    public static function fromArray($array, $directHtml = false, $model = "", $plugin = null)
    {
        $newArray = [];
        
        foreach (self::generatorFromArray($array, $directHtml, $model, $plugin) as $value) {
            $newArray[] = $value;
        }

        return $newArray;
    }
}

class rss_datas extends anews_datas
{
    public const IS = "RSS";

    public $url;
    public $source;

    public function __construct($rss) {
        parent::__construct($rss);
        $this->url = $rss->url;
        $this->source = $rss->source;
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        $model = str_replace("<site/>", "", $model);
        $model = str_replace("<raw_date/>", "", $model);
        $model = str_replace("<additionnal_contents/>", "", $model);
        $model = str_replace("<headlines_other_classes/>", "", $model);
        $model = str_replace("<datalink/>", "", $model);
        $model = str_replace("<datacopy/>", "", $model);
        $model = str_replace("<dataformat/>", "small", $model);
        $model = str_replace("<datatype/>", $this->source, $model);
        $model = str_replace("<type/>", "rss", $model);
        $model = str_replace("<uid/>", $this->id, $model);
        $model = str_replace("<title/>", $this->title, $model);
        $model = str_replace("<service/>", ($plugin !== null ? $plugin->gettext("information", "mel_news")." " : "").$this->service, $model);
        $model = str_replace("<optional_style/>", ($optional_style === null ? "" : "style=\"$optional_style\""), $model);
        $model = str_replace("<div_title/>", ($title === null ? "" : "<h2>$title</h2>"), $model);
        return $model;
    }

    public function is()
    {
        return self::IS;
    }
}

class custom_news_datas extends rss_datas
{
    public $size;
    public $feedUrl;
    public $loaded;
    public $datas;

    public function __construct($url ,$size, $feedUrl, $source, $already_loaded = false)
    {
        parent::__construct([]);
        $this->id = $url;
        $this->url = $url;
        $this->title = '';
        $this->creator = '';
        $this->source = $source;
        $this->size = $size;
        $this->feedUrl = $feedUrl;
        $this->loaded = $already_loaded;
        $this->fromServer = false;
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        $model = str_replace("<datalink/>", $this->feedUrl, $model);
        $model = str_replace("<dataformat/>", $this->size, $model);
        $model = str_replace("<datatype/>", $this->source, $model);
        $model = str_replace("<datacopy/>", $this->datas->link, $model);
        $model = str_replace("<headlines_other_classes/>", "headlines-rss-type", $model);

        $button_edit = '<button style="margin:0" title="Editer" onclick="rcmail.command(\'news.edit\', this)" class="mel-button roundbadge large r-news"><span class=" icon-mel-pencil"><span class="sr-only">Modifier</span></span></button>';
        $button_copy = '<button style="margin-top:0;margin-right:5px;" title="Copier" onclick="rcmail.command(\'news.copy\', '.($this->source === "twitter" ? '`https://twitter.com/'.$this->url."`" : '$(this)').')" class="mel-button roundbadge large r-news"><span class=" icon-mel-copy"><span class="sr-only">Copier le lien</span></span></button>';

        if ($this->source === "twitter")
        {
            //<a class="twitter-timeline" href="https://twitter.com/unkonwnusercreatedd?ref_src=twsrc%5Etfw">Tweets by Rotomeca</a>
            $model = str_replace("<site/>", $this->source, $model);
            $model = str_replace("<title/>", "", $model);
            $model = str_replace("<date/>", "", $model);
            $model = str_replace("<service/>", "", $model);
            $model = str_replace("<text/>", '<a class="twitter-timeline" href="https://twitter.com/'.$this->url.'?ref_src=twsrc%5Etfw"></a>', $model);
            $model = str_replace("<additionnal_contents/>", "<div class=\"headlines-source\"><p>Source : Twitter</p><p class='p-buttons'>$button_copy $button_edit</p></div>", $model);
            $model = str_replace("<type/>", "rss twitter", $model);
        }
        else {
            if ($this->loaded)
            {
                $date = new news_date($this->datas->date, $this->datas->date);
                $model = str_replace("<site/>", $this->service, $model);
                $model = str_replace("<raw_date/>", $date->get_raw(), $model);
                $model = str_replace("<title/>", $this->datas->title, $model);
                $model = str_replace("<text/>", $this->datas->content, $model);
                $model = str_replace("<service/>", $this->service, $model);
                $model = str_replace("<date/>", $this->tradDate($date->getFullDate($plugin), $plugin), $model);
                $model = str_replace("<additionnal_contents/>", '<div style="position: absolute;bottom: 30px;" class="headlines-source"><p>Source : '.ucfirst($this->source)."</p><p class='p-buttons'>$button_copy $button_edit</p></div>", $model);
            }
            else {
                $model = str_replace("<service/>", $this->url, $model);
                $model = str_replace("<text/>", '<span style=display:block>Chargement....</span><span class="spinner-grow"></span>', $model);
                $model = str_replace("<additionnal_contents/>", "", $model);
            }
        }
        $model = parent::html($model, $plugin, $optional_style, $title);
        return $model;
    }

    public function setId($addonId)
    {
        $this->id .= "@$addonId";
        return $this;
    }

    public function setDatas($rss_xml_datas, $service)
    {
        $this->service = $service;
        $this->datas = $rss_xml_datas;
        $this->loaded = true;
        return $this;
    }

    public function get_datas()
    {
        return $this->datas;
    }
}

class server_news_data extends custom_news_datas
{
    public $isPublisher;
    public $serverUid;
    public $serverService;

    public function __construct($url ,$size, $feedUrl, $source, $isPublisher, $uid, $service, $already_loaded = false)
    {
        parent::__construct($url, $size, $feedUrl, $source, $already_loaded);
        $this->isPublisher = $isPublisher;
        $this->serverUid = $uid;
        $this->serverService = $service;
    }

    private function getServerDatas()
    {
        return rcube_ldap::dn_encode(json_encode([
            "isPublisher" => $this->isPublisher,
            "uid" => $this->serverUid,
            "service" => $this->serverService
        ]));
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {

        if ($this->loaded)
        {
            $button_edit = '<button style="margin:0" data-news="'.$this->getServerDatas().'" title="Editer" onclick="rcmail.command(\'news.edit\', this)" class="mel-button roundbadge large r-news"><span class=" icon-mel-pencil"><span class="sr-only">Modifier</span></span></button>';
            $button_copy = '<button style="margin-top:0;margin-right:5px;" title="Copier" onclick="rcmail.command(\'news.copy\', '.($this->source === "twitter" ? '`https://twitter.com/'.$this->url.'`' : '$(this)').')" class="mel-button roundbadge large r-news"><span class=" icon-mel-copy"><span class="sr-only">Copier le lien</span></span></button>';
            $model = str_replace("<additionnal_contents/>", '<div style="position: absolute;bottom: 30px;" class="headlines-source"><p>Source : '.ucfirst($this->source)."</p><p class='p-buttons'>$button_copy $button_edit</p></div>", $model);
        }
        
        $model = parent::html($model, $plugin, $optional_style, $title);
        return $model;
    }
}

class rss_xml_datas
{
    public $from;
    public $title;
    public $link;
    public $content;
    public $date;
    public function __construct($url, $xml, $item = 0)
    {

        $this->from = $url;
        $this->title = (string)$xml->channel->item[$item]->title;
        $this->content = (string)$xml->channel->item[$item]->description;
        $this->date = (string)$xml->channel->item[$item]->date;
        $this->link = (string)$xml->channel->item[$item]->link;
    }

    public static function loadAll($url, $xml)
    {
        $array = [];
        foreach (self::generateAll() as $value) {
            $array[] = $value;
        }

        return $array;
    }

    public static function generateAll($url, $xml)
    {
        $size = count((array)$xml->channel->item);

        for ($i=0; $i < $size; ++$i) { 
            yield new rss_xml_datas($url, $xml, $i);
        }

    }
}