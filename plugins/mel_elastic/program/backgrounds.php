<?php
class Background {
    public const PATH = './skins/mel_elastic/images/backgrounds';
    public const PATH_BACK = self::PATH.'/backgrounds_images/';
    public const PATH_VIEW = self::PATH.'/backgrounds_views/';
    private $isFirst;
    private $isThemeColor;
    private $background;
    private $view;
    private $customOrder;
    private $userprefid;
    private $title;
    public function __construct($decoded){
        $this->isFirst = $decoded->isFirst;
        $this->isThemeColor = $decoded->isThemeColor;
        $this->background = $decoded->background;
        $this->view = $decoded->view;
        $this->customOrder = $decoded->customOrder;
        $this->userprefid = $decoded->userprefid;
        $this->title = $decoded->title;
    }

    public function get_background_path(){
        return self::PATH_BACK.$this->background;
    }

    public function get_view_path(){
        return self::PATH_VIEW.$this->view;
    }

    public function for_serialize() {
        $item = [];

        if ($this->isFirst) $item['isFirst'] = $this->isFirst;

        if (isset($this->customOrder)) $item['customOrder'] = $this->customOrder;

        if (isset($this->userprefid)) {
            $item['userprefid'] = $this->userprefid;
            $pref = rcmail::get_instance()->config->get($this->userprefid, null);

            if (isset($pref)) {
                $item['background'] = $pref;
                $this->isThemeColor = false;
            }
        };

        if ($this->isThemeColor) $item['isThemeColor'] = $this->isThemeColor;
        else if (!isset($item['background'])){
            $item['background'] = $this->get_background_path();
            $item['view'] = $this->get_view_path();
        }

        if (isset($this->title)) $item['title'] = $this->title;
        
        return $item;
    }

    static function from_path($path) {
        $backs = [];
        $datas = json_decode(file_get_contents($path));

        foreach ($datas as $key => $decoded) {
            $backs[$key] = (new Background($decoded))->for_serialize();
        }

        return $backs;
    }
}