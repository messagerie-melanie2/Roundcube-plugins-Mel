const news_rights = {
    super_admin:'q',
    admin:'a',
    publisher:'p'
};

const news_contact_url = window.location.origin + window.location.pathname;

class PopUpSettings{

    constructor()
    {
        if (PopUpSettings.instance !== undefined && PopUpSettings.instance !== null)
            throw "AlreadyExist";

            const _GlobalModalConfig = parent !== window ? parent.GlobalModalConfig : GlobalModalConfig;
            const _GlobalModal = parent !== window ? parent.GlobalModal : GlobalModal;

            let config = new _GlobalModalConfig();
            config.title = 'Chargement...';
            config.content = `<center><span class="spinner-grow"><span class="sr-only">Chargement....</span></span></center>`;
            config.footer = '<button disabled class="disabled nfooter-button cancel-button mel-button btn btn-danger">Annuler <span class="plus icon-mel-undo"></span></button><button disabled class="disabled nfooter-button save-button mel-button btn btn-secondary">Sauvegarder <span class="plus icon-mel-pencil"></span></button>';
            this.modal = new _GlobalModal("globalModal", config);

            this.modal.modal.find("button.nfooter-button").css("margin-top", "45px");
            this.modal.modal.find("button.nfooter-button.save-button").click(() => {
                //this.modal.close();
                this.save();
            });

            this.modal.modal.find("button.nfooter-button.cancel-button").click(() => {
                this.modal.close();
            });

            this.modal.onClose(() => {
                if (rcmail.env.news_settings_rights_edited !== undefined)
                {
                    rcmail.env.news_settings_rights_edited = {};
                }

                this.modal.modal.find(".global-modal-body").css("height", "");
            })
    }

    /**
     * 
     * @returns {PopUpSettings}
     */
    static Instance()
    {
        if (PopUpSettings.instance === undefined || PopUpSettings.instance === null)
            PopUpSettings.instance = new PopUpSettings();
        
        return PopUpSettings.instance;
    }

    setupRight(service ,user = null)
    {

        const setter = service;
        service = "ou=organisation";

        const username = "";

        this.modal.editTitle(user === null ? "Gérer les droits utilisateurs" : `Modifier les droits de ${username}`);
        this.modal.modal.find(".global-modal-body").css("height", `${window.outerHeight / 1.8}px`);
        let html = '<table class="table table-striped table-bordered"><tr><td><span><span class="icofont-crown"></span> : Admin et publieur</span></td><td><span><span class="icon-mel-check"></span> : Admin</span></td><td><span><span class="icon-mel-compose"></span> : Publieur</span></td></tr></table>';
        html += '<div class="row mel-r" style="height:100%">';
        html += `<div style="height:100%;overflow:auto;" class="col-6 mel-left-pannel" id=left-ul>
<h3 style="margin-top:15px;position: sticky;/*! top: 0; */left: 0;">Sélectionnez un utilisateur</h3>
        <div class="" style="position: sticky;/*! top: 0; */left: 0;">
        <textarea name="_to_newsright" spellcheck="false" id="to-newsright" tabindex="-1" data-recipient-input="true" style="position: absolute; opacity: 0; left: -5000px; width: 10px;" autocomplete="on" aria-autocomplete="list" aria-expanded="false" role="combobox"></textarea>
        <ul id="wspf" class="listing iconized settings-default-icon">
            <li class="">
                <!--Participants à ajouter-->
                <input class="form-control input-mel"  placeholder="Entrez le nom d'une personne" id="news-user-list" onchange="m_mp_autocoplete(this, (args) => rcmail.command('news.settings.onAutoComplete', args), false)" oninput="//m_mp_autocoplete(this, (args) => rcmail.command('news.settings.onAutoComplete', args), false)" type="text" autocomplete="on" aria-autocomplete="list" aria-expanded="false" role="combobox">
            </li>
        </ul>
    </div>

        <ul class="listing iconized settings-default-icon hidden" id="searched-ul">
        </ul>
            <ul class="listing iconized settings-default-icon" style="width: max-content;width: -moz-fit-content;">
                <li class="deleteplz">
                    <button style="display:none" data-setter=${setter} data-service="${service}" class="mel-button no-button-margin true bckg folder"><span><span class="icon-mel-chevron-right"></span> <span class="currentRight"></span> ${rcmail.env.services_names[service]/*service.split(",")[0].split("=")[1]*/}</span></button>
                </li>
            </ul>
        </div>
        <div id="sn-right-datas" class="col-6 mel-right-pannel" style="width: 100%;overflow: auto;height: 100%;"></div>`;
        html += "</div>";

        this.modal.editBody(html);

        let $lonelyButton = this.modal.modal.find("ul button");
        $lonelyButton.click((e) => {
            const service = $(e.currentTarget).data("service");
            this.buttonAction(service, $(e.currentTarget));
        });

        this.buttonAction(service, $lonelyButton).then(() => {
            let $delete = this.modal.modal.find(".deleteplz");
            let $parent = $delete.parent().parent();
            $delete.find("ul").first().appendTo($parent);
            $delete.parent().remove();
        });

        parent.rcmail.init_address_input_events(this.modal.modal.find("input#news-user-list"));

        this.modal.show();

        return this;
    }

