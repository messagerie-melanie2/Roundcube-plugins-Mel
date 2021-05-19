<?php
include_once "aHTMLElement.php";
include_once "HTMLBase.php";
/**
 * Représente un onglet en html avec son contenant.
 */
class HTMLTab extends aHTMLElement
{

    /**
     * Html associé à cette tabulation.
     *
     * @var iHTML
     */
    public $content;

    /**
     * @param string|null $id
     * @param iHTML|null $content - Si null, se sera un HTMLBaseElement.
     * @param Array|null $args
     */
    public function __construct($id, $content = null, $args = null)
    {
        parent::__construct($id, $args);

        $this->content = $content === null ? new HTMLBaseElement(null) : $content;
        $this->content->attributes[] = 'tabindex="0"';
        $this->content->attributes[] = 'role="tabpanel"';

        if ($id !== null)
            $this->content->arias[] = 'aria-labelledby="'.$id.'"';

        $this->attributes[] = 'role="tab"';
    }

    /**
     * Récupère l'onglet sous forme de string html. Le contenu associé n'est pas converti.
     *
     * @return string
     */
    public function toHtml()
    {
        $html = "<button ".$this->getHtmlId().$this->getHtmlClasses().$this->getHtmlAttributes().$this->getHtmlAttributes(true).">";
        $html .= $this->getHtmls();
        $html .= '</button>';
        return $html;
    }
}

/**
 * Représente une div avec des onglets.
 */
class HTMLDivTab extends aHTMLElement
{
    /**
     * Objet qui contiendra les différents panneaux associés aux onglets.
     *
     * @var iHTML
     */
    public $base;

    /**
     * Liste des différents onglets.
     *
     * @var Array<HTMLTab>
     */
    private $tabs;

    /**
     *
     * @param string|null $id
     * @param Array|null $args
     */
    public function __construct($id, $args = null)
    {
        parent::__construct($id, $args);

        $this->tabs = [];
        $this->base = new HTMLBaseElement(null);

        $this->attributes[] = 'role="tablist"';

        if ($args["aria-label"] !== null)
            $this->arias[] = 'aria-label="'.$args["aria-label"].'"';
    }

    /**
     * Ajoute un onglet à la liste des onglets.
     *
     * @param HTMLTab|null $tab
     * @return void
     */
    public function addTab(HTMLTab $tab = null)
    {
        if ($tab === null)
            $this->tabs[] = new HTMLTab(null);
        else
            $this->tabs[] = $tab;
    }

    /**
     * Récupère un onglet parmis la liste des onglets.
     *
     * @param int $index
     * @return HTMLTab
     */
    public function getTab($index)
    {
        return $this->tabs[$index];
    }

    /**
     * Récupère la liste des onglets
     *
     * @return Array<HTMLTab>
     */
    public function getTabs()
    {
        return $this->tabs;
    }

    /**
     * Convertit en string html.
     *
     * @return string
     */
    public function toHtml()
    {
        $this->update_tabs();
        $this->base->html("");
        $html = "<div ".$this->getHtmlId().$this->getHtmlClasses().$this->getHtmlAttributes().$this->getHtmlAttributes(true).">";
        
        if (!$this->is_empty($this->tabs))
        {
            $size = count($this->tabs);
            for ($i=0; $i < $size; ++$i) { 
                $html .= $this->tabs[$i]->toHtml();
                $this->base->append($this->tabs[$i]->content);
            }
        }

        $html .= '</div>';
        $html .= $this->base->toHtml();

        return $html;
    }

    /**
     * Supprime les différents attributs ajouter automatiquement.
     *
     * @return void
     */
    public function clear_automatiques_arias()
    {
        foreach ($this->tabs as $key => $value) {
            $this->clear_automatiques_arias_tab($this->tabs[$key]);
        }
    }

    /**
     * Supprime les différents attributs ajouter automatiquement d'un onglet.
     *
     * @param IHTML $tab
     * @return void
     */
    private function clear_automatiques_arias_tab(&$tab)
    {
        $newArias = [];

        foreach ($tab->arias as $key => $value) {
            if (!strpos($value, "aria-selected") && !strpos($value, "aria-controls"))
                $newArias[] = $value;
        }

        $index = array_search('hidden=""',$tab->content->attributes);
        if($index !== false){
            unset($tab->content->attributes[$index]);
            var_dump($tab->content->attributes);
        }

        $tab->arias = $newArias;
    }

    /**
     * Met à jours les onglets avec leurs pannaux associés.
     *
     * @return void
     */
    private function update_tabs()
    {
        $arias = [
            true => 'aria-selected="true"',
            false => 'aria-selected="false"',
            "control" => 'aria-controls="<id/>"'
        ];

        $attributes = [
            "hidden" => 'hidden=""'
        ];

        $size = count($this->tabs);
        for ($i=0; $i < $size; ++$i) { 

            if (!in_array($arias[true], $this->tabs[$i]->arias) && !in_array($arias[false], $this->tabs[$i]->arias))
            {
                if ($i === 0)
                    $this->tabs[$i]->arias[] = $arias[true];
                else
                {
                    $this->tabs[$i]->arias[] = $arias[false];

                    if (!in_array($attributes["hidden"], $this->tabs[$i]->content->attributes))
                        $this->tabs[$i]->content->attributes[] = $attributes["hidden"];
                }
            }

            $arias["control"] = str_replace("<id/>", $this->tabs[$i]->content->id, $arias["control"]);

            if (!in_array($arias["control"], $this->tabs[$i]->arias))
                $this->tabs[$i]->arias[] = $arias["control"];

            
        }
    }

}