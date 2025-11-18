<?php 
if (!defined('EMPTY_STRING')) {
    define('EMPTY_STRING', '');
}

/**
 * Plugin de supervision des modifications d'identité utilisateur.
 */
class mel_supervision extends bnum_plugin {
  /**
   * Nom du plugin requis pour fonctionner.
   */
  const REQUIRED_PLUGIN = 'mel_helper';
  /**
   * Hook surveillé pour la mise à jour d'identité.
   */
  const HOOK_IDENTITY_UPDATE = 'identity_update';
  /**
   * Nom de la fonction callback pour le hook.
   */
  const CALLBACK_IDENTITY_UPDATE = 'hook_identity_update';
  /**
   * Dossier contenant les textes de localisation.
   */
  const FOLDER_LOCALIZATION = 'localization';
  /**
   * Champ "reply-to" surveillé.
   */
  const FIELD_TO = 'reply-to';
  /**
   * Champ "bcc" surveillé.
   */
  const FIELD_BCC = 'bcc';
  /**
   * Expéditeur des mails d'avertissement.
   */
  const MAIL_SENDER = 'bnum';
  /**
   * Destinataires des alertes.
   */
  const CONFIG_MAIL_RECEIVER = 'mail_warning_emails';
  /**
   * Option pour ajouter les administrateurs Amédée en copie.
   */
  const CONFIG_AMEDEE_ADMIN = 'mail_warning_amedee_admin';
  /**
   * Clé du sujet du mail d'avertissement.
   */
  const TEXT_MAIL_SUBJECT = 'mail_warning_subject';
  /**
   * Clé du corps du mail d'avertissement.
   */
  const TEXT_MAIL_BODY = 'mail_warning_message';

  public $task = 'settings';

  /**
   * Initialise le plugin et ajoute les hooks nécessaires.
   */
  function init() {
    $this->require_plugin(self::REQUIRED_PLUGIN);
    $this->add_hooks(
      [
        self::HOOK_IDENTITY_UPDATE => [$this, self::CALLBACK_IDENTITY_UPDATE],
        'managesieve_save_after' => [$this, 'hook_managesieve_save_after']
      ]
    );
  }

  /**
   * Hook appelé lors de la mise à jour d'une identité.
   * Vérifie les champs "reply-to" et "bcc" et envoie une alerte si une adresse externe est détectée.
   *
   * @param array $args Arguments du hook.
   * @return array Arguments éventuellement modifiés.
   */
  public function hook_identity_update($args) {
    $RECORD = 'record';

    $this->load_config();
    $this->add_texts(self::FOLDER_LOCALIZATION);
    $replyto = $args[$RECORD][self::FIELD_TO] ?? EMPTY_STRING;
    $bcc = $args[$RECORD][self::FIELD_BCC] ?? EMPTY_STRING;

    $uReplyto = $this->get_user_from_email($replyto);
    $uBcc = $this->get_user_from_email($bcc);

    $this->_sendMessageIfExternal(self::FIELD_TO, $uReplyto, true, $replyto)->_sendMessageIfExternal(self::FIELD_BCC, $uBcc, true, $bcc);

    return $args;
  }

  public function hook_managesieve_save_after($_) {
    $actions_types = rcube_utils::get_input_value('_action_type', rcube_utils::INPUT_POST, true);

    if ($actions_types !== null && is_array($actions_types)) {
      $act_targets    = rcube_utils::get_input_value('_action_target', rcube_utils::INPUT_POST, true);

      $mails = [];

      foreach ($actions_types as $idx => $type) {
        switch ($type) {
          case 'redirect':
          case 'redirect_copy':
            $target = $this->strip_value($act_targets[$idx]);
            $mail = $this->get_user_from_email($target);

            if (!$mail || ($mail && ($mail->is_external || !$mail->exists()))) {
              $mails[] = $target;
            }

            break;
          
          default:
            break;
        }
      }

      if (!empty($mails)) {
        $this->_sendMessageIfExternal('sieve_redirect', null, false, implode(', ', $mails));
      }
    }



    return $_;
  }

  /**
   * Envoie un mail d'avertissement si une adresse externe est détectée dans le champ surveillé.
   * Sauvegarde la modification pour éviter les alertes répétées.
   *
   * @param string $key Nom du champ surveillé.
   * @param \LibMelanie\Api\Defaut\User|null $item Utilisateur correspondant à l'adresse.
   * @param bool $userPref Si on sauvegarde dans les prefs utilisateurs
   * @param string|null $emails Adresse(s) à utiliser dans le mail (si différente de l'utilisateur ou si $item peut être null)
   * @return self
   */
  private function _sendMessageIfExternal(string $key, ?\LibMelanie\Api\Defaut\User $item, bool $userPref = true, ?string $emails = null): self {
    $VAR_EMAIL = 'email';
    $VAR_KEY = 'key';
    $IDENTITY_UPDATE = "identity_update_$key";

    // On vérifie si l'adresse à changer entre temps
    $config = $userPref ? $this->get_config($IDENTITY_UPDATE) : null;

    $hasEmailDefine = $item === null && $emails !== null && $emails !== EMPTY_STRING;
    $isExternal = $item !== null && (!$item->exists() || $item->is_external);
    $isChanged = $config !== ($item === null ? $emails : $item->email);
    $testingEmail = $hasEmailDefine || ($isChanged && $isExternal);
    // Si on a pas d'email (($item null et $emails non null et non vide) => Pas d'utilisateur mais une adresse a été défini => externe => on rentre dans le if
    // Si l'eamil a changé et que c'est une adresse externe => externe => on rentre dans le if 
    if ($testingEmail) {
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
      $message = $this->gettext(['name' => self::TEXT_MAIL_BODY."_$key", 'vars' => [$VAR_KEY => $emails ?? $item->email]]);

      if ($this->get_config(self::CONFIG_AMEDEE_ADMIN, false)) {
        $admins = mel_helper::SearchOperatorsMelByDn($this->get_user()->uid);

        if (!empty($admins)) $cc = array_merge($cc, explode(',', $admins));
      }

      \LibMelanie\Mail\Mail::Send($email, $to, $subject, $message, null, $cc);

      if (mel_logs::gi()->is(mel_logs::WARN)) mel_logs::gi()->log(mel_logs::WARN, "Modification de l'adresse $key vers une adresse externe détectée pour l'utilisateur " . $this->rc()->user->get_username());
      
      // On sauvegarde la nouvelle adresse pour eviter de SPAM
      if ($userPref) $this->rc()->user->save_prefs([$IDENTITY_UPDATE => $item === null ? $emails : $item->email]);
    }
    else if($item !== null && $config !== $item->email && $userPref) $this->rc()->user->save_prefs([$IDENTITY_UPDATE => EMPTY_STRING]);

    return $this;
  }


      /**
     * Trims and makes safe an input value
     *
     * @param string|array $str        Input value
     * @param bool         $allow_html Allow HTML tags in the value
     * @param bool         $trim       Trim the value
     *
     * @return string|array
     */
    protected function strip_value($str, $allow_html = false, $trim = true)
    {
        if (is_array($str)) {
            foreach ($str as $idx => $val) {
                $str[$idx] = $this->strip_value($val, $allow_html, $trim);

                if ($str[$idx] === '') {
                    unset($str[$idx]);
                }
            }

            return $str;
        }

        $str = (string) $str;

        if (!$allow_html) {
            $str = strip_tags($str);
        }

        return $trim ? trim($str) : $str;
    }
}
