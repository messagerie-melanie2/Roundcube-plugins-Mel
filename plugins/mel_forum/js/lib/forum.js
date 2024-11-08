import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { BnumMessage, eMessageType } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
// import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelTemplate } from '../../../mel_metapage/js/lib/html/JsHtml/MelTemplate.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export class Forum extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        this.initButtons();
        this.displayPosts();

    }


    initButtons() {
        $('#forum-button-add').click(() => {
            window.location.href = this.url('forum', {action:'create_or_edit_post'});
        });
        $('.favorite').click(() => {
            event.stopPropagation();
            if ($(this).text() === 'star_border') {
                // Si elle est vide, la remplir
                $(this).text('star');
            } else {
                // Sinon, la remettre en vide
                $(this).text('star_border');
            }
        });
        $('#display-fav-only').on('change', function() {
            if ($(this).is(':checked')) {
              // Affiche seulement les cartes qui ont la classe 'filled' sur l'icône étoile
              $('.post-card').each(function() {
                if ($(this).find('.favorite').hasClass('filled')) {
                  $(this).show();  // Affiche les favoris
                } else {
                  $(this).hide();  // Masque les non-favoris
                }
              });
            } else {
              // Affiche toutes les cartes si la checkbox est décochée
              $('.post-card').show();
            }
        });
    }

    addToFavorite(post_uid, event) {
        event.preventDefault();
        event.stopPropagation();
        //TODO récupérer le workspaces via l'url ou le post
        let workspace = 'workspace-test';
        this.http_internal_post(
            {
                task: 'forum',
                action: 'add_to_favorite',
                params: {
                    _workspace: workspace,
                    _article_uid: post_uid,
                },
                processData: false,
                contentType: false,
                on_success: () => {
                    let div = $('#favorite-'+post_uid);
                    if (div.hasClass('filled')){
                        div.removeClass('filled');
                    }else{
                        div.addClass('filled');
                    }
                    BnumMessage.DisplayMessage(
                        'Vos articles favoris ont été mis à jour',
                        eMessageType.Confirmation,
                    );
                },
                on_error: (err) => {
                    BnumMessage.DisplayMessage(
                        'Erreur lors de la modification',
                        eMessageType.Error,
                    );
                }
            }
        );
    }

    toggleMenuPost(post_uid, event) {
        event.preventDefault();
        event.stopPropagation();

        let selectContainer = $('#post-context-menu-' + post_uid);
        let triggerButton = $('#trigger-' + post_uid); // Bouton more_vert

        // Vérifier si le conteneur du menu existe
    if (selectContainer.length) {
        // Basculer l'affichage du conteneur
        selectContainer.toggleClass('hidden');
  
        // Si le menu est visible, ajouter un écouteur pour détecter les clics extérieurs
        if (!selectContainer.hasClass('hidden')) {
          // Ajouter un écouteur de clic sur tout le document après un léger délai
          setTimeout(() => {
            $(document).on('click.menuOutside', function(event) {
              // Vérifier si le clic est en dehors du menu et du bouton trigger
              if (!$(event.target).closest(selectContainer).length && !$(event.target).closest(triggerButton).length) {
                selectContainer.addClass('hidden');  // Masquer le menu
                $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
              }
            });
  
            // Ajouter un écouteur d'événements pour chaque bouton du menu
            selectContainer.find('.post-options-button').on('click', function() {
              selectContainer.addClass('hidden'); // Fermer le menu
              $(document).off('click.menuOutside'); // Retirer l'écouteur après fermeture
            });
          }, 0);  // Délai de 0 pour que l'événement de clic sur le bouton soit géré en premier
  
          // Empêcher la propagation du clic sur le bouton trigger pour éviter la fermeture immédiate
          triggerButton.off('click').on('click', function(event) {
            event.stopPropagation(); // Empêche la propagation du clic vers l'écouteur du document
          });
  
        } else {
          // Si le menu est caché, retirer l'écouteur du document
          $(document).off('click.menuOutside');
        }
      }
    }

    editPost(post_uid, event) {
      event.preventDefault();
      event.stopPropagation();
      // Rediriger vers la page d'édition avec l'UID du post
      window.location.href = this.url('forum', { action: 'create_or_edit_post'}) + "&_uid=" + post_uid;
    }

    deletePost(post_uid, event) {
      debugger;
      event.preventDefault();
      event.stopPropagation();
  
      // Demander confirmation à l'utilisateur avant de supprimer
      const confirmation = confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?');
      if (!confirmation) return; // Arrêter la fonction si l'utilisateur annule
  
      // Envoi d'une requête HTTP pour supprimer le post
      this.http_internal_post({
          task: 'forum',
          action: 'delete_post',
          params: {
              _uid: post_uid,
          },
          processData: false,
          contentType: false,
          on_success: (response) => {
            debugger;
              const parsedResponse = JSON.parse(response);
  
              if (parsedResponse.status === 'success') {
                  // Affichage du message de succès
                  BnumMessage.DisplayMessage(
                      parsedResponse.message || 'Le post a été supprimé avec succès.',
                      eMessageType.Confirmation
                  );
  
                  // Supprimer l'article de l'affichage
                  const postElement = $('#post-' + post_uid);
                  if (postElement.length > 0) {
                      postElement.remove(); // Supprimer l'article du DOM
                  }
              } else {
                  // Affichage du message d'erreur en cas d'échec
                  BnumMessage.DisplayMessage(
                      parsedResponse.message || 'Erreur lors de la suppression du post.',
                      eMessageType.Error
                  );
              }
          },
          on_error: (err) => {
              // Affichage du message d'erreur en cas de problème avec la requête
              BnumMessage.DisplayMessage(
                  'Erreur lors de la tentative de suppression du post.',
                  eMessageType.Error
              );
          }
      });
    }

    displayPosts() {
        const posts = this.get_env('posts_data');
        let post;
        let data;
        for (let postId in posts) {
            post = posts[postId];
            data = {
                POST_LINK: post.post_link,
                POST_CREATOR: post.post_creator,
                POST_DATE: post.creation_date,
                UID: post.uid,
                POST_TITLE: post.title,
                POST_SUMMARY: post.summary,
                POST_IMAGE: "lentilles",
                POST_COUNT_REACTION: post.reaction,
                POST_THUMB_UP: post.like_count,
                POST_THUMB_DOWN: post.like_count,
                POST_COMMENTS: post.comment_count,
                POST_FAVORITE: 
                    MelHtml.start.tag('i',{id: 'favorite-'+post.uid, class:`favorite material-symbols-outlined ${post.favorite ? 'filled' : ''}`}).text('star_border').end().generate_html({}),
            };

            let template = new MelTemplate()
            .setTemplateSelector('#post_template')
            .setData(data)
            .addEvent('#favorite-'+post.uid, 'click', this.addToFavorite.bind(this, post.uid))
            .addEvent('#more-'+post.uid, 'click', this.toggleMenuPost.bind(this, post.uid))
            .addEvent('.post-options-button.edit-post', 'click', this.editPost.bind(this, post.uid)) // Ajout du gestionnaire pour "Modifier l'article"
            .addEvent('.post-options-button.delete-post', 'click', this.deletePost.bind(this, post.uid)) // Ajout du gestionnaire pour "Modifier l'article"
            //.addEvent(balise, action, fonction)

            $('#post-area').append(...template.render());

            for (let tag in post.tags) {
                let tag_data = {
                    TAG_NAME: '#' + post.tags[tag],
                }
            let tag_template = new MelTemplate()
            .setTemplateSelector('#tag_template')
            .setData(tag_data);
            $('#tag-area-'+post.uid).append(...tag_template.render());
            }

        }
    }

    
}