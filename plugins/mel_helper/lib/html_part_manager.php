<?php
class HtmlPartManager
{
    private $html;
    public function __construct($html) {
        $this->html = $html;
    }

    public function switch_part($partA, $partB) {
        $partA = $this->_get_sliced($partA);
        $partB = $this->_get_sliced($partB);
        

        $this->html = str_replace($partA, '¤¤$ROTOMECA¤¤', $this->html);
        $this->html = str_replace($partB, $partA, $this->html);
        $this->html = str_replace('¤¤$ROTOMECA¤¤', $partB, $this->html);

        return $this;
    }

    public function get() {
        return $this->html;
    }

    private function _get_sliced($part) {
        $sliced = explode("<!--part:$part-->", $this->html);
        $partCutted = explode("<!--endpart:$part-->", $sliced[1]);
        $partCutted = "<!--part:$part-->$partCutted[0]<!--endpart:$part-->";

        return $partCutted;
    }
}