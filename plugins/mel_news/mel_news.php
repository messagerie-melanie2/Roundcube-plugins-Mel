<?php
class mel_news extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '?(?!login).*';
  private $rc;

  public const TASK_NAME = "news";

  private $userDatas;

  private static $newsModel = null;

  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->setup_plugin();

    if ($this->rc->task === self::TASK_NAME)
    {
        $this->setup_task();
        // $this->index();
    }
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
    $this->add_button(array(
        'command' => "news",
        'class'	=> 'news icon-mel-newspaper',
        'classsel' => 'news button-selected icon-mel-newspaper',
        'innerclass' => 'button-inner inner',
        'label'	=> 'my_news',
        'title' => 'my_news',
        'type'       => 'link',
        'domain' => "mel_news"
    ), "otherappsbar");
  }

  /**
   * Met en place la tâche lié au plugin.
   *
   * @return void
   */
  function setup_task()
  {
    $this->require_plugin('mel_helper');
    $this->load_config();
    $this->userDatas = self::get_user_dn();
    $this->register_action('index', array($this, 'index'));
    $this->register_action('rss', array($this, 'get_rss_data'));
    //$this->register_action('setFilter', array($this, 'set_filter'));
    $this->include_stylesheet($this->local_skin_path() . '/news.css');
    mel_helper::load_editor_addon($this->rc);
  }

  function index()
  {
    $this->include_script('js/mel_news.js');
    $this->include_script($this->local_skin_path().'/ui.js');
    $this->rc->output->set_env("news_intranet_list", $this->rc->config->get('intranet_list', []));

    $this->rc->html_editor();

    
    $this->rc->output->add_handlers(array(
      'dnnews'    => array($this, 'show_dn_news'),
      'allnews'    => array($this, 'show_all_news')
    ));

    $this->rc->output->set_pagetitle($this->gettext("my_news", "mel_news"));
    $this->rc->output->send('mel_news.news');
  }

  function set_filter()
  {
    $this->rc->user->save_prefs(array('news_filter' => rcube_utils::get_input_value("_filter", rcube_utils::INPUT_GPC)));
    echo 1;
    exit;
  }

  function show_dn_news()
  {
    $news = self::load_last_dn_news(self::get_user_dn());

    $html = "";
    if (count($news) > 0)
    {
      $html .= html::div(["class" => "row"],
        html::div(["class" => "col-md-6"], $news[0]->html($this->load_news_model(), $this)).
        ($news[1] !== null ? html::div(["class" => "col-md-6"], $news[1]->html($this->load_news_model(), $this)) : "")
      );
    }
    else $html = $this->gettext("no_news", "mel_news");

    return $html;
  }

  function show_all_news($args, $nbRows = 2)
  {
    $callbacks = [
      ["callback" => [self, "generate_dn_news"], "args" => [self::get_user_dn()]],
      ["callback" => [$this, "generate_custom_news"], "args" => []]
    ];

    $html = '<div class="row">';

    $col = 0;
    foreach ($callbacks as $call)
    {
      foreach (call_user_func_array($call["callback"], $call["args"]) as $new) {
        $html .= html::div(["class" => "col-md-3", "style" => ($nbRows > 0 && $col >= 12*$nbRows ? "display:none;" : "")], $new->html($this->load_news_model(), $this, "margin-bottom:15px"));
  
        if ($nbRows > 0 && $col < 12*$nbRows) $col += 3;
      }
    }


    return $html;
  }

  function get_rss_data()
  {
    $fileName = rcube_utils::get_input_value("_file", rcube_utils::INPUT_GPC);
    $url = rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);
    $file = $this->get_from_file($fileName);

    if ($file === false)
    {
      $file = $this->get_from_source($url, $fileName);
    }

    if ($file !== null)
    {
      $file = $this->text_to_xml_to_rss($url, $file);
      echo json_encode($file);
    }
    else {
      header('HTTP/1.0 404 Not Found');
    }


    exit;
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
    $fetched = mel_helper::load_helper($this->rc)->fetch("", $config["verify_peer"], $config["verify_host"])->_get_url($url."/spip.php?page=backend-actu");
    $fetched = $fetched["content"];

    $a = $this->write_to_file($fileName, $fetched);

    return $fetched;

  }

  private function get_from_file($fileName)
  {
    $folderPath = $this->rc->config->get('folder_path', 'files');
    $cacheTime = $this->rc->config->get('time_cache', 60) * 60;

    $path = "$folderPath/$fileName";
    $file = file_get_contents($path);

    if ($file !== false)
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

  public static function load_dn_news($user_dn)
  {
    $news = [];

    foreach (self::generate_dn_news($user_dn) as $raw_new) {
      $news[] = anews_datas::isRss($raw_new) ? new rss_datas($raw_new) : new news_datas($raw_new);
    }

    return $news;
  }

  public static function generate_dn_news($user_dn)
  {
    include_once "lib/news_datas.php";
    $raw_news = [
      driver_mel::gi()->getUser()->getUserNews(),
      driver_mel::gi()->getUser()->getUserRss()
    ];

    foreach ($raw_news as $value) {
      foreach ($value as $raw_new) {
        yield anews_datas::isRss($raw_new) ? new rss_datas($raw_new) : new news_datas($raw_new);
      }
    }
  }

  public function load_custom_news()
  {
    return [];
  }

  public function generate_custom_news()
  {
    if (false)
      yield true;
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

}