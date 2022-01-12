class Stopwatch
{
    constructor()
    {
        this.startDate = null;
        this.started = false;
    }

    start()
    {
        if (this.started === false)
        {
            this.startDate = moment();
            this.started = false;
        }

        return this;
    }

    stop()
    {
        if (this.started === true)
        {
            this.startDate = false;
            this.started = false;
        }

        return this;
    }

    restart()
    {
        return this.stop().start();
    }

    ellapsed()
    {
        if (this.startDate === null)
            return null;

        return moment() - this.startDate;
    }

    destroy()
    {
        this.startDate = null;
        this.started = null;
        
        return null;
    }

}