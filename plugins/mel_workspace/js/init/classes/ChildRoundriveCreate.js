class ChildRoundriveCreate extends RoundriveCreate
{
    constructor(...args)
    {
        this.init(...args);
    }

    init(itemSelector, buttonParentSelector, foldersSelector, inputNameSelector, inputFolderSelector)
    {
        super.init();
        this.item = $(itemSelector);
        this.buttons = {
            parent:$(buttonParentSelector)
        }
        this.folders = $(foldersSelector);
    
        this.inputs={
            name:$(inputNameSelector),
            folder:$(inputFolderSelector)
        };

        this.after_init();
    }

    after_init(){}

    create_buttons() {}

    create_rd_buttons()
    {
        super.create_buttons();
    }




}
