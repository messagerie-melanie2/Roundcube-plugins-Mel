<?php
class Sticker
{
    private $uid;
    private $order;
    private $title;
    private $text;
    private $color;
    private $textcolor;
    private $pin;

    public function __construct($uid ,$order, $title, $text, $color, $textcolor, $pin = false)
    {
        $this->uid = $uid;
        $this->order = intval($order);
        $this->title = $title;
        $this->text = $text;
        $this->color = $color;
        $this->textcolor = $textcolor;
        $this->pin = $pin ?? false;
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
            "textcolor" => $this->textcolor,
            'pin' => $this->pin
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
        $this->set_env_var('reorder-notes', $this->get_config('reorder-notes', false));
        //$this->include_js('notes.js');
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
                $this->save();
                echo "break";
                exit;
                break;

            case 'drag_move':
                $this->drag_move($this->get_input_post("_uid"), $this->get_input_post("_order"));
                break;

            case 'update':
                $raw = $this->get_input_post("_raw");
                $this->update($this->get_input_post("_uid") ,$raw["title"], $raw["text"], $raw["color"], $raw["textcolor"]);
                $this->save();
                echo "break";
                exit;

            case 'pin':
                $this->notes[$this->get_input_post("_uid")]['pin'] = $this->get_input_post("_pin");
                $this->save();
                echo "break";
                exit;

            case 'pin_move':
                $this->notes[$this->get_input_post("_uid")]['pin_pos'] = [$this->get_input_post("_x"), $this->get_input_post("_y")];
                $this->notes[$this->get_input_post("_uid")]['pin_pos_init'] = [$this->get_input_post("_initX")];
                $this->save();
                echo "break";
                exit;

            case 'update_height':
                $this->update_height($this->get_input_post("_uid"), $this->get_input_post("_height"));
                break;

            case 'get':
                echo json_encode($this->notes);
                exit;

            case 'reorder':
                $this->save_config('reorder-notes', false);
                $this->force_reorder();
                echo 'rordered';
                break;
            
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
        } while ($enum->any(function ($k, $v) use($uid) { return $v["uid"] === $uid; }));

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
        $this->add(new Sticker($this->generate_uid(), ($order === -1 ? (mel_helper::Enumerable($this->notes)->select(function ($k, $v) {
            return $v['order'];
        })->max() ?? 0) + 1 : $order + 1), $title, $text, $color, $textcolor));
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

    public function drag_move($uid, $new_order) {
        $new_order = intval($new_order);
        $old = mel_helper::Enumerable($this->notes)->where(function ($k, $v) use($new_order) {
            return intval($v['order']) <= $new_order;
        });
        if ($old->any()) {
           foreach ($old as $key => $value) {
                $this->notes[$key]["order"] = intval($this->notes[$key]["order"]) - 1;
           }
        }

        $this->notes[$uid]["order"] = $new_order;


        $this->reorder_whithout_empty();
    }

    public function update_height($uid, $newHeight)
    {
        if ($newHeight <= 0) unset($this->notes[$uid]["height"]);
        else $this->notes[$uid]["height"] = $newHeight;
    }

    private function reorder_whithout_empty() {
        $enum = mel_helper::Enumerable($this->notes)->orderBy(function ($k, $v) {
            return intval($v['order']);
        });
        $it = 0;
        foreach ($enum as $key => $value) {
            $this->notes[$value['uid']]['order'] = $it++;
        }
    }

    private function force_reorder() {
        $it = 0;
        foreach ($this->notes as $key => $value) {
            $this->notes[$key]['order'] = $it++;
        }
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