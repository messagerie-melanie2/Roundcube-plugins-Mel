class FullscreenItem
{
    constructor(parentSelector, open = true)
    {
        this.is_open = false;

        const _class = "fullscreen-item";

        let parent = $(parentSelector);

        if (parent.find("." + _class).length === 0)
            parent.append("<div style=display:none; class="+_class+">");

        this.item = parent.find("." + _class);

        if (this.item.data("is-flex"))
        {
            if (this.item.find(".fullscreen-item-flex").length === 0)
                this.item = this.item.find(".fullscreen-item-flex");
            else
                this.generate_flex();
        }

        this.item.attr("tabindex", -1).prepend(`<span class="sr-only">Ecran Mes Raccourcis</span>`);

        this.close_button = $('<button class="fullscreen-close"><span class="icofont-close-line-circled"></span><span class="sr-only">Fermer les raccourcis</span></button>').appendTo(this.item);
        
        this.close_button.on("click", () => {
            this.close();
        });

        this.apps = {};

        this.item.find(".apps").each((i,e) => {
            this.apps[$(e).data("app-id")] = $(e);
        });

        if (open)
            this.open();

    }

    generate_flex()
    {
        this.item.data("is-flex", true);
        this.item = $("<div></div>").addClass("fullscreen-item-flex").appendTo(this.item);
    }

    is_flex()
    {
        if (this.item.data("is-flex")!==true)
            return this.item.parent().data("is-flex") === true;
        else
            return true;
    }

    add_app(key, querry)
    {
        if (typeof querry === "string")
            querry = $(querry);

        this.apps[key] = querry.addClass("apps").data("app-id", key).appendTo(this.item);
    }

    remove_app(key)
    {
        this.apps[key].remove()
        delete this.apps[key];
    }

    open()
    {
        if (this.is_flex())
            this.item.parent().css("display", "");
        else
            this.item.css("display", "");

        this.is_open = true;
    }

    close()
    {
        if (this.is_flex())
            this.item.parent().css("display", "none");
        else
            this.item.css("display", "none");

        this.is_open = false;
    }

    static close_if_exist()
    {
        if (window.shortcuts !== undefined && window.shortcuts !== null && window.shortcuts.is_open)
            window.shortcuts.close();
    }
}