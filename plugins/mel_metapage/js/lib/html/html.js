export class html_li extends mel_html2 {
    constructor({attribs={}, contents=[]}) {
        super('li', {attribs, contents});
    }
}

export class html_ul extends mel_html2 {
    constructor({attribs={}, contents=[]}) {
        super('ul', {attribs, contents});
    }

    li({attribs={}, contents=[]}) {
        const li = new html_li({attribs, contents});
        this.addContent(li);
        return li;
    }
}