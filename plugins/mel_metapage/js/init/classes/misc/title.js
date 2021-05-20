window.Title = (() => {
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

        async set(title, focus = false)
        {
            await mel_metapage.Functions.callAsync(`window.document.title = '${title}'`);
            await mel_metapage.Functions.callAsync(`$('#${Title.idQuery}').html('${title}')`);
            
            if (focus)
                this.focusHidden();
        }

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