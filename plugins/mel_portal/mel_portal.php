<?php
class mel_portal extends rcube_plugin
{
    /**
     * Contient l'instance de rcmail
     * @var rcmail
     */
    private $rc;
    /**
     * Contient le nom de la tâhce pour pouvoir entrer dans ce plugin.
     */
    public $taskName;
    /**
     * Nom de la barre sur le côté.
     */
    public $sidebarName;
    /**
     * Nom du css de ce plugin.
     */
    private $cssName;
    /**
     * Nom du template de ce plugin
     */
    private $templateName;
    /**
     * Le html des différents modules qui seront affiché sur la page.
     */
    private $modules_html;
    /**
     * Le html du menu de gauche.
     */
    private $left_menu;
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';
    /**
     * Méthode héritée de rcube_plugin
     * pour l'initialisation du plugin
     * @see rcube_plugin::init()
     */
    function init()
    {
        $this->setup();
        $this->include_depedencies();
        $this->load_modules_actions();
        if ($this->rc->task == $this->taskName)
            $this->portal();
    }

    /**
     * Met en place le plugin (appelé dans init())
     */
    function setup()
    {

        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();
        $this->load_config();
        $this->setup_config();
        $this->add_texts('localization/', true);
        $this->register_task($this->taskName);
        // Ajoute le bouton en fonction de la skin
        if (false && $this->rc->config->get('skin') == 'mel_elastic')
        {

        }
        else{
        $this->add_button(array(
            'command' => $this->taskName,
            'class'	=> 'button-home order1 icofont-home',
            'classsel' => 'button-home button-selected order1 icofont-home',
            'innerclass' => 'button-inner',
            'label'	=> 'portal',
            'title' => '',
            'type'       => 'link',
            'domain' => $this->taskName
        ), $this->sidebarName);
      }
    }

    /**
     * Récupère les données de la config de ce plugin.
     */
    function setup_config()
    {
        $config = $this->rc->config->all();
        $this->taskName = $config['task_name'];
        $this->templateName = $config['template_name'];
        $this->sidebarName = $config['sidebar_name'];
        $this->cssName = $config['css_name'];
    }

    function setup_link()
    {
      return html::a(array("class" => "home"));
    }

    /**
     * Charge les modules demandée.
     */
    function load_modules($pageName = 'dashboard')
    {
      // Ajout de l'interface
      include_once 'modules/imodule.php';
      include_once 'modules/module.php';

      // Recuperation de la configuration
      $config = $this->rc->config->get('user_interface_config');
      $size = count($config[$pageName]);
      $existing = array();
      for ($i=0; $i < $size; ++$i) { 
          try {
              include_once 'modules/'.$config[$pageName][$i]."/".$config[$pageName][$i].".php";
              $classname = ucfirst($config[$pageName][$i]);
              $object = new $classname($config[$pageName][$i], $this, $i);
              $object->init();
              $confModule = $this->rc->config->get($config[$pageName][$i]);
              if ($confModule !== null)
                $object->set_config($confModule, $this->rc->config->get($config[$pageName][$i])."_classes");
              if ($existing[$config[$pageName][$i]] == null)
              {
                $object->include_module();
                $existing[$config[$pageName][$i]] = true;
              }
              $this->add_module($config[$pageName][$i], $object->item_html(), $object->row_size());
          } catch (\Throwable $th) {
              $a = 0;
          }
      }
    }

    /**
     * Charge le module du menu de gauche.
     */
    function load_menu($current_page)
    {
        //mel_portal_sectionslist
        $module = $this->rc->config->get('left_menu_module');
        // Ajout de l'interface
        include_once 'modules/imodule.php';
        include_once 'modules/module.php';
        include_once 'modules/'.$module."/".$module.".php";
        $classname = ucfirst($module);
        $object = new $classname($module, $this);
        $object->init();
        $object->include_module();
        $object->set_user_config($this->rc->config->get('user_menu_config'));
        $object->set_current_menu($current_page);
        $this->left_menu = $object->item_html();
        $this->rc->output->add_handlers(array(
            'mel_portal_sectionslist'    => array($this, 'create_left_menu'),
        ));
    }

    /**
     * Charge les actions d'une page.
     * - Les inclusions (css/js/autre)
     * - Les modules
     * - Le html 
     */
    function load_action($current_page)
    {
      if ($current_page === "redirect")
      {
        $this->rc->output->redirect(array("_action" => "index", "_task" => "mel_portal", "data" => "dashboard"));
      }
      else{
        $this->include_css();
        $this->include_js();
        $this->setup_env_js_vars();
        $this->load_modules($current_page);
        $this->load_menu($current_page);
        $this->generate_html();
      }
    }

