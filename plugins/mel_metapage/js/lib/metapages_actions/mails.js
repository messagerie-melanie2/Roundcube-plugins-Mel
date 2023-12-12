import { MailFavoriteFolder } from "./mails/favorite_folder.js";
import { FolderColor } from "./mails/folder_color.js";
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
        MailFavoriteFolder.Start();
        FolderColor.Start();
    }


}