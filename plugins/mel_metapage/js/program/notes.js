(() => {

function notes()
{
    if (top.$('.mel-note').length > 0 || window !== top) return;

    if (rcmail.env.task === 'login' || rcmail.env.task === 'logout') return;

    /**
     * Plugin qui contient la localization pour rcmail.gettext
     */
    const plugin_text = 'mel_metapage';

    /**
     * Couleur d'arrière plan de base
     */
    const base_color = "#E6B905";
    /**
     * Couleur du texte de base
     */
    const base_text_color = "#000000";
    /**
     * Id par défaut lorsqu'il n'y a pas de notes
     */
    const default_note_uid = 'create';

    /**
     * Change une valeur en hexadécimal
     * @param {number} c Valeur décimale
     * @returns Valeur hexadécimal
     */
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    /**
     * Récupère la valeur hexadécimal d'un rgb.
     * @param {number} r Valeur rouge
     * @param {number} g Valeur vert
     * @param {number} b Valeur bleu
     * @returns Hexadécimal
     */
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    /**
     * @async Permet de créer une nouvelle note
     */
    window.create_note = async () => {
        //On ferme la popup global si il y en a une
        if (window.create_popUp !== undefined) window.create_popUp.close();

        //On ouvre "Mes raccourcis"
        $("#button-shortcut").click();
        rcmail.set_busy(true, "loading");
        
        //Si il n'y a pas de note côté stockage, on ajoute cellle par défaut
        if (rcmail.env.mel_metapages_notes[default_note_uid] !== undefined) await rcmail.env.mel_metapages_notes[default_note_uid].post_add();
        
        //On créer une nouvelle note
        new Sticker("", -1, "", "").post_add().then(() => {
            rcmail.set_busy(false);

            rcmail.clear_messages();
            rcmail.display_message(rcmail.gettext('note_created_success', plugin_text), "confirmation");
            $('.mel-note').last().find("textarea")[0].focus();
        });
    };

    /**
     * Représentation et fonctions utile d'une note
     */
    class Sticker
    {
        /**
         * 
         * @param {string} uid Id de la note
         * @param {number} order Ordre de la note 
         * @param {string} title Titre de la note
         * @param {string} text Contenu de la note 
         * @param {string} color Couleur de la note 
         * @param {string} text_color Couleur du texte de la note
         */
        constructor(uid, order, title, text, color = base_color, text_color = base_text_color)
        {
            this.uid = uid;
            this.order = order;
            this.title = title;
            this.text = text;
            this.color = color;
            this.textcolor = text_color;
        }

        /**
         * Convertit la classe en html
         * @returns html
         */
        html(hidden = false)
        {
            return `
            <div class="mel-note" style="background-color:${this.color};color:${this.textcolor};${hidden ? 'display:none;' : ''}" ${this.get_datas()}>
                <div class="note-header">
                    <table>
                    <tr>
                        <td><button title="${rcmail.gettext('new_n', plugin_text)}" class="mel-button no-button-margin bckg true nb" style="color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-left-radius:5px!important;"><span class="icon-mel-plus"></span></button></td>
                        <td style="width:100%"><input class="change mel-focus" type=text style="width:100%;background-color:${this.color};color:${this.textcolor}" value="${this.title}" /></td>
                        <td><button title="Se concentrer sur cette note" class="mel-button no-button-margin bckg true eye" style="color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-eye"></span></button></td>
                        <td><button title="${rcmail.gettext('settings', plugin_text)}" class="  mel-button no-button-margin bckg true pb" style="color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-dots"></span></button></td>
                        <td><button title="${rcmail.gettext('delete')}" class=" mel-button no-button-margin bckg true db" style="color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-right-radius:5px!important;"><span class="icon-mel-trash"></span></button></td>
                    </tr>
                    </table>
                </div>
                <div class="note-header-params" style="display:none">
                    <input title="${rcmail.gettext('change_background_color', plugin_text)}" class="change bcgcolor" type="color" value="${this.color === base_color ? this.color : rgbToHex(...Enumerable.from(this.color.replace('!important', '').replace('rgb', "").replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"/>
                    <input title="${rcmail.gettext('change_text_color', plugin_text)}" class="change txtcolor" type="color" value="${this.textcolor === base_text_color ? this.textcolor : rgbToHex(...Enumerable.from(this.textcolor.replace('rgb', "").replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"/>
                    <button title="${rcmail.gettext('quit_settings', plugin_text)}" class="  mel-button no-button-margin bckg true bb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-right-radius:5px!important;"><span class="icon-mel-undo"></span></button>
                    <button title="${rcmail.gettext('move_down', plugin_text)}" class=" mel-button no-button-margin bckg true downb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-chevron-down"></span></button>
                    <button title="${rcmail.gettext('move_up', plugin_text)}" class=" mel-button no-button-margin bckg true upb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-chevron-up"></span></button>
                    <button title="Réinitialiser la taille de la note" class="  mel-button no-button-margin bckg true rsb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-paragraph-extend"></span></button>
                </div>
                <div class="note-body">
                    <textarea rows="5" class="change" style="width:100%;background-color:${this.color};color:${this.textcolor};${(!!this.height ? `height:${this.height}px;` : '')}">${this.text}</textarea>
                </div>
            </div>
            `;
        }

        /**
         * Récupère l'élément lié à la note
         * @returns Jquery
         */
        get_html()
        {
            return $(`.mel-note#note-${this.uid}`);
        }

        /**
         * Défini le bon comportement de la note.
         * @returns Chaînage
         */
        set_handlers()
        {
            let $element = this.get_html();

            $element.on('mousedown', () => {
                this._tmp_height = $element.find('textarea').height();
            })
            .on('mouseup', () => {
                const th = $element.find('textarea').height();
                if (th !== this._tmp_height)
                {
                    this.post_height_updated(th);
                }

                delete this._tmp_height;
            }); 

            $element.find('button.rsb').click(() => {
                $element.find('textarea').css('height', '');
                if (this.uid !== default_note_uid) this.post_height_updated(-1);
            });

            //Handler pour le bouton créer
            $element.find("button.nb").click(async () => {

                if (rcmail.busy === true) return;

                rcmail.set_busy(true, "loading");
                $element.find(".change").addClass("disabled").attr("disabled", "disabled");
                //$element.find("textarea").addClass("disabled").attr("disabled", "disabled");

                if (this.uid === default_note_uid) await this.post_add();

                let sticker = Sticker.fromHtml(this.uid);
                sticker.text = "";
                sticker.title = "";
                await sticker.post_add();

                rcmail.set_busy(false);
                $element.find(".change").removeClass("disabled").removeAttr("disabled");
                //$element.find("textarea").removeClass("disabled").removeAttr("disabled");
                rcmail.clear_messages();
                rcmail.display_message(rcmail.gettext('note_created_success', plugin_text), "confirmation");
            });

            $element.find('button.eye').click((e) => {
                e = $(e.currentTarget);
                if (!e.hasClass('crossed'))
                {
                    $('.mel-note').css('display', 'none');
                    $element.css('display', '');
                    $('.mm-shortcuts.apps .square_div').css('display', 'none');
                    $('.shortcut-notes').css('display', '').css('max-width', '100%').css('width', '100%').css('margin','0 20%');
                    $('.fullscreen-item-flex').css('display', 'block');
                    $('.nb').addClass('disabled').attr('disabled', 'disabled');
                    $('.downb').css('display', 'none');
                    $('.upb').css('display', 'none');
                    e.addClass('crossed').find('.icon-mel-eye').removeClass('icon-mel-eye').addClass('icon-mel-eye-crossed');
                }
                else {
                    $('.mel-note').css('display', '');
                    $('.mm-shortcuts.apps .square_div').css('display', '');
                    $('.shortcut-notes').css('display', '').css('max-width', '').css('width', '').css('margin', '');
                    $('.fullscreen-item-flex').css('display', 'flex');
                    $('.nb').removeClass('disabled').removeAttr('disabled');
                    $('.downb').css('display', '');
                    $('.upb').css('display', '');
                    e.removeClass('crossed').find('.icon-mel-eye-crossed').addClass('icon-mel-eye').removeClass('icon-mel-eye-crossed');
                }


            });

            //Handler pour le bouton paramètre
            $element.find("button.pb").click(() => {
                $element.css("width", $element.width() + "px");
                $element.find(".note-header").css("display", "none");
                $element.find(".note-header-params").css("display", "");
            })

            //Handler pour le bouton retour
            $element.find("button.bb").click(() => {
                $element.find(".note-header").css("display", "");
                $element.find(".note-header-params").css("display", "none");
                $element.css("width", '');
            })

            //Handler pour le bouton supprimer
            $element.find("button.db").click(async () => {

                if (rcmail.busy === true) return;

                if (this.uid === default_note_uid)
                {
                    rcmail.display_message(rcmail.gettext('note_reinit_success', plugin_text), "confirmation");
                    return;
                }

                rcmail.set_busy(true, "loading");
                $element.find(".change").addClass("disabled").attr("disabled", "disabled");
                //$element.find("textarea").addClass("disabled").attr("disabled", "disabled");

                await this.post_delete();

                rcmail.set_busy(false);
                $element.find(".change").removeClass("disabled").removeAttr("disabled");
                //$element.find("textarea").removeClass("disabled").removeAttr("disabled");
                rcmail.clear_messages();
                rcmail.display_message(rcmail.gettext('note_deleted_success', plugin_text), "confirmation");
            });

            //Handler pour les modifications
            $element.find(".change").on('change', async () => {

                const isCreate = this.uid === default_note_uid;
                if (isCreate)
                {
                    if (rcmail.busy === true) return;

                    rcmail.set_busy(true, "loading");
                    $element.find(".change").addClass("disabled").attr("disabled", "disabled");
                }

                $element.css("color", $element.find("input.txtcolor").val());//bcgcolor
                $element.css("background-color", $element.find("input.bcgcolor").val());

                $element.find(".note-header input")
                .css("color", $element.find("input.txtcolor").val())
                .css("background-color", $element.find("input.bcgcolor").val());

                $element.find("textarea")
                .css("color", $element.find("input.txtcolor").val())
                .css("background-color", $element.find("input.bcgcolor").val());

                $element.find("button").css("color", $element.find("input.txtcolor").val());

                this.title = $element.find(".note-header input").val();
                this.text = $element.find("textarea").val();
                this.color =  $element.css("background-color");
                this.textcolor = $element.css("color");
                await this.post_update();

                if (isCreate)
                {
                    rcmail.set_busy(false);
                    $element.find(".change").removeClass("disabled").removeAttr("disabled");
                    rcmail.clear_messages();
                    rcmail.display_message(rcmail.gettext('note_created_success', plugin_text), "confirmation");
                }
            });

            let hasDown = Sticker.findByOrder(this.order + 1).uid !== undefined;
            let hasUp = Sticker.findByOrder(this.order - 1).uid !== undefined;

            //Handler pour le bouton "descendre"
            if (hasDown)
            {
                $element.find('.downb').click(async () => {
                    if (rcmail.busy === true) return;

                    rcmail.set_busy(true, "loading");
                    $(".shortcut-notes .change").addClass("disabled").attr("disabled", "disabled");
                    //$element.find("textarea").addClass("disabled").attr("disabled", "disabled");

                    await this.post_move_down(Sticker.findByOrder(this.order + 1).uid);
    
                    rcmail.set_busy(false);
                    $(".shortcut-notes .change").removeClass("disabled").removeAttr("disabled");
                    //$element.find("textarea").removeClass("disabled").removeAttr("disabled");
                    rcmail.clear_messages();
                    rcmail.display_message(rcmail.gettext('note_move_success', plugin_text), "confirmation");
                });
            }
            else $element.find('.downb').addClass("disabled").attr("disabled", "disabled");

            //Handler pour le bouton "monter"
            if (hasUp)
            {
                $element.find('.upb').click(async () => {
                    if (rcmail.busy === true) return;

                    rcmail.set_busy(true, "loading");
                    $(".shortcut-notes .change").addClass("disabled").attr("disabled", "disabled");
                    //$element.find("textarea").addClass("disabled").attr("disabled", "disabled");
                    await this.post_move_up(Sticker.findByOrder(this.order - 1).uid);
    
                    rcmail.set_busy(false);
                    $(".shortcut-notes .change").removeClass("disabled").removeAttr("disabled");
                    //$element.find("textarea").removeClass("disabled").removeAttr("disabled");
                    rcmail.clear_messages();
                    rcmail.display_message(rcmail.gettext('note_move_success', plugin_text), "confirmation");
                });
            }
            else $element.find('.upb').addClass("disabled").attr("disabled", "disabled");

            return this;
        }

        /**
         * Affiche sous forme de string certaines données pour le html
         * @returns id & data-order
         */
        get_datas(){
            return ` id="note-${this.uid}" data-order="${this.order}" `;
        }

        /**
         * Créer une note
         * @returns Ajax
         */
        post_add()
        {
            return this.post("add", {_raw:this}).always(() => {
                top.rcmail.triggerEvent('notes.apps.updated', rcmail.env.mel_metapages_notes);
            });
        }

        /**
         * Change l'ordre de la note par rapport à une autre note
         * @param {string} uid Id de la note
         * @param {number} order Nouvel ordre de la note
         * @param {Sticker} other Autre note
         */
        async _post_move(uid, order, other)
        {
            //On change l'ordre de la note
            await this.post("move", {_uid:uid, _order:order});
            //puis de l'autre note
            await other.post("move", {_uid:other.uid, _order:other.order});
            //Puis on récupère tout pour éviter les bugs
            await this.post("get").done((e) => {

                    rcmail.env.mel_metapages_notes = JSON.parse(e);

                    if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
                        rcmail.env.mel_metapages_notes = {
                            "create":new Sticker("create", 0, "", "")
                        }
    
                    $('.shortcut-notes .square-contents').html(
                        Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' ')
                    );
    
                    $('.mel-note').each((i, e) => {
                        Sticker.fromHtml($(e).attr("id").replace('note-', '')).set_handlers();
                    });
            })
        }

        /**
         * Descend la note
         * @param {string} $uid Id de l'autre note
         * @returns Ajax
         */
        post_move_down($uid)
        {
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
        post_move_up($uid)
        {
            this.order -= 1;
            let other = Sticker.fromHtml($uid);
            other.order += 1;
            return this._post_move(this.uid, this.order, other);
        }

        /**
         * Supprime la note
         * @returns {Promise<any>|null} Ajax
         */
        post_delete()
        {
            if (this.uid === default_note_uid) return;

            if (this.get_html().find('.icon-mel-eye-crossed').length > 0)
            {
                this.get_html().find('.eye').click();
            }

            return this.post('del', {_uid:this.uid}).always(() => {
                top.rcmail.triggerEvent('notes.apps.updated', rcmail.env.mel_metapages_notes);
            });
        }

        post_height_updated(newHeight)
        {
            if (this.uid === default_note_uid) return;

            return this.post('update_height', {
                _uid:this.uid,
                _height:newHeight
            });
        }

        /**
         * @async Met à jours la note
         */
        async post_update()
        {
            if (this.uid === default_note_uid) {
                await this.post_add();
            }
            else {      
                await this.post('update', {
                    _uid:this.uid,
                    _raw:this
                });
                rcmail.env.mel_metapages_notes[this.uid].text = this.text;
                top.rcmail.triggerEvent('notes.apps.updated', rcmail.env.mel_metapages_notes);
            }
        }

        /**
         * Effectue une action sur le serveur
         * @param {string} action Nom de l'action
         * @param {JSON} params Paramètres de l'action 
         * @param {boolean} doAction Si faux, la fonction de réussite ne sera pas appelé
         * @returns {Promise<any>} Appel ajax
         */
        post(action, params = {}, doAction = true)
        {
            const on_eye = this.get_html().find('.icon-mel-eye-crossed').length > 0;
            params["_a"] = action;
            return mel_metapage.Functions.post(
                mel_metapage.Functions.url("mel_metapage", "notes"),
                params,
                (datas) => {
                    if (datas !== "break" && doAction)
                    {
                        rcmail.env.mel_metapages_notes = JSON.parse(datas);

                        if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
                        {
                            rcmail.env.mel_metapages_notes = {};
                            rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker("create", 0, "", "");
                        }

                        $('.shortcut-notes .square-contents').html(
                            Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html(on_eye)).toArray().join(' ')
                        );

                        $('.mel-note').each((i, e) => {
                            Sticker.fromHtml($(e).attr("id").replace('note-', '')).set_handlers();
                        });

                        if (on_eye)
                        {
                            this.get_html().css('display', '').find('.eye').addClass('crossed').find('.icon-mel-eye').removeClass('icon-mel-eye').addClass('icon-mel-eye-crossed');
                            $('.nb').addClass('disabled').attr('disabled', 'disabled');
                            $('.downb').css('display', 'none');
                            $('.upb').css('display', 'none');
                        }
                    }
                    else {
                        rcmail.env.mel_metapages_notes[this.uid].text = this.text;
                    }
                }
            );
        }

        /**
         * Créer une note à partir d'une autre note
         * @param {Sticker} element Sticker ou objet ayant les même props.
         * @returns Nouvelle note
         */
        static from(element)
        {
            let s = new Sticker(element.uid, element.order, element.title, element.text, element.color, element.textcolor);
            
            if (!!element.height) s.height = element.height;

            return s;
        }

        /**
         * Créer une note depuis les données d'un block html
         * @param {string} uid Id de la div
         * @returns Nouvelle note
         */
        static fromHtml(uid)
        {
            let $element = $(`.mel-note#note-${uid}`);
            return new Sticker(uid, $element.data("order"), $element.find("input").val(), $element.find("textarea").val(), $element.css("background-color"), $element.css("color"));
        }

        /**
         * Récupère une note via son ordre
         * @param {number} order Ordre de la note cherchée
         * @returns Nouvelle note
         */
        static findByOrder(order)
        {
            let id = $(`.mel-note[data-order=${order}]`).attr("id");
            return Sticker.fromHtml(id === undefined ? undefined : id.replace('note-', ''));
        }


    }  

    //Si il n'y a pas de note, il y en a une par défaut
    if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
    {
        rcmail.env.mel_metapages_notes = {};
        rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker(default_note_uid, 0, "", "");
    }

    //Ajout des notes au bouton "Mes raccourcis"
    top.mm_add_shortcut("notes", Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' '), true, 'Notes');

    //Lorsque l'on appuie sur le bouton "Mes raccourcis" pour la première fois
    top.rcmail.addEventListener("apps.create", () => {
        if (top.$('.mel-note').length > 0)
        {
            top.$('.mel-note').each((i, e) => {
                Sticker.fromHtml(top.$(e).attr("id").replace('note-', '')).set_handlers();
            });
        }
        else {
            const interval = setInterval(() => {
                if (!!top.shortcuts)
                {
                    if (top.$('.mel-note').length === 0) top.mm_add_shortcut("notes", Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' '), true, 'Notes');
                    else clearInterval(interval);
                }
            }, 100);
        }

        if (rcmail.env.mel_metapages_notes_edited === true)
        {
            rcmail.triggerEvent('notes.master.update', {datas:rcmail.env.mel_metapages_notes});
            rcmail.env.mel_metapages_notes_edited = false;
        }
    });

    top.rcmail.addEventListener('notes.master.update', (args) => {
        rcmail.env.mel_metapages_notes_edited = true;
        rcmail.env.mel_metapages_notes = args.datas;

        let $eyes = $('.shortcut-notes .icon-mel-eye-crossed');
        if ($eyes.length > 0) $eyes.click();

        if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
        {
            rcmail.env.mel_metapages_notes = {};
            rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker("create", 0, "", "");
        }

        $('.shortcut-notes .square-contents').html(
            Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' ')
        );

        $('.mel-note').each((i, e) => {
            Sticker.fromHtml($(e).attr("id").replace('note-', '')).set_handlers();
        });
    });

    top.rcmail.addEventListener('notes.master.edit', (args) => {
        rcmail.env.mel_metapages_notes[args.id].text = args.text;
        return Sticker.from(rcmail.env.mel_metapages_notes[args.id]).post_update().then(() => {
            rcmail.triggerEvent('notes.master.update', {datas:rcmail.env.mel_metapages_notes});
        });
    });

    top.rcmail.addEventListener('notes.apps.updated', (x) => {
        $('iframe.mm-frame').each((i, e) => {
            try {
                e.contentWindow.rcmail.env.mel_metapages_notes = x;
                e.contentWindow.rcmail.triggerEvent('notes.apps.updated');
            } catch (error) {
                
            }
        });
    });
}

$(document).ready(() => {
    try {
        notes();
    } catch (error) {
        
    }
});

})();