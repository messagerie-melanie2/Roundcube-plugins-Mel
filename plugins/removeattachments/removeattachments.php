<?php

/**
 * RemoveAttachments
 *
 * Roundcube plugin to allow the removal of attachments from a message
 * Original code from Philip Weir.
 *
 * @version 0.2
 * @author Diana Soares
 */
class removeattachments extends rcube_plugin {
  public $task = 'mail';

  /**
   * Plugin initialization
   */
  function init() {
    // PAMELA - MANTIS 0004548: Ne pas mettre le lien supprimer les pièces jointes en mobile
    if (rcmail::get_instance()->config->get('ismobile', false)) {
        return;      
    }
    $this->add_texts('localization', array(
            'removeoneconfirm',
            'removeallconfirm',
            'removing'
    ));
    $this->include_script('removeattachments.js');

    $this->add_hook('template_object_messageattachments', array(
            $this,
            'attachment_removelink'
    ));
    $this->add_hook('template_container', array(
            $this,
            'attachmentmenu_removelink'
    ));
    $this->register_action('plugin.removeattachments.remove_attachments', array(
            $this,
            'remove_attachments'
    ));
  }

  /**
   * Place a link in the attachmentmenu (template container) for each attachment
   * to trigger the removal of the selected attachment
   */
  function attachmentmenu_removelink($p) {
    if ($p['name'] == 'attachmentmenu') {
      $link = $this->api->output->button(array(
              'command' => 'plugin.removeattachments.removeone',
              'classact' => 'removelink icon active delete',
              'type' => 'link',
              'content' => html::tag('span', array(
                      'class' => 'icon cross'
              ), rcube::Q($this->gettext('removeattachments.removeattachment')))
      ));

      $p['content'] .= html::tag('li', array(
              'role' => 'menuitem'
      ), $link);
    }

    return $p;
  }

  /**
   * Place a link in the messageAttachments (template object)
   * to trigger the removal of all attachments
   */
  function attachment_removelink($p) {
    /*
     * // place links to remove attachment for each attachment
     * $links = preg_split('/(<li[^>]*>)/', $p['content'], null, PREG_SPLIT_DELIM_CAPTURE);
     *
     * for ($i = 1; $i < count($links); $i+=2) {
     * if (preg_match('/ id="attach([0-9]+)"/', $links[$i], $matches)) {
     * $remove = $this->api->output->button(array('command' => 'plugin.removeattachments.removeone',
     * 'prop' => $matches[1],
     * 'image' => $this->url(null) . $this->local_skin_path() . '/del.png',
     * 'title' => 'removeattachments.removeattachment',
     * 'style' => 'vertical-align:middle'));
     * $links[$i+1] = str_replace('</li>', '&nbsp;' . $remove . '</li>', $links[$i+1]);
     * }
     * }
     *
     * $p['content'] = join('', $links);
     */

    // when there are multiple attachments allow delete all
    if (substr_count($p['content'], ' id="attach') > 1) {
      $link = $this->api->output->button(array(
              'type' => 'link',
              'command' => 'plugin.removeattachments.removeall',
              'content' => rcube::Q($this->gettext('removeattachments.removeall')),
              'title' => 'removeattachments.removeall',
              'class' => 'button removeattachments'
      ));

      switch (rcmail::get_instance()->config->get('skin')) {
        case 'classic' :
          // $p['content'] = preg_replace('/(<ul[^>]*>)/', '$1' . $link, $p['content']);
          $p['content'] = str_replace('</ul>', html::tag('li', null, $link) . '</ul>', $p['content']);
          break;

        default :
          $p['content'] .= $link;
          break;
      }

      $this->include_stylesheet($this->local_skin_path() . '/removeattachments.css');
    }

    return $p;
  }

