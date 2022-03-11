$(document).ready(() => {
    const base_color = "#E6B905";
    const base_text_color = "#000000";


    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }
      
      function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
      }

      window.create_note = async () => {
        if (window.create_popUp !== undefined) window.create_popUp.close();

        $("#button-shortcut").click();
        rcmail.set_busy(true, "loading");
        
        if (rcmail.env.mel_metapages_notes["create"] !== undefined) await rcmail.env.mel_metapages_notes["create"].post_add();
        new Sticker("", -1, "", "").post_add().then(() => {
            rcmail.set_busy(false);

            rcmail.clear_messages();
            rcmail.display_message("Note créée avec succès !", "confirmation");
            $('.mel-note').last().find("textarea")[0].focus();
        });
      };

    class Sticker
    {
        constructor(uid, order, title, text, color = base_color, text_color = base_text_color)
        {
            this.uid = uid;
            this.order = order;
            this.title = title;
            this.text = text;
            this.color = color;
            this.textcolor = text_color;
        }

        html()
        {
            return `
            <div class="mel-note" style="background-color:${this.color};color:${this.textcolor}" ${this.get_datas()}>
                <div class="note-header">
                    <button title="Nouveau" class="mel-button no-button-margin bckg true nb" style="color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-left-radius:5px!important;"><span class="icon-mel-plus"></span></button>
                    <input class="change" type=text style="background-color:${this.color};color:${this.textcolor}" value="${this.title}" />
                    <button title="Paramètres" class="  mel-button no-button-margin bckg true pb" style="color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-dots"></span></button>
                    <button title="Supprimer" class=" mel-button no-button-margin bckg true db" style="color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-right-radius:5px!important;"><span class="icon-mel-trash"></span></button>
                </div>
                <div class="note-header-params" style="display:none">
                <input title="Changer la couleur de fond" class="change bcgcolor" type="color" value="${this.color === base_color ? this.color : rgbToHex(...Enumerable.from(this.color.replace('!important', '').replace('rgb', "").replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"/>
                <input title="Changer la couleur du texte" class="change txtcolor" type="color" value="${this.textcolor === base_text_color ? this.textcolor : rgbToHex(...Enumerable.from(this.textcolor.replace('rgb', "").replace('a', '').replace('(', '').replace(')', '').split(',')).select(x => parseInt(x)).toArray())}"/>
                <button title="Quitter les paramètres" class="  mel-button no-button-margin bckg true bb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;border-top-right-radius:5px!important;"><span class="icon-mel-undo"></span></button>
                <button title="Déplacer en bas" class=" mel-button no-button-margin bckg true downb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-chevron-down"></span></button>
                <button title="Déplacer en haut" class=" mel-button no-button-margin bckg true upb" style="float:right;color:${this.textcolor};border:none!important;border-radius:0px!important;"><span class="icon-mel-chevron-up"></span></button>
                </div>
                <div class="note-body">
                    <textarea rows="5" class="change" style="width:100%;background-color:${this.color};color:${this.textcolor}">${this.text}</textarea>
                </div>
            </div>
            `;
        }

        get_html()
        {
            return $(`.mel-note#note-${this.uid}`);
        }

        set_handlers()
        {
            let $element = this.get_html();
            $element.find("button.nb").click(async () => {

                if (rcmail.busy === true) return;

                rcmail.set_busy(true, "loading");
                $element.find(".change").addClass("disabled").attr("disabled", "disabled");
                //$element.find("textarea").addClass("disabled").attr("disabled", "disabled");

                if (this.uid === "create") await this.post_add();

                let sticker = Sticker.fromHtml(this.uid);
                sticker.text = "";
                sticker.title = "";
                await sticker.post_add();

                rcmail.set_busy(false);
                $element.find(".change").removeClass("disabled").removeAttr("disabled");
                //$element.find("textarea").removeClass("disabled").removeAttr("disabled");
                rcmail.clear_messages();
                rcmail.display_message("Note créée avec succès !", "confirmation");
            });

            $element.find("button.pb").click(() => {
                $element.css("width", $element.width() + "px");
                $element.find(".note-header").css("display", "none");
                $element.find(".note-header-params").css("display", "");
            })

            $element.find("button.bb").click(() => {
                $element.find(".note-header").css("display", "");
                $element.find(".note-header-params").css("display", "none");
                $element.css("width", '');
            })

            $element.find("button.db").click(async () => {

                if (rcmail.busy === true) return;

                if (this.uid === "create")
                {
                    rcmail.display_message("Note réinitialisée avec succès !", "confirmation");
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
                rcmail.display_message("Note supprimée avec succès !", "confirmation");
            });

            $element.find(".change").on('change', async () => {

                let isCreate = this.uid === "create";
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
                    rcmail.display_message("Note créée avec succès !", "confirmation");
                }
            });

            let hasDown = Sticker.findByOrder(this.order + 1).uid !== undefined;
            let hasUp = Sticker.findByOrder(this.order - 1).uid !== undefined;

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
                    rcmail.display_message("Notes déplacées avec succès !", "confirmation");
                });
            }
            else $element.find('.downb').addClass("disabled").attr("disabled", "disabled");

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
                    rcmail.display_message("Notes déplacées avec succès !", "confirmation");
                });
            }
            else $element.find('.upb').addClass("disabled").attr("disabled", "disabled");

        }

        get_datas(){
            return ` id="note-${this.uid}" data-order="${this.order}" `;
        }

        post_add()
        {
            return this.post("add", {_raw:this});
        }

        async _post_move(uid, order, other)
        {
            await this.post("move", {_uid:uid, _order:order});
            await other.post("move", {_uid:other.uid, _order:other.order});
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

        post_move_down($uid)
        {
            this.order += 1;
            let other = Sticker.fromHtml($uid);
            other.order -= 1;
            return this._post_move(this.uid, this.order, other);
        }

        post_move_up($uid)
        {
            this.order -= 1;
            let other = Sticker.fromHtml($uid);
            other.order += 1;
            return this._post_move(this.uid, this.order, other);
        }

        post_delete()
        {
            if (this.uid === "create") return;

            return this.post('del', {_uid:this.uid});
        }

        async post_update()
        {
            if (this.uid === "create") {
                await this.post_add();
            }
            else {      
                await this.post('update', {
                    _uid:this.uid,
                    _raw:this
                });
            }
        }

        post(action, params = {}, doAction = true)
        {
            params["_a"] = action;
            return mel_metapage.Functions.post(
                mel_metapage.Functions.url("mel_metapage", "notes"),
                params,
                (datas) => {
                    if (datas !== "break" && doAction)
                    {
                        rcmail.env.mel_metapages_notes = JSON.parse(datas);

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
                    }
                }
            );
        }

        static from(element)
        {
            return new Sticker(element.uid, element.order, element.title, element.text, element.color, element.textcolor);
        }

        static fromHtml(uid)
        {
            let $element = $(`.mel-note#note-${uid}`);
            return new Sticker(uid, $element.data("order"), $element.find("input").val(), $element.find("textarea").val(), $element.css("background-color"), $element.css("color"));
        }

        static findByOrder(order)
        {
            let id = $(`.mel-note[data-order=${order}]`).attr("id");
            return Sticker.fromHtml(id === undefined ? undefined : id.replace('note-', ''));
        }


    }  

    if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
        rcmail.env.mel_metapages_notes = {
            "create":new Sticker("create", 0, "", "")
        }

    mm_add_shortcut("notes", Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' '), true);
    
    rcmail.addEventListener("apps.create", () => {
        $('.mel-note').each((i, e) => {
            Sticker.fromHtml($(e).attr("id").replace('note-', '')).set_handlers();
        });
    });

    
window.sticker = Sticker;
});