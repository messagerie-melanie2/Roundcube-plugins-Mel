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
        $this->setup();
    }

    function setup()
    {
        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();
        $this->require_plugin('mel_helper');
        $this->add_hook('ready', [$this, 'ready']);
    }

    function ready()
    {
        $this->init_modules(
            [
                'base', 
                'consts',
                'interfaces',
                'notes',
                'pages',
                'search',
                'search_page',
                'search_result',
                'webconf'
            ]
        );
    }

    function init_modules($exceptions)
    {
        $dir = __DIR__;
        $folders = scandir(__DIR__."/program");

        foreach ($folders as $folder) {
           if (is_dir(__DIR__."/program/".$folder) && $folder !== '.' && $folder !== '..')
           {
                if (in_array($folder, $exceptions)) continue;
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
                try {
                    if ($submodule->have_plugin()[Consts::RETURN])
                    {
                        if ($this->rc->task === $submodule->program_task())
                        {
                            $submodule->init();
                        }
        
                        $submodule->public();
                    }
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }
        }

        return $this;
    }
}