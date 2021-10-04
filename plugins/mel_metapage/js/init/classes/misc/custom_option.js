
class OptionObject
{
    constructor(text, command, _class = OptionObject.objectClass, title = "")
    {
        this.init();
        this.setup(text, command, _class, title);
    }

    init(){
        this.text = "";
        this.class = OptionObject.objectClass;
        this.title = "";
        this.command = "";
    }

    setup(text, command, _class, title)
    {
        this.text = text;
        this.command = command;

        if (_class === undefined)
            _class = "";

        if (_class.includes(OptionObject.objectClass))
            this.class = _class;
        else 
            this.class += _class;

        this.title = title === undefined ? "" : title;
    }

    toString()
    {
        return `
        <li role="menuitem">
            <a title="${this.title}" class="${this.class}"  role="button" tabindex="-1" href="#" onclick="${this.command}">${this.text}</a>
        </li>
        `;
    }
}

OptionObject.objectClass = " optionObject ";
/**
 * 
 * @param {{text:string, command:string, class:string, title:string}} object 
 * @returns {OptionObject}
 */
OptionObject.fabric = (object) => {
    return new OptionObject(object.text, object.command, object.class, object.title);
};

class CustomOption {
    constructor({
        selector = "#groupoptions-custom-a",
        ulSelector = "#ul-option-custom",
        options = []
    })
    {
        this.init();
        this.setup(selector, ulSelector, options);
    }

    init() {
        this.opener = $();
        this.list = $();
        this.options = [];
    }

    setup(selector, ul, options)
    {
        this.opener = $(selector);
        this.list = $(ul);
        this.set(options).draw();
    }

    set(options)
    {
        for (const key in options) {
            if (Object.hasOwnProperty.call(options, key)) {
                const element = options[key];
                
                if (element.setup === undefined)
                    this.options.push(OptionObject.fabric(element));
                else
                    this.options.push(element);
            }
        }

        return this;
    }

    setPosition(x,y)
    {
        this.opener.css("position", "absolute")
        .css("right", `${x}px`)
        .css("left", `${x}px`);

        return this;
    }

    appendTo(querry)
    {
        this.opener.css("position", "").appendTo(querry);
    }

    draw()
    {
        this.list.html("");
        for (let index = 0; index < this.options.length; ++index) {
            const element = this.options[index];
            this.list.append(element.toString());
        }
    }

    show()
    {
        this.opener.css("display", "");
    }

    hide()
    {
        this.opener.css("display", "none");
    }

    click()
    {
        this.opener[0].click();
    }
}