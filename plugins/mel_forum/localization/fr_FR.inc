<?php
$labels = array();
$labels['my_news'] = "M'informer";
$labels['news'] = "Informations";
$labels['my_strings_of_news'] = "Mes fils d'informations";
$labels['modified'] = "Modifié le";
$labels['created'] = "Publié le";
$labels['no_news'] = "Pas d'information pour le moment.";
$labels['information'] = "Information";
$labels['Sunday'] = 'Dimanche';
$labels['Monday'] = 'Lundi';
$labels['Tuesday'] = 'Mardi';
$labels['Wednesday'] = 'Mercredi';
$labels['Thursday'] = 'Jeudi';
$labels['Friday'] = 'Vendredi';
$labels['Saturday'] = 'Samedi';

$labels['January'] = 'Janvier';
$labels['February'] = 'Février';
$labels['March'] = 'Mars';
$labels['April'] = 'Avril';
$labels['May'] = 'Mai';
$labels['June'] = 'Juin';
$labels['July'] = 'Juillet';
$labels['August'] = 'Août';
$labels['September'] = 'Septembre';
$labels['October'] = 'Octobre';
$labels['November'] = 'Novembre';
$labels['December'] = 'Décembre';

$labels['date_asc'] = "Ancien au plus récent";
$labels['date_desc'] = "Récent au plus ancien";
$labels['site'] = "Site";
$labels['source'] = "Source";

$labels['tout'] = "A la suite";
$labels['un'] = "Vignette";
$labels['news_mode'] = "Mode des news";
$labels['news_start_nb_rows'] = "Lignes d'informations par défaut";

$labels["small"] = "Petit format";
$labels["large"] = "Grand format";

$labels["right_q"] = "Administrateur et publieur";
$labels["right_a"] = "Administrateur";
$labels["right_p"] = "Publieur";

$labels['create_new_comment'] = 'Création d\'un nouveau commentaire';

#region FORUM LABELS

$labels['workspace_news'] = 'Derniers articles';
$labels['edit_article'] = 'Modifier l\'article';
$labels['delete_article'] = 'Supprimer l\'article';
$labels['copy_article'] = 'Copier le lien de l\'article';
$labels['articles'] = 'Articles';
$labels['create_article'] = 'Créer un nouvel article';
$labels['admin_edit_only'] = 'Autoriser uniquement les administrateurs de l\'espace à modifier l\'article';
$labels['enable_comments'] = 'Autoriser la publication de commentaires';
$labels['cancel'] = 'Annuler';
$labels['save'] = 'Sauvegarder';
$labels['add'] = 'Ajouter';
$labels['respond'] = 'Répondre';
$labels['sort_by'] = 'Trier par : ';
$labels['newest'] = 'Plus récents';
$labels['oldest'] = 'Plus anciens';
$labels['more_comments'] = 'Plus de commentaires';
$labels['less_comments'] = 'Moins de commentaires';
$labels['more_reactions'] = 'Plus de réactions';
$labels['less_reactions'] = 'Moins de réactions';
$labels['more_responses'] = 'Plus de réponses';
$labels['display_fav_only'] = 'Afficher uniquement les favoris';
$labels['article_image'] = 'Image de l\'article';
$labels['like_action'] = 'J\'aime';
$labels['dislike_action'] = 'Je n\'aime pas';
$labels['comment_menu'] = 'Menu du commentaire';
$labels['edit_comment'] = 'Modifier le commentaire';
$labels['delete_comment'] = 'Supprimer le commentaire';
$labels['more_options'] = 'Plus d\'options';
$labels['no_post'] = 'Cet espace ne contient aucun article pour le moment.';

#region Message

