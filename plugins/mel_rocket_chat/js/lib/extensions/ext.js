import { Top } from "../../../../mel_metapage/js/lib/top";
import { IExt } from "../IExt";

let already = false;
export class Ext extends IExt {
    constructor() {
        super();
        //this._add_listener();
    }

    _add_listener() {
        const KEY = 'DROPWHAT';
        if (!Top.has(KEY)) {
            this.select('#user-dropdown').on('', () => {
                if (!already) {
                    already = true;
                    this.mafun();
                }
            })
            Top.add(KEY, true);
        }
        
    }
    
    mafun() {
        this.manager().setStatus();
        this.chat()
    }
}
