<?php 
class bnum_mail extends bnum_plugin {
  public $task = 'mailext|mail|settings';

  function init() {
    if ($this->is_index_action()) {
        $this->load_config();

        $config = $this->get_config('search_scope');

        if (isset($config) && !$this->rc()->output->get_env('search_scope')) $this->rc()->output->set_env('search_scope', $config);

        $this->include_module('main');
    }
    else if ($this->get_current_action() === 'show' && $this->get_input('_extwin') == '1') {
      $this->include_script_from_plugin('mel_metapage', 'js/functions.js');
    }
    else {
      $this->register_task('mailext');
      $this->register_action('archive_save_attachments', array($this, 'action_archive_save_attachments'));
    }

    $this->add_hook('messages_list', [$this, 'hook_message_list']);

    $this->add_button([
        'type'     => 'link-menuitem',
        'label'    => 'bnum_mail.archive_attachments', // Clé de traduction
        'command'  => 'plugin.archive_save_attachments', // La commande JS à déclencher
        'class'    => 'button button-archive', // Classe pour le style (Classic/Larry skins)
        'classact' => 'button button-archive active', // Classe quand actif
        'innerclass' => 'inner', // Souvent nécessaire pour le skin Larry
        'title'    => 'bnum_mail.archive_attachments_tooltip',
    ], 'messagemenu');    
  }

  public function hook_message_list($args) {
    if ($args['cols'] && is_array($args['cols'])) {
      $this->load_config();
      // Gestion des colonnes additionnels
      $args['cols'] = array_merge($args['cols'], $this->get_config('additional_columns', ['priority']));
    }

    return $args;
  }

  public function action_archive_save_attachments() {
    $uids = rcube_utils::get_input_value('_uids', rcube_utils::INPUT_POST);
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST);
    $dest = rcube_utils::get_input_value('_dest', rcube_utils::INPUT_POST);

    $dest = rtrim($dest, '/');

    if (basename($dest) !== 'Archives') {
        $dest .= '/Archives';
    }

    $this->rc()->plugins->get_plugin('roundrive')->create_folder_if_not_exists($dest);

    $dest .= '/Archive_' . date('Y-m-d_H-i-s');
    $saved = $this->archive_save_attachments($mbox, $dest, $uids);

