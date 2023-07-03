export {MetapageFrames, metapage_frames as frames};

class MetapageFrames {
    constructor()
    {
        this._events = {};
        this._break = false;
    }

    open(key, changePage = true)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
    }

    break()
    {
        this._break = true;
    }

    unbreak()
    {
        this._break = false;
    }

    async openAsync(key, changePage = true, delay_ms = 500)
    {
        mm_st_OpenOrCreateFrame(key, changePage);
        while (!rcmail.env.frame_created) {
            await delay(delay_ms)
        }
        return true;
    }

    addEvent(key, event, ignore_context = false)
    {
        if (ignore_context)
        {
            event = {
                ignore_context:true,
                ev:event
            };
        }

        if (this._events[key] === undefined)
            this._events[key] = [];
        this._events[key].push(event);
    }

    triggerEvent(key, ...args)
    {
        if (this._events[key] === undefined || this._break)
            return;
        else {
            let result = null;

            for (let index = 0; index < this._events[key].length; index++) {
                const element = typeof this._events[key][index] != 'function' && this._events[key][index]?.ignore_context ? eval(this._events[key][index].ev + '') : this._events[key][index];
                try {

                    if (index === 0)
                        result = element(...args);
                    else {
                        if (result !== null && result !== undefined)    
                            result = element(...[...args, result]);
                        else
                            result = element(...args);
                    }  
                } catch (error) {
                    console.error(error);
                }

                if (result === "break")
                {
                    this.break();
                    break;
                }
            }
            
            return result;
        }
    }
}

var metapage_frames = metapage_frames || new MetapageFrames();