//
class AnnuaireTree{

    constructor($querry)
    {
        this.panel = $querry;
        this.icons = {
            closed:"icon-mel-chevron-right",
            opened:"icon-mel-chevron-down",
            loading:"icon-mel-dots",
            empty:"icon-mel-dots",
            person:"icon-mel-user",
            notPerson:"icon-mel-intranet"
        }
        this.actions = {

        };
    }

    getAction(action, ...args)
    {
        if (this.actions[action] !== undefined) return this.actions[action](...[this, ...args]);

        return args[0];
    }

    setAction(action, callback)
    {
        this.actions[action] = callback;
        return this;
    }

    setActions(actions_with_callbacks)
    {
        for (const key in actions_with_callbacks) {
            if (Object.hasOwnProperty.call(actions_with_callbacks, key)) {
                const element = actions_with_callbacks[key];
                this.setAction(key, element);
            }
        }

        return this;
    }

    setupTree(service)
    {
        let html = this.getAction(AnnuaireTree.actionsList.beforeSetup, '');

        html += `<div style="overflow:auto">
            <ul class="listing iconized settings-default-icon" style="width: max-content;width: -moz-fit-content;">
                <button class="folder hidden deletePlz"><span class="icon-mel-chevron-right"></span></button>
            </ul>
        </div>
        `;

        this.panel.html(html);

        this.buttonAction(service,this.panel.find('.deletePlz')).then(() => {
            this.getAction(AnnuaireTree.actionsList.afterSetup, this.panel);
        });

        return this;
    }

    async buttonAction(service, $button)
    {
        const canDeploy = $button.hasClass("folder");
        if (this.getAction(AnnuaireTree.actionsList.onAction, true, service, $button, canDeploy))
        {
            if (canDeploy)
            {
                const isDeployed = $button.find(`.${this.icons.closed}`).length === 0;
                let $ul = $button.parent().find('ul').first();

                if (isDeployed)
                {
                    $ul.css("display", "none");
                    $button.find(`.${this.icons.opened}`).removeClass(this.icons.opened).addClass(this.icons.closed);
                    this.getAction(AnnuaireTree.actionsList.onCloseFolder, service, $button, isDeployed, $ul);
                }
                else if ($ul.length > 0)
                {
                    $ul.css("display", "");
                    $button.find(`.${this.icons.closed}`).removeClass(this.icons.closed).addClass(this.icons.opened);
                    this.getAction(AnnuaireTree.actionsList.onOpenFolder, service, $button, isDeployed, $ul);
                }
                else await this.showChildren(service, $button);
            }
            else this.getAction(AnnuaireTree.actionsList.onNotFolderClick, service, $button);
        }

        return this;
    }

    async showChildren(service, $button)
    {
        const end = ',dc=equipement,dc=gouv,dc=fr';

        if (!service.includes(end))
            service += end;

        let $span = $button.addClass("disabled").attr("disabled", "disabled").parent().append('<span style="display:block;" class="spinner-grow"><span class="sr-only">Chargement....</span></span>').find(`.${this.icons.closed}`);
        $span.removeClass(this.icons.closed).addClass(this.icons.loading);

        this.getAction(AnnuaireTree.actionsList.beforeShowChildren, service, $button, $span);

        await mel_metapage.Functions.get(
            this.getAction(AnnuaireTree.actionsList.onGetAddress, service, $button, $span),
            {},
            (datas) => {
                //console.log(datas);
                $button.parent().find(".spinner-grow").remove();

                const html_datas = btoa(JSON.stringify(datas));

                let html = "";
                if (datas.elements.length > 0)
                {
                    html += '<ul class="listing iconized settings-default-icon" style="width: max-content;width: -moz-fit-content;">';
                    for (const key in datas.elements) {
                        if (Object.hasOwnProperty.call(datas.elements, key)) {
                            const element = datas.elements[key];
                            const isFolder = element.classes.length !== 0 && element.classes[0] === 'folder';   

                            if (!isFolder && this.getAction(AnnuaireTree.actionsList.ignoreClass, true, element, isFolder, service))
                                continue;

                            html += this.getAction(AnnuaireTree.actionsList.htmlButton, `<li>
                            <button data-servicechildren="${html_datas}" data-element="${btoa(JSON.stringify(element))}" data-service="${element.dn}" data-currentservice=${service} data-uid="${element.uid}" class="mel-button no-button-margin true bckg ${isFolder ? "folder" : ""}"><span><span class="${isFolder ? this.icons.closed : (isPerson ? this.icons.person : this.getAction(AnnuaireTree.actionsList.getUnknownElementIcon, this.icons.notPerson, element, isFolder, service))}"></span> <span class="button-text">${element.html}</span></span></button>
                        </li>`, service, element, isFolder);
                        }
                    }
                    html += "</ul>";
                }

                html = $(html);

                html.find("button").each((i,el) => {
                    $(el).click((e) => {
                        const service = $(e.currentTarget).data("service");
                        this.buttonAction(service, $(e.currentTarget));
                    });
                });

                $button.removeClass("disabled").removeAttr("disabled").parent().append(html);
                $span.addClass(this.icons.opened).removeClass(this.icons.loading);

                this.getAction(AnnuaireTree.actionsList.afterShowChildren, datas, service, $button, $span, html);
            }
        );

        return this;
    }


}

Object.defineProperty(AnnuaireTree, "actionsList", {
    enumerable: false,
    configurable: false,
    writable: false,
    value:{
        beforeSetup:Symbol(),
        afterSetup:Symbol(),
        onAction:Symbol(),
        onCloseFolder:Symbol(),
        onOpenFolder:Symbol(),
        onNotFolderClick:Symbol(),
        beforeShowChildren:Symbol(),
        onGetAddress:Symbol(),
        ignoreClass:Symbol(),
        htmlButton:Symbol(),
        afterShowChildren:Symbol(),
        getUnknownElementIcon:Symbol()
    }
  });