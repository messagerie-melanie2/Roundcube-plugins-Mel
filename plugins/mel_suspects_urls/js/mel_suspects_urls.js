(() => {
  let currentPage = 1;
  const rowsPerPage = 10;
  let allUrlsList = [];
  let filteredUrlsList = [];

  /**
   * Réinitialise la liste filtrée avec une copie de la liste complète
   * @returns {void}
   */
  function reinitFilteredUrls() {
    filteredUrlsList = [...allUrlsList];
  }

  // Écouteurs d'événements de réponses AJAX
  rcmail.addEventListener(
    'plugin.mel_suspects_urls_urls_data',
    function (response) {
      if (response.success) {
        allUrlsList = response.data;
        reinitFilteredUrls();
        updateSuspectUI();
      } else {
        console.error('Erreur lors du chargement des URLs :', response.message);
        rcmail.display_message(
          response.message || rcmail.gettext('load_error', 'mel_suspects_urls'),
          'error',
        );
      }
    },
  );

  rcmail.addEventListener(
    'plugin.mel_suspects_urls_update_status_response',
    function (response) {
      if (response.success) {
        rcmail.display_message(
          rcmail.gettext('status_updated_successfully', 'mel_suspects_urls'),
          'confirmation',
        );
      } else {
        rcmail.display_message(
          response.message ||
            rcmail.gettext('status_updated_error', 'mel_suspects_urls'),
          'error',
        );
      }
    },
  );

  rcmail.addEventListener(
    'plugin.mel_suspects_urls_add_url_response',
    function (response) {
      if (response.success) {
        const input = document.getElementById('suspect-input');

        if (input) input.value = '';
        fetchUrlsFromBackend();
        rcmail.display_message(
          rcmail.gettext('url_added_successfully', 'mel_suspects_urls'),
          'confirmation',
        );
      } else {
        rcmail.display_message(
          response.message ||
            rcmail.gettext('url_add_error', 'mel_suspects_urls'),
          'error',
        );
      }
    },
  );

  rcmail.addEventListener(
    'plugin.mel_suspects_urls_delete_url_response',
    function (response) {
      if (response.success) {
        fetchUrlsFromBackend();
        rcmail.display_message(
          rcmail.gettext('url_deleted_successfully', 'mel_suspects_urls'),
          'confirmation',
        );
      } else {
        rcmail.display_message(
          response.message ||
            rcmail.gettext('url_delete_error', 'mel_suspects_urls'),
          'error',
        );
      }
    },
  );

  /**
   * Fonction exécutée au chargement de la page
   * Initialise l'interface utilisateur
   */
  window.addEventListener('load', async function () {
    await initSuspectUI();
  });

  /**
   * Envoie une requête AJAX au backend pour récupérer les URLs suspectes.
   *
   * Cette fonction utilise l'API `rcmail.http_post` pour appeler l'action
   * `suspect_urls/get_all_urls`, qui déclenche la méthode PHP `get_all_urls`.
   *
   * La réponse attendue est ensuite traitée via un gestionnaire d'événement
   * (ex. : `plugin.mel_suspects_urls_urls_data`) enregistré côté client.
   *
   * @function
   * @returns {void}
   */
  function fetchUrlsFromBackend() {
    rcmail.http_post('suspect_urls/get_all_urls', {});
  }

  /**
   * Initialise l'interface utilisateur pour la gestion des URLs suspectes
   * Configure les écouteurs d'événements pour l'input, le bouton clear et le bouton add
   * @returns {Promise<void>}
   */
  async function initSuspectUI() {
    const input = document.getElementById('suspect-input');
    const clearBtn = document.getElementById('clear-button');
    const addBtn = document.getElementById('suspect-add-btn');

    // Charger les URLs depuis le backend
    fetchUrlsFromBackend();

    // Afficher / masquer le bouton de suppression
    input.addEventListener('input', () => {
      clearBtn.style.display = input.value.trim() ? 'block' : 'none';

      const searchTerm = input.value.trim().toLowerCase();

      if (searchTerm) {
        filteredUrlsList = allUrlsList.filter((item) =>
          item.url.toLowerCase().includes(searchTerm),
        );
      } else {
        filteredUrlsList = [...allUrlsList];
      }
      currentPage = 1;
      updateSuspectUI();
    });

    // Ajout avec la touche Entrée
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addBtn.click();
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();

      filteredUrlsList = [...allUrlsList];
      currentPage = 1;
      updateSuspectUI();
    });

    addBtn.addEventListener('click', () => {
      const value = input.value.trim();

      if (!value) return;

      const alreadyExists = filteredUrlsList.some(
        (item) => item.url.toLowerCase() === value.toLowerCase(),
      );

      if (alreadyExists) {
        rcmail.display_message(
          rcmail.gettext('url_already_exist', 'mel_suspects_urls'),
          'error',
        );
        return;
      }

      addBtn.setLoadingMode();
      rcmail
        .http_post('suspect_urls/add_suspect_url', { _url: value })
        .then(() => addBtn.stopLoadingMode());
    });
  }

  /**
   * Met à jour l'interface utilisateur avec la liste des URLs
   * Gère l'affichage paginé et les interactions
   * @returns {void}
   */
  function updateSuspectUI(url_id, statut) {
    const tbody = document.getElementById('suspect-table-body');

    if (!tbody) return;

    tbody.innerHTML = ''; // Réinitialisation

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentItems = filteredUrlsList.slice(startIndex, endIndex);

    currentItems.forEach((item) => {
      const tr = document.createElement('tr');

      // Colonne URL
      const urlTd = document.createElement('td');
      urlTd.textContent = escapeHTML(item.url);

      // Colonne Statut (select)
      const statutTd = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'statut-select';

      // Options avec 0 = suspecte, 1 = bloquée
      const options = [
        { value: 0, label: rcmail.gettext('mel_suspects_urls.suspect') },
        { value: 1, label: rcmail.gettext('mel_suspects_urls.blocked') },
      ];

      for (const opt of options) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;

        if (item.statut == opt.value) {
          option.selected = true;
        }
        select.appendChild(option);
      }

      // Met à jour le statut dans le backend à chaque changement
      select.addEventListener('change', async (e) => {
        try {
          await rcmail.http_post('suspect_urls/update_url_status', {
            _url_id: item.url_id,
            _statut: e.target.value,
          });

          // Mettre à jour localement
          item.statut = parseInt(e.target.value);

          rcmail.display_message(
            rcmail.gettext('status_updated_successfully', 'mel_suspects_urls'),
            'confirmation',
          );
        } catch (error) {
          console.error('Erreur:', error);
          rcmail.display_message(
            rcmail.gettext('status_updated_error', 'mel_suspects_urls'),
            'error',
          );
          // Revenir à l'ancienne valeur
          select.value = item.statut;
        }
      });

      statutTd.appendChild(select);

      // Colonne Supprimer
      const deleteTd = document.createElement('td');
      deleteTd.className = 'delete-url';
      const deleteBtn = document
        .getElementById('su-custom-elements')
        .content.querySelector('#base-template-button')
        .cloneNode(true);

      deleteBtn.removeAttribute('id');

      deleteBtn.addEventListener('click', async () => {
        if (!confirm(rcmail.gettext('mel_suspects_urls.confirm_url_deletion')))
          return;

        try {
          deleteBtn.setLoadingMode();
          await rcmail.http_post('suspect_urls/delete_suspect_url', {
            _url_id: item.url_id,
          });

          if (deleteBtn && deleteBtn.stopLoadingMode)
            deleteBtn.stopLoadingMode();

          fetchUrlsFromBackend();

          // Si on supprime le dernier élément d'une page, on recule d'une page si possible
          if (
            (currentPage - 1) * rowsPerPage >= filteredUrlsList.length &&
            currentPage > 1
          ) {
            --currentPage;
          }
          updateSuspectUI();

          rcmail.display_message(
            rcmail.gettext('url_deleted_successfully', 'mel_suspects_urls'),
            'confirmation',
          );
        } catch (error) {
          console.error('Erreur:', error);
          rcmail.display_message(
            rcmail.gettext('url_delete_error', 'mel_suspects_urls'),
            'error',
          );
        }
      });

      deleteTd.appendChild(deleteBtn);

      // Ajouter les colonnes à la ligne
      tr.appendChild(urlTd);
      tr.appendChild(statutTd);
      tr.appendChild(deleteTd);

      tbody.appendChild(tr);
    });

    renderPaginationControls();
  }

  /**
   * Affiche les contrôles de pagination
   * Gère la navigation entre les pages et l'affichage des numéros de page
   * @returns {void}
   */
  function renderPaginationControls() {
    let paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.id = 'pagination-controls';
      paginationContainer.className = 'pagination-container mt-3';
      document.querySelector('.urls-list').appendChild(paginationContainer);
    }

    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(filteredUrlsList.length / rowsPerPage);

    // Cacher la pagination si une seule page ou aucun résultat
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    } else {
      paginationContainer.style.display = 'block';
    }

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const isFirstPage = currentPage === 1;

    // Bouton précédent
    const prevLi = document.createElement('li');
    prevLi.className = 'page-item' + (isFirstPage ? ' disabled' : '');
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-link';
    prevBtn.innerHTML =
      '<span class="material-symbols-outlined">chevron_left</span>';
    prevBtn.disabled = isFirstPage;

    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        --currentPage;
        updateSuspectUI();
      }
    });
    prevLi.appendChild(prevBtn);
    ul.appendChild(prevLi);

    // Numéros de page et ellipses
    const addPageBtn = (page) => {
      const li = document.createElement('li');
      li.className = 'page-item' + (page === currentPage ? ' active' : '');
      const btn = document.createElement('button');
      btn.className = 'page-link';
      btn.textContent = page;

      btn.addEventListener('click', () => {
        currentPage = page;
        updateSuspectUI();
      });

      li.appendChild(btn);
      ul.appendChild(li);
    };

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        addPageBtn(i);
      }
    } else {
      // Toujours afficher le numéro de la 1ère page
      addPageBtn(1);

      // Ellipses avant la page courante
      if (currentPage > 3) {
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = '<span class="page-link">…</span>';
        ul.appendChild(li);
      }

      // Pages autour de la page courante
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        addPageBtn(i);
      }

      // Ellipses après la page courante
      if (currentPage < totalPages - 2) {
        const li = document.createElement('li');
        li.className = 'page-item disabled';
        li.innerHTML = '<span class="page-link">…</span>';
        ul.appendChild(li);
      }

      // Toujours afficher le numéro de la dernière page
      addPageBtn(totalPages);
    }

    const isLastPage = currentPage === totalPages;

    // Bouton suivant
    const nextLi = document.createElement('li');
    nextLi.className = 'page-item' + (isLastPage ? ' disabled' : '');
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-link';
    nextBtn.innerHTML =
      '<span class="material-symbols-outlined">chevron_right</span>';
    nextBtn.disabled = isLastPage;

    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        ++currentPage;
        updateSuspectUI();
      }
    });

    nextLi.appendChild(nextBtn);
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
  }

  /**
   * Échappe les caractères HTML dans une chaîne pour prévenir les attaques XSS
   * @param {string} str - La chaîne à échapper
   * @returns {string} La chaîne échappée
   */
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      }[m];
    });
  }
})();
