<?php
/**
 * Plugin Mél Métapage
 *
 * Méta Page
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_metapage extends rcube_plugin
{
    public const FROM_KEY = "_is_from";
    public const FROM_VALUE = "iframe";

    /**
     * Contient l'instance de rcmail
     * @var rcmail
     */
    public $rc;
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    public const SPIED_TASK_DRIVE = "drive";
    public const SPIED_TASK_CHAT = "chat";
    public const SPIED_TASK_KANBAN = "kanban";
    public const SPIED_TASK_SONDAGE = "sondage";
    private static $urls_spies;
    private static $widgets;

    public static function add_url_spied($url, $task)
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        self::$urls_spies[$url] = $task;
    }

    public static function get_urls_spied()
    {
        if (self::$urls_spies === null) self::$urls_spies = [];

        return self::$urls_spies;
    }

    public static function add_widget($name ,$task, $arg)
    {
        if (self::$widgets === null) self::$widgets = [];

        self::$widgets[$name] = "/_task=$task&_action=mel_widget&_is_from=iframe" . ($arg === null ? '' : "&_arg=$arg");
    }

    public static function get_widgets()
    {
        if (self::$widgets === null) self::$widgets = [];

        return self::$widgets;
    }

    public static function can_add_widget($exception = [])
    {
        $task = rcmail::get_instance()->task;

        return false && ($task === 'bureau' ||  $task === 'settings');
    }

    function init()
    {
        $this->setup()->init_sub_modules();

        if ($this->rc->task === "chat") $this->register_action('index', array($this, 'chat'));
    }

    function init_sub_modules()
    {
        $dir = __DIR__;
        $folders = scandir(__DIR__."/program");

        foreach ($folders as $folder) {
           if (is_dir(__DIR__."/program/".$folder) && $folder !== '.' && $folder !== '..')
           {
                if ($folder === 'pages') 
                {
                    $this->init_sub_pages();
                    continue;
                }
                else if (in_array($folder, $exception)) continue;
                else {
                    $files = scandir(__DIR__."/program/".$folder);

                    foreach ($files as $file) {
                        if (strpos($file, ".php") !== false)
                        {
                            include_once __DIR__.'/program/'.$folder.'/'.$file;
                        }
                    }
                }
           }
        }

        if (class_exists('Program'))
        {
            foreach (Program::generate($this->rc, $this) as $submodule) {
                if ($this->rc->task === $submodule->program_task())
                {
                    $submodule->init();
                }

                $submodule->public();
            }
        }

        return $this;
    }

    function init_sub_pages()
    {
        $dir = __DIR__;
        $files = scandir(__DIR__."/program/pages");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".php") !== false && $files[$i] !== "page.php" && $files[$i] !== "parsed_page.php")
            {
                include_once "program/pages/".$files[$i];
                $classname = str_replace(".php", "", ucfirst($files[$i]));
                $object = new $classname($this->rc, $this);

                if (method_exists($object, "call"))
                    $object->call();

                if ($this->rc->task === "custom_page")
                    $object->init();

            }
        }
    }

    function setup()
    {
        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();
        $this->require_plugin('mel_helper');
    }

}