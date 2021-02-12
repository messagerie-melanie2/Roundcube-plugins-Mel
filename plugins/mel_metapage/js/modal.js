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



class GlobalModal
{
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

    editHeader(header)
    {
        this.header.querry.html(header);
    }

    editTitle(title)
    {
        this.header.title.html(title);
    }

    setTopPosition(pos)
    {
        this.modal.css("top", pos);
    }

    close()
    {
        console.log(this, this.modal);
        this.modal.modal('hide');
    }

    show()
    {
        this.modal.modal("show");
    }

}

GlobalModal.close = function ()
{
    $("#globalModal").modal('hide');
}