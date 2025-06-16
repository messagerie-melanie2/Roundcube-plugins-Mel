import { MelEnumerable } from '../../classes/enum.js';
import { MelHtml } from '../../html/JsHtml/MelHtml.js';
import { MaterialSymbolHtml } from '../../html/html_icon.js';
import { MelObject } from '../../mel_object.js';

/**
 * Trouve le parent d'un élément HTML en fonction d'une condition.
 * @param {Object} node Élément HTML de départ.
 * @param {Function} cond Fonction conditionnelle pour identifier le parent.
 * @returns {Object|boolean} Le parent trouvé ou `false` si aucun parent ne correspond.
 */
function find_parent(node, cond) {
  while (!cond(node) || node[0].nodeName === 'BODY') {
    node = node.parent();
  }

  return node[0].nodeName === 'BODY' ? false : node;
}

/**
 * Convertit une couleur RGB en format hexadécimal.
 * @param {string} rgb Couleur au format RGB.
 * @returns {string} Couleur au format hexadécimal.
 */
function string_rgb_to_hex(rgb) {
  if (rgb.includes('(')) {
    rgb = rgb.split('(');
    rgb = rgb[1].replace(')', '');
    rgb = rgb.split(',');

    let hex = '#';

    for (const iterator of rgb) {
      hex += componentToHex(+iterator);
    }

    rgb = hex;
  }

  return rgb;
}

/**
 * Étend la classe MelHtml pour ajouter un bouton spécifique aux notes.
 * @param {Object} attribs Attributs HTML pour le bouton.
 * @returns {Object} Instance de MelHtml avec le bouton configuré.
 */
MelHtml.extend('button_note', function (attribs = {}) {
  return this.button(attribs)
    .addClass(MaterialSymbolHtml.get_class_fill_on_hover())
    .addClass('bckg')
    .addClass('true')
    .css({
      border: 'none!important',
      'border-radius': '0px!important',
      transition: 'none',
    })
    .attr('onmouseenter', function (e) {
      e = $(e.currentTarget);

      let parent = find_parent(e, (x) => x.hasClass('mel-note'));

      if (!parent) throw new Error('Unable to found parent !');

      const note_color = string_rgb_to_hex(parent.attr('data-textcolor'));
      const bckg_color = string_rgb_to_hex(e.css('background-color'));
      const color = mel_metapage.Functions.colors.kMel_extractRGB(note_color);
      const background =
        mel_metapage.Functions.colors.kMel_extractRGB(bckg_color);

      if (
        !mel_metapage.Functions.colors.kMel_LuminanceRatioAAA(color, background)
      ) {
        e.css('color', invertColor(note_color, true));
      }
    })
    .attr('onmouseleave', function (e) {
      e = $(e.currentTarget);
      let parent = find_parent(e, (x) => x.hasClass('mel-note'));

      if (!parent) throw new Error('Unable to found parent !');

      const note_color = string_rgb_to_hex(parent.attr('data-textcolor'));

      e.css('color', note_color);
    });
});

/**
 * Texte du plugin utilisé pour la localisation avec `rcmail.gettext`.
 * @type {string}
 */
const plugin_text = 'mel_metapage';

/**
 * Couleur d'arrière-plan par défaut des notes.
 * @type {string}
 */
const base_color = '#E6B905';

/**
 * Couleur de texte par défaut des notes.
 * @type {string}
 */
const base_text_color = '#000000';

/**
 * Identifiant par défaut lorsqu'il n'y a pas de notes.
 * @type {string}
 */
export const default_note_uid = 'create';

/**
 * Convertit une valeur décimale en hexadécimal.
 * @param {number} c Valeur décimale.
 * @returns {string} Valeur hexadécimale.
 */
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

/**
 * Convertit une couleur RGB en hexadécimal.
 * @param {number} r Composante rouge.
 * @param {number} g Composante verte.
 * @param {number} b Composante bleue.
 * @returns {string} Couleur au format hexadécimal.
 */
function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Ajoute des zéros à gauche d'une chaîne pour atteindre une longueur donnée.
 * @param {string} str Chaîne à compléter.
 * @param {number} len Longueur souhaitée.
 * @returns {string} Chaîne complétée.
 */
