import { UnreadsConnector } from "../../../../mel_metapage/js/lib/chat/chatConnectors.js";

export class RocketChatUnreadConnector extends UnreadsConnector {
    connect_to_unreads(key, value) {
        let template = this._returned_template();
        
        if (!!key) {
            template.key = key;
            template.value = value;
            template.unreads = null;
        }
        else {
            template.unreads = value;
        }
        return template;
    }
}