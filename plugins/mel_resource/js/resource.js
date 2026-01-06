(() => {
  let currentPage = 1;
  const rowsPerPage = 10;
  let allResourcesList = [];
  let filteredResourcesList = [];
  
  /**
   * Réinitialise la liste filtrée avec une copie de la liste complète
   * @returns {void}
   */
  function reinitFilteredResources() {
    filteredResourcesList = [...allResourcesList];
  }

  // -- Écouteurs d'événements de réponses AJAX

  // Chargement des vrooms
  rcmail.addEventListener(
    'plugin.mel_vroom_vrooms_data',
    function (response) {
      if (response.success) {
        allResourcesList = response.data;
        reinitFilteredResources();
        updateResourcesUI();
      } else {
        console.error('Erreur lors du chargement des Ressources :', response.error);
        rcmail.display_message(
          response.error || rcmail.gettext('load_error', 'mel_resource'),
          'error',
        );
      }
    },
  );

  // Ajout d'un partage de calendrier
  rcmail.addEventListener(
    'plugin.mel_vroom_add_calendar_share',
    function (response) {
      if (response.success) {
        const label = response.group ? 'share_group_added' : 'share_added';
        rcmail.display_message(
          rcmail.get_label(label, 'mel_resource', { name: response.data.displayname, type: rcmail.get_label('mel_resource.vroom_calendar_share_' + response.data.share) }),
          'confirmation'
        );

        if (response.group) {
          rcmail.env.vroom_calendar_group_shares.push(response.data);
          rcmail.env.vroom_calendar_group_shares.sort((a,b) => (a.displayname > b.displayname) ? 1 : ((b.displayname > a.displayname) ? -1 : 0));
          refreshSharesGroupList();
        }
        else {
          rcmail.env.vroom_calendar_shares.push(response.data);
          rcmail.env.vroom_calendar_shares.sort((a,b) => (a.displayname > b.displayname) ? 1 : ((b.displayname > a.displayname) ? -1 : 0));
          refreshSharesList();
        }
        
      } else {
        console.error('Erreur lors de l\'ajout du partage au calendrier :', response.error);
        rcmail.display_message(
          response.error || rcmail.gettext('add_acl_error', 'mel_resource'),
          'error',
        );
      }
    },
  );

  // Suppression d'un partage de calendrier
  rcmail.addEventListener(
    'plugin.mel_vroom_delete_calendar_share',
    function (response) {
      if (response.success) {
        const label = response.group ? 'share_group_deleted' : 'share_deleted';
        rcmail.display_message(
          rcmail.get_label(label, 'mel_resource', { name: response.data.user }),
          'confirmation'
        );

        if (response.group) {
          rcmail.env.vroom_calendar_group_shares = rcmail.env.vroom_calendar_group_shares.filter((obj) => {
            return obj.user !== response.data.user;
          });
          refreshSharesGroupList();
        }
        else {
          rcmail.env.vroom_calendar_shares = rcmail.env.vroom_calendar_shares.filter((obj) => {
            return obj.user !== response.data.user;
          });
          refreshSharesList();
        }
      } else {
        console.error('Erreur lors de la suppression du partage au calendrier :', response.error);
        rcmail.display_message(
          response.error || rcmail.gettext('add_acl_error', 'mel_resource'),
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
    if (this.document.querySelector('.resources-list')) {
      await initResourcesUI();
    }
    else if (this.document.querySelector('.resource-create')) {
      await initCreateResourceUI();
    }
    else {
      await initResourceUI();
    }
  });

  /**
   * Envoie une requête AJAX au backend pour récupérer les ressources.
   *
   * Cette fonction utilise l'API `rcmail.http_post` pour appeler l'action
   * `settings/get_all_vrooms`, qui déclenche la méthode PHP `get_all_vrooms`.
   *
   * La réponse attendue est ensuite traitée via un gestionnaire d'événement
   * (ex. : `plugin.mel_vroom_vrooms_data`) enregistré côté client.
   *
   * @function
   * @returns {void}
   */
  function fetchResourcesFromBackend() {

    const busy = rcmail.set_busy(true, 'loading');

    rcmail.http_post('settings/plugin.mel_resource', { _act: 'get_all_vrooms' })
      .then(() => {
        rcmail.set_busy(false, 'loading', busy);
      });
  }

  /**
   * Initialise l'interface utilisateur pour la gestion des ressources
   * Configure les écouteurs d'événements pour l'input, le bouton clear et le bouton add
   * @returns {Promise<void>}
   */
  async function initResourcesUI() {
    const input = document.getElementById('resource-input');
    const clearBtn = document.getElementById('clear-button');
    const addBtn = document.getElementById('resource-add-btn');

    // Charger les ressources depuis le backend
    fetchResourcesFromBackend();

    // Afficher / masquer le bouton de suppression
    input?.addEventListener('input', () => {
      clearBtn.style.display = input.value.trim() ? 'block' : 'none';

      const searchTerm = input.value.trim().toLowerCase();

      if (searchTerm) {
        filteredResourcesList = allResourcesList.filter((item) =>
          item.name.toLowerCase().includes(searchTerm) || item.building.toLowerCase().includes(searchTerm),
        );
      } else {
        filteredResourcesList = [...allResourcesList];
      }
      currentPage = 1;
      updateResourcesUI();
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();

      filteredResourcesList = [...allResourcesList];
      currentPage = 1;
      updateResourcesUI();
    });

    addBtn?.addEventListener('click', () => {
      rcmail.location_href(
        rcmail.url('plugin.mel_resource', '_act=create&_is_from=iframe')
        , window, true);
    });
  }

  /**
   * Initialise l'interface utilisateur pour la gestion d'une ressource
   * Configure les écouteurs d'événements pour le bouton backBtn
   * @returns {Promise<void>}
   */
  async function initCreateResourceUI() {
    // Retour à la liste des ressources
    document.getElementById('resource-back-btn')?.addEventListener('click', () => {
      rcmail.location_href(
        rcmail.url('plugin.mel_resource', '_is_from=iframe'),
        window,
        true,
      );
    });
  }

  /**
   * Initialise l'interface utilisateur pour la gestion d'une ressource
   * Configure les écouteurs d'événements pour le bouton backBtn
   * @returns {Promise<void>}
   */
  async function initResourceUI() {

    // Retour à la liste des ressources
    document.getElementById('resource-back-btn')?.addEventListener('click', () => {
      rcmail.location_href(
        rcmail.url('plugin.mel_resource', '_is_from=iframe'),
        window,
        true,
      );
    });

    // Ajouter une caractéristique
    document.getElementById('caracteristique-add-btn')?.addEventListener('click', () => {
      const selectedValue = document.getElementById('rcmvroomcaracteristiqueselect').value;

      if (selectedValue && !rcmail.env.vroom_caracteristiques[selectedValue]) {
        rcmail.env.vroom_caracteristiques[selectedValue] = true;
        refreshCaracteristiquesList();
      }
    });

    // Ajout d'un partage d'agenda
    document.getElementById('calendar-share-add-btn')?.addEventListener('click', () => {
      const input = document.getElementById('calendar-share-input');
      const values = input.value.split(', ').filter(i => i);
      const type = document.getElementById('calendar-share-select').value;

      for (const value of values) {
        rcmail.http_post('settings/plugin.mel_resource', {
          _act: 'add_calendar_share',
          _group: false,
          _user: value,
          _acl: type,
          _resource_uid: rcmail.env.vroom_uid,
        }, rcmail.set_busy(true, 'loading'));
      }

      // Réinitialiser l'input
      input.value = '';
    });

    // Ajout d'un partage d'agenda vers un groupe
    document.getElementById('calendar-group-share-add-btn')?.addEventListener('click', () => {
      const input = document.getElementById('calendar-group-share-input');
      const values = input.value.split(', ').filter(i => i);
      const type = document.getElementById('calendar-group-share-select').value;

      for (const value of values) {
        rcmail.http_post('settings/plugin.mel_resource', {
          _act: 'add_calendar_share',
          _group: true,
          _user: value,
          _acl: type,
          _resource_uid: rcmail.env.vroom_uid,
        }, rcmail.set_busy(true, 'loading'));
      }

      // Réinitialiser l'input
      input.value = '';
    });

    // Enter sur l'input de partage
    document.getElementById('calendar-share-input')?.addEventListener('keydown', (e) => {
      if (document.getElementById('calendar-share-input').getAttribute('aria-expanded') === 'true') return; // Ignorer si le menu déroulant est ouvert
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('calendar-share-add-btn').click();
      }
    });

    // Enter sur l'input de partage vers les groupes
    document.getElementById('calendar-group-share-input')?.addEventListener('keydown', (e) => {
      if (document.getElementById('calendar-group-share-input').getAttribute('aria-expanded') === 'true') return; // Ignorer si le menu déroulant est ouvert
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('calendar-group-share-add-btn').click();
      }
    });

    if (Object.keys(rcmail.env.vroom_caracteristiques).length) {
      refreshCaracteristiquesList();
    }

    if (rcmail.env.vroom_calendar_shares.length) {
      refreshSharesList();
    }

    if (rcmail.env.vroom_calendar_group_shares.length) {
      refreshSharesGroupList();
    }

    // Init autocomplète sur les partages d'agenda
    rcmail.init_address_input_events($('#calendar-share-input'), {
      action: 'settings/plugin.acl-autocomplete',
    });

    // Init autocomplète sur les partages d'agenda vers les groupes
    rcmail.init_address_input_events($('#calendar-group-share-input'), {
      action: 'settings/plugin.acl-autocomplete-group',
    });
  }

  /**
   * Met à jour la liste des caractéristiques dans l'interface utilisateur
   */
  function refreshCaracteristiquesList() {
    const caracteristiquesList = document.querySelector('table#vroom_caracteristiques tbody');
    caracteristiquesList.innerHTML = '';
    let values = Object.keys(rcmail.env.vroom_caracteristiques);

    if (values === 0) {
      const tr = document.createElement('tr'),
            td = createTd(rcmail.gettext('no_caracteristique', 'mel_resource'), 'col-6');
      tr.appendChild(td);
      tr.colSpan = '2';
      tr.className = 'no_caracteristique';
      caracteristiquesList.appendChild(tr);
    }
    else {
      values.sort();
      let i = 0;
      values.forEach((caracteristique) => {
        const tr = document.createElement('tr'),
              td = createTd('', 'col-4'),
              input = document.createElement('input');
  
        input.type = 'text';
        input.className = 'form-control';
        input.name = 'vroom_caracteristiques[' + i++ + ']';
        input.value = caracteristique;
        input.readOnly = true;
  
        td.appendChild(input);
        tr.appendChild(td);

        // Colonne Supprimer
        const delTd = createTd('', 'col-2'), 
              delBtn = document
                          .getElementById('su-custom-elements')
                          .content.querySelector('#base-template-button')
                          .cloneNode(true);
  
        delBtn.removeAttribute('id');
  
        delBtn.addEventListener('click', async () => {
          delete rcmail.env.vroom_caracteristiques[caracteristique];
          refreshCaracteristiquesList();
        });
  
        delTd.appendChild(delBtn);
        tr.appendChild(delTd);
        
        caracteristiquesList.appendChild(tr);
      });
    }

    resetCaracteristiqueSelect();
  }

  /**
   * Réinitialise le select des caractéristiques additionnelles
   */
  function resetCaracteristiqueSelect() {
    const select = document.getElementById('rcmvroomcaracteristiqueselect');
    select.innerHTML = '';

    rcmail.env.vroom_additionnal_caracteristiques.forEach((caracteristique) => {
      if (!rcmail.env.vroom_caracteristiques[caracteristique]) {
        const option = document.createElement('option');
        option.value = caracteristique;
        option.textContent = caracteristique;
        select.appendChild(option);
      }
    });

    select.selectedIndex = 0;
  }

  /**
   * Met à jour la liste des partages d'agenda dans l'interface utilisateur
   */
  function refreshSharesList() {
    const sharesList = document.querySelector('table#vroom_calendar_shares tbody');
    sharesList.innerHTML = '';

    if (rcmail.env.vroom_calendar_shares.length === 0) {
      const tr = document.createElement('tr'),
            td = createTd(rcmail.gettext('vroom_no_calendar_share', 'mel_resource'));
      td.colSpan = 3;
      tr.appendChild(td);
      tr.className = 'no_calendar_share';
      sharesList.appendChild(tr);
    }
    else {
      rcmail.env.vroom_calendar_shares.forEach((share) => {
        const tr = document.createElement('tr');
  
        tr.appendChild(createTd(share.displayname, 'col-5'));
        tr.appendChild(createTd(share.share_label, 'col-2'));
  
        // Colonne Supprimer
        const delTd = createTd('', 'col-2'), 
              delBtn = document
                          .getElementById('su-custom-elements')
                          .content.querySelector('#base-template-button')
                          .cloneNode(true);
  
        delBtn.removeAttribute('id');
  
        delBtn.addEventListener('click', async () => {
          if (confirm(rcmail.gettext('confirm_delete_share', 'mel_resource', { name: share.displayname }))) {
            rcmail.http_post('settings/plugin.mel_resource', {
              _act: 'delete_calendar_share',
              _group: false,
              _user: share.user,
              _resource_uid: rcmail.env.vroom_uid,
            }, rcmail.set_busy(true, 'loading'));
          }
        });
  
        delTd.appendChild(delBtn);
        tr.appendChild(delTd);
        
        sharesList.appendChild(tr);
      });
    }
  }

  /**
   * Met à jour la liste des partages d'agenda vers les groupes dans l'interface utilisateur
   */
  function refreshSharesGroupList() {
    const sharesList = document.querySelector('table#vroom_calendar_group_shares tbody');
    sharesList.innerHTML = '';

    if (rcmail.env.vroom_calendar_group_shares.length === 0) {
      const tr = document.createElement('tr'),
            td = createTd(rcmail.gettext('vroom_no_calendar_group_share', 'mel_resource'));
      td.colSpan = 3;
      tr.appendChild(td);
      tr.className = 'no_calendar_share';
      sharesList.appendChild(tr);
    }
    else {
      rcmail.env.vroom_calendar_group_shares.forEach((share) => {
        const tr = document.createElement('tr');
  
        tr.appendChild(createTd(share.displayname, 'col-5'));
        tr.appendChild(createTd(share.share_label, 'col-2'));
  
        // Colonne Supprimer
        const delTd = createTd('', 'col-2'), 
              delBtn = document
                          .getElementById('su-custom-elements')
                          .content.querySelector('#base-template-button')
                          .cloneNode(true);
  
        delBtn.removeAttribute('id');
  
        delBtn.addEventListener('click', async () => {
          if (confirm(rcmail.gettext('confirm_delete_group_share', 'mel_resource', { name: share.displayname }))) {
            rcmail.http_post('settings/plugin.mel_resource', {
              _act: 'delete_calendar_share',
              _group: true,
              _user: share.user,
              _resource_uid: rcmail.env.vroom_uid,
            }, rcmail.set_busy(true, 'loading'));
          }
        });
  
        delTd.appendChild(delBtn);
        tr.appendChild(delTd);
        
        sharesList.appendChild(tr);
      });
    }    
  }

  /**
   * Met à jour l'interface utilisateur avec la liste des ressources
   * Gère l'affichage paginé et les interactions
   * @returns {void}
   */
  function updateResourcesUI() {
    const tbody = document.getElementById('resource-table-body');

    if (!tbody) return;

    tbody.innerHTML = ''; // Réinitialisation

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentItems = filteredResourcesList.slice(startIndex, endIndex);

    currentItems.forEach((item) => {
      const tr = document.createElement('tr');

      // Resource infos
      tr.appendChild(createTd(escapeHTML(item.name)));
      tr.appendChild(createTd(escapeHTML(item.building)));
      tr.appendChild(createTd(escapeHTML(item.room)));
      tr.appendChild(createTd(escapeHTML(item.capacity)));

      // Colonne Supprimer
      const showTd = createTd('', 'show-resource'), 
            showBtn = document
                        .getElementById('su-custom-elements')
                        .content.querySelector('#base-template-button')
                        .cloneNode(true);

      showBtn.removeAttribute('id');

      showBtn.addEventListener('click', async () => {
        rcmail.location_href(
          rcmail.url('plugin.mel_resource', '_act=show&_is_from=iframe&_resource_uid=' + encodeURI(item.uid))
          , window, true);
      });

      showTd.appendChild(showBtn);
      tr.appendChild(showTd);
      tbody.appendChild(tr);
    });

    renderPaginationControls();
  }

  /**
   * Permet de créer une cellule de tableau (td) avec le contenu texte spécifié
   * 
   * @param {string} textContent 
   * @param {string} className
   * @returns 
   */
  function createTd(textContent, className) {
    const td = document.createElement('td');
    td.textContent = textContent;
    if (className) {
      td.className = className;
    }
    return td;
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
      document.querySelector('.resources-list').appendChild(paginationContainer);
    }

    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(filteredResourcesList.length / rowsPerPage);

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
        updateResourcesUI();
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
        updateResourcesUI();
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
        updateResourcesUI();
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