function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

/**
 * Inverse une couleur hexadécimale.
 * @param {string} hex Couleur au format hexadécimal.
 * @param {boolean} bw Si vrai, retourne noir ou blanc en fonction de la luminosité.
 * @returns {string} Couleur inversée.
 */
function invertColor(hex, bw) {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  if (bw) {
    // https://stackoverflow.com/a/3943023/112731
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }
  // invert color components
  r = (255 - r).toString(16);
  g = (255 - g).toString(16);
  b = (255 - b).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
}

/**
 * Classe représentant une note (Sticker) avec ses propriétés et comportements.
 */
export class Sticker {
  /**
   * Initialise une nouvelle instance de Sticker.
   * @param {string} uid Identifiant unique de la note.
   * @param {number} order Ordre de la note.
   * @param {string} title Titre de la note.
   * @param {string} text Contenu de la note.
   * @param {string} color Couleur de fond de la note.
   * @param {string} text_color Couleur du texte de la note.
   * @param {boolean} tak Indique si la note est épinglée.
   */
  constructor(
    uid,
    order,
    title,
    text,
    color = base_color,
    text_color = base_text_color,
    tak = false,
  ) {
    this.uid = uid;
    this.order = +order;
    this.title = title;
    this.text = text;
    this.color = color;
    this.textcolor = text_color;
    this.pin = tak;

    if (typeof this.pin === 'string') this.pin = this.pin === 'true';
  }

  /**
   * Génère le HTML de la note.
   * @param {boolean} hidden Si vrai, la note sera masquée.
   * @returns {Object} HTML généré.
   */
  html(hidden = false) {
    const generate_style = () => {
      let html = `background-color:${this.color};color:${this.textcolor};`;

      if (hidden) html += 'display:none;';

      return html;
    };

    //prettier-ignore
    const html_js = MelHtml.start
        .div({ class:'mel-note', style:generate_style(), id:`note-${this.uid}` }).attrs(this.get_datas())
            .div({ class:'note-header' })
                .table()
                    .tr()
                        .td()
                            .button_note(this._generate_buttons_attributes('takb', 'Afficher sur le Bnum', {})).css('border-radius', '5px 0 0 0!important')
                                .icon('push_pin').end()
                                .sr()
                                    .text('Afficher sur le Bnum - Affiche la note en avant plan sur le bureau numérique. Cela permet d\'avoir toujours la note en visu.')
                                .end('sr')
                            .end('epingler')
                        .end('td')
                        .td().css('width', '100%')
                            .input_text({ class:'change mel-focus', title: 'Titre de la note', 'aria-describedby': this.uid, value: this.title }).css({ width: '100%', 'background-color': this.color, 'color': this.textcolor })
                        .end('td 100%')
                        .td()
                            .button_note(this._generate_buttons_attributes('pb', rcmail.gettext('settings', plugin_text), {}))
                                .icon('more_horiz').end()
                                .sr()
                                    .text(`${plugin_text}.settings`)
                                .end('sr')
                            .end('paramètres')
                        .end('td')
                        .td()
                            .button_note(this._generate_buttons_attributes('db danger', rcmail.gettext('delete'), {})).css('border-radius', '0 5px 0 0!important')
                                .icon('delete_forever').end()
                                .sr()
                                    .text('delete')
                                .end('sr')
                            .end('Supprimer')
                        .end('td')
                    .end('tr')
                .end('table')
            .end('div')
            .div({ class:'note-header-params' }).css('display', 'none')
                .input_color(`title="${rcmail.gettext('change_background_color', plugin_text)}" aria-describedby="${this.uid}" class="change bcgcolor" value="${this.color === base_color ? this.color : rgbToHex(...Enumerable.from(this.color.replace('!important', '').replace('rgb', '').replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"`).removeClass('form-control').removeClass('input-mel').css('max-width', '32px')
                .input_color(`title="${rcmail.gettext('change_text_color', plugin_text)}" aria-describedby="${this.uid}" class="change txtcolor" value="${this.textcolor === base_text_color ? this.textcolor : rgbToHex(...Enumerable.from(this.textcolor.replace('rgb', '').replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"`).removeClass('form-control').removeClass('input-mel').css('max-width', '32px')
                .button_note(this._generate_buttons_attributes('bb', rcmail.gettext('quit_settings', plugin_text), {})).css('float', 'right').css('border-radius', '0 5px 0 0!important')
                    .icon('arrow_back').end()
                    .sr()
                        .text(`${plugin_text}.quit_settings`)
                    .end('sr')
                .end('retour')
                .button_note(this._generate_buttons_attributes('downb', rcmail.gettext('move', plugin_text), {})).css('float', 'right')
                    .icon('drag_pan').end()
                    .sr()
                        .text(`${plugin_text}.move`)
                    .end('sr')
                .end('Déplacer')
                .button_note(this._generate_buttons_attributes('rsb', 'Réinitialiser la taille de la note', {})).css('float', 'right')
                    .icon('fullscreen_exit').end()
                    .sr()
                        .text('Réinitialiser la taille de la note')
                    .end('sr')
                .end('Taille')
                .button_note(this._generate_buttons_attributes('pipette', 'Récupérer la couleur d\'une autre note', {})).css('float', 'right')
                    .icon('colorize').end()
                    .sr()
                        .text('Récupérer la couleur d\'une autre note')
                    .end('sr')
                .end('Taille')
            .end('params')
            .div({ class:'note-body' })
                .textarea({ rows:5, title:'Ecrivez vos notes dans ce champ', class:'change', style:`width:100%;background-color:${this.color};color:${this.textcolor};${(this.height ? `height:${this.height}px;` : '')}` })
                    .text(this.text)
                .end()
            .end()
        .end();
    return html_js.generate();
  }

