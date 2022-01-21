<?php
include_once "tree_dn.php";
class user_dn
{
    public $user;
    private $dns;
    private $treeDn;
    private $cache;
    private $rights;

    public function __construct($user) {
        $dn = $user->dn;
        $dn = str_replace('ou=organisation,dc=equipement,dc=gouv,dc=fr', '', $dn);
        $this->dns = array_map([$this, "map"], explode(",", $dn));
        $this->treeDn = new tree_dn($this->dns);
        $this->user = $user;
        $this->rights = $user->getUserNewsShares();
    }

    public function get_dn()
    {
        return $this->dns;
    }

    private function map($item)
    {
        $splitted = explode("=", $item);
        return ["type" => $splitted[0], "name" => $splitted[1]];
    }

    private function set_to_cache($key, $data)
    {
        if ($this->cache === null)
            $this->cache = [];

        $this->cache[$key] = $data;
    }

    private function get_from_cache($key, $_default = null)
    {
        return $this->cache === null ? $_default : ($this->cache[$key] ?? $_default);
    }

    public function get_up_tree()
    {
        return $this->treeDn->getMaxParent();
    }

    public function get_down_tree()
    {
        return $this->treeDn->getMinChildren();
    }
}