    /**
     * Charge les actions de chaque modules.
     */
    function load_modules_actions()
    {
      // Ajout de l'interface
      include_once 'modules/imodule.php';
      include_once 'modules/module.php';

      // Recuperation de la configuration
      $config = scandir(getcwd()."/plugins/mel_portal/modules"); 
      $size = count($config);
      for ($i=0; $i < $size; ++$i) { 
        if (strpos($config[$i], '.php') !== false || $config[$i] === "." || $config[$i] == "..")
          continue;
          try {
              include_once 'modules/'.$config[$i]."/".$config[$i].".php";
              $classname = ucfirst($config[$i]);
              $object = new $classname($config[$i], $this, $i);
              $object->load_actions();
              $object->add_to_menu();
          } catch (\Throwable $th) {
              $a = 0;
          }
      }
    }

    /**
     * Action lorsque l'utilisateur appel ce plugin.
     */
    function portal()
    {
      $this->register_action('index', array($this, 'index'));
      //$this->register_action('action', array($this, 'action'));
      //$this->register_action('flux', array($this, 'flux'));
    }

    /**
     * Action index de ce plugin
     */
    function index()
    {
      $acname = rcube_utils::get_input_value('_data', rcube_utils::INPUT_GPC);
      $this->load_action(($acname == null) ? "dashboard" : $acname);
    }

    /**
     * Not used
     */
    function action()
    {
        $acname = rcube_utils::get_input_value('_data', rcube_utils::INPUT_GPC);
        $this->load_action($acname);
    }


    /**
     * Récupère le css utile pour ce plugin.
     */
    function include_css()
    {
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/'.$this->cssName);
        if ($this->rc->config->get('skin') != 'mel_elastic')
          $this->include_stylesheet($this->local_skin_path().'/icofont.min.css');
    }

    /**
     * Récupère le js utile pour ce plugin.
     */
    function include_js()
    {
        $this->include_script('js/main.js');
    }

    /**
     * Récupère les dépendances utile pour ce plugin.
     */
    function include_depedencies()
    {
        $this->include_script('lib/js/moment.js');
        $this->include_script('lib/js/linq.min.js');
    }

    /**
     * Met en place les variables pour le js.
     */
    function setup_env_js_vars()
    {
        // $this->rc->output->set_env('ev_calendar_url', $this->rc->config->get('calendar_url'));
        // $this->rc->output->set_env('ev_remove_calendar_url', $this->rc->config->get('delete_calendar_url'));
    }

    /**
     * Récupère et envoie le html.
     */
    function generate_html()
    {
        $this->rc->output->add_handlers(array(
            'modules'    => array($this, 'creates_modules'),
        ));
        $this->rc->output->send('mel_portal.'.$this->templateName);
    }

    /**
     * Récupère le html d'un module.
     */
    function add_module($name,$html,$size)
    {
        if ($this->modules_html == null)
            $this->modules_html = "";
        $this->modules_html = $this->modules_html.html::div(array("class" => "col-md-".$size),
            html::div(array("class" => $name." module_parent"), $html)
        );
    }

    /**
     * Callback, renvoie le html des différents modules.
     */
    function creates_modules()
    {
        $tmp = $this->modules_html;
        $this->modules_html = null;
        return html::div(array("class" => "row"), $tmp);
    }

    /**
     * Callback, renvoie le html du menu de gauche.
     */
    function create_left_menu()
    {
        return $this->left_menu;
    }

    /**
   * Lecture d'un fichier de flux
   */
  function flux() {
    function endsWith($haystack, $needle) {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }
        return (substr($haystack, -$length) === $needle);
    }
    // Récupération du nom du fichier
    $_file = rcube_utils::get_input_value('_file', rcube_utils::INPUT_GET);

    if (isset($_file)) {
      // Gestion du folder
      $folder = $this->rc->config->get('portail_flux_folder', null);
      if (!isset($folder)) {
        $folder = __DIR__ . '/rss/';
      }
      if ($this->rc->config->get('portail_flux_use_provenance', false)) {
        if (mel::is_internal()) {
          $folder .= 'intranet/';
        }
        else {
          $folder .= 'intranet/';
        }
      }
      // Gestion de l'extension
      if (endsWith($_file, '.xml')) {
        header("Content-Type: application/xml; charset=" . RCUBE_CHARSET);
      }
      else if (endsWith($_file, '.html')) {
        header("Content-Type: text/html; charset=" . RCUBE_CHARSET);
      }
      else if (endsWith($_file, '.json')) {
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
      }
      // Ecriture du fichier
      $content = file_get_contents($folder . $_file);
      if ($content === false) {
        header('HTTP/1.0 404 Not Found');
      }
      else {
        echo $content;
      }
      exit;
    }
  }


}





