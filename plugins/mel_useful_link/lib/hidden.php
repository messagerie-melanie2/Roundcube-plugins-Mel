<?php
class mel_hidden_links
{

    public const KEY_OLD = "old";
    public const KEY_NEW = "new";
    public const CONFIG= "portail_hidden_items";

    private $hidden;

    public function __construct($hidden = []) {
        $this->hidden = $hidden;
    }

    public function DEBUG()
    {
        return $this->hidden;
    }

    public function haveHidden()
    {
        $value = false;

        foreach ($this->hidden as $key => $array) {
            if ($value)
                break;

            foreach ($array as $parentKey => $value) {
                if ($value)
                    break;

                if ($this->check($key, $parentKey))
                    $value = true;
                else if (is_array($value))
                {
                    foreach ($value as $id => $val) {
                        if ($val === true)
                        {
                            $value = true;
                            break;
                        }
                    }
                }
            }
        }

        return $value;
    }

    public function set($primaryKey, $id, $parentId = null)
    {
        $isSubItem = $parentId !== null;

        if ($this->hidden[$primaryKey] === null)
            $this->hidden[$primaryKey] = [];

        if ($isSubItem)
        {
            if ($this->hidden[$primaryKey][$parentId] === null)
                $this->hidden[$primaryKey][$parentId] = [];
            else if ($this->hidden[$primaryKey][$parentId] === true)
                $this->hidden[$primaryKey][$parentId] = [true];

            if ($this->hidden[$primaryKey][$parentId][$id] === null)
                $this->hidden[$primaryKey][$parentId][$id] = true;
            else
                $this->hidden[$primaryKey][$parentId][$id] = !$this->hidden[$primaryKey][$parentId][$id];
        }
        else {
            if ($this->hidden[$primaryKey][$id] === null)
                $this->hidden[$primaryKey][$id] = true;
            else if (is_array($this->hidden[$primaryKey][$id]))
            {
                if ($this->hidden[$primaryKey][$id][0] === null)
                    $this->hidden[$primaryKey][$id][0] = true;
                else
                    $this->hidden[$primaryKey][$id][0] = !$this->hidden[$primaryKey][$id][0];
            }
            else
                $this->hidden[$primaryKey][$id] = !$this->hidden[$primaryKey][$id];
        }
    }

    public function set_old($id, $parentId = null)
    {
        $this->set(self::KEY_OLD, $id, $parentId);
    }

    public function set_new($id)
    {
        $this->set(self::KEY_NEW, $id);
    }

    public function check($primaryKey, $id, $parentId = null)
    {
        $hidden = $this->hidden;
        $value = false;
        $isSubItem = $parentId !== null;

        if ($hidden[$primaryKey] !== null)
        {
            if ($isSubItem && $hidden[$primaryKey][$parentId] !== null && $hidden[$primaryKey][$parentId][$id] !== null)
                $value = $hidden[$primaryKey][$parentId][$id];
            else if (!$isSubItem)
            {
                if ($hidden[$primaryKey][$id] !== null)
                {
                    if (is_array($hidden[$primaryKey][$id]) && $hidden[$primaryKey][$id][0] !== null)
                        $value = $hidden[$primaryKey][$id][0];
                    else if (!is_array($hidden[$primaryKey][$id]))
                        $value = $hidden[$primaryKey][$id];
                }
            }

        }

        return $value;
    }

    public function check_old($id, $parentId = null)
    {
        return $this->check(self::KEY_OLD, $id, $parentId);
    }

    public function check_new($id)
    {
        return $this->check(self::KEY_NEW, $id);
    }

    public function save(&$rc)
    {
        return $rc->user->save_prefs(array(self::CONFIG => $this->hidden));
    }

    public static function load($rc, $_default = [])
    {
        return new mel_hidden_links($rc->config->get(self::CONFIG, $_default));
    }

}