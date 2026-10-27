<?php

// Généré depuis bnum_glitchtip.bnum — ne pas éditer.

declare(strict_types=1);

namespace bnum_glitchtip\types;

/**
 * Portée des corps externalisés de \bnum_glitchtip (liés par Closure::bind) :
 * membres privés de \bnum_glitchtip, publics et protégés de \bnum_glitchtip et de ses parents.
 * Typer `$p` en `\bnum_glitchtip\types\scope`.
 *
 * @property string $task
 * @method void init()
 * @method array hook_startup(array $args)
 * @method array hook_fatal_error(array $args)
 * @method array hook_write_log(array $args)
 * @method array hook_log_call(array $args)
 * @method array hook_log_capture_error(array $args)
 * @method void _ensureGlitchtipIsInitialized()
 * @method static void logTrace(string $message, array $context = [ ], array $attributes = [ ])
 * @method static void logDebug(string $message, array $context = [ ], array $attributes = [ ])
 * @method static void logInfo(string $message, array $context = [ ], array $attributes = [ ])
 * @method static void logWarning(string $message, array $context = [ ], array $attributes = [ ])
 * @method static void logError(string $message, array $context = [ ], array $attributes = [ ])
 * @method static void logFatal(string $message, array $context = [ ], array $attributes = [ ])
 * @method static ?string captureException(\Throwable $throwable, array $extra = [ ], array $tags = [ ])
 * @method static bool isLogLevel(\LogLevel $level)
 * @method mixed load_script_module($name = \bnum_plugin::BASE_MODULE_NAME, $path = \bnum_plugin::BASE_MODULE_PATH, $save_in_memory = false)
 * @method mixed load_script_module_from_plugin($plugin, $name = \bnum_plugin::BASE_MODULE_NAME, $path = \bnum_plugin::BASE_MODULE_PATH, $save_in_memory = false, $where = 'docready')
 * @method mixed include_script_frame_manager()
 * @method mixed load_js_page($name)
 * @method mixed add_script($script, $where = 'head')
 * @method mixed break_initial_fonctionality($key)
 * @method mixed setup_module()
 * @method mixed force_register_action($action, $callback, $current_task = null)
 * @method mixed register_actions($array)
 * @method \rcmail rc()
 * @method \rcube_db db()
 * @method \rcube_storage storage()
 * @method static string get_imap_delimiter()
 * @method string get_current_task()
 * @method string get_current_action()
 * @method void assert_post_csrf()
 * @method void protect_actions(array $action_names)
 * @method bool is_index_action()
 * @method mixed get_input($arg, $type = \rcube_utils::INPUT_GPC, $allow_html = false)
 * @method mixed get_input_post($arg, $allow_html = false)
 * @method string get_input_sql($arg, $type = \rcube_utils::INPUT_GPC)
 * @method string get_input_ldap($arg, $type = \rcube_utils::INPUT_GPC, $dn = false)
 * @method string q($str, $mode = 'strict', $newlines = true)
 * @method mixed get_config($key, $default_value = null)
 * @method mixed set_env($key, $value)
 * @method mixed set_envs($envs)
 * @method bool send($templ = null)
 * @method mixed send_and_exit($templ = null)
 * @method mixed send_command($cmd, ...$args)
 * @method mixed send_commands(array $commands)
 * @method mixed set_page_title($title)
 * @method mixed show_message($message, $type = 'notice', $vars = null, $override = true, $timeout = 0)
 * @method mixed show_message_notice($message, $vars = null, $override = true, $timeout = 0)
 * @method mixed show_message_confirm($message, $vars = null, $override = true, $timeout = 0)
 * @method mixed show_message_error($message, $vars = null, $override = true, $timeout = 0)
 * @method mixed include_css($path, $local = false)
 * @method mixed add_hooks(array $hooks)
 * @method mixed exec_hook($hook, $args = [])
 * @method mixed add_handler($name, $callback)
 * @method mixed add_handlers(array $handlers)
 * @method mixed redirect($task, $action = null, $params = null)
 * @method bool is_bnum_task()
 * @method mixed get_user($uid = null)
 * @method mixed get_user_from_email($email)
 * @method mixed get_user_from_dn($dn)
 * @method mixed get_group($dn)
 * @method mixed ignore_footer()
 * @method mixed sendExit($item, $headers = [])
 * @method mixed sendEncodedExit($item, $headers = ['Content-Type: application/json'])
 * @method ?\WebComponnents include_web_component()
 * @method mixed include_component($name, $path = (\bnum_plugin::BASE_MODULE_PATH.'html/JsHtml/CustomAttributes'), $plugin = 'mel_metapage')
 * @method mixed include_module($name, $path = 'js/lib', $position = 'head')
 * @method mixed include_module_program($name, $path = null)
 * @method mixed include_module_action($name, $path = null)
 * @method mixed include_module_addon($name, $path = null)
 * @method mixed include_script_from_plugin($plugin, $fn, $pos = 'head_bottom')
 * @property string $ID
 * @property \rcube_plugin_api $api
 * @property bool $noajax
 * @property bool $noframe
 * @property array $allowed_prefs
 * @property string $home
 * @property string $urlbase
 * @method static array info()
 * @method bool require_plugin($plugin_name)
 * @method bool include_plugin($plugin_name)
 * @method bool load_config($fname = 'config.inc.php')
 * @method mixed add_hook($hook, $callback)
 * @method mixed remove_hook($hook, $callback)
 * @method mixed add_texts($dir, $add2client = false)
 * @method mixed add_label(...$args)
 * @method string gettext($p)
 * @method mixed register_task($task)
 * @method mixed register_action($action, $callback)
 * @method mixed register_handler($name, $callback)
 * @method mixed include_script($fn)
 * @method mixed include_stylesheet($fn)
 * @method mixed add_button($p, $container)
 * @method string url($fn)
 * @method string local_skin_path($extra_dir = null, $skin_name = null)
 */
interface scope {}
