
$(document).ready(() => {
    (() => {

        class mel_news_UI
        {
            constructor()
            {
                this.buttons = {
                    $filter:$("#news-button-filter"),
                    $sort:$("#news-button-sort"),
                    $add:$("#news-button-add"),
                    $publish:$("#news-button-publish")
                };
            }
        }
    
        window.news_ui = new mel_news_UI();
    
    })();
});