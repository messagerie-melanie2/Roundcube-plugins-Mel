import { MelObject } from "../../../mel_metapage/js/lib/mel_object.js"
import { WspChatManager } from "./parts/chat_manager.js";

export class MainWorkspace extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        
        for (const iterator of MainWorkspace.MANAGERS) {
            iterator.AddCommands();
            iterator.AddListeners();
            iterator.Start();
        }
    }

}

MainWorkspace.MANAGERS = [
    WspChatManager
];

