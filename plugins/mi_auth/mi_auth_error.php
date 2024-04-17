<?php
  require(dirname(__FILE__) . '/config.inc.php');
?>

<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <title>MCE webmail : erreur</title>
  <link rel="stylesheet" type="text/css" media="screen" as="style" href="mi_auth_error.css">
  <meta charset="utf8">
  <link rel="icon" href="/plugins/mi_auth/favicon.ico">
  <script type="application/ld+json" id="app_conf">
  <?php echo json_encode([
    'api_uri' => $config['mi_auth']['api_uri_ext'],
    'auth_uri' => $config['mi_auth']['portail_uri'],
  ]); ?>
  </script>
  <script rel="preload" src="mi_auth_error.js" as="script"></script>
</head>
<body id="MCE_ERROR">
  <div id="header">
    <div>
      <div id="logoMi"></div>
      <div class="title">
        <h1>Erreur d'accès</h1>
      </div>
      <div id="logoMCE"></div>
    </div>
  </div>
  <div id="contents">
    <div>
      <p>
        Une erreur est survenue lors de la phase d'authentification. <br><br>
        La page tentera l'accès au webmail d'ici <span id="refresh_ts">60</span> secondes.
          <button id="btn_refresh" class="red">Ne pas attendre</button>
      </p>
    </div>
    <div>
      <button id="btn_portail">Retour au portail d'authentification</button>
    </div>
  </div>
  <div id="footer">
    <div id="cr"></div>
    <div>
      <span id="right"></span>
      <span>MCE : Messagerie Collaborative de l'État</span>
    </div>
  </div>
  </div>


</body>
</html>
