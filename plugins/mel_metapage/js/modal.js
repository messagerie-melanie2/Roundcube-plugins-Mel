/**
 * Configuration d'une modale.
 */
class GlobalModalConfig
{
    constructor(title, header = "default", content = "default", footer = null, exit = "default", text = "default", onclick = () => {})
    {
        this.header = header;
        this.title = title;
        this.content = content;
        if (footer === null || footer === undefined)
            this.footer = {
                exit:exit,
                save:{
                    text:text,
                    onclick:onclick
                }
            }
        else
            this.footer = footer;
    }

    toJson()
    {
        return {
            header:this.header,
            title:this.title,
            content:this.content,
            footer:this.footer
        };
    }
}

/**
 * Gère la modale globale.
 */
class GlobalModal
{
    /**
     * 
     * @param {string} idModal Id de la modale.
     * @param {GlobalModalConfig} config Configuration de la modale.
     * @param {boolean} show Afficher la modale à la création ? (faux par défaut).
     */
    constructor(idModal = "globalModal", config = {
        header:"default",
        title:"Ma modale",
        content:"default",
        footer:{
            exit:"default",
            save:{
                text:"default",
                onclick:()=>{}
            }
        }
    }, show = false)
    {
        this.modal = $("#" + idModal);
        if (this.modal.length === 0 && rcmail.env.mmp_modal !== undefined)
        {
            $("body").append(rcmail.env.mmp_modal);
            this.modal = $("#" + idModal);
            rcmail.env.mmp_modal = undefined;
        }

        this.header = {
            querry: $(".global-modal-header"),
            title: $(".global-modal-title")
        }

        if (config.header === "default")
            this.header.title.html(config.title);
        
        this.contents = $(".global-modal-body");
        if (config.content !== "default" && config.content !== "" && config.content !== null && config.content !== undefined)
            this.contents.html(config.content);

        this.footer = {
            querry:$(".global-modal-footer"),
            buttons:{
                exit:$(".modal-close-footer"),
                save:$(".modal-save-footer")
            }
        };

        if (config.footer.exit === undefined && config.footer.save === undefined)
        {
            this.footer.querry.html(config.footer);
            this.footer.buttons = null;
        }
        else {
            if (config.footer.exit !== undefined && config.footer.exit !== "default")
                this.footer.buttons.exit.html(config.footer.exit);
            if (config.footer.save !== undefined && config.footer.save.text !== "default")
                this.footer.buttons.save.html(config.footer.save.text);
            if (config.footer.save !== undefined && config.footer.save.onclick !== undefined)
                this.footer.buttons.save.click(config.footer.save.onclick);
        }

        this.on_click_exit = () => {
            this.close();
        };
        this.on_click_minified = this.on_click_exit;
        let $close = $(".modal-close");
        $close.click(() => {
            this.on_click_exit();
        });
        this.notHaveReduced($close);
        $close = null;

        if (show)
            this.show();

        this.have_reduced = false;
    }

    /**
     * Modifie l'en-tête de la modale.
     * @param {string} header Nouveau header.
     */
    editHeader(header)
    {
        this.header.querry.html(header);
    }

    /**
     * Modifie le titre de la modale.
     * @param {string} title Nouveau titre de la modale.
     */
    editTitle(title)
    {
        this.header.title.html(title).css("white-space", "nowrap");
    }

    setBeforeTitle(back)
    {
        const id = "created-modal-title-div-auto";
        this.editHeader(`<div id="${id}"></div>${this.header.querry.html()}`);
        $(back).appendTo($(`#${id}`));
        this.header.title = $(".global-modal-title");
        this.header.title.appendTo($(`#${id}`));
        $(".modal-close").click(this.on_click_exit);
        if (this.have_reduced)
        {
            $('.modal-minify-mel').click(this.on_click_minified);
        }
    }

    editTitleAndSetBeforeTitle(before, title)
    {
        $(".global-modal-header").children().each((i, e) => {
            if (e.id === "created-modal-title-div-auto")
            {
                if ($(e).find("h2").length === 0)
                    $(e).remove();
            }
        });

        this.editTitle(title);
        this.setBeforeTitle(before);

        setTimeout(() => {
            $(".global-modal-header").children().each((i, e) => {
                if (e.id === "created-modal-title-div-auto")
                {
                    if ($(e).find("h2").length === 0)
                        $(e).remove();
                }
            });
        }, 100);  
    }

