/**
 * Pages des libellés de signature : recherche dans la liste, boutons et confirmations.
 */
(() => {
  'use strict';

  /**
   * Cache les libellés qui ne correspondent pas à la recherche et met le compteur à jour.
   * @param {HTMLElement & { value: string }} search Champ de recherche
   */
  function filterList(search) {
    const value = (search.value || '').trim().toLowerCase();
    const noResult = document.getElementById('signature-titles-no-result');
    const count = document.getElementById('signature-titles-count');
    const list = document.querySelector('.signature-titles-list');
    let visible = 0;

    document.querySelectorAll('.signature-titles-list li').forEach((item) => {
      item.hidden = value !== '' && !(item.dataset.label || '').includes(value);

      if (!item.hidden) {
        visible++;
      }
    });

    // Remplace $count par le nombre de libellés affichés
    if (count && count.dataset.template) {
      count.textContent = count.dataset.template.replace('$count', String(visible));
    }

    // Rien trouvé : on cache la liste et on affiche « Aucun résultat »
    if (list) {
      list.hidden = visible === 0;
    }

    if (noResult) {
      noResult.hidden = visible > 0;
    }
  }

  /**
   * Envoie le formulaire du bouton.
   * @param {HTMLElement} button Bouton cliqué
   */
  function submitFromButton(button) {
    const form = button.dataset.form
      ? document.getElementById(button.dataset.form)
      : button.closest('form');

    form?.requestSubmit();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('signature-titles-filter');

    if (search) {
      search.addEventListener('input', () => filterList(search));
      search.addEventListener('bnum-input-search:clear', () => filterList(search));

      // Échap vide aussi la recherche
      search.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && search.value !== '') {
          event.preventDefault();
          search.value = '';
          filterList(search);
        }
      });

      // Le navigateur a pu garder une recherche (retour arrière) : on filtre tout de suite
      filterList(search);
    }

    document.querySelectorAll('[data-submit]').forEach((button) => {
      button.addEventListener('click', () => submitFromButton(button));
    });

    // Demande confirmation avant de supprimer
    document.querySelectorAll('form[data-confirm]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        if (!window.confirm(form.dataset.confirm)) {
          event.preventDefault();
        }
      });
    });
  });
})();
