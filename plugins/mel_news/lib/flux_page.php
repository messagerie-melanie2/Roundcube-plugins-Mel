<?php
class flux_page_position
{
    private $pos;
    public function __construct($config)
    {
        $this->pos = $config;
    }

    public function add($url) {
        if ($this->pos[$url] === null)  $this->pos[$url] = count($this->pos);

        return $this;
    }

    public function remove($url) {}

    public function move($url, $pos) {}

    public function getForSave()
    {
        return $pos;
    }
}
class flux_page_disposition
{
    public const key_flux = "flux";
    public const key_pos = "positions";

    private $flux;
    private $positions;

    public function __construct($config)
    {
        $this->flux = $config["flux"] ?? [];
        $this->positions = new flux_page_position($config["positions"] ?? []);
    }

    public function generatePositions()
    {
        foreach ($this->flux as $key => $value) {
            $this->positions->add($key);
        }

        return $this;
    }

    public static function GeneratePositionsFromNews($allNews)
    {

    }

    public function add($url, $format, $source, $fromServer = false) {
        if ($this->flux[$url] === null)
        {
            $this->flux[$url] = [
                "format" => $format,
                "source" => $source,
                "fromServer" => $fromServer
            ];
            $this->positions->add($url);
            return true;
        }

        return false;
    }

    public function edit_flux($url, $newUrl, $newFormat)
    {
        $url_action = $url;

        if ($url !== $newUrl && $this->flux[$newUrl] === null)
        {
            $this->flux[$newUrl] = $this->flux[$url];
            unset($this->flux[$url]);
            $url_action = $newUrl;
        }
        else if ($url !== $newUrl && $this->flux[$newUrl] !== null)
            return false;
        
        if ($this->flux[$url_action] !== null)
        {
            $this->flux[$url_action]["format"] = $newFormat;
        }
        else return false;

        return true;
    }

    public function getServerUid($url)
    {
        return $this->flux[$url]["serverUid"];
    }

    public function getServerService($url)
    {
        return $this->flux[$url]["serverService"];
    }

    public function setFromServer($url, $uid, $service)
    {
        $this->flux[$url]["fromServer"] = true;
        $this->flux[$url]["serverUid"] = $uid;
        $this->flux[$url]["serverService"] = $service;
        $this->flux[$url]["flag"] = true;
        return $this;
    }

    public function removeFromServer($url)
    {
        $this->flux[$url]["fromServer"] = false;
        unset($this->flux[$url]["serverUid"]);
        unset($this->flux[$url]["serverService"]);
        return $this;
    }

    public function setPublisher($url, $isPublisher)
    {
        $this->flux[$url]["publisher"] = $isPublisher;
        $this->flux[$url]["flag"] = true;
        return $this;
    }

    public function isPublisher($url)
    {
        return $this->isFromServer($url) && $this->flux[$url]["publisher"] === true;
    }

    public function removeFromServerNotFlagged()
    {
        foreach ($this->flux as $url => $values) {
            if ($this->isFromServer($url) && $values["flag"] !== true)
                unset($this->flux[$url]);
            else if ($values["flag"] === true)
                unset($this->flux[$url]["flag"]);
        }

        return $this;
    }

    public function isFromServer($url)
    {
        return $this->flux[$url]["fromServer"] === true;
    }

    public function remove($url) {
        unset($this->flux[$url]);
        return $this;
    }

    public function deplace() {}

    public function generateHtml() {}

    public function getForSave() {
        return [self::key_flux => $this->flux, self::key_pos => $this->positions->getForSave()];
    }

    public function exist($flux)
    {
        return $this->flux[$flux] !== null;
    }

    public function generator_flux()
    {
        foreach ($this->flux as $key => $value) {
            yield ["url" => $key, "datas" => $value];
        }
    }
}