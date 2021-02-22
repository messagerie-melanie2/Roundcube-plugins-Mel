/**
 * String des différents listeners pour rcmail.
 */
class EventListenerDatas
{
    /**
     * 
     * @param {string} event Evènement par défaut
     * @param {string} before Trigger à appeler avant l'évènement
     * @param {string} after Trigger à appeler après l'évènement.
     */
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