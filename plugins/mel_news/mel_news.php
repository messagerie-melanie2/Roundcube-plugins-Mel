<?php
class mel_news extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '?(?!login).*';
  public $rc;

  public const TASK_NAME = "news";

  private $userDatas;

  private static $newsModel = null;
  private static $newsButton = null;

  public const MODE_ALL = "tout";
  public const MODE_VIGNETTE = "un";

  public const SORT_DATE_ASC = "date_asc";
  public const SORT_DATE_DESC = "date_desc";
  public const SORT_SITE = "site";
  public const SORT_SOURCE = "source";

  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->setup_plugin()->setup_task()->setup_settings();
  }

  /**
   * Met en place le plugin.
   *
   * @return void
   */
  function setup_plugin()
  {
    $this->rc = rcmail::get_instance();
    $this->register_task(self::TASK_NAME);
    $this->add_texts('localization/', true);

    $need_button = 'taskbar';
    if (class_exists("mel_metapage")) {
      $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_news') ? $need_button : 'otherappsbar';
    }

    if ($need_button)
    {
      $this->add_button(array(
        'command' => "news",
        'class'	=> 'news icon-mel-newspaper',
        'classsel' => 'news button-selected icon-mel-newspaper',
        'innerclass' => 'button-inner inner',
        'label'	=> 'my_news',
        'title' => 'my_news',
        'type'       => 'link',
        'domain' => "mel_news"
    ), $need_button);
    }

    $this->add_hook('preferences_list', array($this, 'prefs_list'));
    $this->add_hook('preferences_save',     array($this, 'prefs_save'));
    $this->add_hook('preferences_sections_list', array($this, 'prefs_sections_list'));
    return $this;
  }

  /**
   * Met en place la tâche lié au plugin.
   *
   * @return void
   */
  function setup_task()
  {
    if ($this->rc->task === self::TASK_NAME)
    {
      $this->require_plugin('mel_helper');
      $this->load_config();
      $this->userDatas = self::get_user_dn();
      $this->register_action('index', array($this, 'index'));
      $this->register_action('publish', array($this, 'create_or_edit_publish'));
      $this->register_action('publish_rss', array($this, 'create_or_edit_publish_rss'));
      $this->register_action('delete_rss', array($this, 'delete_publish_rss'));
      $this->register_action('delete', [$this, 'delete_publish']);
      $this->register_action('rss', array($this, 'get_rss_data'));
      $this->register_action('add_custom', array($this, 'add_custom_flux'));
      $this->register_action('update_custom', array($this, 'update_custom_flux'));
      $this->register_action('show_all_custom_news', array($this, 'show_all_custom_news'));
      $this->register_action('update_sort', array($this, 'update_sort'));
      $this->register_action('news_edit_prefs', array($this, 'news_edit_prefs'));
      $this->register_action('delete_custom', array($this, 'delete_custom_flux'));
      $this->register_action('update_rights', array($this, 'update_rights'));
      $this->register_action('check_user', array($this, 'check_user'));
      $this->register_action('get_rights', array($this, 'action_get_user_right'));

      //$this->register_action('setFilter', array($this, 'set_filter'));
      $this->include_stylesheet($this->local_skin_path() . '/news.css');
      mel_helper::load_editor_addon($this->rc);
    }
    return $this;
  }

  function setup_settings()
  {
    if ($this->rc->task == 'settings') {

      if ($this->rc->action === 'edit-prefs')
        $this->include_stylesheet($this->local_skin_path() . '/settings.css');

      $this->add_hook('settings_actions', array($this, 'settings_actions'));
      $this->api->register_action('plugin.mel_news',$this->ID, [
        $this,
        'settings'
      ]);
    }
    return $this;
  }

  function index()
  {
    $this->include_script('js/mel_news.js');
    $this->include_script($this->local_skin_path().'/ui.js');
    mel_helper::load_helper($this->rc)->include_js_annuaire_tree();
    $this->rc->output->set_env("news_intranet_list", $this->rc->config->get('intranet_list', []));
    $this->rc->output->set_env("news_skeleton", $this->load_news_model());
    $this->rc->output->set_env("news_sort_mode", $this->get_sort_mode());
    $this->rc->output->set_env("news_mode", $this->get_news_mode());
    $this->rc->output->set_env("news_starting_nb_rows", $this->get_starting_nb_rows());
    $this->rc->output->set_env("news_service_for_publish", self::get_user_service_list(null, $this));

    $this->rc->html_editor();

    
    $this->rc->output->add_handlers(array(
      'dnnews'    => array($this, 'show_dn_news'),
      'allnews'    => array($this, 'show_all_news'),
      'button_sort'    => array($this, 'get_sorting_button')
    ));

    $this->rc->output->set_pagetitle($this->gettext("my_news", "mel_news"));
    $this->rc->output->send('mel_news.news');
  }

  function action_get_user_right()
  {
    echo json_encode(self::get_user_service_list(null, $this));
    exit;
  }

  function check_user()
  {
    $user;
    $val = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_GPC);
    if (strpos($val, "@") !== false) $user = driver_mel::gi()->getUser(null, true, false, null, $val);
    else  $user = driver_mel::gi()->getUser($val);

    echo $user === null ? "false" : json_encode(["uid" => $user->uid, "html" => $user->fullname]);

    exit;
  }

  function update_rights()
  {
    $array = rcube_utils::get_input_value("_array", rcube_utils::INPUT_POST);

    $current_uid = driver_mel::gi()->getUser()->uid;

    foreach ($array as $uid => $services) {

      if ($uid === $current_uid)
        continue;

      $newsShare = driver_mel::gi()->newsshare([driver_mel::gi()->getUser($uid)]);
      foreach ($services as $key => $value) {

        if ($value === "")
          continue;

        $newsShare->service = $key;
        $newsShare->right = $value;
        $newsShare->save();
      }

      $newsShares = driver_mel::gi()->getUser($uid)->getUserNewsShares();

      $enum = mel_helper::Enumerable($array[$uid]);
      foreach ($newsShares as $newsShare) {
        $service = $newsShare->service;
        if ($enum->any(function ($k, $v) use ($service) {return $k === $service && $v === "";}))
        {
          $newsShare->delete();
          $newsShare->save();
        }
      }
    }

    echo "ok";
    exit;
  }

  public function news_edit_prefs_action()
  {
    $html = "";

    $section = rcube_utils::get_input_value("_section", rcube_utils::INPUT_GPC);

    mel_helper::settings(true);

    switch ($section) {
      case 'mel_news_flux':
        include_once "lib/flux_page.php";

        $intra = $this->rc->config->get('intranet_list', []);
        $table = (new html_mel_table(5, ["class" => "table table-striped table-bordered", "hasHeader" => true]))
          ->addRow()->edit(0, 0, "Site/Utilisateur")
          ->edit(0, 1, "Source")
          ->edit(0, 2, "Format")
          ->edit(0, 3, 'Editer')
          ->edit(0, 4, 'Supprimer');

        $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));

        $it = 1;
        foreach ($my_fluxs->generator_flux() as $value) {
          if ($value["url"] === "none")
            continue;

          $table->addRow()->edit($it, 0, ($value["datas"]["source"] === "twitter" ? "@".$value["url"] : ($value["datas"]["source"] === "intranet" ? $intra[$value["url"]]["name"] : $value["url"])))
          ->edit($it, 1, ucfirst($value["datas"]["source"]))
          ->edit($it, 2, $this->gettext($value["datas"]["format"], "mel_news"))
          ->edit($it, 3, '<button style="margin:0" class="mel-button btn btn-secondary" onclick="rcmail.command(\'news.settings.edit\', [\''.$value["url"].'\', \''.$value["datas"]["format"].'\', \''.$value["datas"]["source"].'\'])"><span class="icon-mel-pencil"></span></button>')
          ->edit($it, 4, ($value["datas"]["fromServer"] === true ? "" : '<button style="margin:0" class="mel-button btn danger mel-danger mel-btn-danger btn-danger" onclick="rcmail.command(\'news.settings.delete\', \''.$value["url"].'\')"><span class="icon-mel-trash"></span></button>'))
          ;
          ++$it;
        }

        $html = $table->show();

        break;

      case 'mel_news_rights':

        $newsShares = driver_mel::gi()->getUser()->getUserNewsShares();

        $table = (new html_mel_table(2, ["style" => "margin:0","class" => "table table-striped table-bordered", "hasHeader" => true]))
          ->addRow()->edit(0, 0, "Service")
          ->edit(0, 1, "Droits");

        $it = 1;
        $env_shares_name = [];
        foreach ($newsShares as $newShare) {
          $currentService = mel_helper::get_service_name($newShare->service);//$exploded = explode(",", $newShare->service, 2);
          $currentService = $currentService === "" ? $this->rc->config->get('ldap_organisation_name', explode("=", explode(",", $newShare->service, 2)[0])[1]) : $currentService;
          $table->addRow()->edit($it, 0, $currentService)
          ->edit($it, 1, $this->gettext('right_'.$newShare->right));

          $env_shares_name[$newShare->service] = $currentService;

          ++$it;
        }

        $this->rc->output->set_env("services_names", $env_shares_name);
        
        $html =  "<h3>Vos droits</h3>";

        if ($it === 1)
          $html .= "Vous ne pouvez pas publier d'actualités et vous ne pouvez nommer personne administrateur.";
        else {
          $html .= html::div(["style" => "max-height:301px;overflow:auto;"], $table->show());

          $html .= "<br/><h3>Droits des autres utilisateurs</h3>";

          $table = (new html_mel_table(5, ["class" => "table table-striped table-bordered", "hasHeader" => true]))
          ->addRow()->edit(0, 0, "Utilisateur")
          ->edit(0, 1, "Services")
          ->edit(0, 2, "Administrateur")
          ->edit(0, 3, "Publieur")
          ->edit(0, 4, "Editer")
          ;

          $it = 1;
          $newsRights = driver_mel::gi()->newsshare();
          $currentUser = driver_mel::gi()->getUser()->uid;

          $arrayFoJS = [];

          foreach ($newsShares as $newShare) {

            $currentService = mel_helper::get_service_name($newShare->service);//$exploded = explode(",", $newShare->service, 2);
            $currentService = $currentService === "" ? $this->rc->config->get('ldap_organisation_name', explode("=", explode(",", $newShare->service, 2)[0])[1]) : $currentService;
            $html .= "<br/><h5>Droits de $currentService : </h5>";
            $html .= '<button style="margin:5px" onclick="rcmail.command(\'news.settings.add.rights\', \''.$newShare->service.'\')" class="mel-button btn btn-secondary">Ajouter <span class="plus icon-mel-plus"></span></button>';

            $newsRights->service = '%'.$newShare->service;//'ou=GMCD,ou=DETN,ou=UNI,ou=SNUM,ou=SG,ou=AC,ou=melanie,ou=organisation';
            $operators = [
              'service' => \LibMelanie\Config\MappingMce::like
            ];
            foreach ($newsRights->getList(null, null, $operators) as $right) {

              if ($arrayFoJS[$right->user] === null)
                $arrayFoJS[$right->user] = [];

                $arrayFoJS[$right->user][$right->service] = $right->right;

              if ($right->user === $currentUser)
                continue;

              $isAdmin = $right->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_ADMIN_PUBLISHER || $right->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_ADMIN;
              $isPublish = $right->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_ADMIN_PUBLISHER || $right->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_PUBLISHER;

              $currentService = mel_helper::get_service_name($right->service);//$exploded = explode(",", $newShare->service, 2);
              $currentService = $currentService === "" ? $this->rc->config->get('ldap_organisation_name', explode("=", explode(",", $right->service, 2)[0])[1]) : $currentService;

              $table->addRow()->edit($it, 0, driver_mel::gi()->getUser($right->user)->name)
              ->edit($it, 1, '<span class="news_o">'.$currentService.'</span>')
              ->edit($it, 2, '<span class="'.($isAdmin ? "valid icon-mel-check" : "not-valid icofont-close-line").'"></span>')
              ->edit($it, 3, '<span class="'.($isPublish ? "valid icon-mel-check" : "not-valid icofont-close-line").'"></span>')
              ->edit($it, 4, '<button data-uid="'.$right->user.'" data-service="'.$right->service.'" style="margin:0" onclick="rcmail.command(`news.settings.edit.rights`, {service:`'.$right->service.'`, button:$(this)})" class="mel-button btn btn-secondary"><span class="icon-mel-pencil"></span></button>')
              ;
              
              ++$it;
            }

            $it = 1;
            $html .= $table->show();
          }

          // if ($it === 1)
          //   $table->addRow()->edit($it, 0, "/<!-- ¯_(ツ)_/¯ -->")
          //   ->edit($it, 1, "/")
          //   ->edit($it, 2, "/")
          //   ->edit($it, 3, "/")
          //   ->edit($it, 4, "/")
          //   ;


        }
       // $html .= $table->show();//'<div class="row"><div class="col-12">Vos droits : '.($rights === null ? "Aucun" : $this->gettext($rights)).'</div></div>';
        $this->rc->output->set_env("news_settings_rights", $arrayFoJS);
        break;
      
      default:
        # code...
        break;
    }

    return $html;
  }

  public function news_edit_prefs()
  {
    $this->rc->output->add_handlers(array(
      'news_settings_action'    => array($this, 'news_edit_prefs_action')
    ));
    $this->include_script('js/mel_news.js');
    $this->include_script('js/settings-rights.js');
    $this->rc->output->set_env("news_dont_load", true);
    $this->rc->output->set_env("news_sort_mode", $this->get_sort_mode());
    $this->rc->output->set_env("news_mode", $this->get_news_mode());
    $this->rc->output->set_env("news_starting_nb_rows", $this->get_starting_nb_rows());
    $this->rc->output->set_env("news_intranet_list", $this->rc->config->get('intranet_list', []));
    $this->rc->output->send('mel_news.settings-frame');
  }

  public function settings()
  {
    $this->rc->output->add_handlers(array(
      'sectionslist'    => array($this, 'sectionslist'),
    ));

    $this->include_script('js/settings.js');
    $this->rc->output->set_pagetitle($this->gettext("my_news", "mel_news"));
    $this->rc->output->send('mel_news.settings');
  }

  public function sectionslist($attrib)
  {
    $rcmail = $this->rc;

    // add id to message list table if not specified
    if (empty($attrib['id'])) {
        $attrib['id'] = 'rcmsectionslist';
    }

    //list($list, $cols) = self::user_prefs();
    $cols = ["section"];

    $list = [
      ["id" => "mel_news_interface", "section" => "Interface", "class" => "general onclick f_edit_prefs a_mel_news_interface"],
      ["id" => "mel_news_flux", "section" => "Gestion des flux", "class" => "news onclick f_news_edit_prefs a_mel_news_flux"],
      ["id" => "mel_news_rights", "section" => "Gestion des droits", "class" => "rights onclick f_news_edit_prefs a_mel_news_rights"],
    ];

    if (count(driver_mel::gi()->getUser()->getUserNewsShares()) === 0)
      unset($list[2]);

    // create XHTML table
    $out = rcmail_action::table_output($attrib, $list, $cols, 'id');

    // set client env
    $rcmail->output->add_gui_object('sectionslist', $attrib['id']);
    $rcmail->output->include_script('list.js');

    return $out;
  }

  public function create_or_edit_publish()
  {
    $user = driver_mel::gi()->getUser();
    $service = rcube_utils::get_input_value("_service", rcube_utils::INPUT_POST);
    $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);

    $service = str_replace(',dc=equipement,dc=gouv,dc=fr', '', $service);

    if ($uid === "")
      $uid = null;

    $news = driver_mel::gi()->news([$user]);

    if ($uid === null)
    {

      if (!self::canPublish($service))
      {
        echo "denied";
        exit;
      }

      $news->uid = LibMelanie\Lib\UUID::v4();
      $news->created = date('Y-m-d H:i:s');
      $news->creator = $user->uid;
    }
    else {
      $news->uid = $uid;

      if (!$news->load() || !self::canPublish($service))
      {
        echo "denied";
        exit;
      }

    }

    $news->title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_POST);
    $news->description = rcube_utils::get_input_value("_description", rcube_utils::INPUT_POST, true);
    $news->modified = date('Y-m-d H:i:s');
    $news->service = $service;
    $news->service_name = explode('=', explode(',', $service, 2)[0])[1];

    if ($news->service_name === "organisation") $news->service_name = $this->rc->config->get('ldap_organisation_name', $news->service_name);
    else $news->service_name = mel_helper::get_service_name($service);

    $news->save();

    echo "ok";
    exit;
  }

  public function create_or_edit_publish_rss()
  {
    $user = driver_mel::gi()->getUser();
    $service = rcube_utils::get_input_value("_service", rcube_utils::INPUT_POST);
    $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
    $news = driver_mel::gi()->rss([$user]);

    $service = str_replace(',dc=equipement,dc=gouv,dc=fr', '', $service);

    if ($uid === "")
      $uid = null;

    if ($uid === null)
    {
      if (!self::canPublish($service))
      {
        echo "denied";
        exit;
      }

      $news->uid = LibMelanie\Lib\UUID::v4();
    }
    else {
      $news->uid = $uid;
      if (!$news->load() || !self::canPublish($service))
      {
        echo "denied";
        exit;
      }

    }

    $news->title = "Pas besoin de titre";
    $news->creator = $user->uid;
    $news->url = rcube_utils::get_input_value("_source", rcube_utils::INPUT_POST);
    $news->source = "intranet";
    $news->service = $service;

    $news->save();

    echo "ok";
    exit;
  }

  public function delete_publish()
  {
    $user = driver_mel::gi()->getUser();
    $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
    $news = driver_mel::gi()->news([$user]);

    if ($uid === "")
    $uid = null;

    if ($uid !== null)
    {
      $news->uid = $uid;

      if (!$news->load() || !self::canPublish($news->service))
      {
        echo "denied";
        exit;
      }
      else $news->delete();

    }
    else {
      echo "denied";
      exit;
    }

    echo "ok";
    exit;
  }

  public function delete_publish_rss()
  {
    $user = driver_mel::gi()->getUser();
    $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
    $news = driver_mel::gi()->rss([$user]);

    if ($uid === "")
    $uid = null;

    if ($uid !== null)
    {
      $news->uid = $uid;

      if (!$news->load() || !self::canPublish($news->service))
      {
        echo "denied";
        exit;
      }
      else $news->delete();

    }
    else {
      echo "denied";
      exit;
    }

    echo "ok";
    exit;
  }

  function add_custom_flux()
  {
    include_once "lib/flux_page.php";
    $flux = rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);
    $format = rcube_utils::get_input_value("_format", rcube_utils::INPUT_GPC);
    $source = rcube_utils::get_input_value("_source", rcube_utils::INPUT_GPC);

    $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));

    if ($source === "twitter")
    { 
      if (!mel_helper::load_helper($this->rc)->twitterAccountExists($flux, $this->rc->config->get('twitter_proxy', null)))
      {
        echo "denied";
        exit;
      }
    }

    $my_fluxs->add($flux, $format, $source);
    $this->rc->user->save_prefs(array('custom_flux' => $my_fluxs->getForSave()));
    echo "ok";

    exit;
  }

  function delete_custom_flux()
  {
    include_once "lib/flux_page.php";
    $flux = rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);

    $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));
    $my_fluxs->remove($flux);
    $this->rc->user->save_prefs(array('custom_flux' => $my_fluxs->getForSave()));

    echo "ok";
    exit;
  }

  function update_custom_flux()
  {
    include_once "lib/flux_page.php";
    $last_flux = rcube_utils::get_input_value("_last_url", rcube_utils::INPUT_GPC);
    $flux = rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);
    $format = rcube_utils::get_input_value("_format", rcube_utils::INPUT_GPC);

    $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));

    if ($source === "twitter")
    { 
      if (!mel_helper::load_helper($this->rc)->twitterAccountExists($flux, $this->rc->config->get('twitter_proxy', null)))
      {
        echo "denied";
        exit;
      }
    }

    if ($my_fluxs->edit_flux($last_flux, $flux, $format))
    {
      $this->rc->user->save_prefs(array('custom_flux' => $my_fluxs->getForSave()));
      echo "ok";
    }
    else
      echo "nok";

    exit;
  }

  function set_filter()
  {
    $this->rc->user->save_prefs(array('news_filter' => rcube_utils::get_input_value("_filter", rcube_utils::INPUT_GPC)));
    echo 1;
    exit;
  }

  function show_all_custom_news()
  {
    echo $this->show_all_news(null, 0);
    exit;
  }

  function update_sort()
  {
    $this->rc->user->save_prefs(array('news_sort_mode' => rcube_utils::get_input_value("_mode", rcube_utils::INPUT_GPC)));
    echo "";
    exit;
  }

  function get_sorting_button()
  {
    if ($this->get_news_mode() === self::MODE_ALL)
    {
      if (self::$newsButton === null)
      {
        $html = '<div style="display:inline-block">
          <div class="input-group mel-group">
            <select title="Trier par : " id=news-select-order class="form-control input-mel mel-input" aria-describedby="basic-addon1">
              <options/>
            </select>
          </div>
        </div>';

        $raw_options = [
          self::SORT_DATE_ASC,
          self::SORT_DATE_DESC,
          self::SORT_SITE,
          self::SORT_SOURCE
        ];

        $options = "";//'<option class="hidden inactive disabled" value="none" style="display:none">Trier par : '.$this->gettext($this->get_sort_mode(), "mel_news").'</option>';

        foreach ($raw_options as $value) {
          $options .= '<option value="'.$value.'">'.$this->gettext($value, "mel_news").'</option>';
        }

        $html = str_replace("<options/>", $options, $html);

        self::$newsButton = $html;
        return self::$newsButton;
      }
      else return self::$newsButton;

    }
    else return "";
  }

  /**
   * Récupère les 2 dernières news du service le + proche et le + loin.
   *
   * @return void
   */
  function show_dn_news()
  {
    $classes = [
      'col' => 'col-md-6',
      'row' => 'row'
    ];
    $style = [
      $classes['col'] => 'margin-top:5px;'
    ];
    $news = self::load_last_dn_news(self::get_user_dn());

    $html = "";
    if (isset($news[0]->id))
    {
      $html .= html::div(["class" => $classes['row']],
        html::div(["class" => $classes['col'], "style" => $style[$classes['col']]], $news[0]->html($this->load_news_model(), $this)).
        (isset($news[1]->id) ? html::div(["class" => $classes['col'], "style" => $style[$classes['col']]], $news[1]->html($this->load_news_model(), $this)) : "")
      );
    }
    else $html = $this->gettext("no_news", "mel_news");

    return $html;
  }

  function get_sort_mode()
  {
    return $this->rc->config->get('news_sort_mode', self::SORT_DATE_DESC);
  }

  function get_news_mode()
  {
    return $this->rc->config->get('news_mode', self::MODE_ALL);
  }

  function get_starting_nb_rows()
  {
    return $this->rc->config->get('news_starting_nb_rows', 2);
  }

  // function get_showed_all()
  // {
  //   return $this->rc->config->get('news_showed_all', false);
  // }

  /**
   * Affiche toute les news
   *
   * @param [type] $args
   * @param integer $nbRows
   * @return void
   */
  function show_all_news($args, $nbRows = null)
  {
    $isVignette = $this->get_news_mode() === self::MODE_VIGNETTE;

    if ($nbRows === null)
      $nbRows = $this->get_starting_nb_rows();

    $news = $this->get_all_news($this->get_sort_function(($isVignette ? self::SORT_DATE_DESC : $this->get_sort_mode())));

    $html = '<div class="row">';

    $col = 0;

    if ($isVignette)
      $args = ["datas" => [], "check" => []];

    foreach ($news as $new) {
      if($new->source === 'twitter')
        continue;
      
      if ($nbRows > 0 && $col >= 12*$nbRows) break;

      if ($isVignette)
      {
        $id = $new->is() === news_datas::IS ? $new->getService() : $new->url;
        if (in_array($id, $args["check"]))
        {
          if ($args["datas"][$id] === null)
            $args["datas"][$id] = [];

          $args["datas"][$id][] = html::div(["class" => "col-md-".($new->size !== null && $new->size === "large" ? "6" : "3"), "style" => ($nbRows > 0 && $col >= 12*$nbRows ? "" : "")], $new->html($this->load_news_model(), $this, "margin-bottom:15px"));
          continue;
        }
        else $args["check"][] = $id;
      }
      
      $html .= html::div(["class" => "col-md-".($new->size !== null && $new->size === "large" ? "6" : "3"), "style" => ($nbRows > 0 && $col >= 12*$nbRows ? "display:none;" : "")], $new->html($this->load_news_model(), $this, "margin-bottom:15px"));
      
      if ($nbRows > 0 && $col < 12*$nbRows) $col += ($new->size !== null && $new->size === "large" ? 6 : 3);
    
    }

    $html .= "</div>";

    if ($isVignette)
    {
      $this->rc->output->set_env("news_vignette_all_news_datas", $args["datas"]);
    }

    return $html;
  }

  private function get_sort_function($sortMode)
  {
    $sort = null;

    switch ($sortMode) {
      case self::SORT_DATE_ASC:
        $sort = function($a, $b)
        {
          include_once "lib/news_datas.php";
          $a = $a->date === null ? $a->datas === null ? new news_date(date("Y-m-d H:i:s"), date("Y-m-d H:i:s")) : new news_date($a->datas->date, $a->datas->date) : $a->date;
          $b = $b->date === null ? $b->datas === null ? new news_date(date("Y-m-d H:i:s"), date("Y-m-d H:i:s")) : new news_date($b->datas->date, $b->datas->date) : $b->date;
        
          $a = $a->toTime();
          $b = $b->toTime();
    
          if ($a === $b)
            return 0;
    
            return ($a < $b) ? -1 : 1;
        };
        break;

      case self::SORT_DATE_DESC:
        $sort = function($a, $b)
        {
          include_once "lib/news_datas.php";
          $a = $a->date === null ? $a->datas === null ? new news_date(date("Y-m-d H:i:s"), date("Y-m-d H:i:s")) : new news_date($a->datas->date, $a->datas->date) : $a->date;
          $b = $b->date === null ? $b->datas === null ? new news_date(date("Y-m-d H:i:s"), date("Y-m-d H:i:s")) : new news_date($b->datas->date, $b->datas->date) : $b->date;
        
          $a = $a->toTime();
          $b = $b->toTime();
    
          if ($a === $b)
            return 0;
    
            return ($a < $b) ? 1 : -1;
        };
        break;

        case self::SORT_SITE:
          $sort = function($a, $b)
          {
            $a = $a->datas === null ? $a->url === null ? "" : $a->url : $a->service;
            $b = $b->datas === null ? $b->url === null ? "" : $b->url : $b->service;

            if ($a === $b)
              return 0;
      
              return ($a < $b) ? -1 : 1;
          };
          break;

        case self::SORT_SOURCE:
          $sort = function($a, $b)
          {
            $a = $a->source === null ? "" : $a->source;
            $b = $b->source === null ? "" : $b->source;

            if ($a === $b)
              return 0;
      
              return ($a < $b) ? -1 : 1;
          };
          break;
      
      default:
        # code...
        break;
    }

    return $sort;
  }

  function get_all_news($callback_order = null)
  {
    $array = [];

    foreach ($this->generate_all_news() as $value) {
      /*if ($value->isCustomNews())
      {
        if (!mel_helper::Enumerable($array)->any(function ($v, $k) use ($value) { return $v->isCustomNews() && $v->url === $value->url && $v->datas === $value->datas;}))
          $array[] = $value;
      }
      else */$array[] = $value;
    }

    if ($callback_order !== null)
      usort($array, $callback_order);

    return $array;

  }

  function generate_all_news()
  {
    $callbacks = [
      ["callback" => [$this, "generate_dn_news"], "args" => [self::get_user_dn()]],
      ["callback" => [$this, "generate_custom_news"], "args" => []]
    ];

    foreach ($callbacks as $call)
    {
      foreach (call_user_func_array($call["callback"], $call["args"]) as $new) {
        yield $new;
      }
    }
  }

  public function get_rss_data()
  {
    $fileName = rcube_utils::get_input_value("_file", rcube_utils::INPUT_GPC);
    $url = rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);

    //Si on est en mode "TOUTES LES NEWS"
    if ($this->get_news_mode() === self::MODE_ALL)
    {
      include_once "lib/news_datas.php";
      $intra = $this->rc->config->get('intranet_list', []);
      $file = [];

      foreach ($this->generate_all_from_rss($fileName, $url) as $value) {
        $file[] = (new custom_news_datas($url, "same", $intra[$url]["feedUrl"], "same"))->setDatas($value, $intra[$url]["name"]);
      }
    }
    else {
      $this->get_from_rss($fileName, $url);
      $file = [];
      foreach ($this->generate_all_news() as $new) {
        if ($new->url === $url)
          $file[] = $new->html($this->load_news_model(), $this, "margin-bottom:15px");
      }
      
    }

    if ($file !== false)
    {
      //$file = $this->text_to_xml_to_rss($url, $file);
      echo json_encode($file);
    }
    else {
      header('HTTP/1.0 404 Not Found');
    }


    exit;
  }

  public function get_file_name($feedUrl)
  {
    $splited = explode("&", $feedUrl);

    for ($i=0; $i < count($splited); ++$i) { 
      if (strpos($splited[$i], "_file=") !== false)
      {
        return str_replace("_file=", "", $splited[$i]);
      }
    }

    return false;

  }

  public function get_from_rss($fileName, $url, $get_from_source = true)
  {
    $file = $this->get_from_file($fileName);

    if ($file === false && $get_from_source === true)
    {
      $file = $this->get_from_source($url, $fileName);
    }

    try {
      if ($file !== null)
      {
        $file = $this->text_to_xml_to_rss($url, $file);
        return $file;
      }
      else {
        return false;
      }
    } catch (\Throwable $th) {
      return false;
    }


  }

  public function get_all_from_rss($fileName, $url, $get_from_source = true)
  {
    $array = [];

    foreach ($this->generate_all_from_rss($fileName, $url, $get_from_source) as $value) {
      $array[] = $value;
    }

    return $array;
  }

  public function generate_all_from_rss($fileName, $url, $get_from_source = true)
  {
    $file = $this->get_from_file($fileName, $get_from_source);

    if ($file === false && $get_from_source === true)
    {
      $file = $this->get_from_source($url, $fileName);
    }

    try {
      if ($file !== null)
      {
        include_once "lib/news_datas.php";
        foreach (rss_xml_datas::generateAll($url, new SimpleXMLElement($file)) as $value) {
          yield $value;
        }
      }
      else {
        yield false;
      }
    } catch (\Throwable $th) {
      yield false;
    }


  }


  private function text_to_xml_to_rss($url, $text)
  {
    include_once "lib/news_datas.php";
    return new rss_xml_datas($url, new SimpleXMLElement($text));
  }

  private function write_to_file($fileName, $text)
  {
    $folderPath = $this->rc->config->get('folder_path', 'files');
    $path = "$folderPath/$fileName";

    $myfile = fopen($path, "w") or die("Unable to open file!");
    fwrite($myfile, $text);
    fclose($myfile);
  }

  private function get_from_source($url, $fileName)
  {

    $proxy = $this->rc->config->get('news_proxy', null);

    if ($proxy !== null) $proxy = [CURLOPT_PROXY => $proxy];

    if(substr($url, -1) === "/") $url = substr($url, 0, -1);
    
    $url .= "/spip.php?page=backend-actu";

    $fetched = mel_helper::load_helper($this->rc)->fetch("", $config["verify_peer"], $config["verify_host"])->_get_url($url,
      null,
      null, 
      $proxy
    );
    
    $fetched = $fetched["content"];

    $a = $this->write_to_file($fileName, $fetched);

    return $fetched;

  }

  private function get_from_file($fileName, $check = true)
  {
    $folderPath = $this->rc->config->get('folder_path', 'files');
    $cacheTime = $this->rc->config->get('time_cache', 60) * 60;

    $path = "$folderPath/$fileName";
    $file = file_get_contents($path);

    if ($file !== false && $check === true)
    {
      if (strtotime(date("Y-m-d H:i:s")) - filemtime($path) > $cacheTime)
        $file = false;
    }

    return $file;
  }


  public static function load_last_dn_news($user_dn)
  {
    include_once "lib/news_datas.php";
    //Chargement des news
    $news = $user_dn->user->getUserLastTwoNews();
    //Cast des news 
    return news_datas::fromArray($news);
  }

  public function load_dn_news($user_dn)
  {
    $news = [];

    foreach ($this->generate_dn_news($user_dn) as $raw_new) {
      $news[] = anews_datas::isRss($raw_new) ? new rss_datas($raw_new) : new news_datas($raw_new);
    }

    return $news;
  }

  public function generate_dn_news($user_dn)
  {
    include_once "lib/flux_page.php";
    include_once "lib/news_datas.php";

    driver_mel::gi()->getUser()->cleanNews();

    $raw_news = [
      driver_mel::gi()->getUser()->getUserNews(),
      driver_mel::gi()->getUser()->getUserRss()
    ];

    $intra = $this->rc->config->get('intranet_list', []);
    $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));
    $fluxsEdited = false;

    foreach ($raw_news as $value) {
      foreach ($value as $raw_new) {
        if (anews_datas::isRss($raw_new)) //Si c'est un flux rss
        {
          if (!$my_fluxs->exist($raw_new->url)) //Si le flux n'est pas dans les configs utilisateur
          {
            //on l'ajoute
            $my_fluxs->add($raw_new->url, "small", $raw_new->source);
            $my_fluxs->setFromServer($raw_new->url, $raw_new->uid, $raw_new->service)->setPublisher($raw_new->url, $raw_new->publisher);

            if ($fluxsEdited === false) $fluxsEdited = true;
          }
          else if (!$my_fluxs->isFromServer($raw_new->url)){//Si il existe déjà & que le flag server n'est pas mis
            $my_fluxs->setFromServer($raw_new->url, $raw_new->uid, $raw_new->service)
            ->setPublisher($raw_new->url, $raw_new->publisher);//on l'ajoute

            if ($fluxsEdited === false) $fluxsEdited = true;
          }
          else if ($my_fluxs->exist($raw_new->url) && $my_fluxs->isFromServer($raw_new->url))
          {
              $my_fluxs->setPublisher($raw_new->url, $raw_new->publisher);
              
              if ($fluxsEdited === false) $fluxsEdited = true;
          }

        }
        else yield new news_datas($raw_new);

      }

    }

    $this->rc->user->save_prefs(array('custom_flux' => $my_fluxs->removeFromServerNotFlagged()->getForSave()));

  }

  public function load_custom_news()
  {

    $array = [];

    foreach ($this->generate_custom_news() as $value) {
      $array[] = $value;
    }

    return $array;
  }

  public function generate_custom_news()
  {
    include_once "lib/flux_page.php";
    include_once "lib/news_datas.php";

    $my_fluxs = new flux_page_disposition($this->rc->config->get('custom_flux', []));

    $intra = $this->rc->config->get('intranet_list', []);
    foreach ($my_fluxs->generator_flux() as $value) {

      if (!is_array($value["datas"]))
        continue;

      $it = 0;
      foreach ($this->generate_all_from_rss($this->get_file_name($intra[$value["url"]]["feedUrl"]), $value["url"], false) as $file) {
        if ($value["url"] === "none")
          continue;

        if ($file === false && $value["datas"]["source"] !== "twitter")
        {
          yield new custom_news_datas($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"]);
        }
        else {
          if ($value["datas"]["source"] === "intranet")
          {
            if ($my_fluxs->isPublisher($value["url"]))
              yield (new server_news_data($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"], true, $value["datas"]["serverUid"], $value["datas"]["serverService"]))->setDatas($file, $intra[$value["url"]]["name"])->setId($it++);
            else 
              yield (new custom_news_datas($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"]))->setDatas($file, $intra[$value["url"]]["name"])->setId($it++)->set_from_server($value["datas"]["fromServer"]);
          }
          else if ($value["datas"]["source"] === "twitter")
            yield (new custom_news_datas($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"]))->setDatas(null, $intra[$value["url"]]["name"]);
        }
      }
      // if (true)
      // {

      // }
      // else {

      // }
      // $file = $this->get_from_rss($this->get_file_name($intra[$value["url"]]["feedUrl"]), $value["url"], false);

      // if ($file === null || $file === false)
      //   yield new custom_news_datas($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"]);
      // else
      // {

      // }
        //yield (new custom_news_datas($value["url"], $value["datas"]["format"], $intra[$value["url"]]["feedUrl"], $value["datas"]["source"]))->setDatas($file, $intra[$value["url"]]["name"]);
    }
  }


  public static function get_user_dn($user = null)
  {
      include_once "lib/dn.php";
      return new user_dn($user ?? driver_mel::gi()->getUser());
  }

  public function load_news_model()
  {
    if (self::$newsModel === null)
      self::$newsModel = $this->rc->output->parse("mel_news.model", false, false);

    return self::$newsModel;
  }

  public function prefs_sections_list($args)
  {

    if ($this->rc->action !== "edit-prefs")
      return $args;

    $args["list"] = array_merge($args["list"], [
      "mel_news_interface" => ["id" => "mel_news_interface", "section" => "Interface"],
      "mel_news_flux" => ["id" => "mel_news_flux", "section" => "Gestion des flux"],
      "mel_news_rights" => ["id" => "mel_news_rights", "section" => "Gestion des droits"]
    ]);

    return $args;
  }
  
    /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args) {
    if ($args['section'] == 'mel_news_interface') {

      $this->add_texts('localization/');

      $nb_rows = "mel_news_news_start_nb_rows";
      $mode_news = "mel_news_news_mode";
  
      // Check that configuration is not disabled
      $config_rows = $this->get_starting_nb_rows();
      $config_mode = $this->get_news_mode();

      $args['prefs']["news_starting_nb_rows"] = rcube_utils::get_input_value($nb_rows, rcube_utils::INPUT_POST);
      $args['prefs']["news_mode"] = rcube_utils::get_input_value($mode_news, rcube_utils::INPUT_POST);
    
    }


    return $args;
  }

    /**
   * Handler for user preferences form (preferences_list hook)
   */
  public function prefs_list($args) {

    if ($args['section'] === 'mel_news_interface') {
      // Load localization and configuration
      $this->add_texts('localization/');

      mel_helper::settings(true);

      $nb_rows = "mel_news.news_start_nb_rows";
      $mode_news = "mel_news.news_mode";


      // Check that configuration is not disabled
      $config_rows = $this->get_starting_nb_rows();
      $config_mode = $this->get_news_mode();

      $option_value = [
        $nb_rows => new setting_option_value_input(0, setting_option_value_input::INFINITY)
      ];

      $options_select = [
        $mode_news => [
            "values" => [
                setting_option_select::fabricFromPlugin('mel_news.'.self::MODE_ALL, self::MODE_ALL, $this),
                setting_option_select::fabricFromPlugin('mel_news.'.self::MODE_VIGNETTE, self::MODE_VIGNETTE, $this),
            ],
            "current" => $config_mode
          ]
        ];

        foreach ($options_select as $key => $value) {
            $args['blocks']['main']['options'][$key] = setting_option_select::html($key, $value["current"], $value["values"], null, $this);
        }

        foreach ($option_value as $key => $value) {
          $args['blocks']['main']['options'][$key] = $value->html($key, $config_rows, null, $this);
      }

        //$args['blocks']['main']['options'][$mode_news] = 
      
    }

    return $args;
  }

        /**
     * Adds Signatures section in Settings
     */
    function settings_actions($args)
    {
        $args['actions'][] = array(
            'action' => 'plugin.mel_news',
            'class'  => 'news',
            'label'  => 'news',
            'domain' => 'mel_news',
            //'title'  => 'signaturestitle',
        );
        return $args;
    }

    static function get_user_service_list($user = null, $plugin = null)
    {
      $array = [];
      $allParentRights = driver_mel::gi()->getUser($user)->getUserNewsShares();
      // $newsRights = driver_mel::gi()->newsshare();

      foreach ($allParentRights as $newShare) {
        if ($newShare->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_ADMIN_PUBLISHER || $newShare->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_PUBLISHER)
        {
          //$exploded = explode(",", $newShare->service, 2);
          if (explode('=', explode(",", $newShare->service, 2)[0])[1] === "organisation") $array[$newShare->service] = $plugin === null ? "organisation" : $plugin->rc->config->get("ldap_organisation_name", "organisation");
          else $array[$newShare->service] = mel_helper::get_service_name($newShare->service);//explode('=', $exploded[0])[1];
        }
      }

      return $array;
    }

    static function canPublish($service, $user = null)
    {
      $allParentRights = driver_mel::gi()->getUser($user)->getUserNewsShares();

      return mel_helper::Enumerable($allParentRights)->any(
        function ($k, $v) use ($service) {
          return (($v->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_ADMIN_PUBLISHER 
        || $v->right === LibMelanie\Api\Defaut\News\NewsShare::RIGHT_PUBLISHER)
        && strpos($service, $v->service) !== false);
        }
      );

    }

    // static function notify($service, $title, $text)
    // {

    // }



}