import { Mel_Promise } from "../mel_promise.js";
import { MailFavoriteFolder } from "./mails/favorite_folder.js";
import { FolderColor } from "./mails/folder_color.js";
import { FolderIcon } from "./mails/folder_icon.js";
import { MetapageMailDelayedModule } from "./mails/mail_delayed.js";
import { MetapageModule } from "./metapage_module.js";

export class MetapageMailModule extends MetapageModule {
    constructor() {
        super();
    }

    /**
     * @protected
     * @async Actions principales
     */
    async main() {
        super.main();

        MetapageMailDelayedModule.Start();
        let favorites = MailFavoriteFolder.Start();

        Mel_Promise.wait(() => favorites.load_finished === true, 60).always(() => {
            FolderColor.Start();
            FolderIcon.Start();
        });
    }


}