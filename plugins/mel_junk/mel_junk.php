<?php
/**
 * Plugin Mél Junk
 *
 * Permet de rediriger un pourriel à l'administrateur, 
 * se base sur les plugins bounce et markasjunk
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
class mel_junk extends rcube_plugin
{
    /**
     *
     * @var string
     */
    public $task = 'mail';

    /**
     * Box rendered ?
     * 
     * @var boolean
     */
    private $rendered;

    /**
     * Initialisation du plugin
     * 
     * @see rcube_plugin::init()
     */
    function init() {
        // Plugins require
        $this->require_plugin('markasjunk');

        $rcmail = rcmail::get_instance();

        if ($rcmail->action == '' || $rcmail->action == 'show') {
            $this->rendered = false;
            $this->load_config();
            $this->include_script('mel_junk.js');
            $this->add_texts('localization', true);
            $this->add_hook('render_page', array($this, 'render_box'));
            $rcmail->output->set_env('administrator_email', $rcmail->config->get('mel_junk_administrator_email'));
            $rcmail->output->set_env('junk_folder', $rcmail->config->get('junk_mbox'));
            $rcmail->output->set_env('junk_token', $rcmail->get_request_token());

            // Ajout de l'identité par defaut
            $default_identity = $rcmail->user->get_identity();
            $rcmail->output->set_env('junk_identity', $default_identity['identity_id']);

            // Ajout des boutons
            
            $this->api->add_content(
              html::span('dropbutton', 
                $this->api->output->button(array(
                  'command'    => 'plugin.mel_junk',
                  'type'       => 'link',
                  'class'      => 'button buttonPas junk disabled',
                  'classact'   => 'button junk',
                  'classsel'   => 'button junk pressed',
                  'title'      => 'mel_junk.admin',
                  'innerclass' => 'inner',
                  'label'      => 'junk'
                )) . 
                html::a([
                    'href' => '#junk', 
                    'id' => 'junkmenulink', 
                    'class' => 'dropdown active', 
                    'data-popup' => "junk-menu", 
                    'tabindex' => "0",
                    'aria-haspopup' => "true", 
                    'aria-expanded' => "false", 
                    'aria-owns' => "junk-menu",
                    'data-original-title' => "", 
                    'title' => "",
                  ], 
                  html::span('inner', $this->gettext('arialabeljunkoptions'))
                )
              )
            , 'toolbar');

            // add the buttons to the main toolbar
            $this->add_button(array(
                'command'    => 'plugin.markasjunk.not_junk',
                'type'       => 'link',
                'class'      => 'button buttonPas notjunk disabled',
                'classact'   => 'button notjunk',
                'classsel'   => 'button notjunk pressed',
                'title'      => 'mel_junk.buttonnotjunk',
                'innerclass' => 'inner',
                'label'      => 'markasjunk.notjunk'
            ), 'toolbar');
        }
    }

    /**
     * Junk box
     */
    public function render_box($p) {
        if ($this->rendered) {
          return;
        }
        $this->add_texts('localization');
        $rcmail = rcmail::get_instance();
    
        $attrib = [
            'id'    => 'mel_junk-box',
            'class' => 'popupmenu',
            'data-sticky' => 'true',
            'data-align' => 'bottom',
        ];

        $button = new html_inputfield(array('type' => 'button'));
        $checkbox = new html_checkbox();
    
        $rcmail->output->add_footer(html::div($attrib,
          $rcmail->output->form_tag(array('name' => 'mel_junkform', 'method' => 'post', 'action' => './', 'enctype' => 'multipart/form-data'),
            html::tag('input', array('type' => "hidden", 'name' => '_action', 'value' => 'mel_junk')) .
              html::div('mel_junk-title', rcube_utils::rep_specialchars_output($this->gettext('title'), 'html', 'strict')) .
            html::div('junk-body',
              html::div('checkboxes', 
                html::div('junk_folder', $checkbox->show('junk_folder', ['id' => 'mel_junk_folder', 'class' => 'junk_folder', 'value' => 'junk_folder']) . html::label('mel_junk_folder', $this->gettext('add to junk folder'))) .
                html::div('send_admin', $checkbox->show('send_admin', ['id' => 'mel_junk_send_admin', 'class' => 'send_admin', 'value' => 'send_admin']) . html::label('mel_junk_send_admin', $this->gettext('send message to administrator')))
              ) .
              html::div('buttons',
                $button->show(rcube_utils::rep_specialchars_output($this->gettext('junk'), 'html', 'strict'), array('class' => 'button mainaction',
                      'onclick' => rcmail_output::JS_OBJECT_NAME . ".command('plugin.mel_junk_send', this.mel_junkform)")) . ' ' .
                $button->show($rcmail->gettext('close'), array('class' => 'button', 'onclick' => "$('#mel_junk-box').hide();"))
                  
              )
            )
          )
        ));

        $rcmail->output->add_footer(html::div(['id' => "junk-menu", 'class' => "popupmenu", 'aria-hidden' => "true"],
          html::tag('h3', ['id' => "aria-label-junkmenu", 'class' => "voice"], $this->gettext('arialabeljunkoptions')) .
          html::tag('ul', ['id' => "junkmenu-menu", 'class' => "menu listing", 'role' => "menu", 'aria-labelledby' => "aria-label-junkmenu"],
            $rcmail->output->button(array(
              'command'    => 'plugin.markasjunk.junk',
              'type'       => 'link-menuitem',
              'class'      => 'markasjunk',
              'classact'   => 'markasjunk active',
              'label'      => 'mel_junk.buttontitle',
              'prop'       => 'sub',
            )) . 
            $rcmail->output->button(array(
              'command'    => 'plugin.mel_junk_send',
              'type'       => 'link-menuitem',
              'class'      => 'junkadmin',
              'classact'   => 'junkadmin active',
              'label'      => 'mel_junk.admin',
              'prop'       => 'sub',
            ))
          )
        ));

        $rcmail->output->add_gui_object('mel_junkbox', $attrib['id']);
        $rcmail->output->add_gui_object('mel_junkform', 'mel_junkform');
    
        if ($rcmail->config->get('ismobile', false)) {
          $this->include_stylesheet('skins/mel_larry_mobile/junk.css');
        }
        else {
          $this->include_stylesheet($this->local_skin_path() . '/junk.css');
        }
        $this->rendered = true;
    }
}