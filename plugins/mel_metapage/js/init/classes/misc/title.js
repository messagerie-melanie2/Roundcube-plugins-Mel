window.Title = (() => {
    /**
     * Gère le titre de la page.
     */
    class Title
    {
        constructor()
        {
            Object.defineProperty(this, 'is_framed', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: parent !== window
              });
              Object.defineProperty(this, 'defaultTitle', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: window.document.title
              });
        }

        /**
         * Met à jours le titre de la page.
         * @param {string} id Si il ne vaut pas nul, il met à jours le titre de la page via le titre d'une frame. 
         * Sinon, il met à jours le titre html ou le titre de la page en fonction de si on est appelé via une frame ou non.
         * @param {boolean} focus si vrai, focus le titre html de la page après avoir mis à jours le titre.
         * @returns {void}
         */
        update(id = null, focus = false)
        {
            let doFocus = false;

            try {

                if (id !== null)
                {
                    if (this.is_framed)
                        mel_metapage.Functions.call(`Title.set($("iframe#${id}")[0].contentWindow.document.title, ${focus})`);
                    else
                        this.set($(`iframe#${id}`)[0].contentWindow.document.title, focus);
                }
                else if (this.is_framed)
                    this.set(window.document.title, focus);
                else
                {
                    $(`#${Title.idQuery}`).html(window.document.title);
                    doFocus = true;
                }

            } catch (error) {
                //console.error("###[Title.update]",error, this);
            }

            if (focus && doFocus)
                this.focusHidden();
        }

        async updateAsync(id = null, focus = false)
        {
            let doFocus = false;

            try {

                if (id !== null)
                {
                    if (this.is_framed)
                        await mel_metapage.Functions.callAsync(`await Title.set($("iframe#${id}")[0].contentWindow.document.title, ${focus})`);
                    else
                        await this.set($(`iframe#${id}`)[0].contentWindow.document.title, focus);
                }
                else if (this.is_framed)
                    await this.set(window.document.title, focus);
                else
                {
                    $(`#${Title.idQuery}`).html(window.document.title);
                    doFocus = true;
                }

            } catch (error) {
                //console.error("###[Title.update]",error, this);
            }

            if (focus && doFocus)
                this.focusHidden();
        }

        /**
         * Met à jours le titre du navigateur ainsi que le titre html.
         * @async
         * @param {string} title Nouveau titre.
         * @param {boolean} focus Si vrai, le titre html est focus après le changement de titre.
         */
        async set(title, focus = false)
        {
            await mel_metapage.Functions.callAsync(`window.document.title = '${title}';$('#${Title.idQuery}').html('${title}');`);

            if (focus)
                this.focusHidden();
        }

        /**
         * Focus le titre html caché.
         */
        focusHidden()
        {
            if (this.is_framed)
                mel_metapage.Functions.call('Title.focusHidden()');
            else
                $(`#${Title.idQuery}`).focus();
            
        }
    }

    Object.defineProperty(Title, 'idQuery', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: "sr-document-title-focusable"
      });

    return new Title();
})();