    removeBeforeTitle()
    {
        const id = "created-modal-title-div-auto";
        const title = this.header.title[0].outerHTML;
        $(`#${id}`).remove();
        this.header.title = $(title).prependTo(this.header.querry);
        
    }

    /**
     * Modifie le contenu de la modale.
     * @param {string} html Html qui remplacera le contenu de la modale.
     */
    editBody(html)
    {
        this.contents.html(html);
    }

    appendToBody(querry)
    {
        querry.appendTo(this.contents);
        return this;
    }

    /**
     * Modifie la position en Y de la modale.
     * @param {string} pos Position Y avec "px" à la fin.
     */
    setTopPosition(pos)
    {
        this.modal.css("top", pos);
    }

    editHeight(height, unit = "px")
    {
        $(`#${this.modal[0].id} .modal-content`).css("height", `${height}${unit}`);
    }

    autoHeight()
    {
        this.editHeight(window.innerHeight-(this.isPhone() ? 0 : 60));
    }

    haveReduced()
    {
        this.have_reduced = true;
        return this._create_reduced();
    }

    notHaveReduced($close_button = null)
    {
        const class_tra = GlobalModal.consts.classes.top_right_action;

        let $close = $close_button || $(".modal-close");
        this.have_reduced = false;
        let $modal_minifier = $('.modal-minify-mel')

        if ($modal_minifier.length > 0) 
        {
            $close.addClass(class_tra).appendTo($close.parent().parent());
            $modal_minifier.parent().remove();
        }

        $modal_minifier = null;
        return this;
    }

    _create_reduced()
    {
        const class_tra = GlobalModal.consts.classes.top_right_action;

        let button = document.createElement('button');
        let span = document.createElement('span');

        span.classList.add("icon-mel-minus-roundless");
        button.append(span);
        span = null;
        span = document.createElement('span');
        span.classList.add('sr-only');
        span.innerText = 'Minifier la modale';
        button.append(span);
        span = null;
        span = document.createElement('div');
        let $close = $('.modal-close');
        $close.removeClass(class_tra).parent().append(span);

        $(span).addClass(class_tra).append($(button).addClass('btn btn-secondary modal-minify-mel').click(() => {
            this.on_click_minified();
        })).append($close);

        span = null;
        button = null;
        $close = null;

        return this;
    }

    onDestroy(func)
    {
        this.ondestroy = func;
    }

    onClose(e)
    {
        this.modal.on("hide.bs.modal", e);
    }

    dialog(txt)
    {
        if (txt === "destroy")
        {
            if (this.ondestroy !== undefined)
                this.ondestroy(this);
            this.close();
        }
    }

    /**
     * Ferme la modale.
     */
    close()
    {
        this.modal.modal('hide');
        $(".modal-backdrop").remove();
    }

    /**
     * Affiche la modale.
     */
    show()
    {

        if (this.isPhone())
            this.setToPhone();

        this.modal.modal("show");
    }

    setToPhone()
    {
        this.modal
        .find(".modal-dialog")
        .css("padding", "0")
        .css("padding-right", "15px")
        .css("margin", 0);

        this.modal.find(".modal-content")
        .css("border-radius", 0);

        this.header.querry
        .css("white-space", "nowrap")
        .css("font-size-adjust", "0.3")
        ;

        this.contents.css("margin", 0).css("padding", "0 15px");//.css("padding-right", "15px");

        this.footer.querry.css("text-align", "center")
        .css("display", "block");

        //console.log("header", this.header);

        this.autoHeight();
    }

    isPhone()
    {
        return $("html").hasClass("layout-phone");
    }

    static resetModal()
    {
        if (!!this.raw_datas)
        {
            $("#globalModal").remove();
            $("body").append(this.raw_datas);
            return $.ajax();
        }
        else {
            return mel_metapage.Functions.get(
                mel_metapage.Functions.url("mel_metapage", "modal"),
                {},
                (datas) => {
                    $("#globalModal").remove();
                    $("body").append(datas);
                    this.raw_datas = datas;
                }
            );
        }
    }

}

/**
 * Ferme la modale avec l'id "globalModal".
 */
GlobalModal.close = function ()
{
    $("#globalModal").modal('hide');
}

GlobalModal.consts = {
    classes:{
        top_right_action:'modal-top-right-actions'
    }
};

window.GlobalModal = GlobalModal;
window.GlobalModalConfig = GlobalModalConfig;