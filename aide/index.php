<?php
/**
 * Fichier d'index contenant la liste des pages d'aide pour Mél
 */

// Inclus la config
require_once 'config.php';
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link rel="stylesheet" href="style.css" />
<link rel="stylesheet" href="custom.css" />
<link rel="icon" type="image/png" href="images/favicon_help.png" />
<title>Aide Mél</title>
</head>
<body>
  <div id="prevcontent">
    <h1>Aide Mél</h1>
    <div id="content">
      <div id="help-url-list">
        <ul>
        <?php
          foreach($config['pages'] as $name => $page) {
            ?>
              <li class="<?= $page['class'] ?>">
                <a href="<?= $page['url'] ?>">
                  <span class="image"></span>
                  <span class="name"><?= $name ?></span>
                </a>
              </li>
            <?php
          }
        ?>
        </ul>
      </div>
      <div id="help-details">
          <?php
          foreach($config['details'] as $name => $list) {
            ?>
              <div class="details">
                <span class="name">
                  <?= $name ?>
                </span>
                <div class="list">
                  <ul>
                    <?php
                    foreach($list as $list_name => $list_url) {
                    ?>
                      <li><a href="<?= $list_url ?>"><?= $list_name ?></a></li>
                    <?php
                    }
                    ?>
                  </ul>
                </div>
              </div>
            <?php
          }
        ?>
      </div>
    </div>
    <div id="copyright">MTES-MCT PNE annuaire et messagerie</div>
  </div>
</body>
</html>