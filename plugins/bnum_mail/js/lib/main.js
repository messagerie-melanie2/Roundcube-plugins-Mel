/**
 * Initialise des commandes Roundcube permettant d’insérer
 * différents types de signatures lors de la composition d’un mail.
 *
 * Commandes disponibles :
 * - insert-sig-full : signature complète
 * - insert-sig-medium : signature intermédiaire
 * - insert-sig-simple : signature simple
 * - insert-sig-none : aucune signature
 *
 * Chaque commande définit le type de signature dans l’environnement
 * puis déclenche la commande d’insertion de signature.
 */

if (window.rcmail) {
  rcmail.addEventListener('init', function () {

    if (rcmail.env.task === 'mail' && rcmail.env.action === 'compose') {

      rcmail.register_command('insert-sig-full', function () {
        rcmail.env.signature_type = 'full';
        rcmail.command('insert-sig');
      }, true);

      rcmail.register_command('insert-sig-medium', function () {
        rcmail.env.signature_type = 'intermediaire';
        rcmail.command('insert-sig');
      }, true);

      rcmail.register_command('insert-sig-simple', function () {
        rcmail.env.signature_type = 'simple';
        rcmail.command('insert-sig');
      }, true);

      rcmail.register_command('insert-sig-none', function () {
        rcmail.env.signature_type = 'none';
        rcmail.command('insert-sig');
      }, true);

    }
  });
}
