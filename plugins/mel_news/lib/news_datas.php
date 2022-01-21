<?php
class news_date{

    private $published;
    private $modified;

    public function __construct($date, $editedDate)
    {
        $this->published = $date;
        $this->modified = $editedDate;
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

    public static function isRss($news)
    {
        return $news->description === null;
    }
}

class news_datas extends anews_datas
{
    public $date;
    public $text;

    public function __construct($news) {
        parent::__construct($news);
        $this->text = $news->description;
        $this->date = new news_date($news->created, $news->modified);
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        $model = str_replace("<type/>", "news", $model);
        $model = str_replace("<uid/>", $this->id, $model);
        $model = str_replace("<title/>", $this->title, $model);
        $model = str_replace("<text/>", $this->text, $model);
        $model = str_replace("<date/>", $this->tradDate($this->date->getFullDate($plugin), $plugin), $model);
        $model = str_replace("<service/>", ($plugin !== null ? $plugin->gettext("information", "mel_news")." " : "").$this->service, $model);
        $model = str_replace("<optional_style/>", ($optional_style === null ? "" : "style=\"$optional_style\""), $model);
        $model = str_replace("<div_title/>", ($title === null ? "" : "<h2>$title</h2>"), $model);
        return $model;
    }

    private function tradDate($date, $plugin = null)
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

    private function tryTradDate($value, $plugin = null)
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
    public $url;
    public $source;

    public function __construct($rss) {
        parent::__construct($rss);
        $this->url = $rss->url;
        $this->source = $rcc->source;
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        $model = str_replace("<type/>", "rss", $model);
        $model = str_replace("<uid/>", $this->id, $model);
        $model = str_replace("<title/>", $this->title, $model);
        $model = str_replace("<service/>", ($plugin !== null ? $plugin->gettext("information", "mel_news")." " : "").$this->service, $model);
        $model = str_replace("<optional_style/>", ($optional_style === null ? "" : "style=\"$optional_style\""), $model);
        $model = str_replace("<div_title/>", ($title === null ? "" : "<h2>$title</h2>"), $model);
        return $model;
    }
}

class custom_news_datas extends rss_datas
{
    public $size;
    public $feedUrl;

    public function __construct($url, $title, $creator, $source, $size, $feedUrl)
    {
        parent::__construct([]);
        $this->id = $url;
        $this->url = $url;
        $this->title = $title;
        $this->creator = $creator;
        $this->source = $source;
        $this->size = $size;
        $this->feedUrl = $feedUrl;
    }

    public function html($model, $plugin, $optional_style = null, $title = null)
    {
        return parent::html($model, $plugin, $optional_style, $title);
    }
}

class rss_xml_datas
{
    public $from;
    public $title;
    public $link;
    public $content;
    public $date;
    public function __construct($url, $xml)
    {

        $this->from = $url;
        $this->title = (string)$xml->channel->item[0]->title;
        $this->content = (string)$xml->channel->item[0]->description;
        $this->date = (string)$xml->channel->item[0]->date;
        $this->link = (string)$xml->channel->item[0]->link;
    }
}