  /**
   * Génère les attributs pour les boutons de la note.
   * @param {string} button_class Classe CSS du bouton.
   * @param {string} title Titre du bouton.
   * @param {Object} options Options supplémentaires.
   * @returns {Object} Attributs du bouton.
   */
  _generate_buttons_attributes(
    button_class,
    title,
    { additionnal_style = '' },
  ) {
    return {
      title,
      'aria-describedby': this.uid,
      class: `${MaterialSymbolHtml.get_class_fill_on_hover()} mel-button no-button-margin bckg true ${button_class}`,
      style: `color:${this.textcolor};${additionnal_style}`,
    };
  }

  /**
   * Récupère l'élément HTML associé à la note.
   * @returns {Object} Élément HTML jQuery.
   */
  get_html() {
    return $(`.mel-note#note-${this.uid}`);
  }

  /**
   * Définit les gestionnaires d'événements pour la note.
   * @returns {Sticker} Instance actuelle pour le chaînage.
   */
  set_handlers() {
    let $element = this.get_html();

    $element
      .on('mousedown', () => {
        this._tmp_height = $element.find('textarea').height();
      })
      .on('mouseup', () => {
        const th = $element.find('textarea').height();
        if (th !== this._tmp_height) {
          this.post_height_updated(th);
        }

        delete this._tmp_height;
      });

    $element.find('button.rsb').click(() => {
      $element.find('textarea').css('height', '');
      if (this.uid !== default_note_uid) this.post_height_updated(-1);
    });

    $element.find('button.pipette').click((e) => {
      document.body.classList.add('mel-metapage-pipette');
      $element
        .find('button.pipette')
        .addClass('active')
        .css('background-color', 'lightgreen')
        .css('pointer-events', 'none');

      Sticker.pipette = true;

      e.stopPropagation();
    });

    //Handler pour le bouton créer
    $element.find('button.nb').click(async () => {
      if (rcmail.busy === true) return;

      rcmail.set_busy(true, 'loading');
      $element
        .find('.change')
        .addClass('disabled')
        .attr('disabled', 'disabled');

      if (this.uid === default_note_uid) await this.post_add();

      let sticker = Sticker.fromHtml(this.uid);
      sticker.text = '';
      sticker.title = '';
      await sticker.post_add();

      rcmail.set_busy(false);
      $element.find('.change').removeClass('disabled').removeAttr('disabled');
      rcmail.clear_messages();
      rcmail.display_message(
        rcmail.gettext('note_created_success', plugin_text),
        'confirmation',
      );
    });

    if (this.pin)
      $element
        .find('.takb')
        .find('.material-symbols-outlined')
        .css('font-variation-settings', "'FILL' 1");

    $element.find('.takb').click(async () => {
      let $item = this.uid.includes('pin-')
        ? Sticker.fromHtml(this.uid.replace('pin-', '')).get_html()
        : [];

      this.pin = !this.pin;
      rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].pin =
        this.pin;

      if (this.pin) {
        $element
          .find('.takb')
          .find('.material-symbols-outlined')
          .css('font-variation-settings', "'FILL' 1");
        if ($item.length > 0)
          $item
            .find('.takb')
            .find('.material-symbols-outlined')
            .css('font-variation-settings', "'FILL' 1");
      } else {
        $element
          .find('.takb')
          .find('.material-symbols-outlined')
          .css('font-variation-settings', '');
        if ($item.length > 0)
          $item
            .find('.takb')
            .find('.material-symbols-outlined')
            .css('font-variation-settings', '');
      }

      await this.post('pin', {
        _uid: this.uid.replace('pin-', ''),
        _pin: this.pin,
      });

      Sticker.helper.trigger_event('notes.apps.tak', this);
    });

