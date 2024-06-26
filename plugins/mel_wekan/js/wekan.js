class Wekan{

    constructor()
    {
        this.tokenName = `Meteor.loginToken:/:/${rcmail.env.wekan_storage_end}`;
        this.tokenId = `Meteor.userId:/:/${rcmail.env.wekan_storage_end}`;
    }

    login()
    {
        return mel_metapage.Functions.post(
            this.url("login"),
            {
                currentUser:true
            },
            (datas) => {
                try {
                    datas = JSON.parse(datas);
                    datas = JSON.parse(datas.content);
                    const token = this.tokenName;

                    //mel_metapage.Storage.set(token, datas.authToken, false);
                    localStorage.setItem(token, datas.authToken);
                } catch (error) {
                }
            }
        ).then(e => JSON.parse(e).httpCode === 200 && localStorage.getItem(this.tokenName) !== null);
    }

    isLogged()
    {
        return localStorage.getItem(this.tokenName) !== null;
    }

    create_board(title, isPublic, color = null)
    {
        return mel_metapage.Functions.post(
            this.url("create_board"),
            {
                _title:title,
                _isPublic:isPublic,
                _color:color
            },
            (datas) => {
                //console.log("wekan", datas);
            }
        )
    }

    update_user_status()
    {
        return mel_metapage.Functions.post(
            this.url("update_user_status"),
            (datas) => {
                //console.log("wekan", datas);

                
            }
        );
    }

    check_board()
    {
        return mel_metapage.Functions.post(
            this.url("check_board"),
            {
                _board:"pSSkHJ6wb64ZS2gxE"
            },
            (datas) => {
                //console.log("wekan", JSON.parse(datas));



            }
        );
    }

    url(task)
    {
        return mel_metapage.Functions.url("wekan", task);
    }

}

window.wekan = new Wekan();

$(document).ready(async () => {

    if (rcmail.env.task === "wekan" && (rcmail.env.action === "" || rcmail.env.action === "index"))
    {

        $("#wekan-iframe")[0].src = rcmail.env.wekan_startup_url != null && rcmail.env.wekan_startup_url !== undefined ? rcmail.env.wekan_startup_url : rcmail.env.wekan_base_url;

        if (!wekan.isLogged())
        {
            if (await wekan.login())
            {             
                window.addEventListener('storage', (e) => {
                    if (e.key === wekan.tokenId)
                    {
                        if (rcmail.env.wekan_startup_url != null && rcmail.env.wekan_startup_url !== undefined) $("#wekan-iframe")[0].src = rcmail.env.wekan_startup_url;
                        else $("#wekan-iframe")[0].contentWindow.location.reload();
                    }
                  });

                  if (rcmail.env.wekan_startup_url != null && rcmail.env.wekan_startup_url !== undefined) $("#wekan-iframe")[0].src = rcmail.env.wekan_startup_url;
            }
            else
                rcmail.display_message("Impossible de se connecter au kanban !", "error");
        }
    }

});