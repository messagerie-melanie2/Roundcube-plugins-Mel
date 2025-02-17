export { startLoading, stopLoading };

/**
 * Affiche un curseur "wait" et en active un message de chargement.
 */
function startLoading() {
  $("body").css("cursor", "wait");
  BnumMessage.SetBusyLoading();
}

/**
 * Arrête l'affichage d'un curseur "wait" et désactive le message de chargement.
 */
function stopLoading() {
  BnumMessage.StopBusyLoading();
  $("body").css("cursor", "default");
}