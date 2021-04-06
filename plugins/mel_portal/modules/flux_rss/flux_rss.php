<?php
/**
 * Module "Flux Rss" pour le portail Mél
 *
 * Portail web
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
/**
 * Module flux_rss, gère les différents flux.
 */
class Flux_rss extends Module
{
  /**
   * Nom du dossier qui contient les fichiers xml.
   */
    const FOLDER_NAME = "rss";
    /**
     * Lien des différents flux.
     */
    public $links;

    function init()
    {
        $this->load_config();
        $this->links = $this->config;
        $this->edit_row_size(12);
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

    /**
     * Génère le html du module.
     */
    function generate_html()
    {
        return html::div(array("class" => "rss-master", "id" => "rss-master-id-".$this->identifier), 
        html::div(array("class" => "rss-title", "id" => "rss-title-id-".$this->identifier)).
        html::div(array("class" => "rss-header", "id" => "rss-header-id-".$this->identifier)).
        html::div(array("class" => "rss-contents", "id" => "rss-contents-id-".$this->identifier))
        );
    }

    /**
     * Ajoute le module au menu.
     */
    function add_to_menu()
    {
      return;
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

    /**
     * Récupère le formulaire d'ajout d'un flux en html.
     */
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

    /**
     * Récupère la liste des flux pour la mettre sous forme de select.
     */
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

    /**
     * Données "vide" d'un block de flux.
     */
    function get_contents()
    {
      $config = [];
      $config["header"] = $this->text('rss_sample_header');
      $config["body"] = "<h3>".$this->text('rss_sample_body')."</h3>";
      $config["footer"] = "#".$this->text('rss_sample_footer');
      return $config;
    }

    /**
     * Block flux clair
     */
    function get_light(){
      return $this->html_square_hbf("", "square-header", "square-body", "square-footer", "", "", $this->get_contents());
    }
    /**
     * Block flux sombre.
     */
    function get_dark(){
      return $this->html_square_hbf("", "square-header", "square-body", "square-footer", "", "", $this->get_contents(), "DARK");
    }

    /**
     * Actions du module.
     */
    function register_actions()
    {
        include_once $this->module_action_path();
        return array(
            new Module_Action('fluxrss', $this, 'action_flux_rss'),
            new Module_Action('addflux', $this, 'add_flux')
        );
    }

    /**
     * Ajoute un flux.
     */
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

    /**
     * Met en forme la config après l'avoir récupérée.
     */
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