    async buttonAction(service, $button)
    {
        const canDeploy = $button.hasClass("folder");
        
        if (canDeploy)
        {
            const isDeployed = $button.find(".icon-mel-chevron-right").length === 0;
            let $ul = $button.parent().find('ul').first();

            if (isDeployed)
            {
                $ul.css("display", "none");
                $button.find(".icon-mel-chevron-down").removeClass("icon-mel-chevron-down").addClass("icon-mel-chevron-right");
            }
            else if ($ul.length > 0)
            {
                $ul.css("display", "");
                $button.find(".icon-mel-chevron-right").removeClass("icon-mel-chevron-right").addClass("icon-mel-chevron-down");
            }
            else await this.showChildren(service, $button, $button.data("setter"));
        }
        else await this.personAction($button.data("setter"), $button);
    }

    async personAction(service, $button)
    {   
        const end = ',dc=equipement,dc=gouv,dc=fr';
        const ul_classes = 'listing iconized settings-default-icon';
        const datas = $button.data("element") === undefined ? "" : JSON.parse(atob($button.data("element")));
        //const service_all_datas = JSON.parse(atob($button.data("servicechildren")));
        const currentRights = rcmail.env.news_settings_rights[datas.uid];

        if (service.includes(end))
            service = service.replace(end, '');

        const right_icon = currentRights !== undefined && currentRights[service] !== undefined ? (currentRights[service] === news_rights.super_admin ? "icofont-crown" : (currentRights[service] === news_rights.admin ? "icon-mel-check" : "icon-mel-compose")) : "";

        let $panel = this.modal.modal.find("#sn-right-datas");
        let html = `<center><h3>${datas.html}</h3></center>`;

        html += `
        <div style="width: 100%;margin-top:15px;" role="tablist" aria-label="Actions" class="mel-ui-tab-system">
                <button id="tree-rights" role="tab" aria-selected="true" aria-controls="tree-rights-panel" class="tab-newssetact mel-tab mel-tabheader active btn btn-secondary">Ajout/Modification</button>

                <button id="resum-rights" role="tab" aria-selected="false" aria-controls="resum-rights-panel"  class="tab-newssetact mel-tab mel-tabheader last btn btn-secondary" tabindex="-1">Résumé</button>
            </div>
        `

        html += '<div tabindex="0" role="tabpanel" id="tree-rights-panel" style="width: max-content;" class="tree-rights tab-newssetact mel-tab-content">';

        html += `<ul class="${ul_classes}">
            <li>
                    <button data-uid="${datas.uid}" data-parent=${service} data-service=${service} class="mel-button no-button-margin true bckg expanding"><span class="icon-mel-chevron-right"></span></button>
                    <button data-uid="${datas.uid}" data-parent=${service} data-service=${service} class="mel-button no-button-margin true bckg action"><span class="btnright ${right_icon}"></span>${rcmail.env.services_names[service]}</button>
            
        <ul class="${ul_classes}" style="display:none">`;

       // html =  this.ulShowHtmlChildren(html, service_all_datas.elements, service, datas.uid);

        html += '</ul></li></ul>';

        html += `</div><div tabindex="0" role="tabpanel" id="resum-rights-panel" style="display:none;" class="resum-rights tab-newssetact mel-tab-content"></div>`

        $panel.html(html);

        this.createActions($panel);

        $panel.find("#resum-rights-panel").html(this.createResume(datas.uid));

        parent.MEL_ELASTIC_UI.update_tabs();
    }

