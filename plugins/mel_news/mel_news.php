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
    $this->load_config();
    $this->userDatas = self::get_user_dn();
    $this->register_action('index', array($this, 'index'));
    $this->register_action('update', array($this, 'update'));
    //$this->register_action('setFilter', array($this, 'set_filter'));
    $this->include_stylesheet($this->local_skin_path() . '/news.css');
  }

  function index()
  {
    $this->include_script('js/mel_news.js');
    $this->include_script($this->local_skin_path().'/ui.js');

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
    return "";
  }

  function show_all_news()
  {
    $news = [
      self::load_dn_news(self::get_user_dn()),
      $this->load_custom_news(),
      $this->load_default_news()
    ];

    return "";
  }

  function update()
  {
    echo json_encode(["dn" => $this->show_dn_news(), "all" => $this->show_all_news()]);
    exit;
  }


  public static function load_last_dn_news($user_dn)
  {
      $news = [
          "service" => "",
          "state" => ""
      ];

      //Chargement des news
      //Cast des news 

      return $news;
  }

  public static function load_dn_news($user_dn)
  {
    $news = [];

    return $news;
  }

  public function load_custom_news()
  {}

  public function load_default_news()
  {}


  public static function get_user_dn($user = null)
  {
      include_once "lib/dn.php";
      return new user_dn($user ?? driver_mel::gi()->getUser());
  }

}