    $element.find('button.eye').click((e) => {
      e = $(e.currentTarget);
      if (!e.hasClass('crossed')) {
        $('.mel-note').css('display', 'none');
        $element.css('display', '');
        $('.mm-shortcuts.apps .square_div').css('display', 'none');
        $('.shortcut-notes')
          .css('display', '')
          .css('max-width', '100%')
          .css('width', '100%')
          .css('margin', '0 20%');
        $('.fullscreen-item-flex').css('display', 'block');
        $('.nb').addClass('disabled').attr('disabled', 'disabled');
        $('.downb').css('display', 'none');
        $('.upb').css('display', 'none');
        e.addClass('crossed')
          .find('.material-symbols-outlined')
          .html('visibility_off');
        this.get_html().addClass('eye-focus');
      } else {
        $('.mel-note').css('display', '');
        $('.mm-shortcuts.apps .square_div').css('display', '');
        $('.shortcut-notes')
          .css('display', '')
          .css('max-width', '')
          .css('width', '')
          .css('margin', '');
        $('.fullscreen-item-flex').css('display', 'flex');
        $('.nb').removeClass('disabled').removeAttr('disabled');
        $('.downb').css('display', '');
        $('.upb').css('display', '');
        e.removeClass('crossed')
          .find('.material-symbols-outlined')
          .html('visibility');
        this.get_html().removeClass('eye-focus');
      }
    });

    //Handler pour le bouton paramètre
    $element.find('button.pb').click(() => {
      $element.css('width', $element.width() + 'px');
      $element.find('.note-header').css('display', 'none');
      $element.find('.note-header-params').css('display', '');
    });

    //Handler pour le bouton retour
    $element.find('button.bb').click(() => {
      $element.find('.note-header').css('display', '');
      $element.find('.note-header-params').css('display', 'none');
      $element.css('width', '');
    });

    //Handler pour le bouton supprimer
    $element.find('button.db').click(async () => {
      if (rcmail.busy === true) return;

      if (
        confirm(
          MelObject.Empty().gettext('note-delete-warning', 'mel_metapage'),
        ) === false
      )
        return;

      if (this.uid === default_note_uid) {
        rcmail.display_message(
          rcmail.gettext('note_reinit_success', plugin_text),
          'confirmation',
        );
        return;
      }

      rcmail.set_busy(true, 'loading');
      $element
        .find('.change')
        .addClass('disabled')
        .attr('disabled', 'disabled');

      await this.post_delete();

      rcmail.set_busy(false);
      $element.find('.change').removeClass('disabled').removeAttr('disabled');
      rcmail.clear_messages();
      rcmail.display_message(
        rcmail.gettext('note_deleted_success', plugin_text),
        'confirmation',
      );
    });