    createResume(uid)
    {
        let html = '<table class="table table-striped table-bordered"><thead><tr><td>Service</td><td>Droit</td></tr></thead><tbody>';

        if (rcmail.env.news_settings_rights_edited !== undefined)
        {
            for (const key in rcmail.env.news_settings_rights_edited[uid]) {
                if (Object.hasOwnProperty.call(rcmail.env.news_settings_rights_edited[uid], key)) {
                    const element = rcmail.env.news_settings_rights_edited[uid][key];

                    if (element === null)
                        continue;

                    html += `<tr><td>${key.split(",")[0].split("=")[1]}</td>
                    <td><span class="${this.showCurrentRight(key, key, uid)}"></span></td></tr>`;
                }
            }
        }

        for (const key in rcmail.env.news_settings_rights[uid]) {
            if (Object.hasOwnProperty.call(rcmail.env.news_settings_rights[uid], key)) {
                const element = rcmail.env.news_settings_rights[uid][key];

                if (rcmail.env.news_settings_rights_edited !== undefined && rcmail.env.news_settings_rights_edited[uid] !== undefined && rcmail.env.news_settings_rights[uid][key] !== undefined)
                    continue;

                html += `<tr><td>${key.split(",")[0].split("=")[1]}</td>
                <td><span class="${this.showCurrentRight(key, key, uid)}"></span></td></tr>`;
            }
        }

        return html + '</tbody></table>';
    }

    createActions($panel)
    {
        $panel.find("button.expanding").each((i,e) => {
            $(e).click(() => {
                let $ul = $(e).parent().find("ul").first();

                //console.log($(e), $ul);

                const mustSearch = $ul.find("li").length === 0;
                let $span = $(e).find("span");

                if (mustSearch)
                {
                    $ul.html('<li><span class="spinner-grow"></span></li>').css("display", "");
                    $span.removeClass("icon-mel-chevron-right").addClass("icon-mel-dots");
                    $(e).addClass("disabled").attr("disabled", "disabled");

                    let service = $(e).data("service");
                    const end = ',dc=equipement,dc=gouv,dc=fr';

                    if (!service.includes(end))
                        service += end;


                    mel_metapage.Functions.get(
                        `${news_contact_url}?_task=addressbook&_is_from=iframe&_action=plugin.annuaire&_source=amande&_base=${btoa(service)}&_remote=1`,
                        {},
                        (datas) => {
                            //console.log("datas", datas.elements, service, $(e), $(e).data("uid"));
                            let html = this.ulShowHtmlChildren("", datas.elements, service, $(e).data("uid"));

                            html = $(html);
                            $ul.html(html);

                            if ($ul.find("li").length > 0)
                            {
                                this.createActions($ul);
                                $span.addClass("icon-mel-chevron-down").removeClass("icon-mel-dots");
                            }
                            else{
                                $(e).css("pointer-events", "none");
                            }

                            $(e).removeClass("disabled").removeAttr("disabled");
                            
                        }
                    );
                }
                else {
                    if ($(e).find("span").hasClass("icon-mel-chevron-right")) 
                    {
                        $ul.css("display", "");
                        $span.removeClass("icon-mel-chevron-right").addClass("icon-mel-chevron-down");
                    }
                    else 
                    {
                        $ul.css("display", "none");
                        $span.addClass("icon-mel-chevron-right").removeClass("icon-mel-chevron-down");
                    }
                }

            });
        });

        $panel.find("button.action").each((i,e) => {
            e = $(e);
            e.click(() => {
                const sa = 'icofont-crown';
                const a = 'icon-mel-check';
                const p = 'icon-mel-compose';
                let $span = e.find(".btnright");
                const current = this.elementIsRight($span);
                const service = e.data("service");
                const uid = e.data("uid");
                let newRight = null;

                if (current === null)
                {
                    $span.addClass(p);
                    newRight = news_rights.publisher;
                }
                else if (current === news_rights.publisher)
                {
                    $span.removeClass(p).addClass(a);
                    newRight = news_rights.admin;
                }
                else if (current === news_rights.admin)
                {
                    $span.removeClass(a).addClass(sa);
                    newRight = news_rights.super_admin;
                }
                else
                {
                    $span.removeClass(sa);
                    newRight = undefined;
                }

                this.addVisuToChild(e, newRight);

                 if (rcmail.env.news_settings_rights_edited === undefined)
                     rcmail.env.news_settings_rights_edited = {};

                 if (rcmail.env.news_settings_rights_edited[uid] === undefined)
                     rcmail.env.news_settings_rights_edited[uid] = {};

                rcmail.env.news_settings_rights_edited[uid][service] = newRight === undefined ? null : newRight;

                console.log("settings", uid, service, rcmail.env.news_settings_rights_edited, newRight);

                if (this.oooooooooooo === undefined)
                {
                    this.modal.modal.find(".nfooter-button").removeClass("disabled").removeAttr("disabled");
                    this.oooooooooooo = true;
                }

                this.modal.modal.find("#resum-rights-panel").html(this.createResume(uid));

            });
        });

    }

