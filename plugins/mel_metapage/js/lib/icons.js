export {BaseIcon as Icon, MaterialIcon}
class BaseIcon {
    constructor(icon_class, $item) {
        this._icon = icon_class;
        this._$item = $item;
        this._update();
    }

    _update() {
        this._$item?.addClass?.(this._icon);
        return this;
    }

    update_icon(new_icon) {
        this._$item.removeClass(this._icon).addClass(new_icon);
        return this;
    }

    get() {
        return new mel_html('span', {class:this._icon});
    }
}

const MATERIAL_ICON_CLASS = 'material-symbols-outlined';
class MaterialIcon extends BaseIcon {
    constructor(name, $item) {
        super(MATERIAL_ICON_CLASS, $item);
        this._name = name;
        this._update();
    }

    _update() {
        super._update();
        this._$item?.html?.(this._name);
        return this;
    }

    update_icon(new_name) {
        this._name = new_name;
        return this._update();
    }

    get() {
        let get = super.get();
        get.content = this._name;
        return get;
    }
}
