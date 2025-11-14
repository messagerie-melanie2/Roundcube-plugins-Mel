<?php 
class mel_supervision extends bnum_plugin {
  public $task = 'settings';

  function init() {
    $this->require_plugin('mel_helper');
    $this->add_hooks(
      [
        'identity_update' => [$this, 'hook_identity_update']
      ]
    );
  }

  public function hook_identity_update($args) {
    $this->load_config();
    $replyto = $args['record']['reply-to'] ?? '';
    $bcc = $args['record']['bcc'] ?? '';

    $replyto = $this->get_user_from_email($replyto);
    $bcc = $this->get_user_from_email($bcc);

    $this->_sendMessageIfExternal('reply-to', $replyto)->_sendMessageIfExternal('bcc', $bcc);

    return $args;
  }

  private function _sendMessageIfExternal(string $key, \LibMelanie\Api\Defaut\User $item): self {
    // On vérifie si l'adresse à changer entre temps
    $config = $this->get_config("identity_update_$key");

    if ($config !== $item->email && (!$item->exists() || $item->is_external)) {
      // Si c'est le cas, on envoie un mail d'avertissement
      $email = 'bnum';
      $to = $this->get_config('mail_main_warning_email');
      $cc = $this->get_config('mail_warning_emails');

      if ($to === null) {
        if (mel_logs::gi()->is(mel_logs::ERROR)) mel_logs::gi()->log(mel_logs::ERROR, 'Aucune adresse de destination configurée pour les alertes de modification d\'identité dans le plugin mel_supervision.');
        return $this;
      }

      $subject = $this->gettext(['name' => 'mail_warning_subject', 'email' => $item->email]);
      $message = $this->gettext(['name' => "mail_warning_message_$key", 'key' => $item->email]);

      if ($this->get_config('mail_warning_amedee_admin', false)) {
        $admins = mel_helper::SearchOperatorsMelByDn($this->get_user()->uid);

        if (!empty($admins)) $cc .= ", $admins";
      }

      //\LibMelanie\Mail\Mail::Send($email, $to, $subject, $message, null, $cc);

      $a = 0;

      if (mel_logs::gi()->is(mel_logs::WARN)) mel_logs::gi()->log(mel_logs::WARN, "Modification de l'adresse $key vers une adresse externe détectée pour l'utilisateur " . $this->rc()->user->get_username());
      
      // On sauvegarde la nouvelle adresse pour eviter de SPAM
      $this->rc()->user->save_prefs(["identity_update_$key" => $item->email]);
    }

    return $this;
  }
}
