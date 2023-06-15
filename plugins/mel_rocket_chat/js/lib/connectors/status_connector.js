import { StatusConnector } from "../../../../mel_metapage/js/lib/chat/chatConnectors.js";

export class RocketChatStatusConnector extends StatusConnector {
    connect_to_status(status) {
        let template = super.connect_to_status(status);
        template = status;
        return template; 
    }
}