    elementIsRight($element)
    {
        if ($element.hasClass('icofont-crown'))
            return news_rights.super_admin;
        else if ($element.hasClass('icon-mel-check'))
            return news_rights.admin;
        else if ($element.hasClass('icon-mel-compose'))
            return news_rights.publisher;
        else
            return null;
    }

    async addVisuToChild($button, newRight)
    {
        const power = [null, news_rights.publisher, news_rights.admin, news_rights.super_admin, undefined];
        const sa = 'icofont-crown';
        const a = 'icon-mel-check';
        const p = 'icon-mel-compose';
        $button.parent().find("ul li .btnright").each((i, e) => {
            e = $(e);

            //console.log(newRight, this.elementIsRight(e), power.indexOf(newRight), power.indexOf(this.elementIsRight(e)), power.indexOf(newRight) > power.indexOf(this.elementIsRight(e)), (power.indexOf(newRight) === 1 ? p : (power.indexOf(newRight) === 2 ? a : (power.indexOf(newRight) === 3 ? sa : ""))));

            if (power.indexOf(newRight) > power.indexOf(this.elementIsRight(e)))
                e.parent().click();//e.removeClass(p).removeClass(sa).removeClass(a).addClass((power.indexOf(newRight) === 1 ? p : (power.indexOf(newRight) === 2 ? a : (power.indexOf(newRight) === 3 ? sa : ""))));
        });
    }

