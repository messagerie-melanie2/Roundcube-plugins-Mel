<?php
include_once "iHTML.php";
/**
 * Implémente l'interface iHTML, classe de base pour la représentation d'éléments plus ou moins complexe en html.
 */
abstract class aHTMLElement implements iHTML
{
    /**
     * Clé pour le paramètre $args du constructeur.
     */
    const ARG_ARIA = "arias";
    /**
     * Clé pour le paramètre $args du constructeur.
     */
    const ARG_ATTRIBUTES = "attributes";
    /**
     * Clé pour le paramètre $args du constructeur.
     */
    const ARG_CLASSES = "classes";

    /**
     * Liste de chaque attributs "aria".
     */
    public $arias;
    /**
     * Liste de chaque attributs.
     */
    public $attributes;
    /**
     * Liste des différentes classes de l'objet.
     */
    public $classes;
    /**
     * Id de l'objet.
     */
    public $id;

    /**
     * Différents objets HTML ou string fils.
     */
    private $htmls;

    /**
     * @param string $id - Id de l'objet HTML. Peut être nul.
     * @param string $args - Dictionnaire qui contient la liste des attributs ainsi que des classes.
     */
    public function __construct($id, $args = null) {
        $this->$id;
        $this->arias = [];
        $this->attributes = [];
        $this->classes = [];
        $this->htmls = [];

        //Récupération des données depuis $args
        if ($args != null && is_array($args) && !empty($args))
        {
            foreach ($args as $key => $value) {
                switch ($key) {
                    case self::ARG_ARIA:
                        $this->arias = $value;
                        break;
                    case self::ARG_ATTRIBUTES:
                        $this->attributes = $value;
                        break;
                    case self::ARG_CLASSES:
                        $this->classes = $value;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Récupère l'objet sous forme de string html ou assigne un objet HTML ou un string.
     * @param $newHtml - objet qui implément iHTML ou un string.
     * @throws Exception
     * @return string
     */
    public function html($newHtml = null)
    {
        $return = null;

        if ($newHtml === null)
            $return = $this->toHtml();
        else
        {
            if (is_subclass_of($newHtml, "iHTML") || is_string($newHtml))
                $this->htmls = [$newHtml];
            else
                throw new Exception("###[aHTMLElement-html]La valeur passer en paramètre doit être nul, un string ou un objet implémentant l'interface iHTML.");
        }

        return $return;
    }

    /**
     * Ajoute un objet html ou un string à la liste des objets fils.
     *
     * @param iHTML|string $html
     * @throws Exception
     * @return void
     */
    public function append($html)
    {
        if (is_subclass_of($html, "iHTML") || is_string($html))
            $this->htmls[] = $html;
        else
            throw new Exception("###[aHTMLElement-append]La valeur passer en paramètre doit être un string ou un objet implémentant l'interface iHTML.");
    }

    /**
     * Renvoie un code html sour forme de string, créer à partir des données de la classe.
     *
     * @return string
     */
    abstract public function toHtml();

    /**
     * Vérifie si une variable implémente iHTML, si c'est le cas, elle est renvoyé sous forme de string. 
     * Si la variable est déjà un string, elle sera renvoyé aussi.
     *
     * @param iHTML|string $item
     * @throws Exception
     * @return string
     */
    protected function getHtml($item)
    {
        $return = null;

        if (is_subclass_of($item, "iHTML"))
            $return = $item->toHtml();
        else if (is_string($item))
            $return = $item;
        else
            throw new Exception("###[aHTMLElement-getHtml]La valeur passer en paramètre doit être un string ou un objet implémentant l'interface iHTML.");

        return $return;
    }

    /**
     * Récupère un string composé des objets htmls fils.
     * 
     * @return string
     */
    protected function getHtmls()
    {
        $html = "";

        if (!$this->is_empty($this->htmls))
        {
            $size = count($this->htmls);
            for ($i=0; $i < $size; ++$i) { 
                $html .= $this->getHtml($this->htmls[$i]);
            }
        }

        return $html;
    }

    /**
     * Récupère l'id sous forme de d'attribut html. (id="monId")
     *
     * @return string
     */
    protected function getHtmlId()
    {
        $html = "";

        if ($this->id !== null)
            $html .= 'id="'.$this->id.'" ';

        return $html;
    }

    /**
     * Récupère les classes sous forme d'attribut html. (class="...")
     *
     * @return string
     */
    protected function getHtmlClasses()
    {
        $html = "";

        if (!$this->is_empty($this->classes))
        {
            $html .= 'class="';
            $size = count($this->classes);
            for ($i=0; $i < $size; ++$i) { 
                $html .= $this->classes[$i]." ";
            }
            $html .= '" ';
        }

        return $html;
    }

    /**
     * Récupère les différents attributs sous forme de string. (ex:type="button")
     *
     * @param boolean $isAria - Si vrai, il s'agit d'attributs aria.
     * @return string
     */
    protected function getHtmlAttributes($isAria = false)
    {
        return $this->getHtmlArray($isAria ? $this->arias : $this->attributes);
    }

    /**
     * Transforme un tableau en string où chaque éléments du tableau sont séparés par des espaces.
     *
     * @param Array $array
     * @return string
     */
    protected function getHtmlArray($array)
    {
        $html = "";

        if (!$this->is_empty($array))
        {
            $size = count($array);
            for ($i=0; $i < $size; ++$i) { 
                $html .= $array[$i]." ";
            }
        }

        return $html;
    }

    /**
     * Vérifie si une variable implémente iHTML ou est un string.
     *
     * @param object $element
     * @return boolean
     */
    protected function checkIfValidElement($element)
    {
        return is_subclass_of($element, "iHTML") || is_string($element);
    }

    protected function is_empty(&$val) {
        return empty($val) && $val !== "0";
      }
}