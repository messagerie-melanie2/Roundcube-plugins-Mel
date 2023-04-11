/*********************************************************
 * Module toolbar
 **********************************************************/
export {ToolbarIcon, MaterialToolbarIcon, ToolbarItem, Toolbar, HideOrShowToolbar}
import { Point, Rectangle } from "./mel_maths";
import { MelConditionnalEvent } from "./mel_events";

class ToolbarIcon {
    constructor(icon) {
        this._init()._setup(icon);
    }

    _init() {
        this.icon = EMPTY_STRING;
        return this;
    }

    _setup(icon) {
        this.icon = icon;
        return this;
    }

    load() {
        return new mel_html('span', {class:this.icon});
    }
}

class MaterialToolbarIcon extends ToolbarIcon {
    constructor(icon) {
        super(icon);
    }

    load() {
        let parent = super.load();
        parent.attribs['class'] = 'material-symbols-outlined';
        parent.content = this.icon;
        return parent;
    }
}

class ToolbarItem {
    constructor({
        action = () => {},
        icon = new ToolbarIcon(EMPTY_STRING),
        text = EMPTY_STRING,
        extraActions = [],
        isActive = false,
        changeStateOnClick = true,
        $parent = $(), 
        order = 0,
    }) {
        this._init()._setup(action, icon, text, extraActions, isActive, changeStateOnClick, $parent, order);
    }

    _init() {
        this.action = new MelEvent();
        /**
         * @type {ToolbarIcon}
         */
        this.icon = new ToolbarIcon(EMPTY_STRING);
        this.text = EMPTY_STRING;
        this.extraActions = new MelConditionnalEvent();
        this.isActive = false;
        this.changeStateOnClick = true;
        this.$parent = $();
        this.$item = $();
        this.order = 0;
        return this;
    }

    _setup(...args) {
        const [action, icon, text, extraActions, isActive, changeStateOnClick, $parent, order] = args;

        this.action.push(action);
        this.icon = icon;
        this.text = text;
        this.isActive = isActive;
        this.changeStateOnClick = changeStateOnClick;
        this.$parent = $parent;
        
        if (extraActions.length > 0) {
            for (let index = 0, len = extraActions.length; index < len; ++index) {
                const extraAction = extraActions[index];
                
                this.extraActions.push(extraAction);
            }
        }

        return this._build().updateOrder(order);
    }

    _updateEvent(event) {
        if (!event.toolbarItemDatas) event.toolbarItemDatas = {};
        return event;
    }

    _toggleState() {
        if (this.$item.hasClass('active')) this.$item.removeClass('active');
        else this.$item.addClass('active')

        return this;
    }

    _build() {
        let icon = this.icon.load();
        let text = new mel_html('span', {class:'text-material'}, this.text);
        let html = new mel_html2('button', {
            attribs:{
                class:mel_button.html_base_class_full
            },
            contents:[icon, text]
        });

        html.onclick.push((event) => {
            this.startAction(event);
        });

        icon.addClass('mel-toolbar-icon');

        this.$item = html.create(this.$parent);

        this.extraActions.call((key, datas) => datas === 'build', this, html);

        return this;
    }

    click(event) {
        this.action.call(event, this);
        this.extraActions.call((key, datas) => datas === 'action', event, this);
        return this;
    }

    toggle(event) {
        event = this._updateEvent(event);
        event.toolbarItemDatas.lastState = this.$item.hasClass('active');

        return this._toggleState().click(event);
    }

    startAction(event) {
        if (this.changeStateOnClick) this.toggle(event);
        else this.click(event);

        return this;
    }

    updateOrder(newOrder) {
        this.order = newOrder;
        this.$item.data('toolbarorder', this.order);
        return this;
    }

    setParent($parent) {
        this.$parent = $parent;
        this.$item.appendTo(this.$parent);
        return this;
    }
}

