import { ChatCallback, ChatManager } from "../../../../mel_metapage/js/lib/chat/chatManager";
import { BaseModule } from "../../../js/lib/module";

const MODULE_ID = 'Workspaces';
export class ModuleWorkspaces extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        this._add_listeners()
            ._start();
    }

    _add_listeners() {
        const KEY = MODULE_ID + '_listen';

        ChatManager.Instance().on_mentions_update.add(KEY, ChatCallback.create((...args) => {
            const [helper, key, value, unread] = args;
            if (typeof _on_mention_update !== 'undefined') _on_mention_update(helper, key, value, unread);
        }));
        
        return this;
    }

    _start() {
        const helper = new ChatCallback(null);
        const unreads = ChatManager.Instance().chat().unreads;
        let channel;
        $('.wsp-row-notif').each((i, e) => {
            e = $(e);
            e = Enumerable.from(e.find('button')).where(x => !!$(x).data('channel')).firstOrDefault();
            channel = $(e).data('channel');
            if (!!e) _on_mention_update(helper, channel, unreads.datas[channel] ?? 0);
        });
        channel = null;

        this.select('#wsp-see-all').click(() => {
            this.change_frame('workspace', {
                update:false,
                force_update:false
            });
        });

        return this;
    }

    /**
     * 
     * @param {ChatCallback} helper 
     * @param {string} key 
     * @param {number} value 
     * @param {*} unread 
     */
    _on_mention_update(helper, key, value, unread) {
        let $notif = this.get_workspace_notif_button(key);

        if ($notif.length > 0){
            $notif = $notif.find('.channel-notif');
            if (value > 0) {
                $notif.css('display', '').html(value);

                if (value > 99) $notif.html('99+');
            }
            else $notif.css('display', 'none');
        }

        $notif = null;
    }

    get_workspace_notif_button(id) {
        return this.select_module().find(`[data-channel="${id}"]`);
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}

    /**
     * 
     * @param {ChatCallback} helper 
     * @param {string} key 
     * @param {number} value 
     * @param {*} unread 
     */
function _on_mention_update(helper, key, value, unread) {
    let $notif = helper.select(`[data-channel="${key}"]`).css('display', '');

    if ($notif.length > 0){
        $notif = $notif.find('.channel-notif');
        if (value > 0) {
            $notif.css('display', '').html(value);

            if (value > 99) $notif.html('99+');
        }
        else $notif.css('display', 'none');
    }

    $notif = null;
}