    ulShowHtmlChildren(html, array, parent, uid)
    {
        const end = ',dc=equipement,dc=gouv,dc=fr';
        if (parent.includes(end))
            parent = parent.replace(end, '');

        //const currentRights = rcmail.env.news_settings_rights[uid];
        //const parent_right_icon = currentRights !== undefined && currentRights[parent] !== undefined ? (currentRights[parent] === news_rights.super_admin ? "icofont-crown" : (currentRights[parent] === news_rights.admin ? "icon-mel-check" : "icon-mel-compose")) : "";

        const ul_classes = 'listing iconized settings-default-icon';
        for (const key in array) {
            if (Object.hasOwnProperty.call(array, key)) {
                const element = array[key];
                
                if (element.classes.length > 0 && element.classes[0] === "folder")
                {
                    if (element.dn.includes(end))
                        element.dn = element.dn.replace(end, '');

                    const right_icon = this.showCurrentRight(parent, element.dn, uid);//( currentRights !== undefined && currentRights[element.dn] !== undefined ? (currentRights[element.dn] === news_rights.super_admin ? "icofont-crown" : (currentRights[element.dn] === news_rights.admin ? "icon-mel-check" : "icon-mel-compose")) : (parent_right_icon !== "" ? parent_right_icon : ""));

                    html += `<li>
                    <button data-uid="${uid}" data-parent="${parent}" data-service=${element.dn} class="mel-button no-button-margin true bckg expanding"><span class="icon-mel-chevron-right"></span></button>
                    <button data-uid="${uid}" data-service=${element.dn} class="mel-button no-button-margin true bckg action"><span class="btnright ${right_icon}"></span><span>${element.html}</span></button>`

                    html += `<ul class="${ul_classes}" style="display:none">`;
                    html = this.ulShowHtmlChildren(html, element.children, element.dn, uid);
                    html += `</ul></li>`;
                }
            }
        }

        return html;
    }

    showCurrentRight(parent, dn, uid)
    {
        const currentRights = (rcmail.env.news_settings_rights_edited !== undefined && rcmail.env.news_settings_rights_edited[uid] !== undefined ? rcmail.env.news_settings_rights_edited[uid] : rcmail.env.news_settings_rights[uid]);
        const parent_right_icon = currentRights !== undefined && currentRights[parent] !== undefined ? (currentRights[parent] === news_rights.super_admin ? "icofont-crown" : (currentRights[parent] === news_rights.admin ? "icon-mel-check" : (currentRights[parent] === news_rights.publisher ? "icon-mel-compose" : ""))) : "";
        //console.log("[showCurrentRight]", parent, dn, currentRights, parent_right_icon, (currentRights !== undefined && currentRights[dn] !== undefined ? (currentRights[dn] === news_rights.super_admin ? "icofont-crown" : (currentRights[dn] === news_rights.admin ? "icon-mel-check" : "icon-mel-compose")) : (parent_right_icon !== "" ? parent_right_icon : "")));
        return (currentRights !== undefined && currentRights[dn] !== undefined ? (currentRights[dn] === news_rights.super_admin ? "icofont-crown" : (currentRights[dn] === news_rights.admin ? "icon-mel-check" : (currentRights[dn] === news_rights.publisher ? "icon-mel-compose" : ""))) : (parent_right_icon !== "" ? parent_right_icon : ""));
    }