    $this->rc()->output->command('plugin.archive_save_attachments_completed');
    $this->sendEncodedExit($saved);
  }

  public function archive_save_attachments($mbox, $dest, $uids = null) {
    $saved = [];
    if (class_exists('roundrive')) {
      foreach ($this->rc()->plugins->get_plugin('roundrive')->create_folder_if_not_exists($dest)->save_files_generator($mbox, $dest, $uids) as [$files, $errors, $msg]) {
        if (/*count($errors) == 0 && */count($files) > 0) {
          // On modifie les mails pour indiquer que les pièces jointes ont été archivées
          // Construction du message à ajouter
          $links_text = "Pièces jointes archivées :\n";
          $links_html = "<p style='background:#f0f0f0; padding:10px; border:1px solid #ccc;'><strong>Pièces jointes archivées :</strong><br/>";
          
          $links_html .= "<ul>";
          foreach($files as $file) {
              // Adaptez ici selon la structure retournée par votre générateur
              // Supposons que $file contient le chemin ou l'url
              $file_path = "$dest/" . basename($file); 
              
              $links_text .= "- $file_path\n";
              $links_html .= "<li>$file_path</li>";
          }
          $links_html .= "</ul>";
          
          $links_text .= "\n--------------------------------\n\n";
          $links_html .= "</p><hr>";

          // Appel de la fonction de modification
          $saved[] = $this->_replace_message_with_link($msg, $mbox, $links_text, $links_html, $files);
        }

        if ($uids === null) break; // Si on n'a pas une liste d'UIDs spécifique, on traite qu'un seul lot
      } 
    }

    return $saved;
  }

  private function _replace_message_with_link($uid, $folder, $text_prepend, $html_prepend, $files_list) {
      $message = new rcube_message($uid, $folder);
      
      // Configuration UTF-8 pour le nouveau mail
      $mime_params = array(
          'text_encoding' => '8bit',
          'html_encoding' => '8bit',
          'head_encoding' => 'base64',
          'head_charset'  => 'UTF-8',
          'html_charset'  => 'UTF-8',
          'text_charset'  => 'UTF-8'
      );
      $mime = new Mail_mime($mime_params);

$blocked_exact = [
        'content-type', 
        'content-transfer-encoding', 
        'mime-version', 
        'received',
        'boundary',
        'content-length',
        'lines',
        'status',          // Souvent géré par le serveur IMAP
        'return-path',     // Géré par le serveur SMTP à l'envoi
        'x-nextcloud-attachment' // On l'enlève pour le remettre proprement
    ];

    // B. Interdiction par "Pattern" (Commence par...)
    // C'est ici qu'on élimine les sources d'erreurs (Signatures & Blobs Microsoft)
    // tout en gardant vos headers 'X-Remise-Pamela', 'X-Mon-App', etc.
    $blocked_patterns = [
        'dkim-',           // Signatures invalides
        'arc-',            // Signatures invalides
        'domainkey-',      // Signatures invalides
        'received-spf',    // Auth invalide
        'authentication-results',
        'x-ms-',  // Métadonnées Exchange (souvent la cause du crash)
        'x-microsoft-antispam', // Le header géant qui faisait planter votre script
        'x-forefront-'     // Antispam Microsoft
    ];

      // On récupère TOUS les headers originaux
      // $message->headers est un objet rcube_message_header
      // On itère sur les propriétés publiques de cet objet ou on utilise get_headers() si dispo
      // Dans Roundcube, on accède souvent via get_header() par clé, mais pour tout avoir :
      
      // Astuce : Roundcube stocke la structure, pour avoir les headers bruts parsés :
      // On va utiliser une liste standard étendue + ce qui est spécifique
      
      // Le plus simple et sûr : Itérer sur un tableau complet des headers communs
      // et ajouter les 'X-' headers si besoin. 
      // Cependant, rcube_message ne donne pas facilement un array "clé => valeur" de TOUT.
      
      // Solution robuste : Copier les essentiels (comme vu avant) + ajouter votre CUSTOM.
      // Si vous tenez à "Tout copier", voici comment faire via le storage :
      
// 1. Récupérer le BLOC de texte des headers (String brute)
    // Contrairement à get_message_headers, ceci ne contient PAS 'internaldate' ou 'folder'
    $raw_headers_string = $this->storage()->get_raw_headers($uid);

    // 2. Parser ce bloc avec PHP natif
    // ICONV_MIME_DECODE_CONTINUE_ON_ERROR : Tolérance aux erreurs
    // 'UTF-8' : Encodage cible
    $headers_array = iconv_mime_decode_headers(
        $raw_headers_string, 
        ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 
        'UTF-8'
    );
$clean_headers = [];

foreach ($headers_array as $key => $value) {
        $key_lower = strtolower($key);

        // CHECK 1 : Liste noire exacte
        if (in_array($key_lower, $blocked_exact)) {
            continue;
        }

        // CHECK 2 : Liste noire par pattern
        $is_blocked_pattern = false;
        foreach ($blocked_patterns as $pattern) {
            if (strpos($key_lower, $pattern) === 0) { // Si commence par...
                $is_blocked_pattern = true;
                break;
            }
        }
        if ($is_blocked_pattern) {
            continue;
        }

        // ---------------------------------------------------------
        // NETTOYAGE DES VALEURS (Sanitization)
        // ---------------------------------------------------------

        // 1. Aplatir les tableaux (ex: Received multiples)
        // On prend le dernier élément car c'est souvent le plus pertinent, 
        // ou on joint avec une virgule si c'est une liste logique.
        if (is_array($value)) {
            $value = end($value);
        }

// B. DECODAGE CRITIQUE
        // On décode le MIME (ex: =?UTF-8?B?...) vers du texte UTF-8 simple.
        // C'est INDISPENSABLE car Mail_mime va ré-encoder derrière.
        // Si on ne décode pas, on aura du double encodage qui casse tout.
        $decoded_value = iconv_mime_decode($value, 0, "UTF-8");
        
        // Si le décodage échoue (rare), on garde l'original, sinon on prend le décodé
        $final_value = ($decoded_value !== false) ? $decoded_value : $value;

        // C. Nettoyage ultime (retrait des sauts de ligne résiduels)
        $final_value = preg_replace('/\s+/', ' ', $final_value);


        
        // 3. Limite de sécurité (Optionnel mais conseillé)
        // Si un header custom fait 5000 caractères, c'est suspect et risque de planter.
        if (strlen($final_value) > 3000) {
            continue; 
        }

        if (!empty($value_clean)) {
            // On garde la clé originale (ex: "X-Remise-Pamela" est conservé)
            $clean_headers[$key] = $value_clean;
        }
    }

      // AJOUT DE VOTRE HEADER
      $header_files_value = json_encode($files_list, JSON_UNESCAPED_SLASHES);
      $clean_headers['X-NEXTCLOUD-ATTACHMENT'] = $header_files_value;

      // Application des headers
      $mime->headers($clean_headers);
      // -----------------------------------------------------------
      // 2. CORPS DU MESSAGE (Inchangé)
      // -----------------------------------------------------------
      $old_text = $message->first_text_part();
      if ($old_text) $mime->setTXTBody($text_prepend . $old_text);
      
      $old_html = $message->first_html_part();
      if ($old_html) {
          if (preg_match('/<body[^>]*>/i', $old_html, $regs)) {
              $new_html = str_replace($regs[0], $regs[0] . $html_prepend, $old_html);
          } else {
              $new_html = $html_prepend . $old_html;
          }
          $mime->setHTMLBody($new_html);
      } else {
          $mime->setHTMLBody("<html><body>" . nl2br($text_prepend . $old_text) . "</body></html>");
      }

      // -----------------------------------------------------------
      // 3. SAUVEGARDE
      // -----------------------------------------------------------
      $body = $mime->get();
      $txt_headers = $mime->txtHeaders();
      
      $saved = $this->storage()->save_message($folder, $body, $txt_headers, false, [], $headers_array['Date'] ?? null);
      
      return $saved;
      // if ($saved) {
      //     $rcmail->storage->delete_message($uid, $folder);
      // }
  }
}