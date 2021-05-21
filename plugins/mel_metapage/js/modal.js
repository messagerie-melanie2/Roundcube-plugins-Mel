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

        $(".modal-close").click(() => {
            this.close();
        });

        if (show)
            this.show();
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
        this.header.title.html(title);
    }

    setBeforeTitle(back)
    {
        const id = "created-modal-title-div-auto";
        this.editHeader(`<div id="${id}"></div>${this.header.querry.html()}`);
        $(back).appendTo($(`#${id}`));
        this.header.title = $(".global-modal-title");
        this.header.title.appendTo($(`#${id}`));
    }

    editTitleAndSetBeforeTitle(before, title)
    {
        this.editTitle(title);
        this.setBeforeTitle(before);
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
        this.editHeight(window.innerHeight-60);
    }

    onDestroy(func)
    {
        this.ondestroy = func;
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
    }

    /**
     * Affiche la modale.
     */
    show()
    {
        this.modal.modal("show");
    }

}

/**
 * Ferme la modale avec l'id "globalModal".
 */
GlobalModal.close = function ()
{
    $("#globalModal").modal('hide');
}