<?php
// *** CONFIGURATION
// Application locale ou intégrée à Roundcube Mél ?
define('APPLICATION_LOCALE', false);

// Fichier de log errors
define('LOG_FILE', "/var/log/roundcube/errors");

// *** Control de provenance de l'application (erreur si pas RIE)
// Si pas en interne on rejète la page
if (!is_internal()) {
  echo "Le générateur de signature est uniquement accessible depuis le réseau Ministériel ou depuis un VPN (Contactez votre support informatique local pour savoir comment faire).";
  exit;
}
/**
 * Défini si on est dans une instance interne ou extene de l'application
 * Permet la selection de la bonne url
 */
function is_internal() {
  return (!isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) || strcasecmp($_SERVER["HTTP_X_MINEQPROVENANCE"], "intranet") === 0);
}

// Gestion des logs
ini_set("log_errors", 1);
ini_set("error_log", LOG_FILE);

// Configuration du plugin
$rcmail_config = [];
if (APPLICATION_LOCALE) {
  include_once __DIR__ . '/config.inc.php';
}
else {
  // PAMELA - Application name configuration for ORM Mél
  define('CONFIGURATION_APP_LIBM2', 'roundcube');

  @include_once 'includes/libm2.php';
  include_once __DIR__ . '/../../vendor/autoload.php';
  include_once __DIR__ . '/../../plugins/mel_signatures/config.inc.php';
}

if(!empty($_GET['email'])){
  $email = htmlspecialchars($_GET['email']);
}

$env_links = [];
$sources = [];

/**
 * Retrouve le nom de la direction en fonction de l'acronyme et du DN de l'utilisateur
 * 
 * @param string $direction Acronyme de la direction
 * @param string $dn DN de l'utilisateur
 * 
 * @return string Nom complet de la direction
 */
function get_direction_name($direction, $dn = null) {
  global $rcmail_config;
  $pos = strpos($dn, "ou=$direction,");
  if ($pos !== false && !APPLICATION_LOCALE) {
      $searchDN = substr($dn, $pos);
      $ou = new LibMelanie\Api\Mel\User();
      $ou->dn = $searchDN;
      if ($ou->load('observation')) {
          $direction = $ou->observation;
      }
  }
  else {
      $directions = $rcmail_config['signature_directions'];
      $direction = $directions[$direction] ?: $direction;
  }
  return $direction;
}

/**
 * Return image data from image name uri
 * 
 * @param string $uri Image URI
 * 
 * @return string image data
 */
function image_data($uri) {
  // Format the image SRC: data:{mime};base64,{data};
  if (APPLICATION_LOCALE) {
    $dir = __DIR__;
  }
  else {
    $dir = __DIR__.'/../../plugins/mel_signatures';
  }
  return 'data:'.mime_content_type($dir.'/'.$uri).';base64,'.base64_encode(file_get_contents($dir.'/'.$uri));
}

/**
 * Return the default url for the user dn
 * 
 * @return string default url
 */
function get_default_url($dn, $links) {
  foreach ($links as $serviceDN => $link) {
      if (strpos($dn, $serviceDN) !== false) {
          return $link;
      }
  }
  return isset($links['default']) ? $links['default'] : null;
}

/**
 * Return the default image for the user dn
 * 
 * @return string default image
 */
function get_default_image($dn, $images) {
  foreach ($images as $serviceDN => $link) {
    if (strpos($dn, $serviceDN) !== false) {
      return $link;
    }
  }
  return isset($images['default']) ? $images['default'] : null;
}

/**
 * Handler pour le choix du logo
 */
