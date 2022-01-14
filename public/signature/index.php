<?php
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
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

        <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->
        <link rel="stylesheet" href="css/forms-min.css">
        <link rel="stylesheet" href="css/buttons-min.css">
        <link rel="stylesheet" href="css/ghpages-materialize.css">
        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/main.css">
        <script src="js/vendor/modernizr-2.6.2.min.js"></script>
        <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
        <script type="text/javascript" src="js/materialize.min.js"></script>
        <script type="text/javascript" src="js/materialize.js"></script>
        <script type="text/javascript" src="js/init.js"></script>
    </head>
    <body id="main-body">
        <!--[if lt IE 7]>
            <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
        <![endif]-->

        <!-- Add your site or application content here -->
        <div class="container card hoverable">
            <div class="row sig-header">
              <div class="col s6 valign top-logo-img">
              <img src="img/logo_pole.png" alt="Ministères de la Transition écologique, de la Cohésion des Territoires et de la Mer" class="logo_pole">
              </div>
            </div>
              <p class="title">
                Générez votre signature d'email
              </p>
            
            <form class="form" action="sig.php">
                <div class="card-content">
                    <div class="label-field">
                        Saisissez votre adresse e-mail professionnelle pour générer automatiquement votre signature d'e-mail
                    </div>
                    <div class="input-field">
                        <i class="material-icons prefix">mail</i>
                        <input type="text" name="email" id="email" autofocus>
                        <label for="name">Adresse e-mail</label>
                    </div>
                </div>
                <div class="card-action">
                    <button type="submit" class="waves-effect waves-light btn">Générer ma signature</button>
                </div>
            </form>

        </div>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.10.2.min.js"><\/script>')</script>
        <script src="js/plugins.js"></script>
        <script src="js/main.js"></script>
    </body>
</html>
