import { Room } from "../../../../mel_metapage/js/lib/chat/chat.js";
import { LastRoomConnector } from "../../../../mel_metapage/js/lib/chat/chatConnectors.js";

export class RocketChatRoomConnector extends LastRoomConnector{
    connect_to_room(last_room) {
        const room = Room.from_event(last_room);
        let template = super.connect_to_room(last_room);
        template.name = room.name;
        template.type = room.public;
        return template;
    }
}