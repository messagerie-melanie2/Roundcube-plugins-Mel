class Wekan{

    constructor()
    {}

    login()
    {
        return mel_metapage.Functions.post(
            this.url("login"),
            (datas) => {
                console.log("wekan", datas);
            }
        )
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
                console.log("wekan", datas);
            }
        )
    }

    update_user_status()
    {
        return mel_metapage.Functions.post(
            this.url("update_user_status"),
            (datas) => {
                console.log("wekan", datas);
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
                console.log("wekan", datas);
            }
        );
    }

    url(task)
    {
        return mel_metapage.Functions.url("wekan", task);
    }

}

window.wekan = new Wekan();