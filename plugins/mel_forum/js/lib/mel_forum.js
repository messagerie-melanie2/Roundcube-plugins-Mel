$(document).ready(function() {
    let config = rcmail.env.editor_config;
    rcmail.editor_init(config, 'forum-content');

    $('#forum-button-add').on('click', () => {
        window.location.href = this.url('forum', {action:'create_or_edit_post'});
    });

    $('#submit-post').on('click', () => {
        console.log(tinyMCE.activeEditor.getContent());        
    });

    // URL de l'API PHP pour les posts
    const postsApiUrl = 'https://roundcube.ida.melanie2.i2/?_task=forum&_action=show_all_posts_byworkspace';
    // URL de l'API PHP pour les tags
    const tagsApiUrl = 'https://roundcube.ida.melanie2.i2/?_task=forum&_action=show_all_tags_bypost';

    // Fonction pour récupérer les posts via AJAX
    function loadPosts() {
        $.ajax({
            url: postsApiUrl,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    const posts = response.tags;
                    
                    if (posts.length > 0) {
                        // Afficher les détails du premier post (exemple)
                        const post = posts[0];

                        $('#title').text(post.title);
                        $('#creator').text(post.user_uid); // A remplacer par le nom et le prénom du user
                        $('#date').text(post.created);
                        $('#summary').text(post.summary);

                        // Charger les tags pour ce post
                        loadTags(post.id);
                    } else {
                        console.log('Aucun post trouvé.');
                    }
                } else {
                    console.error('Erreur lors du chargement des posts:', response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Erreur AJAX:', error);
            }
        });
    }

    // Fonction pour récupérer les tags via AJAX
    function loadTags(postId) {
        $.ajax({
            url: tagsApiUrl,
            method: 'POST',
            data: { _uid: postId },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    const tags = response.tags;
                    const tagsContainer = $('#tags-container');
                    tagsContainer.empty(); // Effacer les tags existants

                    tags.forEach(tag => {
                        const tagElement = document.createElement('span');
                        tagElement.className = 'tag';
                        tagElement.textContent = tag;
                        tagsContainer.appendChild(tagElement);
                      });
                } else {
                    console.error('Erreur lors du chargement des tags:', response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Erreur AJAX:', error);
            }
        });
    }

    // Charger les posts lorsque le document est prêt
    // loadPosts();
});