    //Handler pour les modifications
    $element.find('.change').on('change', async () => {
      const isCreate = this.uid === default_note_uid;
      if (isCreate) {
        if (rcmail.busy === true) return;

        rcmail.set_busy(true, 'loading');
        $element
          .find('.change')
          .addClass('disabled')
          .attr('disabled', 'disabled');
      }

      $element.css('color', $element.find('input.txtcolor').val()); //bcgcolor
      $element.css('background-color', $element.find('input.bcgcolor').val());

      $element
        .find('.note-header input')
        .css('color', $element.find('input.txtcolor').val())
        .css('background-color', $element.find('input.bcgcolor').val());

      $element
        .find('textarea')
        .css('color', $element.find('input.txtcolor').val())
        .css('background-color', $element.find('input.bcgcolor').val());

      $element
        .find('button')
        .css('color', $element.find('input.txtcolor').val());

      this.title = $element.find('.note-header input').val();
      this.text = $element.find('textarea').val();
      this.color = $element.css('background-color');
      this.textcolor = $element.css('color');

      $element.attr('data-textcolor', this.textcolor);

      await this.post_update();

      if (isCreate) {
        rcmail.set_busy(false);
        $element.find('.change').removeClass('disabled').removeAttr('disabled');
        rcmail.clear_messages();
        rcmail.display_message(
          rcmail.gettext('note_created_success', plugin_text),
          'confirmation',
        );
      } else {
        Sticker.helper
          .rcmail()
          .display_message('Note sauvegardée avec succès !', 'confirmation');
      }
    });

    let $down = $element.find('.downb');

    //Handler pour le bouton "descendre"
    if ($down.length > 0) {
      $down.attr('draggable', true)[0].addEventListener('dragstart', (ev) => {
        if (Sticker.lock) {
          ev.preventDefault();
          rcmail.display_message('Une action est déjà en cours !');
          return;
        }
        ev.dataTransfer.dropEffect = 'move';

        var img = new Image();
        img.src =
          window.location.origin +
          window.location.pathname +
          'plugins/mel_metapage/skins/sticker.png';
        ev.dataTransfer.setDragImage(img, 10, 10);

        ev.dataTransfer.setData('text/plain', this.uid);
      });

      $down[0].addEventListener('dragend', (ev) => {
        $('.mel-note.dragover')
          .removeClass('dragover')
          .removeClass('dragover-right')
          .removeClass('dragover-left');
      });
    }

