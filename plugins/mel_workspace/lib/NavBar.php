<?php 
class NavBar {
  private $modules;
  private $scripts;
  private $css;
  // private $assets_path;
  private $devel_mode;
  private $uid;
  protected $assets_dir   = RCUBE_INSTALL_PATH;

  public function __construct($uid) {
    $this->uid = $uid;
    $this->devel_mode = rcmail::get_instance()->config->get('devel_mode');
    // $this->assets_path = $this->set_assets_path($this->rc()->config->get('assets_path'), $this->rc()->config->get('assets_dir'));

    $this->scripts = null;
    $this->modules = null;
    $this->css = null;
  }

  public function rc() {
    return rcmail::get_instance();
  }

    /**
     * Parse and set assets path
     *
     * @param string $path   Assets path URL (relative or absolute)
     * @param string $fs_dif Assets path in filesystem
     */
    public function set_assets_path($path, $fs_dir = null)
    {
        // set absolute path for assets if /index.php/foo/bar url is used
        if (empty($path) && !empty($_SERVER['PATH_INFO'])) {
            $path = preg_replace('/\?_task=[a-z]+/', '', $this->app->url([], true));
        }

        if (empty($path)) {
            return;
        }

        $path = rtrim($path, '/') . '/';

        // handle relative assets path
        if (!preg_match('|^https?://|', $path) && $path[0] != '/') {
            // save the path to search for asset files later
            $this->assets_dir = $path;

            $base = preg_replace('/[?#&].*$/', '', $_SERVER['REQUEST_URI']);
            $base = rtrim($base, '/');

            // remove url token if exists
            if ($len = intval($this->rc()->config->get('use_secure_urls'))) {
                $_base  = explode('/', $base);
                $last   = count($_base) - 1;
                $length = $len > 1 ? $len : 16; // as in rcube::get_secure_url_token()

                // we can't use real token here because it
                // does not exists in unauthenticated state,
                // hope this will not produce false-positive matches
                if ($last > -1 && preg_match('/^[a-f0-9]{' . $length . '}$/', $_base[$last])) {
                    $path = '../' . $path;
                }
            }
        }

        // set filesystem path for assets
        if ($fs_dir) {
            if ($fs_dir[0] != '/') {
                $fs_dir = realpath(RCUBE_INSTALL_PATH . $fs_dir);
            }
            // ensure the path ends with a slash
            $this->assets_dir = rtrim($fs_dir, '/') . '/';
        }

        $this->assets_path = $path;
    }

  /**
   * Modify file by adding mtime indicator
   */
  protected function file_mod($file)
  {
      $fs  = false;
      $ext = substr($file, strrpos($file, '.') + 1);

      $file =  $this->asset_path($file);

      // use minified file if exists (not in development mode)
      if (!$this->devel_mode && !preg_match('/\.min\.' . $ext . '$/', $file)) {
          $minified_file = substr($file, 0, strlen($ext) * -1) . 'min.' . $ext;
          if ($fs = @filemtime($this->assets_dir . $minified_file)) {
              return $minified_file . '?s=' . $fs;
          }
      }

      if ($fs = @filemtime($this->assets_dir . $file)) {
          $file .= '?s=' . $fs;
      }

      return $file;
  }

  protected function asset_path($path) {
    $wsp = 'plugins/mel_workspace';
    if (!in_array($path[0], ['?', '/', '.'])) {
      return "$wsp/$path";
    }

    return $path;
  }

  public function add_module($module) {
    $module = $this->asset_path($module);

    if (!isset($this->scripts)) {
      $this->modules = rtrim($module);
    }
    else {
      $this->modules .= "," . rtrim($module);
    }
  }

  public function add_script($script) {
    $script = $this->file_mod($script);

    if (!isset($this->scripts)) {
      $this->scripts = rtrim($script);
    }
    else {
      $this->scripts .= "," . rtrim($script);
    }

    return $this;
  }

  public function add_css($file)
  {
    $file = $this->file_mod($file);

    if (!isset($this->css)) {
      $this->css = rtrim($file);
    }
    else {
        $this->css .= "," . rtrim($file);
    }
  }

  public function get() {
    include_once __DIR__.'/Workspace.php';
    $workspace = new Workspace($this->uid, true);
    $picture = mel_workspace::GetWorkspaceLogo($workspace->get());
    $description = str_replace('"', "''", $workspace->description());
    $title = $workspace->title();
    return "<bnum-wsp-nav data-uid=\"$this->uid\" data-title=\"$title\" data-picture=\"$picture\" data-description=\"$description\" data-modules=\"$this->modules\" data-scripts=\"$this->scripts\" data-css=\"$this->css\"></bnum-wsp-nav>";
  }

}