class ShapeToolbarItem extends ToolbarItem {
    constructor({
        action = () => {},
        icon = new ToolbarIcon(EMPTY_STRING),
        text = EMPTY_STRING,
        extraActions = [],
        isActive = false,
        changeStateOnClick = true,
        $parent = $(), 
        order = 0,
        pos = Point.Zero(),
        width = '100%',
        height = '5px'
    }) {
        super({action, icon, text, extraActions, isActive, changeStateOnClick, $parent, order});
        this._setupChild(pos, width, height);
    }

    _init() {
        super._init();
        this.shape = new Rectangle(Point.Zero(), 0, 0);
        return this;
    }

    _setupChild(...args) {
        const [pos, width, height] = args;

        this.shape.onrefresh.push((shape) => {
            this._refresh(shape)
        });

        this.shape.updatePosition(pos);
        this.shape.width = width;
        this.shape.height = height;

        this.$item.css('position', 'absolute');

        return this;
    }

    _refresh(shape) {
        this.$item.css('width', shape.width)
                  .css('height', shape.height)
                  .css('bottom', shape.y)
                  .css('left', shape.y);
        return this;
    }
}

class Toolbar {
    constructor({
        $parent = 'body',
        pos = Point.Zero(),
        width = '100%',
        height = '100%',
        yStartAtBottom = true,
        id = EMPTY_STRING,
        color = EMPTY_STRING
    }) {
        this._init()._setup($parent, pos, width, height, yStartAtBottom, id, color);
    }

    _init() {
        this.$parent = EMPTY_STRING;
        this.shape = new Rectangle(Point.Zero(), 0, 0);
        this.$toolbar = $();
        this.items = {};
        this.yStartAtBottom = true;
        this._id = EMPTY_STRING;
        return this;
    }

    _setup(...args) {
        const [$parent, pos, width, height, yStartAtBottom, id, color] = args;

        this.$parent = $parent;
        this.shape.updatePosition(pos);
        this.shape.width = width;
        this.shape.height = height;
        this.shape.onrefresh.push((shape) => {
            this._refresh(shape);
        });
        this.yStartAtBottom = yStartAtBottom;
        this._id = id;

        return this._build().refresh().setCustomColor({background:color});
    }

    _build() {
        const CLASSES_TOOLBAR = 'mel-toolbar';
        let buttons = new mel_html('div', {class:'toolbar-buttons'});
        let html = new mel_html2('nav', {
            attribs:{
                class:CLASSES_TOOLBAR
            },
            contents:[buttons]
        });

        if (!!this._id && EMPTY_STRING !== this._id) html.attribs['id'] = this._id;

        this.$toolbar = html.create(this.$parent);

        return this;
    }

    _refreshIcons() {
        if (this.count() > 0)
        {
            let $buttons = this.$toolbar.find('.toolbar-buttons').html('');

            for (const iterator of this) {
                this.items[iterator.key].$parent = $buttons;
                this.items[iterator.key].$item.appendTo(this.items[iterator.key].$parent);
                this._createSeparator($buttons);
            }

            this.$toolbar.find('.v-separate').last().remove();
        }

        return this;
    }

    _createSeparator($parent) {
        return new mel_html('div', {class:'v-separate'}).create($parent);
    }

    _refresh(shape) {
        this.$toolbar.css('width', shape.width)
                    .css('height', shape.height)
                    .css((this.yStartAtBottom ? 'bottom' : 'top'), `${shape.y}px`)
                    .css('left', `${shape.x}px`);
    }

    refresh() {
        this.shape.refresh();
        this._refreshIcons();
        return this;
    }

    count() {
        return Object.keys(this.items).length;
    }

    addItem(key, toolbarItem, {refresh = false, updateOrder = false}) {
        this.items[key] = toolbarItem;

        if (updateOrder) this.items[key].updateOrder(this.count() + 1);

        if (refresh) this.refresh();
        else {
            this.items[key].$parent = this.$toolbar.find('.toolbar-buttons');
            this.items[key].$item.appendTo(this.items[key].$parent);
        }

        return this;
    }

