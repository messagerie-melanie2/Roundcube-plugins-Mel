<?php
/**
 * Page d'accueil de l'application pour les utilisateurs externes
 * 
 * Leur permet d'initialiser leur compte avec nom, prénom et mot de passe
 */

// Inclusion du traitement
require_once __DIR__ . '/../lib/extern/core.php';

// Inclusion de l'entête de la page
include_once 'includes/header.inc.php';

if (isset($_POST['_email'])) {
    // Traitement du formulaire
    Core::Reinit();
    include_once 'includes/confirmation.inc.php';
}
else {
    // Affichage du formulaire
    include_once 'includes/form.inc.php';
}

// Inclusion du pied de page
include_once 'includes/footer.inc.php';



