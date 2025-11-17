<?php 
if (!defined('EMPTY_STRING')) {
    define('EMPTY_STRING', '');
}

class mel_supervision extends bnum_plugin {
  const REQUIRED_PLUGIN = 'mel_helper';
  const HOOK_IDENTITY_UPDATE = 'identity_update';
  const CALLBACK_IDENTITY_UPDATE = 'hook_identity_update';
  const FOLDER_LOCALIZATION = 'localization';
  const FIELD_TO = 'reply-to';
  const FIELD_BCC = 'bcc';
  const MAIL_SENDER = 'bnum';
  const CONFIG_MAIL_RECEIVER = 'mail_warning_emails';
  const CONFIG_AMEDEE_ADMIN = 'mail_warning_amedee_admin';
  const TEXT_MAIL_SUBJECT = 'mail_warning_subject';
  const TEXT_MAIL_BODY = 'mail_warning_message';

  public $task = 'settings';

  function init() {
    $this->require_plugin(self::REQUIRED_PLUGIN);
    $this->add_hooks(
      [
        self::HOOK_IDENTITY_UPDATE => [$this, self::CALLBACK_IDENTITY_UPDATE]
      ]
    );
  }

  public function hook_identity_update($args) {
    $RECORD = 'record';

    $this->load_config();
    $this->add_texts(self::FOLDER_LOCALIZATION);
    $replyto = $args[$RECORD][self::FIELD_TO] ?? EMPTY_STRING;
    $bcc = $args[$RECORD][self::FIELD_BCC] ?? EMPTY_STRING;

    $replyto = $this->get_user_from_email($replyto);
    $bcc = $this->get_user_from_email($bcc);

    $this->_sendMessageIfExternal(self::FIELD_TO, $replyto)->_sendMessageIfExternal(self::FIELD_BCC, $bcc);

    return $args;
  }

  private function _sendMessageIfExternal(string $key, ?\LibMelanie\Api\Defaut\User $item): self {
    $VAR_EMAIL = 'email';
    $VAR_KEY = 'key';
    $IDENTITY_UPDATE = "identity_update_$key";

    // On vérifie si l'adresse à changer entre temps
    $config = $this->get_config($IDENTITY_UPDATE);

    if ($item !== null && $config !== $item->email && (!$item->exists() || $item->is_external)) {
      // Si c'est le cas, on envoie un mail d'avertissement
      $email = self::MAIL_SENDER;
      $to = $this->get_config(self::CONFIG_MAIL_RECEIVER);
      $cc = [];

      if ($to === null) {
        if (mel_logs::gi()->is(mel_logs::ERROR)) mel_logs::gi()->log(mel_logs::ERROR, 'Aucune adresse de destination configurée pour les alertes de modification d\'identité dans le plugin mel_supervision.');
        return $this;
      }

      $to = explode(',', $to);

      $subject = $this->gettext(['name' => self::TEXT_MAIL_SUBJECT, 'vars' => [$VAR_EMAIL => $this->get_user()->uid]]);
      $message = $this->gettext(['name' => self::TEXT_MAIL_BODY, 'vars' => [$VAR_KEY => $item->email]]);

      if ($this->get_config(self::CONFIG_AMEDEE_ADMIN, false)) {
        $admins = mel_helper::SearchOperatorsMelByDn($this->get_user()->uid);

        if (!empty($admins)) $cc = array_merge($cc, explode(',', $admins));
      }

      \LibMelanie\Mail\Mail::Send($email, $to, $subject, $message, null, $cc);

      if (mel_logs::gi()->is(mel_logs::WARN)) mel_logs::gi()->log(mel_logs::WARN, "Modification de l'adresse $key vers une adresse externe détectée pour l'utilisateur " . $this->rc()->user->get_username());
      
      // On sauvegarde la nouvelle adresse pour eviter de SPAM
      $this->rc()->user->save_prefs([$IDENTITY_UPDATE => $item->email]);
    }
    else if($item !== null) $this->rc()->user->save_prefs([$IDENTITY_UPDATE => EMPTY_STRING]);

    return $this;
  }
}
