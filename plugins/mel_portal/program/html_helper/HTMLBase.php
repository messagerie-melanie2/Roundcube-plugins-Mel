<?php
include_once "aHTMLElement.php";
/**
 * Représente une div avec du html à l'intérieur.
 */
class HTMLBaseElement extends aHTMLElement
{
    /**
     * @param string|null $id - Id de la div. Peux être nul.
     * @param Array|null $args - Dictionnaire qui contient les classes, attributs et arias.
     */
    public function __construct($id, $args = null)
    {
        parent::__construct($id, $args);
    }

    /**
     * Récupère la div sous forme de string.
     *
     * @return string
     */
    public function toHtml()
    {
        $html = "<div ".$this->getHtmlId().$this->getHtmlClasses().$this->getHtmlAttributes().$this->getHtmlAttributes(true).">";
        $html .= $this->getHtmls();
        $html .= '</div>';
        return $html;
    }
}