    return this;
  }

  /**
   * Récupère les données de la note sous forme d'attributs HTML.
   * @returns {Object} Attributs HTML.
   */
  get_datas() {
    return {
      id: `note-${this.uid}`,
      'data-textcolor': this.textcolor,
      'data-order': this.order,
      'data-pin': this.pin,
    };
  }

  /**
   * Ajoute une nouvelle note.
   * @returns {Promise<any>} Résultat de l'appel AJAX.
   */
  post_add() {
    return this.post('add', { _raw: this });
  }

  async drop(uid, new_order) {
    await this.post('drag_move', { _uid: uid, _order: new_order });
  }

  /**
   * Change l'ordre de la note par rapport à une autre note
   * @param {string} uid Id de la note
   * @param {number} order Nouvel ordre de la note
   * @param {Sticker} other Autre note
   */
  async _post_move(uid, order, other) {
    //On change l'ordre de la note
    await this.post('move', { _uid: uid, _order: order });
    //puis de l'autre note
    await other.post('move', { _uid: other.uid, _order: other.order });
    //Puis on récupère tout pour éviter les bugs
    await this.post('get');
  }

  /**
   * Descend la note
   * @param {string} $uid Id de l'autre note
   * @returns Ajax
   */
  post_move_down($uid) {
    this.order += 1;
    let other = Sticker.fromHtml($uid);
    other.order -= 1;
    return this._post_move(this.uid, this.order, other);
  }
  /**
   * Monte la note
   * @param {string} $uid Id de l'autre note
   * @returns Ajax
   */
  post_move_up($uid) {
    this.order -= 1;
    let other = Sticker.fromHtml($uid);
    other.order += 1;
    return this._post_move(this.uid, this.order, other);
  }

  /**
   * Supprime la note
   * @returns {Promise<any>|null} Ajax
   */
  async post_delete() {
    if (this.uid === default_note_uid) return;

    if (this.get_html().find('.icon-mel-eye-crossed').length > 0) {
      this.get_html().find('.eye').click();
    }

    await this.post('pin', {
      _uid: this.uid,
      _pin: false,
    });

    this.pin = false;

    Sticker.helper.trigger_event('notes.apps.tak', this);

    return await this.post('del', { _uid: this.uid });
  }

  /**
   * Met à jour la hauteur de la note.
   * @param {number} newHeight Nouvelle hauteur.
   * @returns {Promise<any>} Résultat de l'appel AJAX.
   */
  post_height_updated(newHeight) {
    if (this.uid === default_note_uid) return;

    return this.post('update_height', {
      _uid: this.uid,
      _height: newHeight,
    });
  }

  /**
   * Met à jour les données de la note.
   * @returns {Promise<void>} Résultat de l'appel AJAX.
   */
  async post_update() {
    if (this.uid === default_note_uid) {
      await this.post_add();
    } else {
      await this.post(
        'update',
        {
          _uid: this.uid,
          _raw: this,
        },
        true,
        false,
      );
      rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].text =
        this.text;
    }
  }

  /**
   * Effectue une action sur le serveur.
   * @param {string} action Nom de l'action.
   * @param {Object} params Paramètres de l'action.
   * @param {boolean} doAction Si faux, la fonction de réussite ne sera pas appelée.
   * @param {boolean} lock Si vrai, verrouille l'action.
   * @returns {Promise<any>} Résultat de l'appel AJAX.
   */
  async post(action, params = {}, doAction = true, lock = true) {
    if (lock && !!Sticker.lock) {
      rcmail.display_message('Une action est déjà en cours !');
      return;
    }

    if (lock) Sticker.lock = rcmail.set_busy(true, 'loading');
    params['_a'] = action;

    const pin =
      !!params['_uid'] &&
      (params['_uid'].includes('pin-') || this.uid.includes('pin-'));

    if (!!params['_uid'] && params['_uid'].includes('pin-'))
      params['_uid'] = params['_uid'].replace('pin-', '');

    if (action === 'pin') {
      Sticker.helper.trigger_event('notes.apps.start-pin', true);
    }

    await Sticker.helper.http_internal_post({
      params,
      task: 'mel_metapage',
      action: 'notes',
      on_success: (datas) => {
        if (datas !== 'break' && doAction) {
          rcmail.env.mel_metapages_notes = JSON.parse(datas);

          if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0) {
            rcmail.env.mel_metapages_notes = {};
            rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker(
              'create',
              0,
              '',
              '',
            );
          }

          Sticker.helper.trigger_event(
            'notes.apps.updated',
            rcmail.env.mel_metapages_notes,
          );

          if (action !== 'get' && action !== 'add')
            Sticker.helper
              .rcmail()
              .display_message(
                'Note sauvegardée avec succès !',
                'confirmation',
              );
        } else {
          rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].text =
            this.text;
          rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].title =
            this.title;

          if (pin) {
            Sticker.helper.trigger_event(
              'notes.apps.updated',
              rcmail.env.mel_metapages_notes,
            );
          } else {
            for (const key in this) {
              if (Object.hasOwnProperty.call(this, key)) {
                const element = this[key];
                rcmail.env.mel_metapages_notes[this.uid][key] = element;
              }
            }
            Sticker.helper.trigger_event(
              'notes.apps.updated.breaked',
              rcmail.env.mel_metapages_notes,
            );
          }
        }
      },
    });

    if (lock) {
      rcmail.set_busy(false, 'loading', Sticker.lock);
      Sticker.lock = null;
    }
  }

  /**
   * Crée une note à partir d'un objet existant.
   * @param {Object} element Objet contenant les propriétés d'une note.
   * @returns {Sticker} Nouvelle instance de Sticker.
   */
  static from(element) {
    let s = new Sticker(
      element.uid,
      element.order,
      element.title,
      element.text,
      element.color,
      element.textcolor,
      element.pin ?? false,
    );

    if (element.height) s.height = element.height;

    return s;
  }

  /**
   * Crée une note à partir d'un élément HTML.
   * @param {string} uid Identifiant de la note.
   * @returns {Sticker} Nouvelle instance de Sticker.
   */
  static fromHtml(uid) {
    let $element = $(`.mel-note#note-${uid}`);
    return new Sticker(
      uid,
      $element.data('order'),
      $element.find('input').val(),
      $element.find('textarea').val(),
      $element.css('background-color'),
      $element.css('color'),
      $element.data('pin'),
    );
  }

  /**
   * Trouve une note par son ordre.
   * @param {number} order Ordre de la note.
   * @returns {Sticker} Instance de Sticker trouvée.
   */
  static findByOrder(order) {
    let id = $(`.mel-note[data-order=${order}]`).attr('id');
    return Sticker.fromHtml(
      id === undefined ? undefined : id.replace('note-', ''),
    );
  }

  /**
   * Crée une nouvelle note vide.
   * @returns {Promise<void>} Résultat de l'appel AJAX.
   */
  static async new() {
    await new Sticker('', -1, '', '').post_add();
  }
}

