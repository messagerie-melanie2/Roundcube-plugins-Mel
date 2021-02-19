<?php
/**
 * Module flux_rss, gère les différents flux.
 */
class Flux_rss extends Module
{
  /**
   * Nom du dossier qui contient les fichiers xml.
   */
    const FOLDER_NAME = "rss";
    public $links;

    function init()
    {
        $this->load_config();
        $this->links = $this->config;
        //$this->write_files();
        $this->edit_row_size(12);

      //   $config = [];
      //   $config['flux_rss'][0] = new FluxConfig(
      //     array(
      //         new FluxTab("hidden", 
      //             array(
      //                 new FluxItem("intranet-dgitm.xml", new FluxSize(FluxSize::one_by_one)),
      //                 new FluxItem("liberation.xml", new FluxSize(FluxSize::two_by_one)),
      //                 new FluxItem("figaro.xml", new FluxSize(FluxSize::one_by_one), FluxColor::DARK))
      //     ),
      //     ),
      //     "news"
      // );
      // $config['flux_rss'][1] = new FluxConfig(
      //     array(
      //         new FluxTab("headline", 
      //             array(
      //                 new FluxItem("intranet-dgitm.xml", new FluxSize(FluxSize::one_by_one)),
      //                 new FluxItem("liberation.xml", new FluxSize(FluxSize::two_by_one)),
      //                 new FluxItem("figaro.xml", new FluxSize(FluxSize::one_by_one)),
      //                 new FluxItem("intranet-dgitm.xml", new FluxSize(FluxSize::one_by_one)),
      //                 new FluxItem("liberation.xml", new FluxSize(FluxSize::one_by_one)),
      //                 new FluxItem("figaro.xml", new FluxSize(FluxSize::two_by_one), FluxColor::DARK))
      //     ),
      //     new FluxTab("Thématique 1", array(                new FluxItem("intranet-dgitm.xml", new FluxSize(FluxSize::one_by_one)),
      //     new FluxItem("liberation.xml", new FluxSize(FluxSize::two_by_one)),
      //     new FluxItem("figaro.xml", new FluxSize(FluxSize::one_by_one)))),
      //     new FluxTab("Thématique 2", array(                new FluxItem("intranet-dgitm.xml", new FluxSize(FluxSize::one_by_one)),
      //     new FluxItem("liberation.xml", new FluxSize(FluxSize::one_by_one)),
      //     new FluxItem("figaro.xml", new FluxSize(FluxSize::two_by_one), FluxColor::DARK)))
      //     ),
      //     "",true
      // );
      // $this->rc->user->save_prefs(array('flux_rss' => serialize($config['flux_rss'])));

    }

    function write_files(){
        for ($i=0; $i < count($this->config[$this->identifier]->tabs); $i++) { 
            for ($j=0; $j < count($this->config[$this->identifier]->tabs[$i]->items); $j++) { 
                $this->write_from_url($this->config[$this->identifier]->tabs[$i]->items[$j]->url);
            }
        } 
    }

    function write_from_url($urlFeed)
    {
        $path = getcwd()."/plugins/mel_portal/modules/flux_rss/".$this::FOLDER_NAME."/";
        $filename = str_replace("/", ".", str_replace("https://", "", str_replace("http://", "", $urlFeed)));
        $rss = false;//simplexml_load_file($urlFeed);
        if ($rss !== false)
        {
          $file = fopen($path.$filename.".xml", "w");
          fclose($file);
          $rss->asXML($path.$filename.".xml");
        }
    }

    function generate_html()
    {
        return html::div(array("class" => "rss-master", "id" => "rss-master-id-".$this->identifier), 
        html::div(array("class" => "rss-title", "id" => "rss-title-id-".$this->identifier)).
        html::div(array("class" => "rss-header", "id" => "rss-header-id-".$this->identifier)).
        html::div(array("class" => "rss-contents", "id" => "rss-contents-id-".$this->identifier))
        );
    }
    function add_to_menu()
    {
        $this->plugin->add_button(array(
          'command' => $this->plugin->taskName.".index",
          'prop' => '_data=news',
          'class'	=> 'news icofont-newspaper',
          'classsel' => 'news icofont-newspaper selected',
          'innerclass' => 'inner',
          'label'	=> 'mel_portal.news',
          'title' => '',
          'type'       => 'link'
      ), $this->plugin->sidebarName);   
    }

    function include_js()
    {
        $this->plugin->include_script($this->folder().'/flux_rss/js/flux_rss.js');
        $this->plugin->include_script($this->folder().'/flux_rss/js/main.js');
    }

