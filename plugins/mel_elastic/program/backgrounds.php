<?php
class Background {
    public const PATH = './skins/mel_elastic/images/backgrounds';
    public const PATH_BACK = self::PATH.'/backgrounds_images/';
    public const PATH_VIEW = self::PATH.'/backgrounds_views/';
    private $isFirst;
    private $isThemeColor;
    private $background;
    private $view;
    public function __construct($decoded){
        $this->isFirst = $decoded->isFirst;
        $this->isThemeColor = $decoded->isThemeColor;
        $this->background = $decoded->background;
        $this->view = $decoded->view;
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

        if ($this->isThemeColor) $item['isThemeColor'] = $this->isThemeColor;
        else {
            $item['background'] = $this->get_background_path();
            $item['view'] = $this->get_view_path();
        }
        
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