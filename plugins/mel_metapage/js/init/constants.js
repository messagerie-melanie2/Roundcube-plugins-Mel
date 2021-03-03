/**
 * Lien du chargement des évènements d'un calendrier.
 */
const ev_calendar_url = '?_task=calendar&_action=load_events';
/**
 * Liste des différents données constantes utile pour le plugin "mel_metapage".
 */
const mel_metapage = {
    /**
     * Liste des différents évènements.
     */
    EventListeners: {
        /**
         * Lorsque le calendrier est mis à jours.
         */
        calendar_updated:new EventListenerDatas("mel_metapage.calendar_updated"),
        /**
         * Lorsque les tâches sont mises à jours. 
         */
        tasks_updated:new EventListenerDatas("mel_metapage.tasks_updated"),
        /**
         * Lorsque les mails sont mis à jours.
         */
        mails_updated: new EventListenerDatas("mel_metapage.mails_updated"),
    },
    /**
     * Différents clés de stockage local.
     */
    Storage: {
        /**
         * Récupère une donnée depuis le stockage local.
         * @param {string} key Clé de la donnée à récupérer.
         */
        get:function(key) {
            return JSON.parse(window.localStorage.getItem(key));
        },
        /**
         * Ajoute ou modifie une donnée dans le stockage local.
         * @param {string} key Clé de la donnée pour la retrouver. 
         * @param {*} item Donnée à sauvegarder.
         */
        set:function(key, item)
        {
            window.localStorage.setItem(key, JSON.stringify(item));
        },
        /**
         * Supprime une donnée dans le stockage local.
         * @param {string} key Clé de la donnée à supprimer.
         */
        remove: function (key){
            window.localStorage.removeItem(key);
        },
        /**
         * Clé des données du calendrier.
         */
        calendar:"mel_metapage.calendar",
        /**
         * Clé des données des tâches.
         */
        tasks:"mel_metapage.tasks",
        /**
         * Clé du nombre de mail non lus.
         */
        mail:"mel_metapage.mail.count",
    },
    /**
     * Liste des symboles.
     */
    Symbols: {
        /**
         * Symboles du plugin "My_Day".
         */
        my_day:{
            /**
             * Symbole "Calendrier", est utilisé pour savoir si il faut mettre à jours uniquement les évènements ou non.
             */
            calendar:Symbol("calendar"),
            /**
             * Symbole "Tâches", est utilisé pour savoir si il faut mettre à jours uniquement les tâches ou non.
             */
            tasks:Symbol("tasks")
        }
    },
    /**
     * Les différents Identifiants
     */
    Ids: {
        /**
         * Ids pour le menu.
         */
        menu:{
            /**
             * Id des différents badges du menu.
             */
            badge:{
                calendar:"menu-badge-calendar",
                tasks:"menu-badge-tasks",
                mail:"menu-badge-mail",
            }
        },
        create:{
            doc_input:"generated-document-input-mel-metapage"
        }
    },
    PopUp:{
        open_ariane: function () {
            if (mel_metapage.PopUp.ariane === null)
                mel_metapage.PopUp.ariane = new ArianePopUp(ArianeButton.default());
            console.log(mel_metapage, window == parent);
            mel_metapage.PopUp.ariane.show();
        },
        ariane:null,
    }

}; 
window.mel_metapage = mel_metapage;