    removeItem(key, {refresh = false, updateOrder = true}) {
        this.items[key].$item.remove();
        delete this.items[key];

        if (updateOrder) {
            let it = 0;
            for (const iterator of Enumerable.from(this.items).orderBy(x => x.value.order)) {
                this.items[iterator.key].order = it++;
            }
        }

        if (refresh) this.refresh();
    }

    updateWidth(newWidth) {
        this.shape.width = newWidth;
        this.shape.refresh();

        return this;
    }

    updateHeight(newHeight) {
        this.shape.height = newHeight;
        this.shape.refresh();

        return this;
    }

    updatePos(newPos) {
        this.shape.updatePosition(newPos);

        return this;
    }

    updateYStart({isBottom}) {
        this.yStartAtBottom = isBottom;
        this.shape.refresh();

        return this;
    }

    setCustomColor({background = EMPTY_STRING, text = EMPTY_STRING}) {
        this.$toolbar.css('background-color', background).css('color', text).css('--secondary-text-color', text);
        this.shape.refresh();
        return this;
    }

    removeCustomColor() {
        return this.setCustomColor();
    }

    *[Symbol.iterator]() {
        yield * Enumerable.from(this.items).orderBy(x => x.value.order);
    }
}

Object.defineProperties(Toolbar.prototype, {
    width: {
        get: function() {
            return this.$toolbar.with();
        },
        configurable: true
    },
    height: {
        get: function() {
            return this.$toolbar.height();
        },
        configurable: true
    }
});

class HideOrShowToolbar extends Toolbar {
    constructor({
        $parent = 'body',
        pos = Point.Zero(),
        width = '100%',
        height = '60px',
        yStartAtBottom = true,
        id = EMPTY_STRING,
        color = EMPTY_STRING,
        hideOrShowButtonHeight = '5px'
    }) {
        super({$parent, pos, width, height, yStartAtBottom, id, color});
        this._childSetup(hideOrShowButtonHeight);
    }

    _init() {
        super._init();
        this.onshow = new MelEvent();
        this.onhide = new MelEvent();
        this.hideOrShowButton = null;
        return this;
    }

    _childSetup(...args) {
        const [hideOrShowButtonHeight] = args;

        this.hideOrShowButton = new ShapeToolbarItem({
            icon:new MaterialToolbarIcon('arrow_drop_down')
        });
        this.hideOrShowButton.shape.updatePosition(new Point(0, this.height));
        this.hideOrShowButton.shape.height = hideOrShowButtonHeight;
        this.hideOrShowButton.setParent(this.$toolbar);
        this.hideOrShowButton.action.push((event) => {
            this._action(event);
        });

        return this.refresh();
    }

    _refresh(shape) {
        super._refresh(shape);
        this.hideOrShowButton?.shape?.updatePosition?.(new Point(0, shape.height));
        
        if (!!this.hideOrShowButton?.shape) this.hideOrShowButton.shape.width = shape.width;
    }

    _action(event) {
        const active = event.lastState;

        if (active) {
            this.updatePos(new Point(this.shape.x, this.shape.y - this.height));
            this.hideOrShowButton.icon = new MaterialToolbarIcon('arrow_drop_up');
            this.hideOrShowButton.$item.find('.mel-toolbar-icon').remove()
            this.hideOrShowButton.icon.load().create(this.hideOrShowButton.$item);
        }
        else {
            this.updatePos(new Point(this.shape.x, this.shape.y + this.height));
            this.hideOrShowButton.icon = new MaterialToolbarIcon('arrow_drop_down');
            this.hideOrShowButton.$item.find('.mel-toolbar-icon').remove()
            this.hideOrShowButton.icon.load().create(this.hideOrShowButton.$item);
        }
    }
}