class EventListenerDatas
{
    constructor(event, before = null, after = null)
    {
        this.get = event;
        if (before === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               before = tmp[0] + ".before." + tmp[1];
           } 
        }
        this.before = before;
        if (after === null)
        {
           if (event.includes("."))
           {
               let tmp = event.split(".");
               after = tmp[0] + ".after." + tmp[1];
           } 
        }
        this.after = after;
    }

    toString()
    {
        return this.get;
    }
}