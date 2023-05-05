<?php
/**
 * Roundpad pads storage engine
 *
 * @author Thomas Payen <thomas.payen@apitech.fr>
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * This plugin is based on kolab_files plugin
 *
 * Copyright (C) 2016 PNE Annuaire et Messagerie MEDDE/MLETR
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

class roundpad_files_engine
{
    /**
     * @var roundpad
     */
    private $plugin;
    /**
     * @var rcmail
     */
    private $rc;
    private $timeout = 600;
    private $sort_cols = array('name', 'url', 'created', 'type', 'owner');

    /**
     * Driver for files
     * @var roundpad_driver
     */
    protected $driver;

    const API_VERSION = 2;

    /**
     * Class constructor
     */
    public function __construct($plugin)
    {
        $this->plugin  = $plugin;
        $this->rc      = $plugin->rc;
        $this->timeout = $this->rc->config->get('session_lifetime') * 60;
    }

    /**
     * User interface initialization
     */
    public function ui()
    {
        $this->plugin->add_texts('localization/');
        $this->plugin->add_label('etherpad', 'etherpad_public', 'ethercalc', 'other', 'me', 'message_subject', 'message_body', 'help');
        $this->rc->output->set_env('username', $this->rc->get_user_name());
        if (isset($_GET['_doc_url'])) {
          $this->rc->output->set_env('doc_url', rcube_utils::get_input_value('_doc_url', rcube_utils::INPUT_GET));
        }
        if (isset($_GET['_doc_owner'])) {
          $this->rc->output->set_env('doc_owner', rcube_utils::get_input_value('_doc_owner', rcube_utils::INPUT_GET));
        }
        else {
          $this->rc->output->set_env('doc_owner', $this->rc->get_user_name());
        }

        // set templates of Files UI and widgets
        if ($this->rc->task == 'roundpad') {
            $template = 'files';

            // Includes
            include_once 'driver/roundpad_driver.php';
            include_once 'files_roundpad/object_roundpad.php';
            include_once 'files_roundpad/file_roundpad.php';
            include_once 'files_roundpad/folder_roundpad.php';
            include_once 'files_roundpad/ethercalc.php';
            include_once 'files_roundpad/etherpad.php';
            include_once 'files_roundpad/etherpad_public.php';
            include_once 'files_roundpad/other_roundpad.php';

            $this->driver = roundpad_driver::get_driver();
            
            $this->plugin->include_stylesheet($this->plugin->local_skin_path().'/roundpad.css');
        }

        if ($this->rc->config->get('roundpad_intercept_click', false)
            && ($this->rc->task == 'mail' && ($this->rc->action == 'show' || $this->rc->action == 'preview')
                || $this->rc->task == 'calendar')) {
          $this->rc->output->set_env('associative_files_url', $this->rc->config->get('associative_files_url', array()));
          $this->plugin->include_script('roundpad_link.js');
        }

        // add taskbar button
        if (empty($_REQUEST['framed'])) {
            $this->plugin->add_button(array(
                'command'    => 'roundpad',
                'class'      => 'button-pads',
                'classsel'   => 'button-pads button-selected',
                'innerclass' => 'button-inner',
                'type'       => 'link',
                'label'      => 'roundpad.files',
                'title'      => 'roundpad.document_title',
                ), 'taskbar_mel');
        }

        $this->plugin->include_stylesheet($this->plugin->local_skin_path().'/style.css');

        if (!empty($template)) {
            $this->plugin->include_script('file_api.js');
            $this->plugin->include_script('roundpad.js');

            // register template objects for dialogs (and main interface)
            $this->rc->output->add_handlers(array(
                'folder-create-form' => array($this, 'folder_create_form'),
                'folder-edit-form'   => array($this, 'folder_edit_form'),
                'file-create-form'   => array($this, 'file_create_form'),
                'file-edit-form'     => array($this, 'file_edit_form'),
                'file-search-form'   => array($this, 'file_search_form'),
                'filelist'           => array($this, 'file_list'),
            ));
        }
    }

    /**
     * Engine actions handler
     */
    public function actions()
    {
        if ($this->rc->task == 'roundpad' && $this->rc->action == 'file_api') {
          $action = rcube_utils::get_input_value('method', rcube_utils::INPUT_GPC);
        }
        else if ($this->rc->task == 'roundpad' && $this->rc->action) {
            $action = $this->rc->action;
        }
        else if ($this->rc->task != 'roundpad' && $_POST['act']) {
            $action = $_POST['act'];
        }
        else {
            $action = 'index';
        }

        $method = 'action_' . str_replace('-', '_', $action);

        if (method_exists($this, $method)) {
            $this->plugin->add_texts('localization/');
            $this->{$method}();
        }
    }

    /**
     * Template object for folder creation form
     */
    public function folder_create_form($attrib)
    {
        $attrib['name'] = 'folder-create-form';
        if (empty($attrib['id'])) {
            $attrib['id'] = 'folder-create-form';
        }

        $input_name    = new html_inputfield(array('id' => 'folder-name', 'name' => 'name', 'size' => 30));
        $select_parent = new html_select(array('id' => 'folder-parent', 'name' => 'parent'));
        $table         = new html_table(array('cols' => 2, 'class' => 'propform'));

        $table->add('title', html::label('folder-name', rcube::Q($this->plugin->gettext('foldername'))));
        $table->add(null, $input_name->show());
        $table->add('title', html::label('folder-parent', rcube::Q($this->plugin->gettext('folderinside'))));
        $table->add(null, $select_parent->show());

        $out = $table->show();

        // add form tag around text field
        if (empty($attrib['form'])) {
            $out = $this->rc->output->form_tag($attrib, $out);
        }

        $this->plugin->add_label('foldercreating', 'foldercreatenotice', 'create', 'foldercreate', 'cancel');
        $this->rc->output->add_gui_object('folder-create-form', $attrib['id']);

        return $out;
    }

    /**
     * Template object for folder editing form
     */
    public function folder_edit_form($attrib)
    {
        $attrib['name'] = 'folder-edit-form';
        if (empty($attrib['id'])) {
            $attrib['id'] = 'folder-edit-form';
        }

        $input_name    = new html_inputfield(array('id' => 'folder-edit-name', 'name' => 'name', 'size' => 30));
        $select_parent = new html_select(array('id' => 'folder-edit-parent', 'name' => 'parent'));
        $table         = new html_table(array('cols' => 2, 'class' => 'propform'));

        $table->add('title', html::label('folder-name', rcube::Q($this->plugin->gettext('foldername'))));
        $table->add(null, $input_name->show());
        $table->add('title', html::label('folder-parent', rcube::Q($this->plugin->gettext('folderinside'))));
        $table->add(null, $select_parent->show());

        $out = $table->show();

        // add form tag around text field
        if (empty($attrib['form'])) {
            $out = $this->rc->output->form_tag($attrib, $out);
        }

        $this->plugin->add_label('folderupdating', 'folderupdatenotice', 'save', 'folderedit', 'cancel');
        $this->rc->output->set_env('associative_files_url', $this->rc->config->get('associative_files_url', array()));
        $this->rc->output->add_gui_object('folder-edit-form', $attrib['id']);

        return $out;
    }

    /**
     * Template object for file creation form
     */
    public function file_create_form($attrib)
    {
      $attrib['name'] = 'file-create-form';
      if (empty($attrib['id'])) {
        $attrib['id'] = 'file-create-form';
      }

      $input_name    = new html_inputfield(array('id' => 'file-name', 'name' => 'name', 'size' => 30));
      $select_parent = new html_select(array('id' => 'folder-parent', 'name' => 'parent'));
      $select_type   = new html_select(array('id' => 'file-type', 'name' => 'type'));
      $supported_file_types = $this->rc->config->get('supported_file_types', array());
      if (class_exists('mel') && !mel::is_internal()) {
        $supported_file_types = $this->rc->config->get('supported_file_types_internet', array());
      }
      foreach ($supported_file_types as $file_type) {
        $select_type->add($this->plugin->gettext($file_type), $file_type);
      }
      $table         = new html_table(array('cols' => 2, 'class' => 'propform'));

      $table->add('title', html::label('file-name', rcube::Q($this->plugin->gettext('padname'))));
      $table->add(null, $input_name->show());
      $table->add('title', html::label('file-type', rcube::Q($this->plugin->gettext('filetype'))));
      $table->add(null, $select_type->show());
      $table->add('title', html::label('folder-parent', rcube::Q($this->plugin->gettext('folderinside'))));
      $table->add(null, $select_parent->show());

      $out = $table->show();

      $out .= html::div(array('class' => 'legend'), rcube::Q($this->plugin->gettext('getexistingpad')));

      $input_url    = new html_inputfield(array('id' => 'file-url', 'name' => 'url', 'size' => 30));
      $input_owner  = new html_inputfield(array('id' => 'file-owner', 'name' => 'owner', 'size' => 30));
      $table        = new html_table(array('cols' => 2, 'class' => 'propform'));

      $table->add('title', html::label('file-url', rcube::Q($this->plugin->gettext('fileurl'))));
      $table->add(null, $input_url->show());
      $table->add('title', html::label('file-owner', rcube::Q($this->plugin->gettext('fileowner'))));
      $table->add(null, $input_owner->show());

      $out .= $table->show();

      // add form tag around text field
      if (empty($attrib['form'])) {
        $out = $this->rc->output->form_tag($attrib, $out);
      }

      $this->plugin->add_label('filecreating', 'filecreatenotice', 'fileaddnotice', 'create', 'filecreate', 'add', 'fileadd', 'cancel', 'open', 'filenoname', 'filenofolder');
      $this->rc->output->add_gui_object('file-create-form', $attrib['id']);

      return $out;
    }

    /**
     * Template object for file_edit form
     */
    public function file_edit_form($attrib)
    {
        $attrib['name'] = 'file-edit-form';
        if (empty($attrib['id'])) {
            $attrib['id'] = 'file-edit-form';
        }

        $input_name    = new html_inputfield(array('id' => 'file-name', 'name' => 'name', 'size' => 30));
        $select_type   = new html_select(array('id' => 'file-type', 'name' => 'type'));
        $supported_file_types = $this->rc->config->get('supported_file_types', array());
        if (class_exists('mel') && !mel::is_internal()) {
          $supported_file_types = $this->rc->config->get('supported_file_types_internet', array());
        }
        foreach ($supported_file_types as $file_type) {
          $select_type->add($this->plugin->gettext($file_type), $file_type);
        }
        $input_url    = new html_inputfield(array('id' => 'file-url', 'name' => 'url', 'size' => 30));
        $input_owner  = new html_inputfield(array('id' => 'file-owner', 'name' => 'owner', 'size' => 30));

        $table         = new html_table(array('cols' => 2, 'class' => 'propform'));

        $table->add('title', html::label('file-name', rcube::Q($this->plugin->gettext('padname'))));
        $table->add(null, $input_name->show());
        $table->add('title', html::label('file-type', rcube::Q($this->plugin->gettext('filetype'))));
        $table->add(null, $select_type->show());
        $table->add('title', html::label('file-url', rcube::Q($this->plugin->gettext('fileurl'))));
        $table->add(null, $input_url->show());
        $table->add('title', html::label('file-owner', rcube::Q($this->plugin->gettext('fileowner'))));
        $table->add(null, $input_owner->show());

        $out = $table->show();

        // add form tag around text field
        if (empty($attrib['form'])) {
            $out = $this->rc->output->form_tag($attrib, $out);
        }

        $this->plugin->add_label('save', 'cancel', 'fileupdating', 'fileedit');
        $this->rc->output->add_gui_object('file-edit-form', $attrib['id']);

        return $out;
    }

    /**
     * Template object for file search form in "From cloud" dialog
     */
    public function file_search_form($attrib)
    {
        $attrib['name'] = '_q';

        if (empty($attrib['id'])) {
            $attrib['id'] = 'filesearchbox';
        }
        if ($attrib['type'] == 'search' && !$this->rc->output->browser->khtml) {
            unset($attrib['type'], $attrib['results']);
        }

        $input_q = new html_inputfield($attrib);
        $out = $input_q->show();

        // add some labels to client
        $this->rc->output->add_label('searching');
        $this->rc->output->add_gui_object('filesearchbox', $attrib['id']);

        // add form tag around text field
        if (empty($attrib['form'])) {
            $out = $this->rc->output->form_tag(array(
                    'action'   => '?_task=roundpad',
                    'name'     => "filesearchform",
                    'onsubmit' => rcmail_output::JS_OBJECT_NAME . ".command('files-search'); return false",
                ), $out);
        }

        return $out;
    }

    /**
     * Template object for files list
     */
    public function file_list($attrib)
    {
        // define list of cols to be displayed based on parameter or config
        if (empty($attrib['columns'])) {
            $list_cols     = $this->rc->config->get('roundpad_list_cols');
            $dont_override = $this->rc->config->get('dont_override');
            $a_show_cols = is_array($list_cols) ? $list_cols : array('name', 'url', 'created', 'type', 'owner', 'email');
            $this->rc->output->set_env('col_movable', !in_array('roundpad_list_cols', (array)$dont_override));
        }
        else {
            $a_show_cols = preg_split('/[\s,;]+/', strip_quotes($attrib['columns']));
        }

        // make sure 'name' and 'options' column is present
        if (!in_array('name', $a_show_cols)) {
            array_unshift($a_show_cols, 'name');
        }
        if (!in_array('options', $a_show_cols)) {
            array_unshift($a_show_cols, 'options');
        }

        $attrib['columns'] = $a_show_cols;

        // save some variables for use in ajax list
        $_SESSION['roundpad_list_attrib'] = $attrib;

        // For list in dialog(s) remove all option-like columns
        if ($this->rc->task != 'roundpad') {
            $a_show_cols = array_intersect($a_show_cols, $this->sort_cols);
        }

        // set default sort col/order to session
        if (!isset($_SESSION['roundpad_sort_col']))
            $_SESSION['roundpad_sort_col'] = $this->rc->config->get('roundpad_sort_col') ?: 'name';
        if (!isset($_SESSION['roundpad_sort_order']))
            $_SESSION['roundpad_sort_order'] = strtoupper($this->rc->config->get('roundpad_sort_order') ?: 'asc');

        // set client env
        $this->rc->output->add_gui_object('filelist', $attrib['id']);
        $this->rc->output->set_env('sort_col', $_SESSION['roundpad_sort_col']);
        $this->rc->output->set_env('sort_order', $_SESSION['roundpad_sort_order']);
        $this->rc->output->set_env('coltypes', $a_show_cols);
        $this->rc->output->set_env('search_threads', $this->rc->config->get('roundpad_search_threads'));

        $this->rc->output->include_script('list.js');

        // attach css rules for mimetype icons
        $this->plugin->include_stylesheet($this->plugin->local_skin_path() . '/mimetypes/style.css');

        $thead = '';
        foreach ($this->file_list_head($attrib, $a_show_cols) as $cell) {
            $thead .= html::tag('th', array('class' => $cell['className'], 'id' => $cell['id']), $cell['html']);
        }

        return html::tag('table', $attrib,
            html::tag('thead', null, html::tag('tr', null, $thead)) . html::tag('tbody', null, ''),
            array('style', 'class', 'id', 'cellpadding', 'cellspacing', 'border', 'summary'));
    }

    /**
     * Creates <THEAD> for message list table
     */
    protected function file_list_head($attrib, $a_show_cols)
    {
        $skin_path = $_SESSION['skin_path'];
//        $image_tag = html::img(array('src' => "%s%s", 'alt' => "%s"));

        // check to see if we have some settings for sorting
        $sort_col   = $_SESSION['roundpad_sort_col'];
        $sort_order = $_SESSION['roundpad_sort_order'];

        $dont_override  = (array)$this->rc->config->get('dont_override');
        $disabled_sort  = in_array('message_sort_col', $dont_override);
        $disabled_order = in_array('message_sort_order', $dont_override);

        $this->rc->output->set_env('disabled_sort_col', $disabled_sort);
        $this->rc->output->set_env('disabled_sort_order', $disabled_order);

        // define sortable columns
        if ($disabled_sort)
            $a_sort_cols = $sort_col && !$disabled_order ? array($sort_col) : array();
        else
            $a_sort_cols = $this->sort_cols;

        if (!empty($attrib['optionsmenuicon'])) {
            $onclick = 'return ' . rcmail_output::JS_OBJECT_NAME . ".command('menu-open', 'filelistmenu', this, event)";
            $inner   = $this->rc->gettext('listoptions');

            if (is_string($attrib['optionsmenuicon']) && $attrib['optionsmenuicon'] != 'true') {
                $inner = html::img(array('src' => $skin_path . $attrib['optionsmenuicon'], 'alt' => $this->rc->gettext('listoptions')));
            }

            $list_menu = html::a(array(
                'href'     => '#list-options',
                'onclick'  => $onclick,
                'class'    => 'listmenu',
                'id'       => 'listmenulink',
                'title'    => $this->rc->gettext('listoptions'),
                'tabindex' => '0',
            ), $inner);
        }
        else {
            $list_menu = '';
        }

        $cells = array();

        foreach ($a_show_cols as $col) {
            // get column name
            switch ($col) {
/*
            case 'status':
                $col_name = '<span class="' . $col .'">&nbsp;</span>';
                break;
*/
            case 'options':
                $col_name = $list_menu;
                break;
            default:
                $col_name = rcube::Q($this->plugin->gettext($col));
            }

            // make sort links
            if (in_array($col, $a_sort_cols)) {
                $col_name = html::a(array(
                        'href'    => "#sort",
                        'onclick' => 'return ' . rcmail_output::JS_OBJECT_NAME . ".command('files-sort','$col',this)",
                        'title'   => $this->plugin->gettext('sortby')
                    ), $col_name);
            }
            else if ($col_name[0] != '<')
                $col_name = '<span class="' . $col .'">' . $col_name . '</span>';

            $sort_class = $col == $sort_col && !$disabled_order ? " sorted$sort_order" : '';
            $class_name = $col.$sort_class;

            // put it all together
            $cells[] = array('className' => $class_name, 'id' => "rcm$col", 'html' => $col_name);
        }

        return $cells;
    }

    /**
     * Update files list object
     */
    protected function file_list_update($prefs)
    {
        $attrib = $_SESSION['roundpad_list_attrib'];

        if (!empty($prefs['roundpad_list_cols'])) {
            $attrib['columns'] = $prefs['roundpad_list_cols'];
            $_SESSION['roundpad_list_attrib'] = $attrib;
        }

        $a_show_cols = $attrib['columns'];
        $head        = '';

        foreach ($this->file_list_head($attrib, $a_show_cols) as $cell) {
            $head .= html::tag('th', array('class' => $cell['className'], 'id' => $cell['id']), $cell['html']);
        }

        $head = html::tag('tr', null, $head);

        $this->rc->output->set_env('coltypes', $a_show_cols);
        $this->rc->output->command('files_list_update', $head);
    }

    /**
     * Template object for file info box
     */
    public function file_info_box($attrib)
    {
        // print_r($this->file_data, true);
        $table = new html_table(array('cols' => 2, 'class' => $attrib['class']));

        // file name
        $table->add('label', $this->plugin->gettext('name').':');
        $table->add('data filename', $this->file_data['name']);

        // file type
        // @TODO: human-readable type name
        $table->add('label', $this->plugin->gettext('type').':');
        $table->add('data filetype', $this->file_data['type']);

        // file size
        $table->add('label', $this->plugin->gettext('size').':');
        $table->add('data filesize', $this->rc->show_bytes($this->file_data['size']));

        // file modification time
        $table->add('label', $this->plugin->gettext('mtime').':');
        $table->add('data filemtime', $this->file_data['mtime']);

        // @TODO: for images: width, height, color depth, etc.
        // @TODO: for text files: count of characters, lines, words

        return $table->show();
    }

    /**
     * Template object for file preview frame
     */
    public function file_preview_frame($attrib)
    {
        if (empty($attrib['id'])) {
            $attrib['id'] = 'filepreviewframe';
        }

        if ($frame = $this->file_data['viewer']['frame']) {
            return $frame;
        }

        $href = $this->rc->url(array('task' => 'roundpad', 'action' => 'file_api')) . '&method=file_get&file='. urlencode($this->file_data['filename']);

        $this->rc->output->add_gui_object('preview_frame', $attrib['id']);

        $attrib['allowfullscreen'] = true;
        $attrib['src']             = $href;
        $attrib['onload']          = 'roundpad_frame_load(this)';

        return html::iframe($attrib);
    }

    /**
     * Handler for main files interface (Files task)
     */
    protected function action_index()
    {
        $this->plugin->add_label(
            'folderdeleting', 'folderdeleteconfirm', 'folderdeletenotice',
            'filedeleting', 'filedeletenotice', 'filedeleteconfirm',
            'filemoving', 'filemovenotice', 'filemoveconfirm', 'filecopying', 'filecopynotice',
            'collection_etherpad', 'collection_etherpad_public', 'collection_ethercalc',
            'fileskip', 'fileskipall', 'fileoverwrite', 'fileoverwriteall'
        );

        $this->rc->output->set_pagetitle($this->plugin->gettext('files'));
        $this->rc->output->set_env('file_mimetypes', $this->get_mimetypes());
        $this->rc->output->send('roundpad.files');
    }

    /**
     * Handler for preferences save action
     */
    protected function action_prefs()
    {
        $dont_override = (array)$this->rc->config->get('dont_override');
        $prefs = array();
        $opts  = array(
            'roundpad_sort_col' => true,
            'roundpad_sort_order' => true,
            'roundpad_list_cols' => false,
        );

        foreach ($opts as $o => $sess) {
            if (isset($_POST[$o]) && !in_array($o, $dont_override)) {
                $prefs[$o] = rcube_utils::get_input_value($o, rcube_utils::INPUT_POST);
                if ($sess) {
                    $_SESSION[$o] = $prefs[$o];
                }

                if ($o == 'roundpad_list_cols') {
                    $update_list = true;
                }
            }
        }

        // save preference values
        if (!empty($prefs)) {
            $this->rc->user->save_prefs($prefs);
        }

        if (!empty($update_list)) {
            $this->file_list_update($prefs);
        }

        $this->rc->output->send();
    }

    /**
     * Handler for "folders list" function
     */
    protected function action_folder_list() {
      $result = array(
              'status' => 'OK',
              'result' => array(),
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $result['result'] = $this->driver->get_folders(null, true, $this->plugin->gettext('files'));
        sort($result['result']);
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantlistfolders') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "file list" function
     */
    protected function action_file_list() {
      $result = array(
              'status' => 'OK',
              'result' => array(),
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      $search = rcube_utils::get_input_value('search', rcube_utils::INPUT_GET);
      $all_folders = rcube_utils::get_input_value('all_folders', rcube_utils::INPUT_GET);
      $sort = rcube_utils::get_input_value('sort', rcube_utils::INPUT_GET);
      $reverse = rcube_utils::get_input_value('reverse', rcube_utils::INPUT_GET);
      try {
        $folder = str_replace($this->plugin->gettext('files'), '', rcube_utils::get_input_value('folder', rcube_utils::INPUT_GET));
        $result['result'] = $this->driver->get_files($folder, $search, $all_folders);
        if (isset($sort)) {
          usort($result['result'], array($this , "compare_values"));
        }
        foreach ($result['result'] as $i => $r) {
          $result['result'][$i]['created'] = date($this->rc->config->get('date_long', 'd/m/Y H:i'), $r['created']);
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantlistfiles') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Compare for sorted array
     * @param unknown $a
     * @param unknown $b
     * @return number
     */
    protected function compare_values($a, $b) {
      $sort = rcube_utils::get_input_value('sort', rcube_utils::INPUT_GET);
      $reverse = rcube_utils::get_input_value('reverse', rcube_utils::INPUT_GET);
      if ($reverse !== "true") {
        return strnatcmp($a[$sort], $b[$sort]);
      }
      else {
        return strnatcmp($b[$sort], $a[$sort]);
      }
    }

    /**
     * Handler for "file create" function
     */
    protected function action_file_create() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        $name = rcube_utils::get_input_value('name', rcube_utils::INPUT_POST);
        $type = rcube_utils::get_input_value('type', rcube_utils::INPUT_POST);
        $url = rcube_utils::get_input_value('url', rcube_utils::INPUT_POST);
        $owner = rcube_utils::get_input_value('owner', rcube_utils::INPUT_POST);
        if (!$this->driver->createFile($name, $type, $folder, $url, $owner)) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantcreatefile') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "file delete" function
     */
    protected function action_file_delete() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $files = rcube_utils::get_input_value('file', rcube_utils::INPUT_POST);
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        $res = true;
        foreach ($files as $file) {
          $res &= $this->driver->deleteFile($file, $folder);
        }
        if (!$res) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantdeletefiles') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "file move" function
     */
    protected function action_file_move() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $files = rcube_utils::get_input_value('file', rcube_utils::INPUT_POST);
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        $new_folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('new_folder', rcube_utils::INPUT_POST)));
        $res = true;
        foreach ($files as $file) {
          $res &= $this->driver->moveFile($folder, $file, $new_folder);
        }
        if (!$res) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantmovefiles') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "file edit" function
     */
    protected function action_file_edit() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $file = rcube_utils::get_input_value('file', rcube_utils::INPUT_POST);
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        $new_name = rcube_utils::get_input_value('new_name', rcube_utils::INPUT_POST);
        $new_type = rcube_utils::get_input_value('new_type', rcube_utils::INPUT_POST);
        $new_url = rcube_utils::get_input_value('new_url', rcube_utils::INPUT_POST);
        $new_owner = rcube_utils::get_input_value('new_owner', rcube_utils::INPUT_POST);
        if (!$this->driver->editFile($file, $new_name, $new_type, $new_url, $new_owner, $folder)) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('canteditfile') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "folder create" function
     */
    protected function action_folder_create() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        if (!$this->driver->createFolder($folder)) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantcreatefolder') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "folder create" function
     */
    protected function action_folder_delete() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        if (!$this->driver->removeFolder($folder)) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantdeletefolder') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "folder create" function
     */
    protected function action_folder_move() {
      $result = array(
              'status' => 'OK',
              'req_id' => rcube_utils::get_input_value('req_id', rcube_utils::INPUT_GET),
      );
      try {
        $folder = str_replace($this->plugin->gettext('files'), '', urldecode(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST)));
        $new_name = str_replace($this->plugin->gettext('files'), '', rcube_utils::get_input_value('new', rcube_utils::INPUT_POST));
        if (!$this->driver->renameFolder($folder, $new_name)) {
          throw new Exception();
        }
      }
      catch (Exception $e) {
        $message = $e->getMessage();
        $result['status'] = 'NOK';
        $result['reason'] = $this->plugin->gettext('cantmovefolder') . (!empty($message) ? $message : '');
      }
      echo json_encode($result);
      exit;
    }

    /**
     * Handler for "file get" function
     */
    protected function action_file_get() {
      try {
        echo "";
      }
      catch (Exception $e) {
      }
  		exit;
    }

    /**
     * Returns mimetypes supported by File API viewers
     */
    protected function get_mimetypes()
    {
        return array(
                'etherpad',
                'etherpad_public',
                'ethercalc',
                'other',
        );
    }

    /**
     * Converti le chemin en nom de fichier
     * @param string $path
     * @return string
     */
    protected function get_filename_from_path($path) {
      $filename = $path;
      $tmp = explode('/', $path);
      if (is_array($tmp) && count($tmp) > 0) {
        $filename = end($tmp);
      }
      return $filename;
    }

    /**
     * Encode un chemin en raw
     * @param string $path
     * @return string
     */
    protected function encoderawpath($path) {
      $tmp = explode('/', $path);
      $encodedpath = "";
      if (is_array($tmp) && count($tmp) > 0) {
        foreach ($tmp as $t) {
          if (empty($t)) {
            continue;
          }
          $encodedpath .= '/'.rawurlencode($t);
          //$encodedpath .= '/'.urlencode($t);
          //$encodedpath .= '/'.str_replace(' ', '%20', $t);
        }
      }
      return $encodedpath;
    }
}