    async showChildren(service, $button, setterService)
    {
        const end = ',dc=equipement,dc=gouv,dc=fr';

        if (!service.includes(end))
            service += end;

        let $span = $button.addClass("disabled").attr("disabled", "disabled").parent().append('<span style="display:block;" class="spinner-grow"><span class="sr-only">Chargement....</span></span>').find(".icon-mel-chevron-right");
        $span.removeClass("icon-mel-chevron-right").addClass("icon-mel-dots");

        await mel_metapage.Functions.get(
            `${news_contact_url}?_task=addressbook&_is_from=iframe&_action=plugin.annuaire&_source=amande&_base=${btoa(service)}&_remote=1`,
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
                            const isPerson = !isFolder && element.classes.length > 0 && element.classes[0].includes("person");

                            if (!isPerson && !isFolder)
                                continue;
                            else if (isPerson && rcmail.env.username === element.uid)
                                continue;

                            html += `<li>
                                <button data-servicechildren="${html_datas}" data-element="${btoa(JSON.stringify(element))}" data-setter="${setterService}" data-service="${element.dn}" data-currentservice=${service} data-uid="${element.uid}" class="mel-button no-button-margin true bckg ${isFolder ? "folder" : ""}"><span><span class="${isFolder ? "icon-mel-chevron-right" : (isPerson ? "icon-mel-user" : "icon-mel-intranet")}"></span> <span class="currentRight"></span> ${element.html}</span></button>
                            </li>`;
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
                $span.addClass("icon-mel-chevron-down").removeClass("icon-mel-dots");
            }
        );
    }

    async onPersonInputSelected(args)
    {
        let val = args.val.replace(',', "");
        let $input = args.$element;
        $input.val("");

        if (val.includes('<')) val = val.split("<")[1].split('>')[0];

        //check if user exist
        parent.rcmail.set_busy(true);
        parent.rcmail.display_message("Vérification de l'utilisateur...", "loading"),
        this.modal.modal.find("#left-ul button").addClass("disabled").attr("disabled", "disabled");

        await mel_metapage.Functions.post(
            mel_metapage.Functions.url("news", 'check_user'),
            {
                _uid:val
            }, 
            (datas) => {
                //console.log(datas, "result");
                if (datas !== "false")
                {
                    //On affiche l'utilisateur
                    this.personAction(this.getSetter(), $(`<button data-element="${btoa(datas)}"></button>`));
                }
            }
        )

        this.modal.modal.find("#left-ul button").removeClass("disabled").removeAttr("disabled");
        parent.rcmail.set_busy(false);
        parent.rcmail.clear_messages();

    }

    getSetter()
    {
        if (this.setter === undefined)
        {
            this.modal.modal.find("button").each((i,e) => {

                if (this.setter !== undefined)
                    return;

                e = $(e);
                if (e.data("setter") !== undefined)
                    this.setter = e.data("setter");
            });
            
        }

        return this.setter;

    }

    save()
    {
        parent.rcmail.set_busy(true, "loading");
        const users_rights = rcmail.env.news_settings_rights_edited;
        let array = {};
        
        for (const key in users_rights) {
            if (Object.hasOwnProperty.call(users_rights, key)) {
                const element = users_rights[key];
                array[key] = this._checkUserForSave(element);
            }
        }
        mel_metapage.Functions.post(
            mel_metapage.Functions.url("news", "update_rights"),
            {
                _array:array
            },
            (datas) => {
                this.modal.close();
                window.location.reload();
            },
            (a,b,c) => {
                parent.rcmail.set_busy(false);
                parent.rcmail.clear_messages();
                this.modal.close();
            }
        )
    }

    _checkUserForSave(rights)
    {

        let arrayDelete = [];

        for (const element in rights) {
                for (const test in rights) {

                        
                        if (element === test)
                            continue;

                        if (test.includes(element) && !arrayDelete.includes(test) && rights[element] === rights[test])
                        {
                            rights[test] = null;
                        }    //arrayDelete.push(test);
                    
                }  
        }


        return rights;//Enumerable.from(rights).where(x => !arrayDelete.includes(x.key)).toArray();

    }
}


$(document).ready(() => {

    rcmail.addEventListener("init", () => {
        rcmail.register_command("news.settings.add.rights", (service) => {
            PopUpSettings.Instance().setupRight(service);
        }, true);

        rcmail.register_command("news.settings.edit.rights", async (args) => {
            const service = args.service;
            const val = args.button.data("uid");
            parent.rcmail.set_busy(true);
            parent.rcmail.display_message("Chargement des données...", "loading"),
            //this.modal.modal.find("#left-ul button").addClass("disabled").attr("disabled", "disabled");
    
            await mel_metapage.Functions.post(
                mel_metapage.Functions.url("news", 'check_user'),
                {
                    _uid:val
                }, 
                (datas) => {
                    if (datas !== "false")
                    {
                        //On affiche l'utilisateur
                        PopUpSettings.Instance().setupRight(service).personAction(PopUpSettings.Instance().getSetter(), $(`<button data-element="${btoa(datas)}"></button>`));
                    }
                }
            )
    
            //this.modal.modal.find("#left-ul button").removeClass("disabled").removeAttr("disabled");
            parent.rcmail.set_busy(false);
            parent.rcmail.clear_messages();
        }, true);

        parent.rcmail.register_command("news.settings.onAutoComplete", (args) => {
            PopUpSettings.Instance().onPersonInputSelected(args);
        }, true);
    });
});