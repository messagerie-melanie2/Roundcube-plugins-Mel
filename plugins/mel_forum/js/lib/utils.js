export { parseFrenchDate, formatPostDate, formatCommentDate, createPostLink };

/**
 * Analyse une date française sous forme de chaîne et la convertit en objet Moment.
 *
 * @param {string} dateString - La date au format français (ex. "11 mars 2024 à 15:41").
 * @returns {moment.Moment} Un objet Moment représentant la date analysée.
 */
function parseFrenchDate(dateString) {
  return moment(dateString.replace(' à ', ' '), 'D MMMM YYYY HH:mm', 'fr');
}

/**
 * Formate une date de publication en fonction de sa proximité avec la date actuelle.
 *
 * @param {string} createdDate - La date de création du message au format français.
 * @returns {string} La date formatée (ex. "Aujourd'hui", "Hier" ou "11 mars 2024").
 */
function formatPostDate(createdDate) {
  const postDate = parseFrenchDate(createdDate);

  if (!postDate.isValid()) {
    console.error(rcmail.gettext('mel_forum.invalid_date'), createdDate);
    return rcmail.gettext('mel_forum.invalid_date_simple');
  }

  if (postDate.isSame(moment(), 'day')) {
    return rcmail.gettext('mel_forum.today');
  }
  if (postDate.isSame(moment().subtract(1, 'day'), 'day')) {
    return rcmail.gettext('mel_forum.yesterday');
  }

  return postDate.format('D MMMM YYYY');
}

/**
 * Formate une date de commentaire en fonction de sa proximité avec la date actuelle.
 *
 * @param {string} createdDate - La date de création du commentaire au format français.
 * @returns {string} La date formatée (ex. "Aujourd'hui à 14h30", "Hier à 09h15" ou "11 mars 2024").
 */
function formatCommentDate(createdDate) {
  const commentDate = parseFrenchDate(createdDate);

  if (!commentDate.isValid()) {
    console.error(rcmail.gettext('mel_forum.invalid_date'), createdDate);
    return rcmail.gettext('mel_forum.invalid_date_simple');
  }

  const timeString = commentDate.format('HH[h]mm');

  if (commentDate.isSame(moment(), 'day')) {
    return `${rcmail.gettext('mel_forum.today_at')} ${timeString}`;
  }
  if (commentDate.isSame(moment().subtract(1, 'day'), 'day')) {
    return `${rcmail.gettext('mel_forum.yesterday_at')} ${timeString}`;
  }

  return commentDate.format('D MMMM YYYY');
}

/**
 * Génère un lien URL vers un post du forum dans un espace de travail donné.
 *
 * @param {string} postId - L'identifiant du post à afficher.
 * @param {string} wspId - L'identifiant de l'espace de travail.
 * @returns {string} L'URL générée pour accéder au post dans le forum.
 */
function createPostLink(postId, wspId) {
  const url = new URL('/', window.location.origin);

  url.searchParams.set('_task', 'workspace');
  url.searchParams.set('_action', 'workspace');
  url.searchParams.set('_uid', wspId);
  url.searchParams.set('_page', 'forum');
  url.searchParams.set('_bag', postId);
  url.searchParams.set('_force_bnum', '1');

  return url.toString();
}