$labels['fav_updated'] = 'Vos articles favoris ont été mis à jour';
$labels['error_editing'] = 'Erreur lors de la modification';
$labels['delete_comment_confirm'] = 'Êtes-vous sûr de vouloir supprimer ce commentaire ?';
$labels['delete_post_confirm'] = 'Êtes-vous sûr de vouloir supprimer cet article ?';
$labels['delete_post_success'] = 'Le post a été supprimé avec succès.';
$labels['delete_post_failure'] = 'Erreur lors de la suppression du post.';
$labels['creator_edit_only'] = 'Seul le créateur de cet article peut le modifier.';
$labels['creator_delete_only'] = 'Seul le créateur de cet article peut le supprimer.';
$labels['every_field_required'] = 'Tous les champs sont requis.';
$labels['article_created'] = 'Article créé avec succès.';
$labels['article_created_image_error'] = 'Article créé, mais échec de l\'enregistrement de certaines images.';
$labels['article_creation_error'] = 'Échec de création de l\'article.';
$labels['article_unfindable'] = 'Article introuvable.';
$labels['image_delete_failure'] = 'Echec de suppression de l\'image existante.';
$labels['image_save_failure'] = 'Echec de l\'enregistrement de l\'image: ';
$labels['article_updated'] = 'Article mis à jour avec succès.';
$labels['article_updated_image_error'] = 'Article mis à jour, mais échec de l\'enregistrement de certaines images.';
$labels['article_updated_error'] = 'Échec de mise à jour de l\'article.';
$labels['article_id_required'] = 'L\'identifiant de l\'article est requis.';
$labels['the_article'] = 'L\'article ';
$labels['has_been_deleted'] = ' a été supprimé avec succès.';

#region TAG

$labels['tag_created'] = 'Tag créé avec succès.';
$labels['tag_creation_failure'] = 'Echec de création du tag.';
$labels['no_tag_found'] = 'Aucun tag trouvé.';
$labels['tag_name_required'] = 'Le nom du tag est requis.';
$labels['tag_unfindable'] = 'Tag introuvable.';
$labels['tag_delete_error'] = 'Echec de suppression du tag ';
$labels['the_tag'] = 'Le tag ';
$labels['tag_associated_success'] = 'Tag associé au post avec succès.';
$labels['tag_associated_failure'] = 'Echec de l\'association du tag avec le post.';
$labels['tag_unassociated'] = 'Tag dissocié du post avec succès.';
$labels['tag_delete_failure'] = 'Echec de la suppression du tag lié au post.';

#region COMMENTS

$labels['comment_field_required'] = 'Le champ commentaire est requis.';
$labels['comment_creation_failed'] = 'Echec de création du commentaire.';
$labels['comment_creation'] = 'Commentaire créé avec succès.';
$labels['response_creation'] = 'Réponse créée avec succès.';
$labels['response_creation_failed'] = 'Echec de création de la réponse.';
$labels['comment_unfindable'] = 'Commentaire introuvable.';
$labels['cannot_edit_comment'] = 'Vous n\'êtes pas autorisé à modifier ce commentaire.';
$labels['cannot_delete_comment'] = 'Vous n\'êtes pas autorisé à supprimer ce commentaire.';
$labels['comment_updated'] = 'Commentaire mis à jour avec succès.';
$labels['comment_updated_failure'] = 'Echec de mise à jour du commentaire.';
$labels['comment_uid_required'] = 'L\'uid du commentaire est requis.';
$labels['comment_deleted'] = 'Le commentaire a été supprimé avec succès.';
$labels['comment_deleted_failure'] = 'Echec de suppression du commentaire.';
$labels['react_to_own_comment'] = 'Vous ne pouvez pas réagir à votre propre commentaire.';
$labels['unlike'] = 'Like annulé avec succès.';
$labels['like_to_dislike'] = 'Like annulé, dislike enregistré avec succès.';
$labels['failed_to_save...'] = 'Échec de l\'enregistrement du ';
$labels['...saved'] = ' enregistré avec succès.';
$labels['undislike'] = 'Dislike annulé avec succès.';
$labels['dislike_to_like'] = 'Dislike annulé, like enregistré avec succès.';

#region REACTIONS

$labels['reaction_creation'] = 'Réaction créée avec succès.';
$labels['reaction_creation_failure'] = 'Echec de création de la réaction.';
$labels['reaction_deleted'] = 'La réaction a été supprimée avec succès.';
$labels['reaction_deleted_failure'] = 'Echec de suppression de la réaction.';
$labels['no_reaction_found'] = 'Aucune réaction trouvée.';

#region IMAGES

$labels['failed_to_load_image'] = 'Echec du chargement de l\'image.';
$labels['image_field_required'] = 'Tous les champs sont requis.';

#region ERREUR

$labels['error'] = 'ERREUR';
$labels['error-access'] = 'Vous n\'avez pas accès à la ressource demandée';
$labels['return_to_workspaces_list'] = 'Retourner à la liste des espaces de travail';