  /**
   * Remove attachments from a message
   */
  function remove_attachments() {
    $rcmail = rcmail::get_instance();
    $imap = $rcmail->storage;
    $MESSAGE = new rcube_message(rcube_utils::get_input_value('_uid', rcube_utils::INPUT_GET));
    $headers = $this->_parse_headers($imap->get_raw_headers($MESSAGE->uid));

    // set message charset as default
    if (! empty($MESSAGE->headers->charset)) {
      $imap->set_charset($MESSAGE->headers->charset);
    }

    // Remove old MIME headers
    unset($headers['MIME-Version']);
    unset($headers['Content-Type']);

    $MAIL_MIME = new Mail_mime($rcmail->config->header_delimiter());
    $MAIL_MIME->headers($headers);

    if ($MESSAGE->has_html_part()) {
      $body = $MESSAGE->first_html_part();
      $MAIL_MIME->setHTMLBody($body);
    }

    $body = $MESSAGE->first_text_part();
    $MAIL_MIME->setTXTBody($body, false, true);

    foreach ($MESSAGE->attachments as $attachment) {
      if ($attachment->mime_id != rcube_utils::get_input_value('_part', rcube_utils::INPUT_GET) && rcube_utils::get_input_value('_part', rcube_utils::INPUT_GET) != '-1') {
        $MAIL_MIME->addAttachment($MESSAGE->get_part_content($attachment->mime_id), $attachment->mimetype, $attachment->filename, false, $attachment->encoding, $attachment->disposition, '', $attachment->charset);
      }
    }

    foreach ($MESSAGE->mime_parts as $attachment) {
      if (! empty($attachment->content_id)) {
        // covert CID to Mail_MIME format
        $attachment->content_id = str_replace('<', '', $attachment->content_id);
        $attachment->content_id = str_replace('>', '', $attachment->content_id);

        if (empty($attachment->filename)) {
          $attachment->filename = $attachment->content_id;
        }

        $MESSAGE_body = $MAIL_MIME->getHTMLBody();
        $dispurl = 'cid:' . $attachment->content_id;
        $MESSAGE_body = str_replace($dispurl, $attachment->filename, $MESSAGE_body);
        $MAIL_MIME->setHTMLBody($MESSAGE_body);

        $MAIL_MIME->addHTMLImage($MESSAGE->get_part_content($attachment->mime_id), $attachment->mimetype, $attachment->filename, false);
      }
    }

    // encoding settings for mail composing
    $MAIL_MIME->setParam('head_encoding', $MESSAGE->headers->encoding);
    $MAIL_MIME->setParam('head_charset', $MESSAGE->headers->charset);

    foreach ($MESSAGE->mime_parts as $mime_id => $part) {
      $mimetype = strtolower($part->ctype_primary . '/' . $part->ctype_secondary);

      if ($mimetype == 'text/html') {
        $MAIL_MIME->setParam('text_encoding', $part->encoding);
        $MAIL_MIME->setParam('html_charset', $part->charset);
      }
      else if ($mimetype == 'text/plain') {
        $MAIL_MIME->setParam('html_encoding', $part->encoding);
        $MAIL_MIME->setParam('text_charset', $part->charset);
      }
    }

    $saved = $imap->save_message($_SESSION['mbox'], $MAIL_MIME->getMessage(), '', false, [], $MAIL_MIME->headers()['Date']);
    // write_log("debug","saved=".$saved);

    if ($saved) {
      $imap->delete_message($MESSAGE->uid);

      // Assume the one we just added has the highest UID
      // dsoares $uids = $imap->conn->fetchUIDs($imap->mod_mailbox($_SESSION['mbox']));
      // dsoares $uid = end($uids);
      $uid = $saved; // dsoares

      // set flags
      foreach ($MESSAGE->headers->flags as $flag => $value) {
        $imap->set_flag($uid, strtoupper($flag), $_SESSION['mbox']);
      }

      $this->api->output->command('display_message', $this->gettext('attachmentremoved'), 'confirmation');
      $this->api->output->command('removeattachments_reload', $uid);
    }
    else {
      $this->api->output->command('display_message', $this->gettext('removefailed'), 'error');
    }

    $this->api->output->send();
  }

  /**
   * Parse message headers
   */
  private function _parse_headers($headers) {
    $a_headers = array();
    $headers = preg_replace('/\r?\n(\t| )+/', ' ', $headers);
    $lines = explode("\n", $headers);
    $c = count($lines);

    for ($i = 0; $i < $c; $i ++) {
      if ($p = strpos($lines[$i], ': ')) {
        $field = substr($lines[$i], 0, $p);
        $value = trim(substr($lines[$i], $p + 1));
        $a_headers[$field] = $value;
      }
    }

    return $a_headers;
  }

/**
 * $href = $rcmail->url(array(
 * '_action' => 'plugin.removeattachments.removeone',
 * '_mbox' => $rcmail->output->env['mailbox'],
 * '_uid' => $rcmail->output->env['uid'],
 * '_part' => '????????',
 * ));
 * $link = html::a(array(
 * 'id' => 'attachmenuremove', 'class' => 'icon active','role' => 'button',
 * 'command' => 'plugin.removeattachments.removeone', 'href' => '#', //$href,
 * 'title' => rcube::Q($this->gettext('removeattachments.removeattachment')),
 * ),
 * '<span class="icon cross">' . rcube::Q($this->gettext('removeattachments.removeattachment')) . '</span>'
 * );
 * // ----------
 * $href = $rcmail->url(array(
 * '_action' => 'plugin.removeattachments.remove_attachments',
 * '_mbox' => $rcmail->output->env['mailbox'],
 * '_uid' => $rcmail->output->env['uid'],
 * '_part' => '-1',
 * ));
 * $link = html::a(array('href' => $href, 'command' => 'plugin.removeattachments.remove_all', 'class' => 'button removeattachments'),
 * rcube::Q($this->gettext('removeattachments.removeall'))
 * );
 */

}

