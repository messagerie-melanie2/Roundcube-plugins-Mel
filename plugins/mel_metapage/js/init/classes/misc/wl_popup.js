class Windows_Like_PopUp extends MetapageObject
{
    constructor($parent, config = null)
    {
        super($parent, config);

        if (this.settings.aftersetup !== null)
            this.settings.aftersetup();
    }

    init(){
        this.id = Windows_Like_PopUp._generateId(Enumerable.from(Windows_Like_PopUp.popUps).count());
        this.parent = $();
        this.box = {
            close:$(),
            minifier:$(),
            header:$(),
            title:$(),
            content:$(),
            get:$()
        };

        this.settings = {
            title:"",
            onclose:() => {},
            onminify:() => {},
            onexpand:() => {},
            icon_close:"icon-mel-close",
            icon_minify:'icon-mel-minus-roundless',
            icon_expend:'icon-mel-expand',
            content:"",
            onsetup:() => {},
            aftersetup:() => {},
            beforeCreatingContent:() => "",
            onCreatingContent:(html) => html,
            afterCreatingContent:($html, box) => {},
            onminifiedListCreated:($minified) => {
                $minified.css("left", "60px").css("width", "calc(100% - 60px)");
            },
            width:"100%",
            height:"100%"
        };

        Windows_Like_PopUp.popUps[this.id] = this;
        return this;
    }

    setup($parent, config){
        this.parent = $parent;

        if (config !== null)
        {
            for (const key in config) {
                if (Object.hasOwnProperty.call(config, key)) {
                    const element = config[key];
                    this.settings[key] = element;
                }
            }
        }

        if (this.settings.onsetup !== null)
            this.settings.onsetup();

        return this._generateBox();
    }

    _generateBox()
    {
        const settings = this.settings;
        const id = `wlpopup-${this.id}`;
        const jid = '#' + id;
        const class_header = "wlp-header";
        const class_title = "wlp-title";
        const class_contents = "wlp-contents";
        const class_size = "wlp-minixpand";
        const class_close = "wlp-close";
        const h = "2";

        let html = "";

        if (settings.beforeCreatingContent !== null)
            html = settings.beforeCreatingContent();


        //Création du header
        html += `<div class="${class_header}">`;
        html += `<span class="${class_title}"><h${h} style="display:inline-block;">${settings.title}</h${h}></span>`;
        html += `<span style="float:right;margin-right: 15px;"><button class="${class_size} inverse mel-button btn btn-secondary dark-no-border-default" style="margin:0"><span class="${settings.icon_minify}"></span></button>
        <button class="${class_close} btn-danger danger inverse mel-button btn btn-secondary dark-no-border-default" style="margin:0"><span class="${settings.icon_close}"></span></button></span>`;
        html += '</div>';

        //Création du content
        html += `<div class="${class_contents}" style="width:100%;height:100%;">${settings.content}</div>`;

        //Création de la box
        html = `<div id="${id}" class="wlp_box" style="position:absolute;top:0;right:0;width:${settings.width};height:${settings.height};">${settings.onCreatingContent !== null ? settings.onCreatingContent(html) : html}</div>`;
            
        this.parent.append(html);

        if (this.parent.find(".wlp-minifieds").length === 0)
        {
            this.parent.append('<div class="wlp-minifieds"></div>');
            if (settings.onminifiedListCreated !== null)
                settings.onminifiedListCreated(this.parent.find(".wlp-minifieds"));
        }

        this.box.content = $(`${jid} .${class_contents}`);
        this.box.header = $(`${jid} .${class_header}`);
        this.box.title = $(`${jid} .${class_title}`);
        this.box.get = $(`${jid}`);
        this.box.close = $(`${jid} .${class_close}`).on("click", () => {
            if (this.settings.onclose !== null)
                this.settings.onclose();

            this.destroy();
            Windows_Like_PopUp.clean();
        });
        this.box.minifier = $(`${jid} .${class_size}`).on("click", () => {
            let span = this.box.minifier.find('span');
            if (span.hasClass(this.settings.icon_minify))
            {
                //minify
                if (this.settings.onminify !== null)
                    this.settings.onminify();

                this.minify();
            }
            else {
                //expand
                if (this.settings.onexpand !== null)
                    this.settings.onexpand();

                this.expand();
            }
        });

        //Ajout de actions
        if (settings.afterCreatingContent !== null)
            settings.afterCreatingContent($(jid), this.box);

        return this;
    }

    minify(){
        this.box.minifier.find("span").removeClass(this.settings.icon_minify).addClass(this.settings.icon_expend);
        this.box.header.clone().appendTo($('.wlp-minifieds')).attr("id", `minified-${this.id}`).find(".wlp-close").click(() => {
            $(`#minified-${this.id}`).remove();
            
            if (this.settings.onclose !== null)
                this.settings.onclose();

            this.destroy();
            Windows_Like_PopUp.clean();
        }).parent().find(".wlp-minixpand").click(() => {
            //expand
            if (this.settings.onexpand !== null)
                this.settings.onexpand();

            this.expand();
        });
        this.box.get.css("display", "none");
    }

    expand(){
        $(`#minified-${this.id}`).remove();
        this.box.minifier.find("span").addClass(this.settings.icon_minify).removeClass(this.settings.icon_expend);
        this.box.get.css("display", "");
    }

    destroy()
    {
        this.box.get.remove();
        delete Windows_Like_PopUp.popUps[this.id];
        this.id = null;
        this.parent = null;
        this.box = null;
        return null;
    }

    static _generateId(base)
    {
        if (Windows_Like_PopUp.popUps[base] === undefined)
            return base;

        while (Windows_Like_PopUp.popUps[base++] !== undefined) {}

        return base;   
    }

    static clean()
    {
        for (const key in Windows_Like_PopUp.popUps) {
            if (Object.hasOwnProperty.call(Windows_Like_PopUp.popUps, key)) {
                const element = Windows_Like_PopUp.popUps[key];
                if (element.box.get.length === 0)
                    delete Windows_Like_PopUp.popUps[key];
            }
        }

        if (Enumerable.from(Windows_Like_PopUp.popUps).count() === 0)
            $('.wlp-minifieds').remove();
    }

    static test()
    {
        let config = {
            title:"testPopup",
            // onclose:() => {},
            // onminify:() => {},
            // onexpand:() => {},
            // icon_close:"icon-mel-close",
            // icon_minify:'icon-mel-minus',
            // icon_expend:'icon-mel-expend',
            content:"Salut bg",
            // onsetup:() => {},
            // aftersetup:() => {},
            // beforeCreatingContent:() => "",
            // onCreatingContent:(html) => html,
             afterCreatingContent:($html, box) => {
                 box.get.css("left","60px").css("top", "60px").addClass("questionnaireWebconf");
                 setTimeout(() => {
                    box.close.addClass("mel-focus focused");
                    setTimeout(() => {
                        box.close.removeClass("mel-focus").removeClass("focused");
                        setTimeout(() => {
                            box.close.addClass("mel-focus focused");
                            setTimeout(() => {
                                box.close.removeClass("mel-focus").removeClass("focused");
                                setTimeout(() => {
                                    box.close.focus();
                                 }, 100);
                             }, 100);
                         }, 100);
                     }, 200);
                 }, 200);
             },
            width:"calc(100% - 60px)",
            height:"calc(100% - 60px)"
        };

        return new Windows_Like_PopUp($("body"), config);
    }
}

Windows_Like_PopUp.popUps = {};