// Gestionnaire pour les helpers temporaires.
let helper = null;
let timeout = null;
Object.defineProperties(Sticker, {
  helper: {
    get: () => {
      if (!helper) helper = MelObject.Empty();

      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        helper = null;
        timeout = null;
      }, 5000);

      return helper;
    },
    configurable: true,
  },
});

/**
 * Vérifie et convertit une couleur en format hexadécimal si nécessaire.
 * Si la couleur est la couleur de base, elle est retournée telle quelle.
 * Si la couleur est au format RGB, elle est convertie en hexadécimal.
 * Sinon, la couleur est retournée telle quelle.
 * @param {string} color Couleur à vérifier et convertir.
 * @returns {string} Couleur au format hexadécimal ou inchangée.
 */
function checkColor(color) {
  return color === base_color
    ? base_color
    : color.includes('rgb')
      ? rgbToHex(
          ...MelEnumerable.from(
            color
              .replace('!important', '')
              .replace('rgb', '')
              .replace('a', '')
              .replace('(', '')
              .replace(')', '')
              .split(','),
          )
            .select((x) => parseInt(x))
            .toArray(),
        )
      : color;
}

document.addEventListener('click', (e) => {
  // Gestion du mode pipette pour récupérer la couleur d'une autre note
  if (Sticker.pipette) {
    let parent = e.target;

    // Remonte dans le DOM jusqu'à trouver un parent avec la classe 'mel-note'
    while (
      parent &&
      !parent.classList.contains('mel-note') &&
      parent.nodeName !== 'HTML'
    ) {
      parent = parent.parentElement;
    }

    // Si un élément note est trouvé, on récupère ses couleurs
    if (parent.classList.contains('mel-note')) {
      const color = parent.style.backgroundColor;
      const text_color = parent.style.color;

      if (color && text_color) {
        // Trouve le bouton pipette actif dans la note courante
        const pipette = document.querySelector('.mel-note .pipette.active');

        if (pipette) {
          const parentElement = pipette.parentElement;
          // Récupère les inputs de couleur de fond et de texte
          const inputColor = parentElement.querySelector('.bckg');
          const inputTextColor = parentElement.querySelector('.txtcolor');

          // Applique les couleurs récupérées et déclenche l'événement de changement
          inputColor.value = checkColor(color);
          inputTextColor.value = checkColor(text_color);
          inputTextColor.dispatchEvent(new Event('change', { bubbles: true }));
          inputColor.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Réinitialise l'état visuel de tous les boutons pipette
    for (const btn of document.querySelectorAll('.mel-note .pipette')) {
      btn.style.backgroundColor = null;
      btn.style.pointerEvents = null;
      btn.classList.remove('active');
    }

    // Retire la classe pipette du body pour sortir du mode pipette
    document.body.classList.remove('mel-metapage-pipette');

    // Désactive le mode pipette
    Sticker.pipette = false;
  }
});
