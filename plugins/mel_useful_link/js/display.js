/**
   * Affiche la première lettre si l'image n'est pas trouvée
   * @param {string} iconId Id de l'image
   * @param {string} iconId Id de l'overlay si l'image n'est pas chargée
   * @param {string} title Titre du lien
   */
function imgError(iconId = null, noImageId = null, title) {
  let iconImage = $('#' + iconId);
  let noImage = $('#' + noImageId);

  const firstLetter = title
    ? title[0].toUpperCase()
    : $('#mulc-title').val()
      ? $('#mulc-title').val()[0].toUpperCase()
      : null;

  iconImage.hide();
  if (noImage.text() === '') {
    noImage.html(firstLetter);
  }
  noImage.css('display', 'flex');
}