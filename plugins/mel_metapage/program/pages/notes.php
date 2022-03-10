<?php
class Sticker
{
    private $uid;
    private $order;
    private $title;
    private $text;
    private $color;
    private $textcolor;

    public function __construct($uid ,$order, $title, $text, $color, $textcolor)
    {
        $this->uid = $uid;
        $this->order = $order;
        $this->title = $title;
        $this->text = $text;
        $this->color = $color;
        $this->textcolor = $textcolor;
    }

    public function uid()
    {
        return $this->uid;
    }

    public function get(){
        return [
            "uid" => $this->uid,
            "order" => $this->order,
            "title" => $this->title,
            "text" => $this->text,
            "color" => $this->color,
            "textcolor" => $this->textcolor
        ];
    }
}

class Notes extends Page
{
    public const CONFIG = "user_notes";
    private $notes;

    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin, "notes", "");
        $this->init();
    }  

    protected function before_init() {
        $this->load();
        $this->set_env_var('mel_metapages_notes', $this->notes);
        $this->include_js('notes.js');
        //$this->save_config(self::CONFIG, []);
    }

    protected function set_handlers()
    {
    }

    protected function do_send()
    {
        return false;
    }

    public function before_page()
    {
        $action = $this->get_input_post("_a");

        switch ($action) {
            case 'add':
                $raw = $this->get_input_post("_raw");
                $this->createAndAddNewSticker($raw["order"], $raw["title"], $raw["text"], $raw["color"], $raw["textcolor"]);
                break;

            case 'del':
                $this->remove($this->get_input_post("_uid"));
                break;

            case 'move':
                $this->move($this->get_input_post("_uid"), $this->get_input_post("_order"));
                break;

            case 'update':
                $raw = $this->get_input_post("_raw");
                $this->update($this->get_input_post("_uid") ,$raw["title"], $raw["text"], $raw["color"], $raw["textcolor"]);
                $this->save();
                echo "break";
                exit;
            
            default:
                break;
        }

        $this->save();
        echo json_encode($this->notes);
        exit;
    }

    public function generate_uid()
    {
        $base_uid = "NOTE-";
        $it = 0;
        $enum = mel_helper::Enumerable($this->notes);

        do {
            $uid = $base_uid.($it++);
        } while ($enum->any(function ($v, $k) use($uid) { return $v["uid"] === $uid; }));

        return $uid;
    }

    public function createAndAddNewSticker($order, $title, $text, $color, $textcolor)
    {
        $order = intval($order);
        if ($order != -1)
        {
            foreach ($this->notes as $key => $value) {
                if ($value !== null && $value["order"] > $order) $this->notes[$key]["order"] += 1;
            }
        }
        $this->add(new Sticker($this->generate_uid(), ($order === -1 ? count($this->notes) : $order + 1), $title, $text, $color, $textcolor));
        //$this->update_order();
    }

    public function update($uid, $title, $text, $color, $textcolor)
    {
        $this->notes[$uid]["title"] = $title;
        $this->notes[$uid]["text"] = $text;
        $this->notes[$uid]["color"] = $color;
        $this->notes[$uid]["textcolor"] = $textcolor;
    }

    public function add($sticker)
    {
        $this->notes[$sticker->uid()] = $sticker->get();
    }

    public function remove($uid)
    {
        $order = $this->notes[$uid]["order"];
        unset($this->notes[$uid]);

        foreach ($this->notes as $key => $value) {
            if ($value !== null && $value["order"] > $order) $this->notes[$key]["order"] -= 1;
        }
    }

    public function move($uid, $newOrder)
    {
        $this->notes[$uid]["order"] = $newOrder;
    }

    private function update_order()
    {
         foreach ($this->notes as $key => $value) {
            $this->notes[$key]["order"] += 1;
         }
    }

    public function load()
    {
        $this->notes = $this->get_config(self::CONFIG, []);
    }

    public function save()
    {
        $this->save_config(self::CONFIG, $this->notes);
    }
}