function logo() {
  global $user, $rcmail_config, $sources;
  $html = '<select name="signaturelogo" class="browser-default" id="input-logo" onchange="onInputChange();">';
  $default_image = str_replace('.gif', '.png', get_default_image($user->dn, $rcmail_config['signature_default_image']));
  foreach ($rcmail_config['signature_images'] as $name => $logo) {
    if (is_array($logo)) {
      $logo_html = "";
      foreach ($logo as $n => $l) {
        $l = str_replace('.gif', '.png', $l);
        if ($default_image == $l) {
          $logo_html .= '<option value="'.$l.'" selected="selected">'.$n.'</option>';
        }
        else {
          $logo_html .= '<option value="'.$l.'">'.$n.'</option>';
        }
        $sources[$l] = image_data($l);
      }
      $html .= '<optgroup label="'.$name.'">'.$logo_html.'</optgroup>';
    }
    else {
      $logo = str_replace('.gif', '.png', $logo);
      if ($default_image == $logo) {
        $html .= '<option value="'.$logo.'" selected="selected">'.$name.'</option>';
      }
      else {
        $html .= '<option value="'.$logo.'">'.$name.'</option>';
      }
      $sources[$logo] = image_data($logo);
    }
  }
  $sources[$rcmail_config['signature_image_marianne']] = image_data(str_replace('.gif', '.png', $rcmail_config['signature_image_marianne']));
  $sources[$rcmail_config['signature_image_devise']] = image_data(str_replace('.gif', '.png', $rcmail_config['signature_image_devise']));
  $html .= '</select>';
  return $html;
}

/**
 * Handler pour la liste des liens
 */
function links() {
  global $user, $rcmail_config, $env_links;
  $html = '<div id="input-links" class="items checkboxes">';

  $i = 1;

  $default_url = get_default_url($user->dn, $rcmail_config['signature_default_link']);
  $html .= '<label for="checkbox-custom-link"><input value="custom-link" id="checkbox-custom-link" onchange="onInputChange();" type="checkbox">Lien personnalisé<span class="" style="float: right; font-size: 12px;"></span></label>';
  foreach ($rcmail_config['signature_links'] as $name => $link) {
      $id = "signature_links_$i";
      $i++;
      if ($link == $default_url) {
        $html .= '<label for="'.$id.'"><input value="'.$link.'" id="'.$id.'" onchange="onInputChange();" type="checkbox" checked="checked">'.$name.'<span class="" style="float: right; font-size: 12px;"></label>';
      }
      else {
        $html .= '<label for="'.$id.'"><input value="'.$link.'" id="'.$id.'" onchange="onInputChange();" type="checkbox">'.$name.'<span class="" style="float: right; font-size: 12px;"></label>';
      }
      $env_links[$link] = $name;
  }
  $html .= '</ul>';
  $html .= '</div>';
  return $html;
}

// Pour un fonctionnement local aller chercher les informations dans le jeu de données du fichier de configuration
if (APPLICATION_LOCALE) {
  // Include class de test User
  include_once __DIR__ . '/user.php';
  $userLoaded = isset($rcmail_config['users'][$email]);
  if ($userLoaded) {
    $user = new User($rcmail_config['users'][$email]);
  }
}
else {
  // Utiliser l'ORM pour lire les informations de l'utilisateur
  // Modifier le filtre de recherche ldap
  \LibMelanie\Config\Ldap::$SERVERS[\LibMelanie\Config\Ldap::$SEARCH_LDAP]['get_user_infos_from_email_filter'] = "(mail=%%email%%)";

  // Récupération des infos utilisateur
  $user = new LibMelanie\Api\Mel\User();
  $user->email = $email;
  $userLoaded = $user->load($rcmail_config['signature_field_list']);
}

