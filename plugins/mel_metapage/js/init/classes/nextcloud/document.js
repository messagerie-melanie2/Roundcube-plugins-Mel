var nextcloud_document = (() => {
    class Nextcloud_Icon {
        constructor(templateIcon, trueIcon, type = null)
        {
            this.type = templateIcon;
            this.icon = trueIcon;
            if (templateIcon === null && type !== null)
                this.init(type);
        }

        check(icon)
        {
            //console.log(icon.icon, this.type, icon.icon === this.type);
            if (icon.icon === this.type)
            {
                icon.icon = this.icon;
                icon.break = true;
                //console.log("edited icon", icon)
            }
            return icon;
        }

        async init(type)
        {
            await wait(() => window.rcmail === undefined);
            for (let index = 0; index < window.rcmail.env.mel_metapage_templates_doc.length; index++) {
                const element = window.rcmail.env.mel_metapage_templates_doc[index];
                if (element.type === type)
                {
                    this.type = element.icon;
                    break;
                }
            }
        }
    }
    class Nextcloud_Document_Config
    {
        constructor(type, icontTemplate, iconClass, href, app, ...config_modifier)
        {
            this.type = type;
            this.icon = new Nextcloud_Icon(icontTemplate, iconClass, type);
            this.href = href;
            this.app = app;
            this.config_modifier = config_modifier;
        }
    }
    class Nextcloud_Document {
        constructor()
        {
            this.datas = [];
        }

        addRaw(type,iconClass, href)
        {
            this.datas.push(new Nextcloud_Document_Config(type, null, iconClass, href, null));
        }

        addApp(type, iconClass, href, app, ...config_modifier)
        {
            this.datas.push(new Nextcloud_Document_Config(type, null,iconClass, href, app, ...config_modifier));
        }

        getIcon(icon)
        {
            if (this.datas.length === 0)
                return icon;
            icon = {icon:icon, break:false};
            for (let index = 0; index < this.datas.length; index++) {
                const element = this.datas[index];
                const _icon = element.icon.check(icon);
                if (_icon.break) 
                {
                    icon = _icon.icon;
                    break;
                }
            }
            return icon;
        }

        async createDocument(type, nextcloud, embed_datas, config_modifier_func)
        {
            for (let index = 0; index < this.datas.length; index++) {
                const element = this.datas[index];
                if (element.type === type)
                {
                    let config;
                    let modifiers = null;
                    if (element.config_modifier !== null)
                        modifiers = element.config_modifier;
                    if (element.app !== null)
                        config = config_modifier_func(element.app, embed_datas.val, embed_datas.href, modifiers);
                    else if (element.config_modifier)
                        config = (conf) => {
                            if (modifiers !== null && modifiers.length > 0)
                            {
                                if (modifiers.length === undefined)
                                    conf = modifiers(embed_datas.val, embed_datas.href, config);
                                else if (modifiers.length === 1)
                                    conf = modifiers[0](embed_datas.val, embed_datas.href, config);
                                else {
                                    for (let j = 0; j < modifiers.length; j++) {
                                        const element = modifiers[j];
                                        conf = element(embed_datas.val, embed_datas.href, config);
                                    }
                                }
                            }
                            return conf;
                        };
                    return nextcloud.createDocument(embed_datas.val, null, (element.href === null ? null : (typeof element.href === "function" ? element.href(embed_datas) : element.href)), config, embed_datas.path).then(() => {
                        console.log("created");
                        return true;
                    });
                }
            }
            return false;
        }
    }
    return new Nextcloud_Document();
})();