    function include_css(){
        $this->plugin->include_stylesheet('modules/headlines/css/headlines.css');
        $this->plugin->include_stylesheet('modules/flux_rss/css/flux_rss.css');
    }

    function set_js_vars(){
      $this->rc->output->set_env('flux_rss_config', $this->config);
      $this->rc->output->set_env('flux_rss_html_block', $this->html_square_hbf("rss_title", "rss_header ", "rss_body", "rss_footer", "rss_id_square", "rss_id_content"));
      $this->rc->output->set_env('flux_rss_links', $this->links);
      $this->rc->output->set_env('flux_rss_form', $this->get_html_form());
    } 

    function get_html_form()
    {
      $this->rc->output->add_handlers(array(
        'selectintra'    => array($this, 'get_select_list'),
      ));
      $this->rc->output->add_handlers(array(
        'light'    => array($this, 'get_light'),
      ));
      $this->rc->output->add_handlers(array(
        'dark'    => array($this, 'get_dark'),
      ));
      return $this->rc->output->parse("mel_portal.form_add_flux", false, false);
    }

    function get_select_list()
    {
      $html = '<select id="rss-select" name="intralist" class="mel-select form-control" required><option value="" style="display:none">'.$this->text('choose_web_site').'</option>';
      $size = count($this->links['links']);
      for ($i=0; $i < $size; ++$i) { 
        $element = $this->links['links'][$i];
        $html.= '<option value="'.$element->link.'">'.$element->title.'</option>';
      }
      unset($element);
      $html.="</select>";
      return $html;
    }

    function get_contents()
    {
      $config = [];
      $config["header"] = $this->text('rss_sample_header');
      $config["body"] = "<h3>".$this->text('rss_sample_body')."</h3>";
      $config["footer"] = "#".$this->text('rss_sample_footer');
      return $config;
    }

    function get_light(){
      return $this->html_square_hbf("", "square-header", "square-body", "square-footer", "", "", $this->get_contents());
    }
    function get_dark(){
      return $this->html_square_hbf("", "square-header", "square-body", "square-footer", "", "", $this->get_contents(), "DARK");
    }

    function register_actions()
    {
        include_once $this->module_action_path();
        return array(
            new Module_Action('fluxrss', $this, 'action_flux_rss'),
            new Module_Action('addflux', $this, 'add_flux')
        );
    }

    public function add_flux()
    {
      include_once 'program/config_parser.php';
      include_once 'flux_config.php';
      $id = rcube_utils::get_input_value('id', rcube_utils::INPUT_POST);
      $tabName = rcube_utils::get_input_value('tab', rcube_utils::INPUT_POST);
      $link = rcube_utils::get_input_value('intralist', rcube_utils::INPUT_POST);
      $background = rcube_utils::get_input_value('background', rcube_utils::INPUT_POST);
      if ($background == "light")
        $background = FluxColor::LIGHT;
      else
        $background = FluxColor::DARK;
      $format = rcube_utils::get_input_value('format', rcube_utils::INPUT_POST);
      if ($format == "1x1")
        $format = new FluxSize(FluxSize::one_by_one);
      else
        $format = new FluxSize(FluxSize::two_by_one);
      $this->plugin->load_config();
      $config =  (new FCParser(unserialize($this->rc->config->get('flux_rss'))))->get();
      // $config = [];
      // foreach ($configTmp as $key => $value) {
      //   $config[$key] = clone $value;
      // }  
      $index = -1;
      if ($tabName === "")
        $index = 0;
      else{
        $tmp = $config[$id]->tabs;
        $size = count($tmp);
        for ($i=0; $i < $size; ++$i) { 
          if ($this->text($tmp[$i]->name) == $tabName)
          {
            $index = $i;
            break;
          }
        }
    }
      if ($index >= 0)
      {
        $config[$id]->tabs[$index]->add(new FluxItem($link, $format, $background));
        $this->rc->user->save_prefs(array('flux_rss' => serialize( (new FCParser($config, true))->toArray() )));
        unset($tmp);
        unset($config);
      }
      $this->rc->output->redirect(array("_action" => "index", "_task" => "mel_portal", "data" => "news"));
    }

    function after_set_config()
    {
      include_once 'program/config_parser.php';
      include_once "flux_config.php";
      $this->config = (new FCParser($this->config))->get();
    }

    /**
     * Récupère les fichiers xml et les renvoies.
     */
    public function action_flux_rss()
    {
        //$a = rcube_utils::get_input_value('_file', rcube_utils::INPUT_GET);
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