// Est-ce que l'utilisateur a été trouvé
if ($userLoaded) {
  if (isset($user->lastname)) {
    $name = $user->firstname . " " . $user->lastname;
  }
  else {
    $name = $user->name;
  }
  
  $observation = $user->observation;
  if (isset($user->service)) {
    $tmp = explode('/', $user->service, 2);
    $direction  = get_direction_name($tmp[0], $user->dn);
    $service    = $tmp[1];
  }
  else {
    $direction  = '';
    $service    = '';
  }
  
  $address      = str_replace("\r\n", ' ', $user->street . " " . $user->postalcode . " " . $user->locality);
  $phonenumber  = $user->phonenumber;
  $mobilephone  = $user->mobilephone;
  $roomnumber   = isset($user->roomnumber) ? 'Bureau : ' . $user->roomnumber : '';
}
else {
  $name = "Prénom NOM";
  $service    = "Service";
  $direction  = "Direction";
  $observation = "Fonction";
  $address      = "Adresse";
  $phonenumber  = "";
  $mobilephone  = "";
  $roomnumber   = "";
}

?>
<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Générateur de signature</title>
        <link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!--Import materialize.css-->
        <link type="text/css" rel="stylesheet" href="css/materialize.min.css"  media="screen,projection"/>

        <!--Let browser know website is optimized for mobile-->
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
        <?php if (APPLICATION_LOCALE) { ?>
          <script type="text/javascript" src="signature.js?v=20210217112052"></script>
        <?php } else { ?>
          <script type="text/javascript" src="../../plugins/mel_signatures/signature.js?v=20210217112052"></script>
        <?php } ?>
        
        <script type="text/javascript" src="js/materialize.min.js"></script>
        <script type="text/javascript" src="js/getSignature.js"></script>
        <!-- <script type="text/javascript" src="js/jszip.min.js"></script> -->
        <link rel="stylesheet" href="css/ghpages-materialize.css">
        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/main.css?v=20210217112052">
    <!--Import materialize.css-->
  </head>
  <body  id="main-body">
    <div class="container card hoverable">
      <div class="row sig-header">
        <div class="col s6 valign top-logo-img">
        <img src="img/logo_pole.png" alt="Ministères de la Transition écologique, de la Cohésion des Territoires et de la Mer" class="logo_pole">
        </div>
      </div>

      <p class="title">
        Générez votre signature d'email
      </p>
    
      <div id="settings-right">
        <div class="container card-content">
          <div class="usersignature">
            <span>Votre signature générée :</span>
            <div id="signature" class="sign"></div>
            <textarea id="signature_html" class="sig-markup" readonly="readonly" type="text"></textarea>
            <div class="action">
              <button type="submit" class="waves-effect waves-light btn" id="modify-signature" title="Utilisez ce bouton pour éditer les champs de la signature" onclick="modify_signature();">Éditer la signature</button>
              <button type="submit" class="waves-effect waves-light btn" id="copy-to-clipboard" title="Utilisez ce bouton pour copier le code généré de la signature afin de le coller dans la configuration de votre outil de messagerie" onclick="copy_signature();">Copier la signature</button>
              <button type="submit" class="waves-effect waves-light btn" id="download-signature" title="Utilisez ce bouton pour télécharger le fichier de signature pour l'intégrer au client Outlook" onclick="download_signature_outlook();">Télécharger la signature (Outlook)</button>
            </div>
          </div>
          <div class="userinfos">
            <span>Vos informations :</span>
            <div class="form">
                <div class="grid-form">
                    <div class="form-section">
                        <label for="input-nom">Nom</label>
                        <input type="text" id="input-nom" onkeyup="onInputChange();" value="<?= $name ?>" required="">
                    </div>
                    <div class="form-section" style="margin-top: 23px;">
                        <label for="input-fonction">Fonction / Intitulé de poste</label>
                        <input type="text" id="input-fonction" onchange="onInputChange();" onkeyup="onInputChange();" value="<?= $observation ?>" required="">
                    </div>
                    <div class="form-section">
                      <label for="input-service">Service</label>
                      <input type="text" id="input-service" onkeyup="onInputChange();" value="<?= $service ?>">
                    </div>
                    <div class="form-section">
                      <label for="input-department">Direction / Département</label>
                      <input type="text" id="input-department" onkeyup="onInputChange();" value="<?= $direction ?>">
                    </div>
                    <div class="form-section">
                      <label for="input-links">Choix des liens</label>
                      <?= links() ?>
                    </div>
                    <div class="form-section custom-link">
                      <label for="input-custom-link">Lien personnalisé</label>
                      <input type="text" id="input-custom-link" onkeyup="onInputChange();" value="">
                    </div>
                    <div class="form-section">
                        <label for="input-address">Adresse</label>
                        <input type="text" id="input-address" onkeyup="onInputChange();" value="<?= $address ?>">
                    </div>
                    <div class="form-section">
                      <label for="input-bureau">Bureau (ou pôle)</label>
                      <input type="text" id="input-bureau" onkeyup="onInputChange();" value="<?= $roomnumber ?>">
                    </div>
                    <div class="form-section">
                        <label for="input-fixe">Téléphone fixe</label>
                        <input type="text" id="input-fixe" onkeyup="onInputChange();" value="<?= $phonenumber ?>">
                    </div>
                    <div class="form-section">
                        <label for="input-mobile">Téléphone mobile</label>
                        <input type="text" id="input-mobile" onkeyup="onInputChange();" value="<?= $mobilephone ?>">
                    </div>
                    <div class="form-section">
                      <label for="input-logo">Choix du logo</label>
                      <?= logo() ?>
                    </div>
                </div>
            </div>
          </div>
        </div>
        <div class="row bloc_exp">
          <div class="col s12">
            <p>Pour ajouter une signature html dans Outlook :</p>
          </div>
          <div class="col s12">
            <ol>
              <li>Cliquez sur le bouton "Télécharger la signature (Outlook)"</li>
              <li>Enregistrez le fichier sous : C:\Users\[votre utilisateur]\AppData\Roaming\Microsoft\Signatures\</li>
              <li>Ouvrez Outlook et allez dans les Options puis cliquez sur le bouton Signatures</li>
              <li>Vous devez retrouver votre signature générée</li>
            </ol>
            <br />
          </div>
        </div>

        <div class="row">
          <div class="col s12">
            <div class="card-action">
              <a href="javascript:window.history.go(-1);">
                <button type="submit" class="waves-effect waves-light btn">Retour</button>
              </a>
            </div>
            <br />
            <br />
          </div>
        </div>
      </div>
    </div>
    <?php
      include_once __DIR__.'/templates/signature_html.html';
      include_once __DIR__.'/templates/signature_outlook.html';
    ?>
  </body>
  <script type="text/javascript">
    // Morceau du js de roundcube pour que le signature.js fonctionne
    function rcube_webmail()
    {
      this.labels = {};
      this.env = {};

      // add a localized label to the client environment
      this.add_label = function(p, value)
      {
        if (typeof p == 'string')
          this.labels[p] = value;
        else if (typeof p == 'object')
          $.extend(this.labels, p);
      };

      // return a localized string
      this.get_label = function(name, domain)
      {
        if (domain && this.labels[domain+'.'+name])
          return this.labels[domain+'.'+name];
        else if (this.labels[name])
          return this.labels[name];
        else
          return name;
      };

      this.display_message = function(message)
      {

      };
    }
    var rcmail = new rcube_webmail();
    // Ajout des labels
    rcmail.add_label('mel_signatures.signaturecopiedmessage', "");
    rcmail.add_label('mel_signatures.signaturecopied', "Copiée !");
    rcmail.add_label('mel_signatures.clictocopy', "Copier la signature");
    rcmail.add_label('mel_signatures.phonephone', "Tel : ");
    rcmail.add_label('mel_signatures.mobilephone', "Mobile : ");
    // Variable d'env
    rcmail.env.signature_links = {};
    rcmail.env.logo_sources = {};
    <?php
      foreach ($env_links as $key => $value) {
        echo "rcmail.env.signature_links['$key'] = '$value';";
      }
      foreach ($sources as $key => $value) {
        echo "rcmail.env.logo_sources['$key'] = '$value';";
      }
    ?>
  </script>
</html>

