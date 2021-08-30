<?php
class mel_link
{

    public $title;
    public $link;
    public $pin;
    public $createDate;
    public $from;
    public $configKey;

    private function __construct() {

    }

    public function serialize()
    {
        return json_encode($this);
    }

    public function isFromOldPortail()
    {
        return $this->configKey !== null;
    }

    public static function create($title, $link, $pin, $createDate, $from = 0)
    {
        $mel_link = new mel_link();
        $mel_link->title = $title;
        $mel_link->link = $link;
        $mel_link->pin = $pin;
        $mel_link->createDate = $createDate;
        $mel_link->from = $from;

        return $mel_link;
    }

    public static function fromOldPortail($key, $item)
    {
        $link = self::create($item["name"], $item["url"], false, null, $item["provenance"] === "internet" ? 1 : $item["provenance"] === "intranet" ? 2 : 0);
        $link->configKey = $key;

        return $link;
    }

    public static function fromConfig($item)
    {
        if (is_string($item))
            $item = json_decode($item);

        $link;
        
        if ($item->pin !== null && $item["pin"] === null)
            $link = self::create($item->title, $item->link, $item->pin, $item->createDate, $item->from);
        else
            $link = self::create($item["title"], $item["link"], $item["pin"], $item["createDate"], $item["from"]);
        
        if ($item->configKey !== null)
            $link->configKey = $item->configKey;
        else if ($item["configKey"] !== null)
            $link->configKey = $item["configKey"];

        return $link;
    }
}