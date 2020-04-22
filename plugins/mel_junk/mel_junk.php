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
     * Initialisation du plugin
     * 
     * @see rcube_plugin::init()
     */
    function init() {
        // Plugins require
        $this->require_plugin('bounce');
        $this->require_plugin('markasjunk');

        $rcmail = rcmail::get_instance();

        if ($rcmail->task == 'mail' && ($rcmail->action == '' || $rcmail->action == 'show')) {
            $this->load_config();
            $this->include_script('mel_junk.js');
            $this->add_texts('localization', true);
            $this->add_hook('render_page', array($this, 'render_box'));
            $rcmail->output->set_env('administrator_email', $rcmail->config->get('mel_junk_administrator_email'));
            $rcmail->output->set_env('junk_folder', $rcmail->config->get('junk_mbox'));
        }
    }

    /**
     * Junk box
     */
    public function render_box($p) {
        $this->add_texts('localization');
        $rcmail = rcmail::get_instance();
    
        $attrib = [
            'id'    => 'mel_junk-box',
            'class' => 'mel_junk-box popupmenu',
            'data-sticky' => 'true',
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
                $button->show($rcmail->gettext('close'), array('class' => 'button', 'onclick' => "$('.mel_junk-box').hide();"))
                  
              )
            )
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
    }
}