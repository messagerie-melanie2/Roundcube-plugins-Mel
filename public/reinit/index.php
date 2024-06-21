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

if (!Core::Process()) {
    // Affichage de l'erreur
    include_once 'includes/error.inc.php';
}
else if ($step === 1) {
    // Affichage du formulaire
    include_once 'includes/form.inc.php';
}
else if ($step === 2) {
    // Affichage de la confirmation
    include_once 'includes/confirmation.inc.php';
}

// Inclusion du pied de page
include_once 'includes/footer.inc.php';



