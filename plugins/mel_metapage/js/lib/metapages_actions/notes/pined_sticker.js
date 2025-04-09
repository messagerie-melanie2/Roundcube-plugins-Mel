import { Point } from '../../mel_maths.js';
import { Sticker } from './sticker.js';

/**
 * Classe représentant un sticker épinglé (PinSticker).
 * Hérite de la classe Sticker.
 */
export class PinSticker extends Sticker {
  /**
   * Constructeur de la classe PinSticker.
   * @param {string} uid - Identifiant unique du sticker.
   * @param {number} order - Ordre du sticker.
   * @param {string} title - Titre du sticker.
   * @param {string} text - Texte du sticker.
   * @param {string} color - Couleur de fond du sticker.
   * @param {string} text_color - Couleur du texte du sticker.
   * @param {number|null} [height=null] - Hauteur du sticker (optionnelle).
   */
  constructor(uid, order, title, text, color, text_color, height = null) {
    super(`pin-${uid}`, order, title, text, color, text_color, true);
    this.pos = Point.Zero(); // Position initiale du sticker (par défaut à zéro).
    this.height = height;
  }

  /**
   * Génère le HTML du sticker épinglé.
   * @param {Object} options - Options pour la génération.
   * @param {Point|null} [options.pos=null] - Position du sticker (optionnelle).
   * @returns {jQuery} Élément HTML généré.
   */
  generate({ pos = null }) {
    if (!pos) pos = Point.Zero();

    let $generated = $(super.html());

    // Ajout des classes et styles spécifiques au sticker épinglé.
    $generated
      .addClass('pined')
      .appendTo($('body'))
      .css('position', 'absolute')
      .css('top', `${pos.y}px`)
      .css('left', `${pos.x}px`)
      .css('z-index', 2);

    let $table = $generated.find('.takb').parent().parent();

    // Suppression des boutons inutiles pour un sticker épinglé.
    $generated.find('.eye').parent().remove();
    $generated.find('.pb').parent().remove();
    $generated.find('.db').parent().remove();

    // Modification des boutons pour les adapter au sticker épinglé.
    $generated
      .find('.downb')
      .removeClass('downb')
      .addClass('moveb')
      .css('border-radius', 0)
      .css('border-top-left-radius', '5px')
      .appendTo($('<td></td>').prependTo($table));
    $generated
      .find('.takb')
      .css('border-radius', 0)
      .css('border-top-right-radius', '5px')
      .parent()
      .appendTo($table);
    $generated.find('.note-header-params').remove();

    this.pos = pos;

    return $generated;
  }

  /**
   * Retourne le HTML du sticker sous forme de chaîne.
   * @param {boolean} [hidden=false] - Indique si le sticker doit être caché.
   * @returns {string} HTML du sticker.
   */
  html(hidden = false) {
    let $generated = this.generate({});

    if (hidden) $generated.css('display', 'none');

    return $generated[0].outerHTML;
  }

  /**
   * Crée une instance de PinSticker à partir d'un objet Sticker.
   * @param {Sticker} sticker - Instance de la classe Sticker.
   * @returns {PinSticker} Instance de PinSticker.
   */
  static fromSticker(sticker) {
    return new PinSticker(
      sticker.uid,
      sticker.order,
      sticker.title,
      sticker.text,
      sticker.color,
      sticker.textcolor,
      sticker.height,
    );
  }

  /**
   * Définit les gestionnaires d'événements pour le sticker.
   */
  set_handlers() {
    super.set_handlers();

    let $element = this.get_html();

    let droped;
    let init_pos;
    let $move = $element
      .find('.moveb')
      .attr('draggable', true)
      .removeClass('disabled')
      .removeAttr('disabled');

    // Gestionnaire pour le début du drag (déplacement).
    $move[0].addEventListener('dragstart', (ev) => {
      if (Sticker.lock) {
        ev.preventDefault();
        rcmail.display_message('Une action est déjà en cours !');
        return;
      }
      ev.dataTransfer.dropEffect = 'move';

      droped = false;
      init_pos = this.pos;

      var img = new Image();
      img.src = '';
      ev.dataTransfer.setDragImage(img, 10, 10);

      ev.dataTransfer.setData('text/plain', this.uid);

      if ($('.drag-zone').length > 0) $('.drag-zone').remove();

      let $drag = $('<div class="drag-zone"></div>').appendTo($('body'));
      $drag[0].addEventListener('dragover', (ev) => {
        ev.preventDefault();

        // Mise à jour de la position pendant le drag.
        this.update_pos(new Point(ev.clientX, ev.clientY));
      });

      $drag[0].addEventListener('drop', (ev) => {
        ev.preventDefault();

        console.log('ev', ev);
        droped = true;
      });
    });

    // Gestionnaire pour la fin du drag.
    $move[0].addEventListener('dragend', (ev) => {
      console.log('evend', ev);

      if (!droped) {
        // Si le drag est annulé, revenir à la position initiale.
        this.update_pos(init_pos);
      } else {
        // Si le drag est validé, envoyer les nouvelles coordonnées au serveur.
        this.post(
          'pin_move',
          {
            _uid: this.uid.replace('pin-', ''),
            _x: this.pos.x,
            _y: this.pos.y,
            _initX: window.outerWidth,
          },
          true,
        );
        rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].pin_pos = [
          this.pos.x,
          this.pos.y,
        ];
        rcmail.env.mel_metapages_notes[
          this.uid.replace('pin-', '')
        ].pin_pos_init = [window.outerWidth];
      }

      if ($('.drag-zone').length > 0) $('.drag-zone').remove();

      droped = null;
      init_pos = null;
    });
  }

  /**
   * Met à jour la position du sticker.
   * @param {Point} pos - Nouvelle position du sticker.
   * @returns {PinSticker} Instance actuelle pour chaînage.
   */
  update_pos(pos) {
    this.pos = pos;

    let $element = this.get_html();

    if ($element.length > 0) {
      $element.css('top', `${pos.y}px`).css('left', `${pos.x}px`);
    }

    return this;
  }
}
