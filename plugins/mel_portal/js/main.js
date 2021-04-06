const my_day_calendar = () => my_day(mel_metapage.Symbols.my_day.calendar);
const my_day_tasks = () => my_day(mel_metapage.Symbols.my_day.tasks);
$(document).ready(function() {
	if (rcmail)
	{
		rcmail.addEventListener("init", function() {
			// rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, my_day_calendar);
			// rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, my_day_tasks);
            Main();
		})
	}
    // console.log(parent, window, parent == window);
    parent.rcmail.addEventListener(mel_metapage.EventListeners.calendar_updated.after, my_day_calendar);
    parent.rcmail.addEventListener(mel_metapage.EventListeners.tasks_updated.after, my_day_tasks);

    if (parent != window)
    {
        if (parent.FrameUpdate === undefined || parent.FrameUpdate === null)
            parent.FrameUpdate = new ParentUpdate();
        parent.FrameUpdate.add(parent.rcmail.env.current_frame, Update);
        //console.log(parent.FrameUpdate, Update);
    }
});

function Main()
{
    if (window.main === null || window.main === undefined)
        return;
    else
        for (let index = 0; index < window.main._lunch.length; ++index) {
            const element = window.main._lunch[index];
            element();
        }

}

Main.prototype._lunch = [];
Main.Add = function (func)
{
    if (window.main === null || window.main === undefined)
        window.main = new Main();
        window.main._lunch.push(func);
}

function Update(func = null)
{
    if (func !== null)
        Update.Add(func);
    else{
        if (window.update === null || window.update === undefined)
            return;
        else
            for (let index = 0; index < window.update._lunch.length; ++index) {
                const element = window.update._lunch[index];
                element();
            }
    }

}

Update.prototype._lunch = [];
Update.Add = function (func)
{
    if (window.update === null || window.update === undefined)
        window.update = new Update
        window.update._lunch.push(func);
}

function ParentUpdate(id = null)
{
    if (this.funcs === undefined || this.funcs === null)
        this.funcs = {};
    if (id !== null && funcs[id] !== undefined)
        this.funcs[id]();
}

ParentUpdate.prototype.funcs = {};
ParentUpdate.prototype.add = function (key, func)
{
    this.funcs[key] = func;
}
ParentUpdate.prototype.exists = function (key){
    return this.funcs[key] !== undefined;
}

ParentUpdate.prototype.start = function (key) {
    console.log(this, this.func, key);
    return